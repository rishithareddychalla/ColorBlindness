import React, { useRef, useEffect } from 'react';
import type { ImageMetadata } from '../types';
import { RefreshCw, Info } from 'lucide-react';

interface VisualToolsProps {
  metadata: ImageMetadata | null;
  pickedColors: { hex: string; rgb: [number, number, number]; name: string }[];
  onClearPicked: () => void;
  canvasRef: HTMLCanvasElement | null;
  theme?: 'dark' | 'light';
}

export const VisualTools: React.FC<VisualToolsProps> = ({
  metadata,
  pickedColors,
  onClearPicked,
  canvasRef,
  theme = 'dark'
}) => {
  const histogramRef = useRef<HTMLCanvasElement>(null);
  const isDark = theme === 'dark';

  const cardClass = isDark 
    ? 'bg-white/[0.02] border-white/[0.05]' 
    : 'bg-white/60 border-slate-200/60';

  const innerCardClass = isDark 
    ? 'bg-white/[0.02] border-white/[0.04]' 
    : 'bg-slate-50/80 border-slate-200/40';

  // Compute and draw RGB distribution histogram
  useEffect(() => {
    if (!canvasRef || !histogramRef.current) return;
    const canvas = canvasRef;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const r = new Uint32Array(256);
      const g = new Uint32Array(256);
      const b = new Uint32Array(256);

      for (let i = 0; i < data.length; i += 8) { // sample every 2nd pixel for faster computing
        r[data[i]]++;
        g[data[i + 1]]++;
        b[data[i + 2]]++;
      }

      // Draw onto histogram canvas
      const histCanvas = histogramRef.current;
      const hCtx = histCanvas.getContext('2d');
      if (!hCtx) return;

      hCtx.clearRect(0, 0, histCanvas.width, histCanvas.height);

      let max = 0;
      for (let i = 0; i < 256; i++) {
        if (r[i] > max) max = r[i];
        if (g[i] > max) max = g[i];
        if (b[i] > max) max = b[i];
      }

      const width = histCanvas.width;
      const height = histCanvas.height;
      const step = width / 256;

      const drawChannel = (arr: Uint32Array, color: string) => {
        hCtx.strokeStyle = color;
        hCtx.lineWidth = 1.25;
        hCtx.beginPath();
        for (let i = 0; i < 256; i++) {
          const x = i * step;
          const y = height - (arr[i] / max) * height * 0.9;
          if (i === 0) hCtx.moveTo(x, y);
          else hCtx.lineTo(x, y);
        }
        hCtx.stroke();
      };

      drawChannel(r, 'rgba(239, 68, 68, 0.7)'); // Red
      drawChannel(g, 'rgba(34, 197, 94, 0.7)'); // Green
      drawChannel(b, 'rgba(59, 130, 246, 0.7)'); // Blue
    } catch (e) {
      console.warn('Unable to extract canvas pixels for histogram rendering.', e);
    }
  }, [canvasRef]);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Color Histogram */}
      <div className={`border rounded-2xl p-5 space-y-3.5 animate-fade-in-up ${cardClass}`}>
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
            📈 RGB Color Distribution
          </h4>
          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
            isDark 
              ? 'bg-white/[0.03] text-indigo-400 border-indigo-500/10' 
              : 'bg-indigo-50 text-indigo-600 border-indigo-200/50'
          }`}>
            Histogram
          </span>
        </div>

        <div className={`relative rounded-xl p-3 border ${innerCardClass}`}>
          <canvas 
            ref={histogramRef} 
            width={300} 
            height={130} 
            className="w-full h-[120px]" 
          />
          <div className={`absolute bottom-1.5 inset-x-3 flex justify-between text-[7.5px] font-mono ${
            isDark ? 'text-slate-600' : 'text-slate-400'
          }`}>
            <span>0 (Shadows)</span>
            <span>128 (Midtones)</span>
            <span>255 (Highlights)</span>
          </div>
        </div>
      </div>

      {/* Color Picker Swatches List */}
      <div className={`border rounded-2xl p-5 space-y-4 animate-fade-in-up delay-150 ${cardClass}`}>
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
            🧪 Color Swatch Picker
          </h4>
          {pickedColors.length > 0 && (
            <button
              onClick={onClearPicked}
              className="text-[9px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1 transition-all outline-none"
            >
              <RefreshCw size={9} />
              Clear
            </button>
          )}
        </div>

        {pickedColors.length === 0 ? (
          <p className={`text-[10px] leading-relaxed text-center py-4 border border-dashed rounded-xl ${
            isDark 
              ? 'text-slate-500 border-white/[0.06]' 
              : 'text-slate-500 border-slate-300/50'
          }`}>
            Select the Picker tool above and click anywhere on the image preview workspace to analyze and save custom colors.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
            {pickedColors.map((color, idx) => (
              <div key={idx} className={`border rounded-xl p-2.5 flex items-center justify-between gap-3 animate-fade-in-up ${innerCardClass}`} style={{ animationDelay: `${idx * 40}ms` }}>
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-8 h-8 rounded-lg border shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`} 
                    style={{ backgroundColor: color.hex }} 
                  />
                  <div>
                    <div className={`text-[10px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{color.name}</div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase">{color.hex}</div>
                  </div>
                </div>
                <div className={`text-[8px] font-mono text-right leading-normal shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <div>R: {color.rgb[0]}</div>
                  <div>G: {color.rgb[1]}</div>
                  <div>B: {color.rgb[2]}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Image Info Panel */}
      <div className={`border rounded-2xl p-5 space-y-3.5 animate-fade-in-up delay-300 ${cardClass}`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <Info size={13} className="text-indigo-400" />
          Image Properties
        </h4>

        {metadata ? (
          <div className="space-y-2 text-xs">
            {[
              { label: 'File Name', value: metadata.name, truncate: true },
              { label: 'File Type', value: metadata.type },
              { label: 'Resolution', value: metadata.dimensions, mono: true },
              { label: 'File Size', value: metadata.size }
            ].map((item, idx) => (
              <div key={idx} className={`flex justify-between border-b pb-1.5 last:border-b-0 ${
                isDark ? 'border-white/[0.04]' : 'border-slate-200/40'
              }`}>
                <span className="text-slate-500">{item.label}</span>
                <span className={`font-medium ${item.truncate ? 'truncate max-w-[150px]' : ''} ${item.mono ? 'font-mono' : ''} ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>{item.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-[10px] leading-relaxed text-center py-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            No image active. Load a file or target test asset to read properties.
          </p>
        )}
      </div>

    </div>
  );
};
