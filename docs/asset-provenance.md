# Asset provenance

Keep a provenance record beside each deck that uses screenshots, exported diagrams, photos, icons, or other non-text assets. The record should make it clear where every asset came from and whether it can be redistributed with the deck.

## Template

Use `examples/assets/provenance.json` as a starting point and validate the shape against `schemas/asset-provenance.schema.json`.

Each asset entry should include:

- `id`: stable identifier used in review notes or deck documentation.
- `path`: repository-relative or deck-relative asset path.
- `source`: original source system, generator, or manifest field.
- `license`: reuse terms, internal-only note, or generated-asset statement.
- `usage`: where and why the asset appears in the deck.
- `owner`, `created`, `notes`: optional context for reviewers.

## Generated diagrams

SVG diagrams produced by `presentationkit render-diagrams` are generated assets. Record the manifest field that produced them, for example `diagrams.architecture`, so reviewers can trace a rendered SVG back to its source data.

## Preflight inventory

Run:

```powershell
node src/cli.js preflight examples/operational-ai-support.deck.json
```

The preflight output lists generated diagrams, slide diagram references, and image-like files referenced by manifest fields such as `image`, `thumbnail`, `screenshot`, `logo`, `asset`, `file`, or `path`.
