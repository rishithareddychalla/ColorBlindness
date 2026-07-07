export type VisionType = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export interface VisionDetails {
  id: VisionType;
  name: string;
  description: string;
  severity: string;
  affectedCones: string;
  prevalence: string;
}

export type ViewMode = 'single' | 'split' | 'side-by-side' | 'grid';

export interface ImageMetadata {
  name: string;
  size: string;
  dimensions: string;
  type: string;
}

export interface ColorInfo {
  hex: string;
  rgb: [number, number, number];
  name: string;
  ratio: number; // percentage of image
}

export interface ColorConflict {
  color1: string;
  color2: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  affectedDeficiencies: string[];
}

export interface ContrastObservation {
  element: string;
  ratio: number;
  status: 'pass' | 'fail';
  level: 'AA' | 'AAA' | 'Fail';
}

export interface AccessibilityReport {
  score: number;
  conflicts: ColorConflict[];
  observations: ContrastObservation[];
  dominantPalette: ColorInfo[];
  recommendations: string[];
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  lastMode: ViewMode;
  lastVision: VisionType;
  zoomSpeed: number;
}
