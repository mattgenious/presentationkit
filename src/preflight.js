import fs from 'node:fs/promises';
import path from 'node:path';
import { getDiagramRenderer } from './diagrams.js';
import { diagramFile, resolveMaybeRelative } from './manifest.js';
import { validateManifest } from './validate.js';

const nodeMajorRequired = 20;
const diagramFields = ['processDiagram', 'footprintDiagram', 'architectureDiagram', 'ambitionDiagram'];
const imageLikeExtensions = /\.(?:png|jpe?g|svg|gif|webp)$/i;
const assetKeyPattern = /(?:image|asset|thumbnail|screenshot|logo|icon|media|file|path)$/i;

async function pathExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function isUrl(value) {
  return /^https?:\/\//i.test(value) || /^data:/i.test(value);
}

function dependencyStatus(name, { optional = false, hint } = {}) {
  try {
    import.meta.resolve(name);
    return { name, ok: true, optional };
  } catch {
    return {
      name,
      ok: false,
      optional,
      message: `${optional ? 'Optional dependency' : 'Dependency'} "${name}" is not installed.${hint ? ` ${hint}` : ''}`
    };
  }
}

function addFileAsset(inventory, root, source, value) {
  if (typeof value !== 'string' || !value || isUrl(value) || !imageLikeExtensions.test(value)) return;
  inventory.push({
    kind: 'referenced-asset',
    source,
    value,
    path: resolveMaybeRelative(root, value),
    generated: false
  });
}

function scanForAssetReferences(value, root, inventory, pointer = 'manifest') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForAssetReferences(item, root, inventory, `${pointer}[${index}]`));
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    const childPointer = `${pointer}.${key}`;
    if (typeof child === 'string' && assetKeyPattern.test(key)) {
      addFileAsset(inventory, root, childPointer, child);
    } else {
      scanForAssetReferences(child, root, inventory, childPointer);
    }
  }
}

export function collectAssetInventory(manifest, { root = process.cwd(), diagramDir = path.resolve('dist', 'diagrams') } = {}) {
  const inventory = [];
  const resolvedDiagramDir = path.resolve(diagramDir);

  for (const [key, diagram] of Object.entries(manifest.diagrams ?? {})) {
    const diagramType = diagram?.type ?? key;
    if (!getDiagramRenderer(key, diagram)) {
      inventory.push({
        kind: 'unrendered-diagram',
        source: `diagrams.${key}`,
        value: diagramType,
        generated: false
      });
      continue;
    }
    inventory.push({
      kind: 'generated-diagram',
      source: `diagrams.${key}`,
      value: key,
      path: diagramFile(resolvedDiagramDir, key),
      generated: true
    });
  }

  (manifest.slides ?? []).forEach((slide, index) => {
    for (const field of diagramFields) {
      if (!slide[field]) continue;
      inventory.push({
        kind: 'slide-diagram-reference',
        source: `slides[${index}].${field}`,
        value: slide[field],
        path: diagramFile(resolvedDiagramDir, slide[field]),
        generated: true,
        defined: Boolean(manifest.diagrams?.[slide[field]])
      });
    }
  });

  scanForAssetReferences(manifest, root, inventory);

  return inventory;
}

export async function runPreflight({ manifest, manifestFile, root, diagramDir, diagramTypes } = {}) {
  const errors = [];
  const warnings = [];
  const dependencies = [];
  const resolvedRoot = root ?? (manifestFile ? path.dirname(path.resolve(manifestFile)) : process.cwd());
  const resolvedDiagramDir = path.resolve(diagramDir ?? 'dist/diagrams');

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  dependencies.push({
    name: 'node',
    ok: nodeMajor >= nodeMajorRequired,
    version: process.versions.node,
    message: nodeMajor >= nodeMajorRequired ? undefined : `PresentationKit requires Node.js >=${nodeMajorRequired}; current version is ${process.versions.node}.`
  });

  dependencies.push(dependencyStatus('pptxgenjs', {
    hint: 'Run npm install before building PPTX decks.'
  }));
  dependencies.push(dependencyStatus('puppeteer', {
    optional: true,
    hint: 'Install with npm install --save-dev puppeteer to enable export-svg.'
  }));

  for (const dependency of dependencies) {
    if (dependency.ok) continue;
    if (dependency.optional) warnings.push(dependency.message);
    else errors.push(dependency.message);
  }

  const validation = validateManifest(manifest, { diagramTypes });
  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

  const inventory = collectAssetInventory(manifest, { root: resolvedRoot, diagramDir: resolvedDiagramDir });
  const seenAssetPaths = new Set();
  for (const item of inventory) {
    if (item.kind !== 'referenced-asset') continue;
    if (seenAssetPaths.has(item.path)) continue;
    seenAssetPaths.add(item.path);
    if (!(await pathExists(item.path))) {
      errors.push(`${item.source} references missing asset: ${item.path}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    dependencies,
    inventory
  };
}

export function formatPreflightResult(result) {
  const lines = [];
  lines.push(result.ok ? 'Preflight passed.' : 'Preflight failed.');

  if (result.errors.length) {
    lines.push('', 'Errors:');
    for (const error of result.errors) lines.push(`- ${error}`);
  }

  if (result.warnings.length) {
    lines.push('', 'Warnings:');
    for (const warning of result.warnings) lines.push(`- ${warning}`);
  }

  lines.push('', 'Dependencies:');
  for (const dependency of result.dependencies) {
    const label = dependency.optional ? `${dependency.name} (optional)` : dependency.name;
    lines.push(`- ${label}: ${dependency.ok ? 'ok' : 'missing'}${dependency.version ? ` (${dependency.version})` : ''}`);
  }

  lines.push('', 'Asset inventory:');
  if (!result.inventory.length) {
    lines.push('- No diagram or image assets referenced.');
  } else {
    for (const item of result.inventory) {
      lines.push(`- ${item.kind}: ${item.source} -> ${item.generated ? 'generated ' : ''}${item.path}`);
    }
  }

  return lines.join('\n');
}
