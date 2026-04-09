#!/usr/bin/env node
/**
 * create-site.js — Orchestrator (thin entry point)
 *
 * Coordinates the four focused modules:
 *   1. IntakeSession  (lib/intake.js)          — collect CLI input
 *   2. generateSiteData (lib/ai-generator.js)  — call Claude API with retry
 *   3. quickValidate + validateAgainstSchema    — validate AI output
 *      (lib/validator.js)
 *   4. writeSiteData + generateHtml            — persist artifacts
 *      (lib/site-writer.js)
 *
 * This file contains NO business logic — only the top-level flow.
 * SOLID: each concern lives in its own module; this is the composition root.
 */
'use strict';

const { IntakeSession }                        = require('./lib/intake');
const { generateSiteData, parseAiOutput }      = require('./lib/ai-generator');
const { quickValidate, validateAgainstSchema } = require('./lib/validator');
const { writeSiteData, generateHtml, saveDebugOutput } = require('./lib/site-writer');

// ── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('\n====================================');
  console.log('  Brochure Site Generator');
  console.log('  Phase 1: CLI Intake + AI Generation');
  console.log('====================================\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    console.error('Set it with: export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  const session = new IntakeSession();

  try {
    // ── Step 1: Structured intake ──────────────────────────────────────────
    const structuredInput = await session.collectBusinessDetails();

    // ── Step 2: Additional free-text context ──────────────────────────────
    const additionalContext = await session.collectAdditionalContext();

    // ── Step 3: AI generation ──────────────────────────────────────────────
    console.log('\n--- STEP 3: Generating site with AI ---\n');
    const rawOutput = await generateSiteData(structuredInput, additionalContext);

    // ── Step 4: Parse JSON ─────────────────────────────────────────────────
    let siteData;
    try {
      siteData = parseAiOutput(rawOutput);
    } catch {
      console.error('\nError: AI returned invalid JSON.');
      const debugPath = saveDebugOutput(rawOutput);
      console.error(`Raw output saved to: ${debugPath}`);
      process.exit(1);
    }

    // ── Step 5: Validate ───────────────────────────────────────────────────
    try {
      quickValidate(siteData);
      validateAgainstSchema(siteData);
      console.log('  Schema validation passed.\n');
    } catch (err) {
      console.error(`\nValidation error: ${err.message}`);
      process.exit(1);
    }

    // ── Step 6: Write site-data.json ───────────────────────────────────────
    console.log('--- STEP 4: Writing output ---\n');
    const { dataPath, siteDir } = writeSiteData(structuredInput.businessName, siteData);
    console.log(`Site data written: ${dataPath}`);

    // ── Step 7: Generate HTML ──────────────────────────────────────────────
    console.log('Generating HTML…');
    const htmlPath = generateHtml(dataPath);

    console.log('\n====================================');
    console.log('  Site generated successfully!');
    console.log('====================================');
    console.log(`\n  Site data: ${dataPath}`);
    console.log(`  HTML:      ${htmlPath}`);
    console.log(`\n  To preview:     npx serve "${siteDir}"`);
    console.log(`  To regenerate:  node generate.js "${dataPath}"`);
    console.log('');

  } finally {
    session.close();
  }
}

main().catch((err) => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
