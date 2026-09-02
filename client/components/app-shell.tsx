"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Minus,
  TrendingDown,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, PRODUCT } from "@/lib/api";
import { formatClinicalDate } from "@/lib/utils";
import { Button } from "./ui/button";
import { CommandPalette } from "./command-palette";
import { cn } from "@/lib/utils";

type User = {
  full_name: string;
  role: string;
  email: string;
  facility_name?: string;
  facility_code?: string;
  permissions?: string[];
};

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/children", label: "Children", icon: Users },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = useQuery({ queryKey: ["me"], queryFn: () => api<User>("/auth/me") });
  const notes = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api<{
        items: {
          id: string;
          title: string;
          body?: string | null;
          severity: string;
          created_at: string;
          read_at?: string | null;
        }[];
      }>("/notifications"),
  });
  const logout = useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: () => router.push("/login"),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user.isError) router.push("/login");
  }, [user.isError, router]);

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 bg-white px-3 py-2">
        Skip to content
      </a>
      {mounted ? (
        <header className="sticky top-0 z-30 border-b border-black/20 bg-[#0A2748] text-white">
          <div className="flex h-16 items-center gap-4 px-4">
            <div>
              <p className="text-sm font-semibold tracking-wide">{PRODUCT.name}</p>
              <p className="text-xs text-white/70">{user.data?.facility_name ?? "Facility"}</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
            <NotificationMenu items={notes.data?.items ?? []} />
            <div className="text-right text-sm">
              <p className="font-medium">{user.data?.full_name ?? "…"}</p>
              <p className="text-xs capitalize text-white/70">{user.data?.role?.replace("_", " ")}</p>
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => logout.mutate()} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
            </div>
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-30 border-b border-black/20 bg-[#0A2748]" aria-hidden>
          <div className="h-16" />
        </header>
      )}
      <div className="flex">
        <nav
          className={cn(
            "min-h-[calc(100vh-4rem)] w-60 border-r border-white/10 bg-[#0A2748] p-3",
          )}
          aria-label="Primary"
        >
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm",
                      active ? "bg-[#EAF2FA] text-[#0A2748] font-medium" : "text-white/80 hover:bg-white/10",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main id="main" className="min-w-0 flex-1 overflow-x-auto p-6">
          {children}
        </main>
      </div>
      {mounted ? <CommandPalette /> : null}
    </div>
  );
}

function NotificationMenu({
  items,
}: {
  items: {
    id: string;
    title: string;
    body?: string | null;
    severity: string;
    created_at: string;
    read_at?: string | null;
  }[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const critical = items.filter((i) => i.severity === "HIGH" || i.severity === "URGENT");
  const criticalIds = new Set(critical.map((i) => i.id));
  const today = items.filter((i) => !criticalIds.has(i.id));
  const unread = items.filter((i) => !i.read_at).length;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={cn(
          "relative rounded-xl p-2.5 transition",
          open ? "bg-white/15 text-white" : "text-white/90 hover:bg-white/10",
        )}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clinical-danger px-1 text-[10px] font-bold text-white ring-2 ring-[#0A2748]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] overflow-hidden rounded-2xl border border-[#dbe6f0] bg-white text-ink shadow-[0_20px_48px_-20px_rgba(10,39,72,0.35)]">
          <div className="border-b border-[#e8eef5] bg-gradient-to-br from-[#f7faff] to-white px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#0f2744]">Notifications</p>
                <p className="text-xs text-muted">
                  {unread > 0 ? `${unread} unread` : "You're up to date"}
                </p>
              </div>
              <span className="rounded-full bg-[#0A2748] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                {items.length} total
              </span>
            </div>
          </div>

          <div className="max-h-[min(24rem,70vh)] overflow-y-auto p-2">
            <NotificationSection
              label="Critical"
              empty="No critical alerts require your attention."
              items={critical.slice(0, 4)}
            />
            <NotificationSection
              label="Today"
              empty="No other notifications today."
              items={today.slice(0, 6)}
              className={critical.length > 0 ? "mt-3 border-t border-[#eef2f7] pt-3" : undefined}
            />
          </div>

          <div className="border-t border-[#e8eef5] bg-[#f8fafc] px-3 py-2.5">
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-[#0E3A67] transition hover:bg-white"
            >
              View all alerts
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationSection({
  label,
  empty,
  items,
  className,
}: {
  label: string;
  empty: string;
  items: { id: string; title: string; body?: string | null; severity: string; created_at: string; read_at?: string | null }[];
  className?: string;
}) {
  return (
    <section className={className}>
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">{label}</p>
      {items.length === 0 ? (
        <p className="rounded-xl bg-[#f8fafc] px-3 py-4 text-center text-xs leading-relaxed text-muted">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((n) => (
            <NotificationRow key={n.id} item={n} />
          ))}
        </ul>
      )}
    </section>
  );
}

function notificationVisuals(title: string, severity: string) {
  const lower = title.toLowerCase();
  if (lower.includes("relapse") || lower.includes("regression")) {
    return {
      Icon: TrendingDown,
      tone: "bg-red-50/80 text-red-900",
      badge: "bg-red-100 text-red-800",
      label: "Relapse",
    };
  }
  if (lower.includes("deterioration")) {
    return {
      Icon: AlertTriangle,
      tone: "bg-red-50/70 text-red-900",
      badge: "bg-red-100 text-red-800",
      label: "Deterioration",
    };
  }
  if (lower.includes("stagnation")) {
    return {
      Icon: Minus,
      tone: "bg-amber-50/80 text-amber-950",
      badge: "bg-amber-100 text-amber-900",
      label: "Stagnation",
    };
  }
  if (severity === "HIGH" || severity === "URGENT") {
    return {
      Icon: AlertTriangle,
      tone: "bg-red-50/70 text-red-900",
      badge: "bg-red-100 text-red-800",
      label: "High",
    };
  }
  return {
    Icon: Bell,
    tone: "bg-[#eff6ff]/80 text-[#0f2744]",
    badge: "bg-[#dbeafe] text-[#1e40af]",
    label: "Update",
  };
}

function NotificationRow({
  item,
}: {
  item: { id: string; title: string; body?: string | null; severity: string; created_at: string; read_at?: string | null };
}) {
  const { Icon, tone, badge, label } = notificationVisuals(item.title, item.severity);
  const unread = !item.read_at;

  return (
    <li>
      <div
        className={cn(
          "group flex gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-[#e2eaf3] hover:shadow-sm",
          tone,
          unread && "ring-1 ring-inset ring-black/[0.03]",
        )}
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm leading-snug", unread ? "font-semibold" : "font-medium")}>{item.title}</p>
            {unread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0E3A67]" aria-label="Unread" /> : null}
          </div>
          {item.body ? <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed opacity-80">{item.body}</p> : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", badge)}>
              {label}
            </span>
            <span className="text-[11px] text-muted">
              {formatClinicalDate(item.created_at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
