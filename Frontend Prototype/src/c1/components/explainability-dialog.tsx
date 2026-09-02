"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import type { ChildProfile } from "@/lib/child-profile";
import { cn, formatPercent, formatStatus } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PredictionExplanationPanel,
  type PredictionExplanation,
} from "@/components/prediction-explanation-panel";

type AssessmentPreview = {
  status?: string | null;
  severity?: string | null;
  risk?: number | null;
};

function visitExplanation(profile: ChildProfile, visitId?: string | null): PredictionExplanation | null {
  if (!visitId) return null;
  const visit = profile.visits.find((v) => v.id === visitId);
  return (visit?.explanation as PredictionExplanation | null | undefined) ?? null;
}

export function ExplainabilityTrigger({
  profile,
  visitId,
  assessment,
  explanation,
  label = "Why this assessment?",
  className,
  prominent = false,
  disabled,
}: {
  profile: ChildProfile;
  visitId?: string | null;
  assessment?: AssessmentPreview | null;
  explanation?: PredictionExplanation | null;
  label?: string;
  className?: string;
  prominent?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const effectiveVisitId = visitId ?? profile.current?.id;
  const effectiveAssessment =
    assessment ??
    (visitId && visitId !== profile.current?.id
      ? profile.visits.find((v) => v.id === visitId)?.prediction
      : profile.current?.prediction);
  const embeddedExplanation = explanation ?? visitExplanation(profile, effectiveVisitId);

  if (prominent) {
    return (
      <>
        <Button
          type="button"
          variant="secondary"
          className={cn("h-9 rounded-xl text-xs font-semibold", className)}
          onClick={() => setOpen(true)}
          disabled={disabled || !effectiveVisitId}
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
          {label}
        </Button>
        <ExplainabilityDialog
          profile={profile}
          visitId={effectiveVisitId}
          assessment={effectiveAssessment}
          explanation={embeddedExplanation}
          open={open}
          onClose={() => setOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "shrink-0 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-[#0f2744] hover:bg-[#f8fafc]",
          className,
        )}
        onClick={() => setOpen(true)}
        disabled={disabled || !effectiveVisitId}
      >
        {label}
      </button>
      <ExplainabilityDialog
        profile={profile}
        visitId={effectiveVisitId}
        assessment={effectiveAssessment}
        explanation={embeddedExplanation}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export function ExplainabilityDialog({
  profile,
  visitId,
  assessment,
  explanation: initialExplanation,
  open,
  onClose,
}: {
  profile: ChildProfile;
  visitId?: string | null;
  assessment?: AssessmentPreview | null;
  explanation?: PredictionExplanation | null;
  open: boolean;
  onClose: () => void;
}) {
  const effectiveVisitId = visitId ?? profile.current?.id;
  const prediction =
    assessment ??
    (visitId && visitId !== profile.current?.id
      ? profile.visits.find((v) => v.id === visitId)?.prediction
      : profile.current?.prediction);
  const embeddedExplanation = initialExplanation ?? visitExplanation(profile, effectiveVisitId);

  const explanationQuery = useQuery({
    queryKey: ["prediction-explanation", effectiveVisitId],
    queryFn: () => api<PredictionExplanation>(`/visits/${effectiveVisitId}/prediction/explanation`),
    enabled: open && Boolean(effectiveVisitId) && !embeddedExplanation,
    retry: false,
  });

  const explanation = embeddedExplanation ?? explanationQuery.data ?? null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        type="button"
        className="absolute inset-0 bg-[#0A2748]/40 backdrop-blur-md"
        aria-label="Close explanation dialog"
        onClick={onClose}
      />
      <div className="relative flex min-h-full items-start justify-center px-4 py-10 sm:items-center sm:px-6 sm:py-12">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="explainability-title"
          className="relative w-full max-w-3xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-lg p-2 text-[#64748b] hover:bg-white hover:text-[#0A2748]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="overflow-hidden rounded-2xl border border-[#e4ecf4] bg-white shadow-[0_24px_64px_-28px_rgba(10,39,72,0.45)]">
            <div className="border-b border-[#e4ecf4] bg-[#f7f9fc] px-6 py-5 pr-14">
              <h2 id="explainability-title" className="text-xl font-bold text-[#0f2744]">
                Why this assessment?
              </h2>
              <p className="mt-1 text-sm text-[#64748b]">
                Plain-language explanation of the recorded inputs that influenced this AI-assisted assessment.
              </p>
            </div>

            <div className="max-h-[min(70vh,36rem)] space-y-5 overflow-y-auto px-6 py-5">
              <section className="rounded-xl border border-[#e8eef5] bg-[#f8fafc] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Assessment reviewed</p>
                <p className="mt-1 text-sm font-medium text-[#0f2744]">
                  {prediction?.status ? formatStatus(prediction.status) : "—"}
                  {prediction?.severity && prediction.severity !== "none" ? ` · ${formatStatus(prediction.severity)}` : ""}
                  {prediction?.risk != null ? ` · ${formatPercent(prediction.risk)}` : ""}
                </p>
              </section>

              {!effectiveVisitId ? (
                <p className="text-sm text-[#64748b]">No visit with a prediction is available for explanation.</p>
              ) : null}

              {!explanation && explanationQuery.isLoading ? (
                <p className="text-sm text-[#64748b]">Preparing explanation from visit inputs…</p>
              ) : null}
              {!explanation && explanationQuery.isError ? (
                <p className="text-sm text-clinical-danger">
                  Could not load the explanation. Rebuild the API container with{" "}
                  <code className="rounded bg-[#f1f5f9] px-1">docker compose up -d --build api</code>, then refresh
                  this page.
                </p>
              ) : null}
              {explanation ? <PredictionExplanationPanel explanation={explanation} /> : null}

              <details className="rounded-xl border border-dashed border-[#e8eef5] bg-white px-4 py-3 text-sm">
                <summary className="cursor-pointer font-medium text-[#475569]">Advanced explainability (Component 2)</summary>
                <p className="mt-2 text-xs leading-relaxed text-[#64748b]">
                  SHAP values, feature-attribution charts, and clinical trust analysis are owned by Component 2 when that
                  service is connected. This Component 1 view explains the assessment using the actual visit fields you
                  recorded — not synthetic attributions.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Inline summary card shown on the main profile overview. */
export function PredictionExplanationSummary({
  visitId,
  assessment,
  explanation: initialExplanation,
}: {
  visitId: string;
  assessment?: AssessmentPreview | null;
  explanation?: PredictionExplanation | null;
}) {
  const explanationQuery = useQuery({
    queryKey: ["prediction-explanation-inline", visitId],
    queryFn: () => api<PredictionExplanation>(`/visits/${visitId}/prediction/explanation`),
    enabled: Boolean(visitId) && !initialExplanation,
    staleTime: 60_000,
    retry: false,
  });

  const explanation = initialExplanation ?? explanationQuery.data ?? null;

  if (!visitId) return null;

  if (!explanation && explanationQuery.isLoading) {
    return (
      <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#64748b]">
        Loading assessment explanation…
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  const topFactors = explanation.factors.filter((f) => f.direction === "increases_concern").slice(0, 3);

  return (
    <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3" data-testid="prediction-explanation-summary">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#1e40af]">Why this assessment?</p>
      <p className="mt-2 text-sm font-medium leading-relaxed text-[#0f2744]">{explanation.headline}</p>
      {topFactors.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[#475569]">
          {topFactors.map((f) => (
            <li key={f.label}>• {f.label}</li>
          ))}
        </ul>
      ) : null}
      {assessment?.status ? (
        <p className="mt-2 text-[11px] text-[#64748b]">
          Based on visit inputs for {formatStatus(assessment.status)}
          {assessment.risk != null ? ` · ${formatPercent(assessment.risk)}` : ""}
        </p>
      ) : null}
    </div>
  );
}
