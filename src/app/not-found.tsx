import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-white pop-shadow">
        <Compass className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold tracking-tight">Off the flight path</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        That page doesn&apos;t exist — it may have moved, or the link is off.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
