#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { Command } from 'commander';
import { buildDeck, slideRenderers } from './deck.js';
import { diagramRenderers, renderDiagrams } from './diagrams.js';
import { formatPresentationIntents, getPresentationIntent, presentationIntents } from './intents.js';
import { loadManifest } from './manifest.js';
import { writePlanArtifacts } from './plan.js';
import { formatPreflightResult, runPreflight } from './preflight.js';
import { reviewManifest, writeReviewArtifacts } from './qa.js';
import { writeRenderManifest } from './render-manifest.js';
import { exportSvgToPng } from './svg-to-png.js';
import { validateManifest } from './validate.js';

const exampleManifest = 'examples/operational-ai-support.deck.json';

function outputJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function logVerbose(enabled, message) {
  if (enabled) console.error(`[presentationkit] ${message}`);
}

function validationOptions() {
  return {
    slideTypes: slideRenderers.names(),
    diagramTypes: diagramRenderers.names()
  };
}

function assertValidDeck(validation) {
  if (!validation.ok) {
    throw new Error(validation.errors.join('\n'));
  }
}

function printWarnings(warnings) {
  for (const warning of warnings) console.warn(`Warning: ${warning}`);
}

function printValidationResult(file, validation) {
  printWarnings(validation.warnings);
  assertValidDeck(validation);
  console.log(`Valid deck manifest: ${file}`);
}

function reviewOptions(options, extra = {}) {
  const validVisualQaStatuses = new Set(['pending', 'passed', 'waived']);
  if (options.firstVersionVisualQa && !validVisualQaStatuses.has(options.firstVersionVisualQa)) {
    throw new Error('--first-version-visual-qa must be one of: pending, passed, waived.');
  }
  return {
    ...extra,
    firstVersionVisualQa: {
      status: options.firstVersionVisualQa,
      evidence: options.visualQaEvidence,
      notes: options.visualQaNotes
    },
    requireFirstVersionVisualQa: Boolean(options.requireFirstVersionVisualQa)
  };
}

function collectSummary(manifest, file) {
  return {
    file,
    title: manifest.metadata?.title ?? null,
    intent: manifest.metadata?.intent ?? null,
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
  const validation = validateManifest(loaded.manifest, validationOptions());
  return {
    ...loaded,
    validation,
    summary: collectSummary(loaded.manifest, loaded.file)
  };
}

function printManifestSummary(summary, validation) {
  console.log(`Deck: ${summary.title ?? '(untitled)'}`);
  if (summary.intent) console.log(`Intent: ${summary.intent}`);
  console.log(`File: ${summary.file}`);
  console.log(`Validation: ${validation.ok ? 'valid' : 'invalid'}`);
  console.log(`Slides: ${summary.slideCount}`);
  for (const slide of summary.slides) {
    console.log(`  ${slide.index}. [${slide.type ?? 'unknown'}] ${slide.title ?? '(untitled)'}`);
  }
  console.log(`Diagrams: ${summary.diagramCount}`);
  for (const diagram of summary.diagrams) console.log(`  - ${diagram}`);
  printWarnings(validation.warnings);
  if (!validation.ok) {
    console.log('Errors:');
    for (const error of validation.errors) console.log(`  - ${error}`);
  }
}

function printList(summary) {
  console.log(`Slides in ${summary.file}:`);
  for (const slide of summary.slides) {
    console.log(`${slide.index}. ${slide.title ?? '(untitled)'} [${slide.type ?? 'unknown'}]`);
  }
  console.log('');
  console.log('Diagrams:');
  for (const diagram of summary.diagrams) console.log(`- ${diagram}`);
}

function exampleCommands() {
  return [
    `presentationkit validate ${exampleManifest}`,
    `presentationkit inspect ${exampleManifest}`,
    `presentationkit list ${exampleManifest}`,
    `presentationkit list-intents`,
    `presentationkit plan ${exampleManifest} --out dist/plan`,
    `presentationkit preflight ${exampleManifest}`,
    `presentationkit qa/review ${exampleManifest} --out dist/qa`,
    `presentationkit render-diagrams ${exampleManifest} --out dist/diagrams`,
    `presentationkit build ${exampleManifest} --out dist/operational-ai-support.pptx`
  ];
}

function samePath(a, b) {
  const resolvedA = path.resolve(a);
  const resolvedB = path.resolve(b);
  if (process.platform === 'win32') return resolvedA.toLowerCase() === resolvedB.toLowerCase();
  return resolvedA === resolvedB;
}

function ensureSafeRenderManifestPath(renderManifestPath, { deckPath, manifestPath, diagramPaths }) {
  if (samePath(renderManifestPath, deckPath)) {
    throw new Error('--manifest-out must be different from --out so the render manifest cannot overwrite the generated deck.');
  }
  if (samePath(renderManifestPath, manifestPath)) {
    throw new Error('--manifest-out must be different from the input deck manifest so source content is not overwritten.');
  }
  if (diagramPaths.some((diagramPath) => samePath(renderManifestPath, diagramPath))) {
    throw new Error('--manifest-out must be different from generated diagram paths so SVG artifacts are not overwritten.');
  }
}

async function collectEvidenceFiles(dir, root = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectEvidenceFiles(absolute, root));
    } else if (entry.isFile()) {
      files.push(path.relative(root, absolute));
    }
  }
  return files;
}

