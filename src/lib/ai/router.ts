import { formatMinutes } from "@/lib/utils";
import type { AiReply, ChatContext } from "./types";
import { getAiProvider, askForJson } from "./provider";
import { AiReplySchema } from "./types";
import { wrapUntrusted, UNTRUSTED_DIRECTIVE } from "@/lib/security/guard";

/* ──────────────────────────────────────────────────────────────
   Deterministic intents handled by the StudyPilot engine — no
   model in the loop, always correct, always grounded in the
   student's real data. The LLM is used only where open-ended
   reasoning is actually required (tutoring, free-form chat).
   ────────────────────────────────────────────────────────────── */
type Intent =
  | "plan_today"
  | "study_next"
  | "on_track"
  | "weak_topics"
  | "reschedule"
  | "exams"
  | "deadlines"
  | "quiz"
  | "flashcards"
  | "explain"
  | "stats"
  | "freeform";

const TESTS: [Intent, RegExp][] = [
  ["reschedule", /(reschedul|redistribut|missed .*(today|yesterday|week)|i (missed|skipped)|fell behind|what happens if i miss)/i],
  ["quiz", /\b(quiz|test me|practice question|pop quiz|question me|ask me)\b/i],
  ["flashcards", /\b(flashcard|study cards|review cards|make cards)\b/i],
  ["explain", /\b(explain|teach me|what is|what are|how does|how do|understand|tutor|help me (with|understand))\b/i],
  ["deadlines", /\b(deadline|due (soon|today|tomorrow)|upcoming (task|assignment)|assignments?)\b/i],
  ["weak_topics", /\b(weak(est)?|struggl|behind in|trouble with|hardest topic)\b/i],
  ["on_track", /\b(on track|ahead|behind schedule|how am i doing|my progress|keep up)\b/i],
  ["exams", /\b(exam|test|countdown|readiness|prepare me)\b/i],
  ["stats", /\b(streak|stats|statistics|how much (did|have) i|hours (this|last) week|weekly)\b/i],
  ["plan_today", /\b(plan (my )?(day|today)|make (me )?a plan|build (me )?a plan|today'?s plan|schedule (my )?day|generate.*plan|plan for today)\b/i],
  ["study_next", /\b(what should i study|what do i study|what'?s next|study (next|now)|where should i (start|begin)|what do i do (next|now)|what now)\b/i],
];

function detectIntent(message: string): Intent {
  for (const [intent, re] of TESTS) {
    if (re.test(message)) return intent;
  }
  if (/^(hi|hey|hello|yo|good (morning|evening|afternoon))\b/i.test(message)) return "freeform";
  if (/^(thanks|thank you|thx|ok|okay|great|nice)\b/i.test(message)) return "freeform";
  return "freeform";
}

const fmt = (m: number) => formatMinutes(m);
const shortDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" });

export async function respond(ctx: ChatContext, message: string): Promise<AiReply> {
  const intent = detectIntent(message);

  switch (intent) {
    case "plan_today":
      return localPlanToday(ctx);
    case "study_next":
      return localStudyNext(ctx);
    case "on_track":
      return localOnTrack(ctx);
    case "weak_topics":
      return localWeakTopics(ctx);
    case "reschedule":
      return localRescheduleInfo(ctx);
    case "exams":
      return localExams(ctx, message);
    case "deadlines":
      return localDeadlines(ctx);
    case "stats":
      return localStats(ctx);
    default:
      return freeformOrTutor(ctx, message, intent);
  }
}

/* ── Local deterministic responders ─────────────────────────── */

function localPlanToday(ctx: ChatContext): AiReply {
  const remaining = ctx.todayRemainingBlocks;
  if (!remaining.length) {
    const done = ctx.todayCompletedMinutes > 0;
    return {
      reply: done
        ? `All done for today — you've studied ${fmt(ctx.todayCompletedMinutes)} and every planned block is complete 🎉\n\nTomorrow's plan is already being shaped by the engine. Close this chat and go rest; you've earned it.`
        : `Nothing is scheduled for today yet. You have no pending study blocks — perfect moment to start one of your flagged topics.`,
      actions: [{ label: "View today", href: "/app/today" }],
    };
  }
  const lines = remaining.map(
    (b, i) =>
      `${i + 1}. **${b.at}** · ${b.subject} — ${b.topic} (${fmt(b.minutes)})`,
  );
  const total = remaining.reduce((a, b) => a + b.minutes, 0);
  return {
    reply: `Here's what remains for today (${fmt(total)} total):\n\n${lines.join(
      "\n",
    )}\n\nTip: tackle the first block in a distraction-free session — you'll keep the streak and the engine will adapt around you.`,
    actions: [{ label: "Open today's plan", href: "/app/today" }],
  };
}

function localStudyNext(ctx: ChatContext): AiReply {
  const remaining = ctx.todayRemainingBlocks;
  if (remaining.length) {
    const b = remaining[0];
    return {
      reply: `Right now, your highest-value move is **${b.subject} — ${b.topic}** at **${b.at}** (${fmt(
        b.minutes,
      )}).\n\nIt's first in your queue because the planner ranked it top for ${reasonPhrase(ctx, b.subject)}. If you only have a short window, even 20 minutes of it keeps the plan healthy.`,
      actions: [{ label: "Open today's plan", href: "/app/today" }],
    };
  }
  // No plan for today — recommend from context
  const weak = ctx.weakTopics[0];
  const near = ctx.notStartedNearExam[0];
  const pick = near ?? weak;
  if (pick) {
    const reason = near
      ? `your ${near.subjectName} exam is in ${ctx.exams.find((e) => e.subject === near.subjectName)?.daysLeft ?? ""} days`
      : `${pick.subjectName} has flagged topics`;
    return {
      reply: `You've got no planned blocks left for today, so here's my pick: **${pick.subjectName} — ${pick.name}**.\n\nWhy: ${reason}. A 25–40 minute session now means the engine doesn't need to compress it later.`,
      actions: [{ label: "Start a focus session", href: "/app/focus" }],
    };
  }
  return {
    reply: "Your plan is fully clear and nothing is flagged. Enjoy the breathing room — or use it to get ahead on a subject you enjoy.",
    suggested: ["Plan my day", "What's my streak?"],
  };
}

function reasonPhrase(ctx: ChatContext, subjectName: string): string {
  const s = ctx.subjects.find((x) => x.name === subjectName);
  if (s?.examDaysLeft != null) return `your ${s.examName} is in ${s.examDaysLeft} day${s.examDaysLeft === 1 ? "" : "s"}`;
  if (s && s.weakTopics.length) return `${subjectName} has topics needing revision`;
  return "it keeps your syllabus moving";
}

function localOnTrack(ctx: ChatContext): AiReply {
  const total = ctx.todayPlanned;
  const done = ctx.todayCompletedMinutes;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const today = ctx.todayRemainingBlocks.length === 0 && total > 0 ? "complete" : `${Math.max(0, total - done)}m left today`;

  const worst = [...ctx.subjects].sort((a, b) => a.progress - b.progress)[0];
  const best = [...ctx.subjects].sort((a, b) => b.progress - a.progress)[0];

  const bits = [
    `**${pct}%** of today's ${fmt(total)} plan — ${today}.`,
    `**${ctx.streak}-day** streak.`,
    `**${fmt(ctx.thisWeekMinutes)}** studied this week.`,
    worst && worst.progress < 70 ? `**${worst.name}** is your furthest-behind subject (${worst.progress}%).` : null,
    best && best.progress >= 80 ? `**${best.name}** is your strongest (${best.progress}%).` : null,
  ].filter(Boolean);

  const verdict =
    pct >= 70
      ? "You're comfortably on track."
      : ctx.todayRemainingBlocks.length
        ? "You're slightly behind today, but the remaining blocks are sized to fit — starting the first one is the whole battle."
        : "You're in good shape today.";

  return {
    reply: `${verdict}\n\n${bits.join("\n")}`,
    actions: [{ label: "See analytics", href: "/app/progress" }],
  };
}

function localWeakTopics(ctx: ChatContext): AiReply {
  if (!ctx.weakTopics.length && !ctx.notStartedNearExam.length) {
    return {
      reply: "Great news — nothing is currently flagged as weak. The engine marks topics for revision only when a quiz or missed session suggests they need it.",
      suggested: ["Plan my day", "Am I on track?"],
    };
  }
  const lines = ctx.weakTopics.map((t, i) => `${i + 1}. **${t.subjectName} — ${t.name}** (difficulty ${t.difficulty}/5)`);
  const near = ctx.notStartedNearExam
    .slice(0, 3)
    .map((t, i) => `${lines.length + i + 1}. **${t.subjectName} — ${t.name}** (unfinished, exam approaching)`);
  return {
    reply: `Topics needing attention right now:\n\n${[...lines, ...near].join(
      "\n",
    )}\n\nThe planner has already prioritized these in your upcoming blocks. Want to clear the top one?`,
    actions: [{ label: "Open syllabus", href: "/app/syllabus" }],
  };
}

function localRescheduleInfo(ctx: ChatContext): AiReply {
  if (!ctx.missedThisWeek) {
    return {
      reply: "You haven't missed any planned blocks this week — nothing to reschedule. 🎉\n\nIf you skip something, I automatically redistribute that topic across the next few days within your available hours, so you're never punished with a double workload.",
    };
  }
  return {
    reply: `You missed **${ctx.missedThisWeek}** planned block${ctx.missedThisWeek === 1 ? "" : "s"} this week. The engine never drops missed work — it splits the topic across the coming days and slots it into spare capacity.\n\nHead to today's plan: the redistributed sessions are marked **"missed — redistributed"** so you can see exactly where the work landed.`,
    actions: [{ label: "Review today's plan", href: "/app/today" }],
  };
}

function localExams(ctx: ChatContext, message: string): AiReply {
  const wanted = message.match(/for (my |the )?([a-z0-9 &]+?)( exam)?\??$/i)?.[2]?.trim();
  const exams = ctx.exams.sort((a, b) => a.daysLeft - b.daysLeft);
  const target = wanted
    ? exams.find((e) => e.name.toLowerCase().includes(wanted.toLowerCase()) || e.subject?.toLowerCase().includes(wanted.toLowerCase()))
    : undefined;
  const exam = target ?? exams[0];
  if (!exam) {
    return {
      reply: "You haven't added any exams yet. Add one from the Exams page and I'll build your preparation roadmap.",
      actions: [{ label: "Open exams", href: "/app/exams" }],
    };
  }
  const d = exam.daysLeft;
  return {
    reply: `**${exam.name}** · ${exam.subject ?? "general"} — ${d} day${d === 1 ? "" : "s"} left\n\n• Syllabus coverage: **${exam.syllabusPercent}%**\n• Readiness: **${exam.readiness}%**\n\n${
      exam.readiness >= 80
        ? `You're in strong shape. Keep the revision cadence and do a timed mock ${Math.min(3, Math.max(1, Math.floor(d / 4)))} day${d >= 2 ? "s" : ""} before exam day.`
        : d <= 3
          ? "With exam day this close, focus only on flagged topics and past-paper questions. Depth over breadth now."
          : "The roadmap below shows your phases — learning, practice, revision, then a mock. The planner is already scheduling toward it."
    }`,
    actions: [{ label: "Open exam roadmap", href: "/app/exams" }],
  };
}

function localDeadlines(ctx: ChatContext): AiReply {
  if (!ctx.upcomingDeadlines.length) {
    return {
      reply: "No deadlines on the horizon — your tasks are either done or comfortably far out. Keep it that way by entering new assignments as they're announced.",
      actions: [{ label: "View tasks", href: "/app/tasks" }],
    };
  }
  const lines = ctx.upcomingDeadlines
    .slice(0, 6)
    .map(
      (t, i) =>
        `${i + 1}. **${t.title}** (${t.subject ?? "no subject"}) — ${t.daysLeft === 0 ? "due today" : t.daysLeft === 1 ? "due tomorrow" : `due in ${t.daysLeft} days`}`,
    );
  return {
    reply: `Here's what's coming up:\n\n${lines.join("\n")}\n\nAnything due within 3 days already has a block in your plan so it doesn't sneak up on you.`,
    actions: [{ label: "Open tasks", href: "/app/tasks" }],
  };
}

function localStats(ctx: ChatContext): AiReply {
  const bestSubject = [...ctx.subjects].sort((a, b) => b.progress - a.progress)[0];
  return {
    reply: [
      `**${ctx.streak}**-day current streak 🔥`,
      `**${fmt(ctx.thisWeekMinutes)}** studied this week`,
      bestSubject ? `**${bestSubject.name}** leads your subjects at ${bestSubject.progress}%` : null,
      ctx.missedThisWeek ? `**${ctx.missedThisWeek}** missed block${ctx.missedThisWeek === 1 ? "" : "s"} this week (redistributed, not dropped)` : "No missed blocks this week 🎉",
    ]
      .filter(Boolean)
      .join("\n"),
    actions: [{ label: "Full analytics", href: "/app/progress" }],
  };
}

/* ── LLM path (tutor / quiz / flashcards / freeform) ─────────── */

async function freeformOrTutor(ctx: ChatContext, message: string, intent: Intent): Promise<AiReply> {
  const provider = getAiProvider();
  if (!provider.available()) {
    return localUnavailable(ctx, message, intent);
  }

  const snapshot = buildSnapshot(ctx);
  const isTutor = intent === "explain";
  const role =
    intent === "quiz"
      ? "You are an expert tutor creating a SHORT quiz. Ask 3 focused questions from the student's own syllabus, then wait for answers. Keep it to the subject they asked about."
      : intent === "flashcards"
        ? "You are a StudyPilot study coach. Create 5 crisp flashcards from the student's syllabus around what they asked. Output EXACTLY this layout for every card, with no preamble or trailing notes:\n**Front**: <question>\n**Back**: <answer>\n\nExample card:\n**Front**: What is the primary key?\n**Back**: The column(s) that uniquely identify each row."
        : isTutor
          ? "You are Pilot, a patient university tutor inside StudyPilot. Explain the requested concept clearly using the student's own subjects where relevant. Structure: simple explanation → concrete example → key points → common mistakes → one quick check question."
          : "You are Pilot, the StudyPilot AI study co-pilot. You answer in the student's context using the snapshot below. Be warm, concise, practical. Recommend concrete next actions the student can take in the app.";

  const system = [
    "You are StudyPilot AI (called Pilot), an encouraging but no-nonsense academic assistant inside a study app.",
    "Never invent facts about the student — ground every answer in the snapshot JSON below.",
    "Keep replies under ~180 words unless the student asks for depth.",
    "Use plain markdown: **bold** for emphasis, short bullet lists.",
    "Your JSON output MUST include a non-empty \"reply\" field containing the response text.",
    UNTRUSTED_DIRECTIVE,
    role,
    `Student snapshot:\n${snapshot}`,
  ].join("\n\n");

  // The full schema is always enforced: reply is required (actions/suggested
  // are already optional). A partial schema would let a model reply slip
  // through without any actual content.
  const reply = (await askForJson(provider, system, wrapUntrusted(message), AiReplySchema)) as AiReply;
  return {
    reply: reply.reply,
    actions: reply.actions,
    suggested: reply.suggested,
  };
}

/** Honest, still-useful answer when no LLM key is configured. */
function localUnavailable(ctx: ChatContext, message: string, intent: string): AiReply {
  if (intent === "explain") {
    // Look up the closest topic in the student's syllabus for a grounded (if short) response
    const words = message.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((w) => w.length > 3);
    const match = ctx.syllabusTopics.find((t) =>
      words.some((w) => t.name.toLowerCase().includes(w) || w.includes(t.name.toLowerCase())),
    );
    const list = ctx.weakTopics.slice(0, 4);
    if (match && match.description) {
      return {
        reply: `Here's what I have stored for **${match.subjectName} — ${match.name}**:\n\n${match.description}\n\n_(I'm running in offline engine mode — connect an AI provider in Settings to get full explanations, examples and common mistakes.)_`,
      };
    }
    return {
      reply: `I'd love to walk you through **${match?.name ?? "that topic"}** properly — full explanations need an AI provider to be connected (Settings → AI).\n\nRight now I can still help from your own data: your flagged topics are ${list.length
        ? list.map((t) => `**${t.subjectName} — ${t.name}**`).join(", ")
        : "none right now"}. Want me to quiz you on those, or plan your next session?`,
      suggested: ["Quiz me on my weak topics", "Plan my day", "What should I study now?"],
      actions: [{ label: "Add AI provider", href: "/app/settings" }],
    };
  }

  const q: Record<string, string> = {
    quiz: "**Quiz mode** needs an AI provider to generate fresh questions. It's a one-line setup in Settings → AI.\n\nWhile it's off, flip through your flashcards — recall practice works just as well.",
    flashcards: "**Flashcard generation** needs an AI provider. You can still create cards manually from the syllabus page, and I can quiz you from existing cards.",
  };
  const named =
    intent === "quiz" || intent === "flashcards" || intent === "explain"
      ? q[intent]
      : null;
  const greeting = /^(hi|hey|hello|yo)\b/i.test(message);
  return {
    reply: named
      ? named
      : greeting
        ? `Hey ${ctx.user.name.split(" ")[0]} 👋 I'm Pilot, your study co-pilot. I'm running on the built-in engine right now (no AI key needed) — ask me to *plan your day*, tell you *what to study*, check if you're *on track*, or list your *weak topics*.\n\nFor open-ended tutoring, connect an AI provider in Settings and I'll level up.`
        : `I can run any of these right now on your real data:\n\n• "Plan my day"\n• "What should I study now?"\n• "Am I on track?"\n• "What are my weak topics?"\n• "How do I prepare for my exam?"\n• "What's my streak?"\n\nFor tutoring or fresh quiz/flashcard generation, add an AI provider key in **Settings** — it's optional and the whole app keeps working without it.`,
    suggested: ["Plan my day", "Am I on track?", "What are my weak topics?"],
  };
}

function buildSnapshot(ctx: ChatContext): string {
  return JSON.stringify(
    {
      user: ctx.user,
      now: ctx.nowLabel,
      streak: ctx.streak,
      thisWeekMinutes: ctx.thisWeekMinutes,
      today: {
        plannedMinutes: ctx.todayPlanned,
        completedMinutes: ctx.todayCompletedMinutes,
        remainingBlocks: ctx.todayRemainingBlocks,
      },
      subjects: ctx.subjects,
      weakTopics: ctx.weakTopics.map((t) => ({ name: t.name, subject: t.subjectName, status: t.status })),
      unfinishedTopicsNearExams: ctx.notStartedNearExam.map((t) => ({ name: t.name, subject: t.subjectName })),
      exams: ctx.exams,
      upcomingDeadlines: ctx.upcomingDeadlines,
      missedThisWeek: ctx.missedThisWeek,
    },
    null,
    0,
  ).slice(0, 9000);
}

export { shortDay, detectIntent };
