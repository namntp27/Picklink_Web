import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';

const projectRoot = process.cwd();
const roots = ['src', 'tests'];
const textFilePattern = /\.(css|js|jsx|json|md|ts|tsx)$/;
const mojibakePattern = new RegExp(
  '[\\u00c3\\u00c2\\u00c4\\u00c6][\\u0080-\\u00bf]|\\u00e1\\u00ba|\\u00e1\\u00bb|\\u00e2[\\u20ac\\u201e]',
);
const tokenPattern = /[^\t\r\n "'`<>{}()[\],;]+/gu;

const cp1252SpecialBytes = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const decoder = new TextDecoder('utf-8', { fatal: false });

const collectTextFiles = (directory) => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTextFiles(fullPath);
    return textFilePattern.test(entry.name) ? [fullPath] : [];
  });

const toCp1252Bytes = (text) => {
  const bytes = [];

  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    const specialByte = cp1252SpecialBytes.get(codePoint);
    if (specialByte === undefined) return null;
    bytes.push(specialByte);
  }

  return Uint8Array.from(bytes);
};

const decodeOnce = (token) => {
  const bytes = toCp1252Bytes(token);
  if (!bytes) return token;

  const decoded = decoder.decode(bytes);
  return decoded.includes('\ufffd') ? token : decoded;
};

const repairToken = (token) => {
  let repaired = token;

  for (let attempt = 0; attempt < 4 && mojibakePattern.test(repaired); attempt += 1) {
    const decoded = decodeOnce(repaired);
    if (decoded === repaired) break;
    repaired = decoded;
  }

  return repaired;
};

const repairTextOnce = (text) => text.replace(tokenPattern, (token) => (
  mojibakePattern.test(token) ? repairToken(token) : token
));

const repairText = (text) => {
  let repaired = text;

  for (let attempt = 0; attempt < 6 && mojibakePattern.test(repaired); attempt += 1) {
    const next = repairTextOnce(repaired);
    if (next === repaired) break;
    repaired = next;
  }

  return repaired;
};

let changedCount = 0;

for (const root of roots) {
  for (const filePath of collectTextFiles(path.join(projectRoot, root))) {
    const source = readFileSync(filePath, 'utf8');
    if (!mojibakePattern.test(source)) continue;

    const repaired = repairText(source);
    if (repaired === source) continue;

    writeFileSync(filePath, repaired, 'utf8');
    changedCount += 1;
    console.log(path.relative(projectRoot, filePath).replaceAll(path.sep, '/'));
  }
}

console.log(`Repaired ${changedCount} file(s).`);