function isImageFile(file) {
  return /\.(?:png|jpe?g|webp)$/i.test(file);
}

function componentRecordsFromManifest(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value.components)) return value.components;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.slides)) {
    return value.slides.flatMap((slide) => Array.isArray(slide?.components) ? slide.components : []);
  }
  return [];
}

async function validateComponentManifestFiles(root, manifestFiles) {
  if (manifestFiles.length === 0) return ['component manifest'];
  const errors = [];
  for (const manifestFile of manifestFiles) {
    const manifestPath = path.join(root, manifestFile);
    try {
      const parsed = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      const records = componentRecordsFromManifest(parsed);
      const nonFullSlideRecords = records.filter((record) => String(record?.kind ?? '').toLowerCase() !== 'full-slide');
      if (nonFullSlideRecords.length > 0) return [];
      errors.push(`${manifestFile}: no non-full-slide component/group records`);
    } catch (error) {
      errors.push(`${manifestFile}: ${error.message}`);
    }
  }
  return errors.length > 0 ? errors : ['component manifest with non-full-slide records'];
}

async function validateVisualQaBundleFiles(root, files) {
  const normalized = files.map((file) => file.replaceAll('\\', '/').toLowerCase());
  const imageFiles = normalized.filter(isImageFile);
  const manifestFiles = normalized.filter((file) => {
    const base = path.posix.basename(file);
    return ['qa-crops-manifest.json', 'component-manifest.json', 'components.json'].includes(base);
  });
  const hasFullSlides = imageFiles.some((file) => {
    const base = path.posix.basename(file);
    return file.includes('full-slide') || /^slide[-_]\d+/.test(base);
  });
  const hasComponentCrops = imageFiles.some((file) => {
    return !file.includes('contact') && (file.includes('crop') || file.includes('component') || file.includes('group'));
  });
  const hasIndependentReview = normalized.some((file) => {
    return /\.(?:json|md|txt)$/i.test(file) && !file.includes('manifest') && /(agent|review|finding|report)/.test(file);
  });

  const missing = [];
  missing.push(...await validateComponentManifestFiles(root, manifestFiles));
  if (!hasFullSlides) missing.push('full-slide renders');
  if (!hasComponentCrops) missing.push('component/group crop images');
  if (!hasIndependentReview) missing.push('independent visual review report');
  return missing;
}

async function validateVisualQaEvidencePath(evidencePath) {
  const resolved = path.resolve(evidencePath);
  let stats;
  try {
    stats = await fs.stat(resolved);
  } catch {
    return [`${evidencePath}: path does not exist`];
  }
  if (!stats.isDirectory()) {
    return [`${evidencePath}: evidence must be a directory containing a component visual QA bundle`];
  }
  const files = await collectEvidenceFiles(resolved);
  const missing = await validateVisualQaBundleFiles(resolved, files);
  return missing.map((item) => `${evidencePath}: missing ${item}`);
}

