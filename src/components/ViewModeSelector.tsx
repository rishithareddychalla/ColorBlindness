import React from 'react';
import type { ViewMode } from '../types';
import { Columns, Split, LayoutGrid, Image as ImageIcon } from 'lucide-react';

interface ViewModeSelectorProps {
  activeMode: ViewMode;
  onChangeMode: (mode: ViewMode) => void;
  theme?: 'dark' | 'light';
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  activeMode,
  onChangeMode,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const modes: { id: ViewMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'single',
      label: 'Inspect',
      icon: <ImageIcon size={13} />,
      desc: 'Focus on single simulated view'
    },
    {
      id: 'split',
      label: 'Interactive Split',
      icon: <Split size={13} />,
      desc: 'Drag slider to wipe compare'
    },
    {
      id: 'side-by-side',
      label: 'Side-by-Side',
      icon: <Columns size={13} />,
      desc: 'Horizontal comparison'
    },
    {
      id: 'grid',
      label: 'Auditing Grid',
      icon: <LayoutGrid size={13} />,
      desc: 'Compare all deficiencies'
    }
  ];

  return (
    <div className="space-y-4">
      <div className={`flex items-center justify-between border-b pb-2 ${
        isDark ? 'border-white/[0.05]' : 'border-slate-200/60'
      }`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDark ? 'text-slate-500' : 'text-slate-500'
        }`}>
          📊 Layout Viewports
        </h4>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
          isDark 
            ? 'bg-white/[0.03] border-white/[0.06] text-slate-400' 
            : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}>
          CSS Grid
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {modes.map(mode => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onChangeMode(mode.id)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 cursor-pointer outline-none ${
                isActive
                  ? isDark 
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-sm' 
                    : 'bg-indigo-50 border-indigo-300/60 text-indigo-600 shadow-sm'
                  : isDark 
                    ? 'bg-white/[0.02] border-white/[0.05] text-slate-400 hover:border-white/[0.1] hover:text-slate-200' 
                    : 'bg-white/60 border-slate-200/60 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
              title={mode.desc}
              role="tab"
              aria-selected={isActive}
            >
              {mode.icon}
              <span className="text-[10px] font-bold tracking-tight">{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
