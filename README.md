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
npm run smoke
```

Outputs land in `dist/`:

- `dist/diagrams/*.svg` generated from the example manifest.
- `dist/operational-ai-support.pptx` generated from the same manifest.

## CLI

```powershell
node src/cli.js validate examples/operational-ai-support.deck.json
node src/cli.js validate examples/operational-ai-support.deck.json --json
node src/cli.js render-diagrams examples/operational-ai-support.deck.json --out dist/diagrams
node src/cli.js build examples/operational-ai-support.deck.json --out dist/example.pptx
```

Use `examples/operational-ai-support.deck.json` as a starting point. Replace the neutral example story, visuals, and metrics with your own content.

## Validation contract

Validation is authoritative for rendering. `validate`, `render-diagrams`, and `build` all fail before rendering when a manifest contains fields that the deck or diagram renderers cannot consume safely.

The validator checks:

- required root objects: `metadata`, `diagrams`, and `slides`;
- duplicate JSON keys while loading a manifest;
- unknown fields at the root, metadata, theme, diagram, slide, and nested card levels;
- theme palette values as six-digit hex colors without `#`;
- the four supported diagram definitions: `processFlow`, `footprint`, `architecture`, and `ambition`;
- diagram arrays used by renderers, including process `steps`, footprint `items`, architecture `sources`/`outputs`/`guardrails`, and ambition `inputs`/`outcomes`;
- slide-specific required fields for `context`, `proof`, and `ambition` slides;
- diagram references used by slides, currently the canonical renderer keys (`processFlow`, `footprint`, `architecture`, `ambition`);
- proof artifact accent colors (`blue`, `green`, `yellow`, `orange`, `purple`).

Warnings are limited to optional quality advice, such as missing `speakerNotes` or arrays longer than the renderer displays. Validation errors are intended to be actionable and include the manifest path, for example `slides[0].proofArtifacts[0].accent`.

For machine-readable output, run:

```powershell
node src/cli.js validate examples/operational-ai-support.deck.json --json
```

`examples/invalid-validation.deck.json` is intentionally broken and can be used to see the fail-fast errors returned by the validator.

## Repository layout

| Path | Purpose |
|---|---|
| `src/cli.js` | Command entry point. |
| `src/deck.js` | PPTX generation from a manifest. |
| `src/diagrams.js` | SVG diagram generation from manifest data. |
| `src/layout.js` | Cards, pills, text, arrows, and aspect-ratio fitting. |
| `src/validate.js` | Authoritative manifest validation. |
| `docs/story-strategy-template.md` | Deck planning template. |
| `docs/metric-defensibility-template.md` | Metric extraction and caveat template. |
| `examples/operational-ai-support.deck.json` | Brand-neutral example deck manifest. |

## Design principles

1. Keep the subject focused. Context explains why the hero matters, but it should not become the hero.
2. Show real artifacts as proof, not decoration.
3. Preserve native visual ratios. Crop or redesign around assets instead of squeezing them.
4. Say what the system is not allowed to do. Guardrails create credibility.
5. Label best-effort metrics as best-effort metrics. Do not turn productivity proxies into SLA claims.
