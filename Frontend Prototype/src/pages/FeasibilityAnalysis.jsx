import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Baby, Bot, ClipboardCheck,
  Hospital, Lock, LogOut, MapPin, ShieldCheck, Utensils, Wallet, X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import Breadcrumbs from '../components/intervention/Breadcrumbs';
import Component4Nav from '../components/intervention/Component4Nav';
import PrototypeDisclaimer from '../components/intervention/PrototypeDisclaimer';
import WorkflowProgress from '../components/intervention/WorkflowProgress';
import { interventionChildren } from '../data/interventionData';
import {
  counterfactualMethods,
  defaultCounterfactualCandidateLimit,
  generateCounterfactualCandidates,
  rankCounterfactualCandidates,
} from '../data/counterfactualData';
import {
  evaluateCandidateFeasibility,
  evaluateCandidateSet,
  feasibilityWeights,
  rejectedCounterfactualExamples,
} from '../data/feasibilityData';

const ruleIcons = {
  Affordability: Wallet,
  'Local Availability': MapPin,
  'Age Suitability': Baby,
  'Clinic Access': Hospital,
  'Programme Eligibility': ClipboardCheck,
  'Household Context': ShieldCheck,
  'Clinical Suitability': AlertTriangle,
};

function percentage(value) {
  return `${Math.round(value * 100)}%`;
}

function statusClass(status) {
  if (status === 'PASS') return 'bg-success/10 text-success';
  if (status === 'CAUTION') return 'bg-warning/10 text-warning';
  if (status === 'FAIL') return 'bg-danger/10 text-danger';
  return 'bg-secondary/10 text-secondary';
}

function decisionClass(decision) {
  if (decision === 'REJECTED') return 'bg-danger/10 text-danger';
  if (decision === 'FEASIBLE WITH CAUTION') return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
}

