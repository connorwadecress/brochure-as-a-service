"""
lib/google_places.py — Google Places API Client (Single Responsibility: HTTP calls)

Owns all communication with the Google Places API (New):
  - building request headers and body
  - executing the POST with timeout
  - retry with exponential backoff on transient errors (429, 5xx)
  - translating HTTP errors into actionable log messages

Dependency Inversion: callers pass api_key rather than the module reading
config directly — making the client independently testable.
"""

import logging
import time
from typing import List

import requests

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText"

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.googleMapsUri",
    "places.rating",
    "places.userRatingCount",
    "places.businessStatus",
    "places.types",
    "places.regularOpeningHours",
])

MAX_RETRIES         = 3
BASE_RETRY_DELAY_S  = 5   # seconds; multiplied by attempt number


# ── Public API ───────────────────────────────────────────────────────────────

def search_places(api_key: str, query: str, max_results: int = 10) -> List[dict]:
    """Search the Google Places Text Search endpoint.

    Returns a list of place dicts on success, or an empty list on error.
    Retries up to MAX_RETRIES times on rate-limit and server errors.
    """
    headers = {
        "Content-Type":    "application/json",
        "X-Goog-Api-Key":  api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }
    body = {
        "textQuery":      query,
        "maxResultCount": max_results,
        "languageCode":   "en",
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(PLACES_API_URL, json=body, headers=headers, timeout=15)
            resp.raise_for_status()
            return resp.json().get("places", [])

        except requests.exceptions.HTTPError:
            status = resp.status_code
            if status == 403:
                logger.error(
                    "API key rejected (403). Verify: key is correct, "
                    "'Places API (New)' is enabled, billing is active."
                )
                return []
            elif status == 429:
                if attempt < MAX_RETRIES:
                    delay = BASE_RETRY_DELAY_S * attempt
                    logger.warning("Rate limited (429). Retrying in %ds (attempt %d/%d)…", delay, attempt, MAX_RETRIES)
                    time.sleep(delay)
                else:
                    logger.error("Rate limited after %d attempts. Try again later.", MAX_RETRIES)
                    return []
            else:
                logger.error("API returned HTTP %d. Attempt %d/%d.", status, attempt, MAX_RETRIES)
                if attempt < MAX_RETRIES:
                    time.sleep(BASE_RETRY_DELAY_S)
                else:
                    return []

        except requests.exceptions.RequestException as exc:
            if attempt < MAX_RETRIES:
                logger.warning("Network error: %s. Retrying (attempt %d/%d)…", exc, attempt, MAX_RETRIES)
                time.sleep(BASE_RETRY_DELAY_S)
            else:
                logger.error("Network error after %d attempts: %s", MAX_RETRIES, exc)
                return []

    return []
