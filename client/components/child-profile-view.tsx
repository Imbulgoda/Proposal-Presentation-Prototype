"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ClipboardList,
  FileText,
  Info,
  Minus,
  X,
} from "lucide-react";
import { ChildModelHud } from "@/components/child-model-hud";
import { ChildModelViewer } from "@/components/child-model/ChildModelViewer";
import { LatentTrajectory, TrendChart, type TrendMetric } from "@/components/child-profile-charts";
import { ExplainabilityTrigger, PredictionExplanationSummary } from "@/components/explainability-dialog";
import type { PredictionExplanation } from "@/components/prediction-explanation-panel";
import { FollowUpSchedulePanel } from "@/components/follow-up-schedule-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { api } from "@/lib/api";
import {
  architectureLabel,
  ageMonthsAtVisit,
  alertTone,
  emptyAssessmentMessage,
  formatPp,
  formatRv,
  openAlert,
  probabilitySeries,
  progressLabel,
  reviewLabel,
  visitProbabilityDeltaPp,
  riskVelocityPpMonth,
  type ChildProfile,
  type ProfileTab,
} from "@/lib/child-profile";
import { cn, formatClinicalDate, formatPercent, formatStatus } from "@/lib/utils";
import { getModelOutputDisplayMetadata } from "@/lib/model-display";

function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="rounded-full p-0.5 text-[#94a3b8] hover:text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0e3a67]"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <span role="tooltip" className="absolute left-0 top-6 z-20 w-64 rounded-xl border border-line bg-white p-3 text-xs leading-relaxed text-[#475569] shadow-card">
          {text}
        </span>
      ) : null}
    </span>
  );
}

function ProgressGlyph({ state }: { state?: string | null }) {
  if (state === "improving") return <ArrowUpRight className="h-4 w-4 text-clinical-ok" aria-hidden />;
  if (state === "deteriorating") return <ArrowDownRight className="h-4 w-4 text-clinical-danger" aria-hidden />;
  if (state === "stagnating") return <ArrowRight className="h-4 w-4 text-clinical-warning" aria-hidden />;
  return <Minus className="h-4 w-4 text-[#64748b]" aria-hidden />;
}

function pillClass(selected: boolean, size: "sm" | "md" = "md") {
  return cn(
    "rounded-full border transition",
    size === "md" ? "px-3.5 py-1.5 text-sm" : "px-3 py-1.5 text-xs",
    selected
      ? "border-navy-800 bg-navy-50 font-medium text-navy-900 shadow-sm"
      : "border-line bg-white text-[#475569] hover:bg-[#f8fafc]",
  );
}

function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]", className)}>{children}</p>;
}

