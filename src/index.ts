export { buildDeck } from './deck.js';
export { renderDiagrams } from './diagrams.js';
export { createTheme } from './theme.js';
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
  LoadedManifest,
  ManifestMetadata,
  ProofArtifact,
  ResolvedThemeConfig,
  SlideConfig,
  SlideType,
  ThemeConfig,
  ThemeFonts,
  ThemePalette,
  ValidationResult
} from './types.js';
