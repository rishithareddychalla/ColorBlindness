import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, ArrowUpCircle } from 'lucide-react';
import { generateSampleImage } from '../utils/imageProcessor';

interface ImageUploaderProps {
  onImageLoaded: (src: string, file: File | null) => void;
  theme?: 'dark' | 'light';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageLoaded, theme = 'dark' }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageLoaded(event.target.result as string, file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const loadSample = () => {
    const sampleSrc = generateSampleImage();
    onImageLoaded(sampleSrc, null);
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center p-10 sm:p-14 border-2 border-dashed rounded-3xl max-w-xl mx-auto text-center space-y-7 transition-all duration-300 ${
        isDragActive 
          ? isDark 
            ? 'border-indigo-500 bg-indigo-500/[0.06] scale-[1.01]' 
            : 'border-indigo-400 bg-indigo-50/80 scale-[1.01]'
          : isDark 
            ? 'border-white/[0.08] bg-white/[0.02] backdrop-blur-md hover:border-indigo-500/30 hover:bg-white/[0.03]' 
            : 'border-slate-300/60 bg-white/50 backdrop-blur-md hover:border-indigo-400/40 hover:bg-white/70'
      }`}
    >
      {/* Animated icon */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 ${
        isDark 
          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
          : 'bg-indigo-50 border-indigo-200/50 text-indigo-500'
      }`}>
        {isDragActive ? (
          <ArrowUpCircle size={36} className="animate-bounce" />
        ) : (
          <Upload size={36} className="animate-shimmer" />
        )}
      </div>

      <div className="space-y-2.5">
        <h3 className={`text-xl font-extrabold tracking-tight ${
          isDark ? 'text-slate-100' : 'text-slate-900'
        }`}>
          {isDragActive ? 'Drop your image here' : 'Upload your target assets'}
        </h3>
        <p className={`text-xs max-w-md leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          Drag & drop your visual design, website screenshot, or image to inspect colors under colorblind deficiencies.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload target image file"
      />

      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
        <button
          onClick={triggerUpload}
          className={`px-7 py-3.5 text-xs font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
            isDark 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
          }`}
        >
          <ImageIcon size={14} />
          Browse Files
        </button>

        <button
          onClick={loadSample}
          className={`px-7 py-3.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] border ${
            isDark 
              ? 'bg-white/[0.04] hover:bg-white/[0.07] border-white/[0.08] text-slate-300 hover:text-white' 
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm'
          }`}
        >
          <Sparkles size={14} className="text-amber-400" />
          Use Test Target
        </button>
      </div>

      {/* Drag overlay */}
      {isDragActive && (
        <div className={`absolute inset-0 w-full h-full rounded-3xl z-50 flex items-center justify-center pointer-events-none ${
          isDark ? 'bg-indigo-600/5' : 'bg-indigo-50/50'
        }`}>
          <div className={`border p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-2 backdrop-blur-sm ${
            isDark 
              ? 'bg-slate-900/90 border-indigo-500/30' 
              : 'bg-white/90 border-indigo-300/50'
          }`}>
            <Upload size={24} className="text-indigo-400 animate-bounce" />
            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Drop files here to upload
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
