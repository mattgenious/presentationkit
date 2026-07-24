# Companion PPTX skill workflow

PresentationKit is the source-of-truth layer for manifest-driven deck generation and can build a complete `.pptx` on its own. A generic `.pptx` skill, local Office workflow, or brand-specific companion skill is optional and should sit after it as an inspection, template, and visual QA layer when final delivery needs that extra pass. Do not replace the PresentationKit build with a custom `pptxgenjs`/OpenXML generator unless a specific PresentationKit limitation is documented first.

Do not copy proprietary skill instructions, scripts, assets, templates, or brand rules into this repository. Keep this repo brand-neutral and record only reusable workflow boundaries.

## Division of responsibility

| Layer | Owns | Should not own |
|---|---|---|
| PresentationKit | Manifest schema, story intent, diagram data, generated SVGs, PPTX generation, render plan, QA markdown, render manifest. | Private brand templates, confidential imagery, one-off presentation content. |
| Generic PPTX skill | Reading existing `.pptx` files, extracting text, creating slide thumbnails/images, inspecting visual output, editing generated decks when needed. | PresentationKit manifest semantics or repo source changes. |
| Brand-specific companion skill | Brand colors, template rules, typography, approved layouts, logo placement, legal/compliance constraints. | Generic PresentationKit behavior, replacement deck generation, or non-public content committed to this repo. |

## Recommended deck build loop

1. Pick a presentation intent with `presentationkit list-intents`.
2. Draft or update the manifest and run `presentationkit inspect <deck.json>`.
3. Generate a plan before building:

   ```sh
   presentationkit plan <deck.json> --out dist/plan --diagrams dist/diagrams --deck-out dist/deck.pptx
   ```

4. Run preflight and QA:

   ```sh
   presentationkit preflight <deck.json> --diagrams dist/diagrams
   presentationkit qa/review <deck.json> --out dist/qa
   ```

5. Build the PPTX with traceability artifacts:

   ```sh
   presentationkit build <deck.json> --out dist/deck.pptx --diagrams dist/diagrams --manifest-out dist/render-manifest.json --plan-out dist/plan --qa-out dist/qa --deterministic
   ```

6. Render the built PPTX and run first-version visual QA before calling the deck ready. Prefer a bundle with:
   - high-resolution full-slide images,
   - padded component and group crops when geometry is available,
   - a visible component-bound rectangle inside each padded crop,
   - labeled overlays and bounds-only overlays,
   - contact sheets for sibling comparison.
7. If you need extra visual QA, brand finalization, or template merging, hand these artifacts to a generic or brand-specific PPTX skill after the PresentationKit build:
   - generated `.pptx`,
   - `dist/plan/storyboard.md`,
   - `dist/qa/presentation-qa.md`,
   - `dist/render-manifest.json`,
   - generated slide/diagram images if available.
8. Record the first-version visual QA evidence in the QA gate:
   ```sh
   presentationkit qa/review <deck.json> --out dist/qa --first-version-visual-qa passed --visual-qa-evidence <visual-qa-bundle-or-report>
   ```

## Companion-skill inspection brief

Use this brief with any authorized `.pptx` skill or visual reviewer:

```text
Inspect the generated presentation as a bug hunt, not a confirmation pass.

Inputs:
- PPTX: <path>
- Storyboard: <path>
- QA report: <path>
- Render manifest: <path>
- Visual QA bundle/report: <path>

Check:
1. Text extraction matches the storyboard: no missing slides, stale placeholders, wrong ordering, or repeated claims.
2. Rendered slide images have no overlapping objects, clipped text, accidental wrapping, stretched assets, low contrast, cramped spacing, or inconsistent alignment.
3. Component and group crops are checked for local defects, but every finding is confirmed against the full slide or overlay.
4. Icon cards and compact callouts reserve a clear icon column; body text does not start under or run through icons.
5. Every slide has a deliberate visual element and a clear dominant message.
6. Template or brand-specific elements are complete: no empty frames, hidden placeholders, orphaned icons, or unused layout slots.
7. Any fix is followed by re-rendering the affected slide images and re-checking them.

Return:
- Slide-by-slide findings.
- Blocking fixes before presentation use.
- Non-blocking polish suggestions.
- Whether a second visual pass found no new issues.
```

## Template intake

When an existing `.pptx` template is involved, inspect it before generating or editing content:

1. Create a visual inventory of available layouts.
2. Map each manifest slide to a deliberate layout; vary layouts by content type.
3. Prefer layout families that match the story: proof artifacts, diagrams, metrics, timelines, comparisons, or decision asks.
4. Remove unused template elements entirely when the source content has fewer items than the layout expects.
5. Re-run visual QA after any text-length change because wrapping can move decorative elements into content.

## PresentationKit QA expectations

`presentationkit qa/review` writes a PPTX production QA section into the Markdown report and keeps the first-version visual QA gate pending until evidence is recorded. Treat it as a standalone visual QA checklist, or as the handoff checklist between PresentationKit and a `.pptx` inspection skill when one is used.
