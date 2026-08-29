"use client";

import { useEffect, useState } from "react";
import { ChildProgressFigure } from "./ChildProgressFigure";

export function ChildModelViewer({
  riskIntensity,
  className = "",
  darkStage = false,
  compact = false,
  neutral = false,
}: {
  riskIntensity?: number | null;
  className?: string;
  darkStage?: boolean;
  compact?: boolean;
  neutral?: boolean;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const risk = riskIntensity ?? 0.5;

  return (
    <section
      className={`relative flex h-full min-h-0 flex-col ${className} ${darkStage ? "text-slate-200" : ""}`}
      aria-hidden
    >
      <div className={`relative h-full min-h-[inherit] flex-1 overflow-hidden ${compact ? "rounded-xl" : "rounded-2xl"}`}>
        <ChildProgressFigure
          riskIntensity={risk}
          reducedMotion={reducedMotion}
          neutral={neutral}
          compact={compact}
        />
      </div>
    </section>
  );
}
