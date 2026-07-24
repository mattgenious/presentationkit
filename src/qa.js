import fs from 'node:fs/promises';
import path from 'node:path';
import { diagramAspectRatio as rendererDiagramAspectRatio } from './diagrams.js';
import { validateManifest } from './validate.js';

const slideDiagramFields = ['processDiagram', 'footprintDiagram', 'architectureDiagram', 'ambitionDiagram', 'diagram'];
const slideMetricTextFields = ['title', 'headline', 'supportingLine', 'closingLine'];

const defaultDiagramBySlideType = {
  context: ['processFlow', 'footprint'],
  proof: ['architecture'],
  ambition: ['ambition']
};

const builtInDiagramRatios = {
  processFlow: { width: 1600, height: 440, ratio: 1600 / 440, source: 'renderer default' },
  footprint: { width: 1600, height: 520, ratio: 1600 / 520, source: 'renderer default' },
  architecture: { width: 1600, height: 900, ratio: 1600 / 900, source: 'renderer default' },
  ambition: { width: 3000, height: 980, ratio: 3000 / 980, source: 'renderer default' }
};

const metricNamePattern = /metric|kpi|sla|saving|savings|efficiency|productivity|hours?|days?|minutes?|percent|percentage|%|roi|cost|duration/i;
const metricValuePattern = /\b\d+(?:[.,]\d+)?\s*(?:%|percent|hours?|hrs?|days?|minutes?|mins?|x|k|m|€|\$|£)\b/i;
const caveatKeyPattern = /caveat|limitation|assumption|source|method|confidence|defensible|defensibility|basis|proxy/i;

function toArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function asText(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function addFinding(findings, level, code, message, details = {}) {
  findings.push({ level, code, message, ...details });
}

function mdCell(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function summarizeBrandPack(manifest) {
  const value = manifest?.brandPack;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return {
    id: value.id ?? value.name ?? 'external-brand-pack',
    kind: value.kind ?? '',
    companionSkill: value.companionSkill ?? value.skill ?? '',
    brandPackManifest: value.brandPackManifest ?? '',
    templateReference: value.templateReference ?? value.templatePath ?? value.template ?? '',
    slideSize: value.slideSize ?? undefined,
    requiredChecks: Array.isArray(value.requiredChecks) ? value.requiredChecks : []
  };
}

function normalizeArray(value) {
  if (value === undefined || value === null) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.map((entry) => String(entry ?? '').trim()).filter(Boolean);
}

function normalizeFirstVersionVisualQa(manifest, options = {}) {
  const manifestGate =
    manifest?.qa?.firstVersionVisualQa ??
    manifest?.qualityGates?.firstVersionVisualQa ??
    {};
  const optionGate = options.firstVersionVisualQa ?? {};
  const rawStatus = optionGate.status ?? manifestGate.status ?? manifestGate.state ?? 'pending';
  const status = ['pending', 'passed', 'waived'].includes(String(rawStatus).toLowerCase())
    ? String(rawStatus).toLowerCase()
    : 'pending';
  const evidence = [
    ...normalizeArray(manifestGate.evidence),
    ...normalizeArray(manifestGate.report),
    ...normalizeArray(manifestGate.bundle),
    ...normalizeArray(optionGate.evidence)
  ].filter((entry, index, list) => list.indexOf(entry) === index);
  const notes = String(optionGate.notes ?? manifestGate.notes ?? manifestGate.summary ?? '').trim();
  const required = Boolean(options.requireFirstVersionVisualQa);

  let level = 'warning';
  let code = 'first-version-visual-qa-pending';
  let message = 'First-version visual QA gate is pending; render full slides/component crops and record visual judge evidence before declaring the deck ready.';
  let gateStatus = 'pending';

  if (status === 'passed' && evidence.length > 0) {
    level = 'info';
    code = 'first-version-visual-qa-passed';
    message = 'First-version visual QA gate has evidence and is passed.';
    gateStatus = 'passed';
  } else if (status === 'passed') {
    level = required ? 'error' : 'warning';
    code = 'first-version-visual-qa-evidence';
    message = 'First-version visual QA is marked passed but has no evidence path or report; the deck is not ready.';
    gateStatus = 'missing-evidence';
  } else if (status === 'waived') {
    level = required ? 'error' : 'warning';
    code = 'first-version-visual-qa-waived';
    message = 'First-version visual QA was waived; keep the deck in review until a visual pass is run.';
    gateStatus = 'waived';
  } else if (required) {
    level = 'error';
  }

  return {
    status: gateStatus,
    requestedStatus: status,
    required,
    evidence,
    notes,
    finding: {
      level,
      code,
      message,
      evidence,
      notes
    }
  };
}

function renderFirstVersionVisualQaGate(review) {
  const gate = review.checks.firstVersionVisualQa;
  const evidence = gate.evidence.length
    ? gate.evidence.map((entry) => `- ${mdCell(entry)}`).join('\n')
    : '- No visual QA evidence recorded yet.';
  const notes = gate.notes ? `\nNotes: ${mdCell(gate.notes)}\n` : '';

  return `## First-version visual QA gate

Status: **${mdCell(gate.status)}**

This gate must be passed before declaring the first generated version ready. Build the deck, render the final PPTX to full-slide images, create padded component/group crops for every logical component/group, include a component manifest, and record evidence from an independent visual reviewer or subagent. The deck-builder's own manual scan, OpenXML validation, COM open, contact sheet, or full-slide-only export is not enough evidence.

Evidence:

${evidence}
${notes}`;
}

function renderBrandPackChecklist(review) {
  const brandPack = review.checks.brandPack;
  if (!brandPack) return '';
  const slideSize = brandPack.slideSize
    ? `- Target slide size: ${mdCell(JSON.stringify(brandPack.slideSize))}`
    : '- Target slide size: confirm from the external template or target team deck before final editing.';
  const companion = brandPack.companionSkill
    ? `- Companion skill: ${mdCell(brandPack.companionSkill)}`
    : '- Companion skill: not specified; use the authorized brand-specific deck workflow if one exists.';
  const manifest = brandPack.brandPackManifest
    ? `- Brand-pack manifest: ${mdCell(brandPack.brandPackManifest)}`
    : brandPack.companionSkill
      ? '- Brand-pack manifest: look for `brand-pack.json` in the companion skill folder when present.'
      : '- Brand-pack manifest: not specified.';
  const template = brandPack.templateReference
    ? `- Template/reference: ${mdCell(brandPack.templateReference)}`
    : '- Template/reference: not specified; inspect the authorized template before applying brand styling.';
  const requiredChecks = brandPack.requiredChecks.length
    ? brandPack.requiredChecks.map((check) => `- ${mdCell(check)}`).join('\n')
    : '- No custom brand-pack checks listed in the manifest.';

  return `## Authorized brand-pack handoff

Brand pack: **${mdCell(brandPack.id)}**

${companion}
${manifest}
${template}
${slideSize}

Before final delivery, keep brand-owned assets and rules outside this repository and use the authorized companion skill or template owner as the source of truth.

Brand-pack checks:

${requiredChecks}

Review prompts:

1. Did the brand companion inspect the official template/reference deck rather than guessing from memory?
2. Does every generated slide map to a deliberate approved layout family?
3. Are required chrome elements such as logo, legal/confidentiality footer, page numbering, and speaker notes present where the brand pack expects them?
4. Are fonts, colors, imagery, icon style, and section pacing coming from the authorized external pack, not from PresentationKit defaults?
5. If the companion edits the PPTX, does the final edited file open/render without repair or invalid-file warnings?
6. Did the final evidence bundle include component/group crops plus a component manifest, not only full-slide exports?
7. Did an independent visual reviewer or subagent inspect the final rendered artifact, rather than the deck-builder marking their own manual scan as passed?
8. If this section is merged into an existing team deck, did the final merged deck get rendered and inspected rather than only the standalone source deck?
`;
}

function renderPptxProductionChecklist(review) {
  const expectedSlideImages = Array.from({ length: review.checks.slideCount }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return `- Slide image ${number}: confirm the visual matches the manifest title, presenter intent, and expected diagram/proof artifact.`;
  });

  return `## PPTX production QA

Use this section with a generic PPTX inspection skill or any local Office rendering workflow after the PPTX is built.

1. Start with a holistic visual judgement pass: would this look polished and intentional to a tired presenter? Flag anything ugly, awkward, amateur, weirdly spaced, or hard to read even if it is not named below.
2. Extract text from the generated deck and compare it with the manifest/storyboard for missing slides, wrong order, stale placeholders, or repeated claims.
3. Render each slide to a high-resolution image with the same renderer/fonts the presenter will use. Inspect the images, not just the source code.
4. Create padded component/group crops for every logical component/group. Keep a visible rectangle for the actual component bounds so reviewers can distinguish component content from context bleed.
5. Inspect full slides, grouped regions, contact sheets, and component crops. Crops alone are not enough because they miss slide-level balance, gutters, connectors, and reading-order problems.
6. Look for overlaps, clipped text, weak contrast, cramped spacing, inconsistent alignment, stretched assets, or decorative elements that collide with wrapped text.
7. Inspect card chrome in component crops: borders, fills, accent bars, and rounded corners must line up cleanly. A square accent strip that does not meet a rounded card edge is a defect.
8. Inspect text rhythm in list/text cards: title inset, body inset, line spacing, font size/weight, and vertical space use must look intentional. Cramped text at the top with large unused space below is a defect.
9. For icon cards and compact callouts, confirm titles and body text reserve a clear icon column. Text must not start under or run through icons.
10. If a source template or brand-specific companion skill is used, map each slide to a deliberate layout before editing; vary layouts to match content instead of repeating one text-heavy pattern.
11. If a companion or Office automation edits the PPTX, verify the final edited file opens/renders without repair or invalid-file warnings before recording visual QA as passed.
12. Use an independent visual reviewer or subagent for the final rendered artifact. The deck-builder's own manual scan, OpenXML validation, COM open, contact sheet, or full-slide-only export is not enough to pass visual QA.
13. Remove unused template slots, orphaned shapes, and placeholder media rather than leaving empty frames or invisible text behind.
14. Fix issues and re-render the affected slide/component images. Do not treat the first generated deck as final until at least one visual inspection pass has found or consciously ruled out issues.

Expected visual pass:

${expectedSlideImages.length ? expectedSlideImages.join('\n') : '- No slides were found; fix manifest validation first.'}
`;
}

function collectSlideDiagramRefs(slide) {
  const refs = new Set();
  for (const field of slideDiagramFields) {
    for (const value of toArray(slide[field])) {
      if (typeof value === 'string' && value.trim()) refs.add(value.trim());
    }
  }
  if (Array.isArray(slide.diagrams)) {
    for (const value of slide.diagrams) {
      if (typeof value === 'string' && value.trim()) refs.add(value.trim());
    }
  }
  if (refs.size === 0) {
    for (const value of defaultDiagramBySlideType[slide.type] ?? []) refs.add(value);
  }
  return refs;
}

function diagramAspectRatio(diagram, key) {
  const registeredRatio = rendererDiagramAspectRatio(key, diagram);
  if (registeredRatio) return { ratio: registeredRatio, source: 'renderer registry' };
  if (!diagram || typeof diagram !== 'object') return builtInDiagramRatios[key];
  if (Number.isFinite(diagram.aspectRatio)) return { ratio: diagram.aspectRatio, source: 'manifest aspectRatio' };
  if (Number.isFinite(diagram.width) && Number.isFinite(diagram.height) && diagram.height !== 0) {
    return {
      width: diagram.width,
      height: diagram.height,
      ratio: diagram.width / diagram.height,
      source: 'manifest width/height'
    };
  }
  return builtInDiagramRatios[key];
}

function hasCaveat(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, entry]) => {
    if (caveatKeyPattern.test(key) && asText(entry).trim()) return true;
    if (entry && typeof entry === 'object') return hasCaveat(entry);
    return false;
  });
}

