"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { resolveContextForYear } from "@/lib/sri-lanka-context";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { formatPercent, formatStatus } from "@/lib/utils";
import { X } from "lucide-react";
import {
  PredictionExplanationPanel,
  type PredictionExplanation,
} from "@/components/prediction-explanation-panel";

const STEPS = [
  "Visit & identifiers",
  "Child measurements",
  "Household & mother",
  "Dietary & feeding",
  "Context & review",
] as const;

function VisitModalShell({
  children,
  labelledBy,
  onClose,
}: {
  children: ReactNode;
  labelledBy?: string;
  onClose?: () => void;
}) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="absolute inset-0 bg-[#0A2748]/40 backdrop-blur-md" aria-hidden />
      <div className="relative flex min-h-full items-start justify-center px-4 py-10 sm:items-center sm:px-6 sm:py-12">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          className="relative w-full max-w-3xl"
        >
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-[#64748b] hover:bg-white hover:text-[#0A2748]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4 rounded-xl border border-[#e8eef5] bg-[#f8fafc] px-4 py-3">
      <p className="text-sm font-semibold text-[#0f2744]">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-[#64748b]">{description}</p>
    </div>
  );
}

function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} readOnly className="border-[#e8eef5] bg-[#f8fafc] text-[#0f2744]" />
      {hint ? <p className="mt-1 text-xs text-[#64748b]">{hint}</p> : null}
    </div>
  );
}

type TriState = "" | "yes" | "no" | "unknown";

function triFromBool(v: unknown): TriState {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "";
}

function triToBool(v: TriState): boolean | null {
  if (v === "yes") return true;
  if (v === "no") return false;
  return null;
}

function ynLabel(v: TriState): string {
  if (v === "yes") return "Yes";
  if (v === "no") return "No";
  if (v === "unknown") return "Unknown";
  return "—";
}

function ageMonthsAtVisit(dobIso: string | undefined, visitLocal: string): string {
  if (!dobIso || !visitLocal) return "";
  const dob = new Date(dobIso);
  const visit = new Date(visitLocal);
  let months = (visit.getFullYear() - dob.getFullYear()) * 12 + (visit.getMonth() - dob.getMonth());
  if (visit.getDate() < dob.getDate()) months -= 1;
  return String(Math.max(0, months));
}

type Prefill = {
  child: {
    pseudonymous_id: string;
    study_serial_number?: string | null;
    full_name?: string | null;
    sex: string;
    date_of_birth?: string;
    age_months: number;
    visit_count: number;
    is_baseline: boolean;
    visit_label?: string;
  };
  anthropometric?: Record<string, unknown> | null;
  socioeconomic?: Record<string, unknown> | null;
  dietary?: Record<string, unknown> | null;
};

type VisitForm = {
  visit_date: string;
  visit_type: string;
  age_months: string;
  sex: string;
  height_cm: string;
  weight_kg: string;
  maternal_age_years: string;
  maternal_education: string;
  maternal_employment: string;
  income_category: string;
  household_size: string;
  socioeconomic_remarks: string;
  exclusive_breastfeeding: TriState;
  breastfeeding_duration_months: string;
  complementary_feeding: TriState;
  meal_frequency: string;
  dietary_diversity_category: string;
  triposha_received: TriState;
  vitamin_supplements: TriState;
  dietary_remarks: string;
  confirmation: boolean;
};

