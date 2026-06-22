# New agent start here

Use this page to orient before changing PresentationKit.

## What this repo does

PresentationKit builds technical decks from structured JSON manifests. The repo is intentionally brand-neutral: it should contain reusable deck mechanics, neutral examples, and guidance for evidence-first technical storytelling.

## First read

1. `README.md` for install, CLI commands, and layout.
2. `AGENTS.md` for repo-wide routing, generated artifact rules, verification, and git author requirements.
3. `docs/contextless-agent-checklist.md` before implementing a deck feature.
4. `docs/review-checklist.md` before opening a PR.
5. `docs/open-source-release-checklist.md` before preparing a public release.

## Work by surface

| Goal | Primary surface | Verification |
|---|---|---|
| Change deck content | `examples/*.deck.json` | `npm run check` |
| Add or validate manifest fields | `schemas/deck.schema.json`, `src/validate.js` | `npm run check` |
| Change slide composition | `src/deck.js`, `src/layout.js`, `src/theme.js` | `npm run smoke` |
| Change diagrams | `src/diagrams.js`, example `diagrams` data | `npm run render:example` or `npm run smoke` |
| Change CLI behavior | `src/cli.js` | Relevant CLI command plus `npm run check` |
| Change docs only | `docs/*.md`, `README.md`, `AGENTS.md` | Verify links/paths and run `npm run check` |
| Prepare public release | `package.json`, `README.md`, `LICENSE`, `docs/open-source-release-checklist.md` | `npm run check` plus package metadata review |

## Default implementation loop

1. Identify the deck intent: audience, claim, proof, ambition, and guardrails.
2. Locate the manifest field or render surface that owns the change.
3. Update the smallest source surface; avoid generated output commits.
4. Validate the example manifest with `npm run check`.
5. Run render/build smoke checks when layout or output behavior changes.
6. Review against `docs/review-checklist.md`.
