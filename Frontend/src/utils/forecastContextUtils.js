export const MONTH_ALL = 'All Months';
export const DISTRICT_ALL = 'All Districts';

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_OPTIONS = [MONTH_ALL, ...MONTHS];

export const FORECAST_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2035];

export const defaultForecastContext = {
  year: 2025,
  month: MONTH_ALL,
  district: DISTRICT_ALL,
  model: 'XGBoost',
  generated: false,
  result: null,
};

export function migrateForecastContext(context = {}) {
  let month = context.month;
  if (month === 'Non-Selected') month = MONTH_ALL;

  let district = context.district;
  if (district === 'National (all districts)' || district === 'National') {
    district = DISTRICT_ALL;
  }

  return { ...context, month, district };
}

export function isAllMonths(month) {
  return !month || month === MONTH_ALL || month === 'Non-Selected';
}

export function isMonthSelected(month) {
  return Boolean(month && !isAllMonths(month) && MONTHS.includes(month));
}

export function getMonthFactor(month) {
  if (!isMonthSelected(month)) return 1;
  const monthIndex = MONTHS.indexOf(month) + 1;
  return monthIndex > 0 ? 0.94 + monthIndex / 100 : 1;
}

export function isAllDistricts(district) {
  return (
    !district ||
    district === DISTRICT_ALL ||
    district === 'National' ||
    district === 'National (all districts)'
  );
}

export function normalizeDistrict(district) {
  if (isAllDistricts(district)) return DISTRICT_ALL;
  return district;
}

function contextSeed(year, month, district) {
  const monthIndex = isMonthSelected(month) ? MONTHS.indexOf(month) + 1 : 0;
  const districtKey = isAllDistricts(district) ? DISTRICT_ALL : district;
  const districtSeed = String(districtKey || '')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return year * 100 + monthIndex * 13 + districtSeed;
}

export function scaleByContext(value, year, month, district) {
  const seed = contextSeed(year, month, district);
  const factor = 0.82 + (seed % 36) / 100;
  return Math.round(Number(value || 0) * factor);
}

export function adjustDistrictRecord(district, year, month) {
  if (!district) return district;
  return {
    ...district,
    cases: scaleByContext(district.cases, year, month, district.name),
    triposha: scaleByContext(district.triposha, year, month, district.name),
    dmpi: Math.min(99, Math.max(20, scaleByContext(district.dmpi, year, month, district.name))),
    triposhaCoverage: Math.min(
      95,
      Math.max(45, scaleByContext(district.triposhaCoverage, year, month, district.name))
    ),
  };
}

export function getContextDistrictName(district) {
  if (isAllDistricts(district)) return null;
  return normalizeDistrict(district);
}

export function filterByContextDistrict(items, districtKey, district) {
  const name = getContextDistrictName(district);
  if (!name) return items;
  return items.filter((item) => item[districtKey] === name);
}

export function getDashboardMetricsFromContext(baseMetrics, year, month, district) {
  const isNational = isAllDistricts(district);
  const predictedCases = scaleByContext(baseMetrics.predictedCases, year, month, district);
  const triposhaRequirement = scaleByContext(
    baseMetrics.triposhaRequirement,
    year,
    month,
    district
  );

  return {
    ...baseMetrics,
    predictedCases,
    triposhaRequirement,
    predictedCasesChange: Number(
      (((predictedCases - baseMetrics.predictedCases) / baseMetrics.predictedCases) * 100).toFixed(1)
    ),
    highRiskDistricts: isNational
      ? baseMetrics.highRiskDistricts
      : Math.max(1, Math.min(6, Math.round(baseMetrics.highRiskDistricts / 4))),
    earlyWarningAlerts: isNational
      ? baseMetrics.earlyWarningAlerts
      : Math.max(1, Math.min(5, Math.round(baseMetrics.earlyWarningAlerts / 3))),
    totalDistricts: isNational ? baseMetrics.totalDistricts : 1,
  };
}

export function getTriposhaDemandFromContext(baseDemand, year, month, district) {
  const total = baseDemand.reduce((sum, item) => sum + item.value, 0);
  const adjustedTotal = scaleByContext(total, year, month, district);
  const ratio = adjustedTotal / total;
  return baseDemand.map((item) => ({
    ...item,
    value: Math.round(item.value * ratio),
  }));
}

export function getTopDistrictsFromContext(topDistricts, districts, year, month, district) {
  const name = getContextDistrictName(district);
  if (!name) return topDistricts;

  const selected = districts.find((d) => d.name === name);
  if (!selected) return topDistricts;

  const adjusted = adjustDistrictRecord(selected, year, month);
  return [
    {
      rank: 1,
      district: adjusted.name,
      cases: adjusted.cases,
      risk: adjusted.risk,
    },
  ];
}

