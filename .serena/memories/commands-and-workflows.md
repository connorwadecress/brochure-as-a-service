# Commands & Workflows

## Engine Commands

```bash
# Install dependencies
cd engine && npm install

# Create a new site (interactive CLI, calls Claude API)
cd engine && node create-site.js
# Or via PowerShell:
.\engine\create-site.ps1

# Regenerate HTML from existing site data
cd engine && node generate.js ../sites/example/site-data.json

# Generate example site
cd engine && npm run generate:example

# Preview a generated site
npx serve sites/example
# Or via launch.json: port 3456
```

## Pipeline Commands

```bash
# Install Python deps
pip install requests openpyxl

# Setup config
cp pipeline/config.example.json pipeline/config.json
# Then add Google Places API key

# Auto-rotation search
.\pipeline\Run-Prospector.ps1
# Or: cd pipeline && python prospector.py

# Manual search
python pipeline/prospector.py --suburb Sandton --industry plumber

# Burst mode (multiple searches)
.\pipeline\Run-Prospector.ps1 -Burst 3

# Dry run (no spreadsheet write)
.\pipeline\Run-Prospector.ps1 -DryRun

# View stats
python pipeline/prospector.py --stats

# View upcoming rotation
python pipeline/prospector.py --list
```

## Environment Variables

- `ANTHROPIC_API_KEY` — Required for `create-site.js` (Claude API access)
- Google Places API key — Stored in `pipeline/config.json` (not env var)
