import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import SHAPChart from '../components/charts/SHAPChart';
import ExportToolbar from '../components/export/ExportToolbar';
import { getShapForDistrict } from '../data/shapData';
import { districts } from '../data/districtData';

export default function ExplainableAI() {
  const [district, setDistrict] = useState('Badulla');
  const shap = getShapForDistrict(district);
  const top = shap.features.slice(0, 2);

  return (
    <div className="min-h-screen">
      <Navbar title="Explainable AI" subtitle="SHAP-style feature attributions for district predictions" />
      <div className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-3 md:p-6">
        <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-primary">Prediction Summary</h3>
          <p className="mb-4 text-xs text-slate-500">Select a district to explain.</p>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm outline-none focus:border-secondary"
          >
            {districts.map((d) => (
              <option key={d.id}>{d.name}</option>
            ))}
          </select>

          <div className="mb-4 rounded-2xl bg-gradient-to-br from-[#4C1D95] to-secondary p-5 text-white">
            <p className="text-xs text-white/70">Model prediction</p>
            <p className="mt-1 text-2xl font-bold">{district}</p>
            <p className="mt-1 text-sm text-white/85">
              {shap.prediction} predicted cases · DMPI {shap.dmpi}
            </p>
            <span className="mt-3 inline-block rounded-full bg-black/20 px-3 py-1 text-xs font-semibold">
              {shap.risk} Risk
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Confidence</span>
              <span className="font-semibold text-primary">{shap.confidence}%</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Trend</span>
              <span className="font-semibold text-primary">{shap.trend}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Risk class</span>
              <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                {shap.risk}
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-slate-500">Triposha coverage</span>
              <span className="font-semibold text-primary">{shap.triposhaCoverage}%</span>
            </div>
          </div>
        </aside>

        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-bold text-primary">Feature Importance (SHAP)</h3>
                <p className="text-xs text-slate-500">
                  Contribution of each factor to the {district} prediction.
                </p>
              </div>
              <ExportToolbar
                pdfSections={[
                  {
                    heading: `SHAP — ${district}`,
                    lines: shap.features.map((f) => `${f.name}: ${f.value}%`),
                  },
                ]}
                excelSheets={{ SHAP: shap.features }}
                csvRows={shap.features}
                pdfName="FedNutri-SHAP.pdf"
                excelName="FedNutri-SHAP.xlsx"
                csvName="FedNutri-SHAP.csv"
              />
            </div>
            <SHAPChart data={shap.features} height={280} />
            <div className="mt-4 flex gap-3 rounded-xl bg-secondary/10 p-4 text-sm text-primary">
              <Lightbulb size={18} className="mt-0.5 shrink-0 text-secondary" />
              <p>
                Main contributing factors identified by AI model: {top[0].name} ({top[0].value}%) and{' '}
                {top[1].name} ({top[1].value}%) dominate the prediction for {district}, placing the
                district in the {shap.risk.toLowerCase()} risk band with a DMPI score of {shap.dmpi}.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-primary">Factor Interpretation</h3>
            <p className="mb-4 text-xs text-slate-500">Plain-language explanation for programme officers.</p>
            <div className="space-y-3">
              {shap.features.map((f) => (
                <div
                  key={f.name}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-surface/60 px-4 py-3"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                    style={{ background: f.color }}
                  >
                    {f.value}%
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-primary">{f.name}</p>
                    <p className="text-xs leading-relaxed text-slate-600">{f.interpretation}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-slate-400">
              Attributions are simulated for research demonstration purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
