import { useState, useEffect } from 'react';
import type { VisionType, ViewMode, ImageMetadata, AccessibilityReport as ReportData, ContrastObservation } from './types';
import { ImageUploader } from './components/ImageUploader';
import { VisionSelector } from './components/VisionSelector';
import { ViewModeSelector } from './components/ViewModeSelector';
import { ImageWorkspace } from './components/ImageWorkspace';
import { AccessibilityReport } from './components/AccessibilityReport';
import { VisualTools } from './components/VisualTools';
import { extractDominantPalette, findColorConflicts, getContrastRatio } from './utils/colorUtils';
import { loadImageMetadata } from './utils/imageProcessor';
import { Eye, RotateCcw, Moon, Sun, Download, Share2, Activity } from 'lucide-react';

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedVision, setSelectedVision] = useState<VisionType>('normal');
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [isHeatmapActive, setIsHeatmapActive] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [pickedColors, setPickedColors] = useState<{ hex: string; rgb: [number, number, number]; name: string }[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'simulation' | 'report' | 'tools'>('simulation');

  // References to active canvases
  const [activeCanvas, setActiveCanvas] = useState<HTMLCanvasElement | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);

  // Load from local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('vl_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    const savedMode = localStorage.getItem('vl_mode') as ViewMode;
    if (savedMode) setViewMode(savedMode);

    const savedVision = localStorage.getItem('vl_vision') as VisionType;
    if (savedVision) setSelectedVision(savedVision);
  }, []);

  // Sync Preferences to LocalStorage
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('vl_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const handleModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('vl_mode', mode);
  };

  const handleVisionChange = (vision: VisionType) => {
    setSelectedVision(vision);
    localStorage.setItem('vl_vision', vision);
  };

  // Image Upload handler
  const handleImageLoaded = (src: string, file: File | null) => {
    setImageSrc(src);
    setPickedColors([]);
    setIsHeatmapActive(false);

    // Calculate metadata
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (file) {
        setMetadata(loadImageMetadata(file, img));
      } else {
        setMetadata({
          name: 'simulated-target-pattern.png',
          type: 'image/png',
          size: '142 KB',
          dimensions: `${img.naturalWidth} x ${img.naturalHeight} px`
        });
      }

      // Automatically construct audit report based on sample canvas color palette
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const reportResult = computeAccessibilityReport(tempCanvas);
        setReport(reportResult);
      }
    };
  };

  const computeAccessibilityReport = (canvas: HTMLCanvasElement): ReportData => {
    const palette = extractDominantPalette(canvas, 6);
    const conflicts = findColorConflicts(palette);

    // Contrast Observations
    const observations: ContrastObservation[] = [];
    if (palette.length >= 2) {
      const ratio = getContrastRatio(palette[0].rgb, palette[1].rgb);
      observations.push({
        element: 'Heading Text vs Page Base',
        ratio,
        status: ratio >= 4.5 ? ('pass' as const) : ('fail' as const),
        level: (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail') as 'AA' | 'AAA' | 'Fail'
      });
    }
    if (palette.length >= 3) {
      const ratio = getContrastRatio(palette[0].rgb, palette[2].rgb);
      observations.push({
        element: 'Body Copy vs Background',
        ratio,
        status: ratio >= 4.5 ? ('pass' as const) : ('fail' as const),
        level: (ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail') as 'AA' | 'AAA' | 'Fail'
      });
    }
    if (palette.length >= 4) {
      const ratio = getContrastRatio(palette[1].rgb, palette[3].rgb);
      observations.push({
        element: 'Primary Button vs Container',
        ratio,
        status: ratio >= 3.0 ? ('pass' as const) : ('fail' as const),
        level: (ratio >= 4.5 ? 'AAA' : ratio >= 3.0 ? 'AA' : 'Fail') as 'AA' | 'AAA' | 'Fail'
      });
    }

    const failCount = observations.filter(o => o.status === 'fail').length;
    const score = Math.max(20, Math.min(100, 100 - (conflicts.length * 8 + failCount * 12)));

    const recommendations = [];
    if (conflicts.length > 0) {
      recommendations.push('Do not rely solely on hue to communicate visual states. Add icons, secondary text, or differing border weights.');
    }
    if (failCount > 0) {
      recommendations.push('Boost brightness values on layered elements. Use a contrast checking tool to align text to WCAG 2.1 AA (4.5:1 ratio).');
    }
    recommendations.push('Design a high-contrast theme to support users with low vision or extreme photophobia.');
    recommendations.push('Verify interactive states (focus, hover) meet a minimum of 3.0:1 contrast ratios relative to adjacent fills.');

    return {
      score,
      conflicts,
      observations,
      dominantPalette: palette,
      recommendations
    };
  };

  const handleColorPicked = (color: { hex: string; rgb: [number, number, number]; name: string }) => {
    // Avoid duplicates in picker list
    if (!pickedColors.some(c => c.hex.toLowerCase() === color.hex.toLowerCase())) {
      setPickedColors(prev => [color, ...prev].slice(0, 12));
    }
  };

  const resetImage = () => {
    setImageSrc(null);
    setMetadata(null);
    setReport(null);
    setPickedColors([]);
  };

  // Canvas export triggers
  const exportSimulatedPNG = () => {
    if (!activeCanvas) return;
    const link = document.createElement('a');
    link.download = `visionlens-${selectedVision}-${Date.now()}.png`;
    link.href = activeCanvas.toDataURL('image/png');
    link.click();
  };

  const exportComparisonPNG = () => {
    if (!activeCanvas) return;
    const originalImg = new Image();
    originalImg.src = imageSrc || '';
    originalImg.onload = () => {
      const combined = document.createElement('canvas');
      combined.width = originalImg.naturalWidth * 2 + 40;
      combined.height = originalImg.naturalHeight;
      const ctx = combined.getContext('2d');
      if (!ctx) return;

      // Draw background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, combined.width, combined.height);

      // Draw original and simulated side-by-side
      ctx.drawImage(originalImg, 0, 0);
      ctx.drawImage(activeCanvas, originalImg.naturalWidth + 40, 0);

      const link = document.createElement('a');
      link.download = `visionlens-comparison-${selectedVision}.png`;
      link.href = combined.toDataURL('image/png');
      link.click();
    };
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative overflow-hidden ${
      isDark 
        ? 'bg-[#0f1219] text-slate-100' 
        : 'bg-[#f0f2f5] text-slate-900'
    }`}>
      
      {/* Ambient Background Orbs */}
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" />
      <div className="ambient-orb ambient-orb-3" />

      {/* Subtle noise texture overlay */}
      <div className="noise-bg fixed inset-0 pointer-events-none z-0" />

      {/* ═══════════ Top Header Bar ═══════════ */}
      <header className={`border-b px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 transition-colors duration-500 ${
        isDark 
          ? 'border-white/[0.06] bg-[#12161f]/80 backdrop-blur-xl' 
          : 'border-slate-200/70 bg-white/75 backdrop-blur-xl shadow-sm shadow-slate-200/30'
      }`}>
        <div className="flex items-center gap-3 animate-fade-in-up">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-500/20' 
              : 'bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-indigo-400/25'
          }`}>
            <Eye size={18} />
          </div>
          <div>
            <h1 className={`text-sm font-extrabold tracking-tight flex items-center gap-1.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              VisionLens AI
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                isDark 
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15' 
                  : 'bg-indigo-50 text-indigo-600 border-indigo-200/50'
              }`}>v1.1</span>
            </h1>
            <p className={`text-[10px] font-semibold tracking-wide ${
              isDark ? 'text-slate-500' : 'text-slate-500'
            }`}>Color Vision Accessibility Audit Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-2 animate-fade-in-up delay-150">
          {imageSrc && (
            <>
              <button
                onClick={exportSimulatedPNG}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isDark 
                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 hover:text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900'
                }`}
                title="Export current simulated image"
              >
                <Download size={12} />
                Export
              </button>

              <button
                onClick={exportComparisonPNG}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isDark 
                    ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/15 text-indigo-400' 
                    : 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 text-indigo-600'
                }`}
                title="Export side-by-side comparison sheet"
              >
                <Share2 size={12} />
                <span className="hidden sm:inline">Comparison</span>
              </button>

              <button
                onClick={resetImage}
                className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                  isDark 
                    ? 'bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/20 text-slate-400 hover:text-rose-400' 
                    : 'bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-500'
                }`}
                title="Clear current workspace"
              >
                <RotateCcw size={12} />
              </button>
            </>
          )}

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
              isDark 
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-amber-300' 
                : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-indigo-600'
            }`}
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </header>

      {/* ═══════════ Main Workspace ═══════════ */}
      <main className="flex-grow flex flex-col lg:flex-row min-h-0 relative z-10">
        
        {/* Center Workspace Panel */}
        <section className={`flex-grow flex flex-col min-w-0 transition-all duration-500 ${
          imageSrc ? 'border-r' : ''
        } ${
          isDark ? 'border-white/[0.04]' : 'border-slate-200/60'
        }`}>
          {imageSrc ? (
            <div className="animate-fade-in-scale">
              <ImageWorkspace
                imageSrc={imageSrc}
                selectedVision={selectedVision}
                viewMode={viewMode}
                isHeatmapActive={isHeatmapActive}
                metadata={metadata}
                onColorPicked={handleColorPicked}
                onCanvasRef={setActiveCanvas}
                theme={theme}
              />
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8">
              <div className="animate-fade-in-up">
                <ImageUploader onImageLoaded={handleImageLoaded} theme={theme} />
              </div>
            </div>
          )}
        </section>

        {/* ═══════════ Sidebar — ONLY when image is loaded ═══════════ */}
        {imageSrc && (
          <aside className={`w-full lg:w-[380px] shrink-0 flex flex-col border-t lg:border-t-0 animate-slide-in-right transition-colors duration-500 ${
            isDark 
              ? 'bg-[#12161f]/50 border-white/[0.04]' 
              : 'bg-white/40 border-slate-200/60'
          }`}>
            {/* Tabs Selector Header */}
            <div className={`flex border-b p-2 gap-1 transition-colors duration-500 ${
              isDark ? 'border-white/[0.05] bg-[#12161f]/40' : 'border-slate-200/50 bg-white/50'
            }`}>
              {(['simulation', 'report', 'tools'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const labels = { simulation: 'Configure', report: 'Audit Report', tools: 'Diagnostic' };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer relative ${
                      isActive 
                        ? isDark 
                          ? 'bg-white/[0.06] text-white border border-white/[0.08] shadow-sm' 
                          : 'bg-white text-slate-900 border border-slate-200/70 shadow-sm'
                        : isDark 
                          ? 'text-slate-500 hover:text-slate-300' 
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {labels[tab]}
                    {tab === 'report' && report && report.conflicts.length > 0 && (
                      <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto p-5 max-h-[75vh] lg:max-h-[calc(100vh-140px)]">
              {activeTab === 'simulation' && (
                <div className="space-y-6 animate-fade-in-up">
                  <ViewModeSelector activeMode={viewMode} onChangeMode={handleModeChange} theme={theme} />
                  <VisionSelector selectedVision={selectedVision} onChangeVision={handleVisionChange} theme={theme} />
                  
                  {/* Heatmap Toggle Panel */}
                  <div className={`p-4 rounded-2xl flex items-center justify-between border transition-colors duration-300 ${
                    isDark 
                      ? 'border-white/[0.05] bg-white/[0.02]' 
                      : 'border-slate-200/60 bg-white/60'
                  }`}>
                    <div className="space-y-0.5 max-w-[70%]">
                      <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        <Activity size={12} className="text-amber-500" />
                        Loss Heatmap
                      </h4>
                      <p className={`text-[10px] leading-normal ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Highlight regions of extreme desaturation information loss.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsHeatmapActive(!isHeatmapActive)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                        isHeatmapActive 
                          ? 'bg-indigo-600' 
                          : isDark ? 'bg-slate-700' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm ${
                        isHeatmapActive ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'report' && report && (
                <div className="animate-fade-in-up">
                  <AccessibilityReport 
                    report={report} 
                    metadata={metadata} 
                    imageSrc={imageSrc}
                    theme={theme}
                  />
                </div>
              )}

              {activeTab === 'tools' && (
                <div className="animate-fade-in-up">
                  <VisualTools
                    metadata={metadata}
                    pickedColors={pickedColors}
                    onClearPicked={() => setPickedColors([])}
                    canvasRef={activeCanvas}
                    theme={theme}
                  />
                </div>
              )}
            </div>
          </aside>
        )}

      </main>

    </div>
  );
}
