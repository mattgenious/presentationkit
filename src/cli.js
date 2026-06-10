#!/usr/bin/env node
import path from 'node:path';
import { buildDeck } from './deck.js';
import { renderDiagrams } from './diagrams.js';
import { loadManifest } from './manifest.js';
import { writePlanArtifacts } from './plan.js';
import { exportSvgToPng } from './svg-to-png.js';
import { validateManifest } from './validate.js';

function usage() {
  console.log(`presentationkit

Usage:
  presentationkit validate <deck.json>
  presentationkit plan <deck.json> [--out dist/plan] [--diagrams dist/diagrams] [--deck-out dist/deck.pptx]
  presentationkit render-diagrams <deck.json> [--out dist/diagrams]
  presentationkit build <deck.json> [--out dist/deck.pptx] [--diagrams dist/diagrams] [--plan-out dist/plan]
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

  if (command === 'plan') {
    const file = args[0];
    if (!file) throw new Error('plan requires a deck manifest path.');
    const outDir = path.resolve(readFlag(args, '--out', 'dist/plan'));
    const diagramDir = path.resolve(readFlag(args, '--diagrams', 'dist/diagrams'));
    const deckOut = path.resolve(readFlag(args, '--deck-out', 'dist/deck.pptx'));
    const { manifest } = await loadManifest(file);
    const plan = await writePlanArtifacts(manifest, {
      manifestFile: file,
      outDir,
      diagramDir,
      deckOut
    });
    console.log(plan.outputPaths.renderPlanJson);
    console.log(plan.outputPaths.storyboardMarkdown);
    return;
  }

  if (command === 'build') {
    const file = args[0];
    if (!file) throw new Error('build requires a deck manifest path.');
    const out = path.resolve(readFlag(args, '--out', 'dist/deck.pptx'));
    const diagramDir = path.resolve(readFlag(args, '--diagrams', 'dist/diagrams'));
    const { manifest } = await loadManifest(file);
    const planOut = readFlag(args, '--plan-out', undefined);
    if (planOut) {
      await writePlanArtifacts(manifest, {
        manifestFile: file,
        outDir: path.resolve(planOut),
        diagramDir,
        deckOut: out
      });
    }
    await renderDiagrams(manifest, diagramDir);
    const deck = await buildDeck(manifest, { out, diagramDir });
    console.log(deck);
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
