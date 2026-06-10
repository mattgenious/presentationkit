#!/usr/bin/env node
import path from 'node:path';
import { Command } from 'commander';
import { buildDeck } from './deck.js';
import { renderDiagrams } from './diagrams.js';
import { loadManifest } from './manifest.js';
import { exportSvgToPng } from './svg-to-png.js';
import { validateManifest } from './validate.js';

const exampleManifest = 'examples/operational-ai-support.deck.json';

function outputJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function logVerbose(enabled, message) {
  if (enabled) console.error(`[presentationkit] ${message}`);
}

function collectSummary(manifest, file) {
  return {
    file,
    title: manifest.metadata?.title ?? null,
    author: manifest.metadata?.author ?? null,
    slideCount: manifest.slides?.length ?? 0,
    diagramCount: Object.keys(manifest.diagrams ?? {}).length,
    slides: (manifest.slides ?? []).map((slide, index) => ({
      index: index + 1,
      type: slide.type ?? null,
      title: slide.title ?? null,
      headline: slide.headline ?? null
    })),
    diagrams: Object.keys(manifest.diagrams ?? {})
  };
}

async function readDeck(file, options = {}) {
  logVerbose(options.verbose, `Loading manifest: ${file}`);
  const loaded = await loadManifest(file);
  const result = validateManifest(loaded.manifest);
  return { ...loaded, validation: result, summary: collectSummary(loaded.manifest, loaded.file) };
}

function printWarnings(warnings) {
  for (const warning of warnings) console.warn(`Warning: ${warning}`);
}

function printValidationResult(file, validation) {
  printWarnings(validation.warnings);
  assertValidDeck(validation);
  console.log(`Valid deck manifest: ${file}`);
}

function assertValidDeck(validation) {
  if (!validation.ok) {
    throw new Error(validation.errors.join('\n'));
  }
}

function printManifestSummary(summary, validation) {
  console.log(`Deck: ${summary.title ?? '(untitled)'}`);
  console.log(`File: ${summary.file}`);
  console.log(`Validation: ${validation.ok ? 'valid' : 'invalid'}`);
  console.log(`Slides: ${summary.slideCount}`);
  for (const slide of summary.slides) {
    console.log(`  ${slide.index}. [${slide.type ?? 'unknown'}] ${slide.title ?? '(untitled)'}`);
  }
  console.log(`Diagrams: ${summary.diagramCount}`);
  for (const diagram of summary.diagrams) {
    console.log(`  - ${diagram}`);
  }
  printWarnings(validation.warnings);
  if (!validation.ok) {
    console.log('Errors:');
    for (const error of validation.errors) console.log(`  - ${error}`);
  }
}

function printList(summary) {
  console.log(`Slides in ${summary.file}:`);
  for (const slide of summary.slides) {
    console.log(`  ${slide.index}. ${slide.title ?? '(untitled)'} (${slide.type ?? 'unknown'})`);
  }
  console.log('Diagrams:');
  for (const diagram of summary.diagrams) {
    console.log(`  - ${diagram}`);
  }
}

function exampleCommands() {
  return [
    `presentationkit validate ${exampleManifest}`,
    `presentationkit inspect ${exampleManifest}`,
    `presentationkit list ${exampleManifest}`,
    `presentationkit render-diagrams ${exampleManifest} --out dist/diagrams`,
    `presentationkit build ${exampleManifest} --out dist/operational-ai-support.pptx`,
    'presentationkit export-svg dist/diagrams/processFlow.svg dist/processFlow.png --scale 2'
  ];
}

const program = new Command();

program
  .name('presentationkit')
  .description('Build and inspect manifest-driven technical presentation decks.')
  .showHelpAfterError()
  .showSuggestionAfterError()
  .configureHelp({ sortSubcommands: true, sortOptions: true })
  .option('-v, --verbose', 'print progress details to stderr')
  .helpOption('-h, --help', 'display help for command');

program
  .command('validate')
  .alias('check')
  .description('Validate a deck manifest.')
  .argument('<deck.json>', 'deck manifest to validate')
  .option('--json', 'emit validation result as JSON')
  .action(async (file, options) => {
    const { validation, summary } = await readDeck(file, { verbose: program.opts().verbose });
    if (options.json) {
      outputJson({ ok: validation.ok, file: summary.file, errors: validation.errors, warnings: validation.warnings });
      if (!validation.ok) process.exitCode = 1;
      return;
    }
    printValidationResult(file, validation);
  });

