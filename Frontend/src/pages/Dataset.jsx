import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import ExportToolbar from '../components/export/ExportToolbar';
import { datasetRows } from '../data/datasetData';

export default function Dataset() {
  const [search, setSearch] = useState('');
  const [risk, setRisk] = useState('All');
  const [year, setYear] = useState('All');

  const filtered = useMemo(() => {
    return datasetRows.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.district.toLowerCase().includes(q);
      const matchRisk = risk === 'All' || r.riskLevel === risk;
      const matchYear = year === 'All' || String(r.year) === year;
      return matchSearch && matchRisk && matchYear;
    });
  }, [search, risk, year]);

  return (
    <div className="min-h-screen">
      <Navbar title="Dataset" subtitle="Simulated research nutrition dataset explorer" />
      <div className="p-4 md:p-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search district..."
                  className="w-full rounded-full border border-slate-200 bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-secondary"
                />
              </div>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2.5 text-sm"
              >
                {['All', 'High', 'Medium', 'Low'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2.5 text-sm"
              >
                {['All', '2019', '2020', '2021', '2022', '2023'].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            <ExportToolbar
              pdfSections={[
                {
                  heading: 'Dataset Export',
                  lines: [`Rows: ${filtered.length}`, `Filter risk: ${risk}`, `Filter year: ${year}`],
                },
              ]}
              excelSheets={{ Dataset: filtered }}
              csvRows={filtered}
              pdfName="FedNutri-Dataset.pdf"
              excelName="FedNutri-Dataset.xlsx"
              csvName="FedNutri-Dataset.csv"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="pb-3">District</th>
                  <th className="pb-3">Year</th>
                  <th className="pb-3">Children Population</th>
                  <th className="pb-3">Malnutrition Cases</th>
                  <th className="pb-3">Risk Level</th>
                  <th className="pb-3">Climate Factor</th>
                  <th className="pb-3">Economic Factor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="py-2.5 font-medium text-primary">{r.district}</td>
                    <td className="py-2.5">{r.year}</td>
                    <td className="py-2.5">{r.childrenPopulation.toLocaleString()}</td>
                    <td className="py-2.5">{r.malnutritionCases}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          r.riskLevel === 'High'
                            ? 'bg-danger/10 text-danger'
                            : r.riskLevel === 'Medium'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-success/10 text-success'
                        }`}
                      >
                        {r.riskLevel}
                      </span>
                    </td>
                    <td className="py-2.5">{r.climateFactor}</td>
                    <td className="py-2.5">{r.economicFactor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Showing {Math.min(100, filtered.length)} of {filtered.length} filtered rows (simulated).
          </p>
        </div>
      </div>
    </div>
  );
}
