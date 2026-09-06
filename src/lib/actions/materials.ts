"use server";

import { and, desc, eq } from "drizzle-orm";
import { db, uid } from "@/lib/db";
import { materials, subjects, topics, units } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { detectKind, extractText, buildExcerpt } from "@/lib/services/extract";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export type UploadMaterialResult =
  | { ok: true; id: string; kind: string; charCount: number; warning?: string }
  | { ok: false; error: string };

export async function uploadMaterialAction(input: {
  fileName: string;
  mimeType: string;
  /** base64-encoded file content (server actions don't stream binary) */
  dataBase64: string;
  subjectId?: string;
  topicId?: string;
}): Promise<UploadMaterialResult> {
  const user = await requireUser();
  const name = input.fileName.slice(0, 200);
  const buffer = Buffer.from(input.dataBase64, "base64");

  if (!buffer.length) return { ok: false, error: "The file is empty." };
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File is too large — the limit is 15 MB." };
  }

  const kind = detectKind(name, input.mimeType);
  if (!kind) {
    return { ok: false, error: "Unsupported format — upload a PDF, Word, Excel, text or image file." };
  }

  // Ownership check when attaching to a subject/topic.
  let subjectId: string | null = null;
  let topicId: string | null = null;
  if (input.subjectId) {
    const own = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.id, input.subjectId), eq(subjects.userId, user.id)))
      .limit(1)
      .all();
    if (!own.length) return { ok: false, error: "Subject not found." };
    subjectId = input.subjectId;
  }
  if (input.topicId) {
    const own = await db
      .select({ id: topics.id, unitId: topics.unitId })
      .from(topics)
      .innerJoin(units, eq(topics.unitId, units.id))
      .innerJoin(subjects, eq(units.subjectId, subjects.id))
      .where(and(eq(topics.id, input.topicId), eq(subjects.userId, user.id)))
      .limit(1)
      .all();
    if (!own.length) return { ok: false, error: "Topic not found." };
    topicId = input.topicId;
    if (!subjectId) {
      const sid = await db
        .select({ subjectId: units.subjectId })
        .from(units)
        .where(eq(units.id, own[0].unitId))
        .limit(1)
        .all();
      subjectId = sid[0]?.subjectId ?? null;
    }
  }

  let warning: string | undefined;
  let fullText = "";
  if (kind === "image") {
    warning =
      "Images are stored for reference — text extraction (OCR) for photos is coming soon, so Pilot can't read their contents yet.";
  } else {
    try {
      fullText = await extractText(kind, name, buffer);
      if (!fullText.trim()) {
        warning =
          kind === "pdf"
            ? "No selectable text found — this looks like a scanned PDF. Stored for reference, but Pilot can't read scanned pages yet (OCR coming soon)."
            : "No readable text found — stored for reference.";
      }
    } catch {
      warning = "Text extraction failed — stored for reference, but Pilot can't read its contents yet.";
    }
  }

  const id = uid();
  await db.insert(materials).values({
    id,
    userId: user.id,
    subjectId,
    topicId,
    fileName: name,
    kind,
    excerpt: fullText ? buildExcerpt(fullText) : null,
    fullText: fullText || null,
    charCount: fullText.length,
    status: "ready",
  });

  revalidatePath("/app/syllabus");
  return { ok: true, id, kind, charCount: fullText.length, warning };
}

export async function listMaterialsAction(subjectId?: string) {
  const user = await requireUser();
  const rows = await db
    .select({
      id: materials.id,
      fileName: materials.fileName,
      kind: materials.kind,
      charCount: materials.charCount,
      excerpt: materials.excerpt,
      createdAt: materials.createdAt,
      subjectName: subjects.name,
    })
    .from(materials)
    .leftJoin(subjects, eq(materials.subjectId, subjects.id))
    .where(
      subjectId
        ? and(eq(materials.userId, user.id), eq(materials.subjectId, subjectId))
        : eq(materials.userId, user.id),
    )
    .orderBy(desc(materials.createdAt))
    .limit(100)
    .all();
  return rows;
}

export async function deleteMaterialAction(id: string) {
  const user = await requireUser();
  await db.delete(materials).where(and(eq(materials.id, id), eq(materials.userId, user.id))).run();
  revalidatePath("/app/syllabus");
  return { ok: true as const };
}
