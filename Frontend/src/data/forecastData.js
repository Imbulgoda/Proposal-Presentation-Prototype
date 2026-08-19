import {
  getMonthFactor,
  isAllDistricts,
  isMonthSelected,
  toForecastDistrictScope,
} from '../utils/forecastContextUtils';

const baseHistorical = [
  { year: 2019, historical: 6200 },
  { year: 2020, historical: 6550 },
  { year: 2021, historical: 7100 },
  { year: 2022, historical: 7600 },
  { year: 2023, historical: 8050 },
];

const modelMultipliers = {
  XGBoost: 1,
  'Random Forest': 0.97,
  LSTM: 1.04,
};

export const modelPerformance = {
  XGBoost: { accuracy: 94.2, rmse: 118, mae: 86 },
  'Random Forest': { accuracy: 91.8, rmse: 142, mae: 104 },
  LSTM: { accuracy: 92.5, rmse: 131, mae: 97 },
};

export const annualTrendData = [
  { year: 2019, total: 6200, mam: 5100, sam: 1100 },
  { year: 2020, total: 6550, mam: 5350, sam: 1200 },
  { year: 2021, total: 7100, mam: 5750, sam: 1350 },
  { year: 2022, total: 7600, mam: 6150, sam: 1450 },
  { year: 2023, total: 8050, mam: 6500, sam: 1550 },
];

export const riskDistribution = [
  { name: 'High Risk', value: 6, color: '#E74C3C' },
  { name: 'Medium Risk', value: 8, color: '#F39C12' },
  { name: 'Low Risk', value: 11, color: '#27AE60' },
];

function riskFromCases(cases) {
  if (cases >= 9000) return 'High';
  if (cases >= 7500) return 'Medium';
  return 'Low';
}

export function generateForecast({
  model = 'XGBoost',
  district = 'National',
  until = 2035,
  year,
  month = 'All Months',
}) {
  const mult = modelMultipliers[model] || 1;
  const monthFactor = getMonthFactor(month);
  const scope = toForecastDistrictScope(district);
  const isNational = isAllDistricts(district) || scope === 'National';
  const districtFactor = isNational ? 1 : 0.06 + (scope.length % 7) * 0.01;

  const start = isNational ? 8180 : 480;
  const growth = isNational ? 240 : 18;
  const horizon = year && year >= 2024 ? year : until;

  const series = baseHistorical.map((row) => ({
    year: row.year,
    historical: Math.round(
      row.historical * districtFactor * monthFactor * (isNational ? 1 : 0.065)
    ),
    predicted: null,
    upper: null,
    lower: null,
  }));

  if (!isNational) {
    series.forEach((row, i) => {
      row.historical = Math.round((420 + i * 15 + scope.length) * monthFactor);
    });
  }

  const lastHist = series[series.length - 1];
  lastHist.predicted = lastHist.historical;
  lastHist.upper = lastHist.historical;
  lastHist.lower = lastHist.historical;

  const table = [];
  for (let forecastYear = 2024; forecastYear <= horizon; forecastYear++) {
    const offset = forecastYear - 2023;
    const predicted = Math.round(
      (start + growth * offset) *
        mult *
        monthFactor *
        (isNational ? 1 : districtFactor * 10)
    );
    const band = Math.round(predicted * 0.06);
    const row = {
      year: forecastYear,
      historical: null,
      predicted,
      upper: predicted + band,
      lower: Math.max(0, predicted - band),
    };
    series.push(row);
    table.push({
      year: forecastYear,
      month: forecastYear === year && isMonthSelected(month) ? month : null,
      predictedCases: predicted,
      ci: `${(predicted - band).toLocaleString()} – ${(predicted + band).toLocaleString()}`,
      risk: riskFromCases(isNational ? predicted : predicted * 15),
    });
  }

  return {
    series,
    table,
    performance: modelPerformance[model],
    model,
    district: isNational ? 'All Districts' : scope,
    until: horizon,
    year: year || horizon,
    month,
  };
}

export function generateDistrictForecast(districtName, until = 2030) {
  const seed = districtName.length * 17;
  const base = 420 + (seed % 100);
  const series = [];
  for (let year = 2019; year <= until; year++) {
    const i = year - 2019;
    if (year <= 2023) {
      const historical = Math.round(base + i * 15);
      series.push({
        year,
        historical,
        predicted: year === 2023 ? historical : null,
        upper: year === 2023 ? historical : null,
        lower: year === 2023 ? historical : null,
      });
    } else {
      const predicted = Math.round(base + (year - 2019) * 16 + (seed % 20));
      const band = Math.round(predicted * 0.08);
      series.push({
        year,
        historical: null,
        predicted,
        upper: predicted + band,
        lower: predicted - band,
      });
    }
  }
  return series;
}
