import type { MaterialKind } from "@/lib/db/schema";

/* ──────────────────────────────────────────────────────────────
   Study-material text extraction.

   pdf  → pdf-parse (pure JS, no native deps)
   word → mammoth (.docx → plain text)
   excel→ xlsx (all sheets → row text)
   text → as-is
   image→ stored for reference; text extraction needs OCR (backlog)
   ────────────────────────────────────────────────────────────── */

export const MAX_MATERIAL_CHARS = 200_000;

export function detectKind(fileName: string, mimeType: string): MaterialKind | null {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || mimeType === "application/pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "word";
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return "excel";
  if (ext === "txt" || ext === "md" || mimeType.startsWith("text/")) return "text";
  if (mimeType.startsWith("image/")) return "image";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  return null;
}

export async function extractText(
  kind: MaterialKind,
  fileName: string,
  buffer: Buffer,
): Promise<string> {
  switch (kind) {
    case "pdf":
      return extractPdf(buffer);
    case "word":
      return extractWord(buffer);
    case "excel":
      return extractExcel(buffer, fileName);
    case "text":
      return buffer.toString("utf8").slice(0, MAX_MATERIAL_CHARS);
    case "image":
      return "";
  }
}

type PdfParseModule = {
  PDFParse?: new (options: { data: Uint8Array }) => {
    getText(): Promise<{ text?: string }>;
    destroy?(): Promise<void>;
  };
  text?: (b: Buffer) => Promise<string>;
  default?: PdfParseModule;
};

async function extractPdf(buffer: Buffer): Promise<string> {
  const mod = (await import("pdf-parse")) as unknown as PdfParseModule;
  // pdf-parse v2.4+ (ESM): PDFParse class with getText()
  const PDFParse = mod.PDFParse ?? mod.default?.PDFParse;
  if (typeof PDFParse === "function") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return (result?.text ?? "").replace(/\u0000/g, "").trim().slice(0, MAX_MATERIAL_CHARS);
    } finally {
      try {
        await parser.destroy?.();
      } catch {
        /* destroy is best-effort */
      }
    }
  }
  // Legacy/alternate builds: plain text() function
  const legacy = mod.text ?? mod.default?.text;
  if (legacy) {
    const out = await legacy.call(mod, buffer);
    return (out ?? "").replace(/\u0000/g, "").trim().slice(0, MAX_MATERIAL_CHARS);
  }
  throw new Error("pdf-parse module shape unrecognized");
}

async function extractWord(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return (result.value ?? "").trim().slice(0, MAX_MATERIAL_CHARS);
}

async function extractExcel(buffer: Buffer, fileName: string): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    if (csv.trim()) parts.push(`# Sheet: ${sheetName}\n${csv}`);
  }
  const joined = parts.join("\n\n").trim();
  if (!joined && /\.csv$/i.test(fileName)) {
    return buffer.toString("utf8").slice(0, MAX_MATERIAL_CHARS);
  }
  return joined.slice(0, MAX_MATERIAL_CHARS);
}

/** Build a condensed excerpt for AI grounding (keeps head + samples). */
export function buildExcerpt(fullText: string, maxChars = 1400): string {
  const clean = fullText.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const head = clean.slice(0, Math.floor(maxChars * 0.7));
  const tail = clean.slice(-Math.floor(maxChars * 0.25));
  return `${head} … ${tail}`;
}
