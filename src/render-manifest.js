import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const packageJsonUrl = new URL('../package.json', import.meta.url);

async function sha256(file) {
  const buffer = await fs.readFile(file);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function packageVersion() {
  const raw = await fs.readFile(packageJsonUrl, 'utf8');
  return JSON.parse(raw).version;
}

function normalizeForJson(file) {
  return path.resolve(file).replaceAll(path.sep, '/');
}

function timestampFields(deterministic) {
  if (deterministic) {
    return {
      deterministic: true,
      timestampNote: 'Deterministic mode requested; wall-clock render timestamps are omitted.'
    };
  }

  return {
    deterministic: false,
    generatedAt: new Date().toISOString()
  };
}

export async function buildRenderManifest({
  manifestPath,
  diagramPaths,
  deckPath,
  verification,
  deterministic = false
}) {
  const diagrams = [];
  for (const diagramPath of diagramPaths) {
    diagrams.push({
      path: normalizeForJson(diagramPath),
      sha256: await sha256(diagramPath)
    });
  }

  const outputDeck = {
    path: normalizeForJson(deckPath)
  };
  if (deterministic) {
    outputDeck.sha256Note = 'Omitted in deterministic mode because PPTX package metadata can vary between equivalent renders.';
  } else {
    outputDeck.sha256 = await sha256(deckPath);
  }

  return {
    schemaVersion: 1,
    package: {
      name: 'presentationkit',
      version: await packageVersion()
    },
    ...timestampFields(deterministic),
    sourceManifest: {
      path: normalizeForJson(manifestPath),
      sha256: await sha256(manifestPath)
    },
    generatedDiagrams: diagrams,
    outputDeck,
    verification: {
      warnings: verification?.warnings ?? []
    }
  };
}

export async function writeRenderManifest({ out, ...options }) {
  const resolved = path.resolve(out);
  const manifest = await buildRenderManifest(options);
  manifest.renderManifest = {
    path: normalizeForJson(resolved)
  };

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    path: normalizeForJson(resolved),
    manifest
  };
}
