# Contributing

PresentationKit contributions should keep the project reusable, brand-neutral, and easy to validate.

## Before changing files

- Confirm the requested target and stay within it.
- Check `git status` so unrelated local changes are not disturbed.
- Confirm the personal git identity before committing:

```powershell
git config user.name
git config user.email
```

Expected author: `Matt Jensen <matt.l.p.jensen@gmail.com>`.

## Development setup

```powershell
npm install
npm run check
```

Use `npm run smoke` when changing render, build, CLI, schema, or example manifest behavior.

## Contribution rules

- Keep source of truth in manifests, schemas, code, and docs.
- Do not commit generated `dist/` output, `.pptx` decks, rendered diagrams, private screenshots, credentials, or proprietary content.
- Preserve evidence-first story structure: context, proof, ambition, guardrails, and clear speaker intent.
- Prefer small, reviewable changes over broad rewrites.
- Update docs when adding a user-visible command, manifest field, or workflow.

## Pull request checklist

- The change has a focused scope and clear deck/story intent.
- Relevant manifests validate with `npm run check`.
- Rendering was smoke-tested if output behavior changed.
- Review checklist in `docs/review-checklist.md` has been applied.
- Commit includes the requested co-author trailer when work is agent-assisted.
