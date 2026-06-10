# presentationkit

`presentationkit` is a small, brand-neutral toolkit for building technical decks from structured story manifests. It extracts the reusable ideas from a one-off presentation workflow without carrying over company-specific content, assets, or branding.

## What it captures

- A three-act technical story shape: context, proof, ambition.
- Slide strategy fields that force each slide to state purpose, message, visuals, avoid-list, and speaker intent.
- Aspect-ratio-safe image placement so screenshots and diagrams are fitted, not stretched.
- Evidence thumbnails that prove work happened without pretending dense screenshots are readable.
- Guardrail and audit-trail messaging for responsible technical capability stories.
- SVG diagram generation from data: process flows, architecture maps, deployment footprint cards, and future-loop diagrams.
- Defensible metric templates that separate productivity signals from operational SLA claims.

## Quick start

```powershell
npm install
npm run build
npm run check
npm run smoke
```

Outputs land in `dist/`:

- `dist/diagrams/*.svg` generated from the example manifest.
- `dist/operational-ai-support.pptx` generated from the same manifest.

## CLI

```powershell
npm run build
node dist/cli.js validate examples/operational-ai-support.deck.json
node dist/cli.js render-diagrams examples/operational-ai-support.deck.json --out dist/diagrams
node dist/cli.js build examples/operational-ai-support.deck.json --out dist/example.pptx
```

Use `examples/operational-ai-support.deck.json` as a starting point. Replace the neutral example story, visuals, and metrics with your own content.

## Programmatic API

The package publishes ESM JavaScript and TypeScript declarations from `dist/`.

```ts
import {
  buildDeck,
  loadManifest,
  renderDiagrams,
  validateManifest,
  type BuildOptions,
  type DeckManifest
} from 'presentationkit';

const { manifest } = await loadManifest('examples/operational-ai-support.deck.json');
const result = validateManifest(manifest);

if (!result.ok) {
  throw new Error(result.errors.join('\n'));
}

await renderDiagrams(manifest, 'dist/diagrams');
const options: BuildOptions = {
  out: 'dist/example.pptx',
  diagramDir: 'dist/diagrams'
};

const deckPath = await buildDeck(manifest as DeckManifest, options);
console.log(deckPath);
```

Public API types include `DeckManifest`, `ThemeConfig`, `SlideConfig`, `DiagramConfig`, `BuildOptions`, and `ValidationResult`.

## Build and check workflow

```powershell
npm run build   # compile src/ to package-ready dist/ JavaScript and .d.ts files
npm run check   # build and validate the example manifest with the compiled CLI
npm run smoke   # check, render example diagrams, and build the example deck
```

## Repository layout

| Path | Purpose |
|---|---|
| `src/cli.js` | Command entry point. |
| `src/index.ts` | Typed package API surface. |
| `src/types.ts` | Public TypeScript types. |
| `src/deck.js` | PPTX generation from a manifest. |
| `src/diagrams.js` | SVG diagram generation from manifest data. |
| `src/layout.js` | Cards, pills, text, arrows, and aspect-ratio fitting. |
| `src/validate.js` | Lightweight manifest validation. |
| `docs/story-strategy-template.md` | Deck planning template. |
| `docs/metric-defensibility-template.md` | Metric extraction and caveat template. |
| `examples/operational-ai-support.deck.json` | Brand-neutral example deck manifest. |

## Design principles

1. Keep the subject focused. Context explains why the hero matters, but it should not become the hero.
2. Show real artifacts as proof, not decoration.
3. Preserve native visual ratios. Crop or redesign around assets instead of squeezing them.
4. Say what the system is not allowed to do. Guardrails create credibility.
5. Label best-effort metrics as best-effort metrics. Do not turn productivity proxies into SLA claims.
