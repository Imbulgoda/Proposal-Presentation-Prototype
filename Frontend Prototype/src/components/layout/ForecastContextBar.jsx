import { useApp } from '../../context/AppContext';
import {
  getActiveForecastSummary,
  getForecastScopeLabel,
  migrateForecastContext,
} from '../../utils/forecastContextUtils';

export default function ForecastContextBar({ className = '' }) {
  const { forecastContext } = useApp();
  const ctx = migrateForecastContext(forecastContext);

  if (!ctx?.generated) return null;

  const summary = getActiveForecastSummary(ctx);
  const monthLabel = `${ctx.activeMonth} ${ctx.activeYear}`;
  const districtLabel = getForecastScopeLabel(ctx.district);

  return (
    <div
      className={`rounded-xl border border-secondary/15 bg-secondary/[0.04] px-3.5 py-2.5 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary">
        Active Forecast
      </p>
      <p className="mt-0.5 text-xs font-semibold text-primary">
        {monthLabel}
        <span className="mx-1.5 font-normal text-slate-400">•</span>
        {districtLabel}
        <span className="mx-1.5 font-normal text-slate-400">•</span>
        {ctx.horizon}-Month Horizon
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Model: {ctx.model}
        {summary?.predictedCases != null && (
          <>
            <span className="mx-1.5 text-slate-300">|</span>
            Predicted: {summary.predictedCases.toLocaleString()}
            {summary.risk ? ` · ${summary.risk}` : ''}
            {summary.ci ? ` · 95% CI ${summary.ci}` : ''}
          </>
        )}
        {ctx.generatedAt && (
          <>
            <span className="mx-1.5 text-slate-300">|</span>
            Generated: {ctx.generatedAt}
          </>
        )}
      </p>
    </div>
  );
}
