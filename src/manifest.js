import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadManifest(file) {
  const resolved = path.resolve(file);
  let raw;
  try {
    raw = await fs.readFile(resolved, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Deck manifest not found: ${resolved}`);
    }
    throw new Error(`Could not read deck manifest ${resolved}: ${error.message}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in deck manifest ${resolved}: ${error.message}`);
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
