"""
lib/rotation.py — Search Rotation (Single Responsibility: manage search combos & state)

Owns the rotation algorithm: building the deterministic combo list from the
external data file, loading/saving state, and advancing the rotation index.
No API calls, no spreadsheet I/O, no display logic.

Open/Closed: adding new suburbs or industries requires only editing
data/rotation-config.json — no code changes.
"""

import json
import random as _rng
from pathlib import Path
from typing import List, Tuple

SCRIPT_DIR = Path(__file__).parent.parent
STATE_PATH = SCRIPT_DIR / ".prospector-state.json"
ROTATION_CONFIG_PATH = SCRIPT_DIR / "data" / "rotation-config.json"

# Type alias for clarity
SearchCombo = Tuple[str, str, str, str]  # (suburb, keyword, province, category)


# ── Data loading ─────────────────────────────────────────────────────────────

def _load_rotation_config() -> dict:
    """Load suburb/industry data from the external config file."""
    with open(ROTATION_CONFIG_PATH) as f:
        return json.load(f)


def build_combos() -> List[SearchCombo]:
    """Build a deterministically-shuffled list of all suburb × industry combos.

    The fixed seed (42) keeps the order stable across runs so rotation_index
    remains a valid, reproducible pointer into the list.
    """
    config = _load_rotation_config()
    combos: List[SearchCombo] = []

    for province, suburbs in config["suburbs"].items():
        for suburb in suburbs:
            for category, keywords in config["industries"].items():
                for keyword in keywords:
                    combos.append((suburb, keyword, province, category))

    _rng.Random(42).shuffle(combos)
    return combos


# ── State persistence ────────────────────────────────────────────────────────

def load_state() -> dict:
    """Load rotation state from disk, returning defaults if file doesn't exist."""
    if STATE_PATH.exists():
        with open(STATE_PATH) as f:
            return json.load(f)
    return {"rotation_index": 0, "runs": 0, "total_leads_found": 0}


def save_state(state: dict) -> None:
    """Persist rotation state to disk."""
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)


# ── Rotation advancement ─────────────────────────────────────────────────────

def get_next_search(state: dict) -> SearchCombo:
    """Return the next search combo and advance the rotation index in-place."""
    combos = build_combos()
    idx = state["rotation_index"] % len(combos)
    combo = combos[idx]
    state["rotation_index"] = idx + 1
    return combo


# ── Display ──────────────────────────────────────────────────────────────────

def show_rotation(state: dict) -> None:
    """Print the next 10 upcoming searches to stdout."""
    combos = build_combos()
    idx = state["rotation_index"] % len(combos)

    print(f"\nTotal combos in rotation: {len(combos)}")
    print(f"Current position: {idx}")
    print(f"\nNext 10 searches:\n")

    for i in range(10):
        pos = (idx + i) % len(combos)
        suburb, keyword, province, _ = combos[pos]
        print(f"  {i + 1:>2}. \"{keyword}\" in {suburb} ({province})")

    print()
