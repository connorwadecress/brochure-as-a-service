/**
 * lib/intake.js — CLI Intake (Single Responsibility: collect user input)
 *
 * Owns all readline-based prompts and assembles the structured input object
 * that gets forwarded to the AI generator. No API calls, no file I/O.
 */
'use strict';

const readline = require('readline');

class IntakeSession {
  constructor() {
    this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }

  // ── Primitive helpers ────────────────────────────────────────────────────

  ask(question) {
    return new Promise((resolve) => this.rl.question(question, resolve));
  }

  async askRequired(question) {
    let answer = '';
    while (!answer.trim()) {
      answer = await this.ask(question);
      if (!answer.trim()) console.log('  (required — please enter a value)');
    }
    return answer.trim();
  }

  async askOptional(question, fallback = '') {
    const answer = await this.ask(question);
    return answer.trim() || fallback;
  }

  // ── Structured intake ────────────────────────────────────────────────────

  async collectBusinessDetails() {
    console.log('\n--- STEP 1: Business Details ---\n');

    const businessName = await this.askRequired('Business name: ');
    const industry     = await this.askRequired('Industry/trade (e.g. plumbing, landscaping, beauty salon): ');
    const city         = await this.askRequired('City or area served: ');
    const country      = await this.askOptional('Country [South Africa]: ', 'South Africa');

    console.log('\n--- Contact Details ---\n');

    const phone      = await this.askRequired('Phone number (display format, e.g. 021 555 1234): ');
    const phoneHref  = await this.askRequired('Phone number (international, e.g. +27215551234): ');
    const whatsapp   = await this.askRequired('WhatsApp number (no +, no spaces, e.g. 27215551234): ');
    const email      = await this.askRequired('Email address: ');
    const address    = await this.askOptional(`Street/area address [${city}, ${country}]: `, `${city}, ${country}`);

    console.log('\n--- Services (comma-separated) ---\n');

    const servicesRaw = await this.askRequired('List the main services (comma-separated):\n  ');
    const services    = servicesRaw.split(',').map(s => s.trim()).filter(Boolean);

    console.log('\n--- Social Media (leave blank to skip) ---\n');

    const facebook  = await this.askOptional('Facebook URL: ');
    const instagram = await this.askOptional('Instagram URL: ');
    const tiktok    = await this.askOptional('TikTok URL: ');

    console.log('\n--- Trading Hours ---\n');

    const hoursWeekday  = await this.askOptional('Weekday hours [08:00 – 17:00]: ', '08:00 – 17:00');
    const hoursSaturday = await this.askOptional('Saturday hours [08:00 – 13:00]: ', '08:00 – 13:00');
    const hoursSunday   = await this.askOptional('Sunday hours [Closed]: ', 'Closed');

    console.log('\n--- Brand Colours (leave blank for defaults) ---\n');

    const brandColour = await this.askOptional('Primary brand colour hex (e.g. #2563eb): ');

    return {
      businessName,
      industry,
      city,
      country,
      phone:       { display: phone, href: phoneHref },
      whatsapp,
      email,
      address,
      services,
      social:      { facebook, instagram, tiktok },
      hours:       { weekday: hoursWeekday, saturday: hoursSaturday, sunday: hoursSunday },
      brandColour: brandColour || null,
    };
  }

  // ── Unstructured context ─────────────────────────────────────────────────

  async collectAdditionalContext() {
    console.log('\n--- STEP 2: Additional Context ---');
    console.log('Paste any extra information about this business.');
    console.log('(Existing copy, Google listing text, testimonials, owner name, etc.)');
    console.log('');
    console.log('Type or paste below, then press Enter twice to finish:\n');

    const lines = [];
    let emptyCount = 0;

    while (true) {
      const line = await this.ask('');
      if (line.trim() === '') {
        emptyCount++;
        if (emptyCount >= 1 && lines.length > 0) break;
      } else {
        emptyCount = 0;
        lines.push(line);
      }
    }

    return lines.join('\n');
  }

  close() {
    this.rl.close();
  }
}

module.exports = { IntakeSession };
