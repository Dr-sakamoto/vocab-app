const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'lib', 'vocab.js');
const content = fs.readFileSync(file, 'utf8');
const output = content.replace(/^\s*sentence:\s*".*",\r?\n/gm, '');
fs.writeFileSync(file, output, 'utf8');
console.log('stripped sentence fields');
