# CLAUDE.md — Project Guidance (Mirror)

This is a mirror of the CLAUDE.md file content stored as a Serena memory for cross-tool access.

## Project Overview

Brochure as a Service is a two-part system for generating single-page brochure websites for small South African businesses that lack web presence, plus a lead prospecting pipeline to find those businesses.

## Architecture

### Engine (`engine/`)
Generates brochure websites from JSON data using Handlebars templates.

**Two-step generation flow:**
1. `create-site.js` — Interactive CLI that collects business details, calls Claude API (Haiku) to generate a `site-data.json`, then invokes `generate.js` to produce HTML. Requires `ANTHROPIC_API_KEY` env var.
2. `generate.js` — Pure template engine. Takes a `site-data.json` path as CLI arg, inlines CSS/JS, compiles Handlebars layout + partials, writes `index.html` next to the data file.

**Template structure:**
- `layouts/brochure.hbs` — Master layout
- `partials/*.hbs` — Section partials (nav, hero, trust-bar, services, about, gallery, testimonials, cta-banner, contact, footer, whatsapp-fab, head)
- `tokens/variables.css` — CSS custom properties (design tokens)
- `styles/` — base.css, components.css, responsive.css (all inlined into output)
- `scripts/main.js` — Client-side JS (inlined into output)
- `schema/site-data.schema.json` — JSON Schema defining the site data contract

**Output:** Fully self-contained `index.html` files with all CSS/JS inlined. No build step or bundler.

### Pipeline (`pipeline/`)
Lead prospector that searches Google Maps for SA businesses without websites.

- `prospector.py` — Python script using Google Places API (New). Searches by suburb+industry combos from a rotation of 45 suburbs x 30+ keywords. Filters out businesses that have websites, deduplicates, appends to `lead-tracker.xlsx`.
- `Run-Prospector.ps1` — PowerShell wrapper with burst mode, dry-run, stats, rotation preview.
- `config.json` — Google Places API key (not committed; copy from `config.example.json`).
- `.prospector-state.json` — Tracks rotation index and run counts.

### Sites (`sites/`)
Generated site output. Each business gets a folder (slug of business name) containing `site-data.json` and `index.html`.

## Key Dependencies

- **Engine:** Node.js, `handlebars` (templating), `@anthropic-ai/sdk` (site content generation)
- **Pipeline:** Python 3, `requests`, `openpyxl` (Excel read/write), Google Places API key

## Data Flow

```
Business details (CLI input)
  → Claude API (Haiku) generates site-data.json per schema
    → generate.js compiles Handlebars templates + inlines CSS/JS
      → Self-contained index.html in sites/<slug>/
```

The `site-data.schema.json` is the contract between AI generation and the template engine. Any template changes must stay in sync with this schema, and vice versa.

## Important Conventions

- Generated sites are fully static, single-file HTML with no external dependencies beyond Google Fonts and Font Awesome CDN.
- All image `src` fields default to `null` (placeholder mode with Font Awesome icons).
- Footer credits must read "Website by Agile Bridge" linking to `https://agilebridge.co.za`.
- The prospector targets South African suburbs across Gauteng, Western Cape, and KwaZulu-Natal provinces.
- Pipeline config (`config.json`) contains secrets and must not be committed.
