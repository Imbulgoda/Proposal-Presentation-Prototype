import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import TrendChart from '../components/charts/TrendChart';
import RiskDistributionChart from '../components/charts/RiskDistributionChart';
import ExportToolbar from '../components/export/ExportToolbar';
import { annualTrendData, riskDistribution } from '../data/forecastData';
import { districts } from '../data/districtData';

export default function TrendAnalysis() {
  const [view, setView] = useState('Annual View');
  const seasonal = annualTrendData.map((d) => ({
    ...d,
    total: Math.round(d.total * 0.28),
    mam: Math.round(d.mam * 0.28),
    sam: Math.round(d.sam * 0.28),
  }));

  const sorted = [...districts].sort((a, b) => b.cases - a.cases).slice(0, 10);

  return (
    <div className="min-h-screen">
      <Navbar title="Trend Analysis" subtitle="Annual and seasonal caseload patterns across districts" />
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {['Annual View', 'Seasonal View'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  view === v
                    ? 'bg-primary text-white'
                    : 'border border-slate-200 bg-white text-slate-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <ExportToolbar
            pdfSections={[
              {
                heading: 'Trend Analysis',
                lines: annualTrendData.map(
                  (d) => `${d.year}: total ${d.total}, MAM ${d.mam}, SAM ${d.sam}`
                ),
              },
            ]}
            excelSheets={{ Trends: annualTrendData, Districts: sorted }}
            csvRows={sorted}
            pdfName="FedNutri-Trends.pdf"
            excelName="FedNutri-Trends.xlsx"
            csvName="FedNutri-DistrictComparison.csv"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
            <h3 className="font-bold text-primary">Annual Caseload Trend</h3>
            <p className="mb-3 text-xs text-slate-500">
              {view === 'Annual View'
                ? 'Total, SAM and MAM cases 2019–2023.'
                : 'Seasonal proxy view (approx. quarterly share).'}
            </p>
            <TrendChart data={view === 'Annual View' ? annualTrendData : seasonal} height={300} />
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
            <h3 className="font-bold text-primary">Risk Distribution</h3>
            <p className="mb-3 text-xs text-slate-500">Districts by risk classification.</p>
            <RiskDistributionChart data={riskDistribution} height={300} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-primary">District Comparison</h3>
          <p className="mb-4 text-xs text-slate-500">Predicted cases and DMPI pressure by district.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-primary">
                  <th className="rounded-l-xl px-3 py-3">District</th>
                  <th className="px-3 py-3">Cases</th>
                  <th className="px-3 py-3">DMPI</th>
                  <th className="px-3 py-3">Trend</th>
                  <th className="rounded-r-xl px-3 py-3">Pressure</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50">
                    <td className="px-3 py-3 font-medium text-primary">{d.name}</td>
                    <td className="px-3 py-3">{d.cases}</td>
                    <td className="px-3 py-3">{d.dmpi}</td>
                    <td className="px-3 py-3">{d.trend}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-32 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${d.dmpi}%`,
                              background: d.dmpi >= 75 ? '#E74C3C' : d.dmpi >= 55 ? '#F39C12' : '#27AE60',
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{d.dmpi}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
