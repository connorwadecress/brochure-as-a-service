# Engine

Node.js site generator. Takes business details, calls Claude Haiku, validates the output, and compiles a self-contained `index.html` brochure site.

---

## Architecture

```
engine/
├── create-site.js        ← Thin orchestrator (entry point)
├── generate.js           ← Pure template compiler (entry point)
├── lib/
│   ├── intake.js         ← SRP: CLI readline prompts + input assembly
│   ├── ai-generator.js   ← SRP: Claude API calls with exponential-backoff retry
│   ├── validator.js      ← SRP: JSON Schema validation (AJV draft 2020-12)
│   └── site-writer.js    ← SRP: file system output (slugify, write, generate)
├── prompts/
│   └── system.md         ← OCP: AI generation rules — edit here, not in code
├── layouts/
│   └── brochure.hbs      ← Handlebars master layout
├── partials/             ← 12 Handlebars section partials
├── tokens/
│   └── variables.css     ← CSS custom properties (--site-* design tokens)
├── styles/
│   ├── base.css          ← Reset, typography, buttons
│   ├── components.css    ← Nav, hero, cards, contact, footer, etc.
│   └── responsive.css    ← Media queries: 1024px, 768px, 480px
├── scripts/
│   └── main.js           ← Client-side JS (inlined into output)
└── schema/
    └── site-data.schema.json  ← The contract: AI generation ↔ template engine
```

---

## Two Entry Points

### `create-site.js` — Interactive site creation

Collects business details, calls Claude AI, validates output, writes files.

```bash
node create-site.js
# or:
npm run create
```

Requires `ANTHROPIC_API_KEY` env var.

### `generate.js` — Recompile from existing data

Validates and recompiles an existing `site-data.json` into a fresh `index.html`.

```bash
node generate.js ../sites/example/site-data.json
# or:
npm run generate:example
```

---

## Lib Modules

| Module | Exports | What it does |
|--------|---------|-------------|
| `lib/intake.js` | `IntakeSession` | readline prompts — collects business details + free-text context |
| `lib/ai-generator.js` | `generateSiteData()`, `parseAiOutput()` | Claude Haiku API with 3-attempt retry (1s/3s/9s backoff) |
| `lib/validator.js` | `quickValidate()`, `validateAgainstSchema()` | 2-tier: fast key check + full AJV 2020-12 validation |
| `lib/site-writer.js` | `slugify()`, `writeSiteData()`, `generateHtml()`, `saveDebugOutput()` | all file-system writes |

---

## Handlebars Helpers

| Helper | Usage | Output |
|--------|-------|--------|
| `{{stars N}}` | `{{stars 5}}` | `★★★★★` |
| `{{encodeURI str}}` | `{{encodeURI contact.whatsapp.message}}` | URL-encoded string |
| `{{whatsappUrl number [message]}}` | `{{whatsappUrl contact.whatsapp.number contact.whatsapp.message}}` | `https://wa.me/27...?text=...` |

Use `{{whatsappUrl}}` in all partials — do NOT hand-roll `https://wa.me/` URLs.

---

## Schema Contract

`schema/site-data.schema.json` is the binding contract between AI generation and the template engine.

- Validated at runtime by `lib/validator.js` in both `create-site.js` and `generate.js`
- **Required keys**: `meta`, `business`, `contact`, `navLinks`, `hero`, `services`
- **Optional keys**: `about`, `gallery`, `testimonials`, `ctaBanner`, `footer`, `whatsappFab`, `palette`, `hours`, `social`, `trustBar`
- Any template partial changes must stay in sync with this schema

---

## CSS Architecture

All CSS is concatenated and inlined into `<style>` by `generate.js`. Layer order:

1. `tokens/variables.css` — design tokens (`--site-brand-primary`, `--site-spacing-lg`, etc.)
2. `styles/base.css` — reset, typography, container, buttons
3. `styles/components.css` — per-component styles
4. `styles/responsive.css` — media queries (1024px tablet, 768px mobile, 480px small)

Palette overrides (`palette.brandPrimary`, etc.) are injected by `head.hbs` as a second `:root{}` block — no CSS changes needed per site.

---

## Form Handling (Demo Mode)

When `contact.formAction` is `null` in `site-data.json`:
- `contact.hbs` renders the `<form>` with **no `action` attribute**
- `main.js` detects the missing attribute and shows the success message immediately — no HTTP request is made
- To activate real form submission, set `formAction` to a Formspree or similar endpoint URL

---

## Output

Each generated site is a **fully self-contained** `index.html` file:
- All CSS inlined in `<style>`
- All JS inlined in `<script>`
- External dependencies: Google Fonts CDN + Font Awesome 6.5.0 CDN only
- Images: all `src` fields are `null` by default — Font Awesome icons serve as placeholders

---

## Setup

```bash
npm install        # Installs handlebars, @anthropic-ai/sdk, ajv
export ANTHROPIC_API_KEY=sk-ant-...
node create-site.js
```
