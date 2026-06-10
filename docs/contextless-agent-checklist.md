# Contextless agent checklist

Use this when implementing deck features without relying on prior session context.

## Understand the deck feature

- [ ] State the audience and the decision, belief, or memory the deck should create.
- [ ] Identify which act the change supports: context, proof, or ambition.
- [ ] Identify the proof artifact, guardrail, or future claim the slide should make clearer.
- [ ] Confirm the change is brand-neutral and safe to publish.

## Choose the edit surface

- [ ] Manifest content only: update `examples/*.deck.json`.
- [ ] New manifest field: update `schemas/deck.schema.json`, `src/validate.js`, and the render consumer together.
- [ ] Diagram behavior: update `src/diagrams.js` and the relevant manifest `diagrams` data.
- [ ] Slide layout or text placement: update `src/deck.js`, `src/layout.js`, or `src/theme.js`.
- [ ] CLI workflow: update `src/cli.js` and README usage.
- [ ] Documentation workflow: update `docs/*.md` and README links if discoverability changes.

## Preserve quality

- [ ] Keep the main claim visible and avoid repeated wording across title, headline, labels, and captions.
- [ ] Preserve aspect ratios for external images and generated visuals.
- [ ] Keep screenshots as evidence thumbnails unless readable at slide size.
- [ ] Put guardrails near the capability they constrain.
- [ ] Label metrics as best-effort when they are productivity proxies, not SLAs.

## Verify

- [ ] Run `npm run check`.
- [ ] Run `npm run render:example` or `npm run smoke` when render output changes.
- [ ] Do not commit generated `dist/` artifacts.
