import React from 'react';

export const BiomarkerSpectrumArt: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative select-none overflow-hidden rounded-2xl bg-linear-to-b from-[#181332] to-[#0d0a1d] border border-purple-500/30 p-5 shadow-[0_0_30px_rgba(139,92,246,0.2)] ${className}`}>
      {/* Background glow orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-600/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="text-xs font-mono font-bold text-white tracking-wider">
            METABOLIC BIOMARKER SPECTRUM
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300">
          PHYSIOLOGICAL ZONES
        </span>
      </div>

      {/* Visual SVG Wave Spectrum */}
      <div className="relative py-2">
        <svg viewBox="0 0 400 120" className="w-full h-28 overflow-visible">
          <defs>
            <linearGradient id="purpleGradWave" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="glowGradWave" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Target Safe Zone Band */}
          <rect x="50" y="25" width="220" height="70" rx="8" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeOpacity="0.3" strokeDasharray="4 4" />
          <text x="55" y="40" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">TARGET NORMAL BAND</text>

          {/* Area Fill */}
          <path
            d="M 10 90 Q 60 20, 120 45 T 220 30 T 320 80 T 390 60 L 390 115 L 10 115 Z"
            fill="url(#glowGradWave)"
          />

          {/* Wave Curve Line */}
          <path
            d="M 10 90 Q 60 20, 120 45 T 220 30 T 320 80 T 390 60"
            fill="none"
            stroke="url(#purpleGradWave)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Interactive Biomarker Data Nodes */}
          {/* Node 1: Fasting Glucose */}
          <g transform="translate(120, 45)">
            <circle r="7" fill="#ec4899" className="animate-ping opacity-75" />
            <circle r="5" fill="#ec4899" stroke="#ffffff" strokeWidth="2" />
            <text x="8" y="-6" fill="#f472b6" fontSize="9" fontFamily="monospace" fontWeight="bold">Glucose 114 (Elevated)</text>
          </g>

          {/* Node 2: HbA1c */}
          <g transform="translate(220, 30)">
            <circle r="5" fill="#a855f7" stroke="#ffffff" strokeWidth="2" />
            <text x="-40" y="-10" fill="#c084fc" fontSize="9" fontFamily="monospace" fontWeight="bold">HbA1c 6.8%</text>
          </g>

          {/* Node 3: eGFR */}
          <g transform="translate(320, 80)">
            <circle r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
            <text x="8" y="14" fill="#22d3ee" fontSize="9" fontFamily="monospace" fontWeight="bold">eGFR 88 (Optimal)</text>
          </g>
        </svg>
      </div>

      {/* 3 Visual Biomarker Cards */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-purple-500/20">
        <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30">
          <span className="text-[9px] font-mono text-purple-400 block">LIPIDS</span>
          <span className="text-xs font-mono font-bold text-white">182 mg/dL</span>
          <span className="text-[8px] text-emerald-400 font-bold block">✓ Optimal</span>
        </div>
        <div className="p-2 rounded-xl bg-pink-950/40 border border-pink-500/30">
          <span className="text-[9px] font-mono text-pink-400 block">GLUCOSE</span>
          <span className="text-xs font-mono font-bold text-white">114 mg/dL</span>
          <span className="text-[8px] text-pink-400 font-bold block">▲ +14 mg/dL</span>
        </div>
        <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
          <span className="text-[9px] font-mono text-cyan-400 block">KIDNEY</span>
          <span className="text-xs font-mono font-bold text-white">88 mL/min</span>
          <span className="text-[8px] text-cyan-300 font-bold block">✓ Stage 1</span>
        </div>
      </div>
    </div>
  );
};
