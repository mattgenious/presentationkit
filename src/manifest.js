import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Load a deck manifest from disk and return the parsed manifest plus path context.
 *
 * @param {string} file
 * @returns {Promise<import('./types.js').LoadedManifest>}
 */
export async function loadManifest(file) {
  const resolved = path.resolve(file);
  const raw = await fs.readFile(resolved, 'utf8');
  const manifest = JSON.parse(raw);
  return {
    manifest: /** @type {import('./types.js').DeckManifest} */ (manifest),
    file: resolved,
    root: path.dirname(resolved)
  };
}

/**
 * @param {string} outDir
 * @param {string} key
 * @returns {string}
 */
export function diagramFile(outDir, key) {
  return path.join(outDir, `${key}.svg`);
}

/**
 * @param {string} root
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
export function resolveMaybeRelative(root, value) {
  if (!value) return undefined;
  return path.isAbsolute(value) ? value : path.resolve(root, value);
}
