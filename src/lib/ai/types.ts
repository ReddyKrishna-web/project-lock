import { z } from "zod";

/* ──────────────────────────────────────────────────────────────
   Provider abstraction — StudyPilot never couples business logic
   to a single model. Every provider returns plain text from
   complete(); structured outputs are validated with zod before
   anything is applied.
   ────────────────────────────────────────────────────────────── */
export interface AIProvider {
  readonly id: string;
  available(): boolean;
  /** Low-level completion used by tutor/quiz/flashcard features. */
  complete(system: string, user: string, opts?: { temperature?: number; maxTokens?: number }): Promise<string>;
  /**
   * Optional token-streaming completion. When `onDelta` is supplied it is
   * called with each incremental text chunk as it arrives; the resolved
   * string is always the complete reply. Providers without streaming omit
   * this and callers fall back to complete(). Never throws for "empty
   * stream" — resolve with what arrived.
   */
  stream?(system: string, user: string, opts?: { temperature?: number; maxTokens?: number }, onDelta?: (chunk: string) => void): Promise<string>;
}

/** Validated structured reply — the single contract for AI chat output. */
export const AiReplySchema = z.object({
  reply: z.string().min(1).max(6000),
  actions: z
    .array(
      z.object({
        label: z.string().max(40),
        href: z.string().max(300),
      }),
    )
    .max(4)
    .optional(),
  suggested: z.array(z.string().max(80)).max(4).optional(),
});

export type AiReply = z.infer<typeof AiReplySchema>;

export class AiSchemaError extends Error {
  constructor(message: string, readonly raw?: string) {
    super(message);
    this.name = "AiSchemaError";
  }
}

/* ──────────────────────────────────────────────────────────────
   Context bundle handed to chat/tutor. Populated by the service
   layer straight from the student's own data.
   ────────────────────────────────────────────────────────────── */
export type ChatTopicInfo = {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  status: string;
  difficulty: number;
  description: string | null;
};

export type ChatContext = {
  user: { name: string };
  availability: {
    weekdayHours: number;
    weekendHours: number;
    preferredTimes: string[];
    sessionStyle: string;
  };
  nowLabel: string; // e.g. "Monday evening"
  streak: number;
  thisWeekMinutes: number;
  todayPlanned: number; // minutes scheduled today
  todayCompletedMinutes: number;
  todayRemainingBlocks: { subject: string; topic: string; minutes: number; at: string }[];
  subjects: {
    id: string;
    name: string;
    progress: number;
    weakTopics: string[];
    examName: string | null;
    examDaysLeft: number | null;
    examReadiness: number | null;
  }[];
  weakTopics: ChatTopicInfo[];
  notStartedNearExam: ChatTopicInfo[];
  syllabusTopics: ChatTopicInfo[];
  /** Excerpts from the student's uploaded study materials (if any). */
  materials: { fileName: string; subjectName: string; topicName: string | null; excerpt: string }[];
  exams: { id: string; name: string; subject: string | null; date: string; daysLeft: number; syllabusPercent: number; readiness: number }[];
  upcomingDeadlines: { title: string; kind: string; daysLeft: number; subject: string | null }[];
  missedThisWeek: number;
};
