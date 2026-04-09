# Engine Structure

## Entry Points

- `engine/create-site.js` — Interactive CLI that collects business details, calls Claude API (claude-haiku-4-5-20251001), generates `site-data.json`, then invokes `generate.js`. Requires `ANTHROPIC_API_KEY` env var.
- `engine/create-site.ps1` — PowerShell launcher for `create-site.js` (loads API key from `~/.bashrc` if not set).
- `engine/generate.js` — Pure template engine. Takes a `site-data.json` path as CLI arg, compiles Handlebars layout + partials, inlines CSS/JS, writes `index.html` next to the data file.

## Template System

- `engine/layouts/brochure.hbs` — Master Handlebars layout
- `engine/partials/` — 12 section partials:
  - head, nav, hero, trust-bar, services, about, gallery, testimonials, cta-banner, contact, footer, whatsapp-fab
- Custom Handlebars helpers: `stars` (renders star rating), `encodeURI` (URL encoding)

## Styles (all inlined into output)

- `engine/tokens/variables.css` — CSS custom properties (design tokens: colors, spacing, fonts)
- `engine/styles/base.css` — Typography, reset, layout foundations
- `engine/styles/components.css` — Component-specific styles
- `engine/styles/responsive.css` — Mobile breakpoints & media queries

## Scripts

- `engine/scripts/main.js` — Client-side JS (smooth scroll, mobile nav, form handling, etc.) — inlined into output

## Schema

- `engine/schema/site-data.schema.json` — JSON Schema defining the site data contract. Required top-level keys: `meta`, `business`, `contact`, `navLinks`, `hero`, `services`. Optional sections: `about`, `gallery`, `testimonials`, `ctaBanner`, `footer`, `whatsappFab`, `palette`, `hours`, `social`, `trustBar`.

## Dependencies

- `handlebars` ^4.7.8 (templating)
- `@anthropic-ai/sdk` ^0.39.0 (AI content generation)

## npm Scripts

- `npm run generate` — alias for `node generate.js`
- `npm run generate:example` — generates from `sites/example/site-data.json`
- `npm run create` — alias for `node create-site.js`