export default function FeasibilityAnalysis() {
  const { childId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { logout } = useApp();
  const child = interventionChildren.find((item) => item.childId === childId);
  const [reasonDetail, setReasonDetail] = useState(null);
  const [evaluating, setEvaluating] = useState(true);

  const candidates = useMemo(() => {
    if (!child) return [];
    if (Array.isArray(location.state?.generatedCandidates) && location.state.generatedCandidates.length) {
      return location.state.generatedCandidates;
    }
    const actionable = child.riskFactors.filter((factor) => factor.actionable);
    return rankCounterfactualCandidates(generateCounterfactualCandidates(child, actionable))
      .slice(0, defaultCounterfactualCandidateLimit);
  }, [child, location.state]);

  const evaluations = useMemo(
    () => child ? evaluateCandidateSet(child, candidates) : [],
    [child, candidates]
  );

  const requestedCandidateId = searchParams.get('candidate');
  const selectedCandidate = candidates.find((candidate) => candidate.id === requestedCandidateId)
    || location.state?.selectedCandidate || candidates[0] || null;
  useEffect(() => {
    setEvaluating(true);
    const timer = window.setTimeout(() => setEvaluating(false), 550);
    return () => window.clearTimeout(timer);
  }, [childId, selectedCandidate?.id]);
  const selectedEvaluation = useMemo(() => {
    if (!child || !selectedCandidate) return null;
    return evaluations.find((item) => item.candidate.id === selectedCandidate.id)
      || evaluateCandidateFeasibility(child, selectedCandidate);
  }, [child, selectedCandidate, evaluations]);

  const feasibleCandidates = evaluations.filter((item) =>
    ['FEASIBLE', 'FEASIBLE WITH CLINICAL REVIEW'].includes(item.decision)
  );
  const cautionCandidates = evaluations.filter((item) => item.decision === 'FEASIBLE WITH CAUTION');
  const rejectedCandidates = evaluations.filter((item) => item.decision === 'REJECTED');
  const recommended = feasibleCandidates[0] || null;
  const selectedMethod = counterfactualMethods.find((item) => item.id === selectedCandidate?.method);
  const context = child?.feasibilityContext;
  const hasDietChange = selectedCandidate?.changes.some((change) =>
    ['Dietary Diversity', 'Food Group Variety', 'Meal Frequency', 'Complementary Feeding Practice', 'Responsive Feeding Practice'].includes(change.featureName)
  );

  const filterChartData = [
    { name: 'Before', value: candidates.length, color: '#0B1F4D' },
    { name: 'Feasible', value: feasibleCandidates.length, color: '#27AE60' },
    { name: 'Caution', value: cautionCandidates.length, color: '#F39C12' },
    { name: 'Rejected', value: rejectedCandidates.length, color: '#E74C3C' },
  ];

  const continueToRanking = () => {
    navigate(`/component/personalized-nutrition/child/${child.childId}/ranking`, {
      state: {
        selectedFeasibleCandidates: feasibleCandidates,
        recommendedCandidateId: recommended?.candidate.id,
      },
    });
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md"><Bot size={20} /></div><div><p className="text-sm font-bold text-primary">FedNutri-XAI</p><p className="text-[11px] text-slate-500">Component 04</p></div></div>
          <div className="flex items-center gap-2"><Link to={`/component/personalized-nutrition/child/${childId}/counterfactual`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50"><ArrowLeft size={14} /> Candidates</Link><Link to="/component/personalized-nutrition/dashboard" className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50 sm:inline-flex">Dashboard</Link><button type="button" onClick={() => { logout(); navigate('/login'); }} className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50 md:inline-flex"><LogOut size={14} /> Logout</button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6 md:py-10">
        {evaluating && child ? (
          <section className="rounded-2xl border border-secondary/20 bg-white p-10 text-center shadow-sm"><span className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-secondary/10 text-secondary"><ShieldCheck size={22} /></span><h1 className="mt-4 text-xl font-bold text-primary">Evaluating feasibility constraints...</h1><p className="mt-2 text-sm text-slate-500">Applying simulated Sri Lanka-specific affordability, access, suitability, and programme rules.</p></section>
        ) : !child || !selectedCandidate || !selectedEvaluation ? (
          <section className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-primary">{!child ? 'Child Record Not Found' : 'No feasible candidate is available'}</h1><p className="mt-2 text-sm text-slate-500">{!child ? `No simulated prototype record matches ${childId}.` : 'No candidate is available under the current prototype constraints.'}</p><Link to={!child ? '/component/personalized-nutrition/dashboard' : `/component/personalized-nutrition/child/${childId}/counterfactual`} className="mt-5 inline-flex rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white">{!child ? 'Return to Intervention Dashboard' : 'Back to Counterfactual Generation'}</Link></section>
        ) : (
          <>
            <Component4Nav childId={child.childId} current="Feasibility" />
            <Breadcrumbs items={[{ label: 'Research Home', to: '/research-home' }, { label: 'Component 04', to: '/component/personalized-nutrition' }, { label: 'Dashboard', to: '/component/personalized-nutrition/dashboard' }, { label: child.childId, to: `/component/personalized-nutrition/child/${child.childId}` }, { label: 'Feasibility Analysis' }]} />
            <WorkflowProgress currentStep={4} />
            <section className="animate-fade-in rounded-2xl border border-secondary/20 bg-white p-6 shadow-sm md:p-8">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary"><ShieldCheck size={12} /> Simulated Prototype Data</span>
              <h1 className="text-2xl font-bold text-primary md:text-4xl">Sri Lanka-Specific Feasibility Analysis</h1>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-500 md:text-base">Evaluate whether the selected counterfactual intervention is realistic, affordable and practically achievable for this child.</p>
              <p className="mt-4 rounded-xl bg-surface p-3 text-xs text-slate-600">This feasibility layer supports decision-making and does not replace professional clinical judgment.</p>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Selected Counterfactual Candidate</p><h2 className="mt-1 text-xl font-bold text-primary">{selectedCandidate.title}</h2><p className="mt-1 text-sm font-semibold text-secondary">{selectedMethod?.name} · {selectedMethod?.type}</p></div><span className={`self-start rounded-full px-3 py-1.5 text-xs font-bold ${decisionClass(selectedEvaluation.decision)}`}>{selectedEvaluation.decision}</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Method', selectedMethod?.name], ['Predicted Risk', `${child.riskLevel} · ${percentage(selectedCandidate.originalProbability)}`], ['Estimated Counterfactual Risk', `${selectedCandidate.estimatedRiskLevel} · ${percentage(selectedCandidate.estimatedProbability)}`], ['Estimated Risk Difference', `${Math.round(selectedCandidate.riskReduction * 100)} percentage points`]].map(([label, value]) => <div key={label} className="rounded-xl bg-surface p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 font-bold text-primary">{value}</p></div>)}</div>
              <div className="mt-5 space-y-2">{selectedCandidate.changes.map((change) => <div key={change.featureId} className="flex flex-col gap-2 rounded-xl border border-secondary/10 bg-secondary/[0.04] p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="font-semibold text-primary">{change.featureName}</span><span className="text-slate-600">{change.currentValue} <ArrowRight size={13} className="inline text-secondary" /> <strong className="text-primary">{change.targetValue}</strong></span></div>)}</div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-primary">Child &amp; Household Context</h2><p className="text-xs text-slate-500">Context used by the prototype feasibility rules</p></div><span className="self-start rounded-full bg-secondary/10 px-3 py-1 text-[10px] font-bold text-secondary">Simulated context values</span></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{[
              ['Child Age', `${child.ageMonths} months`], ['District', child.district], ['Household Resource Level', context.householdResourceLevel], ['Food Affordability', context.foodAffordability], ['Local Food Availability', context.localFoodAvailability], ['Clinic Access', context.clinicAccess], ['Programme Eligibility', context.programmeEligibility ? 'Eligible' : 'Not confirmed'], ['Caregiver Availability', context.caregiverAvailability], ['Sanitation Context', context.sanitationContext],
            ].map(([label, value]) => <div key={label} className="rounded-xl bg-surface p-3"><p className="text-[10px] text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-primary">{value}</p></div>)}</div></section>

            <section>
              <div className="mb-4"><h2 className="text-xl font-bold text-primary">Feasibility Checks</h2><p className="text-sm text-slate-500">Seven weighted prototype rules applied to the selected candidate.</p></div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{selectedEvaluation.rules.map((rule) => {
                const Icon = ruleIcons[rule.category] || ShieldCheck;
                return <article key={rule.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Icon size={18} /></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(rule.status)}`}>{rule.status}</span></div><h3 className="mt-4 font-bold text-primary">{rule.name}</h3><p className="mt-1 text-xs leading-relaxed text-slate-400">{rule.description}</p><div className="mt-4 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-wide text-slate-400">Score</p><p className="text-2xl font-bold text-primary">{rule.score}%</p></div><span className="text-[10px] font-semibold text-slate-400">{rule.constraintType}</span></div><p className="mt-3 rounded-xl bg-surface p-3 text-xs leading-relaxed text-slate-600">{rule.reason}</p></article>;
              })}</div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-primary">Transparent Prototype Feasibility Formula</h2>
              <p className="mt-1 text-xs text-slate-500">Weighted rule scores total 100%. Thresholds and weights require domain-expert validation before real-world use.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[
                ['Affordability', feasibilityWeights.affordability],
                ['Local Availability', feasibilityWeights.localAvailability],
                ['Age Suitability', feasibilityWeights.ageSuitability],
                ['Clinic Access', feasibilityWeights.clinicAccess],
                ['Programme Eligibility', feasibilityWeights.programmeEligibility],
                ['Household Practicality', feasibilityWeights.householdPracticality],
                ['Clinical Suitability', feasibilityWeights.clinicalSuitability],
              ].map(([label, weight]) => <div key={label} className="flex items-center justify-between rounded-xl bg-surface p-3 text-xs"><span className="font-semibold text-primary">{label}</span><span className="font-bold text-secondary">{Math.round(weight * 100)}%</span></div>)}</div>
              <p className="mt-4 rounded-xl bg-secondary/[0.05] p-3 text-xs leading-relaxed text-slate-600">Feasibility = Affordability × 0.20 + Local Availability × 0.15 + Age Suitability × 0.20 + Clinic Access × 0.15 + Programme Eligibility × 0.10 + Household Practicality × 0.10 + Clinical Suitability × 0.10.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600"><span className="rounded-full bg-success/10 px-2.5 py-1">80–100 High</span><span className="rounded-full bg-warning/10 px-2.5 py-1">60–79 Moderate</span><span className="rounded-full bg-danger/10 px-2.5 py-1">40–59 Low</span><span className="rounded-full bg-slate-100 px-2.5 py-1">Below 40 Very Low</span></div>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-danger/15 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Lock size={18} className="text-danger" /><h2 className="font-bold text-primary">Hard Constraints</h2></div><p className="mb-4 text-xs text-slate-500">Hard constraint failure may reject the candidate.</p><div className="space-y-2">{selectedEvaluation.rules.filter((rule) => rule.constraintType === 'Hard constraint').map((rule) => <div key={rule.id} className="flex items-center justify-between rounded-xl bg-surface p-3"><span className="text-sm font-semibold text-primary">{rule.name}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(rule.status)}`}>{rule.status}</span></div>)}</div></div>
              <div className="rounded-2xl border border-warning/15 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-warning" /><h2 className="font-bold text-primary">Soft Constraints</h2></div><p className="mb-4 text-xs text-slate-500">Soft constraints reduce feasibility but may not automatically reject the candidate.</p><div className="space-y-2">{selectedEvaluation.rules.filter((rule) => rule.constraintType === 'Soft constraint').map((rule) => <div key={rule.id} className="flex items-center justify-between rounded-xl bg-surface p-3"><span className="text-sm font-semibold text-primary">{rule.name}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(rule.status)}`}>{rule.status}</span></div>)}</div></div>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
              <div className="rounded-2xl border border-secondary/20 bg-white p-6 text-center shadow-sm lg:col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-secondary">Prototype Feasibility Score</p><div className="relative mx-auto mt-4 flex h-48 w-48 items-center justify-center rounded-full bg-surface"><div className="absolute inset-3 rounded-full" style={{ background: `conic-gradient(#6C5CE7 ${selectedEvaluation.overallFeasibilityScore}%, #E2E8F0 ${selectedEvaluation.overallFeasibilityScore}% 100%)` }} /><div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-sm"><p className="text-4xl font-bold text-primary">{selectedEvaluation.overallFeasibilityScore}</p><p className="text-xs text-slate-400">out of 100</p></div></div><p className="mt-4 text-lg font-bold text-primary">{selectedEvaluation.feasibilityLevel} Feasibility</p><span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${decisionClass(selectedEvaluation.decision)}`}>{selectedEvaluation.decision}</span></div>
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-3"><h2 className="font-bold text-primary">Candidate Decision Summary</h2><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{[
                ['Affordable', selectedEvaluation.rules.find((rule) => rule.id === 'affordability')?.status], ['Age appropriate', selectedEvaluation.rules.find((rule) => rule.id === 'age-suitability')?.status], ['Clinic accessible', selectedEvaluation.rules.find((rule) => rule.id === 'clinic-access')?.status], ['Programme eligible', selectedEvaluation.rules.find((rule) => rule.id === 'programme-eligibility')?.status], ['Hard constraints', selectedEvaluation.hardConstraintStatus], ['Clinical review', selectedEvaluation.clinicalReview],
              ].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-xl bg-surface p-3 text-sm"><span className="text-slate-500">{label}</span><span className="font-bold text-primary">{value}</span></div>)}</div><p className="mt-4 rounded-xl bg-secondary/[0.05] p-3 text-xs leading-relaxed text-slate-600">Scores and decisions are simulated prototype outputs and have not been clinically validated.</p></div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><ClipboardCheck size={18} className="text-secondary" /><div><h2 className="font-bold text-primary">Candidate Intervention Mapping</h2><p className="text-xs text-slate-500">Human-friendly decision-support actions without medical prescriptions</p></div></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{selectedEvaluation.mappedInterventions.map(({ change, action }) => <div key={change.featureId} className="rounded-xl border border-secondary/10 bg-secondary/[0.04] p-4"><p className="text-xs font-bold uppercase tracking-wide text-secondary">{change.featureName}: {change.currentValue} → {change.targetValue}</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{action}</p></div>)}</div></section>

            {hasDietChange && <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><Utensils size={18} className="text-secondary" /><div><h2 className="font-bold text-primary">Illustrative Local Food Categories</h2><p className="text-xs text-slate-500">Examples for professional adaptation, not a fixed prescribed diet</p></div></div><div className="grid grid-cols-1 gap-4 md:grid-cols-3">{[
              ['Affordable protein options', ['egg', 'dhal / pulses', 'small fish where locally available']], ['Energy-rich foods', ['rice', 'legumes', 'age-appropriate local staples']], ['Micronutrient-supporting foods', ['leafy vegetables', 'locally available fruits']],
            ].map(([title, foods]) => <div key={title} className="rounded-xl bg-surface p-4"><p className="text-sm font-bold text-primary">{title}</p><ul className="mt-2 space-y-1 text-xs text-slate-600">{foods.map((food) => <li key={food}>• {food}</li>)}</ul></div>)}</div><p className="mt-4 text-xs text-slate-400">Food examples are illustrative prototype suggestions and should be adapted by qualified nutrition professionals.</p></section>}

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2"><h2 className="font-bold text-primary">Before / After Feasibility Filtering</h2><p className="text-xs text-slate-500">Contribution of the simulated feasibility layer</p><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={filterChartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => [`${value} candidates`, 'Count']} /><Bar dataKey="value" radius={[6, 6, 0, 0]}>{filterChartData.map((item) => <Cell key={item.name} fill={item.color} />)}</Bar></BarChart></ResponsiveContainer></div></div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-3"><h2 className="font-bold text-primary">Why the Feasibility Layer Matters</h2><div className="mt-5 flex flex-col gap-2">{['Counterfactual Candidate', 'Sri Lanka-Specific Constraints', 'PASS / CAUTION / FAIL', 'Prototype Feasibility Score', 'Feasible Candidate Set', 'Intervention Ranking'].map((step, index, items) => <div key={step} className="flex flex-col items-center"><div className={`w-full rounded-xl px-4 py-3 text-center text-sm font-semibold ${index === 1 ? 'bg-secondary text-white' : 'bg-surface text-primary'}`}>{step}</div>{index < items.length - 1 && <span className="py-1 text-secondary">↓</span>}</div>)}</div></div>
            </section>

            <section className="rounded-2xl border border-danger/20 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="font-bold text-primary">Rejected Counterfactual Guardrail Examples</h2><p className="text-xs text-slate-500">Protected/context features the engine must never directly change</p></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{rejectedCounterfactualExamples.map((example) => <article key={example.id} className="rounded-xl border border-danger/15 bg-danger/[0.03] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-primary">{example.featureName}</p><p className="mt-1 text-sm text-slate-600">{example.currentValue} → {example.targetValue}</p></div><span className="rounded-full bg-danger/10 px-2.5 py-1 text-[10px] font-bold text-danger">REJECTED</span></div><p className="mt-3 text-xs leading-relaxed text-slate-600">{example.reason}</p><button type="button" onClick={() => setReasonDetail({ type: 'example', data: example })} className="mt-3 text-xs font-bold text-secondary hover:underline">View Reason</button></article>)}</div></section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-primary">Feasibility-Filtered Candidate Comparison</h2><p className="mb-4 text-xs text-slate-500">Generated options re-ranked by prototype feasibility and estimated risk difference. Caution options remain visible for review but do not automatically enter the final ranking.</p><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead><tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400"><th className="pb-3">Rank</th><th className="pb-3">Method</th><th className="pb-3">Counterfactual Candidate</th><th className="pb-3">Estimated Risk Difference</th><th className="pb-3">Prototype Feasibility Score</th><th className="pb-3">Hard Constraint Status</th><th className="pb-3">Clinical Review</th><th className="pb-3">Decision</th><th className="pb-3">Reason</th></tr></thead><tbody>{evaluations.map((item) => { const method = counterfactualMethods.find((entry) => entry.id === item.candidate.method); return <tr key={item.candidate.id} className="border-b border-slate-50"><td className="py-3 font-bold text-primary">#{item.feasibilityRank}</td><td className="py-3">{method?.name}</td><td className="max-w-[260px] py-3 font-medium text-primary">{item.candidate.title}</td><td className="py-3">{Math.round(item.candidate.riskReduction * 100)} pp</td><td className="py-3 font-bold text-primary">{item.overallFeasibilityScore}%</td><td className="py-3">{item.hardConstraintStatus}</td><td className="py-3">{item.clinicalReview}</td><td className="py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${decisionClass(item.decision)}`}>{item.decision}</span></td><td className="py-3">{(item.cautions.length || item.hardFailures.length) ? <button type="button" onClick={() => setReasonDetail({ type: 'evaluation', data: item })} className="text-xs font-bold text-secondary hover:underline">View Reason</button> : <span className="text-xs text-slate-400">—</span>}</td></tr>; })}</tbody></table></div></section>

            {recommended && <section className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/[0.08] to-white p-6 shadow-sm"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="max-w-3xl"><span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Recommended Prototype Candidate</span><h2 className="mt-3 text-xl font-bold text-primary">{recommended.candidate.title}</h2><p className="mt-1 text-sm font-semibold text-secondary">{counterfactualMethods.find((method) => method.id === recommended.candidate.method)?.name}</p><p className="mt-3 text-sm leading-relaxed text-slate-600">Selected because it provides {Math.round(recommended.candidate.riskReduction * 100)} percentage points of estimated risk reduction with {recommended.feasibilityLevel.toLowerCase()} prototype feasibility and only {recommended.candidate.sparsity} actionable feature change{recommended.candidate.sparsity === 1 ? '' : 's'}.</p></div><div className="shrink-0 rounded-2xl bg-white p-4 text-center shadow-sm"><p className="text-3xl font-bold text-primary">{recommended.overallFeasibilityScore}%</p><p className="text-xs text-slate-500">Prototype feasibility</p></div></div></section>}

            <section className="rounded-2xl border border-secondary/20 bg-white p-6 shadow-sm"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-primary">Feasible Candidate Set Ready</h2><p className="mt-1 text-sm text-slate-500">Continue with {feasibleCandidates.length} candidates that passed without soft-constraint cautions. {cautionCandidates.length} caution candidate{cautionCandidates.length === 1 ? '' : 's'} remain visible for healthcare review but are not automatically ranked.</p></div><button type="button" disabled={!recommended} onClick={continueToRanking} className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-secondary/25 disabled:bg-slate-300">Continue to Intervention Ranking <ArrowRight size={16} /></button></div></section>

            <PrototypeDisclaimer />
          </>
        )}
      </main>

      {reasonDetail && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm" onClick={() => setReasonDetail(null)}><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-fade-in" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-secondary">Why Was This Filtered?</p><h2 className="mt-1 text-lg font-bold text-primary">{reasonDetail.type === 'example' ? reasonDetail.data.candidate : reasonDetail.data.candidate.title}</h2></div><button type="button" onClick={() => setReasonDetail(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>{reasonDetail.type === 'example' ? <div className="mt-5 space-y-3 text-sm">{[['Failed Rule', reasonDetail.data.failedRule], ['Reason', reasonDetail.data.reason], ['Constraint Type', reasonDetail.data.constraintType], ['Suggested Alternative', reasonDetail.data.suggestedAlternative]].map(([label, value]) => <div key={label} className="rounded-xl bg-surface p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 leading-relaxed text-slate-600">{value}</p></div>)}</div> : <div className="mt-5 space-y-3">{[...reasonDetail.data.hardFailures, ...reasonDetail.data.cautions].map((rule) => <div key={rule.id} className="rounded-xl bg-surface p-4"><div className="flex items-center justify-between"><p className="font-bold text-primary">{rule.name}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(rule.status)}`}>{rule.status}</span></div><p className="mt-2 text-sm leading-relaxed text-slate-600">{rule.reason}</p><p className="mt-2 text-xs text-secondary"><strong>Suggested alternative:</strong> {rule.suggestedAlternative}</p><p className="mt-1 text-[10px] text-slate-400">{rule.constraintType}</p></div>)}</div>}<button type="button" onClick={() => setReasonDetail(null)} className="mt-5 w-full rounded-full bg-secondary py-2.5 text-sm font-semibold text-white">Close</button></div></div>}
    </div>
  );
}
