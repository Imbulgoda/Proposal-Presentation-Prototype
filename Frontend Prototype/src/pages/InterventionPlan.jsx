import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, Bot, CheckCircle2, ClipboardCheck, Clock3,
  FileText, Lightbulb, LogOut, MessageSquareText, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PDFExport from '../components/export/PDFExport';
import PrintReport from '../components/export/PrintReport';
import Breadcrumbs from '../components/intervention/Breadcrumbs';
import Component4Nav from '../components/intervention/Component4Nav';
import PrototypeDisclaimer from '../components/intervention/PrototypeDisclaimer';
import WorkflowProgress from '../components/intervention/WorkflowProgress';
import { useApp } from '../context/AppContext';
import { interventionChildren } from '../data/interventionData';
import { counterfactualMethods, defaultCounterfactualCandidateLimit, generateCounterfactualCandidates, rankCounterfactualCandidates } from '../data/counterfactualData';
import { evaluateCandidateSet } from '../data/feasibilityData';
import {
  planIdForChild, rankInterventionCandidates, rankingExplanation,
  supportingInterventionActions,
} from '../data/interventionPlanningData';

const reviewOptions = [
  { label: 'Approve for Demonstration', status: 'Approved for Demonstration', style: 'bg-success text-white' },
  { label: 'Needs Revision', status: 'Needs Revision', style: 'bg-warning text-white' },
  { label: 'Reject Candidate', status: 'Candidate Rejected', style: 'bg-danger text-white' },
];

function methodName(id) {
  return counterfactualMethods.find((method) => method.id === id)?.name || id;
}

function statusStyle(status) {
  if (status === 'Approved for Demonstration') return 'bg-success/10 text-success';
  if (status === 'Needs Revision') return 'bg-warning/10 text-warning';
  if (status === 'Candidate Rejected') return 'bg-danger/10 text-danger';
  return 'bg-secondary/10 text-secondary';
}

