# 04 — Page-by-Page Redesign

Rule from `src/app/updated-ui-ux.md` (keep): **public = bold editorial, app = calm task-first.** Landing may use 3 colors + marquee + rotation; app uses paper + ink + lime + ONE semantic/subject color per viewport.

## 1. Landing `/` (`src/app/page.tsx`)

- Header: `border-b-[3px] border-ink bg-paper/95`, mark `bg-ink text-lime`, nav links mono uppercase, CTA `ink` button.
- Hero: lime band `border-b-[3px]`, H1 Archivo Black `clamp(3.5rem,8vw,6.5rem)` — keep copy `Your semester, finally in focus.` Highlight word with `bg-white border-2 border-ink px-2 shadow-brutal-sm rotate-[-1deg] inline-block` (replace coral text-only highlight). Subcopy Inter 18px, 60ch. CTAs: `Start free (ink lg)` + `Explore the edition (white lg)`. Preview: `border-[3px] shadow-brutal-coral rotate-[1.5deg]` (keep existing coral offset, harden border to 3px). Kill blurred orbs → hard dot-grid + 2 flat shapes (circle outline + blue square).
- Bands: marquee strip (`STUDY • PLAN • FOCUS • REPEAT`, black bg cream text, `-1deg`) between hero and how-it-works.
- How/Features/Pricing: chapter rule `border-t-[3px]`, index `01 — HOW IT WORKS` mono. Features on blue band (white cards, one coral card accent). Pricing: 3 white cards, middle = `bg-lime shadow-brutal-lg -rotate-1` + `MOST PICKED` stamp. FAQ: `border-2` ledger disclosures. Footer: black band, cream text, lime links.
- Mobile: H1 3.25rem, preview shadow `8px→4px`, shapes off-canvas (keep current responsive fix).

## 2. App shell `/app/*` (`app-shell.tsx`, `layout.tsx`)

Topbar `h-16 border-b-[3px] bg-paper`, sidebar `w-64 border-r-[3px]` (desktop), dock + More sheet (mobile). Page container `max-w-6xl mx-auto px-4 md:px-6 py-6`, soft background washes deleted → flat paper + one dot-grid behind page title only.

## 3. Dashboard `/app`

First viewport = ONE primary card: `Start next session — [Topic · Subject · 25m] [Start focus →]` (lime button) or fallback `Open today's plan`. Below: 3-col grid — `Today's progress (ring → brutal ring: thick track + ink needle)`, `Deadlines ledger (3 rows)`, `Exam countdown stamp`. Second viewport: weekly bars + weak topics + AI recommendation (white cards). Streak = stamp overlay top-right of progress card.

## 4. Today `/app/today`

Timeline ledger grouped by Morning/Afternoon/Evening (black sub-band headers). Each block row = checkbox + title + subject chip + time + actions (Start/Complete/Skip/Reschedule). Empty = dot-grid box `No blocks — [Generate plan] [Open syllabus]`. Missed-block notice = yellow band with redistribution explanation (keep engine copy).

## 5. Syllabus `/app/syllabus` + Subjects `/app/subjects`

Subject header cards (flat fills, 6-color cycle). Tree: unit header `bg-ink text-paper font-display` band; topic rows ledger with status chip + strong/weak icon. Progress bar brutal (see 03§8). Subject detail: exam date countdown chip + priority chip + trend arrow.

## 6. Exams `/app/exams` (`exams-workspace.tsx`, `exam-manager.tsx`)

Exam hero cards: `border-[3px] shadow-brutal` with huge mono countdown `12D 04H`, readiness bar, phase roadmap (Learn → Practice → Revise → Mock) as 4-step brutal stepper (done = lime fill + check, current = yellow + arrow, todo = white). Weak areas ledger + `Generate sessions` ink button.

## 7. Tasks `/app/tasks` (`task-manager.tsx`)

Filter rail = brutal chips with counts (`All 12 / Due 3 / Done 9`), `aria-pressed` + visible active fill. Rows ledger (see 03§7). Overdue = danger-fill left spine `border-l-8`. Delete → confirm dialog or undo toast.

## 8. Calendar `/app/calendar` (`calendar-view.tsx`)

Toolbar: view toggle (Week/Month) as segmented brutal control + `Today` white button. Week = 7 bordered columns; month = bordered grid. DnD: day-level only (keep limitation note), capacity-aware refusal = danger toast + shake-off (single `translateX` nudge, respects reduced-motion). Touch drag still out-of-scope — show `Tap → Reschedule` fallback button on mobile.

## 9. Chat `/app/chat` (`chat-view.tsx`)

Left: intent chips rail. Main: bubbles (see 03§10). Context bar: `Studying: [subject chip] [exam countdown chip]` above input. Input: `border-[3px] shadow-brutal` with `Ask Pilot...` + lime Send button. Works without key (local engine) — show `Local engine` vs `AI connected` chip in header (keep provider abstraction).

## 10. Focus `/app/focus` (`focus-timer.tsx`)

Centered dial card (see 03§9) + topic picker + length slider + session log ledger below. Complete → confetti replaced by stamp burst (`SESSION LOGGED` stamp + progress update, no particle lib).

## 11. Progress `/app/progress` (`charts.tsx`, `tuning-dashboard.tsx`)

Cards: weekly bars, heatmap, subject donut, completion %, consistency. All flat + ink strokes. Insights list = ledger with `→` action links (`Review weak topic`, `Adjust availability`).

## 12. Achievements `/app/achievements`

Sticker grid: locked = `bg-muted dashed border` + lock icon; unlocked = flat fill + rotation + `UNLOCKED` stamp + date mono. Marquee band on top (`STREAK • 12 DAYS • KEEP GOING`).

## 13. Settings `/app/settings` (`settings-manager.tsx`)

Sections: Profile / Preferences / Notifications / AI provider / Danger. Danger zone = `border-[3px] border-danger bg-danger-fill` card, buttons require confirm. Theme toggle = brutal switch (Light/System/Dark) with immediate `__spSetTheme` update (keep script in `layout.tsx`).

## 14. Auth `/login`, `/signup`

Split: left black panel (display headline + 3 proof bullets + stamp), right white form card `border-[3px] shadow-brutal-lg`. Demo button = lime (`Continue with demo — demo@studypilot.app`), Google = white (only if keys set — keep conditional). Errors adjacent + `role=alert`.

## 15. Onboarding `/onboarding` (9 steps)

Progress: `Step N of 9` mono + `h-4 border-2` bar. Steps: profile → subjects → syllabus → exams → deadlines → availability → preferences → review → generating. Each step one question + helper. Color picker = named swatches. Final: `Build my study plan →` lime lg + `editable later` note. Back never loses data.
