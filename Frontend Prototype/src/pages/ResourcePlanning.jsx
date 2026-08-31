import { useMemo, useState } from 'react';
import { Hexagon, Package, PackagePlus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Navbar from '../components/layout/Navbar';
import ForecastContextBar from '../components/layout/ForecastContextBar';
import ResourceCard from '../components/cards/ResourceCard';
import ExportToolbar from '../components/export/ExportToolbar';
import { generateDistributionPlan, resourceSummary } from '../data/resourceData';
import { useApp } from '../context/AppContext';
import {
  filterByContextDistrict,
  getActiveForecastSummary,
  getContextDistrictName,
  scaleByContext,
} from '../utils/forecastContextUtils';

export default function ResourcePlanning() {
  const { forecastContext } = useApp();
  const { year, month, district, generated } = forecastContext;
  const [plan, setPlan] = useState(null);
  const forecastSummary = getActiveForecastSummary(forecastContext);

  const summary = useMemo(() => {
    if (!generated) return resourceSummary;
    const burden =
      forecastSummary?.predictedCases != null
        ? forecastSummary.predictedCases
        : scaleByContext(resourceSummary.totalRequirement / 6.2, year, month, district);
    const totalRequirement = Math.round(burden * 6.2);
    const availableStock = scaleByContext(resourceSummary.availableStock, year, month, district);
    return {
      totalRequirement,
      availableStock,
      additionalRequirement: Math.max(0, totalRequirement - availableStock),
      forecastBurden: burden,
    };
  }, [generated, year, month, district, forecastSummary]);

  const generate = () => {
    const next = generateDistributionPlan();
    const filtered = generated
      ? filterByContextDistrict(next, 'district', district)
      : next;
    setPlan(filtered.length ? filtered : next);
    toast.success('Distribution plan generated successfully');
  };

  const chartData = (plan || []).map((row) => ({
    district: row.district,
    Required: row.requiredPacks,
    Allocated: row.allocatedPacks,
  }));

  return (
    <div className="min-h-screen">
      <Navbar
        title="Resource Planning"
        subtitle="Triposha supply and nutrition resource allocation"
      />
      <div className="space-y-5 p-4 md:p-6">
        <ForecastContextBar />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ResourceCard
            title="Total Requirement"
            value={summary.totalRequirement.toLocaleString()}
            subtitle={
              generated && summary.forecastBurden != null
                ? `From forecast burden ${summary.forecastBurden.toLocaleString()} cases`
                : 'Packs this quarter'
            }
            icon={Hexagon}
            accent="#6C5CE7"
            footer={<div className="h-1.5 bg-secondary" />}
          />
          <ResourceCard
            title="Available Stock"
            value={summary.availableStock.toLocaleString()}
            subtitle="Packs in warehouses"
            icon={Package}
            accent="#27AE60"
            footer={
              <div className="px-5 pb-4">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-success"
                    style={{
                      width: `${(summary.availableStock / summary.totalRequirement) * 100}%`,
                    }}
                  />
                </div>
              </div>
            }
          />
          <ResourceCard
            title="Additional Requirement"
            value={summary.additionalRequirement.toLocaleString()}
            subtitle="Packs to procure"
            icon={PackagePlus}
            accent="#E74C3C"
            footer={
              <div className="px-5 pb-4">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-danger"
                    style={{
                      width: `${(summary.additionalRequirement / summary.totalRequirement) * 100}%`,
                    }}
                  />
                </div>
              </div>
            }
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-secondary/25"
          >
            <Sparkles size={16} /> Generate Distribution Plan
          </button>
          <ExportToolbar
            pdfSections={[
              {
                heading: 'Resource Summary',
                lines: [
                  `Total Requirement: ${summary.totalRequirement}`,
                  `Available Stock: ${summary.availableStock}`,
                  `Additional Requirement: ${summary.additionalRequirement}`,
                  generated ? `Context: ${year} | ${month} | ${district}` : '',
                ].filter(Boolean),
              },
              {
                heading: 'Allocation',
                lines: (plan || []).slice(0, 15).map(
                  (r) =>
                    `${r.district}: required ${r.requiredPacks}, allocated ${r.allocatedPacks}, ${r.status}`
                ),
              },
            ]}
            excelSheets={{
              Allocation: plan || [],
              Summary: [resourceSummary],
            }}
            csvRows={plan || []}
            pdfName="FedNutri-Resources.pdf"
            excelName="FedNutri-Resources.xlsx"
            csvName="FedNutri-Allocation.csv"
          />
        </div>

        {!plan ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <Hexagon size={56} className="mb-4 text-slate-200" />
            <h3 className="text-lg font-bold text-primary">No distribution plan yet</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Generate a plan to allocate available Triposha stock across districts by malnutrition
              pressure, risk level and delivery capacity.
            </p>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-primary">Allocation by District</h3>
              <p className="mb-4 text-xs text-slate-500">Required vs allocated packs</p>
              <div className="h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 70 }}
                    barGap={2}
                    barCategoryGap="18%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF7" vertical={false} />
                    <XAxis
                      dataKey="district"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      domain={[0, 3200]}
                      ticks={[0, 800, 1600, 2400, 3200]}
                    />
                    <Tooltip
                      formatter={(value) => value.toLocaleString()}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 8px 24px rgba(11,31,77,0.08)',
                      }}
                    />
                    <Legend verticalAlign="top" align="right" />
                    <Bar dataKey="Required" fill="#0B1F4D" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Allocated" fill="#6C5CE7" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="mb-1 font-bold text-primary">District Allocation Plan</h3>
              <p className="mb-4 text-xs text-slate-500">
                Priority-weighted allocation with delivery schedule
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-surface/80 text-left text-[10px] uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-3">District</th>
                      <th className="px-3 py-3">Children</th>
                      <th className="px-3 py-3">Required Packs</th>
                      <th className="px-3 py-3">Allocated Packs</th>
                      <th className="px-3 py-3">Priority</th>
                      <th className="px-3 py-3">Delivery</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.map((row) => (
                      <tr key={row.district} className="border-b border-slate-50">
                        <td className="px-3 py-2.5 font-medium text-primary">{row.district}</td>
                        <td className="px-3 py-2.5">{row.children}</td>
                        <td className="px-3 py-2.5">{row.requiredPacks.toLocaleString()}</td>
                        <td className="px-3 py-2.5">{row.allocatedPacks.toLocaleString()}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              row.priority === 'High'
                                ? 'bg-danger/10 text-danger'
                                : row.priority === 'Medium'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-success/10 text-success'
                            }`}
                          >
                            {row.priority}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{row.deliverySchedule}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              row.status === 'Fulfilled'
                                ? 'bg-success/10 text-success'
                                : row.status === 'Partial'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-danger/10 text-danger'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
