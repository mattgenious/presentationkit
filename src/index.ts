export { buildDeck, getSlideRenderer, slideRenderers } from './deck.js';
export {
  diagramAspectRatio,
  diagramRenderers,
  getDiagramRenderer,
  renderDiagrams
} from './diagrams.js';
export {
  formatPresentationIntent,
  formatPresentationIntents,
  getPresentationIntent,
  PRESENTATION_INTENT_IDS,
  presentationIntents
} from './intents.js';
export { createTheme } from './theme.js';
export { createRendererRegistry } from './renderer-registry.js';
export { createRenderPlan, createStoryboardMarkdown, writePlanArtifacts } from './plan.js';
export { collectAssetInventory, formatPreflightResult, runPreflight } from './preflight.js';
export { renderReviewMarkdown, reviewManifest, writeReviewArtifacts } from './qa.js';
export { buildRenderManifest, writeRenderManifest } from './render-manifest.js';
export { validateManifest, assertValidManifest } from './validate.js';
export { loadManifest } from './manifest.js';

export type {
  AccentColor,
  BuildOptions,
  DeckManifest,
  DiagramCenter,
  DiagramConfig,
  DiagramItem,
  DiagramStep,
  FirstVersionVisualQaConfig,
  LoadedManifest,
  ManifestMetadata,
  ProofArtifact,
  QaConfig,
  ResolvedThemeConfig,
  SlideConfig,
  SlideType,
  ThemeConfig,
  ThemeFonts,
  ThemePalette,
  ValidationResult
} from './types.js';
