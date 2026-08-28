import React from 'react';
import { InteractionAlert } from '../types';
import { AlertTriangle, MessageSquare, HelpCircle, ArrowRight, ShieldAlert } from 'lucide-react';

interface InteractionCardProps {
  interaction: InteractionAlert;
  onAskDoctor?: () => void;
}

export const InteractionCard: React.FC<InteractionCardProps> = ({
  interaction,
  onAskDoctor,
}) => {
  const isHighSeverity = interaction.severity === 'high';

  return (
    <div
      id={`interaction-${interaction.id}`}
      className={`rounded-2xl border p-4 sm:p-5 relative transition-all duration-200 ${
        isHighSeverity
          ? 'bg-[#221020] border-red-500/40 shadow-lg shadow-red-950/20'
          : 'bg-[#1e1328] border-amber-500/40 shadow-md shadow-amber-950/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isHighSeverity
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}
        >
          {isHighSeverity ? (
            <ShieldAlert className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-sm sm:text-base font-bold text-white font-display">
              {interaction.title}
            </h4>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
                isHighSeverity
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {interaction.severity} Priority
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-xs text-purple-300 font-mono">
            <span>Involves:</span>
            <span className="font-semibold text-white">
              {interaction.entityNames.join(' + ')}
            </span>
          </div>

          {/* Description */}
          <p className="mt-2.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {interaction.description || interaction.plainSummary}
          </p>

          {/* Doctor Discussion Box */}
          <div className="mt-3.5 p-3.5 rounded-xl bg-[#0e0a1e] border border-purple-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#c084fc]">
              <MessageSquare className="w-4 h-4" />
              <span>Recommended Question for Your Next Appointment:</span>
            </div>
            <p className="text-xs text-purple-100 italic bg-[#171033] p-2.5 rounded-lg border border-purple-800/40 leading-relaxed">
              "{interaction.doctorQuestionPrompt}"
            </p>
          </div>

          {/* Clinician Action Recommendation */}
          <div className="mt-3 text-xs text-neutral-400 flex items-center justify-between flex-wrap gap-2">
            <span>Action: <strong className="text-neutral-200">{interaction.actionableAdvice || interaction.rationale}</strong></span>
            {onAskDoctor && (
              <button
                onClick={onAskDoctor}
                className="inline-flex items-center gap-1 text-[#c084fc] hover:text-white font-bold text-xs cursor-pointer transition-colors"
              >
                <span>Copy for Doctor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
