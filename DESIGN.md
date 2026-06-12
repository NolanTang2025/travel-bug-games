# DESIGN.md — Mnemo / Travel Bug Games

> Riso-printed pocket zine for travel memories, AI mini-games, and your digital twin.  
> Inspired by [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) — drop this file for agents to keep UI consistent.

## 1. Visual Theme & Atmosphere

- **Mood:** Warm, handmade, slightly misregistered — like a risograph travel zine stapled in a hostel.
- **Density:** Airy marketing pages; diary pages feel lined and tactile; game HUD stays minimal.
- **Philosophy:** Playful but legible. Offset shadows instead of soft blur. Rotation ±1–3° on stickers only.
- **Travel layer:** Photography-forward moments (polaroids), map-pin accents, journal handwriting for emotional copy.

## 2. Color Palette & Roles

| Token | Hex (approx) | Role |
|-------|----------------|------|
| `riso-pink` | #ff3b7b | Primary CTA, brand accent, active emphasis |
| `riso-yellow` | #f5e642 | Highlights, mobile nav active, stickers |
| `riso-cyan` | #5ec8e8 | Secondary actions, Google login, links accent |
| `riso-violet` | #7b5cff | Rare accent, gradients |
| `riso-lime` | #b8e986 | Success / playful stickers |
| `riso-ink` | #1a1a24 | Borders, text, footer, marquee |
| `background` | #f7f4ed | Page canvas (warm paper) |
| `background` (card) | #fdfcf9 | Sticker surfaces |

**Gradients:** `gradient-ultraviolet`, `gradient-peach` for hero orbs only — never full-page backgrounds.

## 3. Typography Rules

| Role | Family | Size | Weight | Tracking |
|------|--------|------|--------|----------|
| Display / H1 | Archivo Black (`font-display`) | clamp 2.5–4rem | 900 | tight |
| Section H2 | `font-display` | 1.5–2rem | 900 | uppercase optional |
| Hand / diary | Caveat (`font-hand`) | 1.25–2rem | 400–700 | normal |
| UI / meta | JetBrains Mono (`font-mono`) | 10–14px | 400–700 | 0.2–0.35em uppercase for labels |
| Body | Space Grotesk (default) | 14–18px | 400 | normal |

- **Chroma headlines:** `.text-chroma-lg` on hero words only (cyan/pink shadow).
- **Never** use generic system sans for buttons — always `font-display` uppercase on CTAs.

## 4. Component Stylings

### Buttons (`.riso-btn-*`)

- Base: `.sticker` + `rounded-full` + `font-display` + `uppercase` + `tracking-[0.12em]`
- **Primary:** `bg-riso-pink text-background` — main action (Make a game, Send, 用邮箱登录)
- **Secondary:** `bg-background text-riso-ink` — alternate path (Open journal)
- **Google:** `bg-riso-cyan text-riso-ink` + icon in `sticker-sm` white circle, hover rotate icon −6°
- **Ghost:** `border-2 border-riso-ink bg-transparent` — dismiss, back links in footer nav
- Disabled: `opacity-50`, no hover lift

### Cards

- `.riso-card` = `sticker rounded-2xl bg-background p-6 sm:p-8`
- Optional tilt: `rotate-1` / `rotate--2` on marketing cards only
- Diary spread: `.diary-paper` / `.diary-paper-plain` — never add sticker shadow on inner lined area

### Inputs

- `.riso-input`: `border-2 border-riso-ink/30`, `rounded-lg`, `font-mono text-sm`
- Focus: `border-riso-pink`, no ring glow

### Navigation (SiteShell)

- Desktop active: pink underline bar OR `bg-riso-yellow` pill
- Mobile tab: active = `bg-riso-yellow text-riso-ink`

## 5. Layout Principles

- Max content width: `1280px` shell, `900px` dashboards, `640px` forms
- Section padding: `py-10 sm:py-14`, horizontal `px-4 sm:px-6`
- Spacing scale: 4 / 6 / 8 / 10 / 14 (Tailwind)
- Whitespace: let headlines breathe; stack CTAs with `gap-4`

## 6. Depth & Elevation

- **Only** `.sticker` / `.sticker-sm` use offset shadow (`--shadow-pop`, `--shadow-pop-sm`)
- Hover: translate (−2px, −2px) + larger shadow — never scale buttons
- No Material-style elevation on inputs or flat text blocks

## 7. Do's and Don'ts

**Do**

- Use warm paper background and ink borders everywhere
- Pair `font-hand` with `font-mono` labels on journal flows
- Keep Google logo in a bordered circle on cyan sticker button
- Use 中文 for user-facing copy on Twin / Login / Journal

**Don't**

- Google Material white gray buttons on this site
- Purple gradients on forms (reserved for hero)
- Drop shadows without ink offset
- More than 3 accent colors in one card

## 8. Responsive Behavior

- Mobile: bottom nav tabs in SiteShell; full-width CTAs
- Touch targets: min 44px height on buttons (`py-3.5` minimum)
- Hero type scales with `clamp`; polaroids wrap in flex

## 9. Agent Prompt Guide

```
Build UI for Mnemo (Travel Bug Games) using DESIGN.md:
- Riso sticker buttons (pink primary, cyan Google, yellow highlights)
- Archivo Black headlines, Caveat for diary, mono eyebrows
- Warm paper #f7f4ed, ink borders 2.5px, offset shadow on cards only
- No generic Google/Stripe button styles
```

Reference: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
