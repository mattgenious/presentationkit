const slideTypes = new Set(['context', 'proof', 'ambition']);
const diagramKeys = new Set(['processFlow', 'footprint', 'architecture', 'ambition']);
const accents = new Set(['blue', 'green', 'yellow', 'orange', 'purple']);
const stepKinds = new Set(['human', 'system', 'outcome']);
const paletteKeys = new Set([
  'background',
  'surface',
  'ink',
  'navy',
  'muted',
  'faint',
  'line',
  'dark',
  'blue',
  'blue2',
  'bluePale',
  'yellow',
  'yellowPale',
  'green',
  'greenPale',
  'orange',
  'orangePale',
  'purple',
  'purpleDark',
  'white'
]);

const rootKeys = new Set(['$schema', 'metadata', 'theme', 'diagrams', 'slides']);
const metadataKeys = new Set(['title', 'subject', 'author', 'company', 'language', 'footer']);
const themeKeys = new Set(['fonts', 'palette']);
const fontKeys = new Set(['heading', 'body']);
const commonSlideKeys = new Set(['type', 'label', 'title', 'headline', 'supportingLine', 'speakerNotes']);
const slideKeysByType = {
  context: new Set([
    ...commonSlideKeys,
    'processDiagram',
    'footprintDiagram',
    'footprintChips'
  ]),
  proof: new Set([
    ...commonSlideKeys,
    'architectureDiagram',
    'guardrailLine',
    'proofArtifacts'
  ]),
  ambition: new Set([
    ...commonSlideKeys,
    'ambitionDiagram',
    'badge',
    'closingLine'
  ])
};

const diagramShapeKeys = {
  processFlow: new Set(['title', 'subtitle', 'steps', 'caption']),
  footprint: new Set(['title', 'subtitle', 'items', 'caption']),
  architecture: new Set(['title', 'subtitle', 'sources', 'center', 'outputs', 'guardrails']),
  ambition: new Set(['leftLabel', 'rightLabel', 'center', 'inputs', 'outcomes'])
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function addUnknownKeyErrors(errors, value, allowed, prefix) {
  if (!isPlainObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      errors.push(`${prefix}.${key} is not supported. Supported fields: ${Array.from(allowed).join(', ')}.`);
    }
  }
}

function requireObject(errors, value, prefix) {
  if (!isPlainObject(value)) {
    errors.push(`${prefix} must be an object.`);
    return false;
  }
  return true;
}

function requireString(errors, value, prefix) {
  if (!isNonEmptyString(value)) {
    errors.push(`${prefix} must be a non-empty string.`);
    return false;
  }
  return true;
}

function optionalString(errors, value, prefix) {
  if (value !== undefined && typeof value !== 'string') {
    errors.push(`${prefix} must be a string when provided.`);
  }
}

