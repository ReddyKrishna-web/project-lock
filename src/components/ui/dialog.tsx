"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  // Dialog lifecycle as a single state machine — no setState-in-effect.
  // "closed" → (open) → "opening" (mounted, pre-rAF) → "open-vis" (visible)
  // → (closed) → "closing" (fade-out) → "closed" (unmounted after 180ms).
  const [phase, setPhase] = React.useState<
    "closed" | "opening" | "open-vis" | "closing"
  >(open ? "opening" : "closed");
  const [prevOpen, setPrevOpen] = React.useState(open);
  // Prop change → phase transition happens during render (React's documented
  // pattern for adjusting state when a prop changes) — no effect needed.
  if (open !== prevOpen) {
    setPrevOpen(open);
    setPhase(open ? "opening" : "closing");
  }
  const mounted = phase !== "closed";
  const visible = phase === "open-vis";

  React.useEffect(() => {
    if (phase === "opening") {
      const raf = requestAnimationFrame(() => setPhase("open-vis"));
      return () => cancelAnimationFrame(raf);
    }
    if (phase === "closing") {
      const t = setTimeout(() => setPhase("closed"), 180);
      return () => clearTimeout(t);
    }
  }, [phase]);

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // focus management
  React.useEffect(() => {
    if (open && mounted) {
      const panel = panelRef.current;
      const prev = document.activeElement as HTMLElement | null;
      panel?.focus();
      return () => prev?.focus?.();
    }
  }, [open, mounted]);

  if (!mounted) return null;

  const maxW = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return createPortal(
    <div
      className={cn("fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6", visible ? "animate-fade-in" : "opacity-0 transition-opacity")}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full rounded-t-3xl bg-card pop-shadow outline-none sm:rounded-3xl",
          "transition-all duration-200 ease-out",
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.98] opacity-0",
          maxW,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-border bg-muted/30 px-6 py-4 rounded-b-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
