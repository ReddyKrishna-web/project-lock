# 02 — Design Tokens (Tailwind v4 `@theme`)

Target file: `src/app/globals.css`. Tailwind v4 = configure in CSS via `@theme`, not `tailwind.config.js`.
Keep old soft-UI vars during migration (prefix new with `brutal-`), delete old in Phase 5.

## 1. Color tokens

Keep StudyPilot identity (paper/ink/lime/coral/blue) — just flatten and harden.

```css
@theme {
  /* Base */
  --color-paper: #FFFDF5;        /* app bg, lighter than current #f7f3eb for harder contrast */
  --color-ink: #111111;          /* borders, text, shadows — pure-ish black */
  --color-card: #FFFFFF;
  --color-muted: #F1EDE3;
  --color-muted-foreground: #5B5750;
  --color-line: #111111;         /* brutal borders always ink */

  /* Brand flats — max 4 per viewport */
  --color-lime: #D8F36B;         /* primary action + hero */
  --color-coral: #FF654A;        /* emphasis / danger-adjacent highlight */
  --color-brutal-blue: #2B5CE6;  /* chapter bands, info (replaces #4169e1 for more punch) */
  --color-brutal-yellow: #FFDB33;/* alternate hero / warning fill */
  --color-brutal-pink: #FF90E8;  /* achievements / playful */
  --color-brutal-cyan: #00F0FF;  /* rare accent, charts */

  /* Semantic — flat fills + ink text, never gradient */
  --color-success: #0E7A5F; --color-success-fill: #B9F0D6;
  --color-warning: #8A5200; --color-warning-fill: #FFE38A;
  --color-danger: #C81E3A;  --color-danger-fill: #FFC9D2;
  --color-info: #2B5CE6;    --color-info-fill: #D3E0FF;

  /* Subject colors — flat, all pass AA with ink text */
  --color-subj-1: #D8F36B; --color-subj-2: #FF90E8;
  --color-subj-3: #7DF9FF; --color-subj-4: #FFDB33;
  --color-subj-5: #FFB643; --color-subj-6: #B6F09C;

  /* Dark mode */
  --color-paper-dark: #181818;
  --color-card-dark: #222222;
  --color-ink-dark: #FFF6E5;     /* cream text + cream shadow on dark */
}
```

Rules:
- App viewport default: `bg-paper text-ink`. Card: `bg-white border-2 border-ink`.
- Primary action: `bg-lime text-ink`. Never lime-on-white body text (fails contrast for small text — use ink text on lime fill only for large/bold).
- Status = fill + ink border + icon + text label. Never color alone.
- Charts (`recharts`): use flat subject/semantic fills with `stroke: #111, strokeWidth: 2`. No gradients.

## 2. Border + shadow + radius

```css
@theme {
  --border-width-brutal: 2px;
  --border-width-brutal-thick: 3px;

  --shadow-brutal-sm: 3px 3px 0 0 #111111;
  --shadow-brutal: 4px 4px 0 0 #111111;
  --shadow-brutal-md: 6px 6px 0 0 #111111;
  --shadow-brutal-lg: 8px 8px 0 0 #111111;
  --shadow-brutal-coral: 8px 8px 0 0 #FF654A;
  --shadow-brutal-none: 0 0 0 0 #111111;

  --radius-brutal-none: 0px;
  --radius-brutal-sm: 4px;
  --radius-brutal: 6px;
}
```

Utilities to add in `globals.css`:

```css
.brutal-card { @apply bg-white border-2 border-ink rounded-[6px] shadow-brutal; }
.brutal-btn { @apply border-2 border-ink rounded-[6px] shadow-brutal font-bold; transition: transform 150ms ease, box-shadow 150ms ease; }
.brutal-btn:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 0 #111; }
.brutal-btn:active { transform: translate(4px,4px); box-shadow: 0 0 0 0 #111; }
.brutal-chip { @apply border-2 border-ink rounded-full shadow-brutal-sm font-mono text-xs uppercase tracking-wide; }
.brutal-input { @apply bg-white border-2 border-ink rounded-[6px] px-3 py-2.5; }
.brutal-input:focus { outline: none; box-shadow: 4px 4px 0 0 #2B5CE6; border-color: #111; }
.brutal-ledger { border-top: 2px solid #111; }
.brutal-ledger-row { border-bottom: 2px solid #111; }
```

Responsive: `@media (max-width: 640px) { .brutal-card { box-shadow: 3px 3px 0 0 #111; } }` — hero preview `8px→4px`.

Dark mode:

```css
.dark .brutal-card { background: #222; border-color: #FFF6E5; box-shadow: 4px 4px 0 0 #FFF6E5; color: #FFF6E5; }
.dark .brutal-btn { border-color: #FFF6E5; box-shadow: 4px 4px 0 0 #FFF6E5; }
```

## 3. Typography

Replace in `src/app/layout.tsx`:

```ts
import { Archivo_Black, Space_Grotesk, JetBrains_Mono } from "next/font/google";
const display = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const sans = Space_Grotesk({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500","700"], variable: "--font-mono" });
```

```css
@theme {
  --font-display: var(--font-display), "Archivo Black", sans-serif;
  --font-sans: var(--font-sans), "Space Grotesk", system-ui, sans-serif;
  --font-mono: var(--font-mono), "JetBrains Mono", monospace;
}
h1 { @apply font-display font-black tracking-tight leading-none; font-size: clamp(2.5rem,5vw,4.5rem); }
h2 { @apply font-display font-bold tracking-tight; font-size: clamp(1.5rem,3vw,2.25rem); }
/* App page titles smaller: */
.app-title { font-size: clamp(1.75rem,3vw,2.5rem); }
.eyebrow { @apply font-mono text-xs uppercase tracking-widest; }
```

Body stays `Space Grotesk 400/500`, 65–75ch. Delete `Zilla_Slab` + `Inter_Tight` after migration. Verify license/loading (Google Fonts, `display: swap`).

## 4. Spacing + grid

- Base 4px. Card padding: `p-5` desktop, `p-4` mobile. Section gap `gap-6`.
- Paper grid background for landing/empty states only: `background-image: linear-gradient(#1111 1px, transparent 1px), ...; background-size: 32px 32px;` — subtle, not in dense app grids.
- Marquee band utility (landing + achievements): black band, cream text, rotated `-1deg`, mono uppercase.

## 5. What to delete

In `globals.css` Phase 5: `--shadow-raise*`, `--shadow-inset*`, `.neo-raise*`, `.neo-inset*`, `.bevel-top`, `.glass`, `.orb*`, `.shine`, `.tilt-3d`, `.glare`, `.soft-grid` (replace with hard grid), `.text-gradient` (replace with flat highlight: `background: #D8F36B; padding: 0 0.2em; border: 2px solid #111;`).
Keep: `ledger` (upgrade to `brutal-ledger`), `stamp` (upgrade to hard stamp), `section-head` (thicken to 3px ink rule), reduced-motion block.
