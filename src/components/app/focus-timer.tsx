"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Coffee, Pause, Play, RotateCcw, Timer as TimerIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Field } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { finishFocusAction } from "@/lib/actions/planning";
import type { PlanItemAgg, SubjectAgg } from "@/lib/services/types";

type PickItem = {
  id: string;
  subjectId: string | null;
  subjectName: string | null;
  subjectColor: string | null;
  topicId: string | null;
  title: string;
  minutes: number;
};

export function FocusTimer({
  planItems,
  subjects,
  defaultMinutes,
  defaultBreak,
}: {
  planItems: PlanItemAgg[];
  subjects: SubjectAgg[];
  defaultMinutes: number;
  defaultBreak: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();

  const pickable: PickItem[] = [
    ...planItems
      .filter((p) => p.status === "pending" && p.kind !== "break")
      .map((p) => ({
        id: `plan:${p.id}`,
        subjectId: p.subjectId,
        subjectName: p.subjectName,
        subjectColor: p.subjectColor,
        topicId: p.topicId,
        title: p.topicName ?? p.title,
        minutes: p.durationMinutes,
      })),
    ...subjects.flatMap((s) =>
      s.weakTopics.slice(0, 2).map((w) => ({
        id: `topic:${w.id}`,
        subjectId: s.id,
        subjectName: s.name,
        subjectColor: s.color,
        topicId: w.id,
        title: `Revision · ${w.name}`,
        minutes: defaultMinutes,
      })),
    ),
  ];

  const initialPlanId = sp.get("planItemId");
  const initial = initialPlanId ? pickable.find((p) => p.id === `plan:${initialPlanId}`) : pickable[0];
  const [selected, setSelected] = React.useState<PickItem | undefined>(initial ?? pickable[0]);
  const [mode, setMode] = React.useState<"focus" | "break">("focus");
  const [duration, setDuration] = React.useState(initial?.minutes ?? defaultMinutes);
  const [remaining, setRemaining] = React.useState((initial?.minutes ?? defaultMinutes) * 60);
  const [running, setRunning] = React.useState(false);
  const [startedAt] = React.useState(new Date().toISOString());
  const [finished, setFinished] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startBreak = () => {
    setMode("break");
    setRemaining(defaultBreak * 60);
    setRunning(true);
  };

  const finish = async () => {
    setBusy(true);
    const res = await finishFocusAction({
      planItemId: selected?.id.startsWith("plan:") ? selected.id.slice(5) : null,
      subjectId: selected?.subjectId ?? null,
      topicId: selected?.topicId ?? null,
      startedAt,
      endedAt: new Date().toISOString(),
      durationMinutes: Math.max(1, Math.round((duration * 60 - remaining) / 60)),
      completed: true,
    });
    setBusy(false);
    if (res.ok) {
      setUnlocked(res.unlocked ?? []);
      toast("success", "Session recorded", `${duration} minutes of focus logged`);
      router.refresh();
    } else {
      toast("error", "Could not record session", res.error);
    }
  };

  const elapsed = Math.round(((duration * 60 - remaining) / 60) * 10) / 10;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <CardBody className="flex flex-col items-center py-8">
          {finished ? (
            <div className="flex flex-col items-center text-center">
              <span className="animate-pop mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="h-8 w-8" />
              </span>
              <p className="text-xl font-bold tracking-tight">Nice work! 🎉</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {Math.max(1, elapsed)} minute{Math.max(1, elapsed) === 1 ? "" : "s"} on {selected?.title ?? "your session"}
              </p>
              {unlocked.length > 0 && (
                <div className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
                  {unlocked.length === 1 ? "Achievement unlocked" : "Achievements unlocked"}: {unlocked.join(", ")}
                </div>
              )}
              <div className="mt-6 flex gap-2">
                <Button variant="outline" onClick={() => router.push("/app/today")}>
                  Back to plan
                </Button>
                <Button onClick={() => router.push("/app/progress")}>See progress</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                <svg width="220" height="220" className="-rotate-90">
                  <circle cx="110" cy="110" r="96" fill="none" stroke="var(--color-muted)" strokeWidth="10" />
                  <circle
                    cx="110"
                    cy="110"
                    r="96"
                    fill="none"
                    stroke={mode === "focus" ? "var(--color-primary)" : "var(--color-success)"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 96}
                    strokeDashoffset={2 * Math.PI * 96 * (1 - remaining / (duration * 60))}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-bold tabular-nums tracking-tight">{fmt(remaining)}</span>
                  <span className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {mode === "focus" ? "Focus" : "Break"}
                  </span>
                </div>
              </div>

              <div className="mt-6 w-full space-y-3">
                <Field label="What are you working on?">
                  <Select
                    value={selected?.id ?? ""}
                    onChange={(e) => {
                      const pick = pickable.find((p) => p.id === e.target.value);
                      setSelected(pick);
                      if (pick && !running) {
                        setDuration(pick.minutes);
                        setRemaining(pick.minutes * 60);
                      }
                    }}
                  >
                    {pickable.length === 0 && <option value="">General focus</option>}
                    {pickable.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.subjectName ? `${p.subjectName} — ` : ""}
                        {p.title} ({p.minutes}m)
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="flex items-center justify-center gap-2">
                  {[25, 50, 90].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        if (running) return;
                        setDuration(m);
                        setRemaining(m * 60);
                      }}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                        duration === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m} min
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2.5 pt-2">
                  {!running ? (
                    <>
                      {remaining < duration * 60 && (
                        <Button variant="ghost" onClick={() => { setRemaining(duration * 60); }}>
                          <RotateCcw className="h-4 w-4" /> Reset
                        </Button>
                      )}
                      <Button size="lg" onClick={() => setRunning(true)} className="min-w-32">
                        <Play className="h-5 w-5" /> {remaining === duration * 60 ? "Start focus" : "Resume"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="lg" variant="secondary" onClick={() => setRunning(false)}>
                        <Pause className="h-5 w-5" /> Pause
                      </Button>
                      <Button size="lg" variant="ghost" onClick={() => { setRunning(false); setRemaining(0); }}>
                        <X className="h-5 w-5" /> Finish early
                      </Button>
                    </>
                  )}
                </div>

                {mode === "focus" && elapsed >= 1 && (
                  <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={startBreak}>
                      <Coffee className="h-4 w-4" /> Take a {defaultBreak}-minute break
                    </Button>
                  </div>
                )}

                {!running && elapsed >= 1 && (
                  <div className="flex justify-center">
                    <Button variant="success" size="lg" loading={busy} onClick={finish} className="min-w-40">
                      <Check className="h-5 w-5" /> Complete & log
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <TimerIcon className="h-3.5 w-3.5" />
        Sessions are logged automatically and update your plan, streak and analytics.
      </div>
    </div>
  );
}