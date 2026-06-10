import fs from 'node:fs/promises';
import path from 'node:path';
import { diagramFile } from './manifest.js';
import { createTheme } from './theme.js';
import { validateManifest } from './validate.js';

const renderableDiagramTypes = new Set(['processFlow', 'footprint', 'architecture', 'ambition']);

const slideDiagramFields = {
  context: [
    ['processDiagram', 'processFlow'],
    ['footprintDiagram', 'footprint']
  ],
  proof: [['architectureDiagram', 'architecture']],
  ambition: [['ambitionDiagram', 'ambition']]
};

function resolveOutput(value, fallback) {
  return path.resolve(value ?? fallback);
}

function unique(items) {
  return Array.from(new Set(items));
}

function markdownText(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\r\n', '\n');
}

function collectSlideDiagramReferences(manifest, diagramDir) {
  return (manifest.slides ?? []).map((slide, index) => {
    const fields = slideDiagramFields[slide.type] ?? [];
    const diagramReferences = fields.map(([field, fallback]) => {
      const key = slide[field] ?? fallback;
      return {
        field,
        key,
        defined: Boolean(manifest.diagrams?.[key]),
        path: diagramFile(diagramDir, key)
      };
    });

    return {
      index,
      number: index + 1,
      type: slide.type,
      label: slide.label ?? '',
      title: slide.title ?? '',
      headline: slide.headline ?? '',
      supportingLine: slide.supportingLine ?? '',
      diagramReferences,
      speakerNotes: slide.speakerNotes ?? ''
    };
  });
}

function buildWarnings(manifest, validationWarnings, slides) {
  const warnings = [...validationWarnings];
  const referencedKeys = unique(slides.flatMap((slide) => slide.diagramReferences.map((diagram) => diagram.key)));

  for (const slide of slides) {
    for (const diagram of slide.diagramReferences) {
      if (!diagram.defined) {
        warnings.push(`slides[${slide.index}].${diagram.field} references missing diagram "${diagram.key}".`);
      }
    }
  }

  for (const key of Object.keys(manifest.diagrams ?? {})) {
    if (!renderableDiagramTypes.has(key)) {
      warnings.push(`diagrams.${key} is not rendered by the built-in diagram renderer.`);
    }
    if (!referencedKeys.includes(key)) {
      warnings.push(`diagrams.${key} is defined but not referenced by any built-in slide layout.`);
    }
  }

  return warnings;
}

function expectedArtifacts(manifest, slides, paths) {
  const referencedKeys = slides.flatMap((slide) => slide.diagramReferences.map((diagram) => diagram.key));
  const diagramKeys = unique([...Object.keys(manifest.diagrams ?? {}), ...referencedKeys]).sort();

  return [
    {
      kind: 'render-plan',
      path: paths.renderPlanJson,
      producedBy: 'plan'
    },
    {
      kind: 'storyboard',
      path: paths.storyboardMarkdown,
      producedBy: 'plan'
    },
    ...diagramKeys.map((key) => ({
      kind: 'diagram',
      key,
      path: diagramFile(paths.diagramDirectory, key),
      producedBy: 'render-diagrams/build',
      referencedBySlides: slides
        .filter((slide) => slide.diagramReferences.some((diagram) => diagram.key === key))
        .map((slide) => slide.number)
    })),
    {
      kind: 'pptx',
      path: paths.pptx,
      producedBy: 'build'
    }
  ];
}

export function createRenderPlan(manifest, options = {}) {
  const outputDirectory = resolveOutput(options.outDir, path.join('dist', 'plan'));
  const paths = {
    outputDirectory,
    renderPlanJson: path.join(outputDirectory, 'render-plan.json'),
    storyboardMarkdown: path.join(outputDirectory, 'storyboard.md'),
    diagramDirectory: resolveOutput(options.diagramDir, path.join('dist', 'diagrams')),
    pptx: resolveOutput(options.deckOut, path.join('dist', 'deck.pptx'))
  };
  const validation = validateManifest(manifest);
  const theme = createTheme(manifest.theme);
  const slides = collectSlideDiagramReferences(manifest, paths.diagramDirectory);
  const warnings = buildWarnings(manifest, validation.warnings, slides);

  return {
    schemaVersion: 1,
    metadata: {
      title: manifest.metadata?.title ?? '',
      subject: manifest.metadata?.subject ?? '',
      author: manifest.metadata?.author ?? '',
      company: manifest.metadata?.company ?? '',
      language: manifest.metadata?.language ?? 'en-US',
      sourceManifest: options.manifestFile ? path.resolve(options.manifestFile) : undefined
    },
    outputPaths: paths,
    expectedArtifacts: expectedArtifacts(manifest, slides, paths),
    themeSummary: {
      fonts: theme.fonts,
      palette: theme.palette
    },
    slides,
    warnings
  };
}

export function createStoryboardMarkdown(plan) {
  const lines = [
    `# Storyboard: ${markdownText(plan.metadata.title || 'PresentationKit deck')}`,
    '',
    'Review this storyboard and the render plan before generating the PPTX.',
    '',
    '## Outputs',
    '',
    `- Render plan JSON: \`${plan.outputPaths.renderPlanJson}\``,
    `- Storyboard markdown: \`${plan.outputPaths.storyboardMarkdown}\``,
    `- Diagram directory: \`${plan.outputPaths.diagramDirectory}\``,
    `- PPTX: \`${plan.outputPaths.pptx}\``,
    '',
    '## Theme summary',
    '',
    `- Heading font: ${markdownText(plan.themeSummary.fonts.heading)}`,
    `- Body font: ${markdownText(plan.themeSummary.fonts.body)}`,
    `- Palette keys: ${Object.keys(plan.themeSummary.palette).join(', ')}`,
    '',
    '## Slide list',
    '',
    '| # | Type | Label | Title | Headline | Diagram references |',
    '|---|---|---|---|---|---|'
  ];

  for (const slide of plan.slides) {
    const diagrams = slide.diagramReferences
      .map((diagram) => `${diagram.field}: ${diagram.key}${diagram.defined ? '' : ' (missing)'}`)
      .join('<br>');
    lines.push(
      `| ${slide.number} | ${markdownText(slide.type)} | ${markdownText(slide.label)} | ${markdownText(slide.title)} | ${markdownText(slide.headline)} | ${markdownText(diagrams)} |`
    );
  }

  lines.push('', '## Speaker notes', '');
  for (const slide of plan.slides) {
    lines.push(`### ${slide.number}. ${markdownText(slide.title)}`, '', markdownText(slide.speakerNotes || '_No speaker notes provided._'), '');
  }

  lines.push('## Warnings', '');
  if (plan.warnings.length === 0) {
    lines.push('- None.');
  } else {
    for (const warning of plan.warnings) lines.push(`- ${markdownText(warning)}`);
  }

  return `${lines.join('\n')}\n`;
}

export async function writePlanArtifacts(manifest, options = {}) {
  const validation = validateManifest(manifest);
  if (!validation.ok) {
    throw new Error(validation.errors.join('\n'));
  }

  const plan = createRenderPlan(manifest, options);
  const storyboard = createStoryboardMarkdown(plan);
  await fs.mkdir(plan.outputPaths.outputDirectory, { recursive: true });
  await fs.writeFile(plan.outputPaths.renderPlanJson, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  await fs.writeFile(plan.outputPaths.storyboardMarkdown, storyboard, 'utf8');
  return plan;
}
