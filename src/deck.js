import fs from 'node:fs';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';
import { createTheme, colorForAccent, paleForAccent } from './theme.js';
import { assertValidManifest } from './validate.js';
import {
  WIDE,
  addCard,
  addFooter,
  addImageOrPlaceholder,
  addLabel,
  addPill,
  addPlaceholder,
  addSpeakerNotes,
  addText,
  addTitle,
  slideBg
} from './layout.js';

const diagramRatios = {
  processFlow: 1600 / 440,
  footprint: 1600 / 520,
  architecture: 1600 / 900,
  ambition: 3000 / 980
};

function diagramPath(diagramDir, key) {
  return path.join(diagramDir, `${key}.svg`);
}

function footerText(manifest) {
  return manifest.metadata?.footer ?? manifest.metadata?.title;
}

function configureDeck(pptx, manifest, theme) {
  pptx.defineLayout(WIDE);
  pptx.layout = WIDE.name;
  pptx.author = manifest.metadata?.author ?? '';
  pptx.company = manifest.metadata?.company ?? '';
  pptx.subject = manifest.metadata?.subject ?? '';
  pptx.title = manifest.metadata?.title ?? 'PresentationKit deck';
  pptx.lang = manifest.metadata?.language ?? 'en-US';
  pptx.theme = {
    headFontFace: theme.fonts.heading,
    bodyFontFace: theme.fonts.body,
    lang: pptx.lang
  };
}

function addFootprintChips(pptx, slide, chips, theme) {
  chips.slice(0, 7).forEach(([code, label], index) => {
    const x = 0.66 + index * 1.17;
    const isLast = index === chips.length - 1;
    addCard(pptx, slide, x, 6.03, 0.98, 0.58, theme, {
      fill: isLast ? theme.palette.surface : theme.palette.yellowPale,
      line: isLast ? theme.palette.orange : theme.palette.yellow,
      shadow: false
    });
    addText(slide, code, x + 0.11, 6.16, 0.76, 0.12, theme, {
      size: 8.8,
      bold: true,
      color: theme.palette.navy,
      align: 'center'
    });
    addText(slide, label, x + 0.08, 6.39, 0.82, 0.1, theme, {
      size: 5.6,
      bold: true,
      color: theme.palette.muted,
      align: 'center'
    });
  });
}

function addContextSlide(pptx, manifest, slideSpec, theme, diagramDir) {
  const slide = pptx.addSlide();
  slideBg(pptx, slide, theme.palette.background);
  addLabel(slide, slideSpec.label ?? 'context', theme);
  addFooter(slide, footerText(manifest), theme);

  addTitle(slide, slideSpec.title, 0.56, 0.72, 7.0, 0.52, theme, { size: 28 });
  addText(slide, slideSpec.supportingLine, 0.58, 1.36, 7.0, 0.32, theme, {
    size: 12.1,
    color: theme.palette.muted
  });

  addCard(pptx, slide, 0.62, 2.02, 7.1, 1.95, theme);
  const processKey = slideSpec.processDiagram ?? 'processFlow';
  addImageOrPlaceholder(
    pptx,
    slide,
    diagramPath(diagramDir, processKey),
    { x: 0.86, y: 2.32, w: 6.62, h: 1.35 },
    diagramRatios[processKey] ?? diagramRatios.processFlow,
    processKey,
    theme
  );

  addText(slide, 'The point:', 0.66, 4.46, 2.3, 0.18, theme, {
    size: 9.5,
    bold: true,
    color: theme.palette.blue
  });
  addTitle(slide, slideSpec.headline, 0.66, 4.78, 6.75, 0.66, theme, { size: 24 });

  if (slideSpec.footprintChips) {
    addFootprintChips(pptx, slide, slideSpec.footprintChips, theme);
    addText(slide, 'current footprint and next expansion area', 0.72, 6.79, 3.4, 0.11, theme, {
      size: 7.2,
      color: theme.palette.faint
    });
  }

  addCard(pptx, slide, 8.35, 0.76, 4.12, 6.1, theme);
  const footprintKey = slideSpec.footprintDiagram ?? 'footprint';
  addImageOrPlaceholder(
    pptx,
    slide,
    diagramPath(diagramDir, footprintKey),
    { x: 8.58, y: 1.25, w: 3.66, h: 4.95 },
    diagramRatios[footprintKey] ?? diagramRatios.footprint,
    footprintKey,
    theme
  );
  addText(slide, 'Use context visuals as anchors, not as the main event.', 8.88, 6.37, 3.0, 0.2, theme, {
    size: 9.2,
    color: theme.palette.muted,
    bold: true,
    align: 'center'
  });

  addSpeakerNotes(slide, slideSpec.speakerNotes);
}

function addProofArtifacts(pptx, slide, artifacts, theme) {
  artifacts.slice(0, 4).forEach((artifact, index) => {
    const y = 2.26 + index * 1.24;
    const accent = colorForAccent(theme, artifact.accent);
    addCard(pptx, slide, 9.06, y, 3.63, 1.08, theme);
    slide.addShape(pptx.ShapeType.rect, {
      x: 9.06,
      y,
      w: 0.08,
      h: 1.08,
      fill: { color: accent },
      line: { color: accent, transparency: 100 }
    });
    addPlaceholder(pptx, slide, artifact.label, 9.28, y + 0.13, 1.42, 0.78, theme, {
      fill: paleForAccent(theme, artifact.accent),
      line: accent,
      size: 7.5
    });
    addText(slide, artifact.label, 10.88, y + 0.31, 1.5, 0.16, theme, {
      size: 10.4,
      bold: true,
      color: theme.palette.navy
    });
    addText(slide, artifact.caption ?? 'support artifact', 10.88, y + 0.61, 1.4, 0.12, theme, {
      size: 6.9,
      bold: true,
      color: theme.palette.muted
    });
  });
}

