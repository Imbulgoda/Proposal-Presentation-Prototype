import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items = [], className = '' }) {
  return (
    <nav aria-label="Breadcrumb" className={`overflow-x-auto ${className}`}>
      <ol className="flex min-w-max items-center gap-1 text-xs font-medium text-slate-500">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight size={13} className="text-slate-300" aria-hidden="true" />}
            {item.to ? <Link to={item.to} className="rounded px-1 py-1 transition hover:text-secondary">{item.label}</Link> : <span className="px-1 py-1 font-semibold text-primary" aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
