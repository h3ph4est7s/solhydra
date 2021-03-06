#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const yargs = require('yargs');
const untildify = require('untildify');
const copyDir = require('copy-dir');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const pug = require('pug');
const showdown = require('showdown');

const flatten = require('soljitsu/lib/flatten');
const combine = require('soljitsu/lib/combine');

const markdownConverter = new showdown.Converter();

const DOCKER_COMPOSE_PATH = path.join(__dirname, '..', 'docker-compose.yml');
const WORKSPACE_DIR_PATH = path.join(__dirname, '..', 'workspace');
const INPUT_DIR_PATH = path.join(WORKSPACE_DIR_PATH, 'input');
const OUTPUT_DIR_PATH = path.join(WORKSPACE_DIR_PATH, 'output');
const PUG_TEMPLATE_PATH = path.join(__dirname, 'report.pug');

/** different tool outputs output different file types */
const toolOutputFileTypeMap = {
  mythril: 'markdown',
  oyente: 'text',
  solgraph: 'image',
  solhint: 'text',
  'solidity-coverage': 'html',
  'solidity-analyzer': 'text',
  solium: 'text',
  // maian: 'text', // disabled for now, see docker-compose.yml
  // echidna: 'text', // disabled for now, see docker-compose.yml
};

/** all currently enabled tools */
const AVAILABLE_TOOLS = [
  'mythril',
  'oyente',
  'solhint',
  'solidity-coverage',
  'solidity-analyzer',
  'solgraph',
  'solium',
  // 'maian', // disabled for now, see docker-compose.yml
  // 'echidna', // disabled for now, see docker-compose.yml
];

// eslint-disable-next-line valid-jsdoc
/**
 * prints out help
 */
const printHelp = () => console.log(`NAME
  solhydra        cli tool to run solidity smart contract(s) through several analysis
                  tools and generating a html report

SYNOPSIS
  solhydra --contract-dir=dirPath --dest-dir=dirPath [--dep-dir=dirPath] [tool1, tool2, ..]
  solhydra --truffle=dirPath --dest-dir=dirPath [tool1, tool2, ..]

TOOLS
  mythril, oyente, solhint, solidity-coverage, solidity-analyzer, solgraph, solium

REQUIRED ARGUMENTS
  --contract-dir  path of contracts directory (only when not specifying --truffle)
  --truffle       path of truffle project (only when not specifying --contract-dir)
  --dest-dir      path of the directory to write the result HTML report to,
                  will be named solhydra_report.html

OPTIONAL ARGUMENTS
  --dep-dir      path of directory with dependencies (node_modules),
                 only used with --contract-dir
  tool           you can optionally specify a subset of tools to run, if you don't
                 specify any tools, all tools will be executed

NOTES
  solidity-coverage only works on truffle projects, so only when using --truffle,
  it will be skipped automatically for non-truffle runs

EXAMPLES
  solhydra --contract-dir=./contracts --dep-dir=./node_modules --dest-dir=./out
  solhydra --contract-dir=./contracts --dep-dir=./node_modules --dest-dir=./out mythril oyente
  solhydra --truffle=./mytruffleproject --dest-dir=./out
  solhydra --truffle=./mytruffleproject --dest-dir=./out solidity-coverage solium
`);

/**
 * given an input path return an absolute path
 *
 * @param {string} inputPath - the input path
 * @return {string} the input path converted to an absolute path
 */
const getAbsolutePath = (inputPath) => {
  inputPath = untildify(inputPath); // eslint-disable-line no-param-reassign
  // use path.resolve to remove the ending slash if it's a directory, needed
  // for comparing srcDir with destDir
  return path.resolve(path.isAbsolute(inputPath)
    ? inputPath
    : path.join(process.cwd(), inputPath));
};

/**
 * parses the cli args
 *
 * @return {object} object with parsed cli args (and paths converted to absolute)
 */
const parseArgs = () => {
  const { argv } = yargs;

  // contract dir is required
  if ((!argv.contractDir && !argv.truffle) || (argv.contractDir && argv.truffle)) { // eslint-disable-line no-mixed-operators, max-len
    console.log('\nmissing one(!) of: --contract-dir --truffle\n');
    printHelp();
    process.exit(1);
  }

  // destination dir is required
  if (!argv.destDir) {
    console.log('\nmissing required arg --dest-dir\n');
    printHelp();
    process.exit(1);
  }

  // check for all tools we want to run
  if (argv._.length) {
    argv._.forEach((toolArg) => {
      if (!AVAILABLE_TOOLS.includes(toolArg)) {
        console.log(`\n'${toolArg}' is not a valid tool, valid tools are: ${AVAILABLE_TOOLS.join(', ')}\n`);
        printHelp();
        process.exit(1);
      }
    });
  }

  return argv.truffle
    // solidity-coverage only works on a truffle project, if --truffle option
    ? {
      // required
      destPath: getAbsolutePath(argv.destDir),
      contractPath: getAbsolutePath(path.join(argv.truffle, 'contracts')),

      // optional
      tools: argv._, // if no tools, all tools will be executed
      specPath: getAbsolutePath(path.join(argv.truffle, 'test')),
      depPath: getAbsolutePath(path.join(argv.truffle, 'node_modules')),
      migrationPath: getAbsolutePath(path.join(argv.truffle, 'migrations')),
      packageJsonPath: getAbsolutePath(path.join(argv.truffle, 'package.json')),
    }
    : {
      // required
      destPath: getAbsolutePath(argv.destDir),
      contractPath: getAbsolutePath(argv.contractDir),

      // optional
      tools: argv._, // if no tools, all tools will be executed

      depPath: argv.depDir && getAbsolutePath(argv.depDir),
    };
};

