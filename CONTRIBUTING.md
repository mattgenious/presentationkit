# Contributing

Thanks for improving PresentationKit.

Start with:

1. `README.md` for setup and CLI usage.
2. `docs/new-agent-start-here.md` for the repo map.
3. `docs/review-checklist.md` before opening a pull request.

## Development

```powershell
npm install
npm run check
```

Run `npm run smoke` for changes that affect rendering, diagrams, CLI behavior, schemas, or example manifests.

## Pull requests

- Keep changes focused and reviewable.
- Commit source manifests, docs, schemas, and code. Do not commit generated `dist/` output unless a future fixture workflow explicitly asks for it.
- Keep examples brand-neutral and free of proprietary screenshots, credentials, private metrics, customer data, and company-specific brand assets.
- Use `docs/brand-pack-workflow.md` for external brand companions instead of copying private brand assets into this repository.

## Public release hygiene

Before a release or open-source preparation pass, use `docs/open-source-release-checklist.md`.
