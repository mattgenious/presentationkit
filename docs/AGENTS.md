# Documentation conventions

Docs in this folder are the agent-facing operating guide for PresentationKit. Keep them compact, route to existing files, and avoid duplicating long CLI explanations already covered by `README.md`.

## Safe doc edits

- Add durable workflow guidance here when it helps future agents make safe repo changes.
- Keep examples brand-neutral and free of private project names, customer data, credentials, screenshots, or proprietary metrics.
- Prefer checklists and routing tables over long narrative process docs.
- Update `README.md` when adding a new entry-point document that users should discover.

## Verification

For docs-only edits, verify referenced paths and run:

```powershell
npm run check
```
