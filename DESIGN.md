# Togly — Brand & Design Guidelines

This file defines the complete visual language for Togly. All UI work must follow these guidelines exactly. Do not deviate from colors, typography, spacing, or component patterns without explicit instruction.

---

## 1. Brand Identity

**Product name:** Togly  
**Tone:** Corporate-polished, clean, and modern — not playful or casual. Think professional networking tool, not a consumer social app.  
**Visual vibe:** Dark-first, ambient glow, glassmorphic surfaces, bold typography. Inspired by Pally and Partiful but grounded and corporate.

---

## 2. Color System

### Dark Mode (Primary)

| Token | Hex | Usage |
|---|---|---|
| `background` | `#0d0d1a` | Page background |
| `surface` | `#13132b` | Elevated surfaces, sidebars |
| `card` | `rgba(255,255,255,0.05)` | Glass cards (with backdrop-blur) |
| `card-border` | `rgba(255,255,255,0.08)` | Card borders |
| `primary` | `#7B6CF6` | Primary accent, CTAs, active states |
| `primary-hover` | `#9585f8` | Hover state for primary |
| `primary-glow` | `rgba(123,108,246,0.35)` | Glow shadow on primary elements |
| `primary-muted` | `rgba(123,108,246,0.15)` | Tinted backgrounds, subtle highlights |
| `text-primary` | `#ffffff` | Headings, primary text |
| `text-secondary` | `#a0a0b8` | Body text, descriptions |
| `text-muted` | `#5e5e7a` | Placeholder text, disabled states |
| `border` | `rgba(255,255,255,0.08)` | Dividers, input borders |
| `destructive` | `#ef4444` | Errors, delete actions |
| `success` | `#10b981` | Confirmations, success states |

### Light Mode

| Token | Hex | Usage |
|---|---|---|
| `background` | `#f5f4ff` | Page background (very light lavender tint) |
| `surface` | `#ffffff` | Cards, panels |
| `card` | `rgba(255,255,255,0.75)` | Glass cards (with backdrop-blur) |
| `card-border` | `rgba(0,0,0,0.07)` | Card borders |
| `primary` | `#6D5FE8` | Primary accent, CTAs, active states |
| `primary-hover` | `#5a4fd4` | Hover state for primary |
| `primary-glow` | `rgba(109,95,232,0.2)` | Glow shadow on primary elements |
| `primary-muted` | `rgba(109,95,232,0.08)` | Tinted backgrounds, subtle highlights |
| `text-primary` | `#0f0f1a` | Headings, primary text |
| `text-secondary` | `#4a4a6a` | Body text, descriptions |
| `text-muted` | `#9090b0` | Placeholder text, disabled states |
| `border` | `rgba(0,0,0,0.07)` | Dividers, input borders |
| `destructive` | `#dc2626` | Errors, delete actions |
| `success` | `#059669` | Confirmations, success states |

### Ambient Gradient (used on hero sections and key pages)

Dark mode:
```css
background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(123,108,246,0.25) 0%, transparent 70%), #0d0d1a;
```

Light mode:
```css
background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(109,95,232,0.12) 0%, transparent 70%), #f5f4ff;
```

---

## 3. Typography

**Font family:** Inter (import from Google Fonts)  
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

All text uses Inter. No secondary or decorative fonts.

### Scale

| Role | Size | Weight | Letter Spacing | Line Height |
|---|---|---|---|---|
| Display | 56–64px | 800 | -0.03em | 1.1 |
| H1 | 40–48px | 700 | -0.025em | 1.15 |
| H2 | 28–36px | 700 | -0.02em | 1.2 |
| H3 | 20–24px | 600 | -0.01em | 1.3 |
| Body Large | 18px | 400 | 0 | 1.6 |
| Body | 15–16px | 400 | 0 | 1.6 |
| Body Small | 13–14px | 400 | 0 | 1.5 |
| Label / Eyebrow | 11–12px | 600 | 0.08em | 1.4 |
| Stat / Number | Any size | 700 | -0.02em | 1 |

### Rules
- Headlines are always tight (`letter-spacing: -0.02em` to `-0.03em`)
- Eyebrow labels (small caps above a heading) are always uppercase with wide tracking (`letter-spacing: 0.08em`), `text-secondary` color
- Never use font weights below 400 or above 800
- Stat numbers use `tabular-nums` (`font-variant-numeric: tabular-nums`)

---

## 4. Spacing System

