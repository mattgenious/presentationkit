# Open-source release checklist

Use this checklist before publishing PresentationKit publicly or preparing an open-source-facing pull request.

## Package metadata

- `package.json` has a license, repository URL, issue tracker URL, homepage, supported Node version, and publishable `files` list.
- `package-lock.json` is updated after package metadata or dependency changes.
- `LICENSE`, `README.md`, `CONTRIBUTING.md`, and `SECURITY.md` are present at the repository root.

## Repository content

- Examples are brand-neutral and use synthetic or public-safe data.
- No generated `dist/` output, rendered decks, private screenshots, or local machine paths are committed.
- No credentials, tokens, environment files, customer data, private metrics, or proprietary brand assets are present.
- Brand-specific workflows use `brandPack` metadata and external companion skills rather than copying private templates, logos, fonts, or rules into this repository.

## Brand-pack compatibility

- Public docs describe the generic `presentation-brand-pack` companion shape.
- Private/internal brand packs live in their own authorized distribution channel.
- Manifest examples only show placeholder brand names and paths.

## Verification

```powershell
npm run check
```

Run `npm run smoke` when release changes affect rendering, CLI behavior, schemas, examples, or packaging.
