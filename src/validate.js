const slideTypes = new Set(['context', 'proof', 'ambition']);
const diagramFields = ['processDiagram', 'footprintDiagram', 'architectureDiagram', 'ambitionDiagram'];
const renderableDiagramTypes = new Set(['processFlow', 'footprint', 'architecture', 'ambition']);

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
      for (const field of diagramFields) {
        if (!slide[field]) continue;
        const diagram = manifest.diagrams?.[slide[field]];
        if (!diagram) {
          errors.push(`${prefix}.${field} references missing diagrams.${slide[field]}. Add that diagram definition or update the slide reference.`);
          continue;
        }
        const diagramType = diagram.type ?? slide[field];
        if (!renderableDiagramTypes.has(diagramType)) {
          errors.push(`${prefix}.${field} references diagrams.${slide[field]}, but it cannot be rendered. Set diagrams.${slide[field]}.type to one of: ${Array.from(renderableDiagramTypes).join(', ')}.`);
        }
      }
    });
  }

  for (const [key, diagram] of Object.entries(manifest.diagrams ?? {})) {
    if (!diagram || typeof diagram !== 'object') {
      errors.push(`diagrams.${key} must be an object.`);
      continue;
    }
    const diagramType = diagram.type ?? key;
    if (!renderableDiagramTypes.has(diagramType)) {
      warnings.push(`diagrams.${key} is not rendered by PresentationKit. Add type: "processFlow", "footprint", "architecture", or "ambition" if it should generate an SVG.`);
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
