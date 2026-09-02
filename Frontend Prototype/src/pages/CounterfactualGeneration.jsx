import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BarChart3, Bot, CheckCircle2, GitBranch, Layers, Lock,
  LogOut, ShieldCheck, Sparkles, Target, X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import MetricCard from '../components/cards/MetricCard';
import Breadcrumbs from '../components/intervention/Breadcrumbs';
import Component4Nav from '../components/intervention/Component4Nav';
import PrototypeDisclaimer from '../components/intervention/PrototypeDisclaimer';
import WorkflowProgress from '../components/intervention/WorkflowProgress';
import { useApp } from '../context/AppContext';
import { interventionChildren } from '../data/interventionData';
import {
  counterfactualMethods,
  defaultCounterfactualCandidateLimit,
  generateCounterfactualCandidates,
  rankCounterfactualCandidates,
} from '../data/counterfactualData';

const methodColors = { wachter: '#0B1F4D', dice: '#6C5CE7', face: '#27AE60' };

function highestFeasibility(candidates) {
  if (candidates.some((candidate) => candidate.feasibilityPreview === 'High')) return 'High';
  if (candidates.some((candidate) => candidate.feasibilityPreview === 'Medium')) return 'Medium';
  return candidates.length ? 'Low' : '—';
}

function percentage(value) {
  return `${Math.round(value * 100)}%`;
}

