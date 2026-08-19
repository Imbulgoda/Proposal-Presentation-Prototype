import { useMemo, useState } from 'react';
import { CheckCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import ForecastContextBar from '../components/layout/ForecastContextBar';
import ExportToolbar from '../components/export/ExportToolbar';
import { useApp } from '../context/AppContext';
import { filterByContextDistrict } from '../utils/forecastContextUtils';

export default function EarlyWarning() {
  const { alerts, markAlertRead, markAllAlertsRead, forecastContext } = useApp();
  const { year, month, district, generated } = forecastContext;
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All Alerts');
  const [detail, setDetail] = useState(null);

  const contextAlerts = generated
    ? filterByContextDistrict(alerts, 'district', district)
    : alerts;

  const filtered = useMemo(() => {
    return contextAlerts.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.district.toLowerCase().includes(q) ||
        a.alertType.toLowerCase().includes(q);
      const matchesRisk = riskFilter === 'All' || a.risk === riskFilter;
      const matchesStatus =
        statusFilter === 'All Alerts' ||
        (statusFilter === 'Unread Alerts' && a.status === 'Unread') ||
        (statusFilter === 'Read Alerts' && a.status === 'Read');
      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [contextAlerts, search, riskFilter, statusFilter]);

  return (
    <div className="min-h-screen">
      <Navbar title="Early Warning" subtitle="Search, filter and triage district-level warnings" />
      <div className="p-4 md:p-6">
        <ForecastContextBar className="mb-4" />
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-primary">Alert Management</h3>
              <p className="text-xs text-slate-500">Search, filter and triage district-level warnings</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  markAllAlertsRead();
                  toast.success('All alerts marked as read');
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <CheckCheck size={14} /> Mark all as read
              </button>
              <ExportToolbar
                pdfSections={[
                  {
                    heading: 'Early Warning Alerts',
                    lines: filtered.map(
                      (a) =>
                        `${a.district} · ${a.alertType} · ${a.risk} · +${a.increase}% · ${a.status}`
                    ),
                  },
                ]}
                excelSheets={{ Alerts: filtered }}
                csvRows={filtered}
                pdfName="FedNutri-Alerts.pdf"
                excelName="FedNutri-Alerts.xlsx"
                csvName="FedNutri-Alerts.csv"
              />
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search district or alert type..."
                className="w-full rounded-full border border-slate-200 bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-secondary"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-secondary"
            >
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-secondary"
            >
              {['All Alerts', 'Unread Alerts', 'Read Alerts'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="pb-3">District</th>
                  <th className="pb-3">Alert Type</th>
                  <th className="pb-3">Risk</th>
                  <th className="pb-3">Increase %</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="py-3 font-semibold text-primary">{a.district}</td>
                    <td className="py-3 text-slate-500">{a.alertType}</td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          a.risk === 'Critical'
                            ? 'bg-danger/10 text-danger'
                            : a.risk === 'High'
                              ? 'bg-warning/10 text-warning'
                              : a.risk === 'Medium'
                                ? 'bg-secondary/10 text-secondary'
                                : 'bg-success/10 text-success'
                        }`}
                      >
                        {a.risk}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-primary">+{a.increase}%</td>
                    <td className="py-3 text-slate-500">{a.date}</td>
                    <td className="py-3 text-slate-600">{a.status}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {a.status === 'Unread' && (
                          <button
                            type="button"
                            onClick={() => markAlertRead(a.id)}
                            className="text-xs font-semibold text-secondary hover:underline"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDetail(a)}
                          className="text-xs font-semibold text-secondary hover:underline"
                        >
                          View details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-primary">{detail.district} — {detail.alertType}</h3>
            <p className="mt-1 text-xs text-slate-400">{detail.date}</p>
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <span className="text-slate-500">Risk:</span>{' '}
                <span className="font-semibold">{detail.risk}</span>
              </p>
              <p>
                <span className="text-slate-500">Increase:</span>{' '}
                <span className="font-semibold">+{detail.increase}%</span>
              </p>
              <p className="rounded-xl bg-surface p-3 leading-relaxed text-slate-700">{detail.details}</p>
            </div>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="mt-5 w-full rounded-full bg-secondary py-2.5 text-sm font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
