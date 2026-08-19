export default function DistrictPopup({ district }) {
  if (!district) return null;
  return (
    <div className="min-w-[180px] text-sm">
      <p className="mb-2 font-bold text-primary">{district.name} District</p>
      <div className="space-y-1 text-xs text-slate-600">
        <p>
          <span className="font-semibold text-slate-800">Predicted Cases:</span> {district.cases}
        </p>
        <p>
          <span className="font-semibold text-slate-800">Risk:</span>{' '}
          <span
            className={
              district.risk === 'High'
                ? 'text-danger'
                : district.risk === 'Medium'
                  ? 'text-warning'
                  : 'text-success'
            }
          >
            {district.risk}
          </span>
        </p>
        <p>
          <span className="font-semibold text-slate-800">Triposha:</span>{' '}
          {district.triposha.toLocaleString()} Packs
        </p>
        <p>
          <span className="font-semibold text-slate-800">Trend:</span> {district.trend}
        </p>
        <p>
          <span className="font-semibold text-slate-800">DMPI Score:</span> {district.dmpi}
        </p>
      </div>
    </div>
  );
}
