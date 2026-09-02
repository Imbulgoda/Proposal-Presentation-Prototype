import { FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { buildPdfReport } from '../../utils/pdfReport';

export default function PDFExport({
  title = 'FedNutri-XAI Report',
  label = 'PDF',
  loadingLabel = 'Generating report...',
  filename = 'FedNutri-XAI-Report.pdf',
  sections = [],
  className = '',
}) {
  const [generating, setGenerating] = useState(false);
  const handle = () => {
    if (generating) return;
    setGenerating(true);
    window.setTimeout(() => {
      const doc = buildPdfReport({ title, sections });
      doc.save(filename);
      setGenerating(false);
      toast.success('PDF report downloaded');
    }, 400);
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={generating}
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 ${className}`}
    >
      <FileDown size={14} /> {generating ? loadingLabel : label}
    </button>
  );
}
