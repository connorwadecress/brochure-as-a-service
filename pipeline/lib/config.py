"""
lib/config.py — Configuration Loading (Single Responsibility: load & validate config)

Owns reading config.json and surfacing actionable errors when the file is
missing or the API key is not set. No API calls, no rotation logic, no I/O
beyond reading the config file.
"""

import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.parent
CONFIG_PATH = SCRIPT_DIR / "config.json"


def load_config() -> dict:
    """Load and validate the prospector configuration.

    Returns the config dict on success.
    Prints a helpful error and sys.exit(1) on failure.
    """
    if not CONFIG_PATH.exists():
        print("\n[ERROR] config.json not found!")
        print(f"Expected at: {CONFIG_PATH}")
        print("Run this first:  copy config.example.json config.json")
        print("Then paste your Google Places API key into it.\n")
        sys.exit(1)

    with open(CONFIG_PATH) as f:
        config = json.load(f)

    api_key = config.get("google_places_api_key", "")
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        print("\n[ERROR] No API key set in config.json!")
        print("Get one from: https://console.cloud.google.com/apis/credentials")
        print("Enable the 'Places API (New)' in your Google Cloud project.\n")
        sys.exit(1)

    return config
