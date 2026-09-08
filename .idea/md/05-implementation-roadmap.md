# 05 — Implementation Roadmap (6 phases)

## Phase 0 — Prep (0.5 day, no visual change)

- [x] Add fonts in `src/app/layout.tsx`: `Archivo_Black`, `Space_Grotesk`, `JetBrains_Mono` alongside existing; verify `next/font` loads, `display: swap`. (done 2026-09-08 — alongside Zilla/Inter_Tight, `font-brutal-*` utilities opt in)
- [x] Add `brutal-*` tokens + utilities to `src/app/globals.css` **additively** (do not delete soft UI yet). (done — runtime `--brutal-ink/shadow` vars invert in dark; `.tactile`/`.hover-lift`/`.card-shadow`/`.ledger` kept as aliases)
- [x] Add eslint guard: forbid `shadow-(sm|md|lg|xl|2xl)`, `backdrop-blur`, `bg-gradient-` inside `src/app/app/**` and `src/components/(ui|app)/**` (allow in `editorial-landing` only until Phase 4). (done — `no-restricted-syntax` at warn; fires only on 5 known pre-Phase-2 sites)
- [x] Snapshot: `npm run build`, `npm test`, screenshots of `/`, `/app`, `/app/today`, `/app/calendar` (light+dark, 1440 + 375). (done — build OK, 113/113 tests, full `ui-review.mjs` capture: 37 shots, 0 console errors, 0 overflow)

## Phase 1 — Tokens + primitives (1–2 days)

Files: `src/app/globals.css`, `src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, `progress.tsx`, `skeleton.tsx`, `switch.tsx`.
- [x] Migrate button/card/badge/input first. Keep old class names as aliases (`tactile` → `brutal-press`, `card-shadow` → `shadow-brutal`) so call sites don't break. (done 2026-09-08 — button: lime/ink/danger-fill variants + h-11 md + 6px radius; card: 2px ink + shadow-brutal + display title; badge: mono uppercase chip; input: h-11 + blue hard-shadow focus; progress: h-4 bordered track + lime fill; skeleton: flat bordered; switch: w-12/h-7 lime-on)
- [x] Skeleton: flat `bg-muted border-2 border-ink` blocks (no shimmer gradient) — keep `aria-busy`. (done — shimmer removed, aria-hidden kept)
- [x] Validate: typecheck + unit tests green, buttons press correctly, focus rings visible. (done — tsc clean, 113/113, build OK, smoke 18/18, screenshots verified light+dark; focus upgraded to 3px solid + offset globally per 06)

## Phase 2 — Overlays + shell (1–2 days)

Files: `dialog.tsx`, `toaster.tsx`, `theme-toggle.tsx`, `components/app/app-shell.tsx`.
- Dialog focus trap + labelledby/describedby (already present — regression-test, don't regress).
- More sheet for mobile, notification single-source fix (already present — keep).
- Dark brutal shadows (cream) + `color-scheme` toggle via existing `__spSetTheme`.
- Validate on mobile 375px: dock fits, More opens, toasts don't cover CTA.

## Phase 3 — Core loops (3–4 days, highest value)

Order: dashboard (`src/app/app/page.tsx`) → today (+ `plan-item-row.tsx`, `plan-actions.tsx`) → tasks (`task-manager.tsx`) → syllabus/subjects (`syllabus-manager.tsx`, `subject-manager.tsx`) → focus (`focus-timer.tsx`).
- Enforce: one lime primary per viewport, ledger rows, 44px targets, confirm/undo deletes.
- Keep engine calls identical — visual only. Do not touch `lib/engine/*`, `lib/actions/*`, `lib/db/*`.
- Validate per page with `07` checklist + `node scripts/flow-qa.mjs`.

## Phase 4 — Secondary surfaces (2–3 days)

Order: calendar (`calendar-view.tsx`) → exams (`exams-workspace.tsx`, `exam-manager.tsx`) → progress/charts → chat/quiz/flashcards/mindmap → achievements → settings → auth/onboarding → landing (`src/app/page.tsx`).
- Landing is loudest — do last so app restraint is established first.
- Charts: flat fills + ink strokes; heatmap bordered cells.
- Onboarding: named swatches, min-viable path, back-safety.

## Phase 5 — Cleanup + lock (1 day)

- [ ] Delete from `globals.css`: `neo-raise/inset`, `bevel-top`, `glass`, `orb`, `shine`, `tilt-3d`, `glare`, `soft-grid`, `text-gradient`, `Zilla_Slab/Inter_Tight` vars (after layout font swap).
- [ ] Remove `tilt.tsx` usage or reimplement as press-only (no 3D glare).
- [ ] Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `node scripts/smoke.mjs` (expect 14/14), `flow-qa`, `visual-qa` (calendar light/dark/week).
- [ ] Update `src/app/updated-ui-ux.md` continuation note + this folder's README status.

## File-by-file migration table

| Priority | Files | Change |
|----------|-------|--------|
| P0 | `globals.css`, `layout.tsx` | tokens + fonts |
| P0 | `ui/button.tsx`, `ui/card.tsx`, `ui/badge.tsx` | brutal variants |
| P1 | `ui/dialog.tsx`, `ui/toaster.tsx`, `app-shell.tsx` | overlays + nav |
| P1 | `app/page.tsx` (dashboard), `app/today/page.tsx` | primary action first |
| P2 | `task-manager`, `syllabus-manager`, `subject-manager`, `focus-timer` | ledger + dial |
| P3 | `calendar-view`, `exams-workspace`, `charts`, `chat-view` | grids + bubbles |
| P4 | `login/`, `signup/`, `onboarding/`, `src/app/page.tsx` landing | split auth + hero |

## Risks + mitigations

- **Too loud inside app** → enforce color budget (paper+ink+lime+1), ledger over cards, shadow tier-down on mobile.
- **Dark mode contrast fail** → verify AA on every fill (use cream shadows, never gray-on-gray).
- **Chart readability loss** → keep ink strokes + labels, test colorblind-safe fills (lime/yellow + blue + pink distinct).
- **Motion sickness** → single entrance system, 150ms press only, full `prefers-reduced-motion` kill (see 06).
- **Regression of a11y fixes** → re-run dialog/label/notification/More tests every phase (see 07).
- **Trend fatigue (Figma lesson)** → tokens swappable; softening = change 3 shadow vars, not rewrite.

## Rollback

Each phase is additive + alias-based. Rollback = revert phase commit, old soft classes still present until Phase 5. Never delete old + add new in same commit before visual QA passes.
