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

function renderPptxProductionChecklist(review) {
  const expectedSlideImages = Array.from({ length: review.checks.slideCount }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return `- Slide image ${number}: confirm the visual matches the manifest title, presenter intent, and expected diagram/proof artifact.`;
  });

  return `## PPTX production QA

Use this section with a generic PPTX inspection skill or any local Office rendering workflow after the PPTX is built.

1. Extract text from the generated deck and compare it with the manifest/storyboard for missing slides, wrong order, stale placeholders, or repeated claims.
2. Render each slide to an image and inspect the images, not just the source code. Look for overlaps, clipped text, weak contrast, cramped spacing, inconsistent alignment, stretched assets, or decorative elements that collide with wrapped text.
3. If a source template or brand-specific companion skill is used, map each slide to a deliberate layout before editing; vary layouts to match content instead of repeating one text-heavy pattern.
4. Remove unused template slots, orphaned shapes, and placeholder media rather than leaving empty frames or invisible text behind.
5. Fix issues and re-render the affected slides. Do not treat the first generated deck as final until at least one visual inspection pass has found or consciously ruled out issues.

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
      aspectRatios
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

${renderPptxProductionChecklist(review)}
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
