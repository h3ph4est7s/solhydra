/* eslint-disable no-param-reassign, no-else-return */
const assert = require('assert');
const fs = require('fs');

const srcFile = assert(process.argv[2], 'missing first arg: srcFile') || process.argv[2];
const destFile = assert(process.argv[3], 'missing second arg: destFile') || process.argv[3];

const content = fs.readFileSync(srcFile, 'utf8');

const writeOutputFile = data => fs.writeFileSync(destFile, data);

const newContent = [];

const lines = content.split('\n');

const MAX_CODE_BLOCK_LINES = 5;

//
// this script exists to filter out really long code blocks that mythril sometimes
// outputs, an entire smart contract, we don't want that, so we filter out code blocks
// that are longer than 5 lines
//

for (let i = 0; i < lines.length;) {
  const line = lines[i];

  if (!line) {
    // empty line
    newContent.push('');
    i += 1;
    continue; // eslint-disable-line no-continue
  }

  if (/```/.test(line)) {
    // this line is the start of code

    // check how many lines code block is
    const linesTillCodeEnd = lines.slice(i + 1).findIndex(l => /```/.test(l));

    if (linesTillCodeEnd < MAX_CODE_BLOCK_LINES) {
      // code block is NOT too long, just add it
      for (let j = 0; j < (linesTillCodeEnd + 2); j += 1) {
        newContent.push(lines[i + j]);
      }

      // now update i to skip over the too long code block
      i += linesTillCodeEnd + 2;
    } else {
      // code block is too long, skip it
      i += linesTillCodeEnd + 2;
    }
  } else {
    // this is a normal text line, just add it
    newContent.push(line);
    i += 1;
  }
}

writeOutputFile(newContent.join('\n'));
