# 07 — QA & Validation Checklist

Run per route, light + dark, 1440px + 375px. Commands from repo root (`C:\Users\aKris\Downloads\Project-lock`).

## Pre-flight (every phase)

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Per-route checklist

- [ ] Primary task visible in first viewport (dashboard = `Start next session`, today = next block, etc.)
- [ ] One lime primary only; hierarchy brutal-press works (hover lift, active press, disabled flat)
- [ ] No soft shadows / gradients / blur / orbs left on this surface (`rg "shadow-(sm|md|lg|xl)|backdrop-blur|bg-gradient|neo-raise|bevel-top|glass |orb" src/app/<route> src/components/<touched>`)
- [ ] Borders 2–3px ink, shadows tier-correct (sm chips, md cards/buttons, lg hero/dialog), radius 0–6px (pills only chips)
- [ ] Narrow width: no overflow, metadata stacks, 44px targets, dock + More reachable
- [ ] Keyboard: tab order sane, focus visible, dialog traps + restores, filters/disclosures operable, DnD has button fallback
- [ ] Labels paired, errors adjacent + `role=alert`, `aria-current/pressed/expanded` correct
- [ ] Contrast spot-check (body 4.5:1) on fills used; no color-only status
- [ ] Empty / loading / error / success / destructive states render (delete → confirm or undo toast 5s)
- [ ] Links/buttons route correctly; notifications badge == panel contents after mark-read
- [ ] Reduced-motion: emulate + confirm no marquee/float/stagger
- [ ] Editor diagnostics clean for touched files

## Automated QA scripts (existing)

```powershell
node scripts/smoke.mjs        # expect 14/14 routes
node scripts/flow-qa.mjs      # login → complete block → reschedule → mobile overflow + console errors
node scripts/visual-qa.mjs    # calendar light/dark/week screenshots → scripts/.shots/
# AI path (needs AI_API_KEY):
node scripts/ai-qa.mjs
```

## Sign-off

Update `src/app/updated-ui-ux.md` → `## Current Validation Note` with: date, routes checked, light/dark + widths, command outputs, remaining debt. Then mark README phase complete.
