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
node src/cli.js render-diagrams examples/operational-ai-support.deck.json --out dist/diagrams
node src/cli.js build examples/operational-ai-support.deck.json --out dist/example.pptx
```

Use `examples/operational-ai-support.deck.json` as a starting point. Replace the neutral example story, visuals, and metrics with your own content.

## Agent and contributor guidance

- `AGENTS.md` routes agent work, safe edit surfaces, generated artifact rules, verification commands, and git author requirements.
- `docs/new-agent-start-here.md` is the first stop for agents changing deck behavior.
- `docs/contributing.md` covers contribution expectations and PR readiness.
- `docs/contextless-agent-checklist.md` helps implement deck features without relying on prior session context.
- `docs/review-checklist.md` ties review back to quality, intent, manifest, and render surfaces.

## Repository layout

| Path | Purpose |
|---|---|
| `src/cli.js` | Command entry point. |
| `src/deck.js` | PPTX generation from a manifest. |
| `src/diagrams.js` | SVG diagram generation from manifest data. |
| `src/layout.js` | Cards, pills, text, arrows, and aspect-ratio fitting. |
| `src/validate.js` | Lightweight manifest validation. |
| `AGENTS.md` | Agent routing, verification, generated artifact, and safe-edit guidance. |
| `docs/new-agent-start-here.md` | Orientation for agents starting deck feature work. |
| `docs/contributing.md` | Contribution and PR readiness guidance. |
| `docs/contextless-agent-checklist.md` | Checklist for implementing deck features without prior context. |
| `docs/review-checklist.md` | Review checklist for intent, quality, manifest, and render surfaces. |
| `docs/story-strategy-template.md` | Deck planning template. |
| `docs/metric-defensibility-template.md` | Metric extraction and caveat template. |
| `examples/operational-ai-support.deck.json` | Brand-neutral example deck manifest. |

## Design principles

1. Keep the subject focused. Context explains why the hero matters, but it should not become the hero.
2. Show real artifacts as proof, not decoration.
3. Preserve native visual ratios. Crop or redesign around assets instead of squeezing them.
4. Say what the system is not allowed to do. Guardrails create credibility.
5. Label best-effort metrics as best-effort metrics. Do not turn productivity proxies into SLA claims.
