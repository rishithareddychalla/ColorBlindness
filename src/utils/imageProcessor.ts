import type { ImageMetadata } from '../types';

/**
 * Formats file size in bytes to human-readable strings
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generates a colorful, high-fidelity sample target image on a canvas.
 * This is used when the user starts the application without an uploaded image.
 */
export const generateSampleImage = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, '#0f172a'); // slate-900
  gradient.addColorStop(1, '#1e1b4b'); // indigo-950
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 600);

  // Decorative ambient circles
  ctx.fillStyle = 'rgba(99, 102, 241, 0.08)'; // Indigo
  ctx.beginPath();
  ctx.arc(150, 150, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(236, 72, 153, 0.05)'; // Pink
  ctx.beginPath();
  ctx.arc(680, 450, 220, 0, Math.PI * 2);
  ctx.fill();

  // Grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 800; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 600);
    ctx.stroke();
  }
  for (let j = 0; j < 600; j += 40) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(800, j);
    ctx.stroke();
  }

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('VisionLens AI Accessibility Target', 50, 40);

  ctx.fillStyle = '#94a3b8'; // Slate-400
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText('Test target for verifying color vision deficiency (CVD) simulation & contrast ratios', 50, 85);

  // --- Segment 1: Standard Primary & Secondary Colors ---
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('1. Standard Color Palette Swatches', 50, 130);

  const colors = [
    { hex: '#ef4444', label: 'Red (Protan)' },
    { hex: '#22c55e', label: 'Green (Deuter)' },
    { hex: '#3b82f6', label: 'Blue (Tritan)' },
    { hex: '#eab308', label: 'Yellow' },
    { hex: '#a855f7', label: 'Purple' },
    { hex: '#ec4899', label: 'Pink' }
  ];

  colors.forEach((col, idx) => {
    const x = 50 + idx * 115;
    const y = 165;
    
    // Draw swatch container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(x, y, 100, 100, 12);
    ctx.fill();

    // Swatch fill
    ctx.fillStyle = col.hex;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 10, 80, 55, 8);
    ctx.fill();

    // Swatch text labels
    ctx.fillStyle = '#e2e8f0'; // slate-200
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(col.hex.toUpperCase(), x + 10, y + 74);

    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillText(col.label, x + 10, y + 87);
  });

  // --- Segment 2: Accessibility Contrast Confusions ---
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('2. Accessibility Contrast & Confusion Barriers', 50, 295);

  // Left confusion box: Red/Green overlap (Deuteranopia/Protanopia barrier)
  const leftX = 50;
  const boxY = 330;
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.beginPath();
  ctx.roundRect(leftX, boxY, 335, 220, 16);
  ctx.fill();

  // Red/Green overlap block
  ctx.fillStyle = '#ef4444'; // Red
  ctx.fillRect(leftX + 20, boxY + 20, 130, 100);
  ctx.fillStyle = '#22c55e'; // Green
  ctx.fillRect(leftX + 150, boxY + 20, 140, 100);

  // Overlapping text warning in both regions
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Red Text on Green', leftX + 158, boxY + 50);

  ctx.fillStyle = '#22c55e';
  ctx.fillText('Green Text on Red', leftX + 28, boxY + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Red / Green Confusion (CVD Barrier)', leftX + 20, boxY + 140);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Critical barrier for Protanopes & Deuteranopes.', leftX + 20, boxY + 162);
  ctx.fillText('Text contrast is low when colors are desaturated.', leftX + 20, boxY + 178);

  // Right confusion box: Blue/Yellow overlap (Tritanopia barrier)
  const rightX = 415;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.beginPath();
  ctx.roundRect(rightX, boxY, 335, 220, 16);
  ctx.fill();

  // Blue / Yellow blocks
  ctx.fillStyle = '#3b82f6'; // Blue
  ctx.fillRect(rightX + 20, boxY + 20, 130, 100);
  ctx.fillStyle = '#eab308'; // Yellow
  ctx.fillRect(rightX + 150, boxY + 20, 140, 100);

  // Overlapping text
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Blue on Yellow', rightX + 168, boxY + 50);

  ctx.fillStyle = '#eab308';
  ctx.fillText('Yellow on Blue', rightX + 28, boxY + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('Blue / Yellow Confusion (Tritan Barrier)', rightX + 20, boxY + 140);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('Critical barrier for Tritanopes (Blue-Blindness).', rightX + 20, boxY + 162);
  ctx.fillText('Blue and yellow swap roles, merging pink/green shades.', rightX + 20, boxY + 178);

  return canvas.toDataURL('image/png');
};

/**
 * Returns metadata of the image file
 */
export const loadImageMetadata = (
  file: File,
  imgElement: HTMLImageElement
): ImageMetadata => {
  return {
    name: file.name,
    type: file.type || 'image/png',
    size: formatBytes(file.size),
    dimensions: `${imgElement.naturalWidth} x ${imgElement.naturalHeight} px`
  };
};
