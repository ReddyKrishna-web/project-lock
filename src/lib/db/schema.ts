import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ──────────────────────────────────────────────────────────────
   Shared helpers
   ────────────────────────────────────────────────────────────── */
const id = (name: string) => text(name).notNull();
const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(unixepoch('now') * 1000)`),
};

export const now = () => new Date().toISOString();

/* ──────────────────────────────────────────────────────────────
   Users & profile
   ────────────────────────────────────────────────────────────── */
export const users = sqliteTable(
  "users",
  {
    id: id("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"),
    image: text("image"),
    onboarded: integer("onboarded", { mode: "boolean" }).notNull().default(false),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const profiles = sqliteTable(
  "profiles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    educationLevel: text("education_level"),
    course: text("course"),
    yearOfStudy: text("year_of_study"),
    studyGoals: text("study_goals"),
    weekdayHours: real("weekday_hours").notNull().default(3),
    weekendHours: real("weekend_hours").notNull().default(5),
    /** JSON: array of "morning" | "afternoon" | "evening" | "night" */
    preferredTimes: text("preferred_times").notNull().default("[]"),
    /** session style preference: short | pomodoro | deep | mixed */
    sessionStyle: text("session_style").notNull().default("mixed"),
    updatedAt: timestamps.updatedAt,
  },
  (t) => [primaryKey({ columns: [t.userId] })],
);

export const settings = sqliteTable(
  "settings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** light | dark | system */
    theme: text("theme").notNull().default("system"),
    dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(240),
    /** JSON object of notification toggles */
    notificationPrefs: text("notification_prefs").notNull().default("{}"),
    focusMinutes: integer("focus_minutes").notNull().default(25),
    breakMinutes: integer("break_minutes").notNull().default(5),
    updatedAt: timestamps.updatedAt,
  },
  (t) => [primaryKey({ columns: [t.userId] })],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_token_idx").on(t.tokenHash)],
);

/* ──────────────────────────────────────────────────────────────
   Academics
   ────────────────────────────────────────────────────────────── */
export const subjects = sqliteTable(
  "subjects",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#5753d4"),
    /** 1 = low, 2 = medium, 3 = high */
    priority: integer("priority").notNull().default(2),
    difficulty: integer("difficulty").notNull().default(2),
    sortOrder: integer("sort_order").notNull().default(0),
    deletedAt: text("deleted_at"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [index("subjects_user_idx").on(t.userId)],
);

export const units = sqliteTable(
  "units",
  {
    id: id("id").primaryKey(),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("units_subject_idx").on(t.subjectId)],
);

export const topicStatuses = ["not_started", "learning", "completed", "needs_revision"] as const;
export type TopicStatus = (typeof topicStatuses)[number];

export const topics = sqliteTable(
  "topics",
  {
    id: id("id").primaryKey(),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    /** 1..5 difficulty */
    difficulty: integer("difficulty").notNull().default(3),
    /** relative syllabus weight used by the planner (default 1) */
    weight: real("weight").notNull().default(1),
    status: text("status", { enum: topicStatuses }).notNull().default("not_started"),
    sortOrder: integer("sort_order").notNull().default(0),
    completedAt: text("completed_at"),
    lastStudiedAt: text("last_studied_at"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [index("topics_unit_idx").on(t.unitId), index("topics_status_idx").on(t.status)],
);

export const examImportances = [1, 2, 3] as const;

export const exams = sqliteTable(
  "exams",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    /** ISO date yyyy-MM-dd */
    date: text("date").notNull(),
    /** 1..3 importance */
    importance: integer("importance").notNull().default(2),
    targetScore: integer("target_score"),
    notes: text("notes"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("exams_user_idx").on(t.userId),
    index("exams_subject_idx").on(t.subjectId),
    index("exams_date_idx").on(t.date),
  ],
);

export const taskKinds = ["assignment", "project", "lab", "quiz", "revision", "other"] as const;
export type TaskKind = (typeof taskKinds)[number];
export const taskStatuses = ["todo", "in_progress", "completed", "skipped"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const tasks = sqliteTable(
  "tasks",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    kind: text("kind", { enum: taskKinds }).notNull().default("assignment"),
    /** ISO date or null when open-ended */
    deadline: text("deadline"),
    priority: integer("priority").notNull().default(2),
    estimatedMinutes: integer("estimated_minutes").notNull().default(60),
    status: text("status", { enum: taskStatuses }).notNull().default("todo"),
    notes: text("notes"),
    completedAt: text("completed_at"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("tasks_user_idx").on(t.userId),
    index("tasks_deadline_idx").on(t.deadline),
    index("tasks_status_idx").on(t.status),
  ],
);

/* ──────────────────────────────────────────────────────────────
   Planning
   ────────────────────────────────────────────────────────────── */
export const planItemKinds = ["study", "break", "revision", "review", "focus"] as const;
export type PlanItemKind = (typeof planItemKinds)[number];
export const planItemStatuses = ["pending", "completed", "skipped", "missed"] as const;
export type PlanItemStatus = (typeof planItemStatuses)[number];

export const planItems = sqliteTable(
  "plan_items",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    kind: text("kind", { enum: planItemKinds }).notNull().default("study"),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    /** minutes from midnight for start */
    startMinutes: integer("start_minutes").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    status: text("status", { enum: planItemStatuses }).notNull().default("pending"),
    /** short label explaining why the block exists, e.g. "Exam in 11 days" */
    reason: text("reason"),
    /** planned | rescheduled | manual */
    origin: text("origin").notNull().default("planned"),
    completedAt: text("completed_at"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("plan_user_date_idx").on(t.userId, t.date),
    index("plan_subject_idx").on(t.subjectId),
    index("plan_topic_idx").on(t.topicId),
  ],
);

/* ──────────────────────────────────────────────────────────────
   Activity
   ────────────────────────────────────────────────────────────── */
export const sessionKinds = ["focus", "manual", "quick"] as const;
export type SessionKind = (typeof sessionKinds)[number];

export const studySessions = sqliteTable(
  "study_sessions",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
    planItemId: text("plan_item_id").references(() => planItems.id, { onDelete: "set null" }),
    kind: text("kind", { enum: sessionKinds }).notNull().default("focus"),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at"),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    index("study_sessions_user_idx").on(t.userId),
    index("study_sessions_subject_idx").on(t.subjectId),
    index("study_sessions_started_idx").on(t.startedAt),
  ],
);

/* ──────────────────────────────────────────────────────────────
   AI & learning tools
   ────────────────────────────────────────────────────────────── */
export const chatConversations = sqliteTable(
  "chat_conversations",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New conversation"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [index("chat_conv_user_idx").on(t.userId)],
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: id("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // user | assistant
    content: text("content").notNull(),
    /** JSON: structured payload for AI messages (intent, recommendations, blocks...) */
    meta: text("meta"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("chat_msg_conv_idx").on(t.conversationId)],
);

export const flashcards = sqliteTable(
  "flashcards",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    source: text("source").notNull().default("manual"), // manual | ai
    /** spaced-repetition state */
    ease: real("ease").notNull().default(2.5),
    intervalDays: integer("interval_days").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    dueAt: text("due_at"),
    lastReviewedAt: text("last_reviewed_at"),
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  },
  (t) => [
    index("fc_user_idx").on(t.userId),
    index("fc_due_idx").on(t.userId, t.dueAt),
  ],
);

export const quizAttempts = sqliteTable(
  "quiz_attempts",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    source: text("source").notNull().default("ai"), // ai | flashcards | manual
    questionCount: integer("question_count").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("quiz_user_idx").on(t.userId)],
);

/* ──────────────────────────────────────────────────────────────
   Motivation & notifications
   ────────────────────────────────────────────────────────────── */
export const achievements = sqliteTable(
  "achievements",
  {
    id: id("id").primaryKey(),
    code: text("code").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    icon: text("icon").notNull(),
    category: text("category").notNull().default("general"), // streak | tasks | study | subject | exam | focus
    target: integer("target").notNull().default(1),
    tier: integer("tier").notNull().default(1),
  },
  (t) => [uniqueIndex("achievements_code_unique").on(t.code)],
);

export const userAchievements = sqliteTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    progress: integer("progress").notNull().default(0),
    unlockedAt: text("unlocked_at"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })],
);

export const notificationTypes = [
  "session",
  "missed_task",
  "deadline",
  "exam",
  "daily_plan",
  "streak",
  "ai_recommendation",
  "achievement",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notifications = sqliteTable(
  "notifications",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: notificationTypes }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("notif_user_idx").on(t.userId), index("notif_read_idx").on(t.userId, t.read)],
);

export const aiRecommendations = sqliteTable(
  "ai_recommendations",
  {
    id: id("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // e.g. dashboard | insight | planning | exam
    message: text("message").notNull(),
    meta: text("meta"),
    seen: integer("seen", { mode: "boolean" }).notNull().default(false),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("rec_user_idx").on(t.userId), index("rec_seen_idx").on(t.userId, t.seen)],
);

/* ──────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────── */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type PlanItem = typeof planItems.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AIRecommendation = typeof aiRecommendations.$inferSelect;
