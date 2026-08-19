import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import ForecastContextBar from '../components/layout/ForecastContextBar';
import ForecastChart from '../components/charts/ForecastChart';
import ExportToolbar from '../components/export/ExportToolbar';
import { generateForecast } from '../data/forecastData';
import { districts } from '../data/districtData';
import { useApp } from '../context/AppContext';
import {
  FORECAST_YEARS,
  MONTH_OPTIONS,
  DISTRICT_ALL,
  migrateForecastContext,
  getForecastScopeLabel,
  toForecastDistrictScope,
} from '../utils/forecastContextUtils';

export default function Forecast() {
  const { forecastContext, applyForecastContext } = useApp();
  const initialContext = migrateForecastContext(forecastContext);
  const [model, setModel] = useState(initialContext.model);
  const [district, setDistrict] = useState(initialContext.district);
  const [year, setYear] = useState(initialContext.year);
  const [month, setMonth] = useState(initialContext.month);
  const [result, setResult] = useState(
    () =>
      initialContext.result ||
      generateForecast({
        model: initialContext.model,
        district: toForecastDistrictScope(initialContext.district),
        year: initialContext.year,
        month: initialContext.month,
        until: initialContext.year,
      })
  );

  const run = () => {
    const next = generateForecast({
      model,
      district: toForecastDistrictScope(district),
      year: Number(year),
      month,
      until: Number(year),
    });
    setResult(next);
    applyForecastContext({
      model,
      district,
      year: Number(year),
      month,
      result: next,
    });
    toast.success(`Forecast generated · ${year} · ${month} · ${district}`);
  };

  const riskBadge = (risk) =>
    risk === 'High'
      ? 'bg-danger/10 text-danger'
      : risk === 'Medium'
        ? 'bg-warning/10 text-warning'
        : 'bg-success/10 text-success';

  const pdfSections = useMemo(
    () => [
      {
        heading: `Forecast Summary — ${result.model}`,
        lines: [
          `Year: ${year}`,
          `Month: ${month}`,
          `District scope: ${result.district}`,
          `Horizon: ${result.until}`,
          `Accuracy: ${result.performance?.accuracy}%`,
          `RMSE: ${result.performance?.rmse}`,
          `MAE: ${result.performance?.mae}`,
        ],
      },
      {
        heading: 'Prediction Table (sample)',
        lines: result.table.slice(0, 12).map(
          (r) => `${r.year}: ${r.predictedCases} cases · ${r.risk} · CI ${r.ci}`
        ),
      },
    ],
    [result, year, month]
  );

  return (
    <div className="min-h-screen">
      <Navbar title="Forecast" subtitle="Configure model runs and explore projections" />
      <div className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-4 md:p-6">
        <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-1">
          <h3 className="font-bold text-primary">Forecast Controls</h3>
          <p className="mb-4 text-xs text-slate-500">Configure the model run.</p>

          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mb-3 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-secondary"
          >
            {FORECAST_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mb-3 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-secondary"
          >
            <option>XGBoost</option>
            <option>Random Forest</option>
            <option>LSTM</option>
          </select>

          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mb-3 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-secondary"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            District
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-secondary"
          >
            <option>{DISTRICT_ALL}</option>
            {districts.map((d) => (
              <option key={d.id}>{d.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={run}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3 text-sm font-semibold text-white shadow-md shadow-secondary/25"
          >
            <Sparkles size={16} /> Generate Forecast
          </button>

          <div className="rounded-2xl border border-slate-100 bg-surface p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Model Performance
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Accuracy</span>
                <span className="font-bold text-primary">{result.performance?.accuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">RMSE</span>
                <span className="font-bold text-primary">{result.performance?.rmse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MAE</span>
                <span className="font-bold text-primary">{result.performance?.mae}</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-5 lg:col-span-3">
          <ForecastContextBar className="mb-1" />

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-bold text-primary">
                  {getForecastScopeLabel(district)} forecast — {model}
                </h3>
                <p className="text-xs text-slate-500">
                  Historical 2019–2023 · Projection 2024–{year} with 95% confidence band.
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  Selected context: {year} | {month} | {district}
                </p>
              </div>
              <ExportToolbar
                pdfSections={pdfSections}
                excelSheets={{ Forecast: result.table, Series: result.series }}
                csvRows={result.table}
                pdfName="FedNutri-Forecast.pdf"
                excelName="FedNutri-Forecast.xlsx"
                csvName="FedNutri-Forecast.csv"
              />
            </div>
            <ForecastChart data={result.series} height={340} />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-primary">Prediction Table</h3>
            <p className="mb-4 text-xs text-slate-500">Year-by-year projected caseload.</p>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="pb-2">Year</th>
                    <th className="pb-2">Predicted Cases</th>
                    <th className="pb-2">95% CI</th>
                    <th className="pb-2">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {result.table.map((row) => (
                    <tr key={row.year} className="border-b border-slate-50">
                      <td className="py-2.5 font-medium text-primary">{row.year}</td>
                      <td className="py-2.5">{row.predictedCases.toLocaleString()}</td>
                      <td className="py-2.5 text-slate-500">{row.ci}</td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${riskBadge(row.risk)}`}>
                          {row.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
