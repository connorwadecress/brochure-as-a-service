# Template Partials Reference

## Layout

- `engine/layouts/brochure.hbs` — Master layout that includes all partials and injects `{{{inlineCss}}}` and `{{{inlineJs}}}` into the page.

## Partials (in page order)

| Partial | File | Purpose |
|---------|------|---------|
| head | `engine/partials/head.hbs` | HTML `<head>`: meta tags, Google Fonts, Font Awesome CDN, inline CSS |
| nav | `engine/partials/nav.hbs` | Top navigation bar with logo + mobile hamburger |
| hero | `engine/partials/hero.hbs` | Hero section: badge, title lines, subtitle, CTAs, trust avatars, image placeholder, floating card |
| trust-bar | `engine/partials/trust-bar.hbs` | Stats/trust indicators strip (years, projects, rating, etc.) |
| services | `engine/partials/services.hbs` | Service cards grid with icons and descriptions |
| about | `engine/partials/about.hbs` | About section: paragraphs, bullet points, image, CTA |
| gallery | `engine/partials/gallery.hbs` | Photo gallery grid with placeholder labels |
| testimonials | `engine/partials/testimonials.hbs` | Client testimonials with star ratings |
| cta-banner | `engine/partials/cta-banner.hbs` | Full-width call-to-action banner |
| contact | `engine/partials/contact.hbs` | Contact form, hours table, social links, address |
| footer | `engine/partials/footer.hbs` | Footer with service links, quick links, social icons, credits |
| whatsapp-fab | `engine/partials/whatsapp-fab.hbs` | Floating WhatsApp action button (bottom-right) |

## Custom Handlebars Helpers

- `{{stars N}}` — Renders N star characters (e.g., `{{stars 5}}` → "★★★★★")
- `{{encodeURI str}}` — URL-encodes a string for use in href attributes

## CSS Architecture

1. `tokens/variables.css` — Design tokens (CSS custom properties for colors, spacing, typography)
2. `styles/base.css` — Resets, typography, global layout
3. `styles/components.css` — Per-component styles (nav, hero, cards, forms, etc.)
4. `styles/responsive.css` — Media queries for mobile/tablet breakpoints

All CSS is concatenated and inlined into the `<style>` tag by `generate.js`.
