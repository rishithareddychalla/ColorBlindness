import React, { useState, useRef, useEffect } from 'react';
import type { ViewMode, VisionType, ImageMetadata } from '../types';
import { simulateColorblindness, generateLossHeatmap, rgbToHex, getColorName } from '../utils/colorUtils';
import { 
  ZoomIn, ZoomOut, RefreshCw, 
  MousePointer, Pipette, Search 
} from 'lucide-react';

interface ImageWorkspaceProps {
  imageSrc: string;
  selectedVision: VisionType;
  viewMode: ViewMode;
  isHeatmapActive: boolean;
  metadata: ImageMetadata | null;
  onColorPicked: (color: { hex: string; rgb: [number, number, number]; name: string }) => void;
  onCanvasRef: (canvas: HTMLCanvasElement | null) => void;
  theme?: 'dark' | 'light';
}

export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({
  imageSrc,
  selectedVision,
  viewMode,
  isHeatmapActive,
  metadata,
  onColorPicked,
  onCanvasRef,
  theme = 'dark'
}) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<'pan' | 'magnifier' | 'picker'>('pan');
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100%
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Loupe / Picker States
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMouseOver, setIsMouseOver] = useState(false);
  const [hoverColor, setHoverColor] = useState<{ hex: string; rgb: [number, number, number] } | null>(null);

  // Canvas References
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const normalCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasesRef = useRef<Record<string, HTMLCanvasElement | null>>({});
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Reset viewport zoom & pan on image source change
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [imageSrc]);

  // Update root callback with canvas ref for exports
  useEffect(() => {
    if (canvasRef.current) {
      onCanvasRef(canvasRef.current);
    } else if (normalCanvasRef.current) {
      onCanvasRef(normalCanvasRef.current);
    }
  }, [imageSrc, selectedVision, isHeatmapActive, onCanvasRef]);

  // Render processed canvases
  const drawCanvas = (
    img: HTMLImageElement,
    canvas: HTMLCanvasElement | null,
    vision: VisionType,
    heatmap: boolean
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const srcData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const destData = ctx.createImageData(canvas.width, canvas.height);

    if (heatmap) {
      generateLossHeatmap(srcData, destData, vision);
    } else {
      simulateColorblindness(srcData, destData, vision);
    }

    ctx.putImageData(destData, 0, 0);
  };

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      // Draw primary simulated canvas
      drawCanvas(img, canvasRef.current, selectedVision, isHeatmapActive);

      // Draw normal canvas for split screen
      drawCanvas(img, normalCanvasRef.current, 'normal', false);

      // Draw all grid viewports
      if (viewMode === 'grid') {
        const gridTypes: VisionType[] = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'];
        gridTypes.forEach(type => {
          drawCanvas(img, gridCanvasesRef.current[type], type, false);
        });
      }
    };
  }, [imageSrc, selectedVision, isHeatmapActive, viewMode]);

  // --- Zoom & Pan Event Handlers ---
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'pan') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (activeTool === 'picker' && hoverColor) {
      const name = getColorName(hoverColor.hex);
      onColorPicked({
        hex: hoverColor.hex,
        rgb: hoverColor.rgb,
        name
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Handle Pan dragging
    if (isPanning && activeTool === 'pan') {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // Handle split slider dragging
    if (isDraggingSlider && viewMode === 'split') {
      const splitRect = splitContainerRef.current?.getBoundingClientRect();
      if (splitRect) {
        const relativeX = e.clientX - splitRect.left;
        const pct = Math.max(0, Math.min(100, (relativeX / splitRect.width) * 100));
        setSliderPosition(pct);
      }
      return;
    }

    // Handle Magnifier color pick sampling
    if (activeTool === 'magnifier' || activeTool === 'picker') {
      const activeCanvas = canvasRef.current;
      if (!activeCanvas) return;

      const canvasRect = activeCanvas.getBoundingClientRect();
      const relativeX = (e.clientX - canvasRect.left) * (activeCanvas.width / canvasRect.width);
      const relativeY = (e.clientY - canvasRect.top) * (activeCanvas.height / canvasRect.height);

      if (
        relativeX >= 0 && relativeX < activeCanvas.width &&
        relativeY >= 0 && relativeY < activeCanvas.height
      ) {
        const ctx = activeCanvas.getContext('2d');
        if (ctx) {
          const pixel = ctx.getImageData(Math.floor(relativeX), Math.floor(relativeY), 1, 1).data;
          const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
          setHoverColor({
            hex,
            rgb: [pixel[0], pixel[1], pixel[2]]
          });
        }
      } else {
        setHoverColor(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSlider(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomIntensity = 0.15;
    const delta = e.deltaY < 0 ? 1 : -1;
    const nextScale = Math.max(0.4, Math.min(6, scale + delta * zoomIntensity));
    setScale(nextScale);
  };

  const zoomIn = () => setScale(prev => Math.min(6, prev + 0.25));
  const zoomOut = () => setScale(prev => Math.max(0.4, prev - 0.25));
  const resetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setSliderPosition(50);
  };

  const canvasBorderClass = isDark ? 'border-white/[0.06]' : 'border-slate-200/60';
  const canvasShadowClass = isDark ? 'shadow-2xl shadow-black/30' : 'shadow-xl shadow-slate-300/30';

  // Render workspace content based on active viewMode
  const renderViewport = () => {
    const transformStyle = {
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
      transformOrigin: 'center center',
      transition: isPanning ? 'none' : 'transform 0.15s ease-out'
    };

    switch (viewMode) {
      case 'single':
        return (
          <div className="relative w-full h-full flex items-center justify-center select-none" style={transformStyle}>
            <canvas ref={canvasRef} className={`max-w-full max-h-[75vh] rounded-xl object-contain border ${canvasBorderClass} ${canvasShadowClass}`} />
          </div>
        );

      case 'split':
        return (
          <div className="relative w-full h-full flex items-center justify-center select-none" style={transformStyle}>
            {/* Split viewport container wrapping normal & simulated canvases */}
            <div 
              ref={splitContainerRef}
              className={`relative max-w-full max-h-[75vh] aspect-auto border rounded-xl overflow-hidden ${canvasBorderClass} ${canvasShadowClass}`}
            >
              {/* Normal Vision (Always bottom) */}
              <canvas ref={normalCanvasRef} className="block max-w-full max-h-[75vh] object-contain" />
              
              {/* Simulated Vision (On top, clipped) */}
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ 
                  clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
                }}
              />

              {/* Split Line Indicator */}
              <div 
                className="absolute inset-y-0 z-20 pointer-events-none"
                style={{ 
                  left: `${sliderPosition}%`, 
                  borderRight: '2px solid #6366f1' 
                }}
              />

              {/* Interactive slider handle */}
              <div 
                className="absolute inset-y-0 z-30 cursor-ew-resize flex items-center justify-center"
                style={{ left: `calc(${sliderPosition}% - 14px)` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingSlider(true);
                }}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs select-none">
                  ↔
                </div>
              </div>
            </div>
          </div>
        );

      case 'side-by-side':
        return (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-6 p-4" style={transformStyle}>
            <div className="relative flex-1 flex flex-col items-center gap-2">
              <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${
                isDark 
                  ? 'text-slate-500 bg-slate-950 border-slate-900' 
                  : 'text-slate-500 bg-white border-slate-200'
              }`}>
                Original Normal Vision
              </span>
              <canvas ref={normalCanvasRef} className={`max-w-full max-h-[60vh] rounded-xl object-contain border ${canvasBorderClass} ${canvasShadowClass}`} />
            </div>

            <div className="relative flex-1 flex flex-col items-center gap-2">
              <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${
                isDark 
                  ? 'text-indigo-400 bg-slate-950 border-slate-900' 
                  : 'text-indigo-600 bg-white border-slate-200'
              }`}>
                Simulated {selectedVision.toUpperCase()}
              </span>
              <canvas ref={canvasRef} className={`max-w-full max-h-[60vh] rounded-xl object-contain border ${canvasBorderClass} ${canvasShadowClass}`} />
            </div>
          </div>
        );

      case 'grid':
        const gridTypes: { id: VisionType; label: string }[] = [
          { id: 'normal', label: 'Normal Vision' },
          { id: 'protanopia', label: 'Protanopia (Red-Blind)' },
          { id: 'deuteranopia', label: 'Deuteranopia (Green-Blind)' },
          { id: 'tritanopia', label: 'Tritanopia (Blue-Blind)' }
        ];

        return (
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4" style={transformStyle}>
            {gridTypes.map((type, idx) => (
              <div 
                key={type.id} 
                className={`flex flex-col items-center gap-2 p-2.5 rounded-2xl border animate-fade-in-up transition-colors duration-300 ${
                  isDark 
                    ? 'bg-white/[0.015] border-white/[0.04]' 
                    : 'bg-white/50 border-slate-200/50'
                }`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <span className={`text-[9px] uppercase tracking-widest font-bold ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {type.label}
                </span>
                <canvas 
                  ref={el => { gridCanvasesRef.current[type.id] = el; }} 
                  className={`max-w-full max-h-[30vh] rounded-lg object-contain border ${canvasBorderClass} shadow-md`} 
                />
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative select-none">
      
      {/* Visual Inspector Toolbar */}
      <div className={`w-full border-b p-2.5 flex items-center justify-between z-20 transition-colors duration-300 ${
        isDark 
          ? 'bg-[#12161f]/40 border-white/[0.05]' 
          : 'bg-white/50 border-slate-200/50'
      }`}>
        <div className="flex items-center gap-1">
          {(['pan', 'magnifier', 'picker'] as const).map((tool) => {
            const isActive = activeTool === tool;
            const icons = { pan: <MousePointer size={12} />, magnifier: <Search size={12} />, picker: <Pipette size={12} /> };
            const labels = { pan: 'Pan', magnifier: 'Loupe', picker: 'Picker' };
            const titles = { pan: 'Pan Viewport', magnifier: 'Inspect Pixels', picker: 'Extract Custom Color Swatch' };
            return (
              <button
                key={tool}
                onClick={() => setActiveTool(tool)}
                className={`p-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : isDark 
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title={titles[tool]}
              >
                {icons[tool]}
                {labels[tool]}
              </button>
            );
          })}
        </div>

        <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${
          isDark 
            ? 'bg-white/[0.03] border-white/[0.06]' 
            : 'bg-slate-100 border-slate-200'
        }`}>
          <button onClick={zoomOut} className={`p-1.5 rounded cursor-pointer transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`} title="Zoom Out"><ZoomOut size={12} /></button>
          <span className={`text-[10px] font-bold px-1 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className={`p-1.5 rounded cursor-pointer transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`} title="Zoom In"><ZoomIn size={12} /></button>
          <button onClick={resetZoom} className={`p-1.5 rounded cursor-pointer transition-colors border-l ${isDark ? 'text-slate-400 hover:text-white border-white/[0.06]' : 'text-slate-500 hover:text-slate-900 border-slate-200'}`} title="Reset Layout"><RefreshCw size={12} /></button>
        </div>
      </div>

      {/* Main interactive viewport container */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setIsMouseOver(false);
        }}
        onMouseEnter={() => setIsMouseOver(true)}
        className={`w-full flex-grow relative overflow-hidden flex items-center justify-center p-4 min-h-[400px] sm:min-h-[500px] transition-colors duration-300 ${
          isDark ? 'bg-[#0d1017]/30' : 'bg-slate-100/30'
        } ${
          activeTool === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
        }`}
      >
        {renderViewport()}

        {/* Magnifier / Loupe Overlay (Renders floating over cursor) */}
        {isMouseOver && hoverColor && (activeTool === 'magnifier' || activeTool === 'picker') && (
          <div 
            className={`absolute pointer-events-none rounded-full w-28 h-28 border-[3px] shadow-2xl flex flex-col items-center justify-center overflow-hidden z-40 ${
              isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'
            }`}
            style={{
              left: mousePos.x - 56,
              top: mousePos.y - 120
            }}
          >
            {/* Color preview swatch half */}
            <div className={`w-full h-[60%] border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`} style={{ backgroundColor: hoverColor.hex }} />
            {/* Hex code indicator half */}
            <div className={`w-full h-[40%] flex flex-col items-center justify-center p-1 text-[8px] font-mono leading-none ${
              isDark ? 'bg-slate-950' : 'bg-white'
            }`}>
              <span className={`font-bold mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{hoverColor.hex.toUpperCase()}</span>
              <span className="text-slate-500">rgb({hoverColor.rgb.join(',')})</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Canvas Meta Tag */}
      {metadata && (
        <div className={`absolute bottom-4 left-4 z-20 border p-2.5 rounded-xl shadow-lg backdrop-blur-sm text-[9px] font-semibold space-y-0.5 pointer-events-none select-none ${
          isDark 
            ? 'bg-[#12161f]/80 border-white/[0.06] text-slate-400' 
            : 'bg-white/80 border-slate-200/60 text-slate-500'
        }`}>
          <div>File: <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{metadata.name}</span></div>
          <div>Size: <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{metadata.size}</span></div>
          <div>Scale: <span className="text-indigo-400">{Math.round(scale * 100)}%</span></div>
        </div>
      )}
    </div>
  );
};
