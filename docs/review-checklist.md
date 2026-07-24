# Review checklist

Use this before opening a PresentationKit PR.

## Intent and scope

- [ ] The change has one clear target and does not broaden into unrelated cleanup.
- [ ] The deck feature or doc change supports a specific audience outcome.
- [ ] Brand-neutral wording is preserved; no private names, credentials, screenshots, or proprietary metrics were added.

## Manifest surface

- [ ] New or changed manifest fields are represented in `schemas/deck.schema.json`.
- [ ] `src/validate.js` gives useful errors or warnings for fields that can break story quality or rendering.
- [ ] Any `brandPack` usage references an external authorized companion/template and does not commit private brand assets or rules.
- [ ] Example manifest changes still validate with `npm run check`.

## Render surface

- [ ] Slide composition preserves the context/proof/ambition story shape.
- [ ] Diagrams, screenshots, and visual assets preserve aspect ratio and readability.
- [ ] Guardrails and caveats appear close to the capability or metric they constrain.
- [ ] Rendering changes were checked with `npm run render:example`, `npm run build:example`, or `npm run smoke`.

## Quality surface

- [ ] Titles, headlines, labels, captions, and speaker notes do not repeat the same claim unnecessarily.
- [ ] Metrics are framed defensibly using `docs/metric-defensibility-template.md`.
- [ ] Slide strategy choices can be traced to `docs/story-strategy-template.md`.
- [ ] First-version visual QA is still pending for unreviewed generated decks, or it is passed with an evidence path/report.
- [ ] Generated `.pptx` output has a visual QA plan using `docs/companion-pptx-skill-workflow.md` when the task involves final deck delivery; companion skills are optional, not required for core PresentationKit output.
- [ ] Brand-specific decks include `docs/brand-pack-workflow.md` handoff artifacts and final visual QA from the authorized companion skill; the companion did not replace the PresentationKit build without a documented limitation, and any final companion-edited PPTX opens/renders cleanly.
- [ ] Generated `dist/` artifacts were left out of the commit unless explicitly requested.
