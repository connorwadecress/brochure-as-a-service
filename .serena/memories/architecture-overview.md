# Architecture Overview

## Directory Structure

```
brochure-as-a-service/
├── engine/              # Node.js site generator (Handlebars + Claude API)
│   ├── lib/             # SOLID modules: intake, ai-generator, validator, site-writer
│   ├── prompts/         # Externalized AI system prompt (system.md)
│   ├── layouts/         # Handlebars master layout
│   ├── partials/        # 12 Handlebars section partials
│   ├── tokens/          # CSS design tokens (variables.css)
│   ├── styles/          # base.css, components.css, responsive.css
│   ├── scripts/         # Client-side main.js (inlined into output)
│   ├── schema/          # site-data.schema.json (the contract)
│   ├── create-site.js   # Thin orchestrator (entry point)
│   └── generate.js      # Pure template compiler (entry point)
├── pipeline/            # Python lead prospector (Google Places API)
│   ├── lib/             # SOLID modules: config, rotation, google_places, lead_filter, tracker_writer, stats
│   ├── data/            # rotation-config.json (suburbs + industries — no code changes needed)
│   ├── prospector.py    # Thin orchestrator (entry point)
│   └── Run-Prospector.ps1
├── sites/               # Generated website outputs (one folder per business)
├── template/            # Demo/boilerplate site config
├── .claude/             # Claude Code config
├── .serena/             # Serena MCP config and memories
├── CLAUDE.md            # Project guidance for Claude Code
└── baas-generate.skill  # Claude Code skill definition
```

## Data Flow

```
Site Generation:
  CLI Input (lib/intake.js)
    → Claude Haiku API with retry (lib/ai-generator.js)
      → AJV Schema validation (lib/validator.js)
        → site-data.json written (lib/site-writer.js)
          → generate.js (Handlebars compiler)
            → Self-contained index.html

Lead Prospecting:
  rotation-config.json → rotation.py → get_next_search()
    → google_places.py (with retry)
      → lead_filter.py (filter_no_website)
        → tracker_writer.py → lead-tracker.xlsx
```

## Key Design Decisions

- **Self-contained output**: Generated sites are single `index.html` files with all CSS/JS inlined. No build step, no bundler, no external dependencies beyond Google Fonts and Font Awesome CDN.
- **Schema-driven generation**: `site-data.schema.json` is the contract between AI content generation and the template engine. Validated at runtime with AJV (draft 2020-12).
- **Placeholder mode**: All image `src` fields default to `null`, using Font Awesome icons as placeholders until real images are provided.
- **Clean Architecture**: Both entry points (`create-site.js`, `prospector.py`) are thin orchestrators. All business logic lives in focused `lib/` modules.
- **Open/Closed for data**: Suburbs and industries live in `pipeline/data/rotation-config.json` — extend by editing JSON, not code.
- **whatsappUrl helper**: Single Handlebars helper `{{whatsappUrl number [message]}}` DRYs up 7 WhatsApp URL occurrences across partials.