function collectMetricCandidates(value, location = 'manifest', candidates = []) {
  if (value === undefined || value === null) return candidates;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectMetricCandidates(entry, `${location}[${index}]`, candidates));
    return candidates;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    const keyText = entries.map(([key]) => key).join(' ');
    const valueText = entries.map(([, entry]) => asText(entry)).join(' ');
    const looksMetric = metricNamePattern.test(keyText) || metricValuePattern.test(valueText);
    if (looksMetric) {
      candidates.push({
        location,
        summary: value.label ?? value.title ?? value.name ?? value.metric ?? value.value ?? valueText.slice(0, 120),
        hasCaveat: hasCaveat(value)
      });
    }
    for (const [key, entry] of entries) {
      collectMetricCandidates(entry, `${location}.${key}`, candidates);
    }
    return candidates;
  }
  if (typeof value === 'string' && metricValuePattern.test(value)) {
    candidates.push({ location, summary: value.slice(0, 120), hasCaveat: false });
  }
  return candidates;
}

function collectSlideMetricText(slides) {
  return slides.flatMap((slide, index) => {
    return slideMetricTextFields.flatMap((field) => {
      const value = slide[field];
      if (typeof value !== 'string' || !metricValuePattern.test(value)) return [];
      return [{
        location: `slides[${index}].${field}`,
        summary: value.slice(0, 120),
        hasCaveat: hasCaveat(slide)
      }];
    });
  });
}

