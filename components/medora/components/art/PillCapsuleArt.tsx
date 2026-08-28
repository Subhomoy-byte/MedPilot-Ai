import React from 'react';

export const PillCapsuleArt: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative select-none flex items-center justify-center p-6 ${className}`}>
      {/* Outer Pulse Glow Halo */}
      <div className="absolute w-44 h-44 bg-purple-600/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute w-32 h-32 bg-pink-500/20 rounded-full blur-2xl animate-pulse" />

      {/* Floating Molecule Particles */}
      <div className="absolute top-2 left-6 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
      <div className="absolute bottom-4 right-8 w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
      <div className="absolute top-8 right-4 w-2 h-2 rounded-full bg-pink-400 animate-ping opacity-60" />

      {/* SVG 3D-Styled Stylized Capsule */}
      <div className="relative z-10 transform -rotate-12 hover:rotate-0 transition-transform duration-500">
        <svg width="220" height="90" viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Left Shell: Deep Electric Violet */}
            <linearGradient id="capsuleViolet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="40%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>

            {/* Right Shell: Radiant Neon Coral / Magenta */}
            <linearGradient id="capsuleCoral" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>

            {/* Capsule Gloss Highlight */}
            <linearGradient id="glossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>

            {/* Outer Drop Shadow Filter */}
            <filter id="purpleShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#8b5cf6" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Main Capsule Body */}
          <g filter="url(#purpleShadow)">
            {/* Left Half (Violet) */}
            <path
              d="M 45 10 A 35 35 0 0 0 45 80 L 110 80 L 110 10 Z"
              fill="url(#capsuleViolet)"
            />

            {/* Right Half (Coral/Pink) */}
            <path
              d="M 110 10 L 175 10 A 35 35 0 0 1 175 80 L 110 80 Z"
              fill="url(#capsuleCoral)"
            />

            {/* Divider Band Ring */}
            <rect x="106" y="8" width="8" height="74" rx="4" fill="#09070f" stroke="#a855f7" strokeWidth="1.5" />

            {/* Top Specular Gloss Highlight Strip */}
            <path
              d="M 35 22 Q 110 14 185 22 Q 110 26 35 22 Z"
              fill="url(#glossGrad)"
            />

            {/* Rx Micro Text Imprint */}
            <text x="65" y="52" fill="#ffffff" fillOpacity="0.9" fontSize="16" fontFamily="sans-serif" fontWeight="900" letterSpacing="1">
              500
            </text>
            <text x="135" y="52" fill="#ffffff" fillOpacity="0.9" fontSize="14" fontFamily="monospace" fontWeight="bold">
              MED
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
