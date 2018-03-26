const assert = require('assert');
const fs = require('fs');

const srcFile = assert(process.argv[2], 'missing first arg: srcFile') || process.argv[2];
const destFile = assert(process.argv[3], 'missing second arg: destFile') || process.argv[3];

// we want to inline all assets!!!

const prettifyCssInline = `<style>${fs.readFileSync('/app/separate-repo/coverage/prettify.css')}</style>`;
const baseCssInline = `<style>${fs.readFileSync('/app/separate-repo/coverage/base.css')}</style>`;
const prettifyJsInline = `<script>${fs.readFileSync('/app/separate-repo/coverage/prettify.js')}</script>`;
const sorterJsInline = `<script>${fs.readFileSync('/app/separate-repo/coverage/sorter.js')}</script>`;

const newContent = fs.readFileSync(srcFile, 'utf8')
  .split('\n')
  .map(l => (
    l
      .replace('background-image: url(../sort-arrow-sprite.png);', '')
      .replace('<a href="../index.html">all files</a> / <a href="index.html">contracts/</a> ', '')
      .replace('<link rel="stylesheet" href="../prettify.css" />', prettifyCssInline)
      .replace('<link rel="stylesheet" href="../base.css" />', baseCssInline)
      .replace('<script src="../prettify.js"></script>', prettifyJsInline)
      .replace('<script src="../sorter.js"></script>', sorterJsInline)
  ))
  .join('\n');

fs.writeFileSync(destFile, newContent);
