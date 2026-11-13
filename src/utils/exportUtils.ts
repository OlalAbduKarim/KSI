import { jsPDF } from 'jspdf';

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface PDFReportPayload {
  title: string;
  subtitle: string;
  generatedBy: string;
  period: string;
  kpis: { label: string; value: string }[];
  findings: string[];
  recommendations: string[];
  tableHeaders: string[];
  tableRows: string[][];
}

export function generateReportPDF(filename: string, report: PDFReportPayload) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header band
  doc.setFillColor(11, 30, 61); // #0B1E3D
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KAMPALA SCHOOLS INTELLIGENCE SYSTEM (KSIS)', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Developed by Analytica Technologies · Simulated Demonstration Data (Not Official KCCA Records)',
    14,
    20
  );

  y = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(report.title, 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${report.subtitle} | Period: ${report.period} | Prepared by: ${report.generatedBy}`,
    14,
    y
  );
  y += 8;

  // KPI strip
  const boxW = (pageWidth - 28 - 9) / Math.min(4, report.kpis.length || 1);
  report.kpis.slice(0, 4).forEach((k, idx) => {
    const x = 14 + idx * (boxW + 3);
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(x, y, boxW, 16, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(k.label, x + 3, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(k.value, x + 3, y + 13);
  });
  y += 24;

  // Findings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 30, 61);
  doc.text('Key Analytical Findings', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  for (const finding of report.findings) {
    const lines = doc.splitTextToSize(`• ${finding}`, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4.5 + 1;
  }
  y += 4;

  // Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 30, 61);
  doc.text('Recommended Actions', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  for (const rec of report.recommendations) {
    const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4.5 + 1;
  }
  y += 6;

  // Table
  if (report.tableHeaders.length > 0) {
    if (y > 235) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(11, 30, 61);
    doc.text('Supporting Data Summary', 14, y);
    y += 5;

    const colW = (pageWidth - 28) / report.tableHeaders.length;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    report.tableHeaders.forEach((h, idx) => {
      doc.text(h.slice(0, 20), 15 + idx * colW, y + 4.8);
    });
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    for (const row of report.tableRows.slice(0, 32)) {
      if (y > 276) {
        doc.addPage();
        y = 18;
      }
      row.forEach((cell, idx) => {
        doc.text(String(cell ?? '').slice(0, 22), 15 + idx * colW, y + 4);
      });
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 5.8, pageWidth - 14, y + 5.8);
      y += 6.5;
    }
  }

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `KSIS Demonstration Prototype · Analytica Technologies · Generated ${new Date().toISOString().slice(0, 10)}`,
    14,
    290
  );

  doc.save(filename);
}
