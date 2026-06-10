import { PRESENTATION_INTENT_IDS } from './intents.js';

const slideTypes = new Set(['context', 'proof', 'ambition']);
const presentationIntentIds = new Set(PRESENTATION_INTENT_IDS);

export function validateManifest(manifest, options = {}) {
  const errors = [];
  const warnings = [];
  const allowedSlideTypes = new Set(options.slideTypes ?? slideTypes);

  if (!manifest || typeof manifest !== 'object') {
    errors.push('Manifest must be a JSON object.');
    return { ok: false, errors, warnings };
  }

  if (!manifest.metadata?.title) {
    errors.push('metadata.title is required.');
  }

  if (manifest.metadata?.intent && !presentationIntentIds.has(manifest.metadata.intent)) {
    warnings.push(`metadata.intent should be one of: ${PRESENTATION_INTENT_IDS.join(', ')}.`);
  }

  if (!Array.isArray(manifest.slides) || manifest.slides.length === 0) {
    errors.push('slides must contain at least one slide.');
  } else {
    manifest.slides.forEach((slide, index) => {
      const prefix = `slides[${index}]`;
      if (!allowedSlideTypes.has(slide.type)) {
        errors.push(`${prefix}.type must be one of: ${Array.from(allowedSlideTypes).join(', ')}.`);
      }
      if (!slide.title) {
        errors.push(`${prefix}.title is required.`);
      }
      if (!slide.headline) {
        warnings.push(`${prefix}.headline is missing; the generated slide may feel under-specified.`);
      }
      if (!slide.speakerNotes) {
        warnings.push(`${prefix}.speakerNotes is missing; speaker intent will be weaker.`);
      }
    });
  }

  for (const [key, diagram] of Object.entries(manifest.diagrams ?? {})) {
    if (!diagram || typeof diagram !== 'object') {
      errors.push(`diagrams.${key} must be an object.`);
    }
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
