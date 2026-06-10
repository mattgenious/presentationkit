import fs from 'node:fs/promises';
import path from 'node:path';

export async function exportSvgToPng(input, output, scale = 2) {
  const puppeteer = await import('puppeteer').catch(() => {
    throw new Error('export-svg requires optional dependency "puppeteer". Install it with: npm install --save-dev puppeteer');
  });

  let svg;
  try {
    svg = await fs.readFile(input, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`SVG input not found: ${path.resolve(input)}`);
    }
    throw new Error(`Could not read SVG input ${path.resolve(input)}: ${error.message}`);
  }
  const match = svg.match(/<svg[^>]*\bwidth="([0-9.]+)"[^>]*\bheight="([0-9.]+)"/);
  if (!match) {
    throw new Error(`Could not parse width/height from SVG input: ${path.resolve(input)}`);
  }

  const width = Math.ceil(Number(match[1]));
  const height = Math.ceil(Number(match[2]));
  const browser = await puppeteer.default.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: Number(scale) });
    await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:transparent}</style></head><body>${svg}</body></html>`);
    await fs.mkdir(path.dirname(path.resolve(output)), { recursive: true });
    await page.screenshot({ path: output, omitBackground: true });
  } finally {
    await browser.close();
  }

  return output;
}
