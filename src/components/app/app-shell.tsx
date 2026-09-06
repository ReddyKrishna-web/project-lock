"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Flame,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  MessageSquareText,
  Rocket,
  Settings as SettingsIcon,
  Sparkles,
  Target,
  Timer,
  Trophy,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { markNotificationsReadAction } from "@/lib/actions/settings";
import { logoutAction } from "@/lib/auth/actions";
import { format } from "date-fns";

type ShellUser = { id: string; name: string; email: string };
type Unread = { id: string; type: string; title: string; body: string | null; createdAt: string };

const MAIN_NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/today", label: "Today", icon: Target },
  { href: "/app/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/app/exams", label: "Exams", icon: GraduationCap },
  { href: "/app/tasks", label: "Tasks", icon: ListTodo },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
];

const TOOLS_NAV = [
  { href: "/app/focus", label: "Focus", icon: Timer },
  { href: "/app/chat", label: "Pilot", icon: MessageSquareText },
  { href: "/app/progress", label: "Progress", icon: BarChart3 },
  { href: "/app/achievements", label: "Achievements", icon: Trophy },
];

const BOTTOM_NAV = [
  { href: "/app", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/app/today", label: "Plan", icon: Target },
  { href: "/app/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/app/chat", label: "Pilot", icon: MessageSquareText },
  { href: "/app/progress", label: "Progress", icon: BarChart3 },
];

const PAGE_TITLES: Record<string, string> = {
  "/app": "Dashboard",
  "/app/today": "Today's Plan",
  "/app/syllabus": "Syllabus",
  "/app/subjects": "Subjects",
  "/app/exams": "Exams",
  "/app/tasks": "Tasks",
  "/app/calendar": "Calendar",
  "/app/focus": "Focus Mode",
  "/app/chat": "Pilot · AI Study Assistant",
  "/app/progress": "Progress & Analytics",
  "/app/achievements": "Achievements",
  "/app/settings": "Settings",
};

function Brand() {
  return (
    <Link href="/app" className="flex items-center gap-2.5 px-1">
      <span className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
        <Rocket className="h-4.5 w-4.5" />
      </span>
      <span className="text-[15px] font-bold tracking-tight">
        Study<span className="text-gradient">Pilot</span>
      </span>
    </Link>
  );
}

function NavLink({ item, onNavigate }: { item: (typeof MAIN_NAV)[number]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-all",
        active
          ? "bg-primary-soft text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {item.label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
    </Link>
  );
}

export function AppShell({
  user,
  streak,
  unread,
  children,
}: {
  user: ShellUser;
  streak: number;
  unread: Unread[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "StudyPilot";
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [notifList, setNotifList] = React.useState(unread);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const openNotifs = async () => {
    setNotifOpen((v) => !v);
    if (notifList.length) {
      setNotifList([]);
      await markNotificationsReadAction();
    }
  };

  const timeGreeting = (() => {
    const h = new Date().getHours();
    return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card/60 backdrop-blur-xl lg:flex">
        <div className="px-4 pb-2 pt-5">
          <Brand />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Plan</p>
          {MAIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
          <p className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Focus & Grow</p>
          {TOOLS_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            href="/app/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SettingsIcon className="h-4.5 w-4.5" />
            Settings
          </Link>
        </div>
      </aside>

      {/* ── Top bar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border glass px-4 lg:pl-[260px] lg:pr-6">
        <div className="flex items-center gap-3">
          <Link href="/app" className="lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Rocket className="h-4 w-4" />
            </span>
          </Link>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight">{title}</p>
            <p className="text-[11px] text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold sm:inline-flex">
            <Flame className={cn("h-3.5 w-3.5", streak > 0 ? "text-warning" : "text-muted-foreground/40")} />
            {streak} day{streak === 1 ? "" : "s"}
          </span>

          <ThemeToggle compact />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={openNotifs}
              aria-label={`Notifications${notifList.length ? ` (${notifList.length} unread)` : ""}`}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {notifList.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {notifList.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} aria-hidden />
                <div className="absolute right-0 z-40 mt-2 w-80 animate-scale-in rounded-2xl border border-border bg-card pop-shadow">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold">Notifications</p>
                    <button onClick={() => setNotifOpen(false)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                      Close
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {unread.length === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        You&apos;re all caught up 🎉
                      </p>
                    ) : (
                      unread.map((n) => (
                        <div key={n.id} className="rounded-xl px-3 py-2.5 transition-colors hover:bg-muted">
                          <p className="text-[13px] font-semibold leading-snug">{n.title}</p>
                          {n.body && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{n.body}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account menu"
              className="rounded-full transition-transform hover:scale-105 cursor-pointer"
            >
              <Avatar name={user.name} size="sm" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-hidden />
                <div className="absolute right-0 z-40 mt-2 w-56 animate-scale-in rounded-2xl border border-border bg-card pop-shadow p-2">
                  <div className="border-b border-border px-3 pb-2.5 pt-1.5">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Link
                    href="/app/settings"
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <SettingsIcon className="h-4 w-4" /> Settings
                  </Link>
                  <form
                    action={async () => {
                      await logoutAction();
                    }}
                  >
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-danger hover:bg-danger-soft cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────── */}
      <main className="px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-[264px] lg:pr-8">
        <div key={pathname} className="mx-auto max-w-6xl animate-fade-in">
          <div className="mb-6 sm:hidden">
            <p className="text-lg font-bold tracking-tight">{title}</p>
            <p className="text-xs text-muted-foreground">
              {timeGreeting}, {user.name.split(" ")[0]} · {format(new Date(), "EEEE, MMMM d")}
            </p>
          </div>
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav ───────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border glass pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-1.5">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_2px_6px_rgba(87,83,212,0.45)]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export { Sparkles };