import type { VisionDetails, VisionType, ColorInfo, ColorConflict } from '../types';

export const VISION_DEFIENCIES: Record<VisionType, VisionDetails> = {
  normal: {
    id: 'normal',
    name: 'Normal Vision',
    description: 'Typical color perception seeing all three primary colors (Red, Green, Blue) fully.',
    severity: 'None',
    affectedCones: 'None',
    prevalence: '92% of population'
  },
  protanopia: {
    id: 'protanopia',
    name: 'Protanopia (Red-Blind)',
    description: 'Unable to perceive red light. Red looks green/brown, and violet appears blue.',
    severity: 'Severe',
    affectedCones: 'L-cones (Long wavelength)',
    prevalence: '1% of males, 0.02% of females'
  },
  deuteranopia: {
    id: 'deuteranopia',
    name: 'Deuteranopia (Green-Blind)',
    description: 'Unable to perceive green light. Green looks yellow/brown, and red looks yellow/green.',
    severity: 'Severe',
    affectedCones: 'M-cones (Medium wavelength)',
    prevalence: '1% of males, 0.01% of females'
  },
  tritanopia: {
    id: 'tritanopia',
    name: 'Tritanopia (Blue-Blind)',
    description: 'Unable to perceive blue light. Blue looks green, and yellow looks pink.',
    severity: 'Severe',
    affectedCones: 'S-cones (Short wavelength)',
    prevalence: '0.01% of population'
  },
  achromatopsia: {
    id: 'achromatopsia',
    name: 'Achromatopsia (Total)',
    description: 'Complete lack of color perception. Vision is entirely in shades of gray.',
    severity: 'Complete',
    affectedCones: 'All three cone systems (L, M, S)',
    prevalence: '0.003% of population'
  }
};

// Simulation Matrices (Brettel / Viénot algorithm mappings in linear RGB)
// Normalized for direct sRGB matrix approximation
export const SIMULATION_MATRICES: Record<Exclude<VisionType, 'normal'>, number[]> = {
  protanopia: [
    0.567, 0.433, 0.000,
    0.558, 0.442, 0.000,
    0.000, 0.242, 0.758
  ],
  deuteranopia: [
    0.625, 0.375, 0.000,
    0.700, 0.300, 0.000,
    0.000, 0.300, 0.700
  ],
  tritanopia: [
    0.950, 0.050, 0.000,
    0.000, 0.433, 0.567,
    0.000, 0.475, 0.525
  ],
  achromatopsia: [
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114
  ]
};

// Gamma Correction Helpers (sRGB <-> Linear)
export const toLinear = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

export const toSRGB = (c: number): number => {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

/**
 * Simulates a color vision deficiency on raw image data.
 * Optimized with local variable caching to process high-resolution images rapidly.
 */
export const simulateColorblindness = (
  srcData: ImageData,
  destData: ImageData,
  type: VisionType
) => {
  const src = srcData.data;
  const dest = destData.data;
  const len = src.length;

  if (type === 'normal') {
    for (let i = 0; i < len; i += 4) {
      dest[i] = src[i];
      dest[i + 1] = src[i + 1];
      dest[i + 2] = src[i + 2];
      dest[i + 3] = src[i + 3];
    }
    return;
  }

  const matrix = SIMULATION_MATRICES[type];
  const m0 = matrix[0], m1 = matrix[1], m2 = matrix[2];
  const m3 = matrix[3], m4 = matrix[4], m5 = matrix[5];
  const m6 = matrix[6], m7 = matrix[7], m8 = matrix[8];

  // Faster lookup tables for gamma correction (0-255)
  const linearLUT = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    linearLUT[i] = toLinear(i);
  }

  for (let i = 0; i < len; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    const a = src[i + 3];

    // De-gamma to linear light
    const lr = linearLUT[r];
    const lg = linearLUT[g];
    const lb = linearLUT[b];

    // Apply simulation matrix
    const nr = lr * m0 + lg * m1 + lb * m2;
    const ng = lr * m3 + lg * m4 + lb * m5;
    const nb = lr * m6 + lg * m7 + lb * m8;

    // Re-gamma back to sRGB
    dest[i] = toSRGB(nr);
    dest[i + 1] = toSRGB(ng);
    dest[i + 2] = toSRGB(nb);
    dest[i + 3] = a;
  }
};

