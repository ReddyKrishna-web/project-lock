import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { db, uid } from "@/lib/db";
import {
  chatConversations,
  chatMessages,
  exams,
  planItems,
  studySessions,
  tasks,
  topics,
} from "@/lib/db/schema";
import { daysUntil, minutesToClock } from "@/lib/dates";
import type { ChatContext, ChatTopicInfo } from "@/lib/ai/types";
import { getAppData, getProfileBundle } from "./data";

export async function getOrCreateConversation(userId: string): Promise<string> {
  const existing = await db
    .select({ id: chatConversations.id })
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId))
    .orderBy(desc(chatConversations.createdAt))
    .limit(1)
    .all();
  if (existing.length) return existing[0].id;

  const id = uid();
  const now = new Date().toISOString();
  await db.insert(chatConversations).values({ id, userId, title: "StudyPilot", createdAt: now, updatedAt: now });
  return id;
}

export async function recentMessages(conversationId: string, limit = 40) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(asc(chatMessages.createdAt))
    .limit(limit)
    .all();
}

export async function persistMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  meta?: unknown,
): Promise<void> {
  const now = new Date().toISOString();
  await db.insert(chatMessages).values({
    id: uid(),
    conversationId,
    role,
    content,
    meta: meta ? JSON.stringify(meta) : null,
    createdAt: now,
  });
  await db
    .update(chatConversations)
    .set({ updatedAt: now })
    .where(eq(chatConversations.id, conversationId))
    .run();
}

/** Build the grounded context snapshot the AI reasons over. */
export async function buildChatContext(userId: string): Promise<ChatContext> {
  const data = await getAppData(userId);
  const profile = await getProfileBundle(userId);

  const now = new Date();
  const hour = now.getHours();
  const nowLabel = `${now.toLocaleDateString("en-US", { weekday: "long" })} ${
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night"
  }`;

  // subjects with progress, weakness & exam info
  const subjects = data.subjects.map((s) => {
    const exam = data.exams.find((e) => e.subjectId === s.id) ?? null;
    return {
      id: s.id,
      name: s.name,
      progress: s.progress,
      weakTopics: s.weakTopics.map((w) => w.name),
      examName: exam?.examName ?? s.exam?.name ?? null,
      examDaysLeft: exam?.daysLeft ?? s.exam?.daysLeft ?? null,
      examReadiness: exam?.readiness ?? null,
    };
  });

  const weakTopics: ChatTopicInfo[] = [];
  const notStartedNearExam: ChatTopicInfo[] = [];
  const syllabusTopics: ChatTopicInfo[] = [];
  for (const s of data.subjects) {
    for (const u of s.units) {
      for (const t of u.topics) {
        const info: ChatTopicInfo = {
          id: t.id,
          name: t.name,
          subjectId: s.id,
          subjectName: s.name,
          status: t.status,
          difficulty: t.difficulty,
          description: t.description,
        };
        syllabusTopics.push(info);
        if (t.status === "needs_revision") weakTopics.push(info);
        const exam = data.exams.find((e) => e.subjectId === s.id);
        if (t.status === "not_started" && exam && exam.daysLeft <= 21) notStartedNearExam.push(info);
      }
    }
  }

  const todayBlocks =
    data.today?.items.filter((i) => i.status === "pending" && i.kind !== "break" && i.startMinutes >= 0) ?? [];
  const todayRemainingBlocks = todayBlocks.map((b) => ({
    subject: b.subjectName ?? "General",
    topic: b.topicName ?? b.title,
    minutes: b.durationMinutes,
    at: minutesToClock(b.startMinutes),
  }));

  const examsAgg = data.exams.map((e) => ({
    id: e.id,
    name: e.examName,
    subject: e.subjectName,
    date: e.examDate,
    daysLeft: e.daysLeft,
    syllabusPercent: e.syllabusPercent,
    readiness: e.readiness,
  }));

  const upcomingDeadlines = data.tasks
    .filter((t) => t.deadline && t.status !== "completed" && t.status !== "skipped")
    .map((t) => ({ title: t.title, kind: t.kind, daysLeft: daysUntil(t.deadline!), subject: t.subjectName }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 6);

  // recent-week session minutes + missed block count for stats responses
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString();
  const [{ total: weekMin }] = await db
    .select({ total: sql<number>`coalesce(sum(${studySessions.durationMinutes}),0)` })
    .from(studySessions)
    .where(and(eq(studySessions.userId, userId), eq(studySessions.completed, true), gte(studySessions.startedAt, weekAgo)))
    .all();

  const [{ c: missedCount }] = await db
    .select({ c: count() })
    .from(planItems)
    .where(and(eq(planItems.userId, userId), eq(planItems.status, "missed"), gte(planItems.date, weekAgo.slice(0, 10))))
    .all();

  void exams;
  void tasks;
  void topics;

  return {
    user: { name: data.user.name },
    availability: {
      weekdayHours: profile?.weekdayHours ?? 3,
      weekendHours: profile?.weekendHours ?? 5,
      preferredTimes: profile?.preferredTimes ?? [],
      sessionStyle: profile?.sessionStyle ?? "mixed",
    },
    nowLabel,
    streak: data.streak,
    thisWeekMinutes: Number(weekMin ?? 0),
    todayPlanned: data.today?.plannedMinutes ?? 0,
    todayCompletedMinutes: data.today?.completedMinutes ?? 0,
    todayRemainingBlocks,
    subjects,
    weakTopics,
    notStartedNearExam,
    syllabusTopics: syllabusTopics.slice(0, 200),
    exams: examsAgg,
    upcomingDeadlines,
    missedThisWeek: missedCount ?? 0,
  };
}

export async function chatHistoryForView(conversationId: string) {
  const rows = await recentMessages(conversationId, 60);
  return rows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    meta: m.meta ? safeParse(m.meta) : null,
    createdAt: m.createdAt,
  }));
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
