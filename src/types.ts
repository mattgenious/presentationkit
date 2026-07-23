export type SlideType = 'context' | 'proof' | 'ambition' | string;

export type AccentColor = 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | string;

export interface ManifestMetadata {
  title: string;
  subject?: string;
  author?: string;
  company?: string;
  language?: string;
  footer?: string;
  intent?: string;
  [key: string]: unknown;
}

export interface ThemeFonts {
  heading?: string;
  body?: string;
  [key: string]: string | undefined;
}

export interface ThemePalette {
  background?: string;
  surface?: string;
  ink?: string;
  navy?: string;
  muted?: string;
  faint?: string;
  line?: string;
  dark?: string;
  blue?: string;
  blue2?: string;
  bluePale?: string;
  yellow?: string;
  yellowPale?: string;
  green?: string;
  greenPale?: string;
  orange?: string;
  orangePale?: string;
  purple?: string;
  purpleDark?: string;
  white?: string;
  [key: string]: string | undefined;
}

export interface ThemeConfig {
  fonts?: ThemeFonts;
  palette?: ThemePalette;
  [key: string]: unknown;
}

export interface BrandPackConfig {
  kind?: 'presentation-brand-pack';
  id?: string;
  companionSkill?: string;
  brandPackManifest?: string;
  templateReference?: string;
  templatePath?: string;
  slideSize?: {
    width?: number;
    height?: number;
    unit?: string;
    [key: string]: unknown;
  };
  requiredChecks?: string[];
  handoffNotes?: string[];
  [key: string]: unknown;
}

export interface FirstVersionVisualQaConfig {
  status?: 'pending' | 'passed' | 'waived';
  evidence?: string | string[];
  report?: string;
  bundle?: string;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  [key: string]: unknown;
}

export interface QaConfig {
  firstVersionVisualQa?: FirstVersionVisualQaConfig;
  [key: string]: unknown;
}

export interface ResolvedThemeConfig {
  fonts: Required<Pick<ThemeFonts, 'heading' | 'body'>> & ThemeFonts;
  palette: Required<
    Pick<
      ThemePalette,
      | 'background'
      | 'surface'
      | 'ink'
      | 'navy'
      | 'muted'
      | 'faint'
      | 'line'
      | 'dark'
      | 'blue'
      | 'blue2'
      | 'bluePale'
      | 'yellow'
      | 'yellowPale'
      | 'green'
      | 'greenPale'
      | 'orange'
      | 'orangePale'
      | 'purple'
      | 'purpleDark'
      | 'white'
    >
  > &
    ThemePalette;
}

export interface DiagramStep {
  title: string;
  detail?: string;
  kind?: 'human' | 'system' | 'outcome' | string;
  [key: string]: unknown;
}

export interface DiagramItem {
  title?: string;
  detail?: string;
  code?: string;
  name?: string;
  group?: string;
  line1?: string;
  line2?: string;
  [key: string]: unknown;
}

export interface DiagramCenter {
  title?: string;
  detail?: string;
  badges?: string[];
  [key: string]: unknown;
}

export interface DiagramConfig {
  type?: string;
  renderer?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  steps?: DiagramStep[];
  items?: DiagramItem[];
  sources?: DiagramItem[];
  outputs?: DiagramItem[];
  guardrails?: string[];
  leftLabel?: string;
  rightLabel?: string;
  center?: DiagramCenter;
  inputs?: DiagramItem[];
  outcomes?: DiagramItem[];
  [key: string]: unknown;
}

export interface ProofArtifact {
  label: string;
  caption?: string;
  accent?: AccentColor;
  [key: string]: unknown;
}

export interface SlideConfig {
  type: SlideType;
  label?: string;
  title: string;
  headline?: string;
  supportingLine?: string;
  speakerNotes?: string;
  processDiagram?: string;
  footprintDiagram?: string;
  footprintChips?: Array<[string, string]>;
  architectureDiagram?: string;
  guardrailLine?: string;
  proofArtifacts?: ProofArtifact[];
  ambitionDiagram?: string;
  badge?: string;
  closingLine?: string;
  [key: string]: unknown;
}

export interface DeckManifest {
  metadata: ManifestMetadata;
  theme?: ThemeConfig;
  brandPack?: BrandPackConfig;
  qa?: QaConfig;
  diagrams?: Record<string, DiagramConfig>;
  slides: SlideConfig[];
  [key: string]: unknown;
}

export interface LoadedManifest {
  manifest: DeckManifest;
  file: string;
  root: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface BuildOptions {
  out?: string;
  diagramDir?: string;
}

export interface RendererRegistry<T = unknown> {
  register(name: string, renderer: T): RendererRegistry<T>;
  get(name: string): T | undefined;
  has(name: string): boolean;
  list(): T[];
  names(): string[];
}

export interface RenderPlan {
  schemaVersion: number;
  metadata: Record<string, unknown>;
  outputPaths: Record<string, string>;
  expectedArtifacts: Array<Record<string, unknown>>;
  themeSummary: Record<string, unknown>;
  slides: Array<Record<string, unknown>>;
  warnings: string[];
}

export interface PreflightResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  dependencies: Array<Record<string, unknown>>;
  inventory: Array<Record<string, unknown>>;
}

export interface ReviewResult {
  generatedAt: string;
  deckTitle: string;
  summary: {
    status: string;
    counts: Record<'error' | 'warning' | 'info', number>;
  };
  checks: Record<string, unknown>;
  findings: Array<Record<string, unknown>>;
}

export interface RenderManifest {
  schemaVersion: number;
  package: {
    name: string;
    version: string;
  };
  sourceManifest: Record<string, unknown>;
  generatedDiagrams: Array<Record<string, unknown>>;
  outputDeck: Record<string, unknown>;
  verification: Record<string, unknown>;
}