export function getForecastSummaryFromContext(baseSummary, year, month, district, result) {
  if (result?.series?.length) return result.series;
  return baseSummary.map((row) => {
    if (row.year > year) return { ...row, historical: null, predicted: null, upper: null, lower: null };
    if (row.year === year && row.predicted != null) {
      const predicted = scaleByContext(row.predicted, year, month, district);
      const band = Math.round(predicted * 0.06);
      return {
        ...row,
        predicted,
        upper: predicted + band,
        lower: Math.max(0, predicted - band),
      };
    }
    if (row.historical != null) {
      return {
        ...row,
        historical: scaleByContext(row.historical, year, month, district),
      };
    }
    return row;
  });
}

export function toForecastDistrictScope(district) {
  return isAllDistricts(district) ? 'National' : district;
}

export function getForecastScopeLabel(district) {
  return isAllDistricts(district) ? DISTRICT_ALL : district;
}

export function getNationalShapProfile(year, month) {
  const base = {
    prediction: 8426,
    dmpi: 68,
    confidence: 91.5,
    trend: 'Increasing',
    risk: 'Medium',
    triposhaCoverage: 74,
    features: [
      {
        name: 'Poverty Rate',
        value: 29,
        color: '#6C5CE7',
        interpretation:
          'National household poverty remains the strongest structural driver of childhood malnutrition across districts.',
      },
      {
        name: 'Food Inflation',
        value: 24,
        color: '#0B1F4D',
        interpretation:
          'Rising food prices reduce purchasing power nationwide, affecting dietary diversity for under-five children.',
      },
      {
        name: 'Low Birth Weight',
        value: 17,
        color: '#F39C12',
        interpretation:
          'Elevated low birth weight rates contribute to higher predicted caseloads across multiple provinces.',
      },
      {
        name: 'Triposha Coverage',
        value: 15,
        color: '#27AE60',
        interpretation:
          'National supplement coverage gaps reduce the protective effect of Triposha distribution programmes.',
      },
      {
        name: 'Rainfall Variation',
        value: 14,
        color: '#3498DB',
        interpretation:
          'Climate variability disrupts food production and household income patterns at the national level.',
      },
    ],
  };

  return {
    ...base,
    prediction: scaleByContext(base.prediction, year, month, DISTRICT_ALL),
    dmpi: Math.min(99, scaleByContext(base.dmpi, year, month, DISTRICT_ALL)),
    triposhaCoverage: Math.min(
      95,
      scaleByContext(base.triposhaCoverage, year, month, DISTRICT_ALL)
    ),
  };
}

export function getNationalDistrictProfile(allDistricts, year, month, applyContext = true) {
  const count = allDistricts.length || 1;
  const totals = allDistricts.reduce(
    (acc, d) => ({
      cases: acc.cases + d.cases,
      triposha: acc.triposha + d.triposha,
      childPopulation: acc.childPopulation + d.childPopulation,
      dmpi: acc.dmpi + d.dmpi,
      povertyRate: acc.povertyRate + d.povertyRate,
      foodInflation: acc.foodInflation + d.foodInflation,
      lowBirthWeight: acc.lowBirthWeight + d.lowBirthWeight,
      triposhaCoverage: acc.triposhaCoverage + d.triposhaCoverage,
      rainfallVariation: acc.rainfallVariation + d.rainfallVariation,
    }),
    {
      cases: 0,
      triposha: 0,
      childPopulation: 0,
      dmpi: 0,
      povertyRate: 0,
      foodInflation: 0,
      lowBirthWeight: 0,
      triposhaCoverage: 0,
      rainfallVariation: 0,
    }
  );

  const profile = {
    id: 'all-districts',
    name: DISTRICT_ALL,
    province: 'National',
    lat: 7.8731,
    lng: 80.7718,
    cases: totals.cases,
    triposha: totals.triposha,
    childPopulation: totals.childPopulation,
    dmpi: Math.round(totals.dmpi / count),
    trend: 'Increasing',
    risk: 'Medium',
    povertyRate: Math.round(totals.povertyRate / count),
    foodInflation: Math.round(totals.foodInflation / count),
    lowBirthWeight: Math.round(totals.lowBirthWeight / count),
    triposhaCoverage: Math.round(totals.triposhaCoverage / count),
    rainfallVariation: Math.round(totals.rainfallVariation / count),
  };

  if (!applyContext) return profile;
  return adjustDistrictRecord(profile, year, month);
}

export function isNationalForecastScope(district, generated) {
  return Boolean(generated && isAllDistricts(district));
}
