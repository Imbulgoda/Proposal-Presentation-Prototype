import catalog from "../../../../packages/contracts/sri_lanka_context.json";

type YearRow = {
  economic_growth_rate_pct?: number;
  food_price_inflation_pct?: number;
  food_price_index?: number;
  economy_stress_level?: string;
  events?: { type: string; label: string; severity: string }[];
};

export function resolveContextForYear(year: number) {
  const years = (catalog.years ?? {}) as Record<string, YearRow>;
  const key = String(year in years ? year : catalog.default_year ?? 2024);
  const row = years[key] ?? {};
  return {
    visit_year: Number(key),
    economic_growth_rate_pct: row.economic_growth_rate_pct ?? null,
    food_price_inflation_pct: row.food_price_inflation_pct ?? null,
    food_price_index: row.food_price_index ?? null,
    economy_stress_level: row.economy_stress_level ?? null,
    events: row.events ?? [],
    disclaimer: catalog.disclaimer,
  };
}