function requireStringArray(errors, value, prefix, { minItems = 1 } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${prefix} must be an array.`);
    return false;
  }
  if (value.length < minItems) {
    errors.push(`${prefix} must contain at least ${minItems} item${minItems === 1 ? '' : 's'}.`);
  }
  value.forEach((item, index) => requireString(errors, item, `${prefix}[${index}]`));
  return true;
}

function validateCardArray(errors, value, prefix, allowedKeys, requiredKeys) {
  if (!Array.isArray(value)) {
    errors.push(`${prefix} must be an array.`);
    return;
  }
  if (value.length === 0) {
    errors.push(`${prefix} must contain at least one item.`);
  }
  value.forEach((item, index) => {
    const itemPath = `${prefix}[${index}]`;
    if (!requireObject(errors, item, itemPath)) return;
    addUnknownKeyErrors(errors, item, allowedKeys, itemPath);
    for (const key of requiredKeys) {
      requireString(errors, item[key], `${itemPath}.${key}`);
    }
  });
}

function validateTheme(errors, theme) {
  if (theme === undefined) return;
  if (!requireObject(errors, theme, 'theme')) return;
  addUnknownKeyErrors(errors, theme, themeKeys, 'theme');

  if (theme.fonts !== undefined) {
    if (requireObject(errors, theme.fonts, 'theme.fonts')) {
      addUnknownKeyErrors(errors, theme.fonts, fontKeys, 'theme.fonts');
      optionalString(errors, theme.fonts.heading, 'theme.fonts.heading');
      optionalString(errors, theme.fonts.body, 'theme.fonts.body');
    }
  }

  if (theme.palette !== undefined) {
    if (requireObject(errors, theme.palette, 'theme.palette')) {
      addUnknownKeyErrors(errors, theme.palette, paletteKeys, 'theme.palette');
      for (const [key, color] of Object.entries(theme.palette)) {
        if (typeof color !== 'string' || !/^[0-9a-fA-F]{6}$/.test(color)) {
          errors.push(`theme.palette.${key} must be a 6-digit hex color without "#".`);
        }
      }
    }
  }
}

function validateDiagramReference(errors, diagrams, prefix, field, fallback, expectedKey) {
  const value = field === undefined ? fallback : field;
  if (!requireString(errors, value, prefix)) return;
  if (value !== expectedKey) {
    errors.push(`${prefix} must reference "${expectedKey}" until custom diagram renderers are supported.`);
    return;
  }
  if (!isPlainObject(diagrams?.[value])) {
    errors.push(`${prefix} references missing diagrams.${value}.`);
  }
}

function validateDiagram(errors, key, diagram) {
  const prefix = `diagrams.${key}`;
  if (!diagramKeys.has(key)) {
    errors.push(`${prefix} is not supported. Supported diagrams: ${Array.from(diagramKeys).join(', ')}.`);
    return;
  }
  if (!requireObject(errors, diagram, prefix)) return;
  addUnknownKeyErrors(errors, diagram, diagramShapeKeys[key], prefix);

  if (key === 'processFlow') {
    requireString(errors, diagram.title, `${prefix}.title`);
    requireString(errors, diagram.subtitle, `${prefix}.subtitle`);
    validateCardArray(errors, diagram.steps, `${prefix}.steps`, new Set(['title', 'detail', 'kind']), ['title', 'detail']);
    (diagram.steps ?? []).forEach((step, index) => {
      if (step?.kind !== undefined && !stepKinds.has(step.kind)) {
        errors.push(`${prefix}.steps[${index}].kind must be one of: ${Array.from(stepKinds).join(', ')}.`);
      }
    });
    optionalString(errors, diagram.caption, `${prefix}.caption`);
  }

  if (key === 'footprint') {
    requireString(errors, diagram.title, `${prefix}.title`);
    requireString(errors, diagram.subtitle, `${prefix}.subtitle`);
    validateCardArray(errors, diagram.items, `${prefix}.items`, new Set(['code', 'name', 'group']), ['code', 'name', 'group']);
    optionalString(errors, diagram.caption, `${prefix}.caption`);
  }

  if (key === 'architecture') {
    requireString(errors, diagram.title, `${prefix}.title`);
    requireString(errors, diagram.subtitle, `${prefix}.subtitle`);
    validateCardArray(errors, diagram.sources, `${prefix}.sources`, new Set(['title', 'detail']), ['title', 'detail']);
    validateCardArray(errors, diagram.outputs, `${prefix}.outputs`, new Set(['title', 'detail']), ['title', 'detail']);
    if (requireObject(errors, diagram.center, `${prefix}.center`)) {
      addUnknownKeyErrors(errors, diagram.center, new Set(['title', 'detail', 'badges']), `${prefix}.center`);
      requireString(errors, diagram.center.title, `${prefix}.center.title`);
      requireString(errors, diagram.center.detail, `${prefix}.center.detail`);
      if (diagram.center.badges !== undefined) {
        requireStringArray(errors, diagram.center.badges, `${prefix}.center.badges`, { minItems: 1 });
      }
    }
    requireStringArray(errors, diagram.guardrails, `${prefix}.guardrails`, { minItems: 1 });
  }

  if (key === 'ambition') {
    requireString(errors, diagram.leftLabel, `${prefix}.leftLabel`);
    requireString(errors, diagram.rightLabel, `${prefix}.rightLabel`);
    if (requireObject(errors, diagram.center, `${prefix}.center`)) {
      addUnknownKeyErrors(errors, diagram.center, new Set(['title', 'detail']), `${prefix}.center`);
      requireString(errors, diagram.center.title, `${prefix}.center.title`);
      requireString(errors, diagram.center.detail, `${prefix}.center.detail`);
    }
    validateCardArray(errors, diagram.inputs, `${prefix}.inputs`, new Set(['title', 'detail']), ['title', 'detail']);
    validateCardArray(errors, diagram.outcomes, `${prefix}.outcomes`, new Set(['title', 'line1', 'line2']), ['title', 'line1', 'line2']);
  }
}

function validateSlide(errors, warnings, slide, index, diagrams) {
  const prefix = `slides[${index}]`;
  if (!requireObject(errors, slide, prefix)) return;
  if (!slideTypes.has(slide.type)) {
    errors.push(`${prefix}.type must be one of: ${Array.from(slideTypes).join(', ')}.`);
    return;
  }

  addUnknownKeyErrors(errors, slide, slideKeysByType[slide.type], prefix);
  requireString(errors, slide.title, `${prefix}.title`);
  optionalString(errors, slide.label, `${prefix}.label`);
  optionalString(errors, slide.speakerNotes, `${prefix}.speakerNotes`);
  if (!slide.speakerNotes) {
    warnings.push(`${prefix}.speakerNotes is missing; speaker intent will be weaker.`);
  }

  if (slide.type === 'context') {
    requireString(errors, slide.headline, `${prefix}.headline`);
    requireString(errors, slide.supportingLine, `${prefix}.supportingLine`);
    validateDiagramReference(errors, diagrams, `${prefix}.processDiagram`, slide.processDiagram, 'processFlow', 'processFlow');
    validateDiagramReference(errors, diagrams, `${prefix}.footprintDiagram`, slide.footprintDiagram, 'footprint', 'footprint');
    if (slide.footprintChips !== undefined) {
      if (!Array.isArray(slide.footprintChips)) {
        errors.push(`${prefix}.footprintChips must be an array of [code, label] string pairs.`);
      } else {
        slide.footprintChips.forEach((chip, chipIndex) => {
          if (!Array.isArray(chip) || chip.length !== 2 || !isNonEmptyString(chip[0]) || !isNonEmptyString(chip[1])) {
            errors.push(`${prefix}.footprintChips[${chipIndex}] must be a [code, label] string pair.`);
          }
        });
        if (slide.footprintChips.length > 7) {
          warnings.push(`${prefix}.footprintChips has more than 7 items; only the first 7 render.`);
        }
      }
    }
  }

  if (slide.type === 'proof') {
    optionalString(errors, slide.headline, `${prefix}.headline`);
    requireString(errors, slide.supportingLine, `${prefix}.supportingLine`);
    requireString(errors, slide.guardrailLine, `${prefix}.guardrailLine`);
    validateDiagramReference(errors, diagrams, `${prefix}.architectureDiagram`, slide.architectureDiagram, 'architecture', 'architecture');
    if (!Array.isArray(slide.proofArtifacts)) {
      errors.push(`${prefix}.proofArtifacts must be an array.`);
    } else {
      if (slide.proofArtifacts.length === 0) {
        errors.push(`${prefix}.proofArtifacts must contain at least one item.`);
      }
      slide.proofArtifacts.forEach((artifact, artifactIndex) => {
        const artifactPath = `${prefix}.proofArtifacts[${artifactIndex}]`;
        if (!requireObject(errors, artifact, artifactPath)) return;
        addUnknownKeyErrors(errors, artifact, new Set(['label', 'caption', 'accent']), artifactPath);
        requireString(errors, artifact.label, `${artifactPath}.label`);
        optionalString(errors, artifact.caption, `${artifactPath}.caption`);
        if (artifact.accent !== undefined && !accents.has(artifact.accent)) {
          errors.push(`${artifactPath}.accent must be one of: ${Array.from(accents).join(', ')}.`);
        }
      });
      if (slide.proofArtifacts.length > 4) {
        warnings.push(`${prefix}.proofArtifacts has more than 4 items; only the first 4 render.`);
      }
    }
  }

  if (slide.type === 'ambition') {
    requireString(errors, slide.headline, `${prefix}.headline`);
    requireString(errors, slide.closingLine, `${prefix}.closingLine`);
    optionalString(errors, slide.badge, `${prefix}.badge`);
    validateDiagramReference(errors, diagrams, `${prefix}.ambitionDiagram`, slide.ambitionDiagram, 'ambition', 'ambition');
  }
}

export function validateManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(manifest)) {
    errors.push('Manifest must be a JSON object.');
    return { ok: false, errors, warnings };
  }

  addUnknownKeyErrors(errors, manifest, rootKeys, 'manifest');

  if (!requireObject(errors, manifest.metadata, 'metadata')) {
    // keep collecting slide and diagram errors where possible
  } else {
    addUnknownKeyErrors(errors, manifest.metadata, metadataKeys, 'metadata');
    requireString(errors, manifest.metadata.title, 'metadata.title');
    optionalString(errors, manifest.metadata.subject, 'metadata.subject');
    optionalString(errors, manifest.metadata.author, 'metadata.author');
    optionalString(errors, manifest.metadata.company, 'metadata.company');
    optionalString(errors, manifest.metadata.language, 'metadata.language');
    optionalString(errors, manifest.metadata.footer, 'metadata.footer');
  }

  validateTheme(errors, manifest.theme);

  if (manifest.diagrams !== undefined && !isPlainObject(manifest.diagrams)) {
    errors.push('diagrams must be an object.');
  } else {
    const diagrams = manifest.diagrams ?? {};
    for (const requiredKey of diagramKeys) {
      if (!isPlainObject(diagrams[requiredKey])) {
        errors.push(`diagrams.${requiredKey} is required.`);
      }
    }
    for (const [key, diagram] of Object.entries(diagrams)) {
      validateDiagram(errors, key, diagram);
    }
  }

  if (!Array.isArray(manifest.slides) || manifest.slides.length === 0) {
    errors.push('slides must contain at least one slide.');
  } else {
    manifest.slides.forEach((slide, index) => validateSlide(errors, warnings, slide, index, manifest.diagrams ?? {}));
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
