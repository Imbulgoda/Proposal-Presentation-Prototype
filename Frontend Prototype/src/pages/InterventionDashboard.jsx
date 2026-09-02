import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Baby,
  Bot,
  CheckCircle2,
  ListChecks,
  LogOut,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import MetricCard from '../components/cards/MetricCard';
import Component4Nav from '../components/intervention/Component4Nav';
import PrototypeDisclaimer from '../components/intervention/PrototypeDisclaimer';
import { useApp } from '../context/AppContext';
import {
  interventionChildren,
  interventionWorkflow,
} from '../data/interventionData';

const riskData = [
  { name: 'High', value: 4, color: '#E74C3C' },
  { name: 'Medium', value: 3, color: '#F39C12' },
  { name: 'Low', value: 1, color: '#27AE60' },
];

function riskBadgeClass(risk) {
  if (risk === 'High') return 'bg-danger/10 text-danger';
  if (risk === 'Medium') return 'bg-warning/10 text-warning';
  return 'bg-success/10 text-success';
}

function statusBadgeClass(status) {
  if (status === 'Needs Intervention') return 'bg-danger/10 text-danger';
  if (status === 'Review') return 'bg-secondary/10 text-secondary';
  return 'bg-success/10 text-success';
}

export default function InterventionDashboard() {
  const { logout } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState('All Risk Levels');
  const [condition, setCondition] = useState('All Conditions');
  const [status, setStatus] = useState('All Status');
  const dashboardSummary = {
    childrenReviewed: interventionChildren.length,
    highRiskChildren: interventionChildren.filter((child) => child.riskLevel === 'High').length,
    plansGenerated: interventionChildren.filter((child) => child.interventionStatus !== 'Stable').length,
    reviewsPending: interventionChildren.filter((child) => child.interventionStatus !== 'Stable').length,
  };

  const filteredChildren = useMemo(() => {
    const query = search.trim().toLowerCase();
    return interventionChildren.filter((child) => {
      const matchesSearch =
        !query ||
        child.childId.toLowerCase().includes(query) ||
        child.district.toLowerCase().includes(query);
      const matchesRisk = risk === 'All Risk Levels' || child.riskLevel === risk;
      const matchesCondition =
        condition === 'All Conditions' || child.condition === condition;
      const matchesStatus = status === 'All Status' || child.interventionStatus === status;
      return matchesSearch && matchesRisk && matchesCondition && matchesStatus;
    });
  }, [search, risk, condition, status]);

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md">
              <Bot size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">FedNutri-XAI</p>
              <p className="text-[11px] text-slate-500">Component 04</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/component/personalized-nutrition"
              className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50 sm:inline-flex"
            >
              <ArrowLeft size={14} /> Back to Component Overview
            </Link>
            <Link
              to="/research-home"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50"
            >
              Research Home
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50 md:inline-flex"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <Component4Nav current="Dashboard" />
        <section className="animate-fade-in rounded-2xl border border-secondary/20 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary">
                <Sparkles size={12} /> Component 04
              </span>
              <h1 className="text-2xl font-bold text-primary md:text-4xl">
                Personalized Nutrition Intervention Dashboard
              </h1>
              <p className="mt-2 text-sm font-medium text-secondary md:text-base">
                Feasibility-Aware Counterfactual Decision Support
              </p>
            </div>
            <div className="max-w-lg space-y-3 rounded-2xl bg-surface p-4 text-xs leading-relaxed text-slate-600">
              <button type="button" onClick={() => navigate('/component/personalized-nutrition/child/CH-001')} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-white shadow-md shadow-secondary/20"><PlayCircle size={17} /> Launch Demo Case: CH-001</button>
              <span className="inline-flex rounded-full bg-secondary/10 px-2.5 py-1 text-[9px] font-bold uppercase text-secondary">Recommended Demo Case</span>
              <p>
                <strong className="text-primary">Prototype Mode</strong> — child records and
                intervention outputs shown here are simulated for research demonstration.
              </p>
              <p>
                <strong className="text-primary">Clinical Decision Support</strong> — recommendations
                require healthcare professional review.
              </p>
            </div>
          </div>
        </section>

        <PrototypeDisclaimer compact />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Children Reviewed"
            value={dashboardSummary.childrenReviewed}
            subtitle="Simulated review records"
            icon={Baby}
          />
          <MetricCard
            title="High-Risk Children"
            value={dashboardSummary.highRiskChildren}
            subtitle="Prioritized for professional review"
            icon={AlertTriangle}
            accent="#E74C3C"
          />
          <MetricCard
            title="Plans Generated"
            value={dashboardSummary.plansGenerated}
            subtitle="Prototype decision-support plans"
            icon={ListChecks}
          />
          <MetricCard
            title="Healthcare Reviews Pending"
            value={dashboardSummary.reviewsPending}
            subtitle="Simulated workflow states"
            icon={ShieldCheck}
            accent="#27AE60"
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
            <h2 className="font-bold text-primary">Risk Distribution</h2>
            <p className="text-xs text-slate-500">Predicted risk across the eight demo records</p>
            <div className="relative h-[285px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={3}
                    stroke="none"
                  >
                    {riskData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} children`, 'Count']} />
                  <Legend verticalAlign="bottom" height={32} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Reviewed</p>
                <p className="text-2xl font-bold text-primary">8</p>
                <p className="text-[10px] text-slate-400">demo children</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-bold text-primary">Quick Workflow</h2>
                <p className="text-xs text-slate-500">Component 04 intervention decision-support path</p>
              </div>
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-[10px] font-bold text-secondary">
                Current: Child Selection &amp; Prediction Review
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {interventionWorkflow.map((step, index) => {
                const current = index < 2;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                      current
                        ? 'border-secondary/30 bg-secondary/[0.06]'
                        : 'border-slate-100 bg-surface'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        current ? 'bg-secondary text-white' : 'bg-white text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <p className={`text-sm font-medium ${current ? 'text-primary' : 'text-slate-500'}`}>
                      {step}
                    </p>
                    {current && <CheckCircle2 size={14} className="ml-auto shrink-0 text-secondary" />}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-primary">Children Requiring Intervention Review</h2>
            <p className="text-xs text-slate-500">
              Simulated child records for frontend research workflow testing only.
            </p>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Search simulated children by child ID or district"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by Child ID or District"
                className="w-full rounded-full border border-slate-200 bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-secondary"
              />
            </div>
            <select
              aria-label="Filter children by predicted risk"
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-secondary"
            >
              {['All Risk Levels', 'High', 'Medium', 'Low'].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select
              aria-label="Filter children by condition"
              value={condition}
              onChange={(event) => setCondition(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-secondary"
            >
              {['All Conditions', 'Stunting', 'Wasting', 'Underweight'].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select
              aria-label="Filter children by intervention status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-secondary"
            >
              {['All Status', 'Needs Intervention', 'Review', 'Stable'].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="pb-3">Child ID</th>
                  <th className="pb-3">Age</th>
                  <th className="pb-3">Sex</th>
                  <th className="pb-3">District</th>
                  <th className="pb-3">Condition</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Predicted Risk</th>
                  <th className="pb-3">Prediction Probability</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredChildren.map((child) => (
                  <tr key={child.childId} className="border-b border-slate-50">
                    <td className="py-3 font-bold text-primary"><div className="flex items-center gap-2">{child.childId}{child.childId === 'CH-001' && <span className="rounded-full bg-secondary/10 px-2 py-1 text-[9px] font-bold uppercase text-secondary">Demo Case</span>}</div></td>
                    <td className="py-3">{child.ageMonths} months</td>
                    <td className="py-3">{child.sex}</td>
                    <td className="py-3 font-medium text-primary">{child.district}</td>
                    <td className="py-3">{child.condition}</td>
                    <td className="py-3">{child.severity}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${riskBadgeClass(child.riskLevel)}`}>
                        {child.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-primary">{child.probability}%</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusBadgeClass(child.interventionStatus)}`}>
                        {child.interventionStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link
                        to={`/component/personalized-nutrition/child/${child.childId}`}
                        className="inline-flex rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        View Intervention
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredChildren.length === 0 && (
            <div className="py-10 text-center">
              <p className="font-semibold text-primary">No matching child records</p>
              <p className="mt-1 text-xs text-slate-500">Adjust the search term or filters.</p>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Showing {filteredChildren.length} of {interventionChildren.length} simulated records.
          </p>
        </section>
      </main>
    </div>
  );
}
