import { readFileSync, writeFileSync } from 'fs';

const file = readFileSync(process.argv[2]).toString();
const replaced = file.replace(/require\(\"encoding\"\)/, '"[REMOVED]"');
writeFileSync(process.argv[2], replaced);
