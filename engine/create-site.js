#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk').default;

// ── Config ─────────────────────────────────────────────────────
const ENGINE_DIR = __dirname;
const SITES_DIR = path.join(ENGINE_DIR, '..', 'sites');
const SCHEMA_PATH = path.join(ENGINE_DIR, 'schema', 'site-data.schema.json');
const EXAMPLE_PATH = path.join(SITES_DIR, 'example', 'site-data.json');

// ── Readline helper ────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

const askRequired = async (question) => {
  let answer = '';
  while (!answer.trim()) {
    answer = await ask(question);
    if (!answer.trim()) console.log('  (required — please enter a value)');
  }
  return answer.trim();
};

const askOptional = async (question, fallback = '') => {
  const answer = await ask(question);
  return answer.trim() || fallback;
};

// ── Slug helper ────────────────────────────────────────────────
const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('\n====================================');
  console.log('  Brochure Site Generator');
  console.log('  Phase 1: CLI Intake + AI Generation');
  console.log('====================================\n');

  // ── Check API key ──────────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
    console.error('Set it with: export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  // ── Step 1: Structured intake ──────────────────────────────
  console.log('--- STEP 1: Business Details ---\n');

  const businessName = await askRequired('Business name: ');
  const industry = await askRequired('Industry/trade (e.g. plumbing, landscaping, beauty salon): ');
  const city = await askRequired('City or area served: ');
  const country = await askOptional('Country [South Africa]: ', 'South Africa');

  console.log('\n--- Contact Details ---\n');

  const phone = await askRequired('Phone number (display format, e.g. 021 555 1234): ');
  const phoneHref = await askRequired('Phone number (international, e.g. +27215551234): ');
  const whatsapp = await askRequired('WhatsApp number (no +, no spaces, e.g. 27215551234): ');
  const email = await askRequired('Email address: ');
  const address = await askOptional(`Street/area address [${city}, ${country}]: `, `${city}, ${country}`);

  console.log('\n--- Services (comma-separated) ---\n');

  const servicesRaw = await askRequired('List the main services (comma-separated):\n  ');
  const servicesList = servicesRaw.split(',').map(s => s.trim()).filter(Boolean);

  console.log('\n--- Social Media (leave blank to skip) ---\n');

  const facebook = await askOptional('Facebook URL: ');
  const instagram = await askOptional('Instagram URL: ');
  const tiktok = await askOptional('TikTok URL: ');

  console.log('\n--- Trading Hours ---\n');

  const hoursWeekday = await askOptional('Weekday hours [08:00 – 17:00]: ', '08:00 – 17:00');
  const hoursSaturday = await askOptional('Saturday hours [08:00 – 13:00]: ', '08:00 – 13:00');
  const hoursSunday = await askOptional('Sunday hours [Closed]: ', 'Closed');

  console.log('\n--- Brand Colours (leave blank for defaults) ---\n');

  const brandColour = await askOptional('Primary brand colour hex (e.g. #2563eb): ');

  // ── Step 2: Unstructured context ───────────────────────────
  console.log('\n--- STEP 2: Additional Context ---');
  console.log('Paste any extra information you have about this business.');
  console.log('This could be: existing website text, Google listing copy,');
  console.log('Facebook page about section, client brief, WhatsApp messages,');
  console.log('testimonials, years in business, owner name, etc.');
  console.log('');
  console.log('Type or paste below, then press Enter twice (empty line) to finish:\n');

  const contextLines = [];
  let emptyCount = 0;
  while (true) {
    const line = await ask('');
    if (line.trim() === '') {
      emptyCount++;
      if (emptyCount >= 1 && contextLines.length > 0) break;
    } else {
      emptyCount = 0;
      contextLines.push(line);
    }
  }
  const additionalContext = contextLines.join('\n');

  // ── Build structured summary for the AI ────────────────────
  const structuredInput = {
    businessName,
    industry,
    city,
    country,
    phone: { display: phone, href: phoneHref },
    whatsapp,
    email,
    address,
    services: servicesList,
    social: { facebook, instagram, tiktok },
    hours: { weekday: hoursWeekday, saturday: hoursSaturday, sunday: hoursSunday },
    brandColour: brandColour || null,
  };

  // ── Step 3: Call Claude API ────────────────────────────────
  console.log('\n--- STEP 3: Generating site with AI ---\n');
  console.log('Calling Claude API...');

  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const example = fs.readFileSync(EXAMPLE_PATH, 'utf8');

  const systemPrompt = `You are a brochure website content generator for local service businesses.

Your job: Given structured business details and additional context, generate a complete site-data.json file that follows the provided JSON schema exactly.

RULES:
1. Output ONLY valid JSON — no markdown fences, no explanation, no comments.
2. Follow the schema exactly. Every required field must be present.
3. Write compelling, benefit-focused copy that sounds authentic and local.
4. Use the business's actual details (name, phone, email, address, services) exactly as provided.
5. For the palette: if a brand colour is provided, generate brandPrimary, brandDark (20% darker), and brandLight (very light tint) from it. Otherwise set palette to null.
6. Generate 3 realistic-sounding testimonials with South African names appropriate to the area. Make them specific to the services offered.
7. For trust stats (trustBar), use realistic numbers based on context. If years in business is known, use it. Otherwise estimate conservatively.
8. Choose appropriate Font Awesome icons for each service (use "fas fa-*" or "fab fa-*" classes from Font Awesome 6).
9. The hero placeholderIcon should match the industry (e.g. fas fa-wrench for plumbing, fas fa-cut for hair salon).
10. Set all image "src" fields to null (placeholder mode).
11. formAction should be null (demo mode).
12. Always include gallery and testimonials sections with enabled: true.
13. Footer creditText should be "Website by", creditName "Agile Bridge", creditUrl "https://agilebridge.co.za".
14. Keep the googleFontsUrl and fontAwesomeUrl as: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" and "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
15. Write service descriptions that are 1-2 sentences, benefit-focused.
16. The hero title should be split into two short punchy lines (titleLine1 and titleLine2), with titleHighlight being "."
17. Generate 5 gallery placeholder items.
18. The about section bulletIcon should be "fas fa-check-circle".`;

  const userPrompt = `Generate a site-data.json for this business:

STRUCTURED DETAILS:
${JSON.stringify(structuredInput, null, 2)}

ADDITIONAL CONTEXT FROM CLIENT:
${additionalContext || '(No additional context provided — use the structured details to write compelling copy.)'}

JSON SCHEMA TO FOLLOW:
${schema}

EXAMPLE OUTPUT FOR REFERENCE (a plumbing business — adapt to this business's industry):
${example}

Remember: output ONLY the JSON object, nothing else.`;

  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      { role: 'user', content: userPrompt }
    ],
    system: systemPrompt,
  });

  const aiOutput = response.content[0].text;

  // ── Parse and validate ─────────────────────────────────────
  let siteData;
  try {
    // Strip markdown fences if the model wrapped it anyway
    const cleaned = aiOutput.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '');
    siteData = JSON.parse(cleaned);
  } catch (err) {
    console.error('\nError: AI returned invalid JSON.');
    console.error('Raw output saved to _debug_output.json for inspection.');
    fs.writeFileSync(path.join(ENGINE_DIR, '_debug_output.json'), aiOutput, 'utf8');
    process.exit(1);
  }

  // Quick validation — check required top-level keys
  const required = ['meta', 'business', 'contact', 'navLinks', 'hero', 'services'];
  const missing = required.filter(k => !siteData[k]);
  if (missing.length) {
    console.error(`\nError: Generated JSON is missing required keys: ${missing.join(', ')}`);
    process.exit(1);
  }

  // ── Step 4: Write output ───────────────────────────────────
  const siteSlug = slugify(businessName);
  const siteDir = path.join(SITES_DIR, siteSlug);

  if (!fs.existsSync(siteDir)) {
    fs.mkdirSync(siteDir, { recursive: true });
  }

  const dataPath = path.join(siteDir, 'site-data.json');
  fs.writeFileSync(dataPath, JSON.stringify(siteData, null, 2), 'utf8');
  console.log(`\nSite data written: ${dataPath}`);

  // ── Step 5: Generate HTML ──────────────────────────────────
  console.log('Generating HTML...');
  execSync(`node "${path.join(ENGINE_DIR, 'generate.js')}" "${dataPath}"`, { stdio: 'inherit' });

  const htmlPath = path.join(siteDir, 'index.html');
  console.log('\n====================================');
  console.log('  Site generated successfully!');
  console.log('====================================');
  console.log(`\n  Site data: ${dataPath}`);
  console.log(`  HTML:      ${htmlPath}`);
  console.log(`\n  To preview: npx serve "${siteDir}"`);
  console.log(`  To regenerate: node generate.js "${dataPath}"`);
  console.log('');

  rl.close();
}

main().catch((err) => {
  console.error('\nFatal error:', err.message);
  rl.close();
  process.exit(1);
});
