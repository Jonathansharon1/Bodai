import fs from 'fs';
import path from 'path';

const files = [
  'client/src/locales/en/translation.json',
  'client/src/locales/he/translation.json'
];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    JSON.parse(content);
    console.log(`${file}: Valid JSON`);
  } catch (err) {
    console.error(`${file}: Invalid JSON - ${err.message}`);
  }
});
