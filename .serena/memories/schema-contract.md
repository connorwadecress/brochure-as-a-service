# Schema Contract — site-data.schema.json

The JSON Schema at `engine/schema/site-data.schema.json` is the critical contract between AI content generation (`create-site.js`) and the Handlebars template engine (`generate.js`).

## Required Top-Level Keys

- `meta` — Page title, SEO description, Google Fonts URL, Font Awesome URL
- `business` — Business name, logo text parts (logoBefore, logoHighlight), tagline
- `contact` — Phone (display + href), WhatsApp (number + message), email, address, formAction
- `navLinks` — Array of {label, href} for navigation
- `hero` — Badge, title lines, subtitle, CTAs, trust avatars, image placeholder, floating card
- `services` — Label, title, subtitle, items array with {icon, title, description}

## Optional Sections

- `palette` — Brand color overrides (brandPrimary, brandDark, brandLight, bgDark). Null = use defaults.
- `hours` — Array of {days, time}
- `social` — Array of {url, icon, label}
- `trustBar` — Array of {value, suffix, label} for stats display
- `about` — Business story with paragraphs, bullet points, image
- `gallery` — Portfolio/work showcase (enabled flag, items with placeholderLabel)
- `testimonials` — Client reviews (enabled flag, items with stars, quote, author details)
- `ctaBanner` — Call-to-action banner with primary/secondary CTAs
- `footer` — Service links, quick links, credit text (must be "Website by" / "Agile Bridge" / agilebridge.co.za)
- `whatsappFab` — Floating WhatsApp button with tooltip and pre-filled message

## AI Generation Rules (from create-site.js system prompt)

- Output ONLY valid JSON, no markdown fences
- Use actual business details exactly as provided
- Generate palette from brand colour if provided, otherwise null
- Generate 3 realistic testimonials with SA-appropriate names
- Use Font Awesome 6 icons (fas fa-* or fab fa-*)
- All image src fields = null (placeholder mode)
- formAction = null (demo mode)
- Footer credits: "Website by" / "Agile Bridge" / "https://agilebridge.co.za"
- Google Fonts: Inter family; Font Awesome 6.5.0 CDN
