"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, uid } from "@/lib/db";
import { subjects, topics, units } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/actions";
import { detectKind, extractText, MAX_MATERIAL_CHARS } from "@/lib/services/extract";
import { parseSyllabusText, ParsedSyllabusSchema, type ParsedSyllabus } from "@/lib/services/syllabus-parse";

const MAX_IMPORT_BYTES = 15 * 1024 * 1024; // 15 MB

export type ImportPreview =
  | { ok: true; token: string; syllabus: ParsedSyllabus; source: "ai" | "heuristic"; warning?: string }
  | { ok: false; error: string };

export type ImportCommitResult = { ok: true; subjectId: string; topicCount: number } | { ok: false; error: string };

/**
 * In-memory preview tokens (per process). Imports are two-step by design:
 * the user must SEE the parsed structure before anything touches the DB.
 * Tokens are single-use and expire after 15 minutes; the commit step
 * re-validates the payload anyway, so a stale/garbage token fails safe.
 */
const previewTokens = new Map<string, { userId: string; syllabus: ParsedSyllabus; expiresAt: number }>();
const TOKEN_TTL_MS = 15 * 60 * 1000;

function sweepTokens() {
  const now = Date.now();
  for (const [k, v] of previewTokens) if (v.expiresAt < now) previewTokens.delete(k);
}

function newToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Step 1 — upload + parse. Nothing is persisted to the syllabus yet. */
export async function parseSyllabusImportAction(input: {
  fileName: string;
  mimeType: string;
  dataBase64: string;
  subjectId?: string;
}): Promise<ImportPreview> {
  const user = await requireUser();
  const name = input.fileName.slice(0, 200);
  const buffer = Buffer.from(input.dataBase64, "base64");

  if (!buffer.length) return { ok: false, error: "The file is empty." };
  if (buffer.length > MAX_IMPORT_BYTES) return { ok: false, error: "File is too large — the limit is 15 MB." };

  const kind = detectKind(name, input.mimeType);
  if (!kind || kind === "image") {
    return { ok: false, error: "Upload a PDF, Word, Excel or text syllabus (images aren't readable yet)." };
  }

  // If importing INTO an existing subject, verify ownership now.
  if (input.subjectId) {
    const own = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, user.id)))
      .limit(1)
      .all();
    if (!own.length) return { ok: false, error: "Subject not found." };
  }

  let text = "";
  try {
    text = await extractText(kind, name, buffer);
  } catch {
    return { ok: false, error: "Couldn't read that file — it may be corrupted or password-protected." };
  }
  if (!text.trim()) {
    return { ok: false, error: "No readable text found (scanned PDFs need OCR, which isn't supported yet)." };
  }

  // Optional subject-name hint from the filename ("dbms-syllabus.pdf" → "Dbms")
  const stem = name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
  const hint = stem.length >= 3 && stem.length <= 60 ? stem : undefined;

  const result = await parseSyllabusText(text.slice(0, MAX_MATERIAL_CHARS), { defaultSubjectName: hint });
  if (!result.syllabus.subjects.length) {
    return { ok: false, error: result.warning ?? "Couldn't find a syllabus structure in this document." };
  }

  sweepTokens();
  const token = newToken();
  previewTokens.set(token, { userId: user.id, syllabus: result.syllabus, expiresAt: Date.now() + TOKEN_TTL_MS });

  return { ok: true, token, syllabus: result.syllabus, source: result.source, warning: result.warning };
}

const commitSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{48}$/),
  subjectId: z.string().min(1).nullable(),
  newSubjectName: z.string().min(1).max(80).nullable(),
  syllabus: ParsedSyllabusSchema,
});

/** Step 2 — persist the (possibly user-edited) preview after explicit confirmation. */
export async function commitSyllabusImportAction(input: {
  token: string;
  subjectId: string | null;
  newSubjectName: string | null;
  syllabus: ParsedSyllabus;
}): Promise<ImportCommitResult> {
  const user = await requireUser();
  const parsed = commitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid import payload." };
  const { token, subjectId, newSubjectName, syllabus } = parsed.data;

  // Single-use token check (binds to the same user who parsed).
  const cached = previewTokens.get(token);
  if (!cached || cached.userId !== user.id) {
    return { ok: false, error: "This import preview expired — parse the file again." };
  }
  previewTokens.delete(token);

  // Resolve target subject: existing (ownership-checked) or create new.
  let targetSubjectId: string;
  if (subjectId) {
    const own = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.id, subjectId), eq(subjects.userId, user.id)))
      .limit(1)
      .all();
    if (!own.length) return { ok: false, error: "Subject not found." };
    targetSubjectId = subjectId;
  } else {
    if (!newSubjectName) return { ok: false, error: "Choose a subject or name a new one." };
    const count = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.userId, user.id)).all();
    const subjectIdNew = uid();
    await db.insert(subjects).values({
      id: subjectIdNew,
      userId: user.id,
      name: newSubjectName,
      color: "#0b57d0",
      priority: 2,
      difficulty: 2,
      sortOrder: count.length,
    });
    targetSubjectId = subjectIdNew;
  }

  // Persist units + topics. Edited preview content wins over the cache —
  // the user's review IS the confirmation.
  const existingUnits = await db.select({ id: units.id }).from(units).where(eq(units.subjectId, targetSubjectId)).all();
  const unitOffset = existingUnits.length;
  let topicCount = 0;

  for (const [ui, u] of syllabus.subjects.flatMap((s) => s.units).entries()) {
    if (ui >= 12) break; // hard cap per import
    const unitId = uid();
    await db.insert(units).values({ id: unitId, subjectId: targetSubjectId, name: u.name.slice(0, 120), sortOrder: unitOffset + ui });
    const existingTopics = await db.select({ id: topics.id }).from(topics).where(eq(topics.unitId, unitId)).all();
    for (const [ti, t] of u.topics.entries()) {
      if (ti >= 40) break;
      await db.insert(topics).values({
        id: uid(),
        unitId,
        name: t.name.slice(0, 120),
        difficulty: t.difficulty,
        description: null,
        status: "not_started",
        sortOrder: existingTopics.length + ti,
      });
      topicCount++;
    }
  }

  if (topicCount === 0) {
    return { ok: false, error: "Nothing to import — the parsed structure had no topics." };
  }

  revalidatePath("/app/syllabus");
  revalidatePath("/app/subjects");
  revalidatePath("/app");
  return { ok: true, subjectId: targetSubjectId, topicCount };
}
