# Source conventions

Source changes should preserve the manifest-driven boundary: data lives in deck manifests, validation guards the shape, and render modules turn accepted manifest fields into diagrams or slides.

## Routing

- CLI argument behavior: `cli.js`.
- Deck manifest loading helpers: `manifest.js`.
- Manifest warnings and hard failures: `validate.js`.
- PPTX slide composition: `deck.js`.
- SVG diagram rendering: `diagrams.js`.
- Shared layout primitives and aspect-ratio fitting: `layout.js`.
- Theme defaults and color/font mapping: `theme.js`.

## Code guidance

- Keep rendering functions deterministic from manifest input plus explicit output paths.
- Prefer adding validation warnings before render-time surprises.
- Preserve aspect ratios for screenshots, diagrams, and generated visuals.
- Keep dependencies small; check `package.json` before introducing new packages.
- Run `npm run check` for any source change, and `npm run smoke` when render output may change.
