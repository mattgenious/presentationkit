import { PRESENTATION_INTENT_IDS } from './intents.js';

const defaultSlideTypes = new Set(['context', 'proof', 'ambition']);
const presentationIntentIds = new Set(PRESENTATION_INTENT_IDS);

const slideRequiredFields = {
  context: ['supportingLine', 'headline'],
  proof: ['supportingLine', 'guardrailLine'],
  ambition: ['headline', 'closingLine']
};

const diagramRequiredFields = {
  processFlow: ['title', 'subtitle', 'steps'],
  footprint: ['title', 'subtitle', 'items'],
  architecture: ['title', 'subtitle', 'sources', 'center', 'outputs'],
  ambition: ['leftLabel', 'rightLabel', 'center', 'inputs', 'outcomes']
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function requirePlainObject(errors, value, path) {
  if (isPlainObject(value)) return true;
  errors.push(`${path} must be an object.`);
  return false;
}

function requireString(errors, value, path) {
  if (typeof value === 'string' && value.trim()) return;
  errors.push(`${path} is required.`);
}

function requireArray(errors, value, path) {
  if (Array.isArray(value) && value.length > 0) return;
  errors.push(`${path} must be a non-empty array.`);
}

function validateProofArtifacts(errors, warnings, slide, prefix) {
  if (!Array.isArray(slide.proofArtifacts) || slide.proofArtifacts.length === 0) {
    errors.push(`${prefix}.proofArtifacts must contain at least one proof artifact.`);
    return;
  }

  slide.proofArtifacts.forEach((artifact, artifactIndex) => {
    const artifactPath = `${prefix}.proofArtifacts[${artifactIndex}]`;
    if (!requirePlainObject(errors, artifact, artifactPath)) return;
    requireString(errors, artifact.label, `${artifactPath}.label`);
    if (!hasValue(artifact.caption)) {
      warnings.push(`${artifactPath}.caption is missing; proof thumbnails are more credible with a caption.`);
    }
  });
}

function rendererNameForDiagram(key, diagram) {
  return diagram.renderer ?? diagram.type ?? key;
}

function validateDiagramShape(errors, diagram, key, rendererName) {
  const required = diagramRequiredFields[rendererName];
  if (!required) return;

  for (const field of required) {
    const value = diagram[field];
    const path = `diagrams.${key}.${field}`;
    if (Array.isArray(value)) {
      requireArray(errors, value, path);
    } else if (field === 'center') {
      requirePlainObject(errors, value, path);
    } else {
      requireString(errors, value, path);
    }
  }
}

function validateBrandPack(errors, warnings, brandPack) {
  if (brandPack === undefined) return;
  if (!requirePlainObject(errors, brandPack, 'brandPack')) return;

  if (!hasValue(brandPack.id) && !hasValue(brandPack.name)) {
    warnings.push('brandPack.id is missing; name the external brand pack for QA traceability.');
  }
  if (!hasValue(brandPack.companionSkill) && !hasValue(brandPack.templateReference) && !hasValue(brandPack.templatePath)) {
    warnings.push(
      'brandPack should reference an external companion skill or template source; PresentationKit must not embed private brand assets.'
    );
  }
  if (brandPack.requiredChecks !== undefined && !Array.isArray(brandPack.requiredChecks)) {
    errors.push('brandPack.requiredChecks must be an array when provided.');
  }
  if (brandPack.handoffNotes !== undefined && !Array.isArray(brandPack.handoffNotes)) {
    errors.push('brandPack.handoffNotes must be an array when provided.');
  }
}

export function validateManifest(manifest, options = {}) {
  const errors = [];
  const warnings = [];
  const allowedSlideTypes = new Set(options.slideTypes ?? defaultSlideTypes);
  const allowedDiagramTypes = options.diagramTypes ? new Set(options.diagramTypes) : undefined;

  if (!isPlainObject(manifest)) {
    errors.push('Manifest must be a JSON object.');
    return { ok: false, errors, warnings };
  }

  if (!requirePlainObject(errors, manifest.metadata, 'metadata')) {
    return { ok: false, errors, warnings };
  }
  requireString(errors, manifest.metadata.title, 'metadata.title');

  if (manifest.metadata.intent && !presentationIntentIds.has(manifest.metadata.intent)) {
    warnings.push(`metadata.intent should be one of: ${PRESENTATION_INTENT_IDS.join(', ')}.`);
  }

  validateBrandPack(errors, warnings, manifest.brandPack);

  if (manifest.diagrams !== undefined && !isPlainObject(manifest.diagrams)) {
    errors.push('diagrams must be an object when provided.');
  }

  for (const [key, diagram] of Object.entries(manifest.diagrams ?? {})) {
    if (!requirePlainObject(errors, diagram, `diagrams.${key}`)) continue;
    const rendererName = rendererNameForDiagram(key, diagram);
    if (allowedDiagramTypes && !allowedDiagramTypes.has(rendererName)) {
      errors.push(`diagrams.${key} uses renderer "${rendererName}", but no renderer is registered for it.`);
      continue;
    }
    validateDiagramShape(errors, diagram, key, rendererName);
  }

  if (!Array.isArray(manifest.slides) || manifest.slides.length === 0) {
    errors.push('slides must contain at least one slide.');
  } else {
    manifest.slides.forEach((slide, index) => {
      const prefix = `slides[${index}]`;
      if (!requirePlainObject(errors, slide, prefix)) return;

      if (!allowedSlideTypes.has(slide.type)) {
        errors.push(`${prefix}.type must be one of: ${Array.from(allowedSlideTypes).join(', ')}.`);
        return;
      }

      requireString(errors, slide.title, `${prefix}.title`);
      for (const field of slideRequiredFields[slide.type] ?? []) {
        requireString(errors, slide[field], `${prefix}.${field}`);
      }

      if (!slide.speakerNotes) {
        warnings.push(`${prefix}.speakerNotes is missing; speaker intent will be weaker.`);
      }
      if (slide.type === 'proof') {
        validateProofArtifacts(errors, warnings, slide, prefix);
      }
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

export function assertValidManifest(manifest, options = {}) {
  const result = validateManifest(manifest, options);
  if (!result.ok) {
    throw new Error(result.errors.join('\n'));
  }
  return result;
}
