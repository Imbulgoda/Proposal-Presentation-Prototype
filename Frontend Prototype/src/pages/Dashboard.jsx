import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Baby,
  MapPinned,
  Package,
  ShieldAlert,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import ForecastContextBar from '../components/layout/ForecastContextBar';
import MetricCard from '../components/cards/MetricCard';
import StaffServiceCard from '../components/cards/StaffServiceCard';
import AlertCard from '../components/cards/AlertCard';
import ForecastChart from '../components/charts/ForecastChart';
import ResourceChart from '../components/charts/ResourceChart';
import SriLankaMap from '../components/maps/SriLankaMap';
import ExportToolbar from '../components/export/ExportToolbar';
import {
  dashboardMetrics,
  forecastSummary,
  programmePerformance,
  topDistricts,
  triposhaDemand,
} from '../data/dashboardData';
import { useApp } from '../context/AppContext';
import { districts } from '../data/districtData';
import {
  filterByContextDistrict,
  getActiveForecastSummary,
  getContextDistrictName,
  getDashboardMetricsFromContext,
  getForecastAwareDistricts,
  getForecastSummaryFromContext,
  getTopDistrictsFromContext,
  getTriposhaDemandFromContext,
} from '../utils/forecastContextUtils';

export default function Dashboard() {
  const { alerts, forecastContext } = useApp();
  const { year, month, district, generated, result } = forecastContext;

  const metrics = generated
    ? getDashboardMetricsFromContext(dashboardMetrics, year, month, district, forecastContext)
    : dashboardMetrics;
  const chartData = generated
    ? getForecastSummaryFromContext(forecastSummary, year, month, district, result)
    : forecastSummary;
  const demandData = generated
    ? getTriposhaDemandFromContext(triposhaDemand, year, month, district)
    : triposhaDemand;
  const districtsView = generated
    ? getTopDistrictsFromContext(topDistricts, districts, year, month, district, forecastContext)
    : topDistricts;
  const alertsView = generated
    ? filterByContextDistrict(alerts, 'district', district)
    : alerts;
  const contextDistrictName = getContextDistrictName(district);
  const forecastDistricts = generated
    ? getForecastAwareDistricts(districts, forecastContext)
    : districts;
  const selectedDistrict = contextDistrictName
    ? forecastDistricts.find((d) => d.name === contextDistrictName)
    : null;
  const demandTotal = demandData.reduce((sum, item) => sum + item.value, 0);
  const summary = getActiveForecastSummary(forecastContext);

  const pdfSections = [
    {
      heading: 'Dashboard Summary',
      lines: [
        generated ? `Context: ${year} | ${month} | ${district}` : 'Context: Default dataset',
        summary?.predictedCases != null
          ? `Active predicted cases: ${summary.predictedCases}`
          : '',
        `Total Districts: ${metrics.totalDistricts}`,
        `High Risk Districts: ${metrics.highRiskDistricts}`,
        `Predicted Cases: ${metrics.predictedCases}`,
        `Triposha Requirement: ${metrics.triposhaRequirement}`,
        `Early Warning Alerts: ${metrics.earlyWarningAlerts}`,
      ],
    },
    {
      heading: 'Top Districts',
      lines: districtsView.map((d) => `${d.rank}. ${d.district} — ${d.cases} (${d.risk})`),
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar
        title="Dashboard"
        subtitle="AI-Powered Childhood Nutrition Intelligence"
      />

      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Data refreshed: {dashboardMetrics.dataRefreshed} · Model: {dashboardMetrics.modelVersion} ·
            Simulated research dataset.
          </p>
          <ExportToolbar
            pdfSections={pdfSections}
            excelSheets={{
              'District Data': districts,
              'Top Districts': districtsView,
              Alerts: alertsView,
            }}
            csvRows={districtsView}
            pdfName="FedNutri-Dashboard.pdf"
            excelName="FedNutri-Dashboard.xlsx"
            csvName="FedNutri-TopDistricts.csv"
          />
        </div>

        <div className="flex justify-center">
          <ForecastContextBar />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Total Districts"
            value={metrics.totalDistricts}
            subtitle="Nationwide coverage"
            icon={MapPinned}
            accent="#3498DB"
          />
          <MetricCard
            title="High Risk Districts"
            value={metrics.highRiskDistricts}
            subtitle="Immediate attention"
            icon={AlertTriangle}
            accent="#E74C3C"
          />
          <MetricCard
            title="Predicted Cases"
            value={metrics.predictedCases.toLocaleString()}
            subtitle={generated ? `Children · ${year} · ${month}` : 'Children · 2025'}
            icon={Baby}
            accent="#6C5CE7"
            trend={metrics.predictedCasesChange}
          />
          <MetricCard
            title="Triposha Requirement"
            value={metrics.triposhaRequirement.toLocaleString()}
            subtitle="Packs this quarter"
            icon={Package}
            accent="#F39C12"
          />
          <MetricCard
            title="Early Warning Alerts"
            value={metrics.earlyWarningAlerts}
            subtitle="Active alerts"
            icon={ShieldAlert}
            accent="#3498DB"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-primary">Sri Lanka Malnutrition Risk Map</h3>
                <p className="text-xs text-slate-500">District markers coloured by risk class</p>
              </div>
              <Link to="/gis-map" className="text-xs font-semibold text-secondary hover:underline">
                Open full map
              </Link>
            </div>
            <div className="relative h-[360px]">
              <SriLankaMap
                height="360px"
                selectedId={selectedDistrict?.id}
                onSelect={() => {}}
                districtData={forecastDistricts}
              />
              <div className="absolute bottom-3 left-3 z-[400] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow">
                <p className="mb-1 font-semibold text-primary">Risk Legend</p>
                <div className="space-y-1">
                  <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-danger" /> Very High</p>
                  <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> High</p>
                  <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Medium</p>
                  <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Low</p>
                  <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Very Low</p>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-2">
            <StaffServiceCard />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-primary">Malnutrition Cases — Historical & Forecast</h3>
                <p className="text-xs text-slate-500">
                  {generated
                    ? `Historical 2019–2023 · Predicted through ${year} · ${month}`
                    : 'Historical 2019–2023 · Predicted 2024–2027'}
                </p>
              </div>
              <Link to="/forecast" className="text-xs font-semibold text-secondary hover:underline">
                Forecast studio
              </Link>
            </div>
            <ForecastChart data={chartData} height={300} />
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
            <h3 className="font-bold text-primary">Triposha Demand</h3>
            <p className="mb-2 text-xs text-slate-500">Distribution by risk zone</p>
            <ResourceChart
              data={demandData}
              centerLabel="Total"
              centerValue={`${demandTotal.toLocaleString()} Packs`}
              height={230}
            />
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
              {demandData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-1 font-bold text-primary">Top 5 Districts by Predicted Cases</h3>
            <p className="mb-4 text-xs text-slate-500">Highest pressure districts this cycle</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="pb-2">Rank</th>
                    <th className="pb-2">District</th>
                    <th className="pb-2">Cases</th>
                    <th className="pb-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {districtsView.map((d) => (
                    <tr key={d.district} className="border-b border-slate-50">
                      <td className="py-2.5 font-semibold text-slate-500">{d.rank}</td>
                      <td className="py-2.5 font-medium text-primary">{d.district}</td>
                      <td className="py-2.5">{d.cases}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            d.risk === 'High'
                              ? 'bg-danger/10 text-danger'
                              : 'bg-warning/10 text-warning'
                          }`}
                        >
                          {d.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <AlertCard alerts={alertsView.length ? alertsView : alerts} />

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="mb-1 font-bold text-primary">Programme Performance</h3>
            <p className="mb-4 text-xs text-slate-500">Key national indicators</p>
            <div className="space-y-4">
              {programmePerformance.map((p) => (
                <div key={p.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-primary">{p.name}</span>
                    <span className="text-slate-500">
                      {p.value}% <span className="text-slate-400">/ target {p.target}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${p.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-secondary/10 px-3 py-2.5 text-xs text-primary">
              {generated
                ? `Projected caseload for ${year} · ${month} · ${district} is ${metrics.predictedCases.toLocaleString()} children (${metrics.predictedCasesChange >= 0 ? '+' : ''}${metrics.predictedCasesChange}%). Prioritise High Risk districts for Triposha and clinic outreach.`
                : 'Projected national caseload for 2025 is 8,426 children (+3.1%). Prioritise High Risk districts for Triposha and clinic outreach.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
