# Presentation quality rubric

Use this rubric before a generated deck is shared for review. It complements schema validation by checking whether the deck is ready to defend in front of an audience.

## Readiness levels

| Level | Meaning | Ship decision |
|---|---|---|
| Ready | No blocking findings; only informational notes remain. | Safe to send to a reviewer or presenter. |
| Review | No blocking findings, but warnings need a human judgement call. | Review warnings before presenting. |
| Needs work | One or more errors mean the deck is incomplete or misleading. | Fix before sharing. |

`presentationkit qa/review` keeps a first generated deck at **Review** until the
first-version visual QA gate is passed with final component-bundle evidence. Use
**Ready** only after full slides, component/group crops, a component manifest,
and an independent visual review report have been recorded.

## Rubric

1. **Story completeness**
   - The manifest has at least one slide and every slide has a clear title.
   - Each slide has a headline or supporting line that states the point.
   - The slide count matches the intended story shape rather than becoming an appendix dump.

2. **Presenter intent**
   - Every slide has speaker notes.
   - Notes explain what the presenter should say, not just repeat slide text.
   - Transitions make the context → proof → ambition progression clear.

3. **Proof and guardrails**
   - Proof slides include concrete proof artifacts.
   - Guardrail language is visible on the proof slide before any scaling or ambition claim.
   - Proof artifacts describe what evidence exists and how it was reviewed.

4. **Metric defensibility**
   - Metrics include a source, caveat, assumption, or confidence statement.
   - Productivity indicators are not presented as operational SLA claims.
   - Estimates are labelled as estimates and tied to the measurement method.

5. **Visual readiness**
   - Referenced diagrams exist in the manifest.
   - Unused diagrams are removed or intentionally documented.
   - Aspect-ratio metadata is available when the renderer or manifest can provide it.

6. **PPTX production readiness**
   - An independent reviewer first made a holistic visual judgement and flagged anything ugly, awkward, amateur, weirdly spaced, or hard to read, even if not covered by a specific checklist item.
   - The generated `.pptx` has been text-extracted and compared with the storyboard.
   - Rendered slide images have been inspected for overlaps, clipping, contrast, spacing, alignment, and stretched assets.
   - Component and group crops exist for each logical component/group and are paired with full-slide images, overlays, and contact sheets so relational layout defects are still visible.
   - Card chrome is inspected in crops: borders, fills, accent bars, and rounded corners line up cleanly.
   - List/text cards have intentional title/body insets, line spacing, readable type, and balanced vertical space use.
   - Icon cards and compact callouts keep titles and body text clear of the icon column.
   - Template or brand-specific companion work has no leftover placeholders, empty frames, or orphaned visuals.
   - Any visual fix was followed by re-rendering and re-checking affected slides.

7. **Authorized brand-pack readiness**
   - `brandPack` references the external companion skill or template owner that is authorized to apply private brand rules.
   - Brand-specific template, fonts, logo/chrome, footer/legal rules, image/icon library, and layout primitives are not committed to PresentationKit.
   - Final QA inspected the branded or merged deck, not only the neutral PresentationKit draft.

## CLI quality gate

Run:

```sh
npm run qa:example
```

or:

```sh
presentationkit qa/review path/to/deck.json --out dist/qa
```

The command writes Markdown and JSON artifacts that can be attached to a review or kept with generated deck outputs.

The first-version visual QA gate can be passed from a reviewed component visual
QA bundle:

```sh
presentationkit qa/review path/to/deck.json --out dist/qa --first-version-visual-qa passed --visual-qa-evidence dist/visual-qa
```

Use `--require-first-version-visual-qa` to make the pending gate a hard failure
for delivery scripts. With `passed`, the evidence path must be a directory with
full-slide renders, component/group crops, a component manifest, and an
independent visual review report.

Use `docs/companion-pptx-skill-workflow.md` when optional visual QA, template merging, or a private brand-specific presentation skill is part of final delivery. Use `docs/brand-pack-workflow.md` when the manifest includes `brandPack`.
