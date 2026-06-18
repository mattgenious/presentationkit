# Presentation intent map

PresentationKit decks should declare a clear communication intent before choosing slide structure or visuals. The intent taxonomy below keeps generated decks from collapsing into one generic three-act story.

## Intent taxonomy

| Intent | Use when | Wrong when | Structure guidance | Proof guidance | Visual guidance |
|---|---|---|---|---|---|
| `technical-capability-proof` | Prove a working capability exists and is safe to extend. | Work is speculative or lacks real artifacts. | Context → capability architecture → proof artifacts → guardrails → next expansion. | Show demo outputs, architecture, audit trail, and limits. | Use artifact thumbnails, before/after flow, guardrail bands, and evidence callouts. |
| `roadmap-story` | Align stakeholders around sequenced delivery or investment. | The deck could be mistaken for completed delivery or committed dates. | Current state → bets → phases → decision gates → success signals. | Show dependency maps, capacity assumptions, risks, and decision logs. | Use horizon timelines, swimlanes, dependency arrows, and option cards. |
| `incident-postmortem` | Explain what happened, why it happened, and what changed. | Facts are still unstable or the incident is active. | Impact → timeline → causes → detection/response → corrective actions. | Show timestamped events, monitoring evidence, impact, and action owners. | Use timeline spines, cause trees, containment status, and action trackers. |
| `system-architecture-overview` | Orient teams around responsibilities, interfaces, and constraints. | The audience needs implementation-level API documentation. | Mission/scope → component map → flow → constraints → operating model. | Show source links, contracts, topology, and ownership. | Use layered diagrams, context diagrams, sequence slices, and ownership badges. |
| `research-findings-brief` | Compress research into decisions, implications, and next tests. | Findings are anecdotal or not decision-ready. | Question → method → findings → confidence/caveats → recommendations. | Show source tables, evidence grades, counterexamples, and open questions. | Use finding cards, confidence matrices, source maps, and recommendation ladders. |
| `executive-decision-brief` | Ask senior stakeholders for a concrete decision. | The decision owner or criteria are unclear. | Decision needed → options → recommendation → risks/mitigations → ask. | Show decision criteria, assumptions, risk evidence, and stakeholder input. | Use option scorecards, risk heatmaps, recommendation banners, and ask cards. |
| `metric-defensibility-review` | Present metrics while preserving caveats and signal quality. | Proxy data would be misread as SLA-grade truth. | Metric intent → source/calculation → signal quality → caveats → decision use. | Show lineage, sample size, exclusions, and known bias. | Use lineage chains, confidence badges, caveat strips, and metric cards. |
| `enablement-training` | Teach a repeatable workflow or operating practice. | The workflow is unstable or the deck is only a status briefing. | Learning goal → mental model → guided example → practice → checklist. | Show worked examples, practice artifacts, rubrics, and pitfalls. | Use step cards, do/don’t pairs, worksheets, and checklists. |

Run `node src/cli.js list-intents` to print the same taxonomy from the package.

## Generation invariants

1. Every deck should optimize for one primary intent. Secondary intents belong in notes or follow-up material, not the core slide sequence.
2. Intent controls structure before visuals. Do not start by choosing a diagram if the deck's decision or proof need is unclear.
3. Proof must match the claim. A capability proof needs artifacts; a roadmap needs assumptions and dependencies; a postmortem needs evidence and owners.
4. Visuals must reduce ambiguity. Dense screenshots, decorative diagrams, or generic icons are not proof.
5. Caveats are part of the story. Limits, confidence, and wrong-use warnings should stay visible when they affect interpretation.

## Adoption policy

- New intents should be added when they change slide structure, proof expectations, or visual guidance; do not add synonyms.
- New slide or diagram renderers should register through the renderer registry rather than extending command-level conditionals.
- Manifest authors may add `metadata.intent` to document the intended taxonomy entry. Unknown intent values should be treated as warnings until schema validation becomes stricter.
- Existing decks remain valid. Intent adoption should be incremental and should not break the example build.
