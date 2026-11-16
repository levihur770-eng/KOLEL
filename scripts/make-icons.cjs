// Makes the PNG icons in public/icons/ from icon.svg. Run: node scripts/make-icons.cjs
// Needs Playwright (present in Claude Code's cloud sessions; not a project dependency).
const { readFileSync } = require('node:fs');
const { chromium } = require('playwright');

(async () => {
const svg = readFileSync('public/icons/icon.svg', 'utf8');
const browser = await chromium.launch();
const shot = async (file, size, maskable) => {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  // Maskable: full-bleed background, the picture smaller in the middle.
  const body = maskable
    ? `<body style="margin:0;background:#1f3f6e;display:grid;place-items:center;height:100vh"><div style="width:70%">${svg}</div></body>`
    : `<body style="margin:0;background:transparent">${svg}</body>`;
  await page.setContent(body);
  await page.screenshot({ path: `public/icons/${file}`, omitBackground: true });
  await page.close();
};
await shot('icon-192.png', 192, false);
await shot('icon-512.png', 512, false);
await shot('icon-maskable-512.png', 512, true);
await browser.close();
})();
