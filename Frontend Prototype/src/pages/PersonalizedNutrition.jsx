import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowDown,
  Bot,
  Brain,
  CheckCircle2,
  Filter,
  ListChecks,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Component4Nav from '../components/intervention/Component4Nav';
import PrototypeDisclaimer from '../components/intervention/PrototypeDisclaimer';

const componentNumber = 4;

const overviewCards = [
  {
    title: 'Prediction Integration',
    description:
      'Receives child risk, probability and explainable risk factors from the detection component.',
    icon: Brain,
  },
  {
    title: 'Counterfactual Generation',
    description:
      'Generates possible minimum changes using Wachter, DiCE and FACE approaches.',
    icon: Sparkles,
  },
  {
    title: 'Feasibility Filtering',
    description:
      'Checks affordability, local availability, age suitability, clinic access and programme eligibility.',
    icon: Filter,
  },
  {
    title: 'Intervention Planning',
    description:
      'Ranks feasible interventions and generates personalized intervention plans for healthcare workers.',
    icon: ListChecks,
  },
];

const fullWorkflow = [
  'Prediction Output', 'Explainable Risk Factors', 'Actionable Feature Selection',
  'Counterfactual Generation', 'Feasibility Filtering', 'Intervention Ranking',
  'Personalized Plan', 'Healthcare Review',
];

export default function PersonalizedNutrition() {
  const { logout } = useApp();
  const navigate = useNavigate();

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
              <p className="text-[11px] text-slate-500">Component 0{componentNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/research-home"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50"
            >
              <ArrowLeft size={14} /> Hub
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-primary transition hover:bg-slate-50"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6 md:py-10">
        <Component4Nav current="Overview" />
        <section className="animate-fade-in overflow-hidden rounded-2xl border border-secondary/20 bg-white shadow-sm">
          <div className="relative p-6 md:p-10">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
            <div className="relative max-w-4xl">
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-secondary">
                <Sparkles size={12} /> Component 0{componentNumber}
              </span>
              <h1 className="text-2xl font-bold leading-tight text-primary md:text-4xl">
                Feasible Personalized Counterfactual Intervention Engine
              </h1>
              <p className="mt-3 text-base font-medium text-secondary md:text-lg">
                Personalized Childhood Malnutrition Intervention in Sri Lanka
              </p>
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-500 md:text-base">
                Transforms child-level malnutrition predictions into feasible, personalized intervention
                options for healthcare workers.
              </p>
            </div>
          </div>

        </section>

        <PrototypeDisclaimer />

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-5"><h2 className="text-xl font-bold text-primary">Complete Decision-Support Workflow</h2><p className="mt-1 text-sm text-slate-500">From prediction evidence to healthcare professional review.</p></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{fullWorkflow.map((step, index) => <div key={step} className="flex items-center gap-3 rounded-xl bg-surface p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-white">{index + 1}</span><span className="text-sm font-semibold text-primary">{step}</span>{index < fullWorkflow.length - 1 && <ArrowDown size={14} className="ml-auto text-secondary lg:hidden" />}</div>)}</div>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-primary">How the Intervention Engine Works</h2>
            <p className="mt-1 text-sm text-slate-500">
              The end-to-end workflow converts prediction evidence into feasible child-level actions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-md"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                      <Icon size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-300">0{index + 1}</span>
                  </div>
                  <h3 className="font-bold text-primary">{card.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                    {card.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-secondary">
                    <CheckCircle2 size={14} /> Research workflow stage
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-secondary/20 bg-gradient-to-r from-primary to-[#172f69] p-6 text-white shadow-sm md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-200">Integration with Early Detection</p>
          <div className="mt-5 grid items-center gap-3 text-center md:grid-cols-[1fr_auto_1fr_auto_1fr]"><div className="rounded-xl bg-white/10 p-4"><p className="text-xs text-purple-200">Component 1</p><p className="mt-1 font-bold">Multimodal Early Detection</p></div><ArrowDown className="mx-auto rotate-0 text-purple-200 md:-rotate-90" /><div className="rounded-xl bg-white/10 p-4"><p className="text-xs text-purple-200">Shared output</p><p className="mt-1 font-bold">Risk + Severity + Explainable Factors</p></div><ArrowDown className="mx-auto rotate-0 text-purple-200 md:-rotate-90" /><div className="rounded-xl bg-secondary/70 p-4"><p className="text-xs text-purple-100">Component 4</p><p className="mt-1 font-bold">Feasible Personalized Intervention Engine</p><p className="mt-1 text-xs text-purple-100">Personalized Intervention Plan</p></div></div>
          <p className="mt-5 text-sm leading-relaxed text-slate-200">The early-detection component identifies the child&apos;s predicted risk; Component 4 converts that output into feasible personalized intervention options.</p>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-primary">Personalized Intervention Workspace</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Review simulated child predictions, analyze actionable factors, compare counterfactual
                candidates, apply feasibility constraints, and generate a personalized intervention plan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/component/personalized-nutrition/dashboard')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-md shadow-secondary/25 transition hover:opacity-95"
            >
              <Sparkles size={16} /> Launch Intervention Dashboard
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