async function assertRequiredVisualQaEvidenceBundle(review) {
  const gate = review.checks.firstVersionVisualQa;
  if (!gate.required || gate.requestedStatus !== 'passed') return;
  const evidence = gate.evidence ?? [];
  if (evidence.length === 0) return;
  const errors = [];
  for (const evidencePath of evidence) {
    const pathErrors = await validateVisualQaEvidencePath(evidencePath);
    if (pathErrors.length === 0) return;
    errors.push(...pathErrors);
  }
  throw new Error(`--require-first-version-visual-qa needs final component visual QA evidence:\n${errors.map((error) => `- ${error}`).join('\n')}`);
}

async function commandValidate(file, options) {
  const { validation } = await readDeck(file, { verbose: options.verbose });
  if (options.json) {
    outputJson(validation);
    if (!validation.ok) process.exitCode = 1;
    return;
  }
  printValidationResult(file, validation);
}

async function commandInspect(file, options) {
  const { validation, summary } = await readDeck(file, { verbose: options.verbose });
  if (options.json) {
    outputJson({ summary, validation });
    if (!validation.ok) process.exitCode = 1;
    return;
  }
  printManifestSummary(summary, validation);
  if (!validation.ok) process.exitCode = 1;
}

async function commandList(file, options) {
  const { validation, summary } = await readDeck(file, { verbose: options.verbose });
  if (options.json) {
    outputJson({ slides: summary.slides, diagrams: summary.diagrams });
    if (!validation.ok) process.exitCode = 1;
    return;
  }
  printList(summary);
  printWarnings(validation.warnings);
  if (!validation.ok) process.exitCode = 1;
}

async function commandPlan(file, options) {
  const { manifest, validation } = await readDeck(file, { verbose: options.verbose });
  printWarnings(validation.warnings);
  assertValidDeck(validation);
  const plan = await writePlanArtifacts(manifest, {
    manifestFile: file,
    outDir: path.resolve(options.out),
    diagramDir: path.resolve(options.diagrams),
    deckOut: path.resolve(options.deckOut)
  });
  if (options.json) {
    outputJson(plan);
    return;
  }
  console.log(plan.outputPaths.renderPlanJson);
  console.log(plan.outputPaths.storyboardMarkdown);
}

async function commandPreflight(file, options) {
  const { manifest, root } = await loadManifest(file);
  const result = await runPreflight({
    manifest,
    manifestFile: file,
    root,
    diagramDir: path.resolve(options.diagrams),
    diagramTypes: diagramRenderers.names()
  });
  if (options.json) {
    outputJson(result);
  } else {
    console.log(formatPreflightResult(result));
  }
  if (!result.ok) process.exitCode = 1;
}

async function commandReview(file, options) {
  const { manifest, validation } = await readDeck(file, { verbose: options.verbose });
  printWarnings(validation.warnings);
  assertValidDeck(validation);
  const review = reviewManifest(manifest, {
    ...reviewOptions(options, {
      minSlides: Number(options.minSlides),
      diagramTypes: diagramRenderers.names()
    })
  });
  await assertRequiredVisualQaEvidenceBundle(review);
  const artifacts = await writeReviewArtifacts(review, path.resolve(options.out));
  if (options.json) {
    outputJson({ review, artifacts });
  } else {
    console.log(`QA status: ${review.summary.status}`);
    console.log(artifacts.jsonPath);
    console.log(artifacts.markdownPath);
  }
  if (review.summary.counts.error > 0) {
    throw new Error(`QA review found ${review.summary.counts.error} error(s).`);
  }
}

async function commandRenderDiagrams(file, options) {
  const { manifest, validation } = await readDeck(file, { verbose: options.verbose });
  printWarnings(validation.warnings);
  assertValidDeck(validation);
  const out = path.resolve(options.out);
  const written = await renderDiagrams(manifest, out);
  for (const diagram of written) console.log(diagram);
}