function summarize(findings) {
  const counts = { error: 0, warning: 0, info: 0 };
  for (const finding of findings) counts[finding.level] += 1;
  return {
    status: counts.error > 0 ? 'needs-work' : counts.warning > 0 ? 'review' : 'ready',
    counts
  };
}

export function reviewManifest(manifest, options = {}) {
  const findings = [];
  const validation = validateManifest(manifest);
  for (const error of validation.errors) addFinding(findings, 'error', 'manifest-schema', error);
  for (const warning of validation.warnings) addFinding(findings, 'warning', 'manifest-warning', warning);
  const firstVersionVisualQa = normalizeFirstVersionVisualQa(manifest, options);
  addFinding(
    findings,
    firstVersionVisualQa.finding.level,
    firstVersionVisualQa.finding.code,
    firstVersionVisualQa.finding.message,
    {
      evidence: firstVersionVisualQa.finding.evidence,
      notes: firstVersionVisualQa.finding.notes
    }
  );

  const slides = Array.isArray(manifest?.slides) ? manifest.slides : [];
  const diagrams = manifest?.diagrams && typeof manifest.diagrams === 'object' ? manifest.diagrams : {};
  const diagramKeys = new Set(Object.keys(diagrams));
  const usedDiagrams = new Set();
  const aspectRatios = [];

  if (slides.length < (options.minSlides ?? 1)) {
    addFinding(findings, 'error', 'slide-count', `Deck has ${slides.length} slides; expected at least ${options.minSlides ?? 1}.`, {
      slideCount: slides.length
    });
  } else {
    addFinding(findings, 'info', 'slide-count', `Deck has ${slides.length} slides.`, { slideCount: slides.length });
  }

  slides.forEach((slide, index) => {
    const slideLabel = `slides[${index}]`;
    if (!slide.speakerNotes || String(slide.speakerNotes).trim().length < 20) {
      addFinding(findings, 'warning', 'speaker-notes', `${slideLabel} needs useful speaker notes.`, {
        slide: index,
        title: slide.title
      });
    }

    if (slide.type === 'proof') {
      if (!Array.isArray(slide.proofArtifacts) || slide.proofArtifacts.length === 0) {
        addFinding(findings, 'error', 'proof-artifacts', `${slideLabel} is a proof slide without proofArtifacts.`, {
          slide: index,
          title: slide.title
        });
      }
      if (!slide.guardrailLine || String(slide.guardrailLine).trim().length < 12) {
        addFinding(findings, 'error', 'guardrail-line', `${slideLabel} is a proof slide without a clear guardrailLine.`, {
          slide: index,
          title: slide.title
        });
      }
    }

    const refs = collectSlideDiagramRefs(slide);
    for (const key of refs) {
      usedDiagrams.add(key);
      if (!diagramKeys.has(key)) {
        addFinding(findings, 'error', 'missing-diagram', `${slideLabel} references missing diagram "${key}".`, {
          slide: index,
          title: slide.title,
          diagram: key
        });
      } else {
        const ratio = diagramAspectRatio(diagrams[key], key);
        if (ratio) {
          aspectRatios.push({ diagram: key, ...ratio });
        } else {
          addFinding(findings, 'info', 'aspect-ratio-unavailable', `No aspect-ratio metadata is available for diagram "${key}".`, {
            diagram: key
          });
        }
      }
    }
  });

  for (const key of diagramKeys) {
    if (!usedDiagrams.has(key)) {
      addFinding(findings, 'warning', 'unused-diagram', `Diagram "${key}" is defined but not referenced by slides.`, {
        diagram: key
      });
    }
  }

  const metricCandidates = [
    ...collectMetricCandidates(manifest?.metrics, 'manifest.metrics'),
    ...slides.flatMap((slide, index) => collectMetricCandidates(slide.metrics, `slides[${index}].metrics`)),
    ...slides.flatMap((slide, index) => collectMetricCandidates(slide.metric, `slides[${index}].metric`)),
    ...collectSlideMetricText(slides)
  ];
  const metrics = metricCandidates.filter((candidate, index, list) => {
    return list.findIndex((other) => other.location === candidate.location && other.summary === candidate.summary) === index;
  });

  for (const metric of metrics) {
    if (!metric.hasCaveat) {
      addFinding(findings, 'warning', 'metric-caveat', `Metric-like content at ${metric.location} needs a caveat, source, or assumption.`, {
        location: metric.location,
        summary: metric.summary
      });
    }
  }
  if (metrics.length === 0) {
    addFinding(findings, 'info', 'metric-caveats', 'No metric-like claims were detected.');
  }

  if (aspectRatios.length > 0) {
    addFinding(findings, 'info', 'aspect-ratio', `${aspectRatios.length} diagram aspect-ratio entries are available.`, {
      aspectRatios
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    deckTitle: manifest?.metadata?.title ?? 'Untitled deck',
    summary: summarize(findings),
    checks: {
      slideCount: slides.length,
      diagramCount: diagramKeys.size,
      usedDiagrams: Array.from(usedDiagrams).sort(),
      unusedDiagrams: Array.from(diagramKeys).filter((key) => !usedDiagrams.has(key)).sort(),
      metricsDetected: metrics.length,
      aspectRatios,
      firstVersionVisualQa: {
        status: firstVersionVisualQa.status,
        requestedStatus: firstVersionVisualQa.requestedStatus,
        required: firstVersionVisualQa.required,
        evidence: firstVersionVisualQa.evidence,
        notes: firstVersionVisualQa.notes
      },
      brandPack: summarizeBrandPack(manifest)
    },
    findings
  };
}

export function renderReviewMarkdown(review) {
  const rows = review.findings.map((finding) => {
    const detail = finding.diagram ?? finding.location ?? finding.title ?? '';
    return `| ${mdCell(finding.level)} | \`${mdCell(finding.code)}\` | ${mdCell(finding.message)} | ${mdCell(detail)} |`;
  });
  const aspectRows = review.checks.aspectRatios.map((entry) => {
    const dimensions = entry.width && entry.height ? `${entry.width}×${entry.height}` : 'n/a';
    return `| ${mdCell(entry.diagram)} | ${Number(entry.ratio).toFixed(3)} | ${mdCell(dimensions)} | ${mdCell(entry.source)} |`;
  });

  return `# Presentation QA review

Deck: **${review.deckTitle}**
Generated: ${review.generatedAt}
Status: **${review.summary.status}**

## Summary

- Errors: ${review.summary.counts.error}
- Warnings: ${review.summary.counts.warning}
- Info: ${review.summary.counts.info}
- Slides: ${review.checks.slideCount}
- Diagrams defined: ${review.checks.diagramCount}
- Metrics detected: ${review.checks.metricsDetected}

## Findings

| Level | Code | Finding | Detail |
|---|---|---|---|
${rows.length ? rows.join('\n') : '| info | `none` | No findings. | |'}

## Diagram readiness

- Used diagrams: ${review.checks.usedDiagrams.length ? review.checks.usedDiagrams.map((key) => `\`${key}\``).join(', ') : 'none'}
- Unused diagrams: ${review.checks.unusedDiagrams.length ? review.checks.unusedDiagrams.map((key) => `\`${key}\``).join(', ') : 'none'}

| Diagram | Ratio | Dimensions | Source |
|---|---:|---|---|
${aspectRows.length ? aspectRows.join('\n') : '| n/a | n/a | n/a | No aspect-ratio metadata available |'}

## Reviewer prompts

1. Does every slide have a single audience-facing point?
2. Are proof artifacts concrete enough to make the story credible?
3. Are guardrails visible before any ambition or scaling claim?
4. Are metrics clearly caveated as observed, estimated, or directional?
5. Are visuals present, referenced, and ratio-safe?

${renderFirstVersionVisualQaGate(review)}
${renderPptxProductionChecklist(review)}
${renderBrandPackChecklist(review)}
`;
}

export async function writeReviewArtifacts(review, outPath = 'dist/qa') {
  const resolved = path.resolve(outPath);
  const ext = path.extname(resolved).toLowerCase();
  const outDir = ext ? path.dirname(resolved) : resolved;
  const baseName = ext ? path.basename(resolved, ext) : 'presentation-qa';
  const jsonPath = ext === '.json' ? resolved : path.join(outDir, `${baseName}.json`);
  const markdownPath = ext === '.md' ? resolved : path.join(outDir, `${baseName}.md`);

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(jsonPath, `${JSON.stringify(review, null, 2)}\n`, 'utf8');
  await fs.writeFile(markdownPath, renderReviewMarkdown(review), 'utf8');

  return { jsonPath, markdownPath };
}
