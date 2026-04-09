"""
lib/lead_filter.py — Lead Filtering (Single Responsibility: business logic only)

Owns the rules for qualifying a lead:
  - has no website
  - is not permanently closed
  - has extractable contact data

No API calls, no file I/O, no state management.
Pure functions on place dicts returned by google_places.py.
"""

from typing import List, Tuple


# ── Public API ───────────────────────────────────────────────────────────────

def filter_no_website(places: List[dict]) -> Tuple[List[dict], int]:
    """Filter a list of Google Places results to only qualified leads.

    A qualified lead:
      - has no websiteUri
      - is not CLOSED_PERMANENTLY

    Returns:
        (leads, skipped_count) where leads are normalised lead dicts.
    """
    leads: List[dict] = []
    skipped = 0

    for place in places:
        if place.get("websiteUri"):
            skipped += 1
            continue

        if place.get("businessStatus") == "CLOSED_PERMANENTLY":
            continue

        leads.append(_extract_lead(place))

    return leads, skipped


# ── Private helpers ──────────────────────────────────────────────────────────

def _extract_lead(place: dict) -> dict:
    """Normalise a Google Places dict into a clean lead dict."""
    name     = place.get("displayName", {}).get("text", "Unknown")
    phone    = place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber", "")
    address  = place.get("formattedAddress", "")
    rating   = place.get("rating", "")
    reviews  = place.get("userRatingCount", 0)
    maps_url = place.get("googleMapsUri", "")

    hours_str = ""
    hours = place.get("regularOpeningHours", {})
    if hours and hours.get("weekdayDescriptions"):
        # First 3 days to keep Notes column concise
        hours_str = " | ".join(hours["weekdayDescriptions"][:3])

    return {
        "name":     name,
        "phone":    phone,
        "address":  address,
        "rating":   rating,
        "reviews":  reviews,
        "maps_url": maps_url,
        "hours":    hours_str,
    }
