import { useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Award, Bot, ListChecks, LogOut, Medal,
  Sparkles, Target,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Breadcrumbs from '../components/intervention/Breadcrumbs';
import Component4Nav from '../components/intervention/Component4Nav';
import PrototypeDisclaimer from '../components/intervention/PrototypeDisclaimer';
import WorkflowProgress from '../components/intervention/WorkflowProgress';
import { interventionChildren } from '../data/interventionData';
import { counterfactualMethods, defaultCounterfactualCandidateLimit, generateCounterfactualCandidates, rankCounterfactualCandidates } from '../data/counterfactualData';
import { evaluateCandidateSet } from '../data/feasibilityData';
import { interventionRankingWeights, rankInterventionCandidates } from '../data/interventionPlanningData';

const criteria = [
  ['Estimated Risk Difference', interventionRankingWeights.estimatedRiskReduction],
  ['Prototype Feasibility Score', interventionRankingWeights.feasibilityScore],
  ['Prototype Proximity', interventionRankingWeights.proximity],
  ['Sparsity Preference', interventionRankingWeights.sparsityPreference],
  ['Practicality', interventionRankingWeights.practicality],
  ['Prototype Clinical Readiness', interventionRankingWeights.clinicalReadiness],
];

const medals = ['bg-amber-100 text-amber-700', 'bg-slate-200 text-slate-600', 'bg-orange-100 text-orange-700'];

function methodName(id) {
  return counterfactualMethods.find((method) => method.id === id)?.name || id;
}

export default function InterventionRanking() {
  const { childId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useApp();
  const child = interventionChildren.find((item) => item.childId === childId);

  const fallbackEvaluations = useMemo(() => {
    if (!child) return [];
    const actionable = child.riskFactors.filter((factor) => factor.actionable);
    const candidates = rankCounterfactualCandidates(generateCounterfactualCandidates(child, actionable))
      .slice(0, defaultCounterfactualCandidateLimit);
    return evaluateCandidateSet(child, candidates).filter((item) =>
      ['FEASIBLE', 'FEASIBLE WITH CLINICAL REVIEW'].includes(item.decision)
    );
  }, [child]);

  const feasibleEvaluations = location.state?.selectedFeasibleCandidates || fallbackEvaluations;
  const rankedCandidates = useMemo(() => rankInterventionCandidates(feasibleEvaluations), [feasibleEvaluations]);
  const topFactors = child?.riskFactors.filter((factor) => factor.actionable).slice(0, 3) || [];

  const openPlan = (rankedCandidate) => {
    navigate(`/component/personalized-nutrition/child/${child.childId}/plan?candidate=${rankedCandidate.candidate.id}`, {
      state: { selectedRanking: rankedCandidate, rankedCandidates },
    });
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md"><Bot size={20} /></div><div><p className="text-sm font-bold text-primary">FedNutri-XAI</p><p className="text-[11px] text-slate-500">Component 04</p></div></div>
          <div className="flex items-center gap-2"><Link to={`/component/personalized-nutrition/child/${childId}/feasibility`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary"><ArrowLeft size={14} /> Feasibility</Link><Link to="/component/personalized-nutrition/dashboard" className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary sm:inline-flex">Dashboard</Link><button type="button" onClick={() => { logout(); navigate('/login'); }} className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary md:inline-flex"><LogOut size={14} /> Logout</button></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6 md:py-10">
        {!child ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-xl font-bold text-primary">Child Record Not Found</h1><p className="mt-2 text-sm text-slate-500">No simulated prototype record matches {childId}.</p><Link to="/component/personalized-nutrition/dashboard" className="mt-5 inline-flex rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white">Return to Intervention Dashboard</Link></section>
        ) : (
          <>
            <Component4Nav childId={child.childId} current="Ranking" />
            <Breadcrumbs items={[{ label: 'Research Home', to: '/research-home' }, { label: 'Component 04', to: '/component/personalized-nutrition' }, { label: 'Dashboard', to: '/component/personalized-nutrition/dashboard' }, { label: child.childId, to: `/component/personalized-nutrition/child/${child.childId}` }, { label: 'Intervention Ranking' }]} />
            <WorkflowProgress currentStep={5} />
            <section className="animate-fade-in rounded-2xl border border-secondary/20 bg-white p-6 shadow-sm md:p-8">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary"><Sparkles size={12} /> Simulated Prototype Data</span>
              <h1 className="text-2xl font-bold text-primary md:text-4xl">Intervention Ranking &amp; Personalized Planning</h1>
              <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-500 md:text-base">Prioritize feasible counterfactual intervention pathways based on model-estimated risk difference, feasibility and practicality.</p>
              <p className="mt-4 rounded-xl bg-surface p-3 text-xs text-slate-600">Ranking scores are simulated research-prototype values and are not clinical treatment scores.</p>
            </section>

            <section className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['Child ID', child.childId], ['Condition', child.condition], ['Predicted Risk', child.riskLevel],
                ['Prediction Probability', `${child.probability}%`], ['Feasible Candidates', rankedCandidates.length],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-surface p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 font-bold text-primary">{value}</p></div>)}
              <div className="sm:col-span-2 lg:col-span-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Top Modifiable Factors</p><div className="mt-2 flex flex-wrap gap-2">{topFactors.map((factor) => <span key={factor.id} className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">{factor.name}</span>)}</div></div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Target size={18} /></div><div><h2 className="font-bold text-primary">Ranking Criteria</h2><p className="text-xs text-slate-500">Weighted components of the Prototype Ranking Score</p></div></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{criteria.map(([label, weight]) => <div key={label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-surface p-3"><span className="text-sm font-semibold text-slate-700">{label}</span><span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white">{Math.round(weight * 100)}%</span></div>)}</div>
              <p className="mt-4 rounded-xl border border-secondary/15 bg-secondary/[0.04] p-3 text-xs leading-relaxed text-slate-600"><strong className="text-primary">Prototype formula:</strong> normalized estimated risk difference × 0.30 + feasibility × 0.30 + proximity × 0.15 + sparsity preference × 0.10 + practicality × 0.10 + clinical readiness × 0.05. Risk difference is normalized against the largest eligible candidate; sparsity preference is 100 for one change, 80 for two, and 60 for three.</p>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2"><Medal size={19} className="text-secondary" /><h2 className="text-xl font-bold text-primary">Top Priorities</h2></div>
              <div className="grid gap-4 lg:grid-cols-3">{rankedCandidates.slice(0, 3).map((item, index) => <article key={item.candidate.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${index === 0 ? 'border-secondary/40 ring-2 ring-secondary/10' : 'border-slate-100'}`}><div className="flex items-center justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${medals[index]}`}><Award size={20} /></span><span className="text-xs font-bold uppercase tracking-wide text-secondary">Priority {index + 1}</span></div><p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">{methodName(item.candidate.method)}</p><h3 className="mt-1 min-h-12 font-bold text-primary">{item.interventionActions[0]}</h3><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-surface p-2"><span className="text-slate-400">Risk change</span><p className="font-bold text-primary">{Math.round(item.candidate.riskReduction * 100)} pp</p></div><div className="rounded-lg bg-surface p-2"><span className="text-slate-400">Feasibility</span><p className="font-bold text-primary">{item.overallFeasibilityScore}%</p></div><div className="rounded-lg bg-surface p-2"><span className="text-slate-400">Changes</span><p className="font-bold text-primary">{item.candidate.changes.length}</p></div><div className="rounded-lg bg-secondary/10 p-2"><span className="text-secondary">Prototype score</span><p className="font-bold text-secondary">{item.prototypeRankingScore}/100</p></div></div><button type="button" onClick={() => openPlan(item)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-secondary/90">View Plan <ArrowRight size={15} /></button></article>)}</div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><ListChecks size={18} /></div><div><h2 className="font-bold text-primary">Ranked Intervention Candidates</h2><p className="text-xs text-slate-500">Automatically sorted by Prototype Ranking Score</p></div></div>
              <div className="overflow-x-auto"><table className="min-w-[1080px] w-full text-left text-xs"><thead className="bg-surface text-[10px] uppercase tracking-wide text-slate-500"><tr>{['Rank', 'Method', 'Candidate', 'Estimated Risk Difference', 'Prototype Feasibility', 'Feature Changes', 'Practicality', 'Clinical Review', 'Prototype Ranking Score', 'Action'].map((head) => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}</tr></thead><tbody>{rankedCandidates.map((item) => <tr key={item.candidate.id} className="border-t border-slate-100"><td className="px-4 py-4 font-bold text-secondary">#{item.interventionRank}</td><td className="px-4 py-4 font-bold text-primary">{methodName(item.candidate.method)}</td><td className="max-w-64 px-4 py-4 text-slate-600">{item.candidate.changes.map((change) => change.featureName).join(' + ')}</td><td className="px-4 py-4 font-semibold text-primary">{Math.round(item.candidate.riskReduction * 100)} pp</td><td className="px-4 py-4">{item.overallFeasibilityScore}%</td><td className="px-4 py-4">{item.candidate.changes.length}</td><td className="px-4 py-4">{item.practicalityLabel}</td><td className="px-4 py-4"><span className="rounded-full bg-warning/10 px-2 py-1 font-semibold text-warning">{item.clinicalReview}</span></td><td className="px-4 py-4"><span className="rounded-lg bg-secondary/10 px-2.5 py-1.5 font-bold text-secondary">{item.prototypeRankingScore}</span></td><td className="px-4 py-4"><button type="button" onClick={() => openPlan(item)} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-2 font-bold text-white">View Plan <ArrowRight size={13} /></button></td></tr>)}</tbody></table></div>
              {rankedCandidates.length === 0 && <div className="p-8 text-center"><p className="font-bold text-primary">No feasible candidate is available under the current prototype constraints.</p><p className="mt-2 text-sm text-slate-500">Generate a different counterfactual candidate or revise the selected actionable factors.</p><Link to={`/component/personalized-nutrition/child/${child.childId}/counterfactual`} className="mt-4 inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white">Back to Counterfactual Generation</Link></div>}
            </section>

            <PrototypeDisclaimer />

            <nav className="flex flex-wrap gap-2"><Link to={`/component/personalized-nutrition/child/${childId}/feasibility`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary"><ArrowLeft size={14} /> Back to Feasibility Analysis</Link><Link to={`/component/personalized-nutrition/child/${childId}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary">Back to Child Profile</Link><Link to="/component/personalized-nutrition/dashboard" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary">Back to Intervention Dashboard</Link><Link to="/research-home" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-primary">Back to Research Home</Link></nav>
          </>
        )}
      </main>
    </div>
  );
}
