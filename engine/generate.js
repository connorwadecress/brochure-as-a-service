#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// ── Resolve paths relative to this script ──────────────────────
const ENGINE_DIR = __dirname;
const resolve = (...parts) => path.join(ENGINE_DIR, ...parts);

// ── Read site-data.json path from CLI arg ──────────────────────
const dataPath = process.argv[2];
if (!dataPath) {
  console.error('Usage: node generate.js <path-to-site-data.json>');
  process.exit(1);
}

const absDataPath = path.resolve(dataPath);
if (!fs.existsSync(absDataPath)) {
  console.error(`File not found: ${absDataPath}`);
  process.exit(1);
}

// ── Load site data ─────────────────────────────────────────────
const data = JSON.parse(fs.readFileSync(absDataPath, 'utf8'));

// ── Quick input validation (guard before rendering) ────────────
const REQUIRED_KEYS = ['meta', 'business', 'contact', 'navLinks', 'hero', 'services'];
const missingKeys = REQUIRED_KEYS.filter(k => !data[k]);
if (missingKeys.length) {
  console.error(`Error: site-data.json is missing required keys: ${missingKeys.join(', ')}`);
  process.exit(1);
}

// ── Inline CSS: concatenate tokens + base + components + responsive ──
const cssFiles = [
  resolve('tokens', 'variables.css'),
  resolve('styles', 'base.css'),
  resolve('styles', 'components.css'),
  resolve('styles', 'responsive.css'),
];
const inlineCss = cssFiles
  .map(f => fs.readFileSync(f, 'utf8'))
  .join('\n');

// ── Inline JS ──────────────────────────────────────────────────
const inlineJs = fs.readFileSync(resolve('scripts', 'main.js'), 'utf8');

// ── Register Handlebars partials ───────────────────────────────
const partialsDir = resolve('partials');
fs.readdirSync(partialsDir)
  .filter(f => f.endsWith('.hbs'))
  .forEach(f => {
    const name = path.basename(f, '.hbs');
    const content = fs.readFileSync(path.join(partialsDir, f), 'utf8');
    Handlebars.registerPartial(name, content);
  });

// ── Register custom helpers ────────────────────────────────────

// {{stars 5}} → "★★★★★"
Handlebars.registerHelper('stars', function (count) {
  return new Handlebars.SafeString('★'.repeat(count || 0));
});

// {{encodeURI "some text"}} → URL-encoded string
Handlebars.registerHelper('encodeURI', function (str) {
  return encodeURIComponent(str || '');
});

// {{whatsappUrl number}} → "https://wa.me/number"
// {{whatsappUrl number message}} → "https://wa.me/number?text=<encoded>"
// Replaces 6 hand-rolled wa.me/ URLs across the partials (DRY / SRP)
Handlebars.registerHelper('whatsappUrl', function (number, message) {
  const base = `https://wa.me/${number || ''}`;
  // When called with 1 data arg, Handlebars passes options hash as `message`
  return (typeof message === 'string' && message)
    ? `${base}?text=${encodeURIComponent(message)}`
    : base;
});

// ── Compile master layout ──────────────────────────────────────
const layoutSrc = fs.readFileSync(resolve('layouts', 'brochure.hbs'), 'utf8');
const template = Handlebars.compile(layoutSrc);

// ── Merge inlined assets into template context ─────────────────
const context = {
  ...data,
  inlineCss,
  inlineJs,
};

// ── Generate HTML ──────────────────────────────────────────────
const html = template(context);

// ── Write output next to site-data.json ────────────────────────
const outputDir = path.dirname(absDataPath);
const outputPath = path.join(outputDir, 'index.html');
fs.writeFileSync(outputPath, html, 'utf8');

console.log(`Generated: ${outputPath}`);