Base unit: **4px**

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Micro gaps (icon to text) |
| `space-2` | 8px | Tight internal spacing |
| `space-3` | 12px | Form field internals |
| `space-4` | 16px | Standard component gap |
| `space-5` | 20px | Card padding (mobile) |
| `space-6` | 24px | Card padding (desktop), section sub-gaps |
| `space-8` | 32px | Between sections within a view |
| `space-10` | 40px | Component-to-component spacing |
| `space-16` | 64px | Section vertical padding |
| `space-24` | 96px | Page-level section breaks |

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 8px | Small elements, badges, tags |
| `radius-md` | 12px | Inputs, small buttons |
| `radius-lg` | 16px | Standard buttons, smaller cards |
| `radius-xl` | 20px | Cards, modals, panels |
| `radius-2xl` | 24px | Large feature cards, hero containers |
| `radius-full` | 9999px | Pill buttons, avatars, tags |

Cards always use `radius-xl` (20px) or `radius-2xl` (24px). Never use sharp corners on cards.

---

## 6. Glass Effect (Glassmorphism)

This is a core visual element used on cards, modals, overlays, and floating panels.

### Dark Mode Glass
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 20px;
```

### Light Mode Glass
```css
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(0, 0, 0, 0.07);
border-radius: 20px;
```

### Elevated Glass (for modals, popovers — more opaque)
```css
/* Dark */
background: rgba(255, 255, 255, 0.09);
backdrop-filter: blur(24px);
border: 1px solid rgba(255, 255, 255, 0.12);

/* Light */
background: rgba(255, 255, 255, 0.88);
backdrop-filter: blur(24px);
border: 1px solid rgba(0, 0, 0, 0.09);
```

### Rules
- Never use a flat opaque background on a card — always glass or a very subtle surface color
- The blur value should be 12px minimum, 24px maximum
- Always pair with a subtle border to define the edge
- On dark backgrounds, the glow from the ambient gradient bleeds through glass — this is intentional and desirable

---

## 7. Shadows

### Dark Mode
```css
/* Card shadow */
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255,255,255,0.06) inset;

/* Primary/CTA glow shadow */
box-shadow: 0 0 24px rgba(123, 108, 246, 0.4), 0 4px 16px rgba(0,0,0,0.3);

/* Subtle shadow (inputs, small elements) */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
```

### Light Mode
```css
/* Card shadow */
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07), 0 1px 0 rgba(255,255,255,0.9) inset;

/* Primary/CTA glow shadow */
box-shadow: 0 0 20px rgba(109, 95, 232, 0.25), 0 4px 12px rgba(0,0,0,0.08);

