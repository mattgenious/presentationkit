#!/usr/bin/env node
import path from 'node:path';
import { buildDeck } from './deck.js';
import { renderDiagrams } from './diagrams.js';
import { loadManifest } from './manifest.js';
import { writeRenderManifest } from './render-manifest.js';
import { exportSvgToPng } from './svg-to-png.js';
import { validateManifest } from './validate.js';

function usage() {
  console.log(`presentationkit

Usage:
  presentationkit validate <deck.json>
  presentationkit render-diagrams <deck.json> [--out dist/diagrams]
  presentationkit build <deck.json> [--out dist/deck.pptx] [--diagrams dist/diagrams] [--manifest-out dist/render-manifest.json] [--deterministic]
  presentationkit export-svg <input.svg> <output.png> [--scale 2]
`);
}

function readFlag(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}

function hasFlag(args, name) {
  return args.includes(name);
}

function samePath(a, b) {
  const resolvedA = path.resolve(a);
  const resolvedB = path.resolve(b);
  if (process.platform === 'win32') return resolvedA.toLowerCase() === resolvedB.toLowerCase();
  return resolvedA === resolvedB;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h') {
    usage();
    return;
  }

  if (command === 'validate') {
    const file = args[0];
    if (!file) throw new Error('validate requires a deck manifest path.');
    const { manifest } = await loadManifest(file);
    const result = validateManifest(manifest);
    for (const warning of result.warnings) console.warn(`warning: ${warning}`);
    if (!result.ok) throw new Error(result.errors.join('\n'));
    console.log(`Valid deck manifest: ${file}`);
    return;
  }

  if (command === 'render-diagrams') {
    const file = args[0];
    if (!file) throw new Error('render-diagrams requires a deck manifest path.');
    const out = path.resolve(readFlag(args, '--out', 'dist/diagrams'));
    const { manifest } = await loadManifest(file);
    const written = await renderDiagrams(manifest, out);
    for (const diagram of written) console.log(diagram);
    return;
  }

  if (command === 'build') {
    const file = args[0];
    if (!file) throw new Error('build requires a deck manifest path.');
    const out = path.resolve(readFlag(args, '--out', 'dist/deck.pptx'));
    if (path.extname(out).toLowerCase() !== '.pptx') {
      throw new Error('--out must be a .pptx path so the render manifest can reference the exact generated deck artifact.');
    }
    const diagramDir = path.resolve(readFlag(args, '--diagrams', 'dist/diagrams'));
    const renderManifestPath = path.resolve(readFlag(args, '--manifest-out', path.join(path.dirname(out), 'render-manifest.json')));
    const deterministic = hasFlag(args, '--deterministic');
    const { manifest, file: manifestPath } = await loadManifest(file);
    if (samePath(renderManifestPath, out)) {
      throw new Error('--manifest-out must be different from --out so the render manifest cannot overwrite the generated deck.');
    }
    if (samePath(renderManifestPath, manifestPath)) {
      throw new Error('--manifest-out must be different from the input deck manifest so source content is not overwritten.');
    }
    const verification = validateManifest(manifest);
    for (const warning of verification.warnings) console.warn(`warning: ${warning}`);
    if (!verification.ok) throw new Error(verification.errors.join('\n'));
    const diagrams = await renderDiagrams(manifest, diagramDir);
    if (diagrams.some((diagram) => samePath(renderManifestPath, diagram))) {
      throw new Error('--manifest-out must be different from generated diagram paths so SVG artifacts are not overwritten.');
    }
    const deck = await buildDeck(manifest, { out, diagramDir });
    const renderManifest = await writeRenderManifest({
      out: renderManifestPath,
      manifestPath,
      diagramPaths: diagrams,
      deckPath: deck,
      verification,
      deterministic
    });
    console.log(deck);
    console.log(`Render manifest: ${renderManifest.path}`);
    return;
  }

  if (command === 'export-svg') {
    const input = args[0];
    const output = args[1];
    if (!input || !output) throw new Error('export-svg requires input.svg and output.png.');
    const scale = Number(readFlag(args, '--scale', '2'));
    const png = await exportSvgToPng(input, output, scale);
    console.log(png);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
