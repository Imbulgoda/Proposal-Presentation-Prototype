import { ShieldCheck } from 'lucide-react';

export default function PrototypeDisclaimer({ compact = false, className = '' }) {
  return (
    <aside className={`rounded-2xl border border-secondary/20 bg-secondary/[0.05] ${compact ? 'p-3' : 'p-4'} ${className}`}>
      <div className="flex items-start gap-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
        <div>
          <span className="inline-flex rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary">Simulated Research Prototype</span>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">Outputs shown in this prototype are simulated research-demo values. Counterfactual risk changes are model-estimated what-if scenarios and do not represent guaranteed clinical outcomes.</p>
          <p className="mt-1 text-xs font-semibold text-primary">Healthcare professional review is required before any real-world intervention decision.</p>
        </div>
      </div>
    </aside>
  );
}
