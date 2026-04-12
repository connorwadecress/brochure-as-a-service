# Brochure as a Service

A two-part system for generating single-page brochure websites for small South African businesses and prospecting qualified leads via Google Maps.

---

## System Overview

| Component | Language | Purpose |
|-----------|----------|---------|
| [`engine/`](engine/README.md) | Node.js | Generates self-contained brochure websites from business data using Claude AI + Handlebars templates |
| [`pipeline/`](pipeline/README.md) | Python | Prospector that searches Google Maps for SA businesses without websites |
| `sites/` | — | Generated site output — one folder per business (`site-data.json` + `index.html`) |
| `template/` | — | Demo/boilerplate reference site |

---

## Quick Start

### Generate a Site (Engine)

```bash
cd engine
npm install
node create-site.js        # Interactive CLI — collects details, calls Claude AI, generates HTML
```

Requires `ANTHROPIC_API_KEY` env var.

### Find Leads (Pipeline)

```bash
pip install requests openpyxl
.\pipeline\Run-Prospector.ps1          # Auto-rotation search
.\pipeline\Run-Prospector.ps1 -Burst 3 # 3 searches back-to-back
```

Requires Google Places API key in `pipeline/config.json`.

---

## Data Flow

```
Engine:
  CLI input (lib/intake.js)
    → Claude Haiku API + retry (lib/ai-generator.js)
      → AJV schema validation (lib/validator.js)
        → site-data.json written (lib/site-writer.js)
          → Handlebars compiler (generate.js)
            → Self-contained index.html

Pipeline:
  rotation-config.json → next search combo
    → Google Places API + retry (lib/google_places.py)
      → Filter: no website (lib/lead_filter.py)
        → Deduplicate + write Excel (lib/tracker_writer.py)
```

---

## Architecture

Both subsystems follow **Clean Architecture** with SOLID principles:

- **Thin orchestrators** (`create-site.js`, `prospector.py`) — composition roots only, no logic
- **Focused `lib/` modules** — each module owns exactly one concern (SRP)
- **Externalized data** — AI prompt in `engine/prompts/system.md`, rotation data in `pipeline/data/rotation-config.json` (OCP)
- **Runtime validation** — AI output validated against `site-data.schema.json` using AJV before HTML is generated

See [engine/README.md](engine/README.md) and [pipeline/README.md](pipeline/README.md) for full documentation.

---

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Engine | Claude API access for site content generation |

Config files (not committed):
- `pipeline/config.json` — Google Places API key (copy from `config.example.json`)
