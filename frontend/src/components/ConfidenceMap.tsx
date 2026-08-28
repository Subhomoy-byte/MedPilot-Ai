import React, { useState } from 'react';
import { MedicineEntity, LabTestEntity, InteractionAlert } from '../types';
import { 
  Pill, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Maximize2, 
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ConfidenceMapProps {
  medicines: MedicineEntity[];
  labs: LabTestEntity[];
  interactions: InteractionAlert[];
  selectedEntityId?: string | null;
  onSelectEntity?: (id: string) => void;
  onJumpToDocumentBox?: (box: { x: number; y: number; width: number; height: number }) => void;
}

export const ConfidenceMap: React.FC<ConfidenceMapProps> = ({
  medicines,
  labs,
  interactions,
  selectedEntityId,
  onSelectEntity,
  onJumpToDocumentBox,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'meds' | 'labs' | 'interactions'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Group entities into nodes
  const medNodes = medicines.map((m, idx) => ({
    id: m.id,
    type: 'med' as const,
    title: m.name,
    subtitle: m.strength,
    confidence: m.ocrConfidence,
    isLowConfidence: m.isLowConfidence || m.ocrConfidence < 75,
    uncertaintyReason: m.uncertaintyReason,
    x: 20 + (idx % 2) * 35,
    y: 25 + Math.floor(idx / 2) * 32,
    raw: m,
  }));

  const labNodes = labs.map((l, idx) => ({
    id: l.id,
    type: 'lab' as const,
    title: l.name,
    subtitle: `${l.value} ${l.unit}`,
    confidence: l.confidence,
    status: l.status,
    isLowConfidence: l.status !== 'normal',
    x: 65 + (idx % 2) * 20,
    y: 28 + Math.floor(idx / 2) * 30,
    raw: l,
  }));

  const allNodes = [...medNodes, ...labNodes];

  const filteredNodes = allNodes.filter((node) => {
    if (filterType === 'meds') return node.type === 'med';
    if (filterType === 'labs') return node.type === 'lab';
    return true;
  });

  return (
    <div
      id="medora-confidence-map"
      className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] p-5 sm:p-6 shadow-xl shadow-purple-950/20 space-y-4 relative overflow-hidden"
    >
      {/* Glow background accent */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#8b5cf6]/10 blur-3xl pointer-events-none" />

      {/* Header with Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#261d4a]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-linear-to-r from-purple-950 to-pink-950 border border-purple-800/50 text-[#c084fc] text-xs font-bold font-mono uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Interactive Confidence Map</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white font-display">
            Multi-Entity OCR Graph & Safety Links
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            High Conf (≥90%)
          </span>
          <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Flagged/Review (&lt;75%)
          </span>
          <span className="flex items-center gap-1 text-red-400 bg-red-950/40 px-2 py-0.5 rounded-md border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Safety Alert
          </span>
        </div>
      </div>

      {/* Interactive Graph Canvas / Viewport */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-[#090616] rounded-2xl border border-[#261d4a] overflow-hidden">
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'radial-gradient(circle, #8b5cf6 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* SVG connection lines between related entities */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="alertGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Relationship curves */}
          {interactions.map((int, idx) => (
            <path
              key={idx}
              d="M 120 100 Q 240 200 360 140"
              fill="none"
              stroke="url(#alertGradient)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          ))}

          <path
            d="M 100 240 Q 220 180 340 260"
            fill="none"
            stroke="url(#purpleGradient)"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
        </svg>

        {/* Nodes Layer */}
        <div className="absolute inset-0 p-4 overflow-auto">
          {filteredNodes.map((node) => {
            const isSelected = selectedEntityId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => {
                  if (onSelectEntity) onSelectEntity(node.id);
                  if (onJumpToDocumentBox && node.raw.boundingBox) {
                    onJumpToDocumentBox(node.raw.boundingBox);
                  }
                }}
                className={`absolute cursor-pointer transition-all duration-300 p-3 sm:p-3.5 rounded-xl border backdrop-blur-md shadow-lg ${
                  isSelected
                    ? 'bg-[#2a1b5c] border-[#8b5cf6] ring-2 ring-[#8b5cf6] text-white z-20 scale-105 shadow-purple-500/30'
                    : node.isLowConfidence
                    ? 'bg-[#211428] border-amber-500/50 hover:border-amber-400 text-amber-200 z-10'
                    : 'bg-[#150f33] border-[#342468] hover:border-[#8b5cf6] text-neutral-200 hover:scale-102 z-10'
                }`}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      node.type === 'med'
                        ? 'bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {node.type === 'med' ? <Pill className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold truncate max-w-[130px] sm:max-w-[160px] text-white">
                      {node.title}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {node.subtitle}
                    </div>
                  </div>
                </div>

                {/* Score badge on node */}
                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-neutral-400">OCR Conf</span>
                  <span
                    className={`font-bold ${
                      node.confidence >= 90
                        ? 'text-emerald-400'
                        : node.confidence >= 75
                        ? 'text-purple-300'
                        : 'text-amber-400'
                    }`}
                  >
                    {node.confidence}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#181135]/90 backdrop-blur-md border border-[#2d2259] rounded-xl p-1 shadow-lg">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'all' ? 'bg-[#8b5cf6] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('meds')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'meds' ? 'bg-[#8b5cf6] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Meds
          </button>
          <button
            onClick={() => setFilterType('labs')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'labs' ? 'bg-[#8b5cf6] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Labs
          </button>
        </div>
      </div>
    </div>
  );
};
