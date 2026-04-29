import fs from 'fs';
import path from 'path';
const file = path.join(process.cwd(), 'lib', 'vocab.js');
const content = await fs.promises.readFile(file, 'utf8');
const module = await import('data:text/javascript;base64,' + Buffer.from(content).toString('base64'));
if (!module.QUESTIONS) throw new Error('QUESTIONS not found');
const questions = module.QUESTIONS.map(({ target, answers }) => ({ target, answers }));
const formatted = 'export const QUESTIONS = [\n' + questions.map((item) => {
  const obj = JSON.stringify(item, null, 2);
  return obj.replace(/^/gm, '  ');
}).join(',\n') + '\n];\n';
await fs.promises.writeFile(file, formatted, 'utf8');
console.log('rewrote', questions.length, 'questions');
