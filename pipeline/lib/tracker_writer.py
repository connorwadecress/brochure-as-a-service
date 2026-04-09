"""
lib/tracker_writer.py — Excel Lead Tracker I/O (Single Responsibility: spreadsheet writes)

Owns all openpyxl interactions:
  - finding existing names to prevent duplicates
  - finding the next empty row
  - writing styled lead rows
  - saving the workbook

Dependency Inversion: TRACKER_PATH is a module constant rather than
hardcoded inside each function — easily overridden in tests.

No API calls, no filtering logic, no display. Pure storage.
"""

import logging
from datetime import date
from pathlib import Path
from typing import List, Set

from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Font, Side

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

SCRIPT_DIR    = Path(__file__).parent.parent
TRACKER_PATH  = SCRIPT_DIR / "lead-tracker.xlsx"
DATA_START_ROW = 5   # rows 1-4 are headers
NAME_COLUMN    = 1
NOTES_COLUMN   = 14

# Pre-build reusable style objects (module-level constants for efficiency)
_BODY_FONT  = Font(name="Arial", size=10, color="374151")
_THIN_SIDE  = Side(style="thin", color="E5E7EB")
_THIN_BORDER = Border(
    left=_THIN_SIDE, right=_THIN_SIDE,
    top=_THIN_SIDE,  bottom=_THIN_SIDE,
)


# ── Public API ───────────────────────────────────────────────────────────────

def get_existing_names(ws) -> Set[str]:
    """Return normalised (lowercase, stripped) business names already in column A."""
    existing: Set[str] = set()
    for row in range(DATA_START_ROW, ws.max_row + 1):
        val = ws.cell(row=row, column=NAME_COLUMN).value
        if val:
            existing.add(str(val).strip().lower())
    return existing


def append_leads(leads: List[dict], province: str, suburb: str, category: str) -> int:
    """Append qualified, non-duplicate leads to lead-tracker.xlsx.

    Returns the number of rows actually added.
    """
    if not TRACKER_PATH.exists():
        logger.error("Tracker not found at: %s", TRACKER_PATH)
        return 0

    try:
        wb = load_workbook(TRACKER_PATH)
    except PermissionError:
        logger.error("Cannot open tracker — close the file in Excel first.")
        return 0

    ws       = wb["Lead Tracker"]
    existing = get_existing_names(ws)
    added    = 0
    next_row = _find_next_empty_row(ws)

    for lead in leads:
        if lead["name"].strip().lower() in existing:
            continue

        _write_lead_row(ws, next_row, lead, province, suburb, category)
        existing.add(lead["name"].strip().lower())
        next_row += 1
        added    += 1

    wb.save(TRACKER_PATH)
    return added


# ── Private helpers ──────────────────────────────────────────────────────────

def _find_next_empty_row(ws) -> int:
    for r in range(DATA_START_ROW, ws.max_row + 1):
        if not ws.cell(row=r, column=NAME_COLUMN).value:
            return r
    return ws.max_row + 1


def _build_notes(lead: dict) -> str:
    parts = []
    if lead["rating"]:   parts.append(f"{lead['rating']} stars")
    if lead["reviews"]:  parts.append(f"{lead['reviews']} reviews")
    if lead["hours"]:    parts.append(lead["hours"])
    if lead["maps_url"]: parts.append(lead["maps_url"])
    return " | ".join(parts)


def _write_lead_row(ws, row: int, lead: dict, province: str, suburb: str, category: str) -> None:
    row_data = [
        lead["name"],              # A: Business Name
        category,                  # B: Industry
        province,                  # C: Province
        suburb,                    # D: City / Suburb
        "",                        # E: Contact Person
        lead["phone"],             # F: Phone / WhatsApp
        "",                        # G: Email
        "",                        # H: Facebook / Insta
        "No",                      # I: Has Website?
        "Google Maps",             # J: Lead Source
        "New Lead",                # K: Status
        date.today().isoformat(),  # L: Date Found
        "",                        # M: Date Contacted
        _build_notes(lead),        # N: Notes
    ]

    for col_idx, value in enumerate(row_data, 1):
        cell            = ws.cell(row=row, column=col_idx, value=value)
        cell.font       = _BODY_FONT
        cell.border     = _THIN_BORDER
        cell.alignment  = Alignment(
            vertical="center",
            wrap_text=(col_idx == NOTES_COLUMN),
        )
