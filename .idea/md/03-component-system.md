# 03 — Component System (maps to `src/components/ui/*` + `src/components/app/*`)

General rules: `border-2 border-ink`, `shadow-brutal`, `rounded-[6px]` (cards) / `rounded-full` (chips only), `150ms` press motion, Lucide icons with `strokeWidth: 2.5`, min 44px touch targets.

## 1. Button (`ui/button.tsx`)

Variants:
- `primary`: `bg-lime text-ink border-2 shadow-brutal font-bold` — one per viewport (`Start next session`, `Build my study plan`, hero CTA).
- `secondary`: `bg-white text-ink`.
- `ink`: `bg-ink text-lime` — header CTA, pricing highlight.
- `danger`: `bg-danger-fill text-ink` + trash icon, requires confirm/undo.
- `ghost`: `border-transparent shadow-none underline-offset-4 hover:underline` — tertiary only.

Sizes: `sm (h-9 px-4)`, `md (h-11 px-5, default)`, `lg (h-13 px-7, landing)`, `icon (h-11 w-11)`.
States: `:hover translate(-2px,-2px) shadow-md`, `:active translate(4px,4px) shadow-none`, `:disabled opacity-50 shadow-none cursor-not-allowed`, `:focus-visible 3px solid blue offset 2px`.
Delete: gradient/shine/tilt on buttons. Keep `tactile` name as alias to `brutal-press` during migration.

## 2. Card (`ui/card.tsx`)

- Default: `bg-white border-[3px] border-ink rounded-[6px] shadow-brutal p-5`. Header = display font 700, 18–20px. No nested cards — use `brutal-ledger-row` inside cards for lists.
- Color-fill cards (rotate through lime/pink/cyan/yellow per subject or chapter): `bg-subj-N border-ink` with ink text. Max one fill color per card, max 3 fills per viewport.
- Sticker variant (achievements, streak): `rotate-[-1.5deg] border-[3px] shadow-brutal-md` + mono stamp label.
- Interactive cards (`hover-lift` → `brutal-press`): same press physics as buttons.
- Dark: `#222 bg, cream border+shadow`.

## 3. Badge / Chip (`ui/badge.tsx`, `ui/avatar.tsx`)

- Status chip: `rounded-full border-2 border-ink shadow-brutal-sm px-3 py-1 font-mono text-[11px] uppercase` + dot icon. Fills: success/warning/danger/info-fill. Always icon+text, never color-only.
- Streak stamp (keep `.stamp` idea, harden): `border-[2.5px] rounded-[6px] rotate-[-2deg] bg-yellow font-mono font-bold uppercase` — the one rubber-stamp moment per dashboard.
- Avatar: square `rounded-[6px] border-2 border-ink` with flat fill initials, not soft circle.

## 4. Input / Field / Switch (`ui/input.tsx`, `ui/switch.tsx`)

- Text/select/textarea: `bg-white border-2 border-ink rounded-[6px] h-11 px-3`. Focus: `box-shadow: 4px 4px 0 0 blue` (visible, not blur). Error: `border-danger + shadow-brutal-sm danger + role=alert` message adjacent.
- Labels: every `<label htmlFor=id>` paired — fix existing `Field` debt. No raw hex in UI; use swatch buttons with human names (`Lime, Bubblegum, Sky, Lemon, Tangerine, Mint`) for subject color picker in `subject-manager.tsx` + onboarding.
- Checkbox/radio: `h-6 w-6 border-[2.5px] border-ink rounded-[4px]`; checked = `bg-lime` + ink check. Completion checkbox in task/plan rows must be 28px+ hit area.
- Switch: `w-12 h-7 border-2 border-ink rounded-full bg-muted`; knob `bg-white border-2 border-ink`; on = `bg-lime`.
- Range/slider (focus timer length): thick track `h-3 border-2 border-ink bg-muted`, thumb `h-6 w-6 bg-white border-2 border-ink shadow-brutal-sm`.

## 5. Dialog / Sheet / Toast (`ui/dialog.tsx`, `ui/toaster.tsx`)

- Dialog: `bg-white border-[3px] border-ink rounded-[8px] shadow-brutal-lg p-6 max-w-lg`. Title display 700 + `aria-labelledby`, desc + `aria-describedby`. Overlay: `bg-black/60` (no blur). Focus trap (already added — keep), restore focus to trigger, Esc closes. Destructive dialog: red fill header band + explicit `Type DELETE` or confirm buttons (`Cancel` ghost + `Delete` danger).
- Mobile sheet (More menu, filters): bottom sheet `border-t-[3px] border-ink rounded-t-[12px] shadow-brutal-lg`, drag handle = thick ink bar.
- Toast: `border-2 border-ink shadow-brutal bg-ink text-lime` (success) / `bg-white text-ink` default. Undo toast for deletes (5s window).

