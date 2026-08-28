import React, { useState } from 'react';
import { MedicineEntity } from '../types';
import { Pill, Clock, Utensils, AlertTriangle, CheckCircle2, Copy, Check, Sparkles } from 'lucide-react';

interface MedicineCardProps {
  medicine: MedicineEntity;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  isSelected = false,
  onSelect,
}) => {
  const isLowConf = medicine.isLowConfidence || medicine.ocrConfidence < 75;
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyInstructions = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${medicine.name} (${medicine.strength}): ${medicine.instructions}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`med-card-${medicine.id}`}
      onClick={onSelect}
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 cursor-pointer relative ${
        isSelected
          ? 'bg-[#1e1545] border-[#8b5cf6] shadow-lg shadow-[#8b5cf6]/20 ring-2 ring-[#8b5cf6]/40'
          : isLowConf
          ? 'bg-[#1c1424] border-amber-500/40 hover:border-amber-400 hover:shadow-md'
          : 'bg-[#120d28]/80 backdrop-blur-xs border-[#2d2259] hover:border-[#8b5cf6]/60 hover:bg-[#181135] hover:shadow-md'
      }`}
    >
      {/* Header with Title and Confidence */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isLowConf
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                : 'bg-linear-to-br from-[#8b5cf6]/20 to-[#ec4899]/20 text-[#c084fc] border border-[#8b5cf6]/30'
            }`}
          >
            {isLowConf ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <Pill className="w-5 h-5 text-[#c084fc]" />
            )}
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h4 className="text-base font-bold text-white font-display">
                {medicine.name}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-[#241a4a] text-purple-200 text-xs font-semibold border border-purple-800/40 font-mono">
                {medicine.strength}
              </span>
              {medicine.genericName && (
                <span className="text-xs text-neutral-400 italic">
                  ({medicine.genericName})
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {medicine.dosageForm}
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="shrink-0">
          {isLowConf ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{medicine.ocrConfidence}% OCR</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{medicine.ocrConfidence}% OCR</span>
            </div>
          )}
        </div>
      </div>

      {/* Uncertainty Notice if Low Confidence */}
      {isLowConf && medicine.uncertaintyReason && (
        <div className="mt-3.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5 text-amber-300">Disclosed Handwriting Ambiguity:</span>
            <p className="leading-relaxed text-amber-200/90">{medicine.uncertaintyReason}</p>
          </div>
        </div>
      )}

      {/* Plain Language Purpose */}
      <div className="mt-3.5 pt-3 border-t border-[#261d4a]">
        <div className="flex items-start gap-2 text-xs text-neutral-300 leading-relaxed">
          <span className="font-bold text-[#c084fc] shrink-0">Why prescribed:</span>
          <span>{medicine.purpose}</span>
        </div>
      </div>

      {/* Instructions & Schedule Pills */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1a1338] border border-[#2d2259] text-neutral-300">
          <Clock className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
          <span className="font-medium truncate">{medicine.frequency}</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#1a1338] border border-[#2d2259] text-neutral-300">
          <Utensils className="w-3.5 h-3.5 text-[#fb7185] shrink-0" />
          <span className="font-medium truncate">
            {medicine.withFood === 'with_food'
              ? 'Take with food/meal'
              : medicine.withFood === 'empty_stomach'
              ? 'Take on empty stomach'
              : 'Take with or without food'}
          </span>
        </div>
      </div>

      {/* Full Plain-Language Instruction Box */}
      <div className="mt-3 p-3 rounded-xl bg-[#0e0a20] border border-[#261d4a] text-xs text-neutral-200 flex items-start justify-between gap-2">
        <div>
          <span className="font-semibold text-purple-300 block mb-0.5">Instructions:</span>
          <p className="leading-relaxed text-neutral-300">{medicine.instructions}</p>
        </div>
        <button
          onClick={handleCopyInstructions}
          className="p-1 text-neutral-400 hover:text-[#c084fc] shrink-0 cursor-pointer"
          title="Copy instructions"
          aria-label="Copy instructions"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Raw OCR snippet */}
      <div className="mt-3 pt-2 text-[11px] text-neutral-500 font-mono flex items-center justify-between border-t border-[#261d4a]">
        <span className="truncate max-w-[280px]">OCR Text: "{medicine.rawOcrText}"</span>
        <span className="text-[#a78bfa] hover:text-[#c084fc] shrink-0 font-sans font-semibold">Inspect bounding box</span>
      </div>
    </div>
  );
};