async function commandBuild(file, options) {
  const out = path.resolve(options.out);
  if (path.extname(out).toLowerCase() !== '.pptx') {
    throw new Error('--out must be a .pptx path.');
  }

  const diagramDir = path.resolve(options.diagrams);
  const renderManifestPath = path.resolve(options.manifestOut ?? path.join(path.dirname(out), 'render-manifest.json'));
  const { manifest, file: manifestPath, root, validation } = await readDeck(file, { verbose: options.verbose });
  printWarnings(validation.warnings);
  assertValidDeck(validation);

  if (!options.skipPreflight) {
    const preflight = await runPreflight({
      manifest,
      manifestFile: manifestPath,
      root,
      diagramDir,
      diagramTypes: diagramRenderers.names()
    });
    if (!preflight.ok) throw new Error(formatPreflightResult(preflight));
    logVerbose(options.verbose, 'Preflight passed.');
  }

  if (options.planOut) {
    await writePlanArtifacts(manifest, {
      manifestFile: manifestPath,
      outDir: path.resolve(options.planOut),
      diagramDir,
      deckOut: out
    });
  }

  const diagramPaths = await renderDiagrams(manifest, diagramDir);
  ensureSafeRenderManifestPath(renderManifestPath, { deckPath: out, manifestPath, diagramPaths });
  const deckPath = await buildDeck(manifest, { out, diagramDir });
  const renderManifest = await writeRenderManifest({
    out: renderManifestPath,
    manifestPath,
    diagramPaths,
    deckPath,
    verification: validation,
    deterministic: Boolean(options.deterministic)
  });

  if (options.qaOut) {
    const review = reviewManifest(manifest, reviewOptions(options, { diagramTypes: diagramRenderers.names() }));
    await assertRequiredVisualQaEvidenceBundle(review);
    await writeReviewArtifacts(review, path.resolve(options.qaOut));
    if (review.summary.counts.error > 0) {
      throw new Error(`QA review found ${review.summary.counts.error} error(s).`);
    }
  }

  console.log(deckPath);
  console.log(`Render manifest: ${renderManifest.path}`);
}

async function commandExportSvg(input, output, options) {
  const scale = Number(options.scale);
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('--scale must be a positive number.');
  }
  const png = await exportSvgToPng(input, output, scale);
  console.log(png);
}

