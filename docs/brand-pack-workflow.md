# Authorized brand-pack workflow

PresentationKit can prepare a deck for a private brand-specific companion skill without absorbing that skill's proprietary assets or instructions.

Use `brandPack` in a manifest when a generated deck must be finalized through an authorized external brand workflow:

```json
{
  "brandPack": {
    "id": "private-brand-companion",
    "companionSkill": "local-brand-powerpoint-skill",
    "templateReference": "external template or reference deck path",
    "slideSize": { "width": 13.333, "height": 7.5, "unit": "in" },
    "requiredChecks": [
      "Official template/reference inspected before editing.",
      "Every slide maps to an approved layout family.",
      "Logo, footer, page numbering, speaker notes, fonts, colors, imagery, and icon style verified by the companion skill.",
      "Final merged deck rendered and inspected slide by slide."
    ]
  }
}
```

Keep the actual template, fonts, logos, photography, icons, palette constants, confidential footer text, internal org facts, and helper implementation in the external brand skill or template repository. This repository should only record the handoff contract.

## Handoff artifacts

Generate these from PresentationKit before invoking the brand companion:

```powershell
node src/cli.js build path/to/deck.json --out dist/deck.pptx --diagrams dist/diagrams --manifest-out dist/render-manifest.json --plan-out dist/plan --qa-out dist/qa --deterministic
```

Pass the companion skill:

- `dist/deck.pptx`
- `dist/plan/storyboard.md`
- `dist/qa/presentation-qa.md`
- `dist/render-manifest.json`
- generated diagrams or slide images when available
- the external template/reference deck path

## Companion expectations

The brand companion should:

1. Ground itself in the authorized template/reference deck before making design decisions.
2. Confirm target slide size before creating or merging slides.
3. Map each PresentationKit slide to a deliberate approved layout family instead of repeating one generic layout.
4. Apply brand-owned typography, palette, logo/chrome, legal footer rules, and approved imagery from the external pack.
5. Preserve or add speaker notes for every slide.
6. Render every finished slide to images and inspect the images for margin, alignment, contrast, wrapping, clipped text, overlaps, placeholder remnants, stretched assets, and missing brand chrome.
7. Re-render changed slides after fixes and inspect the final merged deck, not only the standalone section.

## Private brand companion use

If you have access to a private brand-specific PowerPoint companion skill, treat it as the brand authority and keep it outside PresentationKit. Reference it through `brandPack.companionSkill`, provide the handoff artifacts above, and let that skill own brand-specific templates, fonts, colors, logos, icons, layout primitives, footer rules, and internal context.
