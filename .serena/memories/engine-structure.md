# Engine Structure

## Architecture: Thin Orchestrator + Focused Modules

The engine follows Clean Architecture / SRP — `create-site.js` is the composition root only; all logic lives in `lib/`.

## Entry Points

- `engine/create-site.js` — **Thin orchestrator**: wires together intake → AI gen → validate → write. No business logic here.
- `engine/generate.js` — **Pure template compiler**: takes a `site-data.json` path, validates required keys, compiles Handlebars, inlines CSS/JS, writes `index.html`.
- `engine/create-site.ps1` — PowerShell launcher for `create-site.js`.

## Lib Modules (SRP — each owns one concern)

| File | Responsibility |
|------|---------------|
| `lib/intake.js` | `IntakeSession` class — all readline prompts, assembles structuredInput object. No API calls. |
| `lib/ai-generator.js` | `generateSiteData()` — loads prompt from `prompts/system.md`, calls Claude Haiku API with exponential-backoff retry (3 attempts). `parseAiOutput()` strips markdown fences. |
| `lib/validator.js` | `quickValidate()` (top-level key check) + `validateAgainstSchema()` (AJV JSON Schema 2020-12). Gracefully falls back if ajv not installed. |
| `lib/site-writer.js` | `slugify()`, `writeSiteData()`, `generateHtml()`, `saveDebugOutput()` — all file-system writes. |

## Prompts (OCP — edit without code changes)

- `engine/prompts/system.md` — Externalized Claude system prompt. Edit the AI generation rules here.

## Template System

- `engine/layouts/brochure.hbs` — Master Handlebars layout
- `engine/partials/` — 12 section partials: head, nav, hero, trust-bar, services, about, gallery, testimonials, cta-banner, contact, footer, whatsapp-fab
- Custom Handlebars helpers registered in `generate.js`:
  - `{{stars N}}` — renders N star characters
  - `{{encodeURI str}}` — URL-encodes a string
  - `{{whatsappUrl number [message]}}` — builds `https://wa.me/` URL, optionally with `?text=` encoded message. **Use this in ALL partials instead of hand-rolling wa.me URLs.**

## CSS Architecture (all inlined into output)

1. `tokens/variables.css` — `--site-*` CSS custom properties (design tokens)
2. `styles/base.css` — Reset, typography, utility classes, button variants
3. `styles/components.css` — Per-component styles (nav, hero, cards, contact, footer, etc.)
4. `styles/responsive.css` — Media queries: 1024px (tablet), 768px (mobile), 480px (small mobile)

Palette overrides are injected by `head.hbs` as a second `:root{}` block using `palette.*` from site-data.

## Scripts

- `engine/scripts/main.js` — Client-side JS (IIFE). Handles: copyright year, navbar scroll shadow, mobile hamburger, contact form submit with demo-mode guard (no-action → show success immediately), smooth scroll.
  - **formAction pattern**: when `contact.formAction` is null, `contact.hbs` renders the form with NO `action` attribute. `main.js` checks `form.getAttribute('action')` — if falsy, shows success without fetching.

## Schema

- `engine/schema/site-data.schema.json` — JSON Schema 2020-12. Validated at runtime by `lib/validator.js` using AJV.
- Required top-level keys: `meta`, `business`, `contact`, `navLinks`, `hero`, `services`
- Optional: `about`, `gallery`, `testimonials`, `ctaBanner`, `footer`, `whatsappFab`, `palette`, `hours`, `social`, `trustBar`

## Dependencies

- `handlebars` ^4.7.8 — templating
- `@anthropic-ai/sdk` ^0.39.0 — AI content generation
- `ajv` ^8.17.1 — JSON Schema 2020-12 validation (run `npm install` after adding)

## npm Scripts

- `npm run generate` — alias for `node generate.js`
- `npm run generate:example` — generates from `sites/example/site-data.json`
- `npm run create` — alias for `node create-site.js`
