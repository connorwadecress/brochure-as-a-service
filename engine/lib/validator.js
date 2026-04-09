/**
 * lib/validator.js — Schema Validation (Single Responsibility: validate site data)
 *
 * Two-tier validation strategy:
 *   1. quickValidate() — fast top-level key check (no dependencies)
 *   2. validateAgainstSchema() — full AJV JSON Schema 2020-12 validation
 *
 * Separating validation from generation and from file I/O honours SRP and
 * makes both testable in isolation.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const SCHEMA_PATH      = path.join(__dirname, '..', 'schema', 'site-data.schema.json');
const REQUIRED_TOP_LEVEL = ['meta', 'business', 'contact', 'navLinks', 'hero', 'services'];

// ── Tier 1: fast sanity check ────────────────────────────────────────────────

/**
 * Verify all required top-level keys exist.
 * Throws an Error listing any missing keys.
 * @param {object} siteData
 */
function quickValidate(siteData) {
  const missing = REQUIRED_TOP_LEVEL.filter(k => !siteData[k]);
  if (missing.length) {
    throw new Error(`Generated JSON is missing required keys: ${missing.join(', ')}`);
  }
}

// ── Tier 2: full JSON Schema validation ──────────────────────────────────────

/**
 * Validate siteData against site-data.schema.json using AJV (draft 2020-12).
 * Throws a descriptive Error listing all violations.
 * @param {object} siteData
 */
function validateAgainstSchema(siteData) {
  let Ajv2020;
  try {
    Ajv2020 = require('ajv/dist/2020');
  } catch {
    // AJV not installed — fall back to quick-validate only
    console.warn('  [warn] ajv not found; skipping full schema validation. Run: npm install');
    return;
  }

  const schema   = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv      = new Ajv2020({ allErrors: true });
  const validate = ajv.compile(schema);
  const valid    = validate(siteData);

  if (!valid) {
    const errors = validate.errors
      .map(e => `  - ${e.instancePath || '(root)'} ${e.message}`)
      .join('\n');
    throw new Error(`Schema validation failed:\n${errors}`);
  }
}

module.exports = { quickValidate, validateAgainstSchema };
