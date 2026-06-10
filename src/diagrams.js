import fs from 'node:fs/promises';
import path from 'node:path';
import { createRendererRegistry } from './renderer-registry.js';
import { createTheme } from './theme.js';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function commonDefs(theme) {
  const p = theme.palette;
  return `
  <defs>
    <filter id="softShadow" x="-20%" y="-30%" width="140%" height="170%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.14"/>
    </filter>
    <filter id="tinyShadow" x="-20%" y="-30%" width="140%" height="170%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.16"/>
    </filter>
    <linearGradient id="blueCard" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#${p.bluePale}"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="greenCard" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="100%" stop-color="#${p.greenPale}"/>
    </linearGradient>
    <linearGradient id="yellowCard" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="100%" stop-color="#${p.yellowPale}"/>
    </linearGradient>
    <linearGradient id="purpleCard" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#39206b"/>
      <stop offset="100%" stop-color="#${p.purpleDark}"/>
    </linearGradient>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/>
    </marker>
    <style>
      .title { font: 800 42px '${theme.fonts.heading}', 'Segoe UI', Arial, sans-serif; fill: #${p.navy}; }
      .subtitle { font: 400 22px '${theme.fonts.body}', 'Segoe UI', Arial, sans-serif; fill: #475569; }
      .card-title { font: 800 23px '${theme.fonts.heading}', 'Segoe UI', Arial, sans-serif; fill: #${p.navy}; }
      .card-text { font: 400 16px '${theme.fonts.body}', 'Segoe UI', Arial, sans-serif; fill: #475569; }
      .small { font: 700 13px '${theme.fonts.body}', 'Segoe UI', Arial, sans-serif; fill: #64748b; letter-spacing: .06em; text-transform: uppercase; }
      .pill { font: 800 18px '${theme.fonts.body}', 'Segoe UI', Arial, sans-serif; fill: #${p.navy}; }
      .muted { font: 400 16px '${theme.fonts.body}', 'Segoe UI', Arial, sans-serif; fill: #64748b; }
      .line { fill: none; stroke: #64748b; stroke-width: 3; marker-end: url(#arrow); }
      .soft-line { fill: none; stroke: #94a3b8; stroke-width: 2.5; marker-end: url(#arrow); }
      .card { filter: url(#softShadow); stroke-width: 1.4; }
      .dream-label { font: 800 28px '${theme.fonts.heading}', 'Segoe UI', Arial, sans-serif; fill: #${p.yellow}; }
      .dream-title { font: 800 42px '${theme.fonts.heading}', 'Segoe UI', Arial, sans-serif; fill: #ffffff; }
      .dream-text { font: 600 22px '${theme.fonts.body}', 'Segoe UI', Arial, sans-serif; fill: #ffffff; }
      .dream-muted { font: 500 18px '${theme.fonts.body}', 'Segoe UI', Arial, sans-serif; fill: #d8cdfa; }
    </style>
  </defs>`;
}

