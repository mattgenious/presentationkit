const slideTypes = new Set(['context', 'proof', 'ambition']);

export function validateManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== 'object') {
    errors.push('Manifest must be a JSON object.');
    return { ok: false, errors, warnings };
  }

  if (!manifest.metadata?.title) {
    errors.push('metadata.title is required.');
  }

  if (!Array.isArray(manifest.slides) || manifest.slides.length === 0) {
    errors.push('slides must contain at least one slide.');
  } else {
    manifest.slides.forEach((slide, index) => {
      const prefix = `slides[${index}]`;
      if (!slideTypes.has(slide.type)) {
        errors.push(`${prefix}.type must be one of: ${Array.from(slideTypes).join(', ')}.`);
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

export function assertValidManifest(manifest) {
  const result = validateManifest(manifest);
  if (!result.ok) {
    throw new Error(result.errors.join('\n'));
  }
  return result;
}
