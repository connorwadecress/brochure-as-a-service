# Pipeline

Python lead prospector. Searches Google Maps for South African businesses without websites and logs qualified leads into an Excel tracker.

---

## Architecture

```
pipeline/
├── prospector.py          ← Thin orchestrator (entry point)
├── Run-Prospector.ps1     ← PowerShell wrapper (burst mode, dry-run, stats)
├── lib/
│   ├── config.py          ← SRP: config loading + validation
│   ├── rotation.py        ← SRP: combo building + state management
│   ├── google_places.py   ← SRP: Google Places API client + retry
│   ├── lead_filter.py     ← SRP: business filtering logic
│   ├── tracker_writer.py  ← SRP: Excel I/O (openpyxl)
│   └── stats.py           ← SRP: reporting / display
├── data/
│   └── rotation-config.json  ← OCP: suburbs + industries (edit to extend)
├── config.json            ← API key (never committed; copy from config.example.json)
├── config.example.json    ← Template config
├── lead-tracker.xlsx      ← Output spreadsheet
├── .prospector-state.json ← Rotation index + run stats
├── SETUP.md               ← Quick setup guide
└── lead-search-strategy.md ← Manual prospecting playbook (6 channels)
```

---

## Quick Start

```bash
# 1. Install deps
pip install requests openpyxl

# 2. Set up API key
copy config.example.json config.json
# Edit config.json and paste your Google Places API key

# 3. Run
.\Run-Prospector.ps1           # Auto-rotation (picks next suburb + industry)
.\Run-Prospector.ps1 -Burst 3  # 3 searches back-to-back
.\Run-Prospector.ps1 -DryRun   # Preview without writing
.\Run-Prospector.ps1 -Stats    # Show tracker stats
.\Run-Prospector.ps1 -List     # Show next 10 searches in rotation
```

---

## Lib Modules

| Module | Exports | What it does |
|--------|---------|-------------|
| `lib/config.py` | `load_config()` | Reads `config.json`, validates API key, exits with actionable message on failure |
| `lib/rotation.py` | `build_combos()`, `load_state()`, `save_state()`, `get_next_search()`, `show_rotation()` | Builds shuffled combo list from `data/rotation-config.json`, manages `.prospector-state.json` |
| `lib/google_places.py` | `search_places(api_key, query, max_results)` | Places API Text Search with 3-attempt retry + exponential backoff on 429/5xx |
| `lib/lead_filter.py` | `filter_no_website(places)` | Returns `(leads, skipped)` — keeps only businesses with no website and not permanently closed |
| `lib/tracker_writer.py` | `append_leads(leads, province, suburb, category)` | Deduplicates, writes styled rows to `lead-tracker.xlsx`, handles Excel file-lock error |
| `lib/stats.py` | `show_stats(state)` | Aggregates and prints totals by status/industry/province |

---

## Search Rotation

The rotation covers **~1,350 unique suburb × industry combos**:

- **45 suburbs** — Gauteng (15), Western Cape (15), KwaZulu-Natal (15)
- **30 industry keywords** — Trades & Home Services, Beauty & Wellness, Food & Hospitality, Professional Services
- Deterministically shuffled with seed=42 — stable order across runs
- Position tracked in `.prospector-state.json`

### Adding new suburbs or industries

Edit `data/rotation-config.json` — no code changes needed (Open/Closed Principle).

---

## Spreadsheet Columns

| Col | Field |
|-----|-------|
| A | Business Name |
| B | Industry |
| C | Province |
| D | City / Suburb |
| E | Contact Person |
| F | Phone / WhatsApp |
| G | Email |
| H | Facebook / Insta |
| I | Has Website? |
| J | Lead Source |
| K | Status |
| L | Date Found |
| M | Date Contacted |
| N | Notes (rating, reviews, hours, Maps URL) |

Data starts at row 5 (rows 1-4 are headers). Do not edit the header rows.

---

## Google Places API

- Uses the **Places API (New)** — Text Search endpoint
- Free tier: $200/month credit (~6,600 searches/month for free)
- Each search costs ~$0.03
- Get a key: [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
- Enable: "Places API (New)" (not the legacy Places API)

---

## Config Files

```json
// config.json (never commit this)
{
  "google_places_api_key": "AIzaSy...",
  "max_results_per_search": 15
}
```

The `config.json` is in `.gitignore`. Copy from `config.example.json` on first setup.