function emptyForm(sex = ""): VisitForm {
  return {
    visit_date: new Date().toISOString().slice(0, 16),
    visit_type: "follow_up",
    age_months: "",
    sex,
    height_cm: "",
    weight_kg: "",
    maternal_age_years: "",
    maternal_education: "",
    maternal_employment: "",
    income_category: "",
    household_size: "",
    socioeconomic_remarks: "",
    exclusive_breastfeeding: "",
    breastfeeding_duration_months: "",
    complementary_feeding: "",
    meal_frequency: "",
    dietary_diversity_category: "",
    triposha_received: "",
    vitamin_supplements: "",
    dietary_remarks: "",
    confirmation: false,
  };
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function applyPrefill(base: VisitForm, prefill: Prefill): VisitForm {
  const a = prefill.anthropometric ?? {};
  const s = prefill.socioeconomic ?? {};
  const d = prefill.dietary ?? {};
  const isBaseline = prefill.child.is_baseline;

  return {
    ...base,
    visit_type: isBaseline ? "routine" : "follow_up",
    age_months: str(prefill.child.age_months),
    sex: prefill.child.sex || base.sex,
    height_cm: isBaseline ? "" : str(a.height_cm),
    weight_kg: isBaseline ? "" : str(a.weight_kg),
    maternal_age_years: str(s.maternal_age_years),
    maternal_education: str(s.maternal_education),
    maternal_employment: str(s.maternal_employment),
    income_category: str(s.income_category),
    household_size: str(s.household_size),
    socioeconomic_remarks: str(s.remarks),
    exclusive_breastfeeding: triFromBool(d.exclusive_breastfeeding ?? (d.breastfeeding_status === "exclusive" ? true : null)),
    breastfeeding_duration_months: str(d.breastfeeding_duration_months),
    complementary_feeding: triFromBool(d.complementary_feeding),
    meal_frequency: str(d.meal_frequency),
    dietary_diversity_category: str(d.dietary_diversity_category),
    triposha_received: triFromBool(d.triposha_received),
    vitamin_supplements: triFromBool(d.micronutrient_supplementation),
    dietary_remarks: str(d.remarks),
  };
}

function YnSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TriState;
  onChange: (v: TriState) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onChange={(e) => onChange(e.target.value as TriState)} className="border-[#e8eef5]">
        <option value="">Not assessed</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
        <option value="unknown">Unknown</option>
      </Select>
    </div>
  );
}

function validationHints(form: VisitForm): string[] {
  const hints: string[] = [];
  if (!form.age_months) hints.push("Child's age could not be calculated — check visit date.");
  if (!form.weight_kg) hints.push("Weight is required.");
  if (!form.height_cm) hints.push("Height is required.");
  if (!form.confirmation) hints.push("Confirm the clinic record attestation before submitting.");
  return hints;
}

