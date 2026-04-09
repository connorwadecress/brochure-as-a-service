# Lead Prospector — Setup Guide

Get this running in 5 minutes.

---

## Step 1: Install Python dependencies

Open PowerShell in this folder and run:

```powershell
pip install requests openpyxl
```

## Step 2: Get a Google Places API key (free)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one) — name it something like "BrochureLeads"
3. Go to **APIs & Services > Library**
4. Search for **"Places API (New)"** and click **Enable**
5. Go to **APIs & Services > Credentials**
6. Click **Create Credentials > API Key**
7. Copy the key

**About cost:** Google gives you $200/month free credit. Each search costs ~$0.03. That's ~6,000 searches per month for free. You'll never hit this.

**Recommended:** Restrict the key to only the Places API for security. In the key settings, under "API restrictions", select "Restrict key" and choose "Places API (New)".

## Step 3: Set up config.json

```powershell
copy config.example.json config.json
```

Open `config.json` and paste your API key:

```json
{
  "google_places_api_key": "AIzaSy.....your_key_here",
  "max_results_per_search": 15
}
```

## Step 4: Run it

```powershell
# Auto-search (picks next suburb + industry from the rotation)
.\Run-Prospector.ps1

# Search a specific combo
.\Run-Prospector.ps1 -Suburb "Sandton" -Industry "plumber"

# Do 3 searches in a row (burst mode)
.\Run-Prospector.ps1 -Burst 3

# Preview what it finds without writing to the spreadsheet
.\Run-Prospector.ps1 -DryRun

# See what's coming up next in the rotation
.\Run-Prospector.ps1 -List

# See your tracker stats
.\Run-Prospector.ps1 -Stats
```

---

## How it works

1. The script picks the next suburb + industry combo from a built-in rotation (45 suburbs × 30+ keywords = 1,000+ unique searches)
2. Calls Google Places API to search Google Maps for that combo
3. Filters out businesses that already have a website
4. Checks for duplicates against your existing tracker
5. Appends qualified leads to `lead-tracker.xlsx`
6. Prints a summary of what it found

Each run takes about 5 seconds and finds 3-8 leads on average.

## Suggested routine

- Morning: `.\Run-Prospector.ps1 -Burst 3` (3 searches, ~10-20 leads)
- Lunch: `.\Run-Prospector.ps1 -Burst 2` (2 more)
- Evening: `.\Run-Prospector.ps1 -Stats` (check your numbers)

That's 5 runs a day, auto-rotating through suburbs and industries. Within a week you'll have 100+ qualified leads without lifting a finger.
