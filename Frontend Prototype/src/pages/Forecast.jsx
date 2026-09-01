import { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import ForecastContextBar from '../components/layout/ForecastContextBar';
import ForecastChart from '../components/charts/ForecastChart';
import SriLankaMap from '../components/maps/SriLankaMap';
import ExportToolbar from '../components/export/ExportToolbar';
import { generateMonthlyForecast, getMonthSeriesForDistrict } from '../data/forecastData';
import { districts } from '../data/districtData';
import { useApp } from '../context/AppContext';
import {
  DISTRICT_ALL,
  FORECAST_HORIZONS,
  FORECAST_MODELS,
  START_MONTH_OPTIONS,
  getForecastAwareDistricts,
  getForecastScopeLabel,
  getTrendLabel,
  isAllDistricts,
  migrateForecastContext,
  monthYearKey,
  parseMonthYear,
  riskBadgeClass,
  uncertaintyBadgeClass,
} from '../utils/forecastContextUtils';

function TrendIcon({ trend }) {
  if (trend === 'Increasing') return <TrendingUp size={14} className="text-danger" />;
  if (trend === 'Decreasing') return <TrendingDown size={14} className="text-success" />;
  return <Minus size={14} className="text-slate-400" />;
}

export default function Forecast() {
  const { forecastContext, applyForecastContext } = useApp();
  const initial = migrateForecastContext(forecastContext);

  const [horizon, setHorizon] = useState(initial.horizon || 1);
  const [startLabel, setStartLabel] = useState(
    monthYearKey(initial.startMonth || 'January', initial.startYear || 2027)
  );
  const [model, setModel] = useState(initial.model || 'NGBoost');
  const [district, setDistrict] = useState(initial.district || DISTRICT_ALL);
  const [result, setResult] = useState(() => {
    if (initial.result?.kind === 'monthly') return initial.result;
    const parsed = parseMonthYear(
      monthYearKey(initial.startMonth || 'January', initial.startYear || 2027)
    );
    return generateMonthlyForecast({
      model: initial.model || 'NGBoost',
      district: initial.district || DISTRICT_ALL,
      horizon: initial.horizon || 1,
      startMonth: parsed?.month || 'January',
      startYear: parsed?.year || 2027,
    });
  });
  const [activeMonthLabel, setActiveMonthLabel] = useState(() => {
    if (initial.generated && initial.activeMonth) {
      return monthYearKey(initial.activeMonth, initial.activeYear);
    }
    return result.months?.[0]?.label || startLabel;
  });
  const [mapMode, setMapMode] = useState('risk');

  const activeSnap = result.monthsData?.[activeMonthLabel] || result.monthsData?.[result.months?.[0]?.label];
  const focusDistrict = isAllDistricts(district) ? null : district;

  // Monthly Forecast table: All Districts → all rows; specific district → that row only.
  const tableRows = useMemo(() => {
    const rows = Array.isArray(result?.table) ? result.table : [];
    if (!focusDistrict) return rows;
    return rows.filter((row) => row.district === focusDistrict);
  }, [result?.table, focusDistrict]);

  const mapDistricts = useMemo(() => {
    const ctx = {
      ...forecastContext,
      generated: true,
      result,
      activeMonth: activeSnap?.month,
      activeYear: activeSnap?.year,
      month: activeSnap?.month,
      year: activeSnap?.year,
    };
    let list = getForecastAwareDistricts(districts, ctx);
    if (focusDistrict) {
      list = list.filter((d) => d.name === focusDistrict);
    }
    return list;
  }, [result, activeSnap, forecastContext, focusDistrict]);

  const selectedDistrictRow = useMemo(() => {
    if (!activeSnap) return null;
    if (focusDistrict) {
      return activeSnap.districts.find((d) => d.name === focusDistrict) || null;
    }
    return activeSnap.top5?.[0] || activeSnap.districts?.[0] || null;
  }, [activeSnap, focusDistrict]);

  const [selectedMapId, setSelectedMapId] = useState(() =>
    districts.find((d) => d.name === (focusDistrict || selectedDistrictRow?.name))?.id
  );

  useEffect(() => {
    const targetName = focusDistrict || selectedDistrictRow?.name;
    const match = mapDistricts.find((d) => d.name === targetName) || mapDistricts[0];
    if (match) setSelectedMapId(match.id);
  }, [focusDistrict, selectedDistrictRow, mapDistricts]);

  const selectedMapDistrict = mapDistricts.find((d) => d.id === selectedMapId) || mapDistricts[0];

  const chartSeries = useMemo(() => {
    if (!result?.months) return result?.series || [];
    const name = focusDistrict || selectedMapDistrict?.name || DISTRICT_ALL;
    const monthly = getMonthSeriesForDistrict(result, isAllDistricts(name) ? DISTRICT_ALL : name);
    return monthly.length ? monthly : result.series;
  }, [result, focusDistrict, selectedMapDistrict]);

  const trendSummary = useMemo(() => {
    if (!result?.months || result.months.length < 2) return null;
    const name = focusDistrict || selectedDistrictRow?.name;
    if (!name) return null;
    const values = result.months.map((tab) => {
      const row = result.monthsData[tab.label].districts.find((d) => d.name === name);
      return { label: tab.shortLabel, value: row?.predictedCases ?? 0 };
    });
    return {
      district: name,
      values,
      trend: getTrendLabel(values.map((v) => v.value)),
    };
  }, [result, focusDistrict, selectedDistrictRow]);

  const summaryCards = useMemo(() => {
    if (!activeSnap?.summary) return [];
    const s = activeSnap.summary;
    if (focusDistrict && selectedDistrictRow) {
      return [
        {
          title: 'Predicted Cases',
          value: selectedDistrictRow.predictedCases.toLocaleString(),
          hint: selectedDistrictRow.name,
        },
        {
          title: '95% CI (NGBoost)',
          value: selectedDistrictRow.ci,
          hint: 'Prediction interval',
        },
        {
          title: 'Risk Level',
          value: selectedDistrictRow.risk,
          hint: activeMonthLabel,
        },
        {
          title: 'Uncertainty',
          value: selectedDistrictRow.uncertainty,
          hint: `Width ±${Math.round((selectedDistrictRow.upper - selectedDistrictRow.lower) / 2)}`,
        },
      ];
    }
    return [
      {
        title: 'Avg Predicted Cases',
        value: s.avgPredictedCases.toLocaleString(),
        hint: 'per district',
      },
      {
        title: 'Highest District',
        value: s.highestDistrict,
        hint: `${s.highestCases} cases`,
      },
      {
        title: 'Lowest District',
        value: s.lowestDistrict,
        hint: `${s.lowestCases} cases`,
      },
      {
        title: 'Avg Uncertainty (CI Width)',
        value: `± ${s.avgUncertaintyWidth}`,
        hint: 'cases',
      },
    ];
  }, [activeSnap, focusDistrict, selectedDistrictRow, activeMonthLabel]);

  const pushContext = (nextResult, nextDistrict, nextActiveLabel, extras = {}) => {
    const snap =
      nextResult.monthsData?.[nextActiveLabel] ||
      nextResult.monthsData?.[nextResult.months[0].label];
    const tab = nextResult.months.find((m) => m.label === nextActiveLabel) || nextResult.months[0];
    const scope = nextDistrict || DISTRICT_ALL;
    const row = isAllDistricts(scope)
      ? snap?.national
      : snap?.districts?.find((d) => d.name === scope) || snap?.top5?.[0];

    applyForecastContext({
      model: nextResult.model,
      district: scope,
      horizon: nextResult.horizon,
      startMonth: nextResult.startMonth,
      startYear: nextResult.startYear,
      activeMonth: tab.month,
      activeYear: tab.year,
      month: tab.month,
      year: tab.year,
      predictedCases: row?.predictedCases ?? null,
      risk: row?.risk ?? null,
      lower: row?.lower ?? null,
      upper: row?.upper ?? null,
      uncertainty: row?.uncertainty ?? null,
      generatedAt: extras.generatedAt || forecastContext.generatedAt || new Date().toLocaleString(),
      result: nextResult,
      ...extras,
    });
  };

  const run = () => {
    const parsed = parseMonthYear(startLabel) || { month: 'January', year: 2027 };
    const next = generateMonthlyForecast({
      model,
      district,
      horizon: Number(horizon),
      startMonth: parsed.month,
      startYear: parsed.year,
    });
    const firstLabel = next.months[0].label;
    setResult(next);
    setActiveMonthLabel(firstLabel);
    const generatedAt = new Date().toLocaleString();
    pushContext(next, district, firstLabel, { generatedAt });
    toast.success(
      `Forecast generated · ${horizon}-month · ${startLabel} · ${getForecastScopeLabel(district)}`
    );
  };

  const selectActiveMonth = (label) => {
    if (!result?.monthsData?.[label]) return;
    setActiveMonthLabel(label);
    pushContext(result, district, label);
  };

  const onMapSelect = (d) => {
    setSelectedMapId(d.id);
    setDistrict(d.name);
    pushContext(result, d.name, activeMonthLabel);
    toast.success(`District focus · ${d.name}`);
  };

  const onDistrictControlChange = (value) => {
    setDistrict(value);
    if (forecastContext.generated) {
      pushContext(result, value, activeMonthLabel);
    }
  };

  const pdfSections = useMemo(() => {
    const row = selectedDistrictRow;
    return [
      {
        heading: 'Malnutrition Forecast Summary',
        lines: [
          `Horizon: ${horizon} month(s)`,
          `Start: ${startLabel}`,
          `Active month: ${activeMonthLabel}`,
          `Model: ${model}`,
          `District: ${getForecastScopeLabel(district)}`,
          row
            ? `Focus: ${row.name} · ${row.predictedCases} cases · ${row.risk} · CI ${row.ci}`
            : '',
        ].filter(Boolean),
      },
      {
        heading: 'Top districts (active month)',
        lines: (activeSnap?.top5 || []).map(
          (d, i) =>
            `#${i + 1} ${d.name}: ${d.predictedCases} · ${d.risk} · CI ${d.ci} · Uncertainty ${d.uncertainty}`
        ),
      },
    ];
  }, [
    horizon,
    startLabel,
    activeMonthLabel,
    model,
    district,
    selectedDistrictRow,
    activeSnap,
  ]);

  const excelTable = useMemo(
    () =>
      tableRows.map((row) => {
        const out = { District: row.district };
        (result?.months || []).forEach((tab) => {
          const cell = row.cells?.[tab.label];
          out[tab.label] = cell
            ? `${cell.predictedCases} (${cell.lower}-${cell.upper})`
            : '';
        });
        return out;
      }),
    [tableRows, result]
  );

  return (
    <div className="min-h-screen">
      <Navbar
        title="Malnutrition Forecast"
        subtitle="District-wise forecasting with uncertainty (NGBoost)"
      />

      <div className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-4 md:p-6">
        {/* LEFT CONTROLS */}
        <aside className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-primary">Forecast Controls</h3>
            <p className="mb-4 text-xs text-slate-500">Configure horizon and generate demo forecast.</p>

            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Forecast Horizon
            </label>
            <div className="mb-4 grid grid-cols-3 gap-1.5">
              {FORECAST_HORIZONS.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setHorizon(h.value)}
                  className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition ${
                    Number(horizon) === h.value
                      ? 'bg-secondary text-white shadow-sm shadow-secondary/30'
                      : 'border border-slate-200 bg-surface text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>

            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Start Month
            </label>
            <select
              value={startLabel}
              onChange={(e) => setStartLabel(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-secondary"
            >
              {START_MONTH_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.label}>
                  {opt.label}
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
              {FORECAST_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m === 'NGBoost' ? 'NGBoost (Best Model)' : m}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              District
            </label>
            <select
              value={district}
              onChange={(e) => onDistrictControlChange(e.target.value)}
              className="mb-4 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-secondary"
            >
              <option value={DISTRICT_ALL}>{DISTRICT_ALL}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={run}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3 text-sm font-semibold text-white shadow-md shadow-secondary/25"
            >
              <BarChart3 size={16} /> Generate Forecast
            </button>

            <div className="rounded-2xl border border-slate-100 bg-surface p-3.5">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                About NGBoost Uncertainty
              </p>
              <p className="text-[11px] leading-relaxed text-slate-600">
                NGBoost provides the prediction together with an uncertainty range. A smaller range
                indicates greater certainty, while a wider range indicates greater uncertainty.
              </p>
              <div className="mt-3 space-y-1 text-[11px]">
                <p className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" /> Green — small range / more certain
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-danger" /> Red — wide range / more uncertain
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-100 bg-surface p-3.5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Risk Level Guide
              </p>
              <div className="space-y-1.5 text-[11px]">
                {[
                  ['Very High (Severe)', 'bg-danger'],
                  ['High', 'bg-orange-500'],
                  ['Medium', 'bg-warning'],
                  ['Low', 'bg-success'],
                  ['Very Low', 'bg-sky-500'],
                ].map(([label, color]) => (
                  <p key={label} className="flex items-center gap-2 text-slate-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    {label}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="space-y-5 lg:col-span-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <ForecastContextBar />
              <p className="mt-2 text-xs text-slate-500">
                Horizon: {horizon} Month{Number(horizon) > 1 ? 's' : ''} · Month: {activeMonthLabel} ·
                Model: {model}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  Demo values
                </span>
              </p>
            </div>
            <ExportToolbar
              pdfSections={pdfSections}
              excelSheets={{ Forecast: excelTable, Series: chartSeries }}
              csvRows={excelTable}
              pdfName="FedNutri-Forecast.pdf"
              excelName="FedNutri-Forecast.xlsx"
              csvName="FedNutri-Forecast.csv"
            />
          </div>

          {/* Month tabs */}
          <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Active Forecast Month
            </p>
            <div className="flex flex-wrap gap-2">
              {(result.months || []).map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => selectActiveMonth(tab.label)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeMonthLabel === tab.label
                      ? 'bg-secondary text-white shadow-sm shadow-secondary/25'
                      : 'border border-slate-200 bg-surface text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {card.title}
                </p>
                <p className="mt-1 text-lg font-bold text-primary">{card.value}</p>
                <p className="text-[11px] text-slate-500">{card.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            {/* Map */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-primary">Sri Lanka District Risk Map</h3>
                  <p className="text-xs text-slate-500">
                    Colours update with the active forecast month ({activeMonthLabel}).
                  </p>
                </div>
                <div className="flex rounded-full border border-slate-200 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMapMode('risk')}
                    className={`rounded-full px-3 py-1.5 ${
                      mapMode === 'risk' ? 'bg-secondary text-white' : 'text-slate-500'
                    }`}
                  >
                    Risk Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMode('cases')}
                    className={`rounded-full px-3 py-1.5 ${
                      mapMode === 'cases' ? 'bg-secondary text-white' : 'text-slate-500'
                    }`}
                  >
                    Cases Map
                  </button>
                </div>
              </div>
              <div className="relative h-[420px]">
                <SriLankaMap
                  selectedId={selectedMapId}
                  onSelect={onMapSelect}
                  height="420px"
                  districtData={
                    mapMode === 'cases'
                      ? mapDistricts
                      : mapDistricts
                  }
                />
                {selectedMapDistrict && (
                  <div className="absolute right-3 top-3 z-[400] max-w-[220px] rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-lg">
                    <p className="font-bold text-primary">{selectedMapDistrict.name}</p>
                    <p className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-slate-500">Risk Level</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskBadgeClass(selectedMapDistrict.risk)}`}
                      >
                        {selectedMapDistrict.risk}
                      </span>
                    </p>
                    <p className="mt-1 flex justify-between gap-2">
                      <span className="text-slate-500">Predicted Cases</span>
                      <span className="font-semibold text-primary">
                        {selectedMapDistrict.cases}
                      </span>
                    </p>
                    <p className="mt-1 flex justify-between gap-2">
                      <span className="text-slate-500">95% CI</span>
                      <span className="font-medium text-slate-700">
                        {selectedMapDistrict.ci ||
                          `${selectedMapDistrict.lower} – ${selectedMapDistrict.upper}`}
                      </span>
                    </p>
                    <p className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-slate-500">Uncertainty</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${uncertaintyBadgeClass(selectedMapDistrict.uncertainty)}`}
                      >
                        {selectedMapDistrict.uncertainty || '—'}
                      </span>
                    </p>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 z-[400] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-[11px] shadow">
                  <p className="mb-1 font-semibold text-primary">Risk Legend</p>
                  {[
                    ['Very High', 'bg-danger'],
                    ['High', 'bg-orange-500'],
                    ['Medium', 'bg-warning'],
                    ['Low', 'bg-success'],
                    ['Very Low', 'bg-sky-500'],
                  ].map(([label, color]) => (
                    <p key={label} className="flex items-center gap-2 text-slate-600">
                      <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Ranking + trend */}
            <div className="space-y-5 xl:col-span-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-primary">Selected Month Summary</h3>
                <p className="mb-3 text-xs text-slate-500">{activeMonthLabel}</p>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400">
                        <th className="pb-2">#</th>
                        <th className="pb-2">District</th>
                        <th className="pb-2">Cases</th>
                        <th className="pb-2">CI</th>
                        <th className="pb-2">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeSnap?.top5 || []).map((row, idx) => (
                        <tr
                          key={row.name}
                          className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 ${
                            selectedMapDistrict?.name === row.name ? 'bg-secondary/5' : ''
                          }`}
                          onClick={() => {
                            const match = districts.find((d) => d.name === row.name);
                            if (match) onMapSelect(match);
                          }}
                        >
                          <td className="py-2.5 text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 font-medium text-primary">{row.name}</td>
                          <td className="py-2.5">{row.predictedCases}</td>
                          <td className="py-2.5 text-[11px] text-slate-500">
                            {row.lower}–{row.upper}
                          </td>
                          <td className="py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskBadgeClass(row.risk)}`}
                            >
                              {row.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {trendSummary && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-bold text-primary">{horizon}-Month Trend</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-primary">
                      <TrendIcon trend={trendSummary.trend} />
                      {trendSummary.trend}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-slate-500">{trendSummary.district}</p>
                  <div className="flex flex-wrap gap-2">
                    {trendSummary.values.map((v) => (
                      <div
                        key={v.label}
                        className="min-w-[64px] rounded-xl border border-slate-100 bg-surface px-3 py-2 text-center"
                      >
                        <p className="text-[10px] font-semibold uppercase text-slate-400">{v.label}</p>
                        <p className="text-sm font-bold text-primary">{v.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDistrictRow && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-primary">NGBoost Detail</h3>
                  <p className="mb-3 text-xs text-slate-500">{selectedDistrictRow.name}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Predicted</span>
                      <span className="font-bold text-primary">
                        {selectedDistrictRow.predictedCases}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">95% Interval</span>
                      <span className="font-semibold text-primary">{selectedDistrictRow.ci}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Uncertainty</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${uncertaintyBadgeClass(selectedDistrictRow.uncertainty)}`}
                      >
                        {selectedDistrictRow.uncertainty}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Risk</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${riskBadgeClass(selectedDistrictRow.risk)}`}
                      >
                        {selectedDistrictRow.risk}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-primary">
              Forecast Chart — {focusDistrict || selectedMapDistrict?.name || 'All Districts'}
            </h3>
            <p className="mb-3 text-xs text-slate-500">
              Monthly projection across the selected {horizon}-month horizon with 95% confidence band.
            </p>
            <ForecastChart data={chartSeries} height={300} />
          </div>

          {/* Monthly table */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-primary">
                  Monthly Forecast ({horizon}-Month Horizon)
                </h3>
                <p className="text-xs text-slate-500">
                  Click a forecast month header or cell to set the active month across the dashboard.
                </p>
              </div>
            </div>
            <div className="max-h-[420px] overflow-auto">
              {tableRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No forecast data available for this selection.
                </p>
              ) : (
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-3">District</th>
                      {(result?.months || []).map((tab) => (
                        <th key={tab.label} className="pb-2 pr-3">
                          <button
                            type="button"
                            onClick={() => selectActiveMonth(tab.label)}
                            className={`rounded-lg px-2 py-1 text-left transition ${
                              activeMonthLabel === tab.label
                                ? 'bg-secondary/10 font-bold text-secondary'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {tab.shortLabel} {tab.year}
                            <span className="block text-[9px] font-medium normal-case tracking-normal text-slate-400">
                              Forecast
                            </span>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => (
                      <tr key={row.district} className="border-b border-slate-50">
                        <td className="py-2.5 pr-3 font-medium text-primary">{row.district}</td>
                        {(result?.months || []).map((tab) => {
                          const cell = row.cells?.[tab.label];
                          const active = activeMonthLabel === tab.label;
                          return (
                            <td key={tab.label} className="py-2 pr-3">
                              <button
                                type="button"
                                onClick={() => {
                                  selectActiveMonth(tab.label);
                                  setDistrict(row.district);
                                  const match = districts.find((d) => d.name === row.district);
                                  if (match) setSelectedMapId(match.id);
                                }}
                                className={`w-full rounded-lg px-2 py-1.5 text-left transition ${
                                  active ? 'bg-secondary/10' : 'hover:bg-slate-50'
                                }`}
                              >
                                <span className="block font-semibold text-primary">
                                  {cell?.predictedCases ?? '—'}
                                </span>
                                <span className="block text-[10px] text-slate-500">
                                  ({cell?.lower ?? '—'}–{cell?.upper ?? '—'})
                                </span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