function addProofSlide(pptx, manifest, slideSpec, theme, diagramDir) {
  const slide = pptx.addSlide();
  slideBg(pptx, slide, theme.palette.background);
  addLabel(slide, slideSpec.label ?? 'proof', theme);
  addFooter(slide, footerText(manifest), theme);

  addTitle(slide, slideSpec.title, 0.56, 0.68, 8.1, 0.5, theme, { size: 27 });
  addText(slide, slideSpec.headline ?? slideSpec.supportingLine, 0.58, 1.3, 6.6, 0.22, theme, {
    size: 12.2,
    color: theme.palette.muted
  });

  addCard(pptx, slide, 0.66, 1.86, 8.05, 4.52, theme);
  const architectureKey = slideSpec.architectureDiagram ?? 'architecture';
  addImageOrPlaceholder(
    pptx,
    slide,
    diagramPath(diagramDir, architectureKey),
    { x: 0.88, y: 2.08, w: 7.61, h: 4.28 },
    diagramRatios[architectureKey] ?? diagramRatios.architecture,
    architectureKey,
    theme
  );

  addCard(pptx, slide, 0.66, 6.56, 8.05, 0.42, theme, {
    fill: theme.palette.dark,
    line: theme.palette.dark,
    shadow: false
  });
  addText(slide, slideSpec.guardrailLine, 1.04, 6.71, 7.25, 0.08, theme, {
    size: 7.6,
    bold: true,
    color: theme.palette.white,
    align: 'center'
  });

  addTitle(slide, 'Proof artifacts', 9.05, 0.78, 3.75, 0.42, theme, { size: 21.5 });
  addText(slide, slideSpec.supportingLine, 9.07, 1.35, 3.35, 0.42, theme, {
    size: 9.7,
    color: theme.palette.muted
  });
  addProofArtifacts(pptx, slide, slideSpec.proofArtifacts ?? [], theme);
  addPill(pptx, slide, 'applied, not decorative', 9.23, 6.69, 3.28, theme, {
    fill: theme.palette.dark,
    line: theme.palette.dark,
    color: theme.palette.white,
    size: 7.4,
    h: 0.32
  });

  addSpeakerNotes(slide, slideSpec.speakerNotes);
}

function addAmbitionSlide(pptx, manifest, slideSpec, theme, diagramDir) {
  const slide = pptx.addSlide();
  slideBg(pptx, slide, theme.palette.dark);
  addLabel(slide, slideSpec.label ?? 'ambition', theme, true);
  addFooter(slide, footerText(manifest), theme, true);

  addTitle(slide, slideSpec.title, 0.58, 0.76, 8.9, 0.55, theme, {
    size: 27.5,
    color: theme.palette.white
  });
  addText(slide, slideSpec.headline, 0.6, 1.42, 7.6, 0.22, theme, {
    size: 11.5,
    color: 'B8C7DA'
  });
  if (slideSpec.badge) {
    addPill(pptx, slide, slideSpec.badge, 9.72, 0.78, 2.78, theme, {
      fill: theme.palette.yellow,
      line: theme.palette.yellow,
      color: theme.palette.dark,
      size: 8.0,
      h: 0.38
    });
  }

  const ambitionKey = slideSpec.ambitionDiagram ?? 'ambition';
  addImageOrPlaceholder(
    pptx,
    slide,
    diagramPath(diagramDir, ambitionKey),
    { x: 0.75, y: 1.9, w: 11.85, h: 4.0 },
    diagramRatios[ambitionKey] ?? diagramRatios.ambition,
    ambitionKey,
    theme
  );

  addCard(pptx, slide, 0.85, 6.08, 11.65, 0.72, theme, {
    fill: theme.palette.white,
    line: theme.palette.white,
    shadow: false
  });
  addTitle(slide, slideSpec.closingLine, 1.1, 6.31, 11.1, 0.2, theme, {
    size: 15.2,
    color: theme.palette.dark,
    align: 'center'
  });

  addSpeakerNotes(slide, slideSpec.speakerNotes);
}

/**
 * Build a PowerPoint deck from a typed deck manifest.
 *
 * @param {import('./types.js').DeckManifest} manifest
 * @param {import('./types.js').BuildOptions} [options]
 * @returns {Promise<string>} absolute output path for the written deck
 */
export async function buildDeck(manifest, options = {}) {
  assertValidManifest(manifest);

  const theme = createTheme(manifest.theme);
  const pptx = new PptxGenJS();
  configureDeck(pptx, manifest, theme);

  const diagramDir = options.diagramDir ?? path.resolve('dist', 'diagrams');
  for (const slideSpec of manifest.slides) {
    if (slideSpec.type === 'context') addContextSlide(pptx, manifest, slideSpec, theme, diagramDir);
    if (slideSpec.type === 'proof') addProofSlide(pptx, manifest, slideSpec, theme, diagramDir);
    if (slideSpec.type === 'ambition') addAmbitionSlide(pptx, manifest, slideSpec, theme, diagramDir);
  }

  const out = path.resolve(options.out ?? 'dist/deck.pptx');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await pptx.writeFile({ fileName: out });
  return out;
}