export default function NewVisitPage() {
  const { childId } = useParams<{ childId: string }>();
  const router = useRouter();
  const prefillQ = useQuery({
    queryKey: ["visit-prefill", childId],
    queryFn: () => api<Prefill>(`/children/${childId}/visits/prefill`),
  });

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<VisitForm>(() => emptyForm());

  useEffect(() => {
    if (prefillQ.data) setForm(applyPrefill(emptyForm(prefillQ.data.child.sex), prefillQ.data));
  }, [prefillQ.data]);

  useEffect(() => {
    if (!prefillQ.data?.child.date_of_birth) return;
    const months = ageMonthsAtVisit(prefillQ.data.child.date_of_birth, form.visit_date);
    if (months) setForm((f) => ({ ...f, age_months: months }));
  }, [form.visit_date, prefillQ.data?.child.date_of_birth]);

  const isBaseline = prefillQ.data?.child.is_baseline ?? false;
  const visitYear = new Date(form.visit_date).getFullYear();
  const contextPreview = useMemo(() => resolveContextForYear(visitYear), [visitYear]);

  function set<K extends keyof VisitForm>(key: K, value: VisitForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const hints = useMemo(() => validationHints(form), [form]);
  const ready = hints.length === 0 || (hints.length === 1 && hints[0].includes("Confirm"));

  async function submit() {
    if (hints.length > 0) {
      setError("Complete the required fields on the review step.");
      return;
    }
    setBusy(true);
    setError(null);
    setQualityIssues([]);
    try {
      const prev = prefillQ.data?.anthropometric;
      const exclusiveBf = triToBool(form.exclusive_breastfeeding);
      const payload = {
        visit_date: new Date(form.visit_date).toISOString(),
        visit_type: form.visit_type,
        scheduled: true,
        confirmation_attested: form.confirmation,
        anthropometric: {
          age_months: Number(form.age_months),
          sex: form.sex,
          height_cm: form.height_cm ? Number(form.height_cm) : null,
          weight_kg: Number(form.weight_kg),
          previous_weight_kg: prev?.weight_kg ?? null,
          previous_height_cm: prev?.height_cm ?? null,
        },
        socioeconomic: {
          household_changed: !isBaseline,
          maternal_education: form.maternal_education || null,
          maternal_employment: form.maternal_employment || null,
          maternal_age_years: form.maternal_age_years ? Number(form.maternal_age_years) : null,
          income_category: form.income_category || null,
          household_size: form.household_size ? Number(form.household_size) : null,
          remarks: form.socioeconomic_remarks || null,
        },
        dietary: {
          exclusive_breastfeeding: exclusiveBf,
          breastfeeding_status:
            exclusiveBf === true ? "exclusive" : exclusiveBf === false ? "continued" : null,
          breastfeeding_duration_months: form.breastfeeding_duration_months
            ? Number(form.breastfeeding_duration_months)
            : null,
          complementary_feeding: triToBool(form.complementary_feeding),
          meal_frequency: form.meal_frequency ? Number(form.meal_frequency) : null,
          dietary_diversity_category: form.dietary_diversity_category || null,
          micronutrient_supplementation: triToBool(form.vitamin_supplements),
          triposha_received: triToBool(form.triposha_received),
          remarks: form.dietary_remarks || null,
        },
      };
      const created = await api<{ visit: { id: string }; prediction: Record<string, unknown>; quality: Record<string, unknown> }>(
        `/children/${childId}/visits`,
        { method: "POST", body: JSON.stringify(payload) },
      );
      setResult(created);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Visit could not be saved";
      setError(msg);
      try {
        const parsed = JSON.parse(msg);
        const issues = parsed?.detail?.quality?.issues ?? parsed?.quality?.issues;
        if (Array.isArray(issues)) {
          setQualityIssues(issues.map((i: { field?: string; message?: string }) => `${i.field ?? "field"}: ${i.message ?? "review required"}`));
        }
      } catch {
        /* plain text error */
      }
    } finally {
      setBusy(false);
    }
  }

  if (prefillQ.isLoading) {
    return (
      <VisitModalShell onClose={() => router.push(`/children/${childId}`)}>
        <div className="rounded-2xl border border-[#e4ecf4] bg-white p-6 shadow-[0_24px_64px_-28px_rgba(10,39,72,0.45)]">
          <Skeleton className="h-96" />
        </div>
      </VisitModalShell>
    );
  }
  if (prefillQ.isError || !prefillQ.data) {
    return (
      <VisitModalShell onClose={() => router.push(`/children/${childId}`)}>
        <div className="rounded-2xl border border-[#e4ecf4] bg-white p-6 shadow-[0_24px_64px_-28px_rgba(10,39,72,0.45)]">
          <ErrorState message="Unable to load visit context for this child." />
        </div>
      </VisitModalShell>
    );
  }

  const child = prefillQ.data.child;

  if (result?.prediction) {
    const p = result.prediction as { status: string; severity: string; risk: number; confidence?: string; mode: string };
    const explanation = result.explanation as PredictionExplanation | undefined;
    return (
      <VisitModalShell labelledBy="visit-result-title" onClose={() => router.push(`/children/${childId}`)}>
      <Card className="max-w-2xl border-[#e4ecf4] shadow-[0_24px_64px_-28px_rgba(10,39,72,0.45)]">
        <CardHeader>
          <CardTitle id="visit-result-title">Visit recorded — nutritional assessment</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p>
            Child ID <strong>{child.pseudonymous_id}</strong> · Visit {child.visit_count}
          </p>
          <p>
            Predicted status <strong>{formatStatus(p.status)}</strong>
          </p>
          <p>
            Severity <StatusBadge value={p.severity} />
          </p>
          <p>
            Demo Progression Score <strong>{formatPercent(p.risk)}</strong>
          </p>
          {explanation ? <PredictionExplanationPanel explanation={explanation} /> : null}
          <p className="text-sm text-muted">Demo confidence indicator · Not for clinical use · Model MCA-2026-001</p>
          <p className="text-sm text-muted">AI-assisted decision support — clinical review required.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push(`/children/${childId}`)}>Open child profile</Button>
            <Button variant="secondary" onClick={() => router.push(`/children/${childId}/report`)}>
              View progress report
            </Button>
          </div>
        </CardBody>
      </Card>
      </VisitModalShell>
    );
  }

  const lastStep = STEPS.length - 1;

  return (
    <VisitModalShell labelledBy="visit-form-title" onClose={() => router.push(`/children/${childId}`)}>
      <div className="overflow-hidden rounded-2xl border border-[#e4ecf4] bg-white shadow-[0_24px_64px_-28px_rgba(10,39,72,0.45)]">
        <div className="border-b border-[#e4ecf4] bg-gradient-to-r from-[#f7f9fc] to-white px-6 py-5 pr-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#64748b]">Record visit</p>
          <h1 id="visit-form-title" className="mt-1 text-xl font-bold text-[#0f2744] sm:text-2xl">
            {isBaseline ? "Baseline assessment" : "Follow-up assessment"}
          </h1>
          <p className="mt-1 text-sm text-[#64748b]">
            {child.full_name ? `${child.full_name} · ` : ""}
            Visit {child.visit_label ?? (isBaseline ? "V1" : `V${(child.visit_count ?? 0) + 1}`)}
          </p>
        </div>

        <div className="border-b border-[#e4ecf4] bg-white px-6 py-3">
          <ol className="flex flex-wrap gap-1.5">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={`rounded-full px-3 py-1 text-[11px] font-medium sm:text-xs ${
                  i === step ? "bg-[#0E3A67] text-white" : i < step ? "bg-[#dbeafe] text-[#1e40af]" : "bg-[#f1f5f9] text-[#64748b]"
                }`}
              >
                {i + 1}. {label}
              </li>
            ))}
          </ol>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="space-y-4">
            {step === 0 ? (
              <>
                <SectionIntro
                  title="Visit & identifiers"
                  description="Child ID and serial number are taken from the registration record. Visit date is used to calculate the child's age and link national context indicators."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="Child ID" value={child.pseudonymous_id} />
                  <ReadOnlyField
                    label="Serial Number"
                    value={child.study_serial_number ?? "—"}
                    hint="From registration record"
                  />
                  <div className="sm:col-span-2">
                    <Label>Visit date & time</Label>
                    <Input
                      type="datetime-local"
                      value={form.visit_date}
                      onChange={(e) => set("visit_date", e.target.value)}
                      className="border-[#e8eef5]"
                    />
                  </div>
                  <ReadOnlyField
                    label="Child's Age (months)"
                    value={form.age_months ? `${form.age_months} months` : "—"}
                    hint="Calculated from date of birth and visit date"
                  />
                </div>
              </>
            ) : null}

            {step === 1 ? (
              <>
                <SectionIntro
                  title="Child measurements"
                  description="Enter today's anthropometric measurements. Previous values are shown for follow-up visits."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="Child's Age (months)" value={form.age_months || "—"} />
                  <div>
                    <Label>
                      Weight (kg) <span className="text-clinical-danger">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.weight_kg}
                      onChange={(e) => set("weight_kg", e.target.value)}
                      className="border-[#e8eef5]"
                      placeholder="e.g. 9.2"
                    />
                  </div>
                  <div>
                    <Label>
                      Height (cm) <span className="text-clinical-danger">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.height_cm}
                      onChange={(e) => set("height_cm", e.target.value)}
                      className="border-[#e8eef5]"
                      placeholder="e.g. 78.5"
                    />
                  </div>
                </div>
                {!isBaseline && prefillQ.data.anthropometric ? (
                  <p className="rounded-xl border border-[#e8eef5] bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">
                    Previous visit — weight {str(prefillQ.data.anthropometric.weight_kg)} kg · height{" "}
                    {str(prefillQ.data.anthropometric.height_cm)} cm
                  </p>
                ) : null}
              </>
            ) : null}

            {step === 2 ? (
              <>
                <SectionIntro
                  title="Household & mother"
                  description="Household and maternal socioeconomic information aligned to the research dataset."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Mother&apos;s Age (years)</Label>
                    <Input
                      type="number"
                      min={15}
                      max={55}
                      value={form.maternal_age_years}
                      onChange={(e) => set("maternal_age_years", e.target.value)}
                      className="border-[#e8eef5]"
                    />
                  </div>
                  <div>
                    <Label>Education</Label>
                    <Select
                      value={form.maternal_education}
                      onChange={(e) => set("maternal_education", e.target.value)}
                      className="border-[#e8eef5]"
                    >
                      <option value="">Select…</option>
                      <option value="none">None</option>
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                      <option value="tertiary">Tertiary</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Occupation</Label>
                    <Input
                      value={form.maternal_employment}
                      onChange={(e) => set("maternal_employment", e.target.value)}
                      className="border-[#e8eef5]"
                      placeholder="e.g. employed, home, self-employed"
                    />
                  </div>
                  <div>
                    <Label>Income Category</Label>
                    <Select
                      value={form.income_category}
                      onChange={(e) => set("income_category", e.target.value)}
                      className="border-[#e8eef5]"
                    >
                      <option value="">Select…</option>
                      <option value="low">Low</option>
                      <option value="medium">Med</option>
                      <option value="high">High</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Family member count</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.household_size}
                      onChange={(e) => set("household_size", e.target.value)}
                      className="border-[#e8eef5]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Remarks</Label>
                    <Input
                      value={form.socioeconomic_remarks}
                      onChange={(e) => set("socioeconomic_remarks", e.target.value)}
                      className="border-[#e8eef5]"
                      placeholder="Optional household / mother notes"
                    />
                  </div>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <SectionIntro
                  title="Dietary & feeding"
                  description="Feeding practices and dietary intake aligned to the research dataset."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <YnSelect
                    label="Exclusive BF (Y/N)"
                    value={form.exclusive_breastfeeding}
                    onChange={(v) => set("exclusive_breastfeeding", v)}
                  />
                  <div>
                    <Label>BF Duration (Months)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={36}
                      step="0.1"
                      value={form.breastfeeding_duration_months}
                      onChange={(e) => set("breastfeeding_duration_months", e.target.value)}
                      className="border-[#e8eef5]"
                    />
                  </div>
                  <YnSelect
                    label="Complementary Feeding (Y/N)"
                    value={form.complementary_feeding}
                    onChange={(v) => set("complementary_feeding", v)}
                  />
                  <div>
                    <Label>Meals/Day</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={form.meal_frequency}
                      onChange={(e) => set("meal_frequency", e.target.value)}
                      className="border-[#e8eef5]"
                    />
                  </div>
                  <div>
                    <Label>Dietary Diversity (Low/Med/High)</Label>
                    <Select
                      value={form.dietary_diversity_category}
                      onChange={(e) => set("dietary_diversity_category", e.target.value)}
                      className="border-[#e8eef5]"
                    >
                      <option value="">Select…</option>
                      <option value="low">Low</option>
                      <option value="medium">Med</option>
                      <option value="high">High</option>
                    </Select>
                  </div>
                  <YnSelect label="Triposha (Y/N)" value={form.triposha_received} onChange={(v) => set("triposha_received", v)} />
                  <YnSelect
                    label="Vitamin Supplements (Y/N)"
                    value={form.vitamin_supplements}
                    onChange={(v) => set("vitamin_supplements", v)}
                  />
                  <div className="sm:col-span-2">
                    <Label>Remarks</Label>
                    <Input
                      value={form.dietary_remarks}
                      onChange={(e) => set("dietary_remarks", e.target.value)}
                      className="border-[#e8eef5]"
                      placeholder="Optional dietary / feeding notes"
                    />
                  </div>
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4 text-sm">
                <SectionIntro
                  title="National context & review"
                  description="Sri Lanka economy, food prices, and major disease / disaster events are linked automatically from the visit year. Review all entries before running the AI-assisted assessment."
                />

                <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1e40af]">
                    Sri Lanka context — {contextPreview.visit_year}
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[#64748b]">Economic growth</dt>
                      <dd className="font-medium text-[#0f2744]">
                        {contextPreview.economic_growth_rate_pct != null
                          ? `${contextPreview.economic_growth_rate_pct}%`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#64748b]">Food price inflation</dt>
                      <dd className="font-medium text-[#0f2744]">
                        {contextPreview.food_price_inflation_pct != null
                          ? `${contextPreview.food_price_inflation_pct}%`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#64748b]">Food price index</dt>
                      <dd className="font-medium text-[#0f2744]">{contextPreview.food_price_index ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[#64748b]">Economy stress</dt>
                      <dd className="font-medium capitalize text-[#0f2744]">
                        {contextPreview.economy_stress_level ?? "—"}
                      </dd>
                    </div>
                  </dl>
                  {contextPreview.events.length > 0 ? (
                    <ul className="mt-3 space-y-1 border-t border-[#dbeafe] pt-3 text-xs text-[#475569]">
                      {contextPreview.events.map((ev) => (
                        <li key={ev.label}>
                          <span className="font-medium capitalize">{ev.type}</span> — {ev.label}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-3 text-[11px] leading-relaxed text-[#64748b]">
                    Demonstration context catalog · Linked automatically · Not for clinical decision-making alone
                  </p>
                </div>

                <div className="rounded-xl border border-[#e8eef5] bg-[#f8fafc] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Summary</p>
                  <ul className="space-y-1 text-[#475569]">
                    <li>
                      Child ID {child.pseudonymous_id} · Serial {child.study_serial_number ?? "—"} · Age{" "}
                      {form.age_months || "—"} months
                    </li>
                    <li>
                      Weight {form.weight_kg || "—"} kg · Height {form.height_cm || "—"} cm
                    </li>
                    <li>
                      Mother&apos;s Age {form.maternal_age_years || "—"} · Income{" "}
                      {form.income_category ? formatStatus(form.income_category) : "—"} · Family members{" "}
                      {form.household_size || "—"}
                    </li>
                    <li>
                      Exclusive BF {ynLabel(form.exclusive_breastfeeding)} · BF duration{" "}
                      {form.breastfeeding_duration_months || "—"} mo · Diversity{" "}
                      {form.dietary_diversity_category ? formatStatus(form.dietary_diversity_category) : "—"}
                    </li>
                  </ul>
                </div>

                <p
                  className={
                    ready
                      ? "rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900"
                      : "rounded-xl bg-amber-50 px-3 py-2 text-clinical-warning"
                  }
                >
                  {ready ? "Required fields complete — ready for AI-assisted assessment." : "Some required fields are still missing."}
                </p>

                {hints.length > 0 ? (
                  <ul className="rounded-xl bg-amber-50 p-3 text-clinical-warning">
                    {hints.map((h) => (
                      <li key={h}>• {h}</li>
                    ))}
                  </ul>
                ) : null}

                {qualityIssues.length > 0 ? (
                  <ul className="rounded-xl border border-clinical-danger/30 bg-red-50 p-3 text-clinical-danger">
                    {qualityIssues.map((q) => (
                      <li key={q}>• {q}</li>
                    ))}
                  </ul>
                ) : null}

                <label className="flex items-start gap-2 rounded-xl border border-[#e8eef5] bg-white p-3">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.confirmation}
                    onChange={(e) => set("confirmation", e.target.checked)}
                  />
                  <span className="text-[#475569]">
                    I confirm that the entered information matches the available clinic record and research dataset fields.
                  </span>
                </label>
              </div>
            ) : null}

            {error ? <p className="text-sm text-clinical-danger">{error}</p> : null}
            <div className="flex justify-between border-t border-[#e8eef5] pt-4">
              <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
              {step < lastStep ? (
                <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
              ) : (
                <Button onClick={submit} disabled={busy || !form.confirmation}>
                  {busy ? "Running assessment…" : "Run AI assessment"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </VisitModalShell>
  );
}