export default function CounterfactualGeneration() {
  const { childId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useApp();
  const child = interventionChildren.find((item) => item.childId === childId);
  const actionableFactors = useMemo(
    () => (child?.riskFactors || []).filter((factor) => factor.actionable),
    [child]
  );
  const protectedFactors = useMemo(
    () => (child?.riskFactors || []).filter((factor) => !factor.actionable),
    [child]
  );
  const requestedIds = location.state?.selectedFactorIds;
  const selectedFactors = useMemo(
    () => Array.isArray(requestedIds)
      ? actionableFactors.filter((factor) => requestedIds.includes(factor.id))
      : actionableFactors,
    [requestedIds, actionableFactors]
  );

  const [methodFilter, setMethodFilter] = useState('all');
  const [targetRisk, setTargetRisk] = useState('medium');
  const [maxChanges, setMaxChanges] = useState(2);
  const [candidateLimit, setCandidateLimit] = useState(defaultCounterfactualCandidateLimit);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [results, setResults] = useState([]);
  const [detailCandidate, setDetailCandidate] = useState(null);

  const clearResults = () => {
    setGenerated(false);
    setResults([]);
  };

  const generate = () => {
    if (!child || selectedFactors.length === 0 || generating) return;
    setGenerating(true);
    setGenerated(false);
    setResults([]);
    window.setTimeout(() => {
      const candidates = generateCounterfactualCandidates(child, selectedFactors)
        .filter((candidate) => methodFilter === 'all' || candidate.method === methodFilter)
        .filter((candidate) => candidate.sparsity <= maxChanges)
        .filter((candidate) => targetRisk === 'medium'
          ? ['Medium', 'Low'].includes(candidate.estimatedRiskLevel)
          : candidate.estimatedRiskLevel === 'Low');
      setResults(rankCounterfactualCandidates(candidates).slice(0, candidateLimit));
      setGenerating(false);
      setGenerated(true);
    }, 750);
  };

  const validCount = results.filter((candidate) => candidate.validity >= 0.90).length;
  const bestReduction = results.length
    ? Math.max(...results.map((candidate) => candidate.riskReduction))
    : 0;
  const lowestChanges = results.length
    ? Math.min(...results.map((candidate) => candidate.sparsity))
    : 0;
  const bestCandidate = results[0];

  const comparisonRows = counterfactualMethods
    .map((method) => {
      const candidates = results.filter((candidate) => candidate.method === method.id);
      if (!candidates.length) return null;
      const average = (key) => candidates.reduce((sum, candidate) => sum + candidate[key], 0) / candidates.length;
      return {
        ...method,
        candidates: candidates.length,
        validity: average('validity'),
        proximity: average('proximity'),
        sparsity: average('sparsity'),
        diversity: average('diversity'),
        feasibility: highestFeasibility(candidates),
        bestReduction: Math.max(...candidates.map((candidate) => candidate.riskReduction)),
      };
    })
    .filter(Boolean);

  const resetConstraints = () => {
    setMethodFilter('all');
    setTargetRisk('medium');
    setMaxChanges(2);
    setCandidateLimit(defaultCounterfactualCandidateLimit);
    clearResults();
  };

  const selectCandidate = (candidate) => {
    navigate(`/component/personalized-nutrition/child/${child.childId}/feasibility?candidate=${candidate.id}`, {
      state: {
        selectedCandidate: candidate,
        generatedCandidates: results,
        selectedFactorIds: selectedFactors.map((factor) => factor.id),
      },
    });
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md"><Bot size={20} /></div>
            <div><p className="text-sm font-bold text-primary">FedNutri-XAI</p><p className="text-[11px] text-slate-500">Component 04</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/component/personalized-nutrition/child/${childId}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50"><ArrowLeft size={14} /> Risk Analysis</Link>
            <Link to="/component/personalized-nutrition/dashboard" className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50 sm:inline-flex">Dashboard</Link>
            <button type="button" onClick={() => { logout(); navigate('/login'); }} className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50 md:inline-flex"><LogOut size={14} /> Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6 md:py-10">
        {!child ? (
          <section className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-primary">Child Record Not Found</h1>
            <p className="mt-2 text-sm text-slate-500">No simulated record matches {childId}.</p>
            <Link to="/component/personalized-nutrition/dashboard" className="mt-5 inline-flex rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white">Return to Intervention Dashboard</Link>
          </section>
        ) : (
          <>
            <Component4Nav childId={child.childId} current="Counterfactuals" />
            <Breadcrumbs items={[{ label: 'Research Home', to: '/research-home' }, { label: 'Component 04', to: '/component/personalized-nutrition' }, { label: 'Dashboard', to: '/component/personalized-nutrition/dashboard' }, { label: child.childId, to: `/component/personalized-nutrition/child/${child.childId}` }, { label: 'Counterfactual Generation' }]} />
            <WorkflowProgress currentStep={3} />
            <nav className="flex flex-wrap gap-2 text-xs font-semibold">
              <Link to={`/component/personalized-nutrition/child/${child.childId}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-primary"><ArrowLeft size={13} /> Back to Risk Factor Analysis</Link>
              <Link to={`/component/personalized-nutrition/child/${child.childId}`} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-primary">Back to Child Profile</Link>
              <Link to="/component/personalized-nutrition/dashboard" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-primary">Back to Intervention Dashboard</Link>
            </nav>

            <section className="animate-fade-in rounded-2xl border border-secondary/20 bg-white p-6 shadow-sm md:p-8">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary"><GitBranch size={12} /> Simulated Prototype Data</span>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <h1 className="text-2xl font-bold text-primary md:text-4xl">Counterfactual Intervention Generation</h1>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 md:text-base">Explore minimum actionable changes that could move the child&apos;s predicted malnutrition risk toward a lower-risk state.</p>
                </div>
                <span className="self-start rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">Prototype simulation</span>
              </div>
              <p className="mt-5 rounded-xl bg-surface p-3 text-xs leading-relaxed text-slate-600">These outputs represent model-style what-if scenarios for research demonstration and are not causal treatment-effect estimates.</p>
            </section>

            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                ['Child ID', child.childId], ['Condition', child.condition],
                ['Predicted Risk', child.riskLevel], ['Prediction Probability', `${child.probability}%`],
              ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-xl font-bold text-primary">{value}</p></div>)}
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-secondary/15 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-success" /><h2 className="font-bold text-primary">Selected Actionable Factors</h2></div>
                <div className="space-y-2">{selectedFactors.map((factor) => <div key={factor.id} className="flex items-center gap-3 rounded-xl bg-secondary/[0.05] p-3"><CheckCircle2 size={15} className="shrink-0 text-success" /><div><p className="text-sm font-semibold text-primary">{factor.name}</p><p className="text-[11px] text-slate-500">Current: {factor.currentValue}</p></div></div>)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2"><Lock size={18} className="text-slate-500" /><h2 className="font-bold text-primary">Non-Actionable / Context Factors</h2></div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{protectedFactors.map((factor) => <div key={factor.id} className="flex items-center gap-2 rounded-xl bg-surface p-3"><Lock size={14} className="shrink-0 text-slate-400" /><div><p className="text-sm font-semibold text-slate-600">{factor.name}</p><p className="text-[10px] text-slate-400">Fixed: {factor.currentValue}</p></div></div>)}</div>
                <p className="mt-3 text-xs text-slate-400">Non-actionable and context factors are excluded from every generated changes array.</p>
              </div>
            </section>

            {selectedFactors.length === 0 ? (
              <section className="rounded-2xl border border-warning/30 bg-warning/5 p-8 text-center">
                <Lock size={36} className="mx-auto text-warning" />
                <h2 className="mt-3 font-bold text-primary">No actionable features selected</h2>
                <p className="mt-2 text-sm text-slate-600">Return to Risk Factor Analysis and select at least one eligible factor.</p>
                <Link to={`/component/personalized-nutrition/child/${child.childId}`} className="mt-5 inline-flex rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white">Back to Risk Factor Analysis</Link>
              </section>
            ) : (
              <>
                <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                  <div className="mb-5"><h2 className="font-bold text-primary">Simulated Wachter / DiCE / FACE Method Comparison</h2><p className="text-xs text-slate-500">Method-inspired prototype outputs; canonical Python libraries are not executing in this frontend.</p></div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <button type="button" onClick={() => { setMethodFilter('all'); clearResults(); }} className={`rounded-2xl border p-4 text-left transition ${methodFilter === 'all' ? 'border-secondary bg-secondary/[0.06] ring-1 ring-secondary/20' : 'border-slate-100 bg-surface'}`}><Layers size={20} className="text-secondary" /><p className="mt-3 font-bold text-primary">Compare All Methods</p><p className="mt-1 text-xs text-slate-500">Review Wachter, DiCE and FACE together.</p></button>
                    {counterfactualMethods.map((method) => <button key={method.id} type="button" onClick={() => { setMethodFilter(method.id); clearResults(); }} className={`rounded-2xl border p-4 text-left transition ${methodFilter === method.id ? 'border-secondary bg-secondary/[0.06] ring-1 ring-secondary/20' : 'border-slate-100 bg-surface'}`}><GitBranch size={20} style={{ color: methodColors[method.id] }} /><p className="mt-3 font-bold text-primary">{method.name}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-secondary">{method.type}</p><p className="mt-2 text-xs leading-relaxed text-slate-500">{method.description}</p></button>)}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
                    <div><label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Desired Target Risk</label><select value={targetRisk} onChange={(event) => { setTargetRisk(event.target.value); clearResults(); }} className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm"><option value="medium">Medium or Lower</option><option value="low">Low Only</option></select></div>
                    <div><label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Maximum Features to Change</label><div className="grid grid-cols-3 gap-1.5">{[1, 2, 3].map((value) => <button key={value} type="button" onClick={() => { setMaxChanges(value); clearResults(); }} className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${maxChanges === value ? 'bg-secondary text-white' : 'border border-slate-200 bg-surface text-slate-600'}`}>{value}</button>)}</div><p className="mt-2 text-[10px] leading-relaxed text-slate-400">Sparsity control: fewer changes are easier to interpret and may be easier to implement.</p></div>
                    <div><label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Number of Intervention Options</label><select value={candidateLimit} onChange={(event) => { setCandidateLimit(Number(event.target.value)); clearResults(); }} className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm"><option value={3}>3</option><option value={5}>5</option></select><p className="mt-2 text-[10px] leading-relaxed text-slate-400">Each option is a different possible intervention pathway for the same child.</p></div>
                  </div>

                  <button type="button" onClick={generate} disabled={generating} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-secondary/25 transition hover:opacity-95 disabled:cursor-wait disabled:opacity-70"><Sparkles size={16} /> {generating ? 'Generating counterfactual candidates...' : 'Generate Counterfactual Candidates'}</button>
                </section>

                {generated && results.length === 0 && (
                  <section className="rounded-2xl border border-warning/30 bg-white p-8 text-center shadow-sm"><Target size={36} className="mx-auto text-warning" /><h2 className="mt-3 font-bold text-primary">No simulated counterfactual candidates satisfy the selected constraints.</h2><p className="mt-2 text-sm text-slate-500">Reset the controls and generate the prototype candidates again.</p><button type="button" onClick={resetConstraints} className="mt-5 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white">Reset Settings</button></section>
                )}

                {generated && results.length > 0 && (
                  <div className="space-y-6 animate-fade-in">
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                      <MetricCard title="Options Generated" value={results.length} subtitle="Deterministic what-if scenarios" icon={GitBranch} />
                      <MetricCard title="Prototype Validity" value={`${validCount}/${results.length}`} subtitle="Options reaching target" icon={CheckCircle2} accent="#27AE60" />
                      <MetricCard title="Best Estimated Risk Difference" value={`${Math.round(bestReduction * 100)} pp`} subtitle="Current minus estimated" icon={Target} accent="#E74C3C" />
                      <MetricCard title="Lowest Feature Changes" value={lowestChanges} subtitle="Minimum candidate sparsity" icon={Layers} />
                      <MetricCard title="Highest Feasibility Preview" value={highestFeasibility(results)} subtitle="Preliminary simulated label" icon={ShieldCheck} accent="#27AE60" />
                    </section>

                    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <h2 className="font-bold text-primary">Counterfactual Quality Comparison</h2>
                      <p className="mb-4 text-xs text-slate-500">Counterfactual methods are compared using intervention quality metrics rather than prediction accuracy.</p>
                      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400"><th className="pb-3">Method</th><th className="pb-3">Number of Options</th><th className="pb-3">Prototype Validity</th><th className="pb-3">Average Proximity</th><th className="pb-3">Average Feature Changes</th><th className="pb-3">Prototype Diversity Score</th><th className="pb-3">Feasibility Preview</th><th className="pb-3">Best Estimated Risk Difference</th></tr></thead><tbody>{comparisonRows.map((row) => <tr key={row.id} className="border-b border-slate-50"><td className="py-3 font-bold text-primary">{row.name}</td><td className="py-3">{row.candidates}</td><td className="py-3">{percentage(row.validity)}</td><td className="py-3">{percentage(row.proximity)}</td><td className="py-3">{row.sparsity.toFixed(1)}</td><td className="py-3">{percentage(row.diversity)}</td><td className="py-3"><span className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">{row.feasibility}</span></td><td className="py-3 font-semibold text-primary">{Math.round(row.bestReduction * 100)} pp</td></tr>)}</tbody></table></div>
                    </section>

                    <details className="rounded-2xl border border-secondary/20 bg-white p-5 shadow-sm">
                      <summary className="cursor-pointer font-bold text-primary">How are these metrics calculated?</summary>
                      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          ['Prototype Validity', 'Whether an option reaches the selected prediction target. Validity rate = valid options ÷ total generated options × 100.'],
                          ['Prototype Proximity', 'Closeness to the original child profile. Proximity = 1 − normalized feature distance.'],
                          ['Sparsity / Feature Changes', 'The number of actionable features modified in the intervention option.'],
                          ['Prototype Diversity Score', 'How different the generated intervention options are from one another.'],
                          ['Prototype Feasibility Score', 'Weighted practicality under the simulated Sri Lanka-specific constraints.'],
                          ['Estimated Risk Difference', 'Current predicted probability minus estimated counterfactual probability, expressed in percentage points.'],
                          ['Prototype Ranking Score', 'Weighted combination of normalized risk difference, feasibility, proximity, sparsity preference, practicality, and clinical readiness.'],
                        ].map(([label, description]) => <div key={label} className="rounded-xl bg-surface p-3"><p className="font-bold text-secondary">{label}</p><p className="mt-1 leading-relaxed text-slate-600">{description}</p></div>)}
                      </div>
                    </details>

                    {bestCandidate && (
                      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-secondary" /><div><h2 className="font-bold text-primary">Risk Change Visualization</h2><p className="text-xs text-slate-500">Top-ranked simulated candidate</p></div></div>
                        <div className="h-[190px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: 'Predicted Risk', value: Math.round(bestCandidate.originalProbability * 100), color: '#E74C3C' }, { name: 'Estimated Risk', value: Math.round(bestCandidate.estimatedProbability * 100), color: '#6C5CE7' }]} layout="vertical" margin={{ top: 5, right: 35, left: 45, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} /><XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={120} tick={{ fill: '#0B1F4D', fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}%`, 'Model-estimated risk']} /><Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>{[0, 1].map((index) => <Cell key={index} fill={index === 0 ? '#E74C3C' : '#6C5CE7'} />)}</Bar></BarChart></ResponsiveContainer></div>
                      </section>
                    )}

                    {results.some((candidate) => candidate.guardrailExample) && (
                      <section className="rounded-2xl border border-danger/20 bg-danger/[0.04] p-5">
                        <h2 className="font-bold text-primary">Guardrail Demonstration Included</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">One deliberately unrealistic option attempts to change a constrained household context feature. It remains visible here to demonstrate that generation is not approval; feasibility analysis must reject it before ranking.</p>
                      </section>
                    )}

                    <section>
                      <div className="mb-4"><h2 className="text-xl font-bold text-primary">Generated Intervention Options</h2><p className="text-sm text-slate-500">Five deterministic candidates are shown before feasibility filtering. A low estimated risk alone does not make an option feasible.</p></div>
                      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">{results.map((candidate) => {
                        const method = counterfactualMethods.find((item) => item.id === candidate.method);
                        return <article key={candidate.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white">#{candidate.rank}</span><span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white" style={{ background: methodColors[candidate.method] }}>{method.name}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">{method.type}</span></div><h3 className="mt-3 font-bold text-primary">{candidate.title}</h3></div><span className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold text-success">{candidate.feasibilityPreview} feasibility</span></div><div className="mt-4 space-y-2">{candidate.changes.map((change) => <div key={change.featureId} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2.5 text-sm"><span className="font-medium text-primary">{change.featureName}</span><span className="text-xs text-slate-500">{change.currentValue} <ArrowRight size={12} className="inline text-secondary" /> <strong className="text-primary">{change.targetValue}</strong></span></div>)}</div><div className="mt-4 rounded-xl bg-secondary/[0.05] p-3"><div className="flex items-center justify-between text-sm"><span className="text-slate-500">Estimated prediction change</span><span className="font-bold text-primary">{percentage(candidate.originalProbability)} → {percentage(candidate.estimatedProbability)}</span></div><div className="mt-1 flex items-center justify-between text-sm"><span className="text-slate-500">Predicted risk</span><span className="font-semibold text-primary">{child.riskLevel} → {candidate.estimatedRiskLevel}</span></div><div className="mt-1 flex items-center justify-between text-sm"><span className="text-slate-500">Estimated risk reduction</span><span className="font-bold text-success">{Math.round(candidate.riskReduction * 100)} percentage points</span></div></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">{[['Validity', percentage(candidate.validity)], ['Proximity', percentage(candidate.proximity)], ['Sparsity', `${candidate.sparsity} change${candidate.sparsity === 1 ? '' : 's'}`], ['Diversity', percentage(candidate.diversity)]].map(([label, value]) => <div key={label} className="rounded-xl bg-surface p-2.5"><p className="text-slate-400">{label}</p><p className="mt-1 font-bold text-primary">{value}</p></div>)}</div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => setDetailCandidate(candidate)} className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-slate-50">View Details</button><button type="button" onClick={() => selectCandidate(candidate)} className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-secondary/20">Select for Feasibility Analysis</button></div></article>;
                      })}</div>
                    </section>

                    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"><div className="flex items-start gap-3"><Layers size={20} className="mt-0.5 shrink-0 text-secondary" /><div><h2 className="font-bold text-primary">Why Compare Multiple Counterfactual Methods?</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Wachter provides a simple baseline. DiCE emphasizes diversity of alternatives. FACE emphasizes realistic and plausible pathways. The best method is not selected using prediction accuracy alone.</p><p className="mt-3 text-xs font-semibold text-primary">Evaluation considers: Validity · Proximity · Sparsity · Diversity · Feasibility · Expected Risk Reduction · Clinical Coherence</p></div></div></section>
                  </div>
                )}
              </>
            )}

            <PrototypeDisclaimer />
          </>
        )}
      </main>

      {detailCandidate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm" onClick={() => setDetailCandidate(null)}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-fade-in" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-secondary">Counterfactual Candidate Detail</p><h2 className="mt-1 text-xl font-bold text-primary">{detailCandidate.title}</h2></div><button type="button" onClick={() => setDetailCandidate(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><div className="mt-5 rounded-xl bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Method</p><p className="mt-1 font-bold text-primary">{counterfactualMethods.find((method) => method.id === detailCandidate.method)?.name}</p><p className="mt-1 text-sm text-slate-600">{counterfactualMethods.find((method) => method.id === detailCandidate.method)?.description}</p></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl border border-slate-100 p-3"><p className="text-xs text-slate-400">Original state</p><p className="mt-1 font-semibold text-primary">{child.riskLevel} · {percentage(detailCandidate.originalProbability)}</p></div><div className="rounded-xl border border-slate-100 p-3"><p className="text-xs text-slate-400">Estimated state</p><p className="mt-1 font-semibold text-primary">{detailCandidate.estimatedRiskLevel} · {percentage(detailCandidate.estimatedProbability)}</p></div></div><div className="mt-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Proposed feature changes</p><div className="mt-2 space-y-2">{detailCandidate.changes.map((change) => <div key={change.featureId} className="flex items-center justify-between rounded-xl bg-secondary/[0.05] p-3 text-sm"><span className="font-semibold text-primary">{change.featureName}</span><span className="text-slate-600">{change.currentValue} → {change.targetValue}</span></div>)}</div></div><div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">{[['Validity', percentage(detailCandidate.validity)], ['Proximity', percentage(detailCandidate.proximity)], ['Sparsity', detailCandidate.sparsity], ['Diversity', percentage(detailCandidate.diversity)], ['Feasibility', detailCandidate.feasibilityPreview]].map(([label, value]) => <div key={label} className="rounded-xl bg-surface p-3"><p className="text-[10px] text-slate-400">{label}</p><p className="mt-1 font-bold text-primary">{value}</p></div>)}</div><div className="mt-4 rounded-xl bg-secondary/10 p-4"><p className="text-xs font-bold uppercase tracking-wide text-secondary">Research Interpretation</p><p className="mt-2 text-sm leading-relaxed text-primary">This counterfactual suggests that changing {detailCandidate.sparsity} actionable factor{detailCandidate.sparsity === 1 ? '' : 's'} is associated with a lower model-estimated risk in the simulated prototype scenario.</p><p className="mt-2 text-xs font-semibold text-danger">This does not prove that the intervention will cause the same clinical risk reduction.</p></div><button type="button" onClick={() => selectCandidate(detailCandidate)} className="mt-5 w-full rounded-full bg-secondary py-2.5 text-sm font-semibold text-white">Select for Feasibility Analysis</button></div></div>
      )}
    </div>
  );
}
