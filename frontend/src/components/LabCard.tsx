import React from 'react';
import { LabTestEntity } from '../types';
import { Activity, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface LabCardProps {
  lab: LabTestEntity;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const LabCard: React.FC<LabCardProps> = ({ lab, isSelected = false, onSelect }) => {
  const isHigh = lab.status === 'high';
  const isLow = lab.status === 'low';
  const isNormal = lab.status === 'normal';

  return (
    <div
      id={`lab-card-${lab.id}`}
      onClick={onSelect}
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 cursor-pointer relative ${
        isSelected
          ? 'bg-[#1e1545] border-[#8b5cf6] shadow-lg shadow-[#8b5cf6]/20 ring-2 ring-[#8b5cf6]/40'
          : isHigh
          ? 'bg-[#201222] border-red-500/40 hover:border-red-400'
          : 'bg-[#120d28]/80 backdrop-blur-xs border-[#2d2259] hover:border-[#8b5cf6]/60 hover:bg-[#181135]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isNormal
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white font-display">
                {lab.name}
              </h4>
              {lab.code && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-[#241a4a] text-purple-200 font-mono border border-purple-800/40">
                  {lab.code}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Category: {lab.category} • {lab.confidence}% OCR Certainty
            </p>
          </div>
        </div>

        {/* Value and Status Pill */}
        <div className="text-right shrink-0">
          <div className="text-lg font-black text-white font-display">
            {lab.value}{' '}
            <span className="text-xs font-normal text-purple-300 font-sans">
              {lab.unit}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 font-mono ${
              isNormal
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : isHigh
                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
            }`}
          >
            {isHigh && <ArrowUpRight className="w-3 h-3" />}
            {isLow && <ArrowDownRight className="w-3 h-3" />}
            {isNormal && <CheckCircle2 className="w-3 h-3" />}
            {isHigh ? 'Elevated' : isLow ? 'Below Range' : 'In Normal Range'}
          </span>
        </div>
      </div>

      {/* Visual Reference Gauge Bar */}
      <div className="mt-4 pt-3 border-t border-[#261d4a]">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5 font-mono">
          <span>Standard Target: <strong className="text-purple-300">{lab.referenceRange}</strong></span>
          <span>Your Reading: <strong className="text-white">{lab.value} {lab.unit}</strong></span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#201844] overflow-hidden relative flex">
          <div className="w-1/4 h-full bg-blue-500/40" title="Low zone" />
          <div className="w-2/4 h-full bg-emerald-500/50" title="Target zone" />
          <div className="w-1/4 h-full bg-red-500/40" title="High zone" />
          {/* Indicator pin */}
          <div
            className={`absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full shadow-xs ${
              isNormal ? 'bg-emerald-400 ring-2 ring-emerald-300/40' : 'bg-red-400 ring-2 ring-red-300/40'
            }`}
            style={{
              left: isNormal ? '50%' : isHigh ? '85%' : '15%',
            }}
          />
        </div>
      </div>

      {/* Plain Language Explanation */}
      <div className="mt-3.5 p-3 rounded-xl bg-[#0e0a20] border border-[#261d4a] text-xs text-neutral-200 leading-relaxed">
        <span className="font-bold text-purple-300 block mb-1">What this means in plain words:</span>
        <p className="text-neutral-300">{lab.plainExplanation}</p>
      </div>

      {/* Clinical Context */}
      <div className="mt-2 text-[11px] text-neutral-400 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span>{lab.clinicalContext}</span>
      </div>
    </div>
  );
};
