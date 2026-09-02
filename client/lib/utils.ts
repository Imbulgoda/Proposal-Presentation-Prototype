import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value?: number | null) {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value * 100)}%`;
}

export function formatStatus(value?: string | null) {
  if (!value) return "Unknown";
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ageLabel(months?: number | null) {
  if (months === null || months === undefined) return "—";
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${years}y ${rem}m` : `${months} months`;
}

const CLINICAL_DATE_LOCALE = "en-GB";

export function formatClinicalDate(
  value?: string | Date | null,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(CLINICAL_DATE_LOCALE, options);
}

/** Compare calendar dates (YYYY-MM-DD) without timezone drift. */
export function isBeforeToday(isoDate: string) {
  const today = new Date().toISOString().slice(0, 10);
  return isoDate.slice(0, 10) < today;
}
