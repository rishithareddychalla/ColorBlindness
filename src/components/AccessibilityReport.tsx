import React from 'react';
import type { AccessibilityReport as ReportData, ImageMetadata } from '../types';
import { generatePDFReport } from '../utils/pdfGenerator';
import { 
  ShieldCheck, ShieldAlert, CheckCircle, 
  XCircle, Lightbulb, Download, BarChart2 
} from 'lucide-react';

interface AccessibilityReportProps {
  report: ReportData;
  metadata: ImageMetadata | null;
  imageSrc: string | null;
  theme?: 'dark' | 'light';
}

export const AccessibilityReport: React.FC<AccessibilityReportProps> = ({
  report,
  metadata,
  imageSrc,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const getScoreColor = (score: number) => {
    if (score >= 80) return isDark 
      ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' 
      : 'text-emerald-600 border-emerald-300/40 bg-emerald-50';
    if (score >= 50) return isDark 
      ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' 
      : 'text-amber-600 border-amber-300/40 bg-amber-50';
    return isDark 
      ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' 
      : 'text-rose-600 border-rose-300/40 bg-rose-50';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return 'Excellent accessibility properties. Low color overlap risks.';
    if (score >= 50) return 'Moderate accessibility concerns. Some colors may merge.';
    return 'Critical accessibility issues detected. Action required to fix contrast.';
  };

  const handleExport = () => {
    generatePDFReport(report, metadata, imageSrc);
  };

  const cardClass = isDark 
    ? 'bg-white/[0.02] border-white/[0.05]' 
    : 'bg-white/60 border-slate-200/60';

  const innerCardClass = isDark 
    ? 'bg-white/[0.02] border-white/[0.04]' 
    : 'bg-slate-50/80 border-slate-200/40';

  return (
    <div className="space-y-6">
      
      {/* Score Header Card */}
      <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 animate-fade-in-scale ${getScoreColor(report.score)}`}>
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Accessibility Compliance Rating</span>
          <h3 className={`text-xl font-extrabold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {report.score >= 80 ? (
              <ShieldCheck size={20} className="text-emerald-400" />
            ) : (
              <ShieldAlert size={20} className="text-rose-400" />
            )}
            Compliance Score: {report.score}/100
          </h3>
          <p className={`text-xs leading-relaxed max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {getScoreDescription(report.score)}
          </p>
        </div>

        {/* Big circular score gauge */}
        <div className="w-16 h-16 rounded-full border-4 border-current flex items-center justify-center font-black text-lg select-none">
          {report.score}
        </div>
      </div>

      {/* Extracted Palette Section */}
      <div className={`border rounded-2xl p-5 space-y-4 ${cardClass}`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <BarChart2 size={13} className="text-indigo-400" />
          Extracted Color Palette
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {report.dominantPalette.map((col, idx) => (
            <div key={idx} className={`border rounded-xl p-2.5 flex items-center gap-3 animate-fade-in-up ${innerCardClass}`} style={{ animationDelay: `${idx * 60}ms` }}>
              <div 
                className={`w-9 h-9 rounded-lg border shrink-0 ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`} 
                style={{ backgroundColor: col.hex }} 
              />
              <div className="min-w-0">
                <div className={`text-[10px] font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{col.name}</div>
                <div className="text-[9px] font-mono text-slate-500 uppercase">{col.hex}</div>
                <div className="text-[8px] font-semibold text-indigo-400">{col.ratio}% coverage</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Color Deficiencies Warnings */}
      <div className={`border rounded-2xl p-5 space-y-4 ${cardClass}`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          ⚠️ High-Risk Contrast Deficiencies
        </h4>

        {report.conflicts.length === 0 ? (
          <div className={`p-3.5 rounded-xl flex items-center gap-2 text-xs font-semibold border ${
            isDark 
              ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400' 
              : 'bg-emerald-50 border-emerald-200/50 text-emerald-600'
          }`}>
            <CheckCircle size={14} />
            No major colorblind contrast overlaps detected in this palette.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {report.conflicts.map((conflict, idx) => (
              <div key={idx} className={`p-3.5 border rounded-xl space-y-2 text-xs ${innerCardClass}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded border ${isDark ? 'border-white/[0.1]' : 'border-slate-200'}`} style={{ backgroundColor: conflict.color1 }} />
                    <span className="text-slate-400">vs</span>
                    <div className={`w-3.5 h-3.5 rounded border ${isDark ? 'border-white/[0.1]' : 'border-slate-200'}`} style={{ backgroundColor: conflict.color2 }} />
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                    conflict.severity === 'high' 
                      ? isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/15' : 'bg-rose-50 text-rose-600 border-rose-200/50'
                      : isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/15' : 'bg-amber-50 text-amber-600 border-amber-200/50'
                  }`}>
                    {conflict.severity} Severity
                  </span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{conflict.description}</p>
                <div className={`text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Deficiencies affected: <span className="text-indigo-400">{conflict.affectedDeficiencies.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WCAG Compliance Matrix */}
      <div className={`border rounded-2xl p-5 space-y-4 ${cardClass}`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          ⚖️ WCAG 2.1 Contrast Matrix
        </h4>

        <div className="space-y-2.5">
          {report.observations.map((obs, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3 border rounded-xl text-xs ${innerCardClass}`}>
              <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{obs.element}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-slate-500 font-mono">Ratio: {obs.ratio.toFixed(1)}:1</span>
                {obs.status === 'pass' ? (
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border ${
                    isDark 
                      ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' 
                      : 'bg-emerald-50 border-emerald-200/50 text-emerald-600'
                  }`}>
                    <CheckCircle size={10} /> PASS ({obs.level})
                  </span>
                ) : (
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 border ${
                    isDark 
                      ? 'bg-rose-500/10 border-rose-500/15 text-rose-400' 
                      : 'bg-rose-50 border-rose-200/50 text-rose-600'
                  }`}>
                    <XCircle size={10} /> FAIL
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Design Recommendations Card */}
      <div className={`border rounded-2xl p-5 space-y-4 ${
        isDark 
          ? 'bg-indigo-500/5 border-indigo-500/10' 
          : 'bg-indigo-50/50 border-indigo-200/40'
      }`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <Lightbulb size={13} className="text-amber-400" />
          A11y Design Recommendations
        </h4>

        <ul className={`space-y-2 text-xs leading-relaxed list-disc list-inside ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {report.recommendations.map((rec, idx) => (
            <li key={idx} className="marker:text-indigo-400">
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* PDF Export Button */}
      <button
        onClick={handleExport}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold text-white rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border border-indigo-500/20 outline-none hover:scale-[1.01] active:scale-[0.99]"
      >
        <Download size={14} />
        Export Compliance Report (PDF)
      </button>

    </div>
  );
};
