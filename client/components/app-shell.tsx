"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, PRODUCT } from "@/lib/api";
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
    queryFn: () => api<{ items: { id: string; title: string; severity: string; created_at: string }[] }>("/notifications"),
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

function NotificationMenu({ items }: { items: { id: string; title: string; severity: string; created_at: string }[] }) {
  const [open, setOpen] = useState(false);
  const critical = items.filter((i) => i.severity === "HIGH" || i.severity === "URGENT");
  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-lg p-2 text-white/90 hover:bg-white/10"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {items.length > 0 ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-clinical-danger" /> : null}
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-line bg-white p-3 shadow-card">
          <p className="px-2 text-xs font-semibold uppercase text-muted">Critical</p>
          {critical.length === 0 ? <p className="px-2 py-3 text-sm text-muted">No critical alerts require your attention.</p> : null}
          {critical.slice(0, 4).map((n) => (
            <p key={n.id} className="rounded-lg px-2 py-2 text-sm hover:bg-canvas">
              {n.title}
            </p>
          ))}
          <p className="mt-2 px-2 text-xs font-semibold uppercase text-muted">Today</p>
          {items.slice(0, 6).map((n) => (
            <p key={n.id} className="rounded-lg px-2 py-2 text-sm hover:bg-canvas">
              {n.title}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