/* Subtle shadow */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
```

---

## 8. Buttons

### Primary Button
- Background: `primary` color
- Text: white
- Border radius: `radius-lg` (16px) for standard, `radius-full` for hero CTAs
- Padding: `14px 24px` (standard), `16px 32px` (large/hero)
- Font: 15px, weight 600
- Hover: `primary-hover` + primary glow shadow
- Active: slightly darker, scale 0.98
- Transition: `all 150ms ease`

### Secondary / Ghost Button
- Background: glass effect (dark mode: `rgba(255,255,255,0.07)`, light: `rgba(0,0,0,0.04)`)
- Border: `1px solid` card-border color
- Text: `text-primary`
- Hover: slightly more opaque background
- Same radius and padding as primary

### Outline Button
- Background: transparent
- Border: `1px solid primary`
- Text: `primary`
- Hover: `primary-muted` background

### Disabled State
- Opacity: 0.4
- Cursor: not-allowed
- No hover effects

### Rules
- Never use sharp-cornered buttons
- CTA buttons in hero sections should always be pill-shaped (`radius-full`)
- Always include a hover transition — no instant state changes

---

## 9. Inputs & Form Fields

- Background: dark mode `rgba(255,255,255,0.05)`, light mode `rgba(0,0,0,0.03)`
- Border: `1px solid` border color
- Border on focus: `1px solid primary`
- Border radius: `radius-md` (12px)
- Padding: `12px 16px`
- Font: 15px, weight 400, `text-primary`
- Placeholder: `text-muted`
- Box shadow on focus: `0 0 0 3px primary-muted`
- Transition: `border-color 150ms ease, box-shadow 150ms ease`

No underline-only inputs except in full-screen step-by-step flows (e.g. the existing questionnaire form). All other contexts use the boxed input style above.

---

## 10. Navigation

- Position: sticky top, `backdrop-filter: blur(16px)`
- Background: dark mode `rgba(13,13,26,0.8)`, light mode `rgba(245,244,255,0.85)`
- Border-bottom: `1px solid` border color
- Height: 60–64px
- Layout: logo left, nav links center (or right of logo), CTA pill button far right
- Logo: product name in 600 weight, possibly with small icon/mark to the left
- Nav links: 14px, weight 500, `text-secondary`, hover `text-primary`
- CTA: primary pill button, compact (`12px 20px` padding)

---

## 11. Cards

Cards are the primary container for all content. Every card must:
- Use the glass effect (Section 6)
- Have `radius-xl` or `radius-2xl` corners
- Have `24px` internal padding (desktop), `20px` (mobile)
- Never have a hard, opaque flat background

### Card Variants

**Default card** — glass, subtle shadow, `radius-xl`

**Feature card** — larger, may have a gradient accent border:
```css
border: 1px solid;
border-image: linear-gradient(135deg, rgba(123,108,246,0.4), rgba(255,255,255,0.06)) 1;
border-radius: 24px; /* note: border-image disables border-radius — use a wrapper with overflow:hidden */
```

**Stat card** — compact, number-forward. Large tabular number in `text-primary`, small label below in `text-muted`, icon top-right.

---

## 12. Iconography

Use **Lucide React** (already installed). Stroke width: `1.5` for standard icons, `2` for small icons under 18px. Never use filled icons — always stroked.

Icon sizes:
- Inline with text: 16px
- Standard UI icon: 20px
- Feature/hero icon: 24–32px
- In a branded icon container: 20–24px inside a `40–48px` rounded container

Icon containers (for feature sections):
```css
width: 44px;
height: 44px;
border-radius: 12px;
background: primary-muted;
border: 1px solid rgba(123,108,246,0.2);
display: flex;
align-items: center;
justify-content: center;
```

---

## 13. Page Layout

### Max Width
- Content: `max-width: 1200px`, centered with `auto` horizontal margins
- Narrow content (forms, auth pages): `max-width: 480px`
- Reading content: `max-width: 680px`

### Page Padding
- Desktop: `0 48px`
- Tablet: `0 32px`
- Mobile: `0 20px`

### Section Structure
Every major page section follows this pattern:
1. Eyebrow label (uppercase, `text-muted`, `space-3` below)
2. Headline (`H1` or `H2`, `space-4` below)
3. Subtext (body, `text-secondary`, `space-8` below)
4. Content / cards / grid

---

## 14. Motion & Animation

- **Default easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out spring feel)
- **Duration:** 200ms for micro (hover, focus), 300ms for element transitions, 400ms for page-level
- **Entrance:** `translateY(8px) opacity(0)` → `translateY(0) opacity(1)`
- **Card hover:** `transform: translateY(-2px)`, shadow deepens slightly
- **Button hover:** `opacity: 0.9` or `primary-hover` color, no scale on standard buttons
- Never animate layout properties (`width`, `height`, `top`) — only `transform` and `opacity`
- Respect `prefers-reduced-motion`: wrap animations in `@media (prefers-reduced-motion: no-preference)`

---

## 15. Status & Feedback

| State | Color | Usage |
|---|---|---|
| Success | `#10b981` (emerald) | Completed, confirmed, matched |
| Warning | `#f59e0b` (amber) | Pending, in progress |
| Error | `#ef4444` (red) | Failed, invalid, destructive |
| Info | `#7B6CF6` (primary) | Informational, tips |

Success states use the emerald-tinted icon container pattern already in the codebase (`bg-emerald-100`, `text-emerald-600`).

---

## 16. Event Status Badges

Status badges use pill shape (`radius-full`), small font (12px, weight 600), tight padding (`4px 10px`):

| Status | Dark Mode | Light Mode |
|---|---|---|
| Draft | `rgba(255,255,255,0.08)` bg, `text-muted` text | `rgba(0,0,0,0.05)` bg, `text-muted` text |
| Open | `rgba(16,185,129,0.15)` bg, `#10b981` text | same |
| Closed | `rgba(245,158,11,0.15)` bg, `#f59e0b` text | same |
| Matched | `rgba(123,108,246,0.15)` bg, `#7B6CF6` text | same |
| Delivered | `rgba(123,108,246,0.25)` bg, `#7B6CF6` text, bolder | same |

---

## 17. What to Avoid

- **No flat opaque white or grey cards** — always use glass
- **No sharp corners** on cards, buttons, or inputs
- **No generic blue (`#3b82f6`)** as the accent — the palette is purple/violet only
- **No rainbow or multi-color accent palettes** — primary purple plus success/error only
- **No heavy drop shadows** on light-mode elements — keep them barely perceptible
- **No all-caps body text** — uppercase only for eyebrow labels
- **No font sizes below 11px**
- **No animations that move layout** — transform and opacity only
- **No solid-color hero sections** — always pair with the ambient radial gradient
