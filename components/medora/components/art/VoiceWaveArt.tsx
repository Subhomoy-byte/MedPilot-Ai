import React from 'react';
import { Volume2, Mic, Globe2 } from 'lucide-react';

export const VoiceWaveArt: React.FC<{ className?: string; isPlaying?: boolean }> = ({
  className = '',
  isPlaying = true,
}) => {
  return (
    <div className={`relative select-none overflow-hidden rounded-2xl bg-linear-to-b from-[#181332] to-[#0d0a1d] border border-purple-500/30 p-5 shadow-[0_0_30px_rgba(139,92,246,0.2)] ${className}`}>
      {/* Background glow orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center">
            <Volume2 className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-white tracking-wider block">
              MULTILINGUAL AUDIO SYNTHESIZER
            </span>
            <span className="text-[10px] text-purple-300/70 font-mono">
              Natural Speech Engine (5 Languages)
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          ACTIVE
        </span>
      </div>

      {/* Animated Sound Wave Equalizer Bars */}
      <div className="h-16 flex items-center justify-center gap-1.5 bg-[#0b0818] rounded-xl p-3 border border-purple-500/20 my-2">
        {[14, 28, 44, 22, 52, 36, 60, 40, 26, 48, 56, 32, 18, 42, 58, 30, 20, 38, 50, 24].map((h, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-linear-to-t from-[#8b5cf6] via-[#ec4899] to-[#06b6d4] transition-all duration-300"
            style={{
              height: isPlaying ? `${Math.max(h + ((i % 3) * 6), 8)}%` : '8%',
              opacity: 0.8 + (i % 2) * 0.2,
            }}
          />
        ))}
      </div>

      {/* Supported Language Chips */}
      <div className="flex items-center justify-between pt-3 border-t border-purple-500/20 text-[10px] font-mono">
        <div className="flex items-center gap-1 text-purple-300">
          <Globe2 className="w-3 h-3 text-cyan-400" />
          <span>Accents:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-500/30">EN 🇺🇸</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-500/30">ES 🇪🇸</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-500/30">FR 🇫🇷</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-500/30">HI 🇮🇳</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-500/30">ZH 🇨🇳</span>
        </div>
      </div>
    </div>
  );
};