function card({ x, y, w, h, fill, stroke, title, detail, badge }) {
  const detailLines = String(detail ?? '').split('\n').filter(Boolean);
  const details = detailLines
    .map((line, i) => `<text x="${x + 32}" y="${y + 92 + i * 26}" class="card-text">${esc(line)}</text>`)
    .join('\n');
  const badgeSvg = badge ? `<text x="${x + w - 32}" y="${y + 34}" text-anchor="end" class="small">${esc(badge)}</text>` : '';
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${fill}" stroke="${stroke}" class="card"/>
      <text x="${x + 32}" y="${y + 48}" class="card-title">${esc(title)}</text>
      ${badgeSvg}
      ${details}
    </g>`;
}

export function processFlowSvg(diagram, theme) {
  const width = 1600;
  const height = 440;
  const steps = diagram.steps ?? [];
  const gap = 38;
  const x0 = 70;
  const y = 170;
  const available = width - x0 * 2 - gap * (steps.length - 1);
  const w = Math.max(190, available / Math.max(steps.length, 1));

  const fillFor = (kind) => {
    if (kind === 'human') return ['url(#yellowCard)', `#${theme.palette.yellow}`];
    if (kind === 'outcome') return ['url(#greenCard)', `#${theme.palette.green}`];
    return ['url(#blueCard)', `#${theme.palette.blue}`];
  };

  const cards = steps.map((step, index) => {
    const x = x0 + index * (w + gap);
    const [fill, stroke] = fillFor(step.kind);
    return card({
      x,
      y,
      w,
      h: 170,
      fill,
      stroke,
      title: `${index + 1}. ${step.title}`,
      detail: step.detail
    });
  }).join('\n');

  const arrows = steps.slice(1).map((_, index) => {
    const x1 = x0 + index * (w + gap) + w;
    const x2 = x1 + gap - 12;
    return `<path d="M ${x1 + 6} 255 H ${x2}" class="line"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${commonDefs(theme)}
  <rect width="100%" height="100%" fill="none"/>
  <text x="70" y="68" class="title">${esc(diagram.title)}</text>
  <text x="70" y="102" class="subtitle">${esc(diagram.subtitle)}</text>
  ${cards}
  ${arrows}
  ${diagram.caption ? `<rect x="540" y="356" width="620" height="44" rx="22" fill="#ffffff" stroke="#d1d5db" filter="url(#tinyShadow)"/><text x="850" y="384" text-anchor="middle" class="muted">${esc(diagram.caption)}</text>` : ''}
</svg>`;
}

export function footprintSvg(diagram, theme) {
  const width = 1600;
  const height = 520;
  const items = diagram.items ?? [];
  const cardW = Math.min(210, (width - 160) / Math.max(items.length, 1) - 22);
  const gap = (width - 160 - cardW * items.length) / Math.max(items.length - 1, 1);

  const cards = items.map((item, index) => {
    const x = 80 + index * (cardW + gap);
    const isUpcoming = /upcoming|next/i.test(item.group ?? '');
    return `
      <g>
        <rect x="${x}" y="215" width="${cardW}" height="178" rx="24" fill="${isUpcoming ? '#ffffff' : `#${theme.palette.yellowPale}`}" stroke="#${isUpcoming ? theme.palette.orange : theme.palette.yellow}" stroke-width="2" ${isUpcoming ? 'stroke-dasharray="10 7"' : ''} filter="url(#softShadow)"/>
        <text x="${x + 28}" y="273" class="card-title">${esc(item.code)}</text>
        <text x="${x + 28}" y="310" class="card-text">${esc(item.name)}</text>
        <text x="${x + 28}" y="354" class="small">${esc(item.group)}</text>
      </g>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${commonDefs(theme)}
  <rect width="100%" height="100%" fill="none"/>
  <text x="80" y="78" class="title">${esc(diagram.title)}</text>
  <text x="80" y="112" class="subtitle">${esc(diagram.subtitle)}</text>
  <rect x="80" y="150" width="1220" height="34" rx="17" fill="#dbeafe"/>
  <text x="690" y="173" text-anchor="middle" class="small">${esc(diagram.caption ?? 'Same pattern repeated safely')}</text>
  ${cards}
</svg>`;
}

export function architectureSvg(diagram, theme) {
  const width = 1600;
  const height = 900;
  const sources = diagram.sources ?? [];
  const outputs = diagram.outputs ?? [];
  const mini = ({ title, detail }, x, y) => `
    <g>
      <rect x="${x}" y="${y}" width="300" height="78" rx="18" fill="#ffffff" stroke="#d1d5db" filter="url(#tinyShadow)"/>
      <text x="${x + 22}" y="${y + 32}" class="pill">${esc(title)}</text>
      <text x="${x + 22}" y="${y + 58}" class="muted">${esc(detail)}</text>
    </g>`;

  const sourceCards = sources.map((source, i) => mini(source, 90, 250 + i * 110)).join('\n');
  const outputCards = outputs.map((output, i) => mini(output, 1185, 285 + i * 135)).join('\n');
  const guardrails = (diagram.guardrails ?? []).join(' + ');
  const badges = (diagram.center?.badges ?? [])
    .map((badge, i) => `<rect x="${610 + i * 205}" y="410" width="${i === 0 ? 180 : 205}" height="66" rx="18" fill="#ffffff" stroke="#bfdbfe"/><text x="${700 + i * 207}" y="450" text-anchor="middle" class="pill">${esc(badge)}</text>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${commonDefs(theme)}
  <rect width="100%" height="100%" fill="none"/>
  <text x="80" y="78" class="title">${esc(diagram.title)}</text>
  <text x="80" y="112" class="subtitle">${esc(diagram.subtitle)}</text>
  <rect x="70" y="185" width="350" height="520" rx="30" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="95" y="225" class="small">Evidence sources</text>
  ${sourceCards}
  <rect x="565" y="245" width="470" height="340" rx="36" fill="url(#blueCard)" stroke="#${theme.palette.blue}" stroke-width="2.5" filter="url(#softShadow)"/>
  <text x="800" y="318" text-anchor="middle" class="card-title">${esc(diagram.center?.title ?? 'Capability')}</text>
  <text x="800" y="358" text-anchor="middle" class="card-text">${esc(diagram.center?.detail ?? '')}</text>
  ${badges}
  <text x="800" y="538" text-anchor="middle" class="small">guardrails: ${esc(guardrails)}</text>
  <rect x="1160" y="185" width="360" height="520" rx="30" fill="#f0fdf4" stroke="#bbf7d0"/>
  <text x="1185" y="225" class="small">Support-ready outputs</text>
  ${outputCards}
  <path d="M 390 290 C 480 290, 500 340, 565 365" class="line"/>
  <path d="M 390 400 C 480 400, 500 400, 565 415" class="line"/>
  <path d="M 390 510 C 480 510, 500 490, 565 465" class="line"/>
  <path d="M 390 620 C 480 620, 500 550, 565 505" class="line"/>
  <path d="M 1035 415 C 1090 415, 1120 335, 1172 324" class="line"/>
  <path d="M 1035 415 C 1100 415, 1120 456, 1172 459" class="line"/>
  <path d="M 1035 415 C 1090 415, 1120 585, 1172 594" class="line"/>
</svg>`;
}

export function ambitionSvg(diagram, theme) {
  const width = 3000;
  const height = 980;
  const inputs = diagram.inputs ?? [];
  const outcomes = diagram.outcomes ?? [];
  const inputCard = (item, y) => `
    <g>
      <rect x="115" y="${y}" width="590" height="112" rx="26" fill="url(#purpleCard)" stroke="#${theme.palette.yellow}" stroke-width="3" filter="url(#tinyShadow)"/>
      <text x="157" y="${y + 48}" class="dream-text">${esc(item.title)}</text>
      <text x="157" y="${y + 82}" class="dream-muted">${esc(item.detail)}</text>
    </g>`;
  const outcomeCard = (item, y, color) => `
    <g>
      <rect x="2225" y="${y}" width="655" height="154" rx="30" fill="url(#purpleCard)" stroke="#${color}" stroke-width="3" filter="url(#tinyShadow)"/>
      <rect x="2257" y="${y + 34}" width="8" height="86" rx="4" fill="#${color}"/>
      <text x="2295" y="${y + 64}" class="dream-label" style="fill:#${color}">${esc(item.title)}</text>
      <text x="2515" y="${y + 60}" class="dream-text">${esc(item.line1)}</text>
      <text x="2515" y="${y + 96}" class="dream-text">${esc(item.line2)}</text>
    </g>`;

  const inputY = [170, 330, 490, 650];
  const outcomeY = [175, 415, 655];
  const colors = [theme.palette.yellow, theme.palette.green, theme.palette.orange];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${commonDefs(theme)}
  <rect width="100%" height="100%" fill="none"/>
  <text x="115" y="88" class="dream-label">${esc(diagram.leftLabel)}</text>
  <text x="2225" y="88" class="dream-label">${esc(diagram.rightLabel)}</text>
  ${inputs.map((item, i) => inputCard(item, inputY[i] ?? inputY.at(-1))).join('\n')}
  <rect x="1125" y="130" width="750" height="690" rx="74" fill="#${theme.palette.purpleDark}" stroke="#${theme.palette.yellow}" stroke-width="3.5" filter="url(#softShadow)"/>
  <circle cx="1500" cy="315" r="118" fill="#${theme.palette.yellow}"/>
  <text x="1500" y="333" text-anchor="middle" class="card-title" font-size="54">AI</text>
  <text x="1500" y="535" text-anchor="middle" class="dream-title">${esc(diagram.center?.title)}</text>
  <rect x="1270" y="606" width="460" height="68" rx="34" fill="#ffffff" fill-opacity="0.08" stroke="#6d55a6"/>
  <text x="1500" y="648" text-anchor="middle" class="dream-muted">${esc(diagram.center?.detail)}</text>
  <path d="M 735 226 C 850 226, 960 238, 1112 284" stroke="#${theme.palette.yellow}" stroke-width="6" fill="none" marker-end="url(#arrow)"/>
  <path d="M 735 386 C 875 386, 965 390, 1112 410" stroke="#${theme.palette.yellow}" stroke-width="6" fill="none" marker-end="url(#arrow)"/>
  <path d="M 735 546 C 875 546, 965 520, 1112 498" stroke="#${theme.palette.yellow}" stroke-width="6" fill="none" marker-end="url(#arrow)"/>
  <path d="M 735 706 C 855 706, 960 650, 1112 584" stroke="#${theme.palette.yellow}" stroke-width="6" fill="none" marker-end="url(#arrow)"/>
  ${outcomes.map((item, i) => outcomeCard(item, outcomeY[i] ?? outcomeY.at(-1), colors[i % colors.length])).join('\n')}
  <path d="M 1888 475 C 1990 475, 2065 260, 2210 252" stroke="#${theme.palette.yellow}" stroke-width="6" fill="none" marker-end="url(#arrow)"/>
  <path d="M 1888 475 C 2010 475, 2075 492, 2210 492" stroke="#${theme.palette.green}" stroke-width="6" fill="none" marker-end="url(#arrow)"/>
  <path d="M 1888 475 C 1990 475, 2065 725, 2210 732" stroke="#${theme.palette.orange}" stroke-width="6" fill="none" marker-end="url(#arrow)"/>
</svg>`;
}

export const diagramRenderers = createRendererRegistry({
  processFlow: {
    render: processFlowSvg,
    aspectRatio: 1600 / 440,
    description: 'Horizontal process flow with step cards and directional arrows.'
  },
  footprint: {
    render: footprintSvg,
    aspectRatio: 1600 / 520,
    description: 'Deployment or coverage footprint cards grouped by current/upcoming scope.'
  },
  architecture: {
    render: architectureSvg,
    aspectRatio: 1600 / 900,
    description: 'Evidence-source to capability to output architecture map.'
  },
  ambition: {
    render: ambitionSvg,
    aspectRatio: 3000 / 980,
    description: 'Future-loop ambition diagram for inputs, AI capability, and outcomes.'
  }
});

export function getDiagramRenderer(diagramKey, diagram = {}) {
  return diagramRenderers.get(diagram.renderer ?? diagram.type ?? diagramKey);
}

export function diagramAspectRatio(diagramKey, diagramOrFallback = {}, fallback) {
  const diagram = typeof diagramOrFallback === 'number' ? {} : diagramOrFallback;
  const resolvedFallback = typeof diagramOrFallback === 'number' ? diagramOrFallback : fallback;
  return getDiagramRenderer(diagramKey, diagram)?.aspectRatio ?? resolvedFallback;
}

export async function renderDiagrams(manifest, outDir) {
  const theme = createTheme(manifest.theme);
  await fs.mkdir(outDir, { recursive: true });
  const written = [];

  for (const [key, diagram] of Object.entries(manifest.diagrams ?? {})) {
    const renderer = getDiagramRenderer(key, diagram);
    if (!renderer) continue;

    const svg = renderer.render(diagram, theme, { key, manifest });
    const file = path.join(outDir, `${key}.svg`);
    await fs.writeFile(file, svg, 'utf8');
    written.push(file);
  }

  return written;
}
