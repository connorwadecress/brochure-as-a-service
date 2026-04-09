# Architecture Overview

## Directory Structure

```
BrochureAsAService/
├── engine/          # Node.js site generator (Handlebars + Claude API)
├── pipeline/        # Python lead prospector (Google Places API)
├── sites/           # Generated website outputs (one folder per business)
├── template/        # Demo/boilerplate site config
├── .claude/         # Claude Code config (launch.json, settings)
├── .serena/         # Serena MCP config and memories
├── CLAUDE.md        # Project guidance for Claude Code
└── baas-generate.skill  # Claude Code skill definition
```

## Data Flow

```
Site Generation:
  CLI Input → Claude Haiku API → site-data.json → generate.js (Handlebars) → index.html

Lead Prospecting:
  Google Places API → Filter (no website) → Deduplicate → lead-tracker.xlsx
```

## Key Design Decisions

- **Self-contained output**: Generated sites are single `index.html` files with all CSS/JS inlined. No build step, no bundler, no external dependencies beyond Google Fonts and Font Awesome CDN.
- **Schema-driven generation**: `site-data.schema.json` is the contract between AI content generation and the template engine. Both must stay in sync.
- **Placeholder mode**: All image `src` fields default to `null`, using Font Awesome icons as placeholders until real images are provided.
