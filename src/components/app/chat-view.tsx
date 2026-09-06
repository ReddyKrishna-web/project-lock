"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUp, Rocket, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import { sendChatMessageAction } from "@/lib/actions/chat";
import { Avatar } from "@/components/ui/avatar";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta: { actions?: { label: string; href: string }[]; suggested?: string[] } | null;
};

const SUGGESTIONS = [
  "Plan my day",
  "What should I study now?",
  "Am I on track?",
  "What are my weak topics?",
  "Prepare me for my next exam",
  "Quiz me",
  "Reschedule my missed tasks",
  "What's my streak?",
];

/** Very small markdown renderer: **bold**, line breaks, numbered/bullet lists. */
function Rich({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const listMatch = trimmed.match(/^(\d+\.|-|\*)\s+(.*)$/);
        if (listMatch) {
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 font-semibold text-primary">{listMatch[1] === "-" || listMatch[1] === "*" ? "•" : listMatch[1]}</span>
              <span className="min-w-0">{inlineBold(listMatch[2])}</span>
            </div>
          );
        }
        return <p key={i}>{inlineBold(trimmed)}</p>;
      })}
    </div>
  );
}

function inlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function ChatView({ initialMessages, userName }: { initialMessages: Msg[]; userName: string }) {
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<Msg[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setInput("");
    setMessages((m) => [...m, { id: `local-${Date.now()}`, role: "user", content: trimmed, meta: null }]);
    setThinking(true);
    const res = await sendChatMessageAction(trimmed);
    setThinking(false);
    if (!res.ok) {
      toast("error", "Pilot couldn't respond", res.error);
      return;
    }
    setMessages((m) => [
      ...m,
      { id: `ai-${Date.now()}`, role: "assistant", content: res.message.content, meta: res.message.meta },
    ]);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-9.5rem)] max-w-3xl flex-col">
      {/* messages */}
      <div className="flex-1 space-y-5 overflow-y-auto px-1 py-2">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white pop-shadow">
              <Rocket className="h-7 w-7" />
            </span>
            <p className="text-lg font-bold tracking-tight">Hey {userName.split(" ")[0]} 👋</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              I&apos;m Pilot — your study co-pilot. I know your syllabus, exams, deadlines and progress. Ask me anything about your plan.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
            {m.role === "assistant" ? (
              <Avatar name="Pilot" size="sm" className="mt-0.5" />
            ) : (
              <Avatar name={userName} size="sm" className="mt-0.5" />
            )}
            <div className={cn("max-w-[82%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed", m.role === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card")}>
              <Rich text={m.content} />
              {m.meta?.actions && m.meta.actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.meta.actions.map((a) => (
                    <Link
                      key={a.href + a.label}
                      href={a.href}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      <Sparkles className="h-3 w-3" /> {a.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-3">
            <Avatar name="Pilot" size="sm" className="mt-0.5" />
            <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3.5">
              <span className="flex items-center gap-1.5 text-muted-foreground" role="status" aria-label="Pilot is thinking">
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span className="thinking-dot" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* suggestions */}
      {messages.length < 3 && !thinking && (
        <div className="flex flex-wrap gap-2 pb-2">
          {SUGGESTIONS.slice(0, 5).map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 pop-shadow focus-within:border-primary/50"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask Pilot anything about your studies…"
          aria-label="Message Pilot"
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!input.trim() || thinking}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 cursor-pointer"
        >
          <ArrowUp className="h-4.5 w-4.5" />
        </button>
      </form>
      <p className="pt-2 text-center text-[11px] text-muted-foreground">
        Pilot runs on the built-in engine with your real data · optional AI provider unlocks tutoring & free-form chat
      </p>
    </div>
  );
}