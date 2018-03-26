// this file only exists because it seems to hard to prepend and remove newlines
// from a text file in linux

const fs = require('fs');

const filepath = process.argv[2];

const content = `data:image/png;base64,${fs.readFileSync(filepath, 'utf8').replace(/\n/g, '')}`;

fs.writeFileSync(filepath, content);
