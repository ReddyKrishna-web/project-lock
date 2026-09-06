"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, FileSpreadsheet, FileImage, FileType2, Upload, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import {
  uploadMaterialAction,
  listMaterialsAction,
  deleteMaterialAction,
} from "@/lib/actions/materials";

const KIND_ICON: Record<string, typeof FileText> = {
  pdf: FileType2,
  word: FileText,
  excel: FileSpreadsheet,
  text: FileText,
  image: FileImage,
};

export function MaterialsPanel({
  subjects,
}: {
  subjects: { id: string; name: string }[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [items, setItems] = React.useState<Awaited<ReturnType<typeof listMaterialsAction>>>([]);
  const [subjectId, setSubjectId] = React.useState<string>("");
  const [uploading, setUploading] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async (filter: string) => {
    const rows = await listMaterialsAction(filter || undefined);
    setItems(rows);
  }, []);

  // Load once per distinct subject filter (ref-guarded, dedupes StrictMode).
  const loadedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (loadedFor.current === subjectId) return;
    loadedFor.current = subjectId;
    void load(subjectId);
  }, [subjectId, load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 5)) {
        const buffer = await file.arrayBuffer();
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.length; i += 8192) {
          binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        }
        const res = await uploadMaterialAction({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          dataBase64: btoa(binary),
          subjectId: subjectId || undefined,
        });
        if (!res.ok) {
          toast("error", `Couldn't upload ${file.name}`, res.error);
          continue;
        }
        toast(
          "success",
          `${file.name} ready`,
          res.warning ??
            `Extracted ${res.charCount.toLocaleString()} characters — Pilot now answers from this material.`,
        );
      }
      await load(subjectId);
      router.refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors",
          dragging ? "border-primary bg-primary-soft/50" : "border-border bg-muted/30",
        )}
      >
        <Upload className={cn("mb-2 h-5 w-5", uploading ? "animate-pulse text-primary" : "text-muted-foreground")} />
        <p className="text-[13px] font-semibold">
          {uploading ? "Extracting text…" : "Drop study files here or"}
        </p>
        {!uploading && (
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-1 text-[13px] font-semibold text-primary hover:underline cursor-pointer"
          >
            browse files
          </button>
        )}
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          PDF · Word · Excel · text · images — up to 15 MB. Pilot reads them to answer, quiz and build flashcards.
        </p>
        {uploading && <Loader2 className="mt-2 h-4 w-4 animate-spin text-primary" />}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,image/*"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      {/* Subject filter */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubjectId("")}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
              !subjectId ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubjectId(subjectId === s.id ? "" : s.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                subjectId === s.id ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {items.length === 0 ? (
        <p className="rounded-xl bg-muted/40 px-4 py-5 text-center text-[12px] text-muted-foreground">
          No materials yet. Upload lecture slides, past papers or notes — then ask Pilot
          <span className="font-semibold text-foreground"> “Quiz me from my materials”</span> or
          <span className="font-semibold text-foreground"> “Make flashcards from my PDF”</span>.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((m) => {
            const Icon = KIND_ICON[m.kind] ?? FileText;
            return (
              <li key={m.id} className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{m.fileName}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {m.subjectName ?? "No subject"} ·{" "}
                    {m.charCount > 0 ? `${m.charCount.toLocaleString()} chars read` : "stored (no text extracted)"}
                  </span>
                </span>
                <button
                  onClick={async () => {
                    await deleteMaterialAction(m.id);
                    await load(subjectId);
                    router.refresh();
                  }}
                  aria-label={`Delete ${m.fileName}`}
                  className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger group-hover:opacity-100 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
