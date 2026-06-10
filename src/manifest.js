import fs from 'node:fs/promises';
import path from 'node:path';

function findDuplicateJsonKeys(raw) {
  const duplicates = [];
  let index = 0;

  function skipWhitespace() {
    while (/\s/.test(raw[index] ?? '')) index += 1;
  }

  function parseString() {
    let value = '';
    index += 1; // opening quote
    while (index < raw.length) {
      const char = raw[index];
      if (char === '"') {
        index += 1;
        return value;
      }
      if (char === '\\') {
        value += char;
        index += 1;
        if (index < raw.length) {
          value += raw[index];
          index += 1;
        }
        continue;
      }
      value += char;
      index += 1;
    }
    return value;
  }

  function parsePrimitive() {
    while (index < raw.length && !/[,\]}]/.test(raw[index])) index += 1;
  }

  function childPath(parent, key) {
    return parent ? `${parent}.${key}` : key;
  }

  function parseValue(currentPath) {
    skipWhitespace();
    const char = raw[index];
    if (char === '{') return parseObject(currentPath);
    if (char === '[') return parseArray(currentPath);
    if (char === '"') return parseString();
    return parsePrimitive();
  }

  function parseObject(currentPath) {
    const keys = new Set();
    index += 1; // opening brace
    skipWhitespace();
    if (raw[index] === '}') {
      index += 1;
      return;
    }

    while (index < raw.length) {
      skipWhitespace();
      const key = parseString();
      const keyPath = childPath(currentPath, key);
      if (keys.has(key)) duplicates.push(keyPath);
      keys.add(key);

      skipWhitespace();
      index += 1; // colon
      parseValue(keyPath);
      skipWhitespace();

      if (raw[index] === ',') {
        index += 1;
        continue;
      }
      if (raw[index] === '}') {
        index += 1;
        return;
      }
    }
  }

  function parseArray(currentPath) {
    let itemIndex = 0;
    index += 1; // opening bracket
    skipWhitespace();
    if (raw[index] === ']') {
      index += 1;
      return;
    }

    while (index < raw.length) {
      parseValue(`${currentPath}[${itemIndex}]`);
      itemIndex += 1;
      skipWhitespace();

      if (raw[index] === ',') {
        index += 1;
        continue;
      }
      if (raw[index] === ']') {
        index += 1;
        return;
      }
    }
  }

  parseValue('');
  return duplicates;
}

export async function loadManifest(file) {
  const resolved = path.resolve(file);
  const raw = await fs.readFile(resolved, 'utf8');
  const manifest = JSON.parse(raw);
  const duplicateKeys = findDuplicateJsonKeys(raw);
  if (duplicateKeys.length > 0) {
    throw new Error(`Deck manifest contains duplicate JSON keys: ${duplicateKeys.join(', ')}.`);
  }
  return {
    manifest,
    file: resolved,
    root: path.dirname(resolved)
  };
}

export function diagramFile(outDir, key) {
  return path.join(outDir, `${key}.svg`);
}

export function resolveMaybeRelative(root, value) {
  if (!value) return undefined;
  return path.isAbsolute(value) ? value : path.resolve(root, value);
}
