export const presentationIntents = Object.freeze([
  {
    id: 'technical-capability-proof',
    title: 'Technical capability proof',
    useWhen: [
      'You need to prove a working capability exists and is safe to extend.',
      'The audience must see artifacts, system boundaries, guardrails, and limits.'
    ],
    wrongWhen: [
      'The work is still speculative and cannot show real artifacts.',
      'The goal is broad strategy rather than evidence-backed implementation confidence.'
    ],
    structure: ['context', 'capability architecture', 'proof artifacts', 'guardrails', 'next expansion'],
    proof: ['working demo outputs', 'architecture map', 'audit trail', 'known limitations'],
    visual: ['artifact thumbnails', 'before/after flow', 'guardrail band', 'evidence callouts']
  },
  {
    id: 'roadmap-story',
    title: 'Roadmap story',
    useWhen: [
      'You need to align stakeholders around sequenced investment or delivery.',
      'The audience needs the why-now, dependency chain, and decision points.'
    ],
    wrongWhen: [
      'The deck is being used to claim completed delivery.',
      'Dates are uncertain and would be misread as committed milestones.'
    ],
    structure: ['current state', 'strategic bets', 'phased roadmap', 'decision gates', 'success signals'],
    proof: ['dependency map', 'capacity assumptions', 'risk register', 'decision log'],
    visual: ['horizon timeline', 'swimlanes', 'dependency arrows', 'option comparison cards']
  },
  {
    id: 'incident-postmortem',
    title: 'Incident postmortem',
    useWhen: [
      'You need to explain what happened, why it happened, and what changed.',
      'The audience expects blameless accountability and concrete prevention work.'
    ],
    wrongWhen: [
      'The incident is still active and facts are not yet stable.',
      'The goal is persuasion rather than operational learning.'
    ],
    structure: ['impact summary', 'timeline', 'root causes', 'detection and response', 'corrective actions'],
    proof: ['timestamped events', 'monitoring evidence', 'customer or operator impact', 'action owners'],
    visual: ['timeline spine', 'cause tree', 'containment status', 'action tracker']
  },
  {
    id: 'system-architecture-overview',
    title: 'System architecture overview',
    useWhen: [
      'You need to orient teams around system responsibilities and integration seams.',
      'The deck should make interfaces, constraints, and ownership legible.'
    ],
    wrongWhen: [
      'The audience needs implementation-level API documentation.',
      'The architecture is changing too quickly for a stable overview.'
    ],
    structure: ['mission and scope', 'component map', 'data/control flow', 'constraints', 'operating model'],
    proof: ['source-of-truth links', 'interface contracts', 'runtime topology', 'ownership model'],
    visual: ['layered architecture', 'context diagram', 'sequence slice', 'ownership badges']
  },
  {
    id: 'research-findings-brief',
    title: 'Research findings brief',
    useWhen: [
      'You need to compress research into decisions, implications, and next tests.',
      'The audience needs confidence in method and traceability without reading all sources.'
    ],
    wrongWhen: [
      'The audience expects raw literature review detail.',
      'Findings are anecdotal and not ready to influence a decision.'
    ],
    structure: ['question', 'method', 'findings', 'confidence and caveats', 'recommendations'],
    proof: ['source table', 'evidence grading', 'counterexamples', 'open questions'],
    visual: ['finding cards', 'confidence matrix', 'source map', 'recommendation ladder']
  },
  {
    id: 'executive-decision-brief',
    title: 'Executive decision brief',
    useWhen: [
      'You need a decision from senior stakeholders.',
      'The trade-offs can be explained with options, risks, and recommended action.'
    ],
    wrongWhen: [
      'The decision owner or decision criteria are unclear.',
      'The deck is really a status update.'
    ],
    structure: ['decision needed', 'options', 'recommendation', 'risks and mitigations', 'ask'],
    proof: ['decision criteria', 'cost/benefit assumptions', 'risk evidence', 'stakeholder input'],
    visual: ['option scorecard', 'risk heatmap', 'recommendation banner', 'ask card']
  },
  {
    id: 'metric-defensibility-review',
    title: 'Metric defensibility review',
    useWhen: [
      'You need to present metrics without overstating causality or precision.',
      'The audience needs to understand signal quality and caveats.'
    ],
    wrongWhen: [
      'Metrics have not been sourced or reconciled.',
      'The deck is intended to make SLA claims from proxy data.'
    ],
    structure: ['metric intent', 'source and calculation', 'signal quality', 'caveats', 'decision use'],
    proof: ['calculation lineage', 'sample size', 'exclusions', 'known bias'],
    visual: ['lineage chain', 'confidence badge', 'caveat strip', 'metric card']
  },
  {
    id: 'enablement-training',
    title: 'Enablement training',
    useWhen: [
      'You need learners to adopt a repeatable workflow or operating practice.',
      'The deck should pair concepts with exercises and checks.'
    ],
    wrongWhen: [
      'The goal is a one-way status briefing.',
      'The workflow is not stable enough to teach as a standard practice.'
    ],
    structure: ['learning goal', 'mental model', 'guided example', 'practice', 'checklist'],
    proof: ['worked example', 'practice artifact', 'rubric', 'common pitfalls'],
    visual: ['step cards', 'do/don’t pairs', 'exercise worksheet', 'completion checklist']
  }
]);

export const PRESENTATION_INTENT_IDS = Object.freeze(presentationIntents.map((intent) => intent.id));

export function getPresentationIntent(id) {
  return presentationIntents.find((intent) => intent.id === id);
}

function bullets(items, indent = '  ') {
  return items.map((item) => `${indent}- ${item}`).join('\n');
}

export function formatPresentationIntent(intent) {
  return [
    `${intent.id} — ${intent.title}`,
    'Use when:',
    bullets(intent.useWhen),
    'Wrong when:',
    bullets(intent.wrongWhen),
    `Structure: ${intent.structure.join(' → ')}`,
    `Proof: ${intent.proof.join(', ')}`,
    `Visual guidance: ${intent.visual.join(', ')}`
  ].join('\n');
}

export function formatPresentationIntents(intents = presentationIntents) {
  return intents.map(formatPresentationIntent).join('\n\n');
}