/**
 * adds the contract directory found at contractPath to workspace/input/
 *
 * @param {string} contractPath - path where contracts are located in host
 */
const addOriginalContracts = (contractPath) => {
  const workspaceContractDir = path.join(INPUT_DIR_PATH, 'contracts');

  mkdirp.sync(workspaceContractDir);

  copyDir.sync(contractPath, workspaceContractDir);
};

/**
 * solhydra flatten contracts found at contractPath, writing the results to
 * workspace/input/contracts_flatten
 *
 * @param {string} contractPath - path where contracts are located in host
 * @param {string} depPath - path where dependencies (node_modules) are located in host
 */
const addFlattenContracts = (contractPath, depPath) => {
  const workspaceContractFlattenPath = path.join(INPUT_DIR_PATH, 'contracts_flatten');

  mkdirp.sync(workspaceContractFlattenPath);

  flatten({
    srcDir: contractPath,
    destDir: workspaceContractFlattenPath,
    depDir: depPath, // might be undefined
  });
};

/**
 * solhydra combine contracts found at contractPath, writing the results to
 * workspace/input/contracts_combine
 *
 * @param {string} contractPath - path where contracts are located in host
 * @param {string} depPath - path where dependencies (node_modules) are located in host
 */
const addCombineContracts = (contractPath, depPath) => {
  const workspaceContractCombinePath = path.join(INPUT_DIR_PATH, 'contracts_combine');

  mkdirp.sync(workspaceContractCombinePath);

  combine({
    srcDir: contractPath,
    destDir: workspaceContractCombinePath,
    depDir: depPath, // might be undefined
  });
};

/**
 * adds the package.json (and package-lock.json if it exists) found at packageJsonPath
 * to workspace/input/
 *
 * @param {string} packageJsonPath - path where package.json file is located in host
 */
const addPackageJson = (packageJsonPath) => {
  const packageJson = fs.readFileSync(packageJsonPath, 'utf8');

  // check for possible package-lock.json file
  try {
    fs.writeFileSync(
      path.join(INPUT_DIR_PATH, 'package-lock.json'),
      fs.readFileSync(packageJsonPath.replace('.js', '-lock.js'), 'utf8'), // <-- will error if doesnt exist
    );
  } catch (err) {
    // package-lock.json does not exist, do nothing
  }

  fs.writeFileSync(path.join(INPUT_DIR_PATH, 'package.json'), packageJson);
};

/**
 * adds the specs directory found at specPath to workspace/input/
 *
 * @param {string} specPath - path where specs are located in host
 */
const addSpecs = (specPath) => {
  const workspaceSpecPath = path.join(INPUT_DIR_PATH, 'specs');

  mkdirp.sync(workspaceSpecPath);

  copyDir.sync(specPath, workspaceSpecPath);
};

/**
 * adds the migration directory found at migrationPath to workspace/input/
 *
 * @param {string} migrationPath - path where migrations are located in host
 */
const addMigrations = (migrationPath) => {
  const workspaceMigrationPath = path.join(INPUT_DIR_PATH, 'migrations');

  mkdirp.sync(workspaceMigrationPath);

  copyDir.sync(migrationPath, workspaceMigrationPath);
};

/**
 * - copies the supplied files/directories into the workspace input directory
 * - creates flatten + combine versions of the contracts
 * - creates an info.json file
 *
 * @param {object} args - object with cli args
 */
const setupWorkspace = (args) => {
  mkdirp.sync(INPUT_DIR_PATH);
  addOriginalContracts(args.contractPath);
  addFlattenContracts(args.contractPath, args.depPath);
  addCombineContracts(args.contractPath, args.depPath);
  if (args.packageJsonPath) addPackageJson(args.packageJsonPath);
  if (args.specPath) addSpecs(args.specPath);
  if (args.migrationPath) addMigrations(args.migrationPath);
};

/**
 * execute all or a specific list of tools on the files in the workspace
 *
 * @param {string[]} [tools=[]] - possible list of tools to execute
 * @return {Promise.<Null, Error>} promise resolved on success or rejected with error
 */
