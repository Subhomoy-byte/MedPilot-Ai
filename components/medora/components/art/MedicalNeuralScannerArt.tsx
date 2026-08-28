import React from 'react';

export const MedicalNeuralScannerArt: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative select-none overflow-hidden rounded-2xl bg-linear-to-b from-[#181332] to-[#0d0a1d] border border-purple-500/30 p-4 shadow-[0_0_30px_rgba(139,92,246,0.2)] ${className}`}>
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b2d6e15_1px,transparent_1px),linear-gradient(to_bottom,#3b2d6e15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Laser Scanning Line */}
      <div className="absolute left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#a855f7] to-transparent shadow-[0_0_12px_#c084fc] animate-laser-scan pointer-events-none z-20" />

      {/* Visual Rx Canvas Hologram */}
      <div className="relative z-10 space-y-3">
        {/* Top Telemetry Strip */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 text-[10px] font-mono text-purple-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
            <span className="font-bold text-white tracking-wider">OCR CONFIDENCE MAP</span>
          </div>
          <span className="text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
            EXAMPLE SCAN
          </span>
        </div>

        {/* Prescription Document Mock with Neon Bounding Boxes */}
        <div className="bg-[#0b0818]/90 rounded-xl p-3.5 border border-purple-500/30 space-y-2.5 relative">
          {/* Watermark Rx */}
          <div className="absolute right-3 top-2 text-4xl font-serif font-black text-purple-900/40 select-none pointer-events-none">
            ℞
          </div>

          {/* Line 1: Header */}
          <div className="flex items-center justify-between">
            <div className="h-2.5 w-28 bg-linear-to-r from-purple-500/60 to-purple-400/20 rounded" />
            <span className="text-[9px] font-mono text-purple-400">PATIENT ID #8849</span>
          </div>

          {/* Bounding Box 1: Metformin (High Confidence - Neon Green/Purple) */}
          <div className="relative p-2 rounded-lg bg-purple-950/40 border border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.25)] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-white">Metformin 500mg ER</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40 font-bold">
                  99% OCR
                </span>
              </div>
              <p className="text-[10px] text-purple-300/80 font-mono">1 tab PO daily with dinner</p>
            </div>
            <div className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 text-[10px] font-mono">
              ✓
            </div>
          </div>

          {/* Bounding Box 2: Atorvastatin (Low Confidence Flag - Neon Amber/Orange) */}
          <div className="relative p-2 rounded-lg bg-amber-950/30 border border-dashed border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-amber-200">Atorvastatin 20mg</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40 font-bold">
                  ⚠️ 68% Cursive
                </span>
              </div>
              <p className="text-[10px] text-amber-300/80 font-mono">Stroke ambiguity on numeric dose</p>
            </div>
            <div className="text-[9px] font-mono text-amber-400 bg-amber-900/40 px-1.5 py-0.5 rounded border border-amber-500/30">
              AUDIT
            </div>
          </div>

          {/* Line 3: Footer signature indicator */}
          <div className="flex items-center justify-between pt-1 border-t border-purple-900/40 text-[9px] font-mono text-purple-400">
            <span className="text-neutral-400">MD Signature: <span className="text-purple-300 italic font-serif">Dr. H. Vance, MD</span></span>
            <span className="text-emerald-400">LIC# 49204-NY</span>
          </div>
        </div>

        {/* Confidence Legend */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-emerald-400 shrink-0" />
            <span className="text-purple-200">Verified against pharmacopeia</span>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-950/40 border border-dashed border-amber-500/50 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-amber-400 shrink-0" />
            <span className="text-amber-200">Flagged for you to confirm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
