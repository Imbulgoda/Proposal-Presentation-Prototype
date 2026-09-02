"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, persistCsrf } from "@/lib/api";
import { HUB_LOGIN_URL } from "@/lib/hub-auth";

export default function HubAuthPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Connecting to FedNutri-XAI hub session…");

  useEffect(() => {
    let cancelled = false;

    async function completeHubSession() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const csrfFromHash = hash.get("csrf");
      if (csrfFromHash) {
        persistCsrf(csrfFromHash);
      }

      try {
        const refreshed = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (refreshed.ok) {
          const body = (await refreshed.json()) as { csrf_token?: string };
          if (body.csrf_token) persistCsrf(body.csrf_token);
          if (!cancelled) router.replace("/dashboard");
          return;
        }
      } catch {
        /* try /auth/me next */
      }

      try {
        const me = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
        if (me.ok) {
          if (!cancelled) router.replace("/dashboard");
          return;
        }
      } catch {
        /* fall through to hub login */
      }

      if (!cancelled) {
        setMessage("No active clinician session. Redirecting to FedNutri-XAI login…");
        window.location.href = HUB_LOGIN_URL;
      }
    }

    void completeHubSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] p-6">
      <p className="text-sm text-[#64748b]">{message}</p>
    </div>
  );
}
