/**
 * lib/ai-generator.js — AI Content Generation (Single Responsibility: Claude API)
 *
 * Owns the Claude API interaction: loads prompts from disk, builds the user
 * message, calls the API with exponential-backoff retry, and returns raw text.
 * No file output, no validation, no UI concerns.
 *
 * Dependency Inversion: the Anthropic client is constructed internally but the
 * model, prompt paths, and retry policy are module-level constants — easy to
 * swap or inject for testing without touching the orchestrator.
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk').default;

// ── Constants ────────────────────────────────────────────────────────────────

const ENGINE_DIR         = path.join(__dirname, '..');
const SYSTEM_PROMPT_PATH = path.join(ENGINE_DIR, 'prompts', 'system.md');
const SCHEMA_PATH        = path.join(ENGINE_DIR, 'schema', 'site-data.schema.json');
const EXAMPLE_PATH       = path.join(ENGINE_DIR, '..', 'sites', 'example', 'site-data.json');

const MODEL         = 'claude-haiku-4-5-20251001';
const MAX_TOKENS    = 4096;
const MAX_RETRIES   = 3;
const RETRY_DELAYS  = [1000, 3000, 9000]; // ms — exponential backoff

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate raw site-data JSON text from the Claude API.
 * @param {object} structuredInput  — assembled by intake.js
 * @param {string} additionalContext — free-text from the CLI
 * @returns {Promise<string>}        — raw AI output (unparsed JSON string)
 */
async function generateSiteData(structuredInput, additionalContext) {
  const client       = new Anthropic();
  const systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');
  const schema       = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const example      = fs.readFileSync(EXAMPLE_PATH, 'utf8');

  const userPrompt = _buildUserPrompt(structuredInput, additionalContext, schema, example);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`  Calling Claude API (attempt ${attempt}/${MAX_RETRIES})...`);

      const response = await client.messages.create({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      });

      return response.content[0].text;

    } catch (err) {
      const isRetryable = err.status === 429 || err.status === 503 || err.status === 500;

      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt - 1];
        console.log(`  API error (HTTP ${err.status}). Retrying in ${delay / 1000}s...`);
        await _sleep(delay);
      } else {
        throw err;
      }
    }
  }
}

/**
 * Parse raw AI output into a JavaScript object.
 * Strips markdown fences if the model disobeyed the JSON-only instruction.
 * @param {string} rawOutput
 * @returns {object}
 */
function parseAiOutput(rawOutput) {
  const cleaned = rawOutput
    .replace(/^```json?\n?/m, '')
    .replace(/\n?```$/m, '');
  return JSON.parse(cleaned);
}

// ── Private helpers ──────────────────────────────────────────────────────────

function _buildUserPrompt(structuredInput, additionalContext, schema, example) {
  return `Generate a site-data.json for this business:

STRUCTURED DETAILS:
${JSON.stringify(structuredInput, null, 2)}

ADDITIONAL CONTEXT FROM CLIENT:
${additionalContext || '(No additional context provided — use the structured details to write compelling copy.)'}

JSON SCHEMA TO FOLLOW:
${schema}

EXAMPLE OUTPUT FOR REFERENCE (a plumbing business — adapt to this business's industry):
${example}

Remember: output ONLY the JSON object, nothing else.`;
}

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { generateSiteData, parseAiOutput };