function ProfileIdentityHeader({
  profile,
  latestAssessment,
}: {
  profile: ChildProfile;
  latestAssessment?: string | null;
}) {
  const facts = [
    { label: "Child ID", value: profile.pseudonymous_id },
    { label: "Age / Sex", value: `${profile.age_months} mo · ${formatStatus(profile.sex)}` },
    profile.facility?.name || profile.facility?.code
      ? { label: "Clinic", value: profile.facility.name || profile.facility.code }
      : null,
    latestAssessment ? { label: "Latest assessment", value: latestAssessment } : { label: "Latest assessment", value: "None recorded" },
    { label: "Assessments", value: String(profile.assessment_count ?? profile.visits.length) },
  ].filter((item): item is { label: string; value: string } => item != null);

  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-3.5 shadow-card sm:px-6">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-0">
        {facts.map((fact, index) => (
          <div
            key={fact.label}
            className={cn(
              "min-w-0 lg:px-5",
              index > 0 && "lg:border-l lg:border-[#e4ecf4]",
              index === 0 && "lg:pl-0",
              index === facts.length - 1 && "lg:pr-0",
            )}
          >
            <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#94a3b8]">{fact.label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold leading-snug text-navy-900" title={fact.value}>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
  action,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#f8fafc] px-4 py-3 ring-1 ring-line/70">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>{label}</FieldLabel>
        {action}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums leading-tight text-[#0f2744]">{value}</div>
      {hint ? <p className="mt-0.5 text-xs text-[#64748b]">{hint}</p> : null}
    </div>
  );
}

function Section({
  id,
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  id?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section id={id} className={cn("rounded-2xl border border-line bg-white shadow-card", className)}>
      {title != null || actions != null ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title != null ? <h2 className="text-base font-semibold tracking-tight text-[#0f2744]">{title}</h2> : null}
            {subtitle != null ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function ChildProfileView({
  profile,
  tab,
  onTab,
  justRegistered,
  onDismissRegistered,
  onSaveReview,
  reviewSaving,
  onAddNote,
  noteSaving,
  onAcknowledge,
}: {
  profile: ChildProfile;
  tab: ProfileTab;
  onTab: (tab: ProfileTab) => void;
  justRegistered?: boolean;
  onDismissRegistered?: () => void;
  onSaveReview: (payload: { assessment: string; workflow: string; note: string }) => void;
  reviewSaving?: boolean;
  onAddNote: (body: string) => void;
  noteSaving?: boolean;
  onAcknowledge?: (id: string) => void;
}) {
  const hasBaseline = profile.has_baseline ?? profile.visits.length > 0;
  const alert = openAlert(profile);
  const comparable = profile.longitudinal_comparable !== false;
  const series = useMemo(() => probabilitySeries(profile), [profile]);
  const [metric, setMetric] = useState<TrendMetric>("probability");
  const [qualityOpen, setQualityOpen] = useState(false);
  const [inputsOpen, setInputsOpen] = useState(false);

  const weightHist = series.map((s) => s.weight).filter((v): v is number => v != null);
  const heightHist = series.map((s) => s.height).filter((v): v is number => v != null);
  const muacHist = series.map((s) => s.muac).filter((v): v is number => v != null);

  return (
    <div className="space-y-4 pb-6">
      <header>
        <h1 className="sr-only">{profile.pseudonymous_id}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {tab !== "overview" ? (
              <button
                type="button"
                onClick={() => onTab("overview")}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm font-medium text-[#0f2744] hover:bg-[#f8fafc]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Go back
              </button>
            ) : null}
            <h2 className="text-2xl font-semibold text-[#0f2744]">Progress Tracking</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/children/${profile.id}/report`}>
              <Button variant="secondary" className="h-10 rounded-xl">
                <FileText className="h-4 w-4" /> Export Summary
              </Button>
            </Link>
            <Link href={`/children/${profile.id}/visits/new`}>
              <Button className="h-11 rounded-xl px-5 text-base">
                <ClipboardList className="h-5 w-5" /> {hasBaseline ? "Record Visit" : "Start Baseline Assessment"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {justRegistered ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950">
          <p className="font-semibold">Child registered successfully.</p>
          <p className="mt-1">No nutritional assessment has been recorded yet.</p>
          <Button variant="secondary" className="mt-3 h-9 rounded-xl text-xs" onClick={onDismissRegistered}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {tab === "overview" ? (
        <div id="profile-panel-overview" role="tabpanel" aria-labelledby="profile-tab-overview">
          <Overview
            profile={profile}
            hasBaseline={hasBaseline}
            alert={alert}
            comparable={comparable}
            series={series}
            weightHist={weightHist}
            heightHist={heightHist}
            muacHist={muacHist}
            onSaveReview={onSaveReview}
            reviewSaving={reviewSaving}
            onAcknowledge={onAcknowledge}
            onTab={onTab}
          />
        </div>
      ) : null}

      {tab === "visits" ? (
        <div id="profile-panel-visits" role="tabpanel" aria-labelledby="profile-tab-visits">
          <VisitsTab profile={profile} />
        </div>
      ) : null}

      {tab === "progress" ? (
        <div id="profile-panel-progress" role="tabpanel" aria-labelledby="profile-tab-progress">
          <ProgressTab
            profile={profile}
            comparable={comparable}
            series={series}
            metric={metric}
            setMetric={setMetric}
          />
        </div>
      ) : null}

      {tab === "notes" ? (
        <div id="profile-panel-notes" role="tabpanel" aria-labelledby="profile-tab-notes">
          <NotesTab profile={profile} onAddNote={onAddNote} noteSaving={noteSaving} />
        </div>
      ) : null}

      {tab === "ai" ? (
        <div id="profile-panel-ai" role="tabpanel" aria-labelledby="profile-tab-ai">
          <AiDetailsTab profile={profile} inputsOpen={inputsOpen} setInputsOpen={setInputsOpen} qualityOpen={qualityOpen} setQualityOpen={setQualityOpen} />
        </div>
      ) : null}
    </div>
  );
}

function Overview({
  profile,
  hasBaseline,
  alert,
  comparable,
  series,
  weightHist,
  heightHist,
  muacHist,
  onSaveReview,
  reviewSaving,
  onAcknowledge,
  onTab,
}: {
  profile: ChildProfile;
  hasBaseline: boolean;
  alert: ReturnType<typeof openAlert>;
  comparable: boolean;
  series: ReturnType<typeof probabilitySeries>;
  weightHist: number[];
  heightHist: number[];
  muacHist: number[];
  onSaveReview: (payload: { assessment: string; workflow: string; note: string }) => void;
  reviewSaving?: boolean;
  onAcknowledge?: (id: string) => void;
  onTab: (tab: ProfileTab) => void;
}) {
  const semantics = getModelOutputDisplayMetadata(profile);
  const visits = profile.visits;
  const latestVisitId = profile.current?.id ?? visits.at(-1)?.id ?? "";
  const [selectedVisitId, setSelectedVisitId] = useState(latestVisitId);

  useEffect(() => {
    setSelectedVisitId(profile.current?.id ?? profile.visits.at(-1)?.id ?? "");
  }, [profile.id, profile.current?.id]);

  const selected = visits.find((v) => v.id === selectedVisitId) ?? visits.at(-1);
  const selectedIndex = selected ? visits.findIndex((v) => v.id === selected.id) : -1;
  const prior = selectedIndex > 0 ? visits[selectedIndex - 1] : undefined;
  const pred = selected?.prediction;
  const prevPred = prior?.prediction;
  const meas = selected?.measurements;
  const prevMeas = prior?.measurements;
  const isLatest = Boolean(selected && selected.id === latestVisitId);
  const change = comparable
    ? isLatest
      ? profile.risk_change_pp
      : visitProbabilityDeltaPp(pred?.risk ?? null, prevPred?.risk ?? null)
    : null;
  const ageAtVisit = ageMonthsAtVisit(profile.date_of_birth, selected?.visit_date, profile.age_months);
  const visitProgress = isLatest ? profile.progress_display : selected?.progress;
  const visitRv = isLatest ? profile.risk_velocity_pp_month : comparable ? riskVelocityPpMonth(selected?.risk_velocity ?? null) : null;
  const tone = alert ? alertTone(alert.type) : "amber";

  if (!hasBaseline) {
    return (
      <Section title="Baseline assessment">
        <p className="font-semibold text-[#0f2744]">{emptyAssessmentMessage(false)}</p>
        <p className="mt-1 text-sm text-[#64748b]">Complete the first nutritional assessment to establish the baseline profile.</p>
        <Link href={`/children/${profile.id}/visits/new`} className="mt-4 inline-block">
          <Button>Start Baseline Assessment</Button>
        </Link>
      </Section>
    );
  }

  return (
    <div className="space-y-4">
      <ProfileIdentityHeader
        profile={profile}
        latestAssessment={profile.current ? formatClinicalDate(profile.current.visit_date) : null}
      />

      {alert ? (
        <section
          id="clinical-attention"
          className={cn(
            "rounded-2xl border px-5 py-4 shadow-card",
            tone === "red" ? "border-red-200/80 bg-red-50/70" : "border-amber-200/80 bg-amber-50/80",
          )}
        >
          <p className={cn("flex items-center gap-2 text-sm font-semibold", tone === "red" ? "text-red-950" : "text-amber-950")}>
            <AlertTriangle className="h-4 w-4" />
            {alert.headline ?? formatStatus(alert.type)}
            <span className="rounded-md bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[#475569]">
              {formatStatus(alert.status)}
            </span>
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[#3f3f46]">{alert.message}</p>
          {alert.trigger_value?.previous_risk != null && alert.trigger_value?.current_risk != null ? (
            <p className="mt-1 text-sm text-[#3f3f46]">
              Model score changed from {formatPercent(alert.trigger_value.previous_risk)} to{" "}
              {formatPercent(alert.trigger_value.current_risk)} since the previous assessment.
            </p>
          ) : null}
          <p className="mt-2 text-sm">
            Current longitudinal state: <strong>{progressLabel(profile.progress_display, comparable)}</strong>
          </p>
          <p className="mt-1 text-sm">Clinical review recommended.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="#clinician-review">
              <Button className="h-9 rounded-xl text-xs">Review Assessment</Button>
            </a>
            {onAcknowledge && alert.status === "OPEN" ? (
              <Button variant="secondary" className="h-9 rounded-xl text-xs" onClick={() => onAcknowledge(alert.id)}>
                Acknowledge
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {profile.model_warning && comparable === false ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">{profile.model_warning}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section id="clinical-snapshot" title="Current Clinical Measurements" subtitle="Visit measurements with previous values and change.">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricTile
              label="Weight"
              value={meas?.weight_kg != null ? `${meas.weight_kg.toFixed(1)} kg` : "—"}
              hint={
                prevMeas?.weight_kg != null
                  ? `Previous ${prevMeas.weight_kg.toFixed(1)} kg${
                      measurementDeltaLabel(meas?.weight_kg, prevMeas.weight_kg, "kg")
                        ? ` · ${measurementDeltaLabel(meas?.weight_kg, prevMeas.weight_kg, "kg")}`
                        : ""
                    }`
                  : "No previous weight"
              }
            />
            <MetricTile
              label="Height"
              value={meas?.height_cm != null ? `${meas.height_cm.toFixed(1)} cm` : "—"}
              hint={
                prevMeas?.height_cm != null
                  ? `Previous ${prevMeas.height_cm.toFixed(1)} cm${
                      measurementDeltaLabel(meas?.height_cm, prevMeas.height_cm, "cm")
                        ? ` · ${measurementDeltaLabel(meas?.height_cm, prevMeas.height_cm, "cm")}`
                        : ""
                    }`
                  : "No previous height"
              }
            />
            <MetricTile
              label="MUAC"
              value={meas?.muac_cm != null ? `${meas.muac_cm.toFixed(1)} cm` : "—"}
              hint={
                prevMeas?.muac_cm != null
                  ? `Previous ${prevMeas.muac_cm.toFixed(1)} cm${
                      measurementDeltaLabel(meas?.muac_cm, prevMeas.muac_cm, "cm")
                        ? ` · ${measurementDeltaLabel(meas?.muac_cm, prevMeas.muac_cm, "cm")}`
                        : ""
                    }`
                  : "No previous MUAC"
              }
            />
          </div>
          <p className="mt-3 text-xs text-[#64748b]">
            Assessment date: {selected ? formatClinicalDate(selected.visit_date) : "—"}
            {ageAtVisit != null ? ` · Age at visit: ${ageAtVisit} months` : ""}
          </p>
        </Section>

        <Section
          id="ai-assessment"
          title="AI-Assisted Assessment"
          subtitle="Model-assessed status for the selected visit. Measurements are shown above."
          actions={
            pred && selected?.id ? (
              <ExplainabilityTrigger
                profile={profile}
                visitId={selected.id}
                assessment={pred}
                prominent
                label="Why this assessment?"
              />
            ) : null
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile label="Nutritional status" value={pred?.status ? formatStatus(pred.status) : "—"} hint={pred?.severity ? `Severity: ${formatStatus(pred.severity)}` : undefined} />
            <MetricTile
              label={semantics.score_label}
              value={formatPercent(pred?.risk)}
              hint={
                comparable && prevPred?.risk != null
                  ? `Previous ${formatPercent(prevPred.risk)}${change != null ? ` · ${formatPp(change)}` : ""}`
                  : semantics.score_description
              }
              action={<InfoTip label={`About ${semantics.score_label}`} text={semantics.score_description} />}
            />
            <MetricTile
              label="Confidence"
              value={pred?.confidence ? formatStatus(pred.confidence) : "—"}
            />
            <MetricTile
              label="Data quality"
              value={profile.data_quality_label ? formatStatus(profile.data_quality_label) : "—"}
            />
          </div>
          {pred && selected?.id ? (
            <div className="mt-4">
              <PredictionExplanationSummary
                visitId={selected.id}
                assessment={pred}
                explanation={selected.explanation as PredictionExplanation | null}
              />
            </div>
          ) : null}
        </Section>
      </div>

      <section id="patient-stage" className="clinical-twin-panel relative overflow-hidden rounded-2xl">
        <div className="px-4 pb-5 pt-4 sm:px-5">
          <ChildModelHud
            compact
            childId={profile.pseudonymous_id}
            weight={meas?.weight_kg}
            height={meas?.height_cm}
            muac={meas?.muac_cm}
            previousWeight={prevMeas?.weight_kg}
            previousHeight={prevMeas?.height_cm}
            previousMuac={prevMeas?.muac_cm}
            weightHistory={weightHist}
            heightHistory={heightHist}
            muacHistory={muacHist}
            probabilityHistory={series.map((s) => s.probability)}
            ageMonths={ageAtVisit}
            latestAssessment={selected ? formatClinicalDate(selected.visit_date) : null}
            assessmentLabel={isLatest ? "Latest assessment date" : "Assessment date"}
            status={pred?.status ? formatStatus(pred.status) : "—"}
            severity={pred?.severity ? formatStatus(pred.severity) : "—"}
            probability={formatPercent(pred?.risk)}
            previousProbability={comparable && prevPred?.risk != null ? formatPercent(prevPred.risk) : null}
            probabilityChange={comparable ? change : null}
            progress={progressLabel(visitProgress, comparable)}
            riskVelocity={formatRv(visitRv, comparable)}
            scoreLabel={semantics.score_label}
            scoreTip={semantics.score_description}
            velocityLabel={semantics.velocity_label}
            velocityTip={semantics.velocity_description}
            stageFooter={
              visits.length > 0 ? (
                <div
                  className="inline-flex max-w-full flex-wrap justify-center rounded-lg bg-[#f4f7fb] p-1 ring-1 ring-[#e2eaf3]"
                  role="tablist"
                  aria-label="Visit timeline"
                >
                  {visits.map((v) => {
                    const selectedVisit = v.id === selected?.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        role="tab"
                        aria-selected={selectedVisit}
                        title={`${formatClinicalDate(v.visit_date)}${v.prediction?.status ? ` · ${formatStatus(v.prediction.status)}` : ""}`}
                        onClick={() => setSelectedVisitId(v.id)}
                        className={cn(
                          "rounded-lg px-5 py-2.5 text-base transition",
                          selectedVisit
                            ? "bg-[#0E3A67] font-medium text-white shadow-sm"
                            : "text-[#475569] hover:bg-white/90 hover:text-[#0A2748]",
                        )}
                      >
                        Visit {v.visit_number}
                      </button>
                    );
                  })}
                </div>
              ) : null
            }
          >
            <ChildModelViewer className="h-full min-h-[320px] md:min-h-[480px]" riskIntensity={pred?.risk} />
            <span className="sr-only">
              Child progress figure with connected clinical measurements. Visual metaphor for progress only, not anatomical imaging.
            </span>
          </ChildModelHud>
        </div>
      </section>

      <Section
        id="longitudinal-progress"
        title="Longitudinal progress"
        subtitle={`${semantics.score_label} across completed assessments.`}
        actions={
          <p className="flex items-center gap-1.5 rounded-full bg-[#f8fafc] px-3 py-1 text-sm font-medium text-[#0f2744] ring-1 ring-line">
            <ProgressGlyph state={profile.progress_display} />
            {progressLabel(profile.progress_display, comparable)}
          </p>
        }
      >
        <TrendChart
          data={series}
          metric="probability"
          comparable={comparable}
          scoreLabel={semantics.score_label}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricTile
            label={semantics.velocity_label}
            value={formatRv(profile.risk_velocity_pp_month, comparable)}
            action={<InfoTip label={`About ${semantics.velocity_label.toLowerCase()}`} text={semantics.velocity_description} />}
          />
          <MetricTile
            label="Since baseline"
            value={comparable ? formatPp(profile.since_baseline_pp) : "Not available"}
          />
          <div className="flex items-end">
            <button type="button" className="text-sm font-medium text-[#2563eb]" onClick={() => onTab("progress")}>
              Weight, height and MUAC trends →
            </button>
          </div>
        </div>
      </Section>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Section
          id="clinician-review"
          className="scroll-mt-20"
          title="Clinician review"
          subtitle="Stored independently of the AI prediction."
        >
          <FieldLabel>Review status</FieldLabel>
          <p className="mt-1 font-semibold text-[#0f2744]">
            {reviewLabel(isLatest ? profile.clinician_review?.status : selected?.review_status)}
          </p>
          <p className="mt-2 text-sm text-[#475569]">
            {pred?.status ? formatStatus(pred.status) : "—"}
            {pred?.severity ? ` · ${formatStatus(pred.severity)}` : ""} {formatPercent(pred?.risk)}
          </p>
          {isLatest &&
          (profile.clinician_review?.status === "REVIEWED" ||
            profile.clinician_review?.status === "DISAGREED" ||
            profile.clinician_review?.status === "FURTHER_ASSESSMENT") ? (
            <div className="mt-3 space-y-1 text-sm">
              <p>Reviewed by {profile.clinician_review.reviewer_name ?? "clinician"}</p>
              {profile.clinician_review.created_at ? (
                <p className="text-xs text-[#64748b]">{formatClinicalDate(profile.clinician_review.created_at)}</p>
              ) : null}
              <p>Assessment: {profile.clinician_review.assessment}</p>
              {profile.clinician_review.note_excerpt ? <p className="text-[#475569]">{profile.clinician_review.note_excerpt}</p> : null}
            </div>
          ) : isLatest ? (
            <ReviewForm onSave={onSaveReview} saving={reviewSaving} />
          ) : (
            <p className="mt-3 text-sm text-[#64748b]">Review actions apply to the latest visit.</p>
          )}
          {isLatest ? <C3ReassessmentPanel childId={profile.id} /> : null}
        </Section>

        <Section
          id="follow-up"
          title={
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {overdueFollowUp(profile) ? "Follow-up overdue" : "Next follow-up"}
            </span>
          }
        >
          <FollowUpBody profile={profile} />
        </Section>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Section
          id="assessment-history"
          title="Assessment history"
          subtitle="Chronological visits. Nutritional status is separate from review state."
          actions={
            <button type="button" className="text-sm font-medium text-[#2563eb]" onClick={() => onTab("visits")}>
              Full visit record →
            </button>
          }
          bodyClassName="px-0 py-0"
          className="h-full"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-[#f8fafc] text-[#64748b]">
                  <th className="px-5 py-2.5 font-medium">Visit</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Probability</th>
                  <th className="px-5 py-2.5 font-medium">Review</th>
                </tr>
              </thead>
              <tbody>
                {[...profile.visits].reverse().map((v) => (
                  <tr
                    key={v.id}
                    className={cn(
                      "border-b border-line/70 last:border-0",
                      v.id === selected?.id ? "bg-navy-50" : "hover:bg-[#f8fafc]",
                    )}
                  >
                    <td className="px-5 py-2.5">
                      <button type="button" className="font-medium text-[#0f2744] hover:text-[#2563eb]" onClick={() => setSelectedVisitId(v.id)}>
                        V{v.visit_number} · {formatClinicalDate(v.visit_date)}
                      </button>
                    </td>
                    <td className="px-5 py-2.5 text-[#475569]">
                      {v.prediction?.status ? formatStatus(v.prediction.status) : "—"}
                      {v.prediction?.severity && v.prediction.severity !== "none" ? ` · ${formatStatus(v.prediction.severity)}` : ""}
                    </td>
                    <td className="px-5 py-2.5 tabular-nums">{v.prediction?.risk != null ? formatPercent(v.prediction.risk) : "—"}</td>
                    <td className="px-5 py-2.5 text-xs text-[#64748b]">
                      {v.review_status === "AWAITING_REVIEW" ? (
                        <button
                          type="button"
                          className="rounded-lg bg-[#0E3A67] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#0A2748]"
                          onClick={() => {
                            setSelectedVisitId(v.id);
                            window.requestAnimationFrame(() => {
                              document.getElementById("clinician-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
                            });
                          }}
                        >
                          Awaiting review
                        </button>
                      ) : (
                        reviewLabel(v.review_status)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <AdvancedAiSummary profile={profile} comparable={comparable} series={series} onTab={onTab} />
      </div>
    </div>
  );
}

function measurementDeltaLabel(current?: number | null, previous?: number | null, unit = ""): string | null {
  if (current == null || previous == null) return null;
  const d = Math.round((current - previous) * 10) / 10;
  if (d === 0) return `Δ 0 ${unit}`.trim();
  return `Δ ${d > 0 ? "+" : ""}${d} ${unit}`.trim();
}

function AdvancedAiSummary({
  profile,
  comparable,
  series,
  onTab,
}: {
  profile: ChildProfile;
  comparable: boolean;
  series: ReturnType<typeof probabilitySeries>;
  onTab: (tab: ProfileTab) => void;
}) {
  const [trajectoryOpen, setTrajectoryOpen] = useState(false);
  const semantics = getModelOutputDisplayMetadata(profile);
  const m = profile.model;
  const isDemo = Boolean(profile.model_is_demo || m?.is_demo);
  const projectedCount = profile.visits.filter((v) => v.projection != null).length;
  const visitCount = profile.visits.length;
  const probabilityChain = series
    .filter((p) => p.probability != null)
    .map((p) => `${p.probability}%`)
    .join(" → ");
  const projectionVersion =
    profile.current?.projection_version ??
    [...profile.visits].reverse().find((v) => v.projection_version)?.projection_version ??
    semantics.projection_version ??
    null;

  useEffect(() => {
    if (!trajectoryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTrajectoryOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [trajectoryOpen]);

  return (
    <>
      <details
        id="advanced-ai"
        className="group flex h-full flex-col rounded-2xl border border-line bg-white shadow-card scroll-mt-20"
      >
        <summary className="cursor-pointer list-none px-5 py-3.5 marker:content-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="advanced-ai-heading" className="text-sm font-semibold text-[#0f2744]">
                Advanced AI &amp; Trajectory
              </h2>
              <p className="mt-0.5 text-sm text-[#64748b]">
                Secondary model metadata. Expand only when reviewing research trajectory details.
              </p>
            </div>
            <span className="shrink-0 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-[#0f2744] group-open:bg-[#f8fafc]">
              <span className="group-open:hidden">Expand</span>
              <span className="hidden group-open:inline">Collapse</span>
            </span>
          </div>
        </summary>

        <div className="flex flex-col gap-3 border-t border-line px-5 py-3.5" aria-labelledby="advanced-ai-heading">
        <header className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-[#0f2744] hover:bg-[#f8fafc]"
            onClick={() => setTrajectoryOpen(true)}
          >
            View trajectory
          </button>
          <ExplainabilityTrigger profile={profile} />
        </header>

        {isDemo || profile.synthetic_data ? (
          <p className="rounded-lg bg-[#f8fafc] px-3 py-2 text-xs text-[#475569] ring-1 ring-line/70">
            {profile.synthetic_data ? "Synthetic Demonstration Data · " : ""}
            {semantics.banner_title}: {semantics.banner_subtitle}
          </p>
        ) : null}

        {profile.model_warning ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">{profile.model_warning}</p>
        ) : null}

        {!comparable ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Longitudinal comparison unavailable. The active model or embedding space changed between assessments.
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#f8fafc] px-3 py-2.5 ring-1 ring-line/70">
            <FieldLabel>Active model</FieldLabel>
            <p className="mt-0.5 truncate font-mono text-xs font-medium text-[#0f2744]" title={m?.label ?? undefined}>
              {m?.label ?? "—"}
            </p>
          </div>
          <div className="rounded-xl bg-[#f8fafc] px-3 py-2.5 ring-1 ring-line/70">
            <FieldLabel>Model type</FieldLabel>
            <p className="mt-0.5 text-xs font-medium text-[#0f2744]">{architectureLabel(m?.architecture)}</p>
          </div>
          <div className="rounded-xl bg-[#f8fafc] px-3 py-2.5 ring-1 ring-line/70">
            <FieldLabel>{semantics.projection_label}</FieldLabel>
            <p className="mt-0.5 truncate font-mono text-xs font-medium text-[#0f2744]" title={projectionVersion ?? undefined}>
              {projectionVersion ?? "—"}
            </p>
          </div>
          <div className="rounded-xl bg-[#f8fafc] px-3 py-2.5 ring-1 ring-line/70">
            <FieldLabel>Embedding dim</FieldLabel>
            <p className="mt-0.5 text-xs font-medium tabular-nums text-[#0f2744]">
              {m?.embedding_dimension != null ? String(m.embedding_dimension) : "—"}
            </p>
          </div>
          <div className="col-span-2 rounded-xl bg-[#f8fafc] px-3 py-2.5 ring-1 ring-line/70">
            <FieldLabel>Prediction task</FieldLabel>
            <p className="mt-0.5 text-xs font-medium text-[#0f2744]">{semantics.prediction_task_label}</p>
          </div>
        </div>

        <div>
          <FieldLabel>Stored {semantics.score_label.toLowerCase()} sequence</FieldLabel>
          {probabilityChain ? (
            <p className="mt-1 text-sm font-medium tabular-nums leading-snug text-[#0f2744]">{probabilityChain}</p>
          ) : (
            <p className="mt-1 text-sm text-[#64748b]">No stored demo progression scores yet.</p>
          )}
          {comparable && profile.risk_velocity_pp_month != null ? (
            <p className="mt-1 text-xs text-[#64748b]">
              {semantics.velocity_label} {formatRv(profile.risk_velocity_pp_month, comparable)} ·{" "}
              {progressLabel(profile.progress_display, comparable)}
            </p>
          ) : null}
        </div>

        <p className="text-xs text-[#64748b]">
          Latent trajectory: {projectedCount} of {visitCount} visit{visitCount === 1 ? "" : "s"} with projection.
        </p>

        <p className="text-xs text-[#64748b]">
          Feature attributions (SHAP) are not generated in Component 1. Open Explainability to review stored outputs or
          request Component 2.
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <button type="button" className={pillClass(false, "sm")} onClick={() => onTab("progress")}>
            Progress &amp; Trajectory
          </button>
          <button type="button" className={pillClass(false, "sm")} onClick={() => onTab("ai")}>
            AI Details
          </button>
        </div>
        </div>
      </details>

      {trajectoryOpen ? (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <button
            type="button"
            className="absolute inset-0 bg-[#0A2748]/40 backdrop-blur-md"
            aria-label="Close trajectory dialog"
            onClick={() => setTrajectoryOpen(false)}
          />
          <div className="relative flex min-h-full items-start justify-center px-4 py-10 sm:items-center sm:px-6 sm:py-12">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="latent-trajectory-title"
              className="relative w-full max-w-3xl"
            >
              <button
                type="button"
                onClick={() => setTrajectoryOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-lg p-2 text-[#64748b] hover:bg-white hover:text-[#0A2748]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="overflow-hidden rounded-2xl border border-[#e4ecf4] bg-white shadow-[0_24px_64px_-28px_rgba(10,39,72,0.45)]">
                <div className="border-b border-[#e4ecf4] bg-[#f7f9fc] px-6 py-5 pr-14">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="latent-trajectory-title" className="text-xl font-bold text-[#0f2744]">
                      Latent representation trajectory
                    </h2>
                    <p className="text-xs text-[#64748b]">
                      {projectedCount} of {visitCount} visit{visitCount === 1 ? "" : "s"} with projection
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {semantics.projection_label}: {projectionVersion ?? "—"}
                    {m?.label ? ` · Model ${m.label}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[#64748b]">{semantics.projection_description}</p>
                </div>

                <div className="max-h-[min(70vh,36rem)] space-y-4 overflow-y-auto px-6 py-5">
                  {profile.model_warning ? (
                    <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{profile.model_warning}</p>
                  ) : null}
                  <LatentTrajectory visits={profile.visits} />
                  <p className="text-xs text-[#64748b]">
                    Feature attributions are not shown on this trajectory plot. Use Explainability on the Advanced AI card.
                  </p>
                  <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                    <button
                      type="button"
                      className={pillClass(false, "sm")}
                      onClick={() => {
                        setTrajectoryOpen(false);
                        onTab("progress");
                      }}
                    >
                      Progress &amp; Trajectory
                    </button>
                    <button
                      type="button"
                      className={pillClass(false, "sm")}
                      onClick={() => {
                        setTrajectoryOpen(false);
                        onTab("ai");
                      }}
                    >
                      AI Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function overdueFollowUp(profile: ChildProfile) {
  return profile.follow_up_overdue_days != null;
}

function C3ReassessmentPanel({ childId }: { childId: string }) {
  const { data } = useQuery({
    queryKey: ["c3-reassessment", childId],
    queryFn: () =>
      api<{
        connected: boolean;
        configured: boolean;
        message?: string | null;
        request?: {
          status: string;
          requested_at?: string | null;
          result_url?: string | null;
          queued_offline?: boolean;
        } | null;
      }>(`/children/${childId}/c3-reassessment`),
    staleTime: 15_000,
  });
  if (!data?.request) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-line bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">
        Intervention reassessment · Component 3 · {data?.connected ? "Ready" : "Not connected"}
      </div>
    );
  }
  const req = data.request;
  return (
    <div className="mt-4 rounded-xl border border-line bg-white px-3 py-3 text-sm" data-testid="c3-reassessment-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Intervention reassessment</p>
      <p className="mt-1 font-medium text-[#0f2744]">Component 3</p>
      <p className="mt-2 text-xs text-[#64748b]">
        Requested {req.requested_at ? formatClinicalDate(req.requested_at) : "—"}
      </p>
      <p className="mt-1 text-sm text-[#0f2744]">
        Status · {req.status === "COMPLETED" ? "Available" : req.queued_offline ? "Queued" : req.status}
      </p>
      {data.message ? <p className="mt-2 text-xs text-[#b45309]">{data.message}</p> : null}
      {req.status === "COMPLETED" && req.result_url ? (
        <a className="mt-2 inline-block text-sm font-medium text-[#2563eb]" href={req.result_url} target="_blank" rel="noreferrer">
          Open Component 3 result
        </a>
      ) : null}
    </div>
  );
}

function ReviewForm({
  onSave,
  saving,
}: {
  onSave: (payload: { assessment: string; workflow: string; note: string }) => void;
  saving?: boolean;
}) {
  const [assessment, setAssessment] = useState("");
  const [workflow, setWorkflow] = useState("monitor");
  const [note, setNote] = useState("");
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-[#0f2744]">Do you agree with the AI-assisted assessment?</p>
      <div className="flex flex-wrap gap-2">
        {[
          { id: "agree", label: "Agree" },
          { id: "disagree", label: "Disagree" },
          { id: "uncertain", label: "Further assessment required" },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setAssessment(opt.id)}
            className={pillClass(assessment === opt.id, "sm")}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <label className="block text-xs font-medium text-[#64748b]">
        Workflow
        <select
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
          value={workflow}
          onChange={(e) => setWorkflow(e.target.value)}
        >
          <option value="monitor">Continue monitoring</option>
          <option value="nutrition">Nutrition review</option>
          <option value="investigate">Further investigation</option>
          <option value="refer">Refer</option>
          <option value="reassess">Request intervention reassessment</option>
        </select>
      </label>
      <label className="block text-xs font-medium text-[#64748b]">
        Clinical note
        <Textarea className="mt-1" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Document clinical reasoning. This is not sent to the model." />
      </label>
      <Button className="h-9 text-xs" disabled={!assessment || !note.trim() || saving} onClick={() => onSave({ assessment, workflow, note })}>
        {saving ? "Saving…" : "Save Review"}
      </Button>
    </div>
  );
}

function FollowUpBody({ profile }: { profile: ChildProfile }) {
  const overdue = overdueFollowUp(profile);
  const suggested = profile.follow_up_status === "SUGGESTED";
  return (
    <div className="space-y-3 text-sm">
      <p className={cn("text-2xl font-semibold tabular-nums", overdue ? "text-clinical-warning" : "text-[#0f2744]")}>
        {profile.next_follow_up ? formatClinicalDate(profile.next_follow_up) : "Not scheduled"}
      </p>
      {profile.facility?.name ? <p className="text-[#64748b]">{profile.facility.name}</p> : null}
      <p className="text-[#64748b]">
        {overdue
          ? `Overdue by ${profile.follow_up_overdue_days} days`
          : suggested
            ? "Suggested"
            : profile.follow_up_status
              ? formatStatus(profile.follow_up_status)
              : "—"}
      </p>
      <FollowUpSchedulePanel
        compact
        childId={profile.id}
        followUpId={profile.follow_up_id}
        nextFollowUp={profile.next_follow_up}
        followUpStatus={profile.follow_up_status}
      />
    </div>
  );
}

function VisitsTab({ profile }: { profile: ChildProfile }) {
  return (
    <Section title="Visit record" subtitle="Full history with recorded measurements. Does not repeat the current AI assessment card." bodyClassName="px-0 py-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-[#f8fafc] text-[#64748b]">
              <th className="px-5 py-2.5 font-medium">Visit</th>
              <th className="px-5 py-2.5 font-medium">Date</th>
              <th className="px-5 py-2.5 font-medium">Weight</th>
              <th className="px-5 py-2.5 font-medium">Height</th>
              <th className="px-5 py-2.5 font-medium">MUAC</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 font-medium">Severity</th>
              <th className="px-5 py-2.5 font-medium">Probability</th>
              <th className="px-5 py-2.5 font-medium">Review</th>
            </tr>
          </thead>
          <tbody>
            {profile.visits.map((v) => (
              <tr key={v.id} className="border-b border-line/70 last:border-0 hover:bg-[#f8fafc]">
                <td className="px-5 py-2.5 font-medium">V{v.visit_number}</td>
                <td className="px-5 py-2.5">{formatClinicalDate(v.visit_date)}</td>
                <td className="px-5 py-2.5 tabular-nums">{v.measurements?.weight_kg != null ? `${v.measurements.weight_kg} kg` : "—"}</td>
                <td className="px-5 py-2.5 tabular-nums">{v.measurements?.height_cm != null ? `${v.measurements.height_cm} cm` : "—"}</td>
                <td className="px-5 py-2.5 tabular-nums">{v.measurements?.muac_cm != null ? `${v.measurements.muac_cm} cm` : "—"}</td>
                <td className="px-5 py-2.5">{v.prediction?.status ? formatStatus(v.prediction.status) : "—"}</td>
                <td className="px-5 py-2.5">{v.prediction?.severity ? formatStatus(v.prediction.severity) : "—"}</td>
                <td className="px-5 py-2.5 tabular-nums">{formatPercent(v.prediction?.risk)}</td>
                <td className="px-5 py-2.5">{reviewLabel(v.review_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function ProgressTab({
  profile,
  comparable,
  series,
  metric,
  setMetric,
}: {
  profile: ChildProfile;
  comparable: boolean;
  series: ReturnType<typeof probabilitySeries>;
  metric: TrendMetric;
  setMetric: (m: TrendMetric) => void;
}) {
  const semantics = getModelOutputDisplayMetadata(profile);
  return (
    <div className="space-y-4">
      <Section
        title="Trends"
        actions={
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["probability", semantics.score_label],
                ["weight", "Weight"],
                ["height", "Height"],
                ["muac", "MUAC"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setMetric(id)} className={pillClass(metric === id, "sm")}>
                {label}
              </button>
            ))}
          </div>
        }
      >
        <TrendChart data={series} metric={metric} comparable={comparable} scoreLabel={semantics.score_label} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MetricTile label={semantics.velocity_label} value={formatRv(profile.risk_velocity_pp_month, comparable)} />
          <MetricTile
            label="Progress"
            value={
              <span className="inline-flex items-center gap-1.5">
                <ProgressGlyph state={profile.progress_display} />
                {progressLabel(profile.progress_display, comparable)}
              </span>
            }
          />
        </div>
      </Section>
      <Section
        title="Multimodal latent representation trajectory"
        subtitle={
          <>
            {semantics.projection_label}:{" "}
            {profile.current?.projection_version ?? semantics.projection_version ?? "—"}
            {profile.model?.label ? ` · Model ${profile.model.label}` : ""}
          </>
        }
      >
        <LatentTrajectory visits={profile.visits} warning={profile.model_warning} />
        <p className="mt-2 text-xs text-[#64748b]">{semantics.projection_description}</p>
      </Section>
    </div>
  );
}

function NotesTab({
  profile,
  onAddNote,
  noteSaving,
}: {
  profile: ChildProfile;
  onAddNote: (body: string) => void;
  noteSaving?: boolean;
}) {
  const [note, setNote] = useState("");
  return (
    <Section title="Clinical notes" subtitle="Notes are never sent to the prediction model.">
      <div className="space-y-4">
        <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a clinical note" />
        <Button onClick={() => onAddNote(note)} disabled={!note.trim() || noteSaving}>
          Save note
        </Button>
        {profile.notes.length === 0 ? <EmptyState title="No clinical notes yet." /> : null}
        {profile.notes.map((n) => (
          <article key={n.id} className="rounded-xl bg-[#f8fafc] p-3 text-sm ring-1 ring-line/70">
            <p>{n.body}</p>
            <p className="mt-1 text-xs text-[#64748b]">{new Date(n.created_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function AiDetailsTab({
  profile,
  inputsOpen,
  setInputsOpen,
  qualityOpen,
  setQualityOpen,
}: {
  profile: ChildProfile;
  inputsOpen: boolean;
  setInputsOpen: (v: boolean) => void;
  qualityOpen: boolean;
  setQualityOpen: (v: boolean) => void;
}) {
  const m = profile.model;
  const semantics = getModelOutputDisplayMetadata(profile);
  return (
    <div className="space-y-4">
      <Section
        title="Why this assessment?"
        subtitle="Plain-language summary of the recorded inputs that influenced this AI-assisted assessment."
        actions={<ExplainabilityTrigger profile={profile} label="Why this assessment?" />}
      >
        <p className="text-sm text-[#475569]">
          Open the explanation to see, in simple clinical language, which visit measurements and household/dietary
          inputs most influenced this assessment. Advanced SHAP analysis remains with Component 2 when connected.
        </p>
      </Section>
      <Section title="Model information">
        <div className="grid gap-3 sm:grid-cols-2">
          <Meta label="Active model" value={m?.label ?? "—"} mono />
          <Meta label="Model type" value={architectureLabel(m?.architecture)} />
          <Meta label="Prediction task" value={semantics.prediction_task_label} />
          <Meta label="Embedding dimension" value={m?.embedding_dimension != null ? String(m.embedding_dimension) : "—"} />
          <Meta label="Calibration" value={m?.calibration_version ?? profile.current?.prediction?.calibration_version ?? "—"} />
          <Meta label="Model assessment mode" value={m?.is_demo ? "Research / Demo" : profile.current?.prediction?.mode ? formatStatus(profile.current.prediction.mode) : "—"} />
          <Meta label="Feature schema" value={m?.feature_schema_version ?? "—"} />
          <Meta label="Embedding space" value={m?.embedding_space_id ?? "—"} />
          <Meta label={semantics.projection_label} value={profile.current?.projection_version ?? semantics.projection_version ?? "—"} mono />
          <Meta label="Score kind" value={semantics.score_label} />
        </div>
      </Section>
      <Section title="Data inputs" subtitle="Counts from the stored latest visit. Unavailable is not treated as No.">
        <div className="space-y-3 text-sm">
          {profile.modalities ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              <li className="rounded-xl bg-[#f8fafc] px-4 py-3 ring-1 ring-line/70">Anthropometric · {profile.modalities.anthropometric.available} of {profile.modalities.anthropometric.total} fields available</li>
              <li className="rounded-xl bg-[#f8fafc] px-4 py-3 ring-1 ring-line/70">Socioeconomic · {profile.modalities.socioeconomic.available} of {profile.modalities.socioeconomic.total} fields available</li>
              <li className="rounded-xl bg-[#f8fafc] px-4 py-3 ring-1 ring-line/70">Dietary · {profile.modalities.dietary.available} of {profile.modalities.dietary.total} fields available</li>
              <li className="rounded-xl bg-[#f8fafc] px-4 py-3 ring-1 ring-line/70">Maternal / child health · {profile.modalities.maternal_child_health.available} of {profile.modalities.maternal_child_health.total} fields available</li>
            </ul>
          ) : (
            <p className="text-[#64748b]">No visit inputs stored.</p>
          )}
          <button type="button" className="font-medium text-[#2563eb]" onClick={() => setInputsOpen(!inputsOpen)}>
            {inputsOpen ? "Hide submitted inputs" : "View submitted inputs"}
          </button>
          {inputsOpen && profile.latest_inputs ? (
            <pre className="overflow-x-auto rounded-xl bg-[#f8fafc] p-3 text-xs ring-1 ring-line/70">{JSON.stringify(profile.latest_inputs, null, 2)}</pre>
          ) : null}
          <button type="button" className="block font-medium text-[#2563eb]" onClick={() => setQualityOpen(!qualityOpen)}>
            Data quality details
          </button>
          {qualityOpen && profile.modalities ? (
            <ul className="grid gap-1 text-xs sm:grid-cols-2">
              {profile.modalities.anthropometric.fields.map((f) => (
                <li key={f.field}>
                  {f.available ? "✓" : "⚠"} {f.field.replaceAll("_", " ")}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Section>
      <p className="text-center">
        <Link href="/research/models" className="inline-flex items-center gap-1 text-sm text-[#2563eb]">
          Research model registry <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </p>
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-[#f8fafc] px-4 py-3 ring-1 ring-line/70">
      <FieldLabel>{label}</FieldLabel>
      <p className={cn("mt-1 text-sm text-[#0f2744]", mono && "font-mono text-xs")}>{value}</p>
    </div>
  );
}