const executeTasks = (tools = []) => new Promise((resolve, reject) => {
  try {
    const child = spawn(
      'docker-compose',
      // TODO: remove --build. only needed when developing
      ['-f', DOCKER_COMPOSE_PATH, 'up', '--build', ...tools],
      { stdio: 'inherit' }, // to output stdout into this (parent) process
    );

    child.on('close', code => (
      code === 0 ? resolve() : reject(new Error(`exited with error code: ${code}`))
    ));
  } catch (err) {
    reject(err);
  }
});

/**
 * gathers the names of the contracts that were analyzed
 *
 * NOTE: use solhydra flatten files, since we than also get (nested) node_modules dependencies
 *
 * @return {string[]} list of contract names
 */
const getContractNames = () => (
  fs.readdirSync(path.join(INPUT_DIR_PATH, 'contracts_flatten'))
    .filter(filename => filename !== 'Migrations.sol')
);

/**
 * creates list objects where each object contains info about 1 contract file
 *
 * @param {string[]} contractNames - list of contract names
 * @return {object[]} list of file info objects
 */
const generateFileOutputs = contractNames => (
  contractNames.reduce((memo, contractName) => ({
    ...memo,
    [contractName]: {
      slug: contractName.replace('.sol', '').replace(/\./g, '-').toLowerCase(),
      name: contractName,
      // node_module dependencies do not exist in the original contracts/ folder,
      // they come from node_modules/
      content: {
        flatten: fs.readFileSync(path.join(INPUT_DIR_PATH, 'contracts_flatten', contractName), 'utf8'),
        combine: fs.existsSync(path.join(INPUT_DIR_PATH, 'contracts_combine', contractName))
          ? fs.readFileSync(path.join(INPUT_DIR_PATH, 'contracts_combine', contractName), 'utf8')
          : undefined,
        original: fs.existsSync(path.join(INPUT_DIR_PATH, 'contracts', contractName))
          ? fs.readFileSync(path.join(INPUT_DIR_PATH, 'contracts', contractName), 'utf8')
          : undefined,
      },
    },
  }), {})
);

/**
 * gathers the names of each tool output
 *
 * @return {string[]} list of tool output names
 */
const getToolOutputNames = () => (
  fs.readdirSync(OUTPUT_DIR_PATH)
    // only if there are files in the tool output dir
    .filter(dirName => fs.readdirSync(path.join(OUTPUT_DIR_PATH, dirName)).length)
);

/**
 * creates object with per file per tool the output
 *
 * @param {string[]} contractNames - list of contract names
 * @param {string[]} toolOutputNames - list of tool output names
 * @return {object} object with per contract per tool the output
 */
const generateToolOutputs = (contractNames, toolOutputNames) => (
  contractNames
    .reduce((memo, contractName) => ({
      ...memo,
      [contractName]: toolOutputNames.reduce((memoToolOutput, toolOutputName) => ({
        ...memoToolOutput,
        [toolOutputName]: {
          type: toolOutputFileTypeMap[toolOutputName],
          content: toolOutputFileTypeMap[toolOutputName] === 'markdown'
            ? markdownConverter.makeHtml(fs.readFileSync(path.join(OUTPUT_DIR_PATH, toolOutputName, contractName), 'utf8'))
            : fs.readFileSync(path.join(OUTPUT_DIR_PATH, toolOutputName, contractName), 'utf8'),
        },
      }), {}),
    }), {})
);

/**
 * creates the data object to pass to pug
 *
 * @param {object[]} fileOutputs - list of objects with info per file
 * @param {object[]} toolOutputs - list of objects with per file per tool the output
 * @return {object[]} object with 2 properties: fileOutputs, toolOutputs
 */
const generateRenderObject = (fileOutputs, toolOutputs) => ({
  fileOutputs,
  toolOutputs,
});

/**
 * generates HTML report from contents of workspace/output/
 *
 * @param {string} destPath - path of the destination folder to write the htmk report to
 */
const generateReport = (destPath) => {
  const toolOutputNames = getToolOutputNames();
  const contractNames = getContractNames();

  mkdirp.sync(destPath);

  fs.writeFileSync(
    path.join(destPath, 'solhydra_report.html'),
    pug.renderFile(
      PUG_TEMPLATE_PATH,
      generateRenderObject(
        generateFileOutputs(contractNames),
        generateToolOutputs(contractNames, toolOutputNames),
      ),
    ),
  );
};

/**
 * will start execution of code in this file
 */
const start = async () => {
  try {
    rimraf.sync(WORKSPACE_DIR_PATH); // start clean
    const args = parseArgs();
    setupWorkspace(args);
    await executeTasks(args.tools);
    generateReport(args.destPath);
    // rimraf.sync(WORKSPACE_DIR_PATH);
    process.exit(0);
  } catch (err) {
    console.log('\n\n\nERROR\n\n', err, '\n\n');
    // rimraf.sync(WORKSPACE_DIR_PATH);
    process.exit(1);
  }
};

start();