program
  .command('inspect')
  .alias('info')
  .description('Inspect deck metadata, slides, diagrams, and validation status.')
  .argument('<deck.json>', 'deck manifest to inspect')
  .option('--json', 'emit inspection as JSON')
  .action(async (file, options) => {
    const { validation, summary } = await readDeck(file, { verbose: program.opts().verbose });
    if (options.json) {
      outputJson({ ...summary, validation });
      if (!validation.ok) process.exitCode = 1;
      return;
    }
    printManifestSummary(summary, validation);
    if (!validation.ok) process.exitCode = 1;
  });

program
  .command('list')
  .alias('ls')
  .description('List slide titles and diagram keys in a deck manifest.')
  .argument('<deck.json>', 'deck manifest to list')
  .option('--json', 'emit list as JSON')
  .action(async (file, options) => {
    const { validation, summary } = await readDeck(file, { verbose: program.opts().verbose });
    if (options.json) {
      outputJson({ file: summary.file, slides: summary.slides, diagrams: summary.diagrams });
      if (!validation.ok) process.exitCode = 1;
      return;
    }
    printList(summary);
    printWarnings(validation.warnings);
    if (!validation.ok) process.exitCode = 1;
  });

program
  .command('examples')
  .alias('example')
  .description('Show bundled example manifest and common commands.')
  .option('--json', 'emit examples as JSON')
  .action((options) => {
    const commands = exampleCommands();
    if (options.json) {
      outputJson({ manifest: exampleManifest, commands });
      return;
    }
    console.log(`Example manifest: ${exampleManifest}`);
    console.log('Try:');
    for (const command of commands) console.log(`  ${command}`);
  });

program
  .command('render-diagrams')
  .alias('diagrams')
  .description('Render SVG diagrams from a deck manifest.')
  .argument('<deck.json>', 'deck manifest to render')
  .option('-o, --out <dir>', 'output directory for SVG diagrams', 'dist/diagrams')
  .action(async (file, options) => {
    const out = path.resolve(options.out);
    const { manifest, validation } = await readDeck(file, { verbose: program.opts().verbose });
    assertValidDeck(validation);
    logVerbose(program.opts().verbose, `Rendering diagrams to: ${out}`);
    const written = await renderDiagrams(manifest, out);
    console.log(`Rendered ${written.length} diagram(s) to ${out}`);
    for (const diagram of written) console.log(`  ${diagram}`);
  });

program
  .command('build')
  .alias('deck')
  .description('Build a PPTX deck from a manifest.')
  .argument('<deck.json>', 'deck manifest to build')
  .option('-o, --out <file>', 'output PPTX file', 'dist/deck.pptx')
  .option('-d, --diagrams <dir>', 'directory for generated/intermediate diagrams', 'dist/diagrams')
  .action(async (file, options) => {
    const out = path.resolve(options.out);
    const diagramDir = path.resolve(options.diagrams);
    const { manifest, validation } = await readDeck(file, { verbose: program.opts().verbose });
    assertValidDeck(validation);
    logVerbose(program.opts().verbose, `Rendering diagrams to: ${diagramDir}`);
    await renderDiagrams(manifest, diagramDir);
    logVerbose(program.opts().verbose, `Building deck: ${out}`);
    const deck = await buildDeck(manifest, { out, diagramDir });
    console.log(`Built deck: ${deck}`);
  });

program
  .command('export-svg')
  .alias('png')
  .description('Export an SVG file to PNG.')
  .argument('<input.svg>', 'source SVG file')
  .argument('<output.png>', 'target PNG file')
  .option('-s, --scale <number>', 'PNG device scale factor', '2')
  .action(async (input, output, options) => {
    const scale = Number(options.scale);
    if (!Number.isFinite(scale) || scale <= 0) {
      throw new Error('--scale must be a positive number.');
    }
    logVerbose(program.opts().verbose, `Exporting ${input} to ${output} at ${scale}x`);
    const png = await exportSvgToPng(input, output, scale);
    console.log(`Exported PNG: ${png}`);
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