export default function InterventionPlan() {
  const { childId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout, profile } = useApp();
  const child = interventionChildren.find((item) => item.childId === childId);
  const [reviewStatus, setReviewStatus] = useState('Pending Review');
  const [reviewedAt, setReviewedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [generatedAt] = useState(() => new Date());

  const fallbackRankings = useMemo(() => {
    if (!child) return [];
    const actionable = child.riskFactors.filter((factor) => factor.actionable);
    const candidates = rankCounterfactualCandidates(generateCounterfactualCandidates(child, actionable))
      .slice(0, defaultCounterfactualCandidateLimit);
    return rankInterventionCandidates(evaluateCandidateSet(child, candidates));
  }, [child]);

  const rankedCandidates = location.state?.rankedCandidates || fallbackRankings;
  const requestedCandidateId = searchParams.get('candidate');
  const selectedRanking = rankedCandidates.find((item) => item.candidate.id === requestedCandidateId)
    || location.state?.selectedRanking
    || rankedCandidates[0];
  const alternatives = rankedCandidates.filter((item) => item.candidate.id !== selectedRanking?.candidate.id).slice(0, 2);
  const topFactors = child?.riskFactors.filter((factor) => factor.actionable).slice(0, 3) || [];
  const candidate = selectedRanking?.candidate;
  const primaryAction = selectedRanking?.interventionActions[0];
  const supportingActions = useMemo(() => {
    if (!selectedRanking) return [];
    const mapped = selectedRanking.interventionActions.slice(1);
    const standard = [
      supportingInterventionActions['Clinic Follow-up'],
      supportingInterventionActions['Nutrition Awareness'],
      supportingInterventionActions['Programme Eligibility'],
    ];
    return [...new Set([...mapped, ...standard])].filter((action) => action !== primaryAction).slice(0, 4);
  }, [selectedRanking, primaryAction]);

  const reviewCandidate = (nextStatus) => {
    const timestamp = new Date().toLocaleString();
    setReviewStatus(nextStatus);
    setReviewedAt(timestamp);
    toast.success(`Prototype status updated: ${nextStatus}`);
  };

  const openAlternative = (alternative) => {
    navigate(`/component/personalized-nutrition/child/${child.childId}/plan?candidate=${alternative.candidate.id}`, {
      state: { selectedRanking: alternative, rankedCandidates },
    });
    setReviewStatus('Pending Review');
    setReviewedAt('');
    setNotes('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!child || !selectedRanking) {
    return <div className="min-h-screen bg-surface p-6"><section className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-primary">{!child ? 'Child Record Not Found' : 'No Intervention Plan Selected'}</h1><p className="mt-2 text-sm text-slate-500">{!child ? `No simulated prototype record matches ${childId}.` : 'No feasible candidate could be selected for this child.'}</p><Link to={!child ? '/component/personalized-nutrition/dashboard' : `/component/personalized-nutrition/child/${childId}/ranking`} className="mt-5 inline-flex rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white">{!child ? 'Return to Intervention Dashboard' : 'Back to Ranking'}</Link></section></div>;
  }

  const planId = planIdForChild(child.childId);
  const feasibilityRules = selectedRanking.rules.filter((rule) => ['affordability', 'local-availability', 'age-suitability', 'clinic-access', 'programme-eligibility', 'clinical-suitability'].includes(rule.id));
  const riskChartData = [
    { name: 'Current', value: Math.round(candidate.originalProbability * 100), color: '#0B1F4D' },
    { name: 'Counterfactual', value: Math.round(candidate.estimatedProbability * 100), color: '#6C5CE7' },
  ];
  const reportSections = [
    { heading: 'Report Details', lines: [`Component 04`, `Plan ID: ${planId}`, `Generated: ${generatedAt.toLocaleString()}`, 'Prototype Version: v1.0'] },
    { heading: 'Child and Prediction', lines: [`Child ID: ${child.childId}`, `Condition: ${child.condition}`, `Current predicted risk: ${child.riskLevel} - ${child.probability}%`, `Selected counterfactual method: ${methodName(candidate.method)}`] },
    { heading: 'Modifiable Factors', lines: topFactors.map((factor) => factor.name) },
    { heading: 'Recommended Decision-Support Actions', lines: [primaryAction, ...supportingActions] },
    { heading: 'Feasibility Summary', lines: feasibilityRules.map((rule) => `${rule.name}: ${rule.status} (${rule.score}%)`) },
    { heading: 'Model-Estimated Scenario', lines: [`Estimated counterfactual risk: ${candidate.estimatedRiskLevel} - ${Math.round(candidate.estimatedProbability * 100)}%`, `Estimated risk difference: ${Math.round(candidate.riskReduction * 100)} percentage points`, `Prototype feasibility score: ${selectedRanking.overallFeasibilityScore}/100`, `Prototype ranking score: ${selectedRanking.prototypeRankingScore}/100`] },
    { heading: 'Healthcare Professional Review', lines: [`Prototype healthcare review status: ${reviewStatus}`, `Reviewer role: ${profile?.role || 'Healthcare Professional'}`, `Reviewed: ${reviewedAt || 'Not yet reviewed'}`, `Notes: ${notes || 'No notes added'}`] },
    { heading: 'Disclaimer', lines: ['Research prototype decision-support output. Counterfactual estimates are simulated what-if values and do not replace professional clinical assessment.'] },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="print:hidden sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md"><Bot size={20} /></div><div><p className="text-sm font-bold text-primary">FedNutri-XAI</p><p className="text-[11px] text-slate-500">Component 04</p></div></div><div className="flex items-center gap-2"><Link to={`/component/personalized-nutrition/child/${childId}/ranking`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary"><ArrowLeft size={14} /> Ranking</Link><button type="button" onClick={() => { logout(); navigate('/login'); }} className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary md:inline-flex"><LogOut size={14} /> Logout</button></div></div></header>

      <main id="intervention-plan" className="intervention-plan-print mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6 md:py-10">
        <Component4Nav childId={child.childId} current="Intervention Plan" />
        <Breadcrumbs items={[{ label: 'Research Home', to: '/research-home' }, { label: 'Component 04', to: '/component/personalized-nutrition' }, { label: 'Dashboard', to: '/component/personalized-nutrition/dashboard' }, { label: child.childId, to: `/component/personalized-nutrition/child/${child.childId}` }, { label: 'Personalized Intervention Plan' }]} />
        <section className="rounded-2xl border border-secondary/20 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary"><Sparkles size={12} /> Simulated Prototype Data</span><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Personalized Intervention Plan</p><h1 className="mt-2 text-2xl font-bold text-primary md:text-4xl">{child.childId} · {child.condition}</h1><p className="mt-2 text-sm text-slate-500">Personalized Childhood Malnutrition Intervention in Sri Lanka</p></div><div className="print:hidden flex flex-wrap gap-2"><PDFExport title="FedNutri-XAI - Personalized Intervention Plan" label="Download Intervention Report" loadingLabel="Generating intervention report..." filename={`${planId}.pdf`} sections={reportSections} className="border-secondary text-secondary" /><PrintReport label="Print Plan" className="border-secondary text-secondary" /></div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Generated', generatedAt.toLocaleString()], ['Plan ID', planId], ['Prototype Version', 'v1.0'], ['Review', reviewStatus]].map(([label, value]) => <div key={label} className="rounded-xl bg-surface p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-primary">{value}</p></div>)}</div>
        </section>

        <WorkflowProgress currentStep={reviewStatus === 'Pending Review' ? 6 : 7} reviewCompleted={reviewStatus !== 'Pending Review'} className="print:hidden" />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
          ['Current Predicted Risk', `${child.riskLevel} — ${child.probability}%`],
          ['Counterfactual Method', methodName(candidate.method)],
          ['Estimated Counterfactual Risk', `${candidate.estimatedRiskLevel} — ${Math.round(candidate.estimatedProbability * 100)}%`],
          ['Prototype Ranking Score', `${selectedRanking.prototypeRankingScore}/100`],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-lg font-bold text-primary">{value}</p></div>)}</section>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-primary"><ClipboardCheck size={18} className="text-secondary" /> A. Current Situation</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-surface p-3"><p className="text-xs text-slate-400">Condition</p><p className="mt-1 font-bold text-primary">{child.condition}</p></div><div className="rounded-xl bg-surface p-3"><p className="text-xs text-slate-400">Risk level</p><p className="mt-1 font-bold text-primary">{child.riskLevel}</p></div><div className="rounded-xl bg-surface p-3"><p className="text-xs text-slate-400">Probability</p><p className="mt-1 font-bold text-primary">{child.probability}%</p></div></div><p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Top contributing modifiable factors</p><div className="mt-2 flex flex-wrap gap-2">{topFactors.map((factor) => <span key={factor.id} className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">{factor.name}</span>)}</div></section>

            <section className="rounded-2xl border border-secondary/25 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-primary"><Lightbulb size={18} className="text-secondary" /> B. Priority Intervention</h2><p className="mt-4 rounded-xl bg-secondary/[0.06] p-4 text-base font-semibold leading-relaxed text-primary">{primaryAction}</p><h3 className="mt-5 text-sm font-bold text-primary">C. Supporting Actions</h3><ul className="mt-3 space-y-2">{supportingActions.map((action) => <li key={action} className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />{action}</li>)}</ul></section>

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><h2 className="font-bold text-primary">D. Feasibility Summary</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{feasibilityRules.map((rule) => <div key={rule.id} className="flex items-center justify-between rounded-xl bg-surface p-3"><div><p className="text-sm font-semibold text-primary">{rule.name}</p><p className="text-[10px] text-slate-500">{rule.status}</p></div><span className="font-bold text-secondary">{rule.score}%</span></div>)}</div><div className="mt-4 flex items-center justify-between rounded-xl border border-secondary/15 bg-secondary/[0.04] p-4"><span className="text-sm font-bold text-primary">Overall Feasibility</span><span className="font-bold text-secondary">{selectedRanking.feasibilityLevel} — {selectedRanking.overallFeasibilityScore}%</span></div></section>

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><h2 className="font-bold text-primary">Prototype Action Timeline</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{[
              ['Immediate', ['Healthcare worker review', 'Caregiver counselling']],
              ['Short-Term', ['Implement selected feasible dietary or feeding changes', 'Schedule follow-up']],
              ['Follow-Up', ['Reassess child and record updated measurements', 'Request a new prediction if needed']],
            ].map(([period, actions], index) => <div key={period} className="relative rounded-xl border border-slate-100 bg-surface p-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-white">{index + 1}</span><h3 className="mt-3 font-bold text-primary">{period}</h3><ul className="mt-2 space-y-1.5">{actions.map((action) => <li key={action} className="text-xs leading-relaxed text-slate-600">• {action}</li>)}</ul></div>)}</div><p className="mt-4 text-xs text-slate-500">This prototype timeline does not define medical treatment durations.</p></section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><h2 className="font-bold text-primary">E. Expected Model-Estimated Change</h2><div className="mt-4 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={riskChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" /><Tooltip formatter={(value) => [`${value}%`, 'Predicted risk']} /><Bar dataKey="value" radius={[8, 8, 0, 0]}>{riskChartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div><div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-[10px] uppercase text-slate-400">Before</p><p className="font-bold text-primary">{child.probability}%</p></div><div><p className="text-[10px] uppercase text-slate-400">After</p><p className="font-bold text-secondary">{Math.round(candidate.estimatedProbability * 100)}%</p></div><div><p className="text-[10px] uppercase text-slate-400">Reduction</p><p className="font-bold text-success">{Math.round(candidate.riskReduction * 100)} pp</p></div></div><p className="mt-4 rounded-xl bg-warning/10 p-3 text-xs leading-relaxed text-slate-600">This is a model-estimated counterfactual scenario, not a guaranteed clinical outcome.</p></section>

            <section className="print:hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 font-bold text-primary"><ShieldCheck size={18} className="text-secondary" /> Healthcare Professional Review</h2><div className="mt-4 flex items-center justify-between rounded-xl bg-surface p-4"><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Prototype Healthcare Review Status</p><p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyle(reviewStatus)}`}>{reviewStatus}</p></div><Clock3 size={20} className="text-slate-400" /></div><div className="mt-4 flex flex-wrap gap-2">{reviewOptions.map((option) => <button key={option.status} type="button" onClick={() => reviewCandidate(option.status)} className={`rounded-xl px-3 py-2 text-xs font-bold transition hover:opacity-90 ${option.style}`}>{option.label}</button>)}</div>{reviewedAt && <div className="mt-4 rounded-xl border border-slate-100 p-3 text-xs text-slate-600"><p><strong className="text-primary">Updated:</strong> {reviewedAt}</p><p className="mt-1"><strong className="text-primary">Reviewer role:</strong> {profile?.role || 'Healthcare Professional'}</p><p className="mt-1">Prototype workflow state only; this is not official clinical approval.</p></div>}</section>

            <section className="print:hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><label htmlFor="healthcare-worker-notes" className="flex items-center gap-2 font-bold text-primary"><MessageSquareText size={18} className="text-secondary" /> Healthcare Worker Notes</label><textarea id="healthcare-worker-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} placeholder="Add review notes, practical considerations or reasons for modification..." className="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-surface p-3 text-sm text-slate-700 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/10" /><p className="mt-2 text-[10px] text-slate-400">Notes remain in this page state only and are not sent to a backend.</p></section>

            <section className="rounded-2xl border border-secondary/20 bg-secondary/[0.05] p-6"><h2 className="font-bold text-primary">Why was this intervention ranked first?</h2><p className="mt-3 text-sm leading-relaxed text-slate-600">{rankingExplanation(selectedRanking)}</p><ul className="mt-4 space-y-2 text-xs text-slate-600">{['Strong model-estimated risk difference', `${selectedRanking.feasibilityLevel} feasibility`, `${candidate.changes.length} actionable feature change${candidate.changes.length === 1 ? '' : 's'}`, `${selectedRanking.practicalityLabel} practical household fit`, 'No hard constraint violations'].map((reason) => <li key={reason} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-success" />{reason}</li>)}</ul></section>
          </div>
        </div>

        <section className="intervention-card rounded-3xl border-2 border-secondary/30 bg-white p-6 shadow-lg md:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"><FileText size={12} /> Personalized Intervention Card</span><h2 className="mt-4 text-2xl font-bold text-primary">{child.childId} · {child.condition}</h2></div><div className="rounded-2xl bg-secondary/10 px-5 py-3 text-center"><p className="text-[10px] font-bold uppercase text-secondary">Prototype Score</p><p className="text-2xl font-bold text-secondary">{selectedRanking.prototypeRankingScore}</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
          ['Current Predicted Risk', `${child.riskLevel.toUpperCase()} — ${child.probability}%`],
          ['Main Modifiable Factors', candidate.changes.map((change) => change.featureName).join(', ')],
          ['Feasibility', `${selectedRanking.feasibilityLevel.toUpperCase()} — ${selectedRanking.overallFeasibilityScore}%`],
          ['Estimated Counterfactual Risk', `${Math.round(candidate.estimatedProbability * 100)}%`],
        ].map(([label, value]) => <div key={label} className="rounded-xl bg-surface p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-sm font-bold text-primary">{value}</p></div>)}</div><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-secondary/15 p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Priority Intervention</p><p className="mt-2 text-sm font-semibold leading-relaxed text-primary">{primaryAction}</p></div><div className="rounded-xl border border-secondary/15 p-4"><p className="text-[10px] font-bold uppercase text-slate-400">Supporting Actions</p><p className="mt-2 text-sm font-semibold leading-relaxed text-primary">{supportingActions.slice(0, 2).join(' ')}</p></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs"><span><strong className="text-primary">Method:</strong> {methodName(candidate.method)}</span><span><strong className="text-primary">Healthcare Review Status:</strong> {reviewStatus}</span></div></section>

        <section className="print:hidden"><h2 className="mb-4 text-xl font-bold text-primary">Alternative Feasible Options</h2><div className="grid gap-4 md:grid-cols-2">{alternatives.map((alternative, index) => <article key={alternative.candidate.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-secondary">Alternative {index + 1}</span><span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-primary">#{alternative.interventionRank}</span></div><h3 className="mt-3 font-bold text-primary">{methodName(alternative.candidate.method)}</h3><p className="mt-1 text-sm text-slate-600">{alternative.candidate.changes.map((change) => change.featureName).join(' + ')}</p><div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500"><span>{child.probability}% → {Math.round(alternative.candidate.estimatedProbability * 100)}%</span><span>Feasibility {alternative.overallFeasibilityScore}%</span><span>Score {alternative.prototypeRankingScore}</span></div><button type="button" onClick={() => openAlternative(alternative)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-white">View Alternative <ArrowRight size={13} /></button></article>)}</div></section>

        <PrototypeDisclaimer />

        <nav className="print:hidden flex flex-wrap gap-2"><Link to={`/component/personalized-nutrition/child/${childId}/ranking`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary"><ArrowLeft size={14} /> Back to Ranking</Link><Link to={`/component/personalized-nutrition/child/${childId}/feasibility`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary">Back to Feasibility Analysis</Link><Link to={`/component/personalized-nutrition/child/${childId}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary">Back to Child Profile</Link><Link to="/component/personalized-nutrition/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary">Back to Intervention Dashboard</Link><Link to="/research-home" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary">Back to Research Home</Link></nav>
      </main>
    </div>
  );
}
