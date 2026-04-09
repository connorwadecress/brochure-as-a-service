/**
 * lib/site-writer.js — File Output (Single Responsibility: persist site artifacts)
 *
 * Owns all file-system writes for the engine:
 *   - slugifying business names into folder names
 *   - creating the site directory and writing site-data.json
 *   - invoking generate.js to produce index.html
 *   - saving debug output for failed runs
 *
 * No API calls, no validation, no UI. Pure I/O.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Constants ────────────────────────────────────────────────────────────────

const ENGINE_DIR = path.join(__dirname, '..');
const SITES_DIR  = path.join(ENGINE_DIR, '..', 'sites');

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Convert a business name to a URL-safe folder slug.
 * @param {string} str
 * @returns {string}
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create the site directory and write site-data.json.
 * @param {string} businessName
 * @param {object} siteData
 * @returns {{ dataPath: string, siteDir: string }}
 */
function writeSiteData(businessName, siteData) {
  const siteSlug = slugify(businessName);
  const siteDir  = path.join(SITES_DIR, siteSlug);

  if (!fs.existsSync(siteDir)) {
    fs.mkdirSync(siteDir, { recursive: true });
  }

  const dataPath = path.join(siteDir, 'site-data.json');
  fs.writeFileSync(dataPath, JSON.stringify(siteData, null, 2), 'utf8');

  return { dataPath, siteDir };
}

/**
 * Invoke generate.js to compile Handlebars templates → index.html.
 * @param {string} dataPath  — absolute path to site-data.json
 * @returns {string}          — absolute path to the generated index.html
 */
function generateHtml(dataPath) {
  const generateScript = path.join(ENGINE_DIR, 'generate.js');
  execSync(`node "${generateScript}" "${dataPath}"`, { stdio: 'inherit' });
  return path.join(path.dirname(dataPath), 'index.html');
}

/**
 * Save raw AI output to _debug_output.json for post-mortem inspection.
 * @param {string} rawOutput
 * @returns {string} — path where the debug file was written
 */
function saveDebugOutput(rawOutput) {
  const debugPath = path.join(ENGINE_DIR, '_debug_output.json');
  fs.writeFileSync(debugPath, rawOutput, 'utf8');
  return debugPath;
}

module.exports = { slugify, writeSiteData, generateHtml, saveDebugOutput };
