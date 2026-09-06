# StudyPilot

**Your AI-powered study co-pilot.** Plan smarter. Study better. Stay ahead.

StudyPilot turns a student's syllabus, deadlines, and available time into a personalized daily study plan that adapts as they progress — combining a deterministic planning engine, an optional LLM tutor, progress analytics, focus sessions, and tasteful gamification in a premium, dark-mode-ready product UI.

Built as a **complete, working product MVP** — not a prototype. Every screen, action, and flow is functional.

---

## Quick start

```bash
npm install
cp .env.example .env       # defaults work out of the box
npm run dev                # http://localhost:3000
```

The app works with **no configuration at all**:

1. Open http://localhost:3000 — the landing page.
2. Sign in with the **demo account** (button on the login page):
   - `demo@studypilot.app` / `demo1234`
   - The account auto-seeds on first visit with Alex, a realistic CS student: 5 subjects, full syllabus with units/topics, 2 exams, assignments, ~3 weeks of study history, sessions, achievements.
3. Or **Create account** and walk the onboarding wizard — it builds your profile, subjects, syllabus, exams, availability, and generates your first plan.

> On a fresh database the demo data is seeded automatically the first time the app is touched. Run `npm run seed` to (re)seed the demo user manually. Delete `data/studypilot.db` to reset everything.

---

## What's inside

| Area | What it does |
|---|---|
| **Dashboard** (`/app`) | Today's plan with progress ring, study blocks, upcoming deadlines, exam countdown, streak, weekly progress, weak topics, AI recommendation |
| **Today** (`/app/today`) | Full daily timeline; every block can be **started, completed, skipped, or rescheduled** |
| **Syllabus** (`/app/syllabus`) | Subject → unit → topic tree with statuses (Not started / Learning / Completed / Needs revision), progress, strong/weak topics |
| **Subjects** (`/app/subjects`) | Subject cards with progress, exam date, priority, weak areas, trend |
| **Exams** (`/app/exams`) | Countdown, syllabus %, readiness score, weak areas, recommended sessions, **exam preparation roadmap** (learning → practice → revision → mock) |
| **Tasks** (`/app/tasks`) | Assignments/projects/quizzes with deadline, priority, status filters |
| **Calendar** (`/app/calendar`) | **Week + month views** mixing study sessions, tasks, and exams — drag any upcoming study block onto another day to reschedule it (capacity-aware, refuses past days & duplicate topics) |
| **Chat** (`/app/chat`) | StudyPilot AI assistant with full user context; suggested prompts; intent router with structured responses. Works **with or without an LLM key** |
| **Focus** (`/app/focus`) | Pomodoro / custom timer that records real study sessions when you finish |
| **Progress** (`/app/progress`) | Weekly study time, streak heatmap, subject distribution, completion rate, consistency |
| **Achievements** (`/app/achievements`) | Streaks, task milestones, subject completion, focus-session awards |
| **Settings** (`/app/settings`) | Profile, preferences, notifications, AI provider status, data reset |
| **Onboarding** | 9-step wizard: profile → subjects → syllabus → exams → deadlines → availability → preferences → AI plan generation |
| **Landing page** | Full SaaS landing (hero, how-it-works, features, testimonials, pricing, FAQ, CTA) |
| **Auth** | Email/password (scrypt hashing), secure session cookies, route protection, **Google OAuth** (optional — add `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` from Google Cloud Console and the “Continue with Google” button appears), demo sign-in |

**Every feature has loading, empty, error, and success states.** No dead buttons, no fake functionality.

---

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Drizzle ORM · SQLite (better-sqlite3) · Zod · Recharts · Lucide · date-fns · Vitest

```
src/
├── app/                      # Next.js routes
│   ├── (public)              # landing, login, signup, onboarding  →  /, /login, ...
│   ├── app/                  # authenticated product area            →  /app, /app/today, ...
│   └── layout.tsx            # fonts, theme, toast provider
├── components/
│   ├── ui/                   # design-system atoms (button, card, badge, dialog, …)
│   ├── app/                  # feature components (plan rows, managers, chat, timer, charts)
│   └── auth/
├── lib/
│   ├── ai/                   # provider abstraction + intent router
│   ├── auth/                 # scrypt hashing, sessions, auth actions
│   ├── actions/              # server actions (curriculum, planning, chat, onboarding, settings)
│   ├── db/                   # schema, client, migrations, achievements catalog, demo seed
│   ├── engine/               # deterministic planning engine (pure, testable)
│   ├── services/             # orchestration: data loading, plans, activity, analytics, chat
│   └── dates.ts, utils.ts
├── scripts/                  # seed-demo, smoke test
└── tests/                    # Vitest unit tests
```

### The engine / AI split (by design)

