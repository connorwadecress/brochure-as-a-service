# SOLID & Clean Architecture Decisions

## Restructure performed: April 2026

This documents the architectural decisions made during the Clean Architecture restructure of both the engine and pipeline subsystems.

---

## Single Responsibility Principle (SRP)

### Engine
- `create-site.js` was a 185-line monolith doing CLI, AI calls, validation, and file I/O. Split into:
  - `lib/intake.js` → CLI readline prompts only
  - `lib/ai-generator.js` → Claude API + retry only
  - `lib/validator.js` → JSON Schema validation only
  - `lib/site-writer.js` → file system output only
  - `create-site.js` → thin composition root (wires modules)
- `generate.js` was already clean — kept as-is, added quick key validation and whatsappUrl helper registration.

### Pipeline
- `prospector.py` was a 350-line monolith. Split into:
  - `lib/config.py` → config loading only
  - `lib/rotation.py` → combo building + state only
  - `lib/google_places.py` → HTTP client only
  - `lib/lead_filter.py` → business filtering only
  - `lib/tracker_writer.py` → Excel I/O only
  - `lib/stats.py` → display/reporting only
  - `prospector.py` → thin composition root

---

## Open/Closed Principle (OCP)

- **Suburbs and industries** extracted from hardcoded `SUBURBS`/`INDUSTRIES` dicts into `pipeline/data/rotation-config.json`. Add new locations/verticals by editing JSON — no Python changes.
- **AI system prompt** extracted from inline template literal into `engine/prompts/system.md`. Tweak AI generation behaviour by editing markdown — no JS changes.
- Template partials were already OCP-clean (add a new partial by adding a file + registering it).

---

## Interface Segregation Principle (ISP)

- Each `lib/` module exports only what its callers need — no fat interfaces.
- `lib/validator.js` has two separate exports (`quickValidate` for fast checks, `validateAgainstSchema` for full AJV) so callers can use the appropriate tier.

---

## Dependency Inversion Principle (DIP)

- `lib/ai-generator.js` constructs `new Anthropic()` internally. The model, prompt path, retry policy are named constants (easy to change without touching caller).
- `lib/google_places.py` accepts `api_key` as a parameter (not reading config itself) — making it independently testable.
- `lib/tracker_writer.py` and `lib/stats.py` use a module-level `TRACKER_PATH` constant, not hardcoded paths scattered in function bodies.

---

## Template DRY Fix

- `{{whatsappUrl number [message]}}` Handlebars helper added to `generate.js`.
- Replaced 7 hand-rolled `https://wa.me/{{number}}?text={{encodeURI message}}` occurrences across 6 partials (nav×2, hero, about, cta-banner, footer×2, whatsapp-fab).
- URL construction logic is now in exactly one place.

---

## Bug Fixes Applied

| Bug | Fix |
|-----|-----|
| `form.action = null` → `fetch(null)` crash | `contact.hbs` now omits `action` attr when `formAction` is null. `main.js` checks `form.getAttribute('action')` and shows success immediately in demo mode. |
| No AI output validation | `lib/validator.js` adds 2-tier validation: quick key check + full AJV schema validation. Both `create-site.js` and `generate.js` validate before proceeding. |
| No API retry | `lib/ai-generator.js` retries 3× on 429/500/503 with exponential backoff (1s, 3s, 9s). `lib/google_places.py` retries 3× on 429/5xx. |
| Excel file locked | `lib/tracker_writer.py` catches `PermissionError` and logs an actionable message. |
| `import random` inside function | Moved to top-level import in `lib/rotation.py`. |
| `print()` everywhere in pipeline | Now uses Python `logging` module with `INFO` level. |
| No type hints in Python | All `lib/` modules have full type annotations. |

---

## What Was NOT Changed (intentionally)

- `generate.js` structure (already clean — SRP-compliant)
- Handlebars partial structure (already OCP-clean)
- CSS architecture (`--site-*` tokens are well-designed)
- `Run-Prospector.ps1` (already clean)
- `site-data.schema.json` (stable contract — not modified to avoid breaking existing sites)
