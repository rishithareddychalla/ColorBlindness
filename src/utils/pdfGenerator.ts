import { jsPDF } from 'jspdf';
import type { AccessibilityReport, ImageMetadata } from '../types';

export const generatePDFReport = (
  report: AccessibilityReport,
  metadata: ImageMetadata | null,
  _imageSrc: string | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Page Width: 210mm, Height: 297mm
  const margin = 20;
  let y = 25;

  // Helpers
  const addHeader = (text: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(text, margin, y);
    y += 4;
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.4);
    doc.line(margin, y, 210 - margin, y);
    y += 8;
  };

  const drawBadge = (label: string, value: string, severity: 'high' | 'medium' | 'low') => {
    let r = 71, g = 85, b = 105; // slate
    if (severity === 'high') { r = 239; g = 68; b = 68; } // red
    else if (severity === 'medium') { r = 245; g = 158; b = 11; } // amber

    doc.setFillColor(r, g, b);
    doc.rect(margin, y, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(r, g, b);
    doc.text(`${label}: ${value}`, margin + 6, y + 3.5);
    y += 6;
  };

  // --- PAGE 1: TITLE & AUDIT DETAILS ---
  // Brand Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 45, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('VisionLens AI', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Color Vision Accessibility Compliance Audit Report', margin, 26);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, 32);

  // Score Banner (Circle Gauge)
  const scoreX = 170;
  const scoreY = 22;
  doc.setDrawColor(99, 102, 241); // indigo-500
  doc.setLineWidth(1.5);
  doc.setFillColor(30, 41, 59); // slate-800
  doc.circle(scoreX, scoreY, 12, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`${report.score}`, scoreX - 4.5, scoreY + 2);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('SCORE', scoreX - 4.5, scoreY + 6);

  y = 55;

  // Metadata Section
  addHeader('Image Metadata Info');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);

  if (metadata) {
    doc.text(`File Name: ${metadata.name}`, margin, y);
    doc.text(`File Type: ${metadata.type}`, margin + 80, y);
    y += 6;
    doc.text(`Dimensions: ${metadata.dimensions}`, margin, y);
    doc.text(`File Size: ${metadata.size}`, margin + 80, y);
    y += 10;
  } else {
    doc.text('No metadata available (Simulated sample image).', margin, y);
    y += 10;
  }

  // Dominant Palette Section
  addHeader('Extracted Color Palette');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('The following dominant colors were extracted and analyzed for color-deficiency overlap:', margin, y);
  y += 8;

  // Draw Palette Swatches
  const swatchWidth = 24;
  const swatchHeight = 12;
  const gap = 4;
  paletteRow: for (let i = 0; i < report.dominantPalette.length; i++) {
    const col = report.dominantPalette[i];
    const px = margin + i * (swatchWidth + gap);
    
    // Draw outline
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(px, y, swatchWidth, swatchHeight);

    // Draw swatch fill
    const [r, g, b] = col.rgb;
    doc.setFillColor(r, g, b);
    doc.rect(px + 0.5, y + 0.5, swatchWidth - 1, swatchHeight - 1, 'F');

    // Text labels below swatches
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(col.hex, px, y + swatchHeight + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    
    // Truncate names to fit swatch bounds
    const name = col.name.length > 8 ? col.name.substring(0, 7) + '..' : col.name;
    doc.text(name, px, y + swatchHeight + 7);
    doc.text(`${col.ratio}% density`, px, y + swatchHeight + 10);
  }

  y += swatchHeight + 18;

  // Contrast Observations Section
  addHeader('WCAG 2.1 Contrast Standards');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);

  report.observations.forEach(obs => {
    const statusText = obs.status === 'pass' ? 'PASS' : 'FAIL';
    const color = obs.status === 'pass' ? [16, 185, 129] : [239, 68, 68];
    
    doc.setFont('helvetica', 'bold');
    doc.text(`• ${obs.element}:`, margin, y);
    
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`${statusText} (${obs.level})`, margin + 45, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Ratio: ${obs.ratio.toFixed(2)}:1`, margin + 85, y);
    y += 6.5;
  });

  y += 5;

  // --- PAGE 2: CONFLICTS & RECOMMENDATIONS ---
  doc.addPage();
  y = 25;

  addHeader('Color Deficiency Contrast Conflicts');
  if (report.conflicts.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129); // Green
    doc.text('✔ Excellent! No critical color-deficiency contrast conflicts detected.', margin, y);
    y += 12;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text('The following pairs of colors are highly indistinguishable for colorblind individuals:', margin, y);
    y += 8;

    report.conflicts.slice(0, 5).forEach((conflict, index) => {
      drawBadge(`Conflict #${index + 1}`, `${conflict.color1} vs ${conflict.color2}`, conflict.severity);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Description: ${conflict.description}`, margin + 6, y);
      y += 5;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Affected: ${conflict.affectedDeficiencies.join(', ')}`, margin + 6, y);
      y += 9;
    });
  }

  // Design Recommendations Section
  addHeader('UX & Design Recommendations');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);

  report.recommendations.forEach((rec, idx) => {
    const splitText = doc.splitTextToSize(`${idx + 1}. ${rec}`, 170);
    doc.text(splitText, margin, y);
    y += (splitText.length * 5) + 2;
  });

  y += 4;

  // Footer / Disclaimer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const disclaimerText = 'Disclaimer: VisionLens AI simulations represent mathematical models of color vision deficiencies. Actual human perception varies. Use this audit to support standard accessibility evaluations (e.g. manual checking, target audience interviews).';
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, 170);
  doc.text(splitDisclaimer, margin, y);

  // Save PDF file
  const filename = metadata 
    ? `accessibility-report-${metadata.name.split('.')[0]}.pdf` 
    : 'visionlens-accessibility-report.pdf';
  doc.save(filename);
};
