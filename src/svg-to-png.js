import fs from 'node:fs/promises';

/**
 * Export a single SVG file to PNG. Requires optional puppeteer installation.
 *
 * @param {string} input
 * @param {string} output
 * @param {number} [scale]
 * @returns {Promise<string>}
 */
export async function exportSvgToPng(input, output, scale = 2) {
  const puppeteer = await import('puppeteer').catch(() => {
    throw new Error('SVG to PNG export requires puppeteer. Install it with: npm install --save-dev puppeteer');
  });

  const svg = await fs.readFile(input, 'utf8');
  const match = svg.match(/<svg[^>]*\bwidth="([0-9.]+)"[^>]*\bheight="([0-9.]+)"/);
  if (!match) {
    throw new Error(`Could not parse width/height from ${input}`);
  }

  const width = Math.ceil(Number(match[1]));
  const height = Math.ceil(Number(match[2]));
  const browser = await puppeteer.default.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: Number(scale) });
    await page.setContent(`<!doctype html><html><head><style>body{margin:0;background:transparent}</style></head><body>${svg}</body></html>`);
    await page.screenshot({ path: output, omitBackground: true });
  } finally {
    await browser.close();
  }

  return output;
}
