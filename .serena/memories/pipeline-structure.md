# Pipeline Structure

## Architecture: Thin Orchestrator + Focused Modules

The pipeline follows Clean Architecture / SRP — `prospector.py` is the composition root only; all logic lives in `lib/`.

## Entry Points

- `pipeline/prospector.py` — **Thin orchestrator**: wires together config → rotation → search → filter → write → state. Uses Python `logging` (not print). No business logic here.
- `pipeline/Run-Prospector.ps1` — PowerShell wrapper with burst mode, dry-run, stats, rotation preview.

## Lib Modules (SRP — each owns one concern)

| File | Responsibility |
|------|---------------|
| `lib/config.py` | `load_config()` — reads `config.json`, validates API key. Exits cleanly with helpful messages on failure. |
| `lib/rotation.py` | `build_combos()`, `load_state()`, `save_state()`, `get_next_search()`, `show_rotation()` — all rotation and state logic. Loads suburb/industry data from `data/rotation-config.json`. |
| `lib/google_places.py` | `search_places(api_key, query, max_results)` — Google Places API client with exponential-backoff retry (3 attempts). Translates HTTP errors to log messages. |
| `lib/lead_filter.py` | `filter_no_website(places)` — pure filter: no website + not permanently closed. Returns `(leads, skipped_count)`. |
| `lib/tracker_writer.py` | `append_leads(leads, province, suburb, category)` — all openpyxl I/O: deduplication check, row writing with styling, file save. Handles PermissionError (file open in Excel). |
| `lib/stats.py` | `show_stats(state)` — reads tracker and prints aggregated stats. Pure display, no writes. |

## Data Layer (OCP — extend without code changes)

- `pipeline/data/rotation-config.json` — Suburbs (45 across Gauteng/Western Cape/KZN) and industries (30+ across 4 categories). **Edit this JSON file to add new suburbs or industries — no Python changes needed.**

## Search Rotation

- **45 suburbs** across 3 provinces: Gauteng (15), Western Cape (15), KwaZulu-Natal (15)
- **30+ industry keywords** across 4 categories: Trades & Home Services, Beauty & Wellness, Food & Hospitality, Professional Services
- **~1,000+ unique combos** deterministically shuffled (seed=42) for stable rotation
- State tracked in `.prospector-state.json` via `rotation_index`

## Key Logic Flow

1. `load_state()` → get rotation position
2. `get_next_search(state)` → advance and return next combo
3. `search_places(api_key, query)` → Google Places API with retry
4. `filter_no_website(places)` → qualified leads only
5. `append_leads(leads, ...)` → deduplicate + write to Excel
6. `save_state(state)` → persist rotation index

## Spreadsheet Columns

A: Business Name, B: Industry, C: Province, D: City/Suburb, E: Contact Person, F: Phone/WhatsApp, G: Email, H: Facebook/Insta, I: Has Website?, J: Lead Source, K: Status, L: Date Found, M: Date Contacted, N: Notes

Data starts at row 5 (`DATA_START_ROW = 5`). Rows 1-4 are headers.

## Logging

Uses Python `logging` module (`logging.basicConfig(level=INFO)`). Modules use `logger = logging.getLogger(__name__)` for proper log attribution.

## Dependencies

- Python 3, `requests`, `openpyxl`
- Google Places API key in `pipeline/config.json` (never commit; copy from `config.example.json`)
