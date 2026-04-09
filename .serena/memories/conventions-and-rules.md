# Conventions & Rules

## Output Format

- Generated sites are fully static, single-file HTML with all CSS/JS inlined
- No build step, no bundler, no external JS/CSS dependencies (only Google Fonts + Font Awesome CDN)
- All image `src` fields default to `null` (placeholder mode with Font Awesome icons)

## Branding

- Footer credits MUST read "Connor Cress"
- Google Fonts: Inter family (weights 400-800)
- Font Awesome 6.5.0 from cdnjs CDN

## Schema Sync

- `engine/schema/site-data.schema.json` is the contract between AI generation and templates
- Any template partial changes musst stay in sync with the schema
- Any schema changes must be reflected in both the system prompt (create-site.js) and the partials

## Pipeline

- Targets South African suburbs: Gauteng, Western Cape, KwaZulu-Natal (15 suburbs each)
- `config.json` contains the Google API key — NEVER commit this file
- `.prospector-state.json` tracks rotation — safe to delete to reset rotation
- Spreadsheet starts data at row 5 (rows 1-4 are headers)

## Naming

- Site folders use slugified business names (lowercase, hyphens, no special chars)
- Handlebars partials named after their section (e.g., `hero.hbs`, `services.hbs`)
