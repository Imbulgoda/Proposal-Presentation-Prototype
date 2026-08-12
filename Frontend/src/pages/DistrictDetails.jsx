import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import MetricCard from '../components/cards/MetricCard';
import ForecastChart from '../components/charts/ForecastChart';
import SHAPChart from '../components/charts/SHAPChart';
import ExportToolbar from '../components/export/ExportToolbar';
import { districts } from '../data/districtData';
import { generateDistrictForecast } from '../data/forecastData';

export default function DistrictDetails() {
  const [name, setName] = useState('Badulla');
  const district = districts.find((d) => d.name === name) || districts[0];
  const series = generateDistrictForecast(district.name, 2030);
  const drivers = [
    { name: 'Poverty Rate', value: district.povertyRate, color: '#6C5CE7' },
    { name: 'Food Inflation', value: district.foodInflation, color: '#0B1F4D' },
    { name: 'Low Birth Weight', value: district.lowBirthWeight, color: '#F39C12' },
    { name: 'Rainfall Variation', value: district.rainfallVariation, color: '#27AE60' },
  ];

  return (
    <div className="min-h-screen">
      <Navbar title="District Details" subtitle="District profile, risk drivers and local forecast" />
      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary outline-none focus:border-secondary"
          >
            {districts.map((d) => (
              <option key={d.id}>{d.name}</option>
            ))}
          </select>
          <ExportToolbar
            pdfSections={[
              {
                heading: `${district.name} Profile`,
                lines: [
                  `Cases: ${district.cases}`,
                  `Triposha: ${district.triposha}`,
                  `DMPI: ${district.dmpi}`,
                  `Risk: ${district.risk}`,
                ],
              },
            ]}
            excelSheets={{ District: [district], Forecast: series }}
            csvRows={[district]}
            pdfName={`FedNutri-${district.name}.pdf`}
            excelName={`FedNutri-${district.name}.xlsx`}
            csvName={`FedNutri-${district.name}.csv`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Predicted Cases" value={district.cases} subtitle="children" />
          <MetricCard
            title="Triposha Requirement"
            value={district.triposha.toLocaleString()}
            subtitle="packs"
            accent="#F39C12"
          />
          <MetricCard title="DMPI Score" value={district.dmpi} subtitle="malnutrition pressure" accent="#E74C3C" />
          <MetricCard
            title="Child Population"
            value={district.childPopulation.toLocaleString()}
            subtitle="under 5 years"
            accent="#3498DB"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-primary">{district.name} Profile</h3>
            <p className="mb-4 text-xs text-slate-500">{district.province} Province</p>
            <div className="divide-y divide-slate-100 text-sm">
              {[
                ['Risk level', district.risk],
                ['Trend', district.trend],
                ['Poverty rate', `${district.povertyRate}%`],
                ['Food inflation', `${district.foodInflation}%`],
                ['Low birth weight', `${district.lowBirthWeight}%`],
                ['Triposha coverage', `${district.triposhaCoverage}%`],
                ['Rainfall variation', `${district.rainfallVariation}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-2.5">
                  <span className="text-slate-500">{label}</span>
                  {label === 'Risk level' ? (
                    <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
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
            <h3 className="font-bold text-primary">Risk Drivers</h3>
            <p className="mb-3 text-xs text-slate-500">Indicator levels for this district</p>
            <SHAPChart data={drivers} height={260} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-primary">District Forecast</h3>
          <p className="mb-3 text-xs text-slate-500">Projected caseload to 2030 (XGBoost)</p>
          <ForecastChart data={series} height={340} />
        </div>
      </div>
    </div>
  );
}
