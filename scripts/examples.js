#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = path.join(root, 'examples');
const cli = path.join(root, 'src', 'cli.js');

const command = process.argv[2] ?? 'validate';
const supported = new Set(['validate', 'render-diagrams', 'build']);

if (!supported.has(command)) {
  console.error(`Usage: node scripts/examples.js ${Array.from(supported).join('|')}`);
  process.exit(1);
}

const manifests = readdirSync(examplesDir)
  .filter((name) => name.endsWith('.deck.json'))
  .sort();

if (manifests.length === 0) {
  console.error('No example deck manifests found.');
  process.exit(1);
}

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const manifest of manifests) {
  const input = path.join('examples', manifest);
  const slug = manifest.replace(/\.deck\.json$/, '');

  if (command === 'validate') {
    run([cli, 'validate', input]);
  }

  if (command === 'render-diagrams') {
    run([cli, 'render-diagrams', input, '--out', path.join('dist', 'diagrams', slug)]);
  }

  if (command === 'build') {
    run([
      cli,
      'build',
      input,
      '--diagrams',
      path.join('dist', 'diagrams', slug),
      '--out',
      path.join('dist', 'examples', `${slug}.pptx`)
    ]);
  }
}

