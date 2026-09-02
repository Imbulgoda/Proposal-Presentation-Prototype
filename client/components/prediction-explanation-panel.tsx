"use client";

import { cn, formatStatus } from "@/lib/utils";
import { AlertCircle, ArrowDown, ArrowUp, Minus } from "lucide-react";

export type PredictionExplanation = {
  owner: string;
  kind: string;
  is_shap: boolean;
  headline: string;
  summary: string;
  assessment: {
    status: string;
    severity: string;
    score: number;
    score_label: string;
    score_is_probability: boolean;
  };
  factors: {
    label: string;
    detail: string;
    modality: string;
    direction: "increases_concern" | "decreases_concern" | "neutral" | string;
    weight: number;
  }[];
  limitations: string[];
  disclaimer: string;
  advanced_explainability_owner?: string;
  advanced_explainability_note?: string;
};

const MODALITY_LABELS: Record<string, string> = {
  anthropometric: "Child measurements",
  socioeconomic: "Household & mother",
  dietary: "Dietary & feeding",
  external_context: "National context",
  maternal_child_health: "Maternal / child health",
};

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === "increases_concern") {
    return <ArrowUp className="h-4 w-4 text-clinical-danger" aria-hidden />;
  }
  if (direction === "decreases_concern") {
    return <ArrowDown className="h-4 w-4 text-emerald-600" aria-hidden />;
  }
  return <Minus className="h-4 w-4 text-[#64748b]" aria-hidden />;
}

function directionLabel(direction: string): string {
  if (direction === "increases_concern") return "Increased model concern";
  if (direction === "decreases_concern") return "Lowered model concern";
  return "Context";
}

export function PredictionExplanationPanel({
  explanation,
  compact = false,
  className,
}: {
  explanation: PredictionExplanation;
  compact?: boolean;
  className?: string;
}) {
  const concernFactors = explanation.factors.filter((f) => f.direction === "increases_concern");
  const otherFactors = explanation.factors.filter((f) => f.direction !== "increases_concern");

  return (
    <div className={cn("space-y-4", className)} data-testid="prediction-explanation">
      <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1e40af]">Why this assessment?</p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-[#0f2744]">{explanation.headline}</p>
        <p className="mt-2 text-sm leading-relaxed text-[#475569]">{explanation.summary}</p>
      </div>

      {!compact && concernFactors.length > 0 ? (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Main reasons the model raised concern</p>
          <ul className="space-y-2">
            {concernFactors.map((factor) => (
              <li
                key={`${factor.modality}-${factor.label}`}
                className="flex gap-3 rounded-xl border border-[#e8eef5] bg-white px-3 py-3"
              >
                <DirectionIcon direction={factor.direction} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[#0f2744]">{factor.label}</p>
                    <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#64748b]">
                      {MODALITY_LABELS[factor.modality] ?? formatStatus(factor.modality)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#475569]">{factor.detail}</p>
                  <p className="mt-1 text-[11px] text-[#94a3b8]">{directionLabel(factor.direction)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!compact && otherFactors.length > 0 ? (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Other contributing inputs</p>
          <ul className="space-y-2">
            {otherFactors.map((factor) => (
              <li
                key={`${factor.modality}-${factor.label}-other`}
                className="flex gap-3 rounded-xl bg-[#f8fafc] px-3 py-2.5 ring-1 ring-[#e8eef5]"
              >
                <DirectionIcon direction={factor.direction} />
                <div>
                  <p className="text-sm font-medium text-[#0f2744]">{factor.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#64748b]">{factor.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {explanation.limitations.length > 0 ? (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{explanation.limitations.join(" ")}</p>
        </div>
      ) : null}

      <p className="text-[11px] leading-relaxed text-[#64748b]">{explanation.disclaimer}</p>
    </div>
  );
}
