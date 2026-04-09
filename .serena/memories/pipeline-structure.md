# Pipeline Structure

## Purpose

Python-based lead prospector that searches Google Maps for South African businesses without websites and logs qualified leads into an Excel tracker.

## Files

- `pipeline/prospector.py` — Main script: Google Places API (New) queries, filtering, deduplication, spreadsheet writing
- `pipeline/Run-Prospector.ps1` — PowerShell wrapper with burst mode, dry-run, stats, rotation preview
- `pipeline/config.json` — Google Places API key (secret, not committed; copy from `config.example.json`)
- `pipeline/config.example.json` — Template config
- `pipeline/lead-tracker.xlsx` — Excel spreadsheet of found leads
- `pipeline/.prospector-state.json` — Tracks rotation index and cumulative run stats
- `pipeline/lead-search-strategy.md` — Comprehensive manual lead-finding guide (6 channels)
- `pipeline/SETUP.md` — Quick setup instructions

## Search Rotation

- **45 suburbs** across 3 provinces: Gauteng (15), Western Cape (15), KwaZulu-Natal (15)
- **30+ industry keywords** across 4 categories: Trades & Home Services, Beauty & Wellness, Food & Hospitality, Professional Services
- **~1,000+ unique combos** deterministically shuffled (seed=42) for stable rotation
- State tracked in `.prospector-state.json` via `rotation_index`

## Key Logic

1. Pick next suburb + industry combo from rotation (or manual override via `--suburb`/`--industry`)
2. Call Google Places API Text Search
3. Filter out businesses that already have a `websiteUri` or are permanently closed
4. Deduplicate against existing names in column A of "Lead Tracker" sheet (row 5+)
5. Append qualified leads to `lead-tracker.xlsx` with styling

## Spreadsheet Columns

A: Business Name, B: Industry, C: Province, D: City/Suburb, E: Contact Person, F: Phone/WhatsApp, G: Email, H: Facebook/Insta, I: Has Website?, J: Lead Source, K: Status, L: Date Found, M: Date Contacted, N: Notes

## Dependencies

- Python 3, `requests`, `openpyxl`
- Google Places API key (free tier: $200/month credit)
