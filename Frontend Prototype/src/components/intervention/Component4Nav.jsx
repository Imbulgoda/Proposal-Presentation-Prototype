import { Link } from 'react-router-dom';

const baseItems = [
  ['Overview', '/component/personalized-nutrition'],
  ['Dashboard', '/component/personalized-nutrition/dashboard'],
];

export default function Component4Nav({ childId, current }) {
  const childItems = childId ? [
    ['Child Analysis', `/component/personalized-nutrition/child/${childId}`],
    ['Counterfactuals', `/component/personalized-nutrition/child/${childId}/counterfactual`],
    ['Feasibility', `/component/personalized-nutrition/child/${childId}/feasibility`],
    ['Ranking', `/component/personalized-nutrition/child/${childId}/ranking`],
    ['Intervention Plan', `/component/personalized-nutrition/child/${childId}/plan`],
  ] : [];
  const items = [...baseItems, ...childItems];

  return (
    <nav aria-label="Component 4 navigation" className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
      <div className="flex min-w-max gap-1">
        {items.map(([label, to]) => <Link key={label} to={to} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${current === label ? 'bg-secondary text-white shadow-sm' : 'text-slate-600 hover:bg-secondary/[0.06] hover:text-secondary'}`}>{label}</Link>)}
        {!childId && <Link to="/component/personalized-nutrition/dashboard" className="rounded-xl px-3 py-2 text-xs text-slate-400">Select a child to unlock analysis steps</Link>}
      </div>
    </nav>
  );
}
