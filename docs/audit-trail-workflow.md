# Plan and storyboard audit trail

Use the plan step before rendering when a deck needs human review or traceability.

```powershell
node src/cli.js plan examples/operational-ai-support.deck.json --out dist/plan --diagrams dist/diagrams --deck-out dist/operational-ai-support.pptx
```

The command writes:

- `render-plan.json` — deterministic JSON with manifest metadata, resolved output paths, expected artifacts, theme summary, slide list, diagram references, and warnings.
- `storyboard.md` — markdown review copy with slide titles, headlines, diagram references, speaker notes, and warnings.

Recommended workflow:

1. Run `npm run plan:example` or the equivalent `presentationkit plan` command for your manifest.
2. Review `storyboard.md` and warnings before generating visual assets.
3. Run `presentationkit build ... --plan-out dist/plan` to refresh the audit trail immediately before diagram and PPTX generation.

The plan output excludes timestamps and generated IDs so repeated runs with the same manifest and output paths produce stable review artifacts.
