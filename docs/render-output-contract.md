# Render output contract

`presentationkit build` writes a render manifest beside the generated deck by default:

```powershell
node src/cli.js build examples/operational-ai-support.deck.json --out dist/operational-ai-support.pptx
```

Default outputs:

- `dist/operational-ai-support.pptx` - generated PowerPoint deck.
- `dist/diagrams/*.svg` - regenerated SVG diagrams used by the deck.
- `dist/render-manifest.json` - machine-readable metadata for the render.

Use `--manifest-out <path>` to place the render manifest somewhere else:

```powershell
node src/cli.js build examples/operational-ai-support.deck.json --out dist/operational-ai-support.pptx --manifest-out dist/operational-ai-support.render.json
```

## Manifest contents

The render manifest records:

- the `presentationkit` package version;
- the source deck manifest path and SHA-256 checksum;
- each generated SVG path and SHA-256 checksum;
- the output deck path and, outside deterministic mode, its SHA-256 checksum;
- validation warnings surfaced during the build;
- either a wall-clock `generatedAt` timestamp or a deterministic-mode note.

Paths are written as absolute, normalized paths so downstream tooling can locate artifacts without guessing from the current working directory.

## Reproducibility

The source manifest and generated SVG checksums are deterministic for identical inputs, theme settings, and package version. The `.pptx` checksum may still change between runs because PowerPoint package writers can include archive metadata. Use the source manifest hash, SVG hashes, package version, and verification warnings as the stable reproducibility contract.

Pass `--deterministic` when consumers need metadata without a wall-clock timestamp:

```powershell
node src/cli.js build examples/operational-ai-support.deck.json --deterministic
```

In deterministic mode the render manifest includes `deterministic: true` and a `timestampNote` instead of `generatedAt`. It also omits the output deck checksum and records why, leaving stable source and SVG checksums as the deterministic comparison surface.

## Generated artifacts

Generated decks, diagrams, and render manifests belong in `dist/` or another ignored output directory. Do not commit generated artifacts unless a release process explicitly asks for them.
