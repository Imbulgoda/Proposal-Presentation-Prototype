import { jsPDF } from 'jspdf';

export function buildPdfReport({ title = 'FedNutri-XAI Report', sections = [] }) {
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(16);
  doc.setTextColor(11, 31, 77);
  doc.text(title, 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()} - Simulated research prototype`, 14, y);
  y += 12;

  sections.forEach((section) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setTextColor(11, 31, 77);
    doc.text(section.heading, 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(40);
    (section.lines || []).forEach((line) => {
      const wrappedLines = doc.splitTextToSize(String(line), 180);
      wrappedLines.forEach((wrappedLine) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(wrappedLine, 14, y);
        y += 6;
      });
    });
    y += 6;
  });

  return doc;
}
