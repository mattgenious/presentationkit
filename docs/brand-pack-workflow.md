# Authorized brand-pack workflow

PresentationKit can prepare a deck for a private brand-specific companion skill without absorbing that skill's proprietary assets or instructions.

Use `brandPack` in a manifest when a generated deck must be finalized through an authorized external brand workflow. The companion is a post-build brand/QA layer, not a replacement for PresentationKit's generator:

```json
{
  "brandPack": {
    "kind": "presentation-brand-pack",
    "id": "private-brand-companion",
    "companionSkill": "local-brand-powerpoint-skill",
    "brandPackManifest": "local-brand-powerpoint-skill/brand-pack.json",
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

## Recognizable companion shape

PresentationKit remains brand-neutral. Agents and companion workflows can recognize an external folder as a presentation brand pack when it contains a `brand-pack.json` file shaped like this:

```json
{
  "kind": "presentation-brand-pack",
  "id": "example-presentation-brand",
  "displayName": "Example Presentation Brand",
  "skill": "SKILL.md",
  "slideSize": { "width": 13.333, "height": 7.5, "unit": "in" },
  "template": "reference/Brand_Template.potx",
  "assets": ["assets/", "reference/"],
  "requiredChecks": [
    "Speaker notes preserved or added on every slide.",
    "Finished deck rendered to PDF or slide images.",
    "Every slide inspected for margins, alignment, overflow, clipped text, placeholder remnants, footer, page numbers, and brand chrome."
  ]
}
```

The companion folder may be installed by any private plugin, package manager, local checkout, or internal distribution process. PresentationKit only needs the manifest-level pointer; it does not need to know how the brand pack was installed.

Recommended companion folder:

```text
brand-presentation-skill/
  SKILL.md
  brand-pack.json
  reference/
    Brand_Template.potx
    template_slides/
    template_fonts/
  assets/
    logo.png
    icons/
  helpers/
```

If `brandPack.kind` is `presentation-brand-pack` and `brandPack.companionSkill` points at a folder, agents should first look for `brand-pack.json` in that folder. Use `brandPack.brandPackManifest` only when the manifest is not at the default location.

## Handoff artifacts

Generate these from PresentationKit before invoking an optional brand companion. If these artifacts do not exist yet, build with PresentationKit first instead of starting a custom companion generator:

```sh
presentationkit build path/to/deck.json --out dist/deck.pptx --diagrams dist/diagrams --manifest-out dist/render-manifest.json --plan-out dist/plan --qa-out dist/qa --deterministic
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
6. Render every finished slide to images and inspect the images as an open critique: what looks wrong, off-brand, unfinished, or improvable?
7. If the companion edits the PPTX, verify the final edited file opens/renders without repair or invalid-file warnings.
8. Export component/group crops and a component manifest for the final rendered artifact; full-slide-only evidence is incomplete.
9. Use judgement before examples: flag anything ugly, awkward, amateur, weirdly spaced, hard to read, or likely to distract the presenter even if no named check covers it.
10. Treat card chrome, list/text rhythm, margin, alignment, contrast, wrapping, clipped text, overlaps, placeholder remnants, stretched assets, and missing brand chrome as minimum examples, not the full review scope.
11. Use an independent visual reviewer or subagent for the final rendered artifact; the deck-builder's manual scan is not enough.
12. Re-render changed slides/components after fixes and inspect the final merged deck, not only the standalone section.

## Private brand companion use

If you have access to a private brand-specific PowerPoint companion skill, treat it as the brand authority and keep it outside PresentationKit. Reference it through `brandPack.companionSkill`, provide the handoff artifacts above, and let that skill own brand-specific templates, fonts, colors, logos, icons, layout primitives, footer rules, and internal context.