/**
 * Computes a loss of information heatmap overlay.
 * Highlights pixels where color information shifts heavily.
 */
export const generateLossHeatmap = (
  srcData: ImageData,
  destData: ImageData,
  type: VisionType
) => {
  const src = srcData.data;
  const dest = destData.data;
  const len = src.length;

  if (type === 'normal') {
    for (let i = 0; i < len; i += 4) {
      dest[i] = 0;
      dest[i + 1] = 0;
      dest[i + 2] = 0;
      dest[i + 3] = 0;
    }
    return;
  }

  // Pre-simulate the deficiency
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = srcData.width;
  tempCanvas.height = srcData.height;
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return;
  const simData = ctx.createImageData(srcData.width, srcData.height);
  simulateColorblindness(srcData, simData, type);
  const sim = simData.data;

  for (let i = 0; i < len; i += 4) {
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];

    const sr = sim[i];
    const sg = sim[i + 1];
    const sb = sim[i + 2];

    // Euclidean distance in RGB space to measure shift
    const dr = r - sr;
    const dg = g - sg;
    const db = b - sb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    // Normalize shift to 0 - 255. High shift is shown in bright red-orange heatmap overlay
    const intensity = Math.min(255, Math.round(dist * 2.2)); 

    if (intensity > 30) {
      dest[i] = intensity; // Red
      dest[i + 1] = Math.max(0, 120 - intensity); // Yellow edge
      dest[i + 2] = 0; // Blue
      dest[i + 3] = Math.min(200, Math.max(80, intensity)); // Alpha transparency
    } else {
      dest[i] = 0;
      dest[i + 1] = 0;
      dest[i + 2] = 0;
      dest[i + 3] = 0; // Completely transparent
    }
  }
};

/**
 * Color converters
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

export const hexToRgb = (hex: string): [number, number, number] => {
  const trimmed = hex.replace('#', '');
  const r = parseInt(trimmed.substring(0, 2), 16);
  const g = parseInt(trimmed.substring(2, 4), 16);
  const b = parseInt(trimmed.substring(4, 6), 16);
  return [r, g, b];
};

/**
 * Approximate WCAG Contrast Ratio
 */