- **Deterministic core** (`lib/engine/`): topic scoring (deadline urgency, exam proximity, difficulty, weakness, importance, prerequisites, past failures), daily scheduling with preferred-time windows and breaks, missed-task **redistribution across future days without overloading**, exam readiness and phase roadmaps, statistics, and insight generation. Pure functions — fully unit-tested, no LLM involved.
- **AI layer** (`lib/ai/`): a small provider interface (`LocalEngineProvider` + an OpenAI-compatible `LLMProvider`) behind one factory. The **local engine answers every chat intent deterministically** (plan my day, what should I study, am I on track, quiz me on a topic, reschedule…). When `AI_API_KEY` is set, free-form tutor chat, richer explanations, and LLM quiz/flashcard generation light up.
- LLM outputs are validated against Zod schemas before anything is applied; the LLM can **never** write to the database directly. Core scheduling never depends on the model.

### Data layer

Normalized relational schema with all core entities: users, profiles, subjects, units, topics, exams, tasks, plan items, study sessions, daily stats, chat conversations/messages, quizzes, flashcards, achievements, notifications, settings, AI recommendations.

Runs on **SQLite today; PostgreSQL-ready** — schema is Drizzle with Postgres-portable types; switching means swapping the driver and `DATABASE_URL` (`drizzle.config.ts`, `lib/db/index.ts`) and regenerating migrations.

### Key flows

- **Adaptive rescheduling:** miss a block and StudyPilot recalculates — the topic is redistributed across upcoming days (respecting the daily cap) instead of being silently dropped, with a plain-language explanation of what changed and why.
- **Plan generation:** after onboarding (or on demand), the engine reads availability, exams, and syllabus state to lay out a realistic day-by-day plan.
- **Contextual chat:** `/app/chat` gives the assistant live state (subjects, syllabus progress, upcoming exams/deadlines, today's plan, recent sessions) so answers are StudyPilot-specific, never a generic ChatGPT clone.

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build + serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests (engine + stats) |
| `npm run seed` | (Re)seed the demo user (idempotent) |
| `npm run db:generate` | Generate Drizzle migrations after schema edits |
| `npm run db:studio` | Drizzle Studio for the SQLite file |
| `node scripts/visual-qa.mjs` | Headless-Chrome visual QA of the calendar — light/dark/week screenshots into `scripts/.shots/` (start the app first) |
| `node scripts/flow-qa.mjs` | Headless-Chrome **core-flow QA** — logs in with the demo account, completes a block on Today, reschedules one to tomorrow, checks persistence + mobile overflow, and reports console errors |
| `node scripts/ai-qa.mjs` | Headless-Chrome **AI-path QA** (needs `AI_API_KEY`) — sends tutor, quiz, and flashcard prompts through the real chat UI and asserts real model replies, then checks the Settings AI panel |

---

## Environment variables

See `.env.example`. The only ones that matter for local development:

- `DATABASE_URL` — defaults to `file:./data/studypilot.db`
- `AI_API_KEY` / `AI_PROVIDER` / `AI_MODEL` / `AI_BASE_URL` — **optional**. `openai` accepts any OpenAI-compatible endpoint (OpenRouter, Groq, Together, llama.cpp, …). Leave empty to run fully on the built-in engine.
- `NEXT_PUBLIC_APP_URL` — app origin for absolute links.

---

## Testing

- **Unit tests** (`tests/`): topic scoring, scheduling constraints, rescheduling redistribution, exam roadmap phases, readiness, stats/streaks/insights — 19 tests, green.
- **Smoke test** (`scripts/smoke.mjs`): boots the production server and exercises all 14 routes — landing, auth redirects, and every authenticated page with a real session. 14/14 passing.

---

## Known limitations & next steps

**Troubleshooting:**
- **Signed up but bounced back to /login during onboarding?** You were likely accessing the app over plain HTTP on a LAN IP (e.g. `http://192.168.56.1:3000`). Browsers silently reject `Secure` cookies on non-localhost HTTP, which logged you out mid-onboarding. Fixed: the session cookie is now `Secure` only when the app is actually served over HTTPS. If you host behind a TLS-terminating proxy, make sure it sends `x-forwarded-proto: https`.
- Dashboard/Today crashing with `Invalid time value` for brand-new accounts (no topics yet → no plan blocks) — also fixed; both pages now fall back gracefully when no plan exists.

**Limitations (MVP):**
- SQLite file DB (by design — single-instance). Postgres migration is a driver/config swap, but not yet executed.
- Calendar drag-and-drop is day-level (move a block to another day at its same time) and uses native HTML5 drag — fine on desktop; touch/keyboard drag is not implemented yet. Study blocks only exist for the rolling window the planner has generated, so far-future month cells stay empty until the plan rolls forward or you drag a block there.
- LLM tutor requires a provider API key; without one, chat is deterministic intent handling.
- Notifications are preference-configurable in settings; push/email delivery not yet wired.
- No PDF syllabus import yet (manual entry + demo data today).

**The roadmap spec'd for future phases:** PDF syllabus extraction, Google Calendar sync, LMS import, spaced-repetition flashcard scheduling, study groups, wearable tracking, offline mode, voice assistant, email/push notifications, OAuth (Google/GitHub), multi-user deployment with Postgres, plus calendar polish (time-of-day drops, touch/keyboard drag).

---

## License

Private project — built for the StudyPilot product. © 2026.
