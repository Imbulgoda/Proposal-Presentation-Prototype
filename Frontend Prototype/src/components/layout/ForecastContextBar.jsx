import { useApp } from '../../context/AppContext';

export default function ForecastContextBar({ className = '' }) {
  const { forecastContext } = useApp();

  if (!forecastContext?.generated) return null;

  return (
    <p className={`text-xs font-semibold text-primary ${className}`}>
      {forecastContext.year} | {forecastContext.month} | {forecastContext.district}
    </p>
  );
}