async function main() {
  const program = new Command();
  program
    .name('presentationkit')
    .description('Build and inspect manifest-driven technical presentation decks.')
    .option('--verbose', 'print diagnostic progress to stderr');

  program
    .command('validate')
    .description('Validate a deck manifest.')
    .argument('<deck.json>', 'deck manifest to validate')
    .option('--json', 'emit validation as JSON')
    .action((file, options) => commandValidate(file, { ...options, verbose: program.opts().verbose }));

  program
    .command('inspect')
    .description('Inspect deck metadata, slides, diagrams, and validation status.')
    .argument('<deck.json>', 'deck manifest to inspect')
    .option('--json', 'emit inspection as JSON')
    .action((file, options) => commandInspect(file, { ...options, verbose: program.opts().verbose }));

  program
    .command('list')
    .description('List slide titles and diagram keys in a deck manifest.')
    .argument('<deck.json>', 'deck manifest to list')
    .option('--json', 'emit list as JSON')
    .action((file, options) => commandList(file, { ...options, verbose: program.opts().verbose }));

  program
    .command('examples')
    .description('Show bundled example manifest and common commands.')
    .option('--json', 'emit examples as JSON')
    .action((options) => {
      const commands = exampleCommands();
      if (options.json) {
        outputJson({ manifest: exampleManifest, commands });
        return;
      }
      console.log(`Example manifest: ${exampleManifest}`);
      for (const command of commands) console.log(`  ${command}`);
    });

  program
    .command('list-intents')
    .description('List built-in presentation intents and their fit criteria.')
    .option('--id <intent-id>', 'show one intent')
    .option('--json', 'emit intents as JSON')
    .action((options) => {
      const intents = options.id ? [getPresentationIntent(options.id)].filter(Boolean) : presentationIntents;
      if (options.id && intents.length === 0) {
        throw new Error(`Unknown presentation intent: ${options.id}`);
      }
      if (options.json) {
        outputJson(options.id ? intents[0] : intents);
        return;
      }
      console.log(formatPresentationIntents(intents));
    });

  program
    .command('plan')
    .description('Write render-plan JSON and storyboard Markdown before building.')
    .argument('<deck.json>', 'deck manifest to plan')
    .option('--out <dir>', 'plan output directory', 'dist/plan')
    .option('--diagrams <dir>', 'diagram output directory to reference', 'dist/diagrams')
    .option('--deck-out <pptx>', 'deck output path to reference', 'dist/deck.pptx')
    .option('--json', 'emit render plan as JSON')
    .action((file, options) => commandPlan(file, { ...options, verbose: program.opts().verbose }));

  program
    .command('preflight')
    .description('Check runtime dependencies, manifest validity, and asset references.')
    .argument('<deck.json>', 'deck manifest to preflight')
    .option('--diagrams <dir>', 'diagram output directory to check', 'dist/diagrams')
    .option('--json', 'emit preflight result as JSON')
    .action((file, options) => commandPreflight(file, options));

  program
    .command('qa/review')
    .alias('review')
    .description('Write presentation QA review artifacts.')
    .argument('<deck.json>', 'deck manifest to review')
    .option('--out <dir-or-file>', 'QA output directory or JSON/Markdown file', 'dist/qa')
    .option('--min-slides <count>', 'minimum expected slide count', '1')
    .option('--first-version-visual-qa <status>', 'first-version visual QA gate status: pending, passed, or waived')
    .option('--visual-qa-evidence <path>', 'path to visual QA bundle, report, or reviewed artifact evidence')
    .option('--visual-qa-notes <text>', 'short note about the first-version visual QA decision')
    .option('--require-first-version-visual-qa', 'fail unless first-version visual QA is passed with evidence')
    .option('--json', 'emit review as JSON')
    .action((file, options) => commandReview(file, { ...options, verbose: program.opts().verbose }));

  program
    .command('render-diagrams')
    .description('Render SVG diagrams from a deck manifest.')
    .argument('<deck.json>', 'deck manifest to render')
    .option('--out <dir>', 'diagram output directory', 'dist/diagrams')
    .action((file, options) => commandRenderDiagrams(file, { ...options, verbose: program.opts().verbose }));

  program
    .command('build')
    .description('Build a PPTX deck and render metadata from a manifest.')
    .argument('<deck.json>', 'deck manifest to build')
    .option('--out <pptx>', 'PPTX output path', 'dist/deck.pptx')
    .option('--diagrams <dir>', 'diagram output directory', 'dist/diagrams')
    .option('--manifest-out <json>', 'render manifest output path')
    .option('--plan-out <dir>', 'also write render-plan/storyboard artifacts')
    .option('--qa-out <dir-or-file>', 'also write QA review artifacts')
    .option('--first-version-visual-qa <status>', 'first-version visual QA gate status for --qa-out: pending, passed, or waived')
    .option('--visual-qa-evidence <path>', 'path to visual QA bundle, report, or reviewed artifact evidence for --qa-out')
    .option('--visual-qa-notes <text>', 'short note about the first-version visual QA decision for --qa-out')
    .option('--require-first-version-visual-qa', 'fail --qa-out unless first-version visual QA is passed with evidence')
    .option('--deterministic', 'omit wall-clock fields from render manifest')
    .option('--skip-preflight', 'skip dependency and asset preflight checks')
    .action((file, options) => commandBuild(file, { ...options, verbose: program.opts().verbose }));

  program
    .command('export-svg')
    .description('Export an SVG to PNG using Puppeteer.')
    .argument('<input.svg>', 'source SVG')
    .argument('<output.png>', 'target PNG')
    .option('--scale <number>', 'PNG scale factor', '2')
    .action(commandExportSvg);

  await program.parseAsync();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