## 6. Navigation (`components/app/app-shell.tsx`)

- Desktop sidebar/topbar: white `border-b-[3px] border-ink` or `border-r-[3px]`. Logo mark: `bg-ink text-lime border-2 border-ink rounded-[6px] px-2 py-1 font-display` + `!` punctuation accent (keep existing wordmark idea, harden).
- Active item: `bg-lime border-2 border-ink shadow-brutal-sm font-bold` + `aria-current="page"`. Inactive: `border-transparent hover:border-ink hover:bg-muted`.
- Mobile dock: 5 items (Home, Plan, Syllabus, Pilot, Progress) + 6th `More` (already required). Dock = `border-t-[3px] border-ink bg-paper`. More sheet lists Exams, Tasks, Calendar, Focus, Achievements, Settings with icons + counts. `aria-expanded/haspopup` on trigger (already added — keep).
- Notifications: single source of truth (keep fix). Bell button `border-2 border-ink rounded-[6px]`; unread dot = coral fill + count chip.

## 7. Plan / Task rows (`plan-item-row.tsx`, `task-manager.tsx`, `plan-actions.tsx`)

- Pattern: `brutal-ledger` list inside a card, NOT a card per row. Row: `flex gap-3 py-3 border-b-2` — [28px checkbox] [title+meta stacked] [time chip] [overflow menu]. Metadata stacks on mobile; edit/delete collapse into `...` menu; completion stays dominant.
- Time/type chips: mono uppercase `bg-muted border-ink`.
- Actions: Start (lime btn), Complete (ink btn), Skip (ghost), Reschedule (white btn → dialog with capacity note).
- Drag (calendar): dragged block `rotate-2 shadow-brutal-lg opacity-90`; drop target day `outline: 3px dashed blue`.

## 8. Syllabus / Subjects (`syllabus-manager.tsx`, `subject-manager.tsx`, `materials-panel.tsx`)

- Subject cards: flat fill per subject (cycle 6 fills), `border-[3px] shadow-brutal`, big display subject name, progress bar = `h-4 border-2 border-ink bg-white` + fill `bg-ink` or `bg-lime` with `border-right: 2px ink`. No gradient bars.
- Unit → topic tree: ledger rows with status chips (Not started / Learning / Completed / Needs revision). Weak topics get `bg-danger-fill` chip + alert icon.
- Progress (`progress.tsx`, `charts.tsx`): Recharts with flat fills + `stroke:#111`. Heatmap: 5-step lime→ink scale with borders, not soft greens.

## 9. Focus timer (`focus-timer.tsx`)

- Timer as hero: huge mono/display numerals `clamp(4rem,12vw,7rem)` inside `border-[4px] shadow-brutal-lg bg-white` dial card. State band on top (Focus/Break/Done) as black marquee chip.
- Controls: `Start (lime lg)`, `Pause/Resume (white)`, `Finish early (ghost)`, `Complete & log (ink)`. Always show selected topic chip while running. Preserve completion path at 0:00.
- Breathing animation → replace with stepped tick (no smooth scale during focus; respects reduced-motion).

## 10. Chat (`chat-view.tsx`)

- Bubbles: user = `bg-lime border-2 border-ink shadow-brutal-sm rounded-[6px] rounded-br-none`; assistant = `bg-white border-2 border-ink shadow-brutal-sm rounded-[6px] rounded-bl-none`. No floating gradient orbs.
- Suggested prompts: horizontal chip rail (`brutal-chip` buttons).
- Quiz/flashcard cards (`quiz-runner.tsx`, `flashcards-studio.tsx`): `border-[3px] shadow-brutal` with letter-option buttons A–D as white brutal buttons; correct = lime fill + check, wrong = danger-fill + x. Keep Zod-validated engine outputs.

## 11. Calendar (`calendar-view.tsx`)

- Week header: black band with cream dates. Day columns `border-l-2 border-ink`; today column `bg-yellow/40`.
- Blocks: flat subject fill + `border-2 border-ink rounded-[4px]` + mono time. No blur.
- Month cells: bordered grid, `hover:bg-muted`, empty far-future cells show `—` (plan window note preserved).

## 12. Onboarding (`onboarding-wizard.tsx`)

- Wizard shell: `border-[3px] shadow-brutal-lg`, step header = `Step 3/9 — Availability` mono + thick progress bar. Keep minimum-viable path first; defer color/difficulty.
- Navigation: Back (ghost, preserves data) + Continue (lime). Explain what will be generated + editable-later note on final step.
