import React from 'react';
import { ShieldCheck, Info, Sparkles } from 'lucide-react';

interface SafetyBannerProps {
  compact?: boolean;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({ compact = false }) => {
  return (
    <div
      id="medora-safety-banner"
      className={`bg-[#120d28]/90 backdrop-blur-md text-white border-b border-[#2d2259] ${
        compact ? 'py-2.5 px-4' : 'py-3.5 px-6'
      } flex items-center justify-between text-xs sm:text-sm shadow-md shadow-purple-950/20`}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-linear-to-r from-[#8b5cf6] to-[#ec4899] flex items-center justify-center shrink-0 shadow-xs shadow-purple-500/50">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-neutral-300 font-medium leading-tight">
            <span className="text-[#a78bfa] font-bold">Patient Safety Guard:</span>{' '}
            Medora AI translates what is written on your clinical document. It does not diagnose conditions or prescribe dosage changes.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-400 shrink-0">
          <Info className="w-3.5 h-3.5 text-[#fb7185]" />
          <span>Always discuss uncertainty flags with your clinician</span>
        </div>
      </div>
    </div>
  );
};
