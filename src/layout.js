import fs from 'node:fs';

export const WIDE = { name: 'WIDE', width: 13.333, height: 7.5 };

export function slideBg(pptx, slide, color) {
  slide.background = { color };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: WIDE.width,
    h: WIDE.height,
    fill: { color },
    line: { color, transparency: 100 }
  });
}

export function addText(slide, value, x, y, w, h, theme, opts = {}) {
  slide.addText(String(value ?? ''), {
    x,
    y,
    w,
    h,
    fontFace: opts.face ?? theme.fonts.body,
    fontSize: opts.size ?? 12,
    bold: opts.bold ?? false,
    color: opts.color ?? theme.palette.ink,
    align: opts.align ?? 'left',
    valign: opts.valign ?? 'top',
    margin: opts.margin ?? 0,
    fit: opts.fit ?? 'shrink',
    breakLine: false,
    ...(opts.charSpacing !== undefined ? { charSpacing: opts.charSpacing } : {})
  });
}

export function addTitle(slide, value, x, y, w, h, theme, opts = {}) {
  addText(slide, value, x, y, w, h, theme, {
    face: theme.fonts.heading,
    size: opts.size ?? 30,
    bold: true,
    color: opts.color ?? theme.palette.navy,
    fit: 'shrink',
    ...opts
  });
}

export function addLabel(slide, value, theme, dark = false) {
  addText(slide, String(value ?? '').toUpperCase(), 0.45, 0.28, 4.8, 0.16, theme, {
    size: 7.6,
    bold: true,
    color: dark ? 'B8C7DA' : theme.palette.muted,
    charSpacing: 1.25
  });
}

export function addFooter(slide, value, theme, dark = false) {
  if (!value) return;
  addText(slide, value, 0.45, 7.16, 4.6, 0.13, theme, {
    size: 7.1,
    color: dark ? '7890AD' : theme.palette.faint
  });
}

export function addCard(pptx, slide, x, y, w, h, theme, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: opts.radius ?? 0.08,
    fill: { color: opts.fill ?? theme.palette.surface, transparency: opts.transparency ?? 0 },
    line: {
      color: opts.line ?? theme.palette.line,
      width: opts.lineWidth ?? 1,
      transparency: opts.lineTransparency ?? 0
    },
    shadow: opts.shadow === false
      ? undefined
      : {
          type: 'outer',
          color: '6B7C93',
          opacity: 0.13,
          blur: 1.1,
          angle: 45,
          distance: 1
        }
  });
}

export function addAccentRail(pptx, slide, x, y, h, color, opts = {}) {
  const pad = opts.pad ?? Math.min(0.12, h / 4);
  const railW = opts.width ?? 0.06;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + (opts.xInset ?? 0.12),
    y: y + pad,
    w: railW,
    h: Math.max(0.05, h - pad * 2),
    rectRadius: opts.radius ?? railW / 2,
    fill: { color },
    line: { color, transparency: 100 }
  });
}

export function addPill(pptx, slide, value, x, y, w, theme, opts = {}) {
  const h = opts.h ?? 0.36;
  addCard(pptx, slide, x, y, w, h, theme, {
    fill: opts.fill ?? theme.palette.surface,
    line: opts.line ?? opts.fill ?? theme.palette.line,
    lineWidth: opts.lineWidth ?? 1,
    shadow: false
  });
  addText(slide, value, x + 0.1, y + h / 2 - 0.055, w - 0.2, 0.11, theme, {
    size: opts.size ?? 7.6,
    bold: true,
    color: opts.color ?? theme.palette.ink,
    align: 'center'
  });
}

export function fitRect(x, y, w, h, ratio, align = 'center', valign = 'middle') {
  const boxRatio = w / h;
  let iw;
  let ih;
  if (boxRatio > ratio) {
    ih = h;
    iw = h * ratio;
  } else {
    iw = w;
    ih = w / ratio;
  }

  let ix = x + (w - iw) / 2;
  if (align === 'left') ix = x;
  if (align === 'right') ix = x + w - iw;

  let iy = y + (h - ih) / 2;
  if (valign === 'top') iy = y;
  if (valign === 'bottom') iy = y + h - ih;

  return { x: ix, y: iy, w: iw, h: ih };
}

export function addImageFit(slide, file, box, ratio, align = 'center', valign = 'middle') {
  if (!fs.existsSync(file)) return false;
  const r = fitRect(box.x, box.y, box.w, box.h, ratio, align, valign);
  slide.addImage({ path: file, ...r });
  return true;
}

export function addPlaceholder(pptx, slide, label, x, y, w, h, theme, opts = {}) {
  addCard(pptx, slide, x, y, w, h, theme, {
    fill: opts.fill ?? theme.palette.bluePale,
    line: opts.line ?? theme.palette.blue,
    shadow: false
  });
  addText(slide, label, x + 0.18, y + h / 2 - 0.07, w - 0.36, 0.15, theme, {
    size: opts.size ?? 9,
    bold: true,
    color: opts.color ?? theme.palette.navy,
    align: 'center'
  });
}

export function addImageOrPlaceholder(pptx, slide, file, box, ratio, label, theme) {
  if (file && addImageFit(slide, file, box, ratio)) return;
  addPlaceholder(pptx, slide, label, box.x, box.y, box.w, box.h, theme);
}

export function addArrow(pptx, slide, x1, y1, x2, y2, theme, opts = {}) {
  slide.addShape(pptx.ShapeType.line, {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
    line: {
      color: opts.color ?? theme.palette.blue,
      width: opts.width ?? 1.5,
      transparency: opts.transparency ?? 0,
      endArrowType: opts.endArrowType ?? 'triangle',
      dashType: opts.dashType ?? 'solid'
    }
  });
}

export function addSpeakerNotes(slide, notes) {
  if (!notes) return;
  slide.addNotes(String(notes));
}
