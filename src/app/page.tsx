import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CalendarClock,
  Check,
  Flame,
  GraduationCap,
  MessageSquareText,
  Rocket,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { variantClasses, sizeClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function MockDashboard() {
  const blocks = [
    { time: "09:00", subject: "DSA", topic: "Graph Traversal", minutes: "45m", color: "#5753d4", reason: "Exam in 23 days" },
    { time: "11:00", subject: "DBMS", topic: "Normalization", minutes: "50m", color: "#8b5cf6", reason: "Exam in 13 days" },
    { time: "15:00", subject: "OS", topic: "Scheduling", minutes: "40m", color: "#0ea5e9", reason: "High-priority subject" },
  ];
  return (
    <div className="pop-shadow relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-3 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">studypilot.app/app</span>
      </div>
      <div className="grid gap-0 sm:grid-cols-[1fr_240px]">
        <div className="p-5">
          <p className="text-sm font-bold">Good morning, Alex 👋</p>
          <p className="text-[11px] text-muted-foreground">Let&apos;s make today count.</p>
          <div className="mt-4 space-y-2.5">
            {blocks.map((b) => (
              <div key={b.time} className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                <span className="w-9 text-[11px] font-semibold tabular-nums text-muted-foreground">{b.time}</span>
                <span className="h-7 w-1 rounded-full" style={{ background: b.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold">{b.topic}</p>
                  <p className="text-[10px] text-muted-foreground">{b.subject} · {b.reason}</p>
                </div>
                <span className="text-[11px] font-semibold tabular-nums">{b.minutes}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-border bg-muted/30 p-5 sm:border-l sm:border-t-0">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full" style={{ background: "conic-gradient(var(--color-primary) 62%, var(--color-muted) 0)" }}>
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-card">
              <span className="text-lg font-bold">62%</span>
              <span className="text-[9px] text-muted-foreground">of today</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { icon: Flame, label: "5-day streak", tone: "text-warning" },
              { icon: GraduationCap, label: "DBMS in 13 days", tone: "text-danger" },
              { icon: TrendingUp, label: "3.2h this week", tone: "text-success" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-1.5 text-[11px] font-medium">
                <s.icon className={cn("h-3.5 w-3.5", s.tone)} />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Brain,
    title: "AI study planning",
    desc: "Tell Pilot your deadlines and free hours — the engine turns your syllabus into a realistic daily plan, no cramming required.",
  },
  {
    icon: CalendarClock,
    title: "Adaptive schedules",
    desc: "Miss a session? Work gets redistributed across the coming days — never dropped, never doubled up. The plan bends, you stay on track.",
  },
  {
    icon: MessageSquareText,
    title: "Pilot, your AI tutor",
    desc: "Ask what to study, why you're stuck on a topic, or for a quiz. Pilot answers from your actual syllabus, deadlines and progress.",
  },
  {
    icon: Target,
    title: "Daily planning",
    desc: "Every morning you get a realistic timeline with reasons: why this topic, why now, how long. One tap starts a focus session.",
  },
  {
    icon: BarChart3,
    title: "Progress & analytics",
    desc: "Streaks, heatmaps, subject-level trends and rule-based insights — e.g. “you're most productive between 7 PM and 9 PM.”",
  },
  {
    icon: GraduationCap,
    title: "Exam readiness",
    desc: "A live readiness score per exam — syllabus coverage blended with whether the remaining work fits your available time.",
  },
];

const STEPS = [
  { n: "01", title: "Add your subjects & syllabus", desc: "Topics, units and difficulty — in minutes, or paste them in." },
  { n: "02", title: "Enter exams & deadlines", desc: "StudyPilot knows what's coming and plans backwards from it." },
  { n: "03", title: "Tell us your available hours", desc: "Weekday/weekend hours and when you actually like to study." },
  { n: "04", title: "Follow your adaptive plan", desc: "Complete sessions, miss some, ask Pilot — the plan recalibrates daily." },
];

const TESTIMONIALS = [
  { quote: "It's the first planner that actually understands I have a life. Missed a session Tuesday, and the plan just quietly moved it to Thursday.", name: "Priya S.", role: "2nd-year CS student" },
  { quote: "The exam readiness score is addictive — I check it every morning. Passed DBMS with my best grade ever.", name: "Daniel K.", role: "Pre-med, 3rd year" },
  { quote: "Pilot feels like a tutor who knows my whole semester. 'Quiz me on normalization' works on my phone on the bus.", name: "Amara O.", role: "Final-year engineering" },
];

const FAQS = [
  { q: "Is StudyPilot an AI chatbot or a planner?", a: "Both. A deterministic planning engine handles scheduling, rescheduling and readiness (so the math is always correct), while Pilot — the AI assistant — handles reasoning, explanations and recommendations using your real data." },
  { q: "Does it work without an API key?", a: "Yes. The full product — planning, today's plan, syllabus, exams, focus mode, analytics and structured chat — runs on the built-in engine with zero external services. Add an OpenAI-compatible key (OpenRouter, Groq, etc.) in Settings to unlock free-form tutoring and AI-generated quizzes and flashcards." },
  { q: "What happens if I miss a planned session?", a: "The topic is redistributed across your next available slots in smaller pieces — respecting your daily hour limit — instead of being marked as a failure. You get a short explanation of where the work went." },
  { q: "Which platforms does it support?", a: "It's a web app built mobile-first: a bottom navigation on phones, a full sidebar on desktop, and complete dark mode. Installable as a PWA-ready Next.js app." },
  { q: "Is my data private?", a: "Yes. Authentication is session-based with hashed passwords, and your study data stays in your own database. No analytics trackers, no third-party data sharing." },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    desc: "Everything a student needs to stay on track.",
    features: ["Full planning engine", "Today's plan & focus mode", "Syllabus, exams & tasks", "Progress & analytics", "Pilot with built-in engine"],
    cta: "Start free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$6",
    period: "/month",
    desc: "For students who want the full AI tutor experience.",
    features: ["Everything in Free", "AI tutor & free-form chat", "AI quiz & flashcard generation", "Priority planning insights", "Unlimited subjects"],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Campus",
    price: "Custom",
    desc: "For universities and study groups.",
    features: ["Everything in Pro", "Groups & study circles", "Instructor dashboards", "LMS integrations", "Dedicated support"],
    cta: "Contact sales",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-md shadow-indigo-500/30">
              <Rocket className="h-4.5 w-4.5" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              Study<span className="text-gradient">Pilot</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex" aria-label="Landing navigation">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Link href="/login" className={cn(variantClasses.ghost, sizeClasses.sm, "hidden sm:inline-flex")}>
              Sign in
            </Link>
            <Link href="/signup" className={cn(variantClasses.primary, sizeClasses.sm, "inline-flex")}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="soft-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/15 via-violet-500/15 to-purple-500/15 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-20 text-center sm:pt-28">
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Your AI-powered study co-pilot
          </div>
          <h1 className="animate-fade-up mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl" style={{ animationDelay: "0.06s" }}>
            Plan smarter.
            <br />
            Study better.{" "}
            <span className="text-gradient">Stay ahead.</span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg" style={{ animationDelay: "0.12s" }}>
            StudyPilot turns your syllabus, deadlines and available time into a personalized study plan that adapts as you progress.
          </p>
          <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "0.18s" }}>
            <Link href="/signup" className={cn(variantClasses.primary, sizeClasses.lg, "inline-flex w-full sm:w-auto")}>
              Build My Study Plan <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <a href="#how" className={cn(variantClasses.outline, sizeClasses.lg, "inline-flex w-full sm:w-auto")}>
              See How It Works
            </a>
          </div>

          <div className="animate-fade-up relative mt-16" style={{ animationDelay: "0.26s" }}>
            <div className="animate-float absolute -left-4 top-8 hidden rounded-2xl border border-border bg-card px-4 py-2.5 pop-shadow md:block">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
                <Check className="h-3.5 w-3.5" /> Normalization done
              </p>
              <p className="text-[10px] text-muted-foreground">streak +1 🔥</p>
            </div>
            <div className="animate-float absolute -right-4 top-24 hidden rounded-2xl border border-border bg-card px-4 py-2.5 pop-shadow md:block" style={{ animationDelay: "1.2s" }}>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Timer className="h-3.5 w-3.5" /> Focus session: 45m
              </p>
              <p className="text-[10px] text-muted-foreground">Next: Graph Traversal</p>
            </div>
            <MockDashboard />
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-24">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">How it works</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From syllabus to daily plan in minutes</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6 card-shadow hover-lift">
              <span className="text-gradient text-3xl font-extrabold">{s.n}</span>
              <h3 className="mt-3 text-[15px] font-bold">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground/40 lg:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="border-y border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A complete study OS, not another todo list</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Deterministic planning underneath, AI reasoning on top — so the schedule is always realistic and the advice always knows your context.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 card-shadow hover-lift">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform group-hover:scale-110">
                  <f.icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="text-[15px] font-bold">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Loved by students</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Real students, real semesters</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-border bg-card p-6 card-shadow">
              <p className="text-[13.5px] leading-relaxed text-foreground/90">“{t.quote}”</p>
              <figcaption className="mt-4">
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id="pricing" className="border-y border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Start free. Upgrade when you&apos;re ready.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={cn(
                  "relative flex flex-col rounded-3xl border p-7 card-shadow",
                  p.popular ? "border-primary/50 bg-card pop-shadow" : "border-border bg-card",
                )}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-[11px] font-bold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{p.name}</h3>
                <p className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">{p.price}</span>
                  {p.period && <span className="text-sm text-muted-foreground">{p.period}</span>}
                </p>
                <p className="mt-2 text-[13px] text-muted-foreground">{p.desc}</p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={cn(variantClasses[p.popular ? "primary" : "outline"], sizeClasses.md, "mt-7 inline-flex w-full")}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Pricing is a placeholder — the product is fully functional today. Billing is on the roadmap.
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-24">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-border bg-card px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="px-5 pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-16 text-center text-white sm:py-20">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden />
          <div className="relative">
            <BookOpen className="mx-auto mb-5 h-10 w-10 opacity-90" />
            <h2 className="mx-auto max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your next exam is closer than you think. Start planning for it today.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-white/80 sm:text-base">
              Two minutes of setup. A plan that adapts every single day. No more deciding what to study — Pilot does that.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-[15px] font-bold text-indigo-700 shadow-xl transition-transform hover:scale-[1.03]"
            >
              Build My Study Plan <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Rocket className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold tracking-tight">
              Study<span className="text-gradient">Pilot</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground">
            “Plan smarter. Study better. Stay ahead.” — © {new Date().getFullYear()} StudyPilot
          </p>
          <div className="flex items-center gap-5 text-xs font-medium text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}