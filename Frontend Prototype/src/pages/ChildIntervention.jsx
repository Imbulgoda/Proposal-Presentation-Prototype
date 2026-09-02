import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Baby, BarChart3, Bot, CheckCircle2, Lightbulb, Lock,
  LogOut, MapPin, ShieldCheck, Sparkles, Unlock, User, X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import MetricCard from '../components/cards/MetricCard';
import Breadcrumbs from '../components/intervention/Breadcrumbs';
import Component4Nav from '../components/intervention/Component4Nav';
import PrototypeDisclaimer from '../components/intervention/PrototypeDisclaimer';
import WorkflowProgress from '../components/intervention/WorkflowProgress';
import { useApp } from '../context/AppContext';
import { interventionChildren } from '../data/interventionData';

function riskBadgeClass(risk) {
  if (risk === 'High') return 'bg-danger/10 text-danger';
  if (risk === 'Medium') return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
}

function impactBadgeClass(level) {
  if (level === 'High') return 'bg-danger/10 text-danger';
  if (level === 'Medium') return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
}

function impactColor(level) {
  if (level === 'High') return '#E74C3C';
  if (level === 'Medium') return '#F39C12';
  return '#27AE60';
}

export default function ChildIntervention() {
  const { childId } = useParams();
  const { logout } = useApp();
  const navigate = useNavigate();
  const child = interventionChildren.find((item) => item.childId === childId);
  const sortedFactors = useMemo(
    () => [...(child?.riskFactors || [])].sort((a, b) => b.impactScore - a.impactScore),
    [child]
  );
  const actionableFactors = useMemo(
    () => sortedFactors.filter((factor) => factor.actionable),
    [sortedFactors]
  );
  const contextFactors = useMemo(
    () => sortedFactors.filter((factor) => !factor.actionable),
    [sortedFactors]
  );
  const [selectedFactorIds, setSelectedFactorIds] = useState([]);
  const [detailFactor, setDetailFactor] = useState(null);

  useEffect(() => {
    setSelectedFactorIds(actionableFactors.map((factor) => factor.id));
  }, [childId, actionableFactors]);

  const toggleFactor = (factorId) => {
    setSelectedFactorIds((current) =>
      current.includes(factorId)
        ? current.filter((id) => id !== factorId)
        : [...current, factorId]
    );
  };

  const continueToCounterfactual = () => {
    navigate(`/component/personalized-nutrition/child/${child.childId}/counterfactual`, {
      state: { selectedFactorIds },
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
            <Link to="/component/personalized-nutrition/dashboard" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50"><ArrowLeft size={14} /> Dashboard</Link>
            <Link to="/research-home" className="hidden rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50 sm:inline-flex">Research Home</Link>
            <button type="button" onClick={() => { logout(); navigate('/login'); }} className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50 md:inline-flex"><LogOut size={14} /> Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {!child ? (
          <section className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <Baby size={44} className="mx-auto text-slate-300" />
            <h1 className="mt-4 text-xl font-bold text-primary">Child Record Not Found</h1>
            <p className="mt-2 text-sm text-slate-500">No simulated prototype record matches {childId}.</p>
            <Link to="/component/personalized-nutrition/dashboard" className="mt-5 inline-flex rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white">Return to Intervention Dashboard</Link>
          </section>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <Component4Nav childId={child.childId} current="Child Analysis" />
            <Breadcrumbs items={[{ label: 'Research Home', to: '/research-home' }, { label: 'Component 04', to: '/component/personalized-nutrition' }, { label: 'Dashboard', to: '/component/personalized-nutrition/dashboard' }, { label: child.childId }]} />
            <WorkflowProgress currentStep={2} />
            <section className="rounded-2xl border border-secondary/20 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary"><Sparkles size={12} /> Simulated Prototype Data</span>
                  <h1 className="text-2xl font-bold text-primary md:text-4xl">Child {child.childId}</h1>
                  <p className="mt-2 text-sm text-slate-500">Explainable risk-factor and counterfactual-readiness review</p>
                </div>
                <span className={`self-start rounded-full px-3 py-1.5 text-xs font-bold ${riskBadgeClass(child.riskLevel)}`}>{child.riskLevel} Predicted Risk</span>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><User size={18} /></div><div><h2 className="font-bold text-primary">Child Profile</h2><p className="text-xs text-slate-500">Simulated demographic information</p></div></div>
                <div className="divide-y divide-slate-100 text-sm">
                  <div className="flex items-center justify-between py-3"><span className="flex items-center gap-2 text-slate-500"><Baby size={15} /> Age</span><span className="font-semibold text-primary">{child.ageMonths} months</span></div>
                  <div className="flex items-center justify-between py-3"><span className="flex items-center gap-2 text-slate-500"><User size={15} /> Sex</span><span className="font-semibold text-primary">{child.sex}</span></div>
                  <div className="flex items-center justify-between py-3"><span className="flex items-center gap-2 text-slate-500"><MapPin size={15} /> District</span><span className="font-semibold text-primary">{child.district}</span></div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><ShieldCheck size={18} /></div><div><h2 className="font-bold text-primary">Simulated Prediction Input</h2><p className="text-xs text-slate-500">Expected input from the early-detection component; Component 4 does not calculate it.</p></div></div>
                <div className="divide-y divide-slate-100 text-sm">
                  {[
                    ['Condition', child.condition], ['Severity', child.severity], ['Predicted Risk', child.riskLevel],
                    ['Prediction Probability — Simulated Input', `${child.probability}%`],
                  ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-3"><span className="text-slate-500">{label}</span><span className="font-semibold text-primary">{value}</span></div>)}
                </div>
              </section>
            </div>

            <section>
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Lightbulb size={19} /></div>
                <div><h2 className="text-xl font-bold text-primary">Explainable Risk Factors</h2><p className="text-sm text-slate-500">Simulated factors contributing to the child&apos;s predicted malnutrition risk.</p><p className="mt-1 text-xs font-medium text-slate-400">Feature importance indicates model contribution, not causal effect.</p></div>
              </div>
              {sortedFactors.length === 0 && <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm"><h3 className="font-bold text-primary">No Explainable Risk Factors Available</h3><p className="mt-2 text-sm text-slate-500">This simulated record does not contain explainability output. Return to the dashboard and select another child.</p><Link to="/component/personalized-nutrition/dashboard" className="mt-4 inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white">Select Another Child</Link></div>}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sortedFactors.map((factor) => (
                  <button key={factor.id} type="button" onClick={() => setDetailFactor(factor)} className="rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-primary">{factor.name}</p><p className="mt-0.5 text-xs text-slate-400">{factor.category}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${factor.actionable ? 'bg-secondary/10 text-secondary' : 'bg-slate-100 text-slate-500'}`}>{factor.actionable ? 'ACTIONABLE' : 'NON-ACTIONABLE'}</span></div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-surface p-3"><p className="text-slate-400">Current</p><p className="mt-1 font-semibold text-primary">{factor.currentValue}</p></div><div className="rounded-xl bg-surface p-3"><p className="text-slate-400">Simulated explainability impact</p><p className="mt-1 font-semibold text-primary">{factor.impactScore.toFixed(2)}</p></div></div>
                    <div className="mt-3 flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${impactBadgeClass(factor.impactLevel)}`}>{factor.impactLevel} impact</span><span className="text-[10px] font-semibold text-secondary">View details</span></div>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3"><BarChart3 size={19} className="text-secondary" /><div><h2 className="font-bold text-primary">Risk Factor Impact</h2><p className="text-xs text-slate-500">Sorted simulated explainability impact scores</p></div></div>
              <div style={{ height: Math.max(330, sortedFactors.length * 48) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedFactors} layout="vertical" margin={{ top: 5, right: 35, left: 25, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" domain={[0, 0.4]} tick={{ fontSize: 11 }} label={{ value: 'Simulated Explainability Impact', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fill: '#0B1F4D', fontSize: 11 }} />
                    <Tooltip formatter={(value) => [Number(value).toFixed(2), 'Simulated impact']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="impactScore" radius={[0, 8, 8, 0]} barSize={18}>{sortedFactors.map((factor) => <Cell key={factor.id} fill={impactColor(factor.impactLevel)} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-slate-400">Impact values are simulated for prototype demonstration.</p>
            </section>

            <section>
              <div className="mb-4"><h2 className="text-xl font-bold text-primary">Feature Classification Summary</h2><p className="text-sm text-slate-500">Dynamic classification for counterfactual feature eligibility.</p></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard title="Total Risk Factors" value={sortedFactors.length} subtitle="Simulated model contributors" icon={Lightbulb} />
                <MetricCard title="Actionable Factors" value={actionableFactors.length} subtitle="Candidate counterfactual features" icon={Unlock} accent="#27AE60" />
                <MetricCard title="Non-Actionable / Context Factors" value={contextFactors.length} subtitle="Protected or constrained features" icon={Lock} accent="#64748B" />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-secondary/15 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success"><Unlock size={18} /></div><div><h2 className="font-bold text-primary">Actionable Factors</h2><p className="text-xs text-slate-500">Include or exclude candidate features</p></div></div>
                <div className="space-y-2">
                  {actionableFactors.map((factor) => {
                    const selected = selectedFactorIds.includes(factor.id);
                    return <label key={factor.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selected ? 'border-secondary/30 bg-secondary/[0.05]' : 'border-slate-100 bg-surface'}`}><input type="checkbox" checked={selected} onChange={() => toggleFactor(factor.id)} className="h-4 w-4 accent-secondary" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-primary">{factor.name}</p><p className="text-[11px] text-slate-500">{factor.category} · Impact {factor.impactScore.toFixed(2)}</p></div><CheckCircle2 size={15} className={selected ? 'text-success' : 'text-slate-300'} /></label>;
                  })}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Lock size={18} /></div><div><h2 className="font-bold text-primary">Non-Actionable / Context Factors</h2><p className="text-xs text-slate-500">Protected, fixed or feasibility-only context</p></div></div>
                <div className="space-y-2">{contextFactors.map((factor) => <div key={factor.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-surface p-3"><input type="checkbox" disabled className="h-4 w-4" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-600">{factor.name}</p><p className="text-[11px] text-slate-400">{factor.category} · Fixed at {factor.currentValue}</p></div><Lock size={14} className="text-slate-400" /></div>)}</div>
              </div>
            </section>

            <section className="rounded-2xl border border-secondary/20 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-2 flex items-center gap-2"><Sparkles size={18} className="text-secondary" /><h2 className="font-bold text-primary">Counterfactual Readiness</h2></div>
                  <p className="text-sm text-slate-600">{selectedFactorIds.length} actionable factor{selectedFactorIds.length === 1 ? '' : 's'} selected for counterfactual generation.</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-success/5 p-3"><p className="text-xs font-bold uppercase tracking-wide text-success">Eligible features</p><ul className="mt-2 space-y-1 text-sm text-slate-600">{actionableFactors.filter((factor) => selectedFactorIds.includes(factor.id)).map((factor) => <li key={factor.id}>• {factor.name}</li>)}{selectedFactorIds.length === 0 && <li>No factors selected</li>}</ul></div>
                    <div className="rounded-xl bg-slate-100 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Protected / Fixed Features</p><ul className="mt-2 space-y-1 text-sm text-slate-600">{contextFactors.map((factor) => <li key={factor.id}>• {factor.name}</li>)}</ul></div>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">Candidate features remain subject to affordability, availability, suitability and professional review in later phases.</p>
                </div>
                <button type="button" disabled={selectedFactorIds.length === 0} onClick={continueToCounterfactual} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-secondary/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">Continue to Counterfactual Generation <ArrowRight size={16} /></button>
              </div>
            </section>

            <PrototypeDisclaimer />
          </div>
        )}
      </main>

      {detailFactor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm" onClick={() => setDetailFactor(null)}>
          <div className="w-full max-w-lg animate-fade-in rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className={`rounded-xl p-2.5 ${detailFactor.actionable ? 'bg-secondary/10 text-secondary' : 'bg-slate-100 text-slate-500'}`}>{detailFactor.actionable ? <Unlock size={20} /> : <Lock size={20} />}</div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Factor detail</p><h2 className="text-lg font-bold text-primary">{detailFactor.name}</h2></div></div><button type="button" onClick={() => setDetailFactor(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"><X size={18} /></button></div>
            <div className="divide-y divide-slate-100 text-sm">{[
              ['Category', detailFactor.category], ['Current value', detailFactor.currentValue], ['Impact level', detailFactor.impactLevel],
              ['Simulated explainability impact', detailFactor.impactScore.toFixed(2)], ['Classification', detailFactor.actionable ? 'Actionable' : 'Non-actionable / context'], ['Source', detailFactor.source],
            ].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-5 py-2.5"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-primary">{value}</span></div>)}</div>
            <div className="mt-4 rounded-xl bg-surface p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Reason for classification</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{detailFactor.reason}</p></div>
            <button type="button" onClick={() => setDetailFactor(null)} className="mt-5 w-full rounded-full bg-secondary py-2.5 text-sm font-semibold text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
