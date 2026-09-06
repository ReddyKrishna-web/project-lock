"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import {
  commitSyllabusImportAction,
  parseSyllabusImportAction,
} from "@/lib/actions/import";

type ParsedTopic = { name: string; difficulty: number };
type ParsedUnit = { name: string; topics: ParsedTopic[] };
type ParsedSubject = { name: string; units: ParsedUnit[] };

const MAX_UNITS = 12;
const MAX_TOPICS_PER_UNIT = 40;

/**
 * Syllabus import: upload → parse (AI or built-in engine) → review/edit
 * the preview → confirm. Nothing touches the database until "Import".
 */
export function SyllabusImport({
  subjects,
}: {
  subjects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [preview, setPreview] = React.useState<{
    token: string;
    source: "ai" | "heuristic";
    warning?: string;
    subjects: ParsedSubject[];
  } | null>(null);
  const [target, setTarget] = React.useState<string>(""); // "" = new subject
  const [newSubjectName, setNewSubjectName] = React.useState("");
  const [committing, setCommitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setParsing(false);
    setCommitting(false);
    setTarget("");
    setNewSubjectName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const parse = async () => {
    if (!file || parsing) return;
    setParsing(true);
    setPreview(null);
    try {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const res = await parseSyllabusImportAction({
        fileName: file.name,
        mimeType: file.type,
        dataBase64: btoa(binary),
        subjectId: target || undefined,
      });
      if (!res.ok) {
        toast("error", "Import failed", res.error);
        return;
      }
      setPreview({ token: res.token, source: res.source, warning: res.warning, subjects: res.syllabus.subjects });
      const first = res.syllabus.subjects[0]?.name ?? "";
      if (!target && !newSubjectName && first) setNewSubjectName(first.slice(0, 80));
    } catch {
      toast("error", "Import failed", "Couldn't read that file. Try a different PDF or paste topics manually.");
    } finally {
      setParsing(false);
    }
  };

  const commit = async () => {
    if (!preview || committing) return;
    if (!target && !newSubjectName.trim()) {
      toast("error", "Choose a subject", "Pick an existing subject or name the new one.");
      return;
    }
    setCommitting(true);
    try {
      const res = await commitSyllabusImportAction({
        token: preview.token,
        subjectId: target || null,
        newSubjectName: target ? null : newSubjectName.trim(),
        syllabus: { subjects: preview.subjects },
      });
      if (!res.ok) {
        toast("error", "Import failed", res.error);
        return;
      }
      toast("success", "Syllabus imported", `${res.topicCount} topic${res.topicCount === 1 ? "" : "s"} added — the planner will start scheduling them.`);
      close();
      router.refresh();
    } catch {
      toast("error", "Import failed", "Connection problem — try again.");
    } finally {
      setCommitting(false);
    }
  };

  const editSubject = (si: number, name: string) =>
    setPreview((p) => (p ? { ...p, subjects: p.subjects.map((s, i) => (i === si ? { ...s, name } : s)) } : p));
  const editUnit = (si: number, ui: number, name: string) =>
    setPreview((p) =>
      p ? { ...p, subjects: p.subjects.map((s, i) => (i === si ? { ...s, units: s.units.map((u, j) => (j === ui ? { ...u, name } : u)) } : s)) } : p,
    );
  const editTopic = (si: number, ui: number, ti: number, patch: Partial<ParsedTopic>) =>
    setPreview((p) =>
      p
        ? {
            ...p,
            subjects: p.subjects.map((s, i) =>
              i === si
                ? {
                    ...s,
                    units: s.units.map((u, j) =>
                      j === ui ? { ...u, topics: u.topics.map((t, k) => (k === ti ? { ...t, ...patch } : t)) } : u,
                    ),
                  }
                : s,
            ),
          }
        : p,
    );
  const removeTopic = (si: number, ui: number, ti: number) =>
    setPreview((p) =>
      p
        ? {
            ...p,
            subjects: p.subjects.map((s, i) =>
              i === si
                ? { ...s, units: s.units.map((u, j) => (j === ui ? { ...u, topics: u.topics.filter((_, k) => k !== ti) } : u)) }
                : s,
            ),
          }
        : p,
    );
  const removeUnit = (si: number, ui: number) =>
    setPreview((p) =>
      p ? { ...p, subjects: p.subjects.map((s, i) => (i === si ? { ...s, units: s.units.filter((_, j) => j !== ui) } : s)) } : p,
    );

  const totalTopics = preview?.subjects.reduce((a, s) => a + s.units.reduce((b, u) => b + u.topics.length, 0), 0) ?? 0;

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="cursor-pointer">
        <FileUp className="h-4 w-4" /> Import syllabus
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title="Import syllabus"
        description="Upload a PDF, Word, Excel or text file. You'll review everything before it's added."
      >
        <div className="space-y-4">
          {/* Step 1: file */}
          {!preview && (
            <div className="space-y-4">
              <Field label="Syllabus document">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
              </Field>
              <Field label="Add topics to">
                <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="">— Create a new subject —</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {!target && (
                <Field label="New subject name">
                  <Input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="e.g. Database Management Systems" />
                </Field>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={close} className="cursor-pointer">
                  Cancel
                </Button>
                <Button size="sm" disabled={!file || parsing} onClick={parse} className="cursor-pointer">
                  {parsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Parsing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Parse document
                    </>
                  )}
                </Button>
              </div>
              {parsing && (
                <p className="text-center text-xs text-muted-foreground" role="status">
                  Reading the document and structuring topics — this usually takes a few seconds.
                </p>
              )}
            </div>
          )}

          {/* Step 2: review */}
          {preview && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={cn("rounded-full px-2.5 py-1 font-semibold", preview.source === "ai" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground")}>
                  {preview.source === "ai" ? "AI-parsed" : "Engine-parsed"}
                </span>
                <span className="text-muted-foreground">
                  {totalTopics} topic{totalTopics === 1 ? "" : "s"} in {preview.subjects.reduce((a, s) => a + s.units.length, 0)} units — edit anything before importing.
                </span>
              </div>
              {preview.warning && (
                <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {preview.warning}
                </p>
              )}

              <div className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-border p-3">
                {preview.subjects.map((s, si) => (
                  <div key={si} className="space-y-2">
                    <Input value={s.name} onChange={(e) => editSubject(si, e.target.value)} aria-label="Subject name" className="font-semibold" />
                    {s.units.slice(0, MAX_UNITS).map((u, ui) => (
                      <div key={ui} className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                        <div className="flex items-center gap-2">
                          <Input value={u.name} onChange={(e) => editUnit(si, ui, e.target.value)} aria-label="Unit name" className="text-[13px]" />
                          <button
                            onClick={() => removeUnit(si, ui)}
                            aria-label={`Remove unit ${u.name}`}
                            className="shrink-0 text-xs font-semibold text-danger hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                        <ul className="mt-2 space-y-1.5">
                          {u.topics.slice(0, MAX_TOPICS_PER_UNIT).map((t, ti) => (
                            <li key={ti} className="flex items-center gap-2">
                              <Input
                                value={t.name}
                                onChange={(e) => editTopic(si, ui, ti, { name: e.target.value })}
                                aria-label="Topic name"
                                className="h-8 text-[12.5px]"
                              />
                              <Select
                                value={t.difficulty}
                                onChange={(e) => editTopic(si, ui, ti, { difficulty: Number(e.target.value) })}
                                aria-label={`Difficulty of ${t.name}`}
                                className="h-8 w-20 shrink-0 text-[12px]"
                              >
                                {[1, 2, 3, 4, 5].map((d) => (
                                  <option key={d} value={d}>
                                    {"•".repeat(d)}
                                  </option>
                                ))}
                              </Select>
                              <button
                                onClick={() => removeTopic(si, ui, ti)}
                                aria-label={`Remove topic ${t.name}`}
                                className="shrink-0 rounded p-1 text-muted-foreground hover:text-danger cursor-pointer"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                          {u.topics.length === 0 && <li className="text-[11px] italic text-muted-foreground">No topics parsed in this unit.</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {!target && (
                <Field label="Import as subject">
                  <Input value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} />
                </Field>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => { setPreview(null); setFile(null); }} className="cursor-pointer">
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={close} className="cursor-pointer">
                    Cancel
                  </Button>
                  <Button size="sm" disabled={committing || totalTopics === 0} onClick={commit} className="cursor-pointer">
                    {committing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Importing…
                      </>
                    ) : (
                      <>Import {totalTopics} topics</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