export const getRelativeLuminance = (r: number, g: number, b: number): number => {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

export const getContrastRatio = (rgb1: [number, number, number], rgb2: [number, number, number]): number => {
  const lum1 = getRelativeLuminance(...rgb1);
  const lum2 = getRelativeLuminance(...rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

// Simplified palette name lookup dictionary for professional output
const COLOR_NAMES: { hex: string; name: string }[] = [
  { hex: '#000000', name: 'Ink Black' },
  { hex: '#ffffff', name: 'Pure White' },
  { hex: '#808080', name: 'Slate Gray' },
  { hex: '#ff0000', name: 'Crimson Red' },
  { hex: '#00ff00', name: 'Lime Green' },
  { hex: '#0000ff', name: 'Ocean Blue' },
  { hex: '#ffff00', name: 'Canary Yellow' },
  { hex: '#ffa500', name: 'Sunset Orange' },
  { hex: '#800080', name: 'Royal Purple' },
  { hex: '#ffc0cb', name: 'Rose Pink' },
  { hex: '#a52a2a', name: 'Cocoa Brown' },
  { hex: '#00ffff', name: 'Electric Cyan' },
  { hex: '#ff00ff', name: 'Magenta Pink' },
  { hex: '#3b82f6', name: 'Cobalt Blue' },
  { hex: '#10b981', name: 'Emerald Green' },
  { hex: '#f59e0b', name: 'Amber Yellow' },
  { hex: '#ef4444', name: 'Scarlet Red' },
  { hex: '#8b5cf6', name: 'Vibrant Violet' },
  { hex: '#ec4899', name: 'Hot Pink' },
  { hex: '#14b8a6', name: 'Teal Jade' },
  { hex: '#6b7280', name: 'Muted Gray' },
  { hex: '#f3f4f6', name: 'Alabaster White' },
  { hex: '#111827', name: 'Midnight Charcoal' }
];

export const getColorName = (hex: string): string => {
  const [r, g, b] = hexToRgb(hex);
  let minDistance = Infinity;
  let closestName = 'Custom Hue';

  for (const item of COLOR_NAMES) {
    const [cr, cg, cb] = hexToRgb(item.hex);
    const dist = Math.sqrt(
      Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestName = item.name;
    }
  }
  return closestName;
};

/**
 * Extracts a structured color palette from canvas pixels
 */
export const extractDominantPalette = (canvas: HTMLCanvasElement, count = 6): ColorInfo[] => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  
  // Sample pixels to build grid clustering representation
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const step = Math.max(4, Math.floor(data.length / 4 / 2000)) * 4; // limit sample size to ~2000 points
  
  const colorBuckets: Record<string, number> = {};

  for (let i = 0; i < data.length; i += step) {
    const r = Math.round(data[i] / 16) * 16; // Quantize color resolution
    const g = Math.round(data[i+1] / 16) * 16;
    const b = Math.round(data[i+2] / 16) * 16;
    
    // Skip near-transparent pixels
    if (data[i+3] < 120) continue;
    
    const hex = rgbToHex(Math.min(255, r), Math.min(255, g), Math.min(255, b));
    colorBuckets[hex] = (colorBuckets[hex] || 0) + 1;
  }

  const sortedColors = Object.entries(colorBuckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);

  const totalSamples = Object.values(colorBuckets).reduce((a, b) => a + b, 0);

  return sortedColors.map(([hex, occurrences]) => {
    const rgb = hexToRgb(hex);
    return {
      hex,
      rgb,
      name: getColorName(hex),
      ratio: Math.round((occurrences / totalSamples) * 100)
    };
  });
};

/**
 * Analyzes dominant colors to detect potential confusion conflicts in color blindness
 */
export const findColorConflicts = (palette: ColorInfo[]): ColorConflict[] => {
  const conflicts: ColorConflict[] = [];

  for (let i = 0; i < palette.length; i++) {
    for (let j = i + 1; j < palette.length; j++) {
      const c1 = palette[i];
      const c2 = palette[j];
      
      const normalContrast = getContrastRatio(c1.rgb, c2.rgb);
      
      // Calculate simulations
      const affectedDeficiencies: string[] = [];

      for (const [key, matrix] of Object.entries(SIMULATION_MATRICES)) {
        // Skip achromatopsia for simple red-green/blue-yellow confusion modeling
        if (key === 'achromatopsia') continue;

        const simC1 = simulateColorSingle(c1.rgb, matrix);
        const simC2 = simulateColorSingle(c2.rgb, matrix);
        const simContrast = getContrastRatio(simC1, simC2);

        // If high contrast in normal vision, but drops significantly in simulation, it's a conflict
        if (normalContrast >= 2.5 && simContrast < 1.6) {
          affectedDeficiencies.push(VISION_DEFIENCIES[key as VisionType].name);
        }
      }

      if (affectedDeficiencies.length > 0) {
        const severity = normalContrast > 4.5 ? 'high' : 'medium';
        conflicts.push({
          color1: c1.hex,
          color2: c2.hex,
          description: `Contrast drops from ${normalContrast.toFixed(1)}:1 to near-invisible under color deficiency.`,
          severity,
          affectedDeficiencies
        });
      }
    }
  }

  return conflicts;
};

// Helper: Simulates colorblindness on a single RGB array
const simulateColorSingle = (rgb: [number, number, number], matrix: number[]): [number, number, number] => {
  const lr = toLinear(rgb[0]);
  const lg = toLinear(rgb[1]);
  const lb = toLinear(rgb[2]);

  const nr = lr * matrix[0] + lg * matrix[1] + lb * matrix[2];
  const ng = lr * matrix[3] + lg * matrix[4] + lb * matrix[5];
  const nb = lr * matrix[6] + lg * matrix[7] + lb * matrix[8];

  return [toSRGB(nr), toSRGB(ng), toSRGB(nb)];
};
