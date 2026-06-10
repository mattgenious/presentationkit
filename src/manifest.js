import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadManifest(file) {
  const resolved = path.resolve(file);
  const raw = await fs.readFile(resolved, 'utf8');
  const manifest = JSON.parse(raw);
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
