"use client";

import { Baby } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHILD_MODEL_NEUTRAL, riskAccentColor, riskGlowOpacity, riskRingProgress } from "./ChildModel";

export function ChildProgressFigure({
  riskIntensity = 0.5,
  reducedMotion = false,
  neutral = CHILD_MODEL_NEUTRAL,
  compact = false,
}: {
  riskIntensity?: number;
  reducedMotion?: boolean;
  neutral?: boolean;
  compact?: boolean;
}) {
  const risk = riskIntensity ?? 0.5;
  const accent = riskAccentColor(risk, neutral);
  const glow = riskGlowOpacity(risk, neutral);
  const ring = riskRingProgress(risk);
  const size = compact ? 168 : 220;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * ring;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center px-4 py-6",
        !reducedMotion && "animate-[hud-breathe_8s_ease-in-out_infinite]",
      )}
      role="img"
      aria-label="Child progress figure. Visual metaphor for nutritional risk progress, not anatomical imaging."
    >
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div
          className="absolute inset-4 rounded-full blur-2xl"
          style={{ backgroundColor: accent, opacity: glow }}
          aria-hidden
        />
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="relative z-[1]"
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="6"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            opacity={0.9}
          />
        </svg>
        <div
          className={cn(
            "absolute z-[2] flex items-center justify-center rounded-full border bg-white shadow-sm",
            compact ? "h-20 w-20 border-[#e2eaf3]" : "h-24 w-24 border-[#dbe6f0]",
          )}
        >
          <Baby
            className={cn(compact ? "h-10 w-10" : "h-12 w-12")}
            style={{ color: accent }}
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
      </div>
      <p className="mt-4 max-w-[14rem] text-center text-[11px] leading-relaxed text-[#64748b]">
        Visual progress metaphor · not anatomical imaging
      </p>
    </div>
  );
}
