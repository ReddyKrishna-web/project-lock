# 06 — Accessibility, Responsive, Motion, Dark Mode

## 1. Accessibility (WCAG 2.2 AA — non-negotiable)

- [ ] Contrast: body 4.5:1, large text 3:1. Combos pre-approved: ink on paper/white/lime/yellow/pink-fills; cream `#FFF6E5` on ink/black/blue-dark; white on `#2B5CE6` large-only. Test every subject fill + semantic fill with ink text before ship.
- [ ] Focus: `:focus-visible { outline: 3px solid #2B5CE6; outline-offset: 2px; border-radius: 4px; }` Dark: outline `#FFDB33`. Never remove outline for brutal aesthetics. Dialog/sheet focus trap + restore to trigger (keep current implementation).
- [ ] Labels: every `Field` gets `id` + `htmlFor`. Errors: adjacent + `role="alert"` + `aria-invalid`. Fix existing debt during Phase 1.
- [ ] Semantics: `aria-current="page"` nav, `aria-pressed` filters, `aria-expanded/haspopup` More menu, `role=dialog aria-modal` + labelledby/describedby, icon-only buttons get `aria-label` + tooltip.
- [ ] No color-only: status = fill + border + icon + text. Charts get direct labels + patterns (dashed vs solid strokes) + table fallback (`<details>Data table</details>`).
- [ ] Touch: 44px min for primary/mobile controls; completion checkbox 28px visual, 44px hit via padding.
- [ ] Keyboard: all DnD has button alternative (`Move to tomorrow`, `Reschedule` dialog); chips/filters tabbable; timer operable (Space = start/pause).

## 2. Responsive

- Breakpoints: `375 / 640 / 1024 / 1440`. Design mobile-first for rows, desktop-first for hero.
- Shadows step down on mobile: `lg→md`, `md→sm`. Hero preview `14px→8px` (keep existing rule, harden to ink/coral).
- Task/plan rows: metadata wraps under title at `<640px`; actions collapse to `...` menu except primary (Start/Complete stays visible).
- Tables → ledger cards at `<640px`. Calendar month → agenda list at `<640px` (keep week view as horizontal scroll with sticky time gutter as interim).
- Dock: 6 items max (5 + More). Long labels truncated with full `aria-label`.
- Type: H1 `clamp()` everywhere; no fixed 72px on mobile; body 16px min (no 14px dense tables on mobile).

## 3. Motion (one system per surface)

- Allowed: `brutal-press` (150ms), fade-up entrance (500ms, once, staggered max 6), marquee (landing only, pause on hover/focus), timer tick (1s steps).
- Banned in app: float/tilt/shine/pulse/glow/breath simultaneously; blurred orbs; springovershoot. Delete `animate-float*, rise-3d, shine, glow, breath` from app surfaces (keep one `animate-fade-up` + `stagger`).
- `prefers-reduced-motion: reduce` → kill ALL animation/transition (keep existing global kill block, extend to marquee + ledger stagger + DnD nudge).

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  .marquee { animation: none !important; }
}
```

## 4. Dark mode (inverted brutalism)

- Tokens: `bg #181818`, `card #222`, `text #FFF6E5`, borders `2px #FFF6E5` on dark cards OR keep black cards with cream shadows. Primary lime stays (ink text on lime passes in dark too).
- Shadows: `4px 4px 0 0 #FFF6E5` (light cards need black shadow; dark cards need cream shadow — pick per component, never gray blur).
- Focus ring dark: yellow `#FFDB33`. Charts dark: brighten fills (`#9DBBFF` family already in tokens — reuse).
- Toggle: keep `sp-theme` localStorage + `__spSetTheme` + `color-scheme` sync. Test flash-of-wrong-theme on reload.

## 5. Content + language (keep StudyPilot voice)

Use plan/syllabus/deadlines/focus/readiness/progress/Pilot. Buttons verb-first: `Build my study plan`, `Start focus`, `Review deadline`, `Open syllabus`. Empty states specific + actionable. Never imply unshipped billing/AI/integrations.
