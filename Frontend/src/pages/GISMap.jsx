import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import SriLankaMap from '../components/maps/SriLankaMap';
import ExportToolbar from '../components/export/ExportToolbar';
import { districts } from '../data/districtData';

const filters = ['All Districts', 'High Risk', 'Medium Risk', 'Low Risk'];

export default function GISMap() {
  const [filter, setFilter] = useState('All Districts');
  const [selected, setSelected] = useState(districts[0]);

  const riskFilter =
    filter === 'All Districts' ? 'All' : filter.replace(' Risk', '');

  const list = districts
    .filter((d) => riskFilter === 'All' || d.risk === riskFilter)
    .sort((a, b) => b.cases - a.cases);

  return (
    <div className="min-h-screen">
      <Navbar title="GIS Risk Map" subtitle="Interactive district malnutrition risk visualisation" />
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <ExportToolbar
            pdfSections={[
              {
                heading: 'GIS Risk Snapshot',
                lines: list.slice(0, 10).map(
                  (d) => `${d.name}: ${d.cases} cases · ${d.risk} · DMPI ${d.dmpi}`
                ),
              },
            ]}
            excelSheets={{ Districts: districts }}
            csvRows={districts}
            pdfName="FedNutri-GIS.pdf"
            excelName="FedNutri-GIS.xlsx"
            csvName="FedNutri-GIS.csv"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-3">
            <h3 className="font-bold text-primary">Sri Lanka Malnutrition Risk Map</h3>
            <p className="mb-3 text-xs text-slate-500">Marker size scales with predicted cases.</p>
            <div className="relative h-[520px]">
              <SriLankaMap
                filterRisk={riskFilter === 'All' ? 'All' : riskFilter}
                selectedId={selected?.id}
                onSelect={setSelected}
                height="520px"
              />
              <div className="absolute bottom-3 left-3 z-[400] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow">
                <p className="mb-1 font-semibold text-primary">Risk Legend</p>
                <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-danger" /> High Risk</p>
                <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Medium Risk</p>
                <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Low Risk</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 xl:col-span-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-primary">{selected?.name} District</h3>
              <p className="mb-4 text-xs text-slate-500">{selected?.province} Province</p>
              <div className="divide-y divide-slate-100 text-sm">
                {[
                  ['Predicted Cases', selected?.cases],
                  ['Risk', selected?.risk],
                  ['Triposha', `${selected?.triposha?.toLocaleString()} Packs`],
                  ['Trend', selected?.trend],
                  ['DMPI Score', selected?.dmpi],
                  ['Child Population', selected?.childPopulation?.toLocaleString()],
                  ['Triposha Coverage', `${selected?.triposhaCoverage}%`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2.5">
                    <span className="text-slate-500">{label}</span>
                    {label === 'Risk' ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          value === 'High'
                            ? 'bg-danger/10 text-danger'
                            : value === 'Medium'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-success/10 text-success'
                        }`}
                      >
                        {value}
                      </span>
                    ) : (
                      <span className="font-semibold text-primary">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-primary">District Index</h3>
              <p className="mb-3 text-xs text-slate-500">{list.length} districts shown</p>
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {list.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelected(d)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      selected?.id === d.id ? 'bg-secondary/10' : 'hover:bg-surface'
                    }`}
                  >
                    <span className="font-medium text-primary">{d.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{d.cases}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          d.risk === 'High'
                            ? 'bg-danger/10 text-danger'
                            : d.risk === 'Medium'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-success/10 text-success'
                        }`}
                      >
                        {d.risk} Risk
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
