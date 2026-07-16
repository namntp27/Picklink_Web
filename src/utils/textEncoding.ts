const mojibakePattern = /[\u00c3\u00c2\u00c4\u00c6][\u0080-\u00bf]|\u00e1\u00ba|\u00e1\u00bb|\u00e2[\u20ac\u201e]/;
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

const toCp1252Bytes = (text: string) => {
  const bytes: number[] = [];

  for (const char of text) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) continue;
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

const decodeOnce = (text: string) => {
  const bytes = toCp1252Bytes(text);
  if (!bytes) return text;

  const decoded = decoder.decode(bytes);
  return decoded.includes('\ufffd') ? text : decoded;
};

const repairToken = (token: string) => {
  let repaired = token;

  for (let attempt = 0; attempt < 4 && mojibakePattern.test(repaired); attempt += 1) {
    const decoded = decodeOnce(repaired);
    if (decoded === repaired) break;
    repaired = decoded;
  }

  return repaired;
};

export const repairMojibake = (value?: string | null) => {
  if (!value) return '';

  let repaired = value;
  for (let attempt = 0; attempt < 6 && mojibakePattern.test(repaired); attempt += 1) {
    const next = repaired.replace(tokenPattern, (token) => (
      mojibakePattern.test(token) ? repairToken(token) : token
    ));
    if (next === repaired) break;
    repaired = next;
  }

  return repaired;
};
