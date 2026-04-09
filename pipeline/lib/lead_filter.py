"""
lib/lead_filter.py — Lead Filtering (Single Responsibility: business logic only)

Owns the rules for qualifying a lead:
  - has no real website (social media pages don't count)
  - is not permanently closed
  - has extractable contact data

No API calls, no file I/O, no state management.
Pure functions on place dicts returned by google_places.py.
"""

from typing import List, Tuple

# Domains that count as "social media presence" not a real website.
# Businesses with only these as their websiteUri are still qualified leads —
# we capture the URL as their social profile instead of skipping them.
SOCIAL_DOMAINS = (
    "facebook.com",
    "fb.com",
    "instagram.com",
    "wa.me",
    "api.whatsapp.com",
    "twitter.com",
    "x.com",
    "tiktok.com",
    "youtube.com",
    "linktr.ee",
)


# ── Public API ───────────────────────────────────────────────────────────────

def filter_no_website(places: List[dict]) -> Tuple[List[dict], int]:
    """Filter a list of Google Places results to only qualified leads.

    A qualified lead:
      - has no real websiteUri (social media URLs are captured, not disqualifying)
      - is not CLOSED_PERMANENTLY

    Returns:
        (leads, skipped_count) where leads are normalised lead dicts.
    """
    leads: List[dict] = []
    skipped = 0

    for place in places:
        website = place.get("websiteUri", "")
        if website and not _is_social_url(website):
            skipped += 1
            continue

        if place.get("businessStatus") == "CLOSED_PERMANENTLY":
            continue

        leads.append(_extract_lead(place))

    return leads, skipped


# ── Private helpers ──────────────────────────────────────────────────────────

def _is_social_url(url: str) -> bool:
    """Return True if the URL belongs to a social media platform."""
    url_lower = url.lower()
    return any(domain in url_lower for domain in SOCIAL_DOMAINS)


def _extract_lead(place: dict) -> dict:
    """Normalise a Google Places dict into a clean lead dict."""
    name     = place.get("displayName", {}).get("text", "Unknown")
    phone    = place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber", "")
    address  = place.get("formattedAddress", "")
    rating   = place.get("rating", "")
    reviews  = place.get("userRatingCount", 0)
    maps_url = place.get("googleMapsUri", "")

    # Capture social media URL if that's their only "website"
    website    = place.get("websiteUri", "")
    social_url = website if website and _is_social_url(website) else ""

    hours_str = ""
    hours = place.get("regularOpeningHours", {})
    if hours and hours.get("weekdayDescriptions"):
        # First 3 days to keep Notes column concise
        hours_str = " | ".join(hours["weekdayDescriptions"][:3])

    return {
        "name":       name,
        "phone":      phone,
        "address":    address,
        "rating":     rating,
        "reviews":    reviews,
        "maps_url":   maps_url,
        "social_url": social_url,
        "hours":      hours_str,
    }
