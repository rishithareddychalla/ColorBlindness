import React from 'react';
import type { VisionType } from '../types';
import { VISION_DEFIENCIES } from '../utils/colorUtils';
import { Eye, ShieldAlert, Award } from 'lucide-react';

interface VisionSelectorProps {
  selectedVision: VisionType;
  onChangeVision: (vision: VisionType) => void;
  theme?: 'dark' | 'light';
}

export const VisionSelector: React.FC<VisionSelectorProps> = ({
  selectedVision,
  onChangeVision,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between border-b pb-2 ${
        isDark ? 'border-white/[0.05]' : 'border-slate-200/60'
      }`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-slate-500' : 'text-slate-500'
        }`}>
          <Eye size={12} className="text-indigo-400" />
          Simulation Modes
        </h4>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
          isDark 
            ? 'bg-white/[0.03] border-white/[0.06] text-slate-400' 
            : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}>
          CVD Matrix
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {(Object.keys(VISION_DEFIENCIES) as VisionType[]).map((key, idx) => {
          const detail = VISION_DEFIENCIES[key];
          const isSelected = selectedVision === key;

          return (
            <button
              key={key}
              onClick={() => onChangeVision(key)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer outline-none animate-fade-in-up ${
                isSelected
                  ? isDark 
                    ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/5' 
                    : 'bg-indigo-50 border-indigo-300/60 shadow-md shadow-indigo-200/20'
                  : isDark 
                    ? 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03]' 
                    : 'bg-white/60 border-slate-200/60 hover:border-slate-300 hover:bg-white/80'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
              role="radio"
              aria-checked={isSelected}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold ${
                  isSelected 
                    ? isDark ? 'text-indigo-400' : 'text-indigo-600' 
                    : isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  {detail.name}
                </span>
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {detail.prevalence.split(' ')[0]}
                </span>
              </div>
              <p className={`text-[10px] leading-relaxed line-clamp-2 mb-2 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {detail.description}
              </p>
              
              <div className={`flex items-center gap-3 text-[9px] font-semibold border-t pt-2 ${
                isDark ? 'border-white/[0.04] text-slate-500' : 'border-slate-200/50 text-slate-400'
              }`}>
                <span className="flex items-center gap-1">
                  <ShieldAlert size={10} className="text-amber-500" />
                  Severity: {detail.severity}
                </span>
                <span className="flex items-center gap-1">
                  <Award size={10} className="text-indigo-400" />
                  Cones: {detail.affectedCones.split(' ')[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
