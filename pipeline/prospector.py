"""
prospector.py — Lead Prospector Orchestrator (thin entry point)

Coordinates the six focused modules:
  lib/config.py         — load & validate API config
  lib/rotation.py       — manage suburb × industry combos + state
  lib/google_places.py  — Google Places API client with retry
  lib/lead_filter.py    — filter businesses without websites
  lib/tracker_writer.py — write qualified leads to Excel
  lib/stats.py          — display tracker statistics

This file contains NO business logic — only the top-level flow.
SOLID: each concern lives in its own module; this is the composition root.

Usage:
    python prospector.py                 # Auto-rotation
    python prospector.py --suburb Sandton --industry plumber
    python prospector.py --list          # Show upcoming rotation
    python prospector.py --stats         # Show tracker stats
    python prospector.py --dry-run       # Search without writing
"""

import argparse
import logging
from datetime import datetime

from lib.config import load_config
from lib.google_places import search_places
from lib.lead_filter import filter_no_website
from lib.rotation import get_next_search, load_state, save_state, show_rotation
from lib.stats import show_stats
from lib.tracker_writer import append_leads

# ── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

DEFAULT_MAX_RESULTS = 15


# ── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Lead Prospector — Find SA businesses without websites"
    )
    parser.add_argument("--suburb",   help="Override suburb (e.g. Sandton)")
    parser.add_argument("--industry", help="Override industry keyword (e.g. plumber)")
    parser.add_argument("--province", default="Gauteng")
    parser.add_argument("--category", default="Trades & Home Services")
    parser.add_argument("--max",      type=int, default=DEFAULT_MAX_RESULTS)
    parser.add_argument("--list",     action="store_true", help="Show next 10 searches")
    parser.add_argument("--stats",    action="store_true", help="Show tracker statistics")
    parser.add_argument("--dry-run",  action="store_true", help="Search without writing to spreadsheet")
    args = parser.parse_args()

    state = load_state()

    if args.list:
        show_rotation(state)
        return

    if args.stats:
        show_stats(state)
        return

    config  = load_config()
    api_key = config["google_places_api_key"]

    # ── Determine search target ───────────────────────────────────────────────
    if args.suburb and args.industry:
        suburb, keyword, province, category = (
            args.suburb, args.industry, args.province, args.category
        )
    else:
        suburb, keyword, province, category = get_next_search(state)

    query = f"{keyword} in {suburb}, South Africa"
    _print_header(keyword, suburb, province, category, args.max)

    # ── Search ────────────────────────────────────────────────────────────────
    places = search_places(api_key, query, max_results=args.max)
    if not places:
        print("  No results returned. Check your API key or try a different search.")
        save_state(state)
        return

    print(f"  Found {len(places)} businesses total")

    # ── Filter ────────────────────────────────────────────────────────────────
    leads, skipped = filter_no_website(places)
    print(f"  Skipped {skipped} (already have websites)")
    print(f"  Qualified leads (no website): {len(leads)}")

    if not leads:
        print("\n  No new leads this run. All businesses already have websites.\n")
        state["runs"] = state.get("runs", 0) + 1
        save_state(state)
        return

    _print_leads(leads)

    # ── Write to tracker ──────────────────────────────────────────────────────
    if args.dry_run:
        print("  [DRY RUN] — Not writing to spreadsheet.\n")
        added = 0
    else:
        added = append_leads(leads, province, suburb, category)
        print(f"  Added {added} new leads to tracker ({len(leads) - added} duplicates skipped)")

    # ── Update state ──────────────────────────────────────────────────────────
    state["runs"]              = state.get("runs", 0) + 1
    state["total_leads_found"] = state.get("total_leads_found", 0) + added
    save_state(state)

    _print_summary(keyword, suburb, len(places), skipped, len(leads), added, state)


# ── Display helpers ───────────────────────────────────────────────────────────

def _print_header(keyword: str, suburb: str, province: str, category: str, max_results: int) -> None:
    print("\n" + "=" * 50)
    print("  LEAD PROSPECTOR")
    print("=" * 50)
    print(f"\n  Searching:   \"{keyword}\" in {suburb}")
    print(f"  Province:    {province}")
    print(f"  Category:    {category}")
    print(f"  Max results: {max_results}")
    print(f"  Date:        {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"\n  Calling Google Places API…")


def _print_leads(leads: list) -> None:
    print(f"\n  {'=' * 50}")
    print(f"  LEADS FOUND")
    print(f"  {'=' * 50}\n")
    for i, lead in enumerate(leads, 1):
        rating_str = f"{lead['rating']} stars ({lead['reviews']} reviews)" if lead["rating"] else "No rating"
        print(f"  {i}. {lead['name']}")
        print(f"     Phone:   {lead['phone'] or 'Not listed'}")
        print(f"     Area:    {lead['address']}")
        print(f"     Rating:  {rating_str}")
        print()


def _print_summary(
    keyword: str, suburb: str,
    total: int, skipped: int, leads: int, added: int,
    state: dict,
) -> None:
    print(f"\n  {'=' * 50}")
    print(f"  RUN SUMMARY")
    print(f"  {'=' * 50}")
    print(f"  Search:           \"{keyword}\" in {suburb}")
    print(f"  Businesses found: {total}")
    print(f"  Have website:     {skipped}")
    print(f"  No website:       {leads}")
    print(f"  Added to tracker: {added}")
    print(f"  Total runs:       {state['runs']}")
    print(f"  Total leads ever: {state['total_leads_found']}")
    print()


if __name__ == "__main__":
    main()
