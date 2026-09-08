# StudyPilot — Neo-Brutalism Redesign Framework

> Location: `.idea/md/` · Project: `Project-lock` (StudyPilot) · Stack: Next.js 16 App Router, React 19, Tailwind CSS v4, Drizzle + SQLite · Date: 2026-09-08

This folder is the **single source of truth** for redesigning StudyPilot from its current soft/neumorphic + editorial system into a disciplined **Neo-Brutalism 2.0** product UI.

## What neo-brutalism means here

Not "make everything ugly". Per 2026 consensus (onething.design, neubrutalism.com, empire-ui.com, neobrutalism.com):

- Thick ink borders (`2–3px solid #000`), hard offset shadows with **zero blur** (`4px 4px 0 0 #000`), flat saturated color fills, oversized black-weight display type, zero/low radius.
- Expressive on marketing surfaces, **restrained and systematic** inside the app. Hero can shout; dashboard must scan.
- Signature interaction: press = `translate(4px,4px) + shadow-none` in ~150ms. Feels mechanical, costs no JS.

## How to use this folder

| File | Purpose |
|------|---------|
| `01-neo-brutalism-research.md` | Internet research synthesis: 7 core traits, 2026 trends, dos/don'ts, references |
| `02-design-tokens.md` | Complete token system + Tailwind v4 `@theme` code to replace `src/app/globals.css` |
| `03-component-system.md` | Button/card/badge/input/dialog/nav/timer/chat/calendar specs mapped to `src/components/ui/*` and `src/components/app/*` |
| `04-page-by-page-redesign.md` | Every route (`/`, `/app/*`, `/login`, `/signup`, `/onboarding`) — layout, hierarchy, color assignment |
| `05-implementation-roadmap.md` | 6 phases, file-by-file migration order, risks, rollback plan |
| `06-accessibility-responsive-motion.md` | WCAG AA, focus, reduced-motion, mobile dock + More menu, dark mode |
| `07-qa-validation-checklist.md` | Pre-ship checklist per route + visual QA commands |

## Current baseline (audited 2026-09-08)

- `src/app/globals.css`: warm paper `#f7f3eb`, ink `#191919`, lime `#d8f36b`, coral `#ff654a`, blue `#4169e1`; soft dual shadows (`--shadow-raise`, `--shadow-pop`), `neo-raise/inset`, `bevel-top`, `glass`, `orb`, `shine`, `tilt-3d`. Fonts: `Zilla_Slab` display + `Inter_Tight` body via `next/font`.
- `src/components/ui/`: `button, card, badge, dialog, input, progress, skeleton, switch, avatar, toaster, theme-toggle, tilt`.
- `src/components/app/`: `app-shell, plan-item-row, task-manager, syllabus-manager, calendar-view, focus-timer, chat-view, exams-workspace, onboarding-wizard`, etc.
- `src/app/updated-ui-ux.md` rule: public = editorial/expressive, logged-in = calm/task-first. **Keep this rule.** Neo-brutalism must not flatten both surfaces into one loud style.
- Known risks to preserve fixes for: mobile More menu, notification single source of truth, dialog focus trap + `aria-labelledby/describedby`, `Field` label association, dashboard primary action (`Start next session`), destructive confirm/undo.

## Design decision (locked)

1. **Keep product IA, routes, copy, engine.** Redesign is visual + interaction only. No renaming of plan/syllabus/deadlines/focus/readiness/progress/Pilot language.
2. **Replace soft depth with hard depth.** Delete `neo-raise/inset`, `bevel-top`, `glass`, `orb`, `shine` inside app surfaces. Keep one entrance system per surface.
3. **Three-tier shadow system only** (see `02-design-tokens.md`). No ad-hoc shadows.
4. **Fonts change:** Display `Archivo Black` (or `Space Grotesk 700` fallback), Body `Space Grotesk` or keep `Inter Tight`, Mono `JetBrains Mono` for stamps/meta. Remove `Zilla Slab` after migration.
5. **Radius:** `0px` marketing, `0–6px` app cards, pills only for status chips.
6. **Dark mode:** inverted brutalism — paper `#181818`, ink borders stay black on light cards, cream `#FFF6E5` / white offset shadows on dark surfaces. No blurred glows.

## Quick start for implementer

1. Read `01` → `02` in order.
2. Implement Phase 1 tokens in `src/app/globals.css` (side-by-side `brutal-*` utilities, do not delete old classes yet).
3. Migrate `ui/button.tsx` → `ui/card.tsx` → `ui/badge.tsx` → `ui/input.tsx` → `ui/dialog.tsx` (Phase 2).
4. Then `app-shell.tsx` + dashboard + today (Phase 3) — validate with `07` checklist.
5. Landing last (Phase 4) — it can be loudest.

Do not start coding without reading `06` (a11y) and `07` (QA). High-contrast borders help a11y only if focus states, contrast ratios, and reduced-motion are verified.
