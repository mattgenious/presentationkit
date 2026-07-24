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

6. Render the built PPTX and run first-version visual QA before calling the deck ready. The required evidence bundle has:
   - high-resolution full-slide images,
   - padded component and group crops for every logical component/group,
   - a visible component-bound rectangle inside each padded crop,
   - labeled overlays and bounds-only overlays,
   - contact sheets for sibling comparison,
   - a component manifest tying crop IDs to slides, bounds, expected text, and helper/source,
   - an independent visual review report from a fresh-eyes reviewer or subagent.
   For agent-generated decks, use an independent visual reviewer or subagent; the deck-builder's own manual scan, OpenXML validation, COM open, or contact sheet alone is not enough to pass visual QA.
7. If you need extra visual QA, brand finalization, or template merging, hand these artifacts to a generic or brand-specific PPTX skill after the PresentationKit build:
   - generated `.pptx`,
   - `dist/plan/storyboard.md`,
   - `dist/qa/presentation-qa.md`,
   - `dist/render-manifest.json`,
   - generated slide/diagram images if available.
8. If the companion edits the PPTX, verify the final edited file opens/renders without repair or invalid-file warnings. Visual QA evidence must come from an independent component-bundle review of that final artifact, not only the pre-companion PresentationKit output.
9. Record the first-version visual QA evidence in the QA gate:
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

Task:
Find what is wrong or could be improved before deciding whether this deck is ready. Use your own visual judgement; do not limit the review to named checklist items. For each meaningful issue, name the slide/crop, explain why it hurts the audience or presenter, and propose a concrete fix. If nothing material is wrong, say what you inspected and why the deck looks presentation-ready.

Minimum evidence to inspect:
- Text extraction vs. storyboard for missing slides, stale placeholders, wrong ordering, or repeated claims.
- Final rendered slide images, not just source files.
- Component/group crops for every logical component/group, confirmed against full slides or overlays.
- Brand/template completeness when used: no empty frames, hidden placeholders, orphaned icons, unused layout slots, or missing chrome.
- Final PPTX open/render status if a companion or Office automation edited the file.
- Fresh-eyes/subagent findings from someone/something other than the deck-builder.
- Re-rendered affected slide/component images after fixes.

Examples to consider, not the review boundary: overlapping objects, clipped text, accidental wrapping, stretched assets, low contrast, cramped spacing, inconsistent alignment, card chrome/rounded-corner mismatches, weak typography rhythm, icon/text collisions, unclear dominant messages, and full-slide-only evidence being treated as a pass.

Return:
- Slide-by-slide findings.
- Blocking fixes before presentation use.
- Non-blocking polish suggestions.
- Whether a second visual pass found no new issues, with the evidence inspected.
```

## Template intake

When an existing `.pptx` template is involved, inspect it before generating or editing content:

1. Create a visual inventory of available layouts.
2. Map each manifest slide to a deliberate layout; vary layouts by content type.
3. Prefer layout families that match the story: proof artifacts, diagrams, metrics, timelines, comparisons, or decision asks.
4. Remove unused template elements entirely when the source content has fewer items than the layout expects.
5. Re-run visual QA after any text-length change because wrapping can move decorative elements into content.

## PresentationKit QA expectations

`presentationkit qa/review` writes a PPTX production QA section into the Markdown report and keeps the first-version visual QA gate pending until evidence is recorded. Treat it as an open critique brief plus minimum evidence requirements, or as the handoff between PresentationKit and a `.pptx` inspection skill when one is used.
