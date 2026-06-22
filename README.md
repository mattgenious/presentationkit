# presentationkit

`presentationkit` is a brand-neutral toolkit for building technical presentation decks from structured story manifests. It turns content, diagram data, proof artifacts, guardrails, and speaker intent into reviewable planning artifacts, SVG diagrams, PPTX output, QA findings, and render metadata.

## What it captures

- A three-act technical story shape: context, proof, ambition.
- Presentation intents that explain when a deck shape fits, when it does not, and what proof/visuals it needs.
- Slide strategy fields that force each slide to state purpose, message, visuals, avoid-list, and speaker intent.
- Aspect-ratio-safe image placement so screenshots and diagrams are fitted, not stretched.
- Evidence thumbnails that prove work happened without pretending dense screenshots are readable.
- Guardrail and audit-trail messaging for responsible technical capability stories.
- SVG diagram generation from data: process flows, architecture maps, deployment footprint cards, and future-loop diagrams.
- Preflight, QA, and render metadata so generated output is traceable and reviewable.
- Standalone `.pptx` generation through the `presentationkit` CLI; no external PowerPoint skill is required for core deck output.
- Optional companion `.pptx` or brand-pack handoff guidance for template inspection, visual QA, and private brand finalization.
- Optional authorized brand-pack handoff metadata for private template/brand companions while keeping brand assets outside the repo, including a generic `presentation-brand-pack` companion shape that external skills can implement.

## Install

Requires Node.js 20 or newer. Once the package is published to npm:

```sh
npx presentationkit --help
npm install -g presentationkit
presentationkit --help
```

Until an npm release exists, install directly from GitHub:

```sh
npm exec --yes --package github:mattgenious/presentationkit -- presentationkit --help
npm install -g github:mattgenious/presentationkit
presentationkit --help
```

For local development from a checkout:

```sh
npm install
npm run smoke
```

The smoke flow validates every example and produces the main artifacts under `dist/`:

- `dist/plan/render-plan.json` and `dist/plan/storyboard.md`
- `dist/diagrams/*.svg`
- `dist/qa/presentation-qa.{json,md}`
- `dist/operational-ai-support.pptx`
- `dist/render-manifest.json`

## Build your own deck

Copy an example manifest and edit the story fields:

```sh
node -e "require('node:fs').copyFileSync('examples/operational-ai-support.deck.json', 'my-deck.deck.json')"
presentationkit list-intents
presentationkit inspect my-deck.deck.json
presentationkit plan my-deck.deck.json --out dist/my-deck-plan --diagrams dist/my-deck-diagrams --deck-out dist/my-deck.pptx
presentationkit preflight my-deck.deck.json --diagrams dist/my-deck-diagrams
presentationkit qa/review my-deck.deck.json --out dist/my-deck-qa
presentationkit build my-deck.deck.json --out dist/my-deck.pptx --diagrams dist/my-deck-diagrams --manifest-out dist/my-deck-render-manifest.json --plan-out dist/my-deck-plan --qa-out dist/my-deck-qa --deterministic
```

Use `--verbose` on any command when you need more progress output.

## CLI

```sh
presentationkit validate <deck.json> [--json]
presentationkit inspect <deck.json> [--json]
presentationkit list <deck.json> [--json]
presentationkit examples [--json]
presentationkit list-intents [--id intent-id] [--json]
presentationkit plan <deck.json> [--out dist/plan] [--diagrams dist/diagrams] [--deck-out dist/deck.pptx] [--json]
presentationkit preflight <deck.json> [--diagrams dist/diagrams] [--json]
presentationkit qa/review <deck.json> [--out dist/qa] [--json]
presentationkit render-diagrams <deck.json> [--out dist/diagrams]
presentationkit build <deck.json> [--out dist/deck.pptx] [--diagrams dist/diagrams] [--manifest-out dist/render-manifest.json] [--plan-out dist/plan] [--qa-out dist/qa] [--deterministic]
presentationkit export-svg <input.svg> <output.png> [--scale 2]
```

The package build emits `dist/index.js` and `dist/index.d.ts`, so consumers can use the same primitives programmatically:

```js
import {
  buildDeck,
  renderDiagrams,
  validateManifest,
  writePlanArtifacts,
  runPreflight,
  reviewManifest,
  writeRenderManifest
} from 'presentationkit';
```

## Repository layout

| Path | Purpose |
|---|---|
| `AGENTS.md` | Repo-level guidance for agent contributors. |
| `docs/companion-pptx-skill-workflow.md` | Optional workflow for pairing generated decks with generic or brand-specific PPTX inspection skills. |
| `docs/brand-pack-workflow.md` | How to reference and recognize external presentation brand-pack companions without committing their assets or instructions. |
| `docs/open-source-release-checklist.md` | Public-release checklist for keeping the package reusable and free of private context. |
| `src/cli.js` | Commander-based command entry point. |
| `src/deck.js` | PPTX generation from a manifest. |
| `src/diagrams.js` | SVG diagram generation from manifest data. |
| `src/renderer-registry.js` | Extensible renderer registry used by slides and diagrams. |
| `src/intents.js` | Built-in presentation intent catalog. |
| `src/plan.js` | Render-plan JSON and storyboard Markdown generation. |
| `src/preflight.js` | Dependency, asset, and manifest preflight checks. |
| `src/qa.js` | Presentation quality review checks and artifacts. |
| `src/render-manifest.js` | Deterministic render manifest and checksums. |
| `src/types.ts` | Public TypeScript contract for generated declarations. |
| `schemas/deck.schema.json` | Manifest JSON schema. |
| `examples/*.deck.json` | Brand-neutral example deck manifests. |

## Design principles

1. Keep the subject focused. Context explains why the hero matters, but it should not become the hero.
2. Show real artifacts as proof, not decoration.
3. Preserve native visual ratios. Crop or redesign around assets instead of squeezing them.
4. Say what the system is not allowed to do. Guardrails create credibility.
5. Label best-effort metrics as best-effort metrics. Do not turn productivity proxies into SLA claims.
6. Generate review artifacts before the PPTX so content issues are cheap to fix.
