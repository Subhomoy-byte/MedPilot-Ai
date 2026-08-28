import React from 'react';
import { MedicalDocument, LanguageCode } from '../types';
import { VoicePlayer } from '../components/VoicePlayer';
import { Volume2, FileText, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, ShieldCheck, Radio, ArrowRight } from 'lucide-react';

interface VoiceViewProps {
  documents: MedicalDocument[];
  activeDocument: MedicalDocument | null;
  onSelectDocument: (doc: MedicalDocument) => void;
  selectedLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onOpenAnalysis: () => void;
}

export const VoiceView: React.FC<VoiceViewProps> = ({
  documents,
  activeDocument,
  onSelectDocument,
  selectedLanguage,
  onLanguageChange,
  onOpenAnalysis,
}) => {
  const currentDoc = activeDocument || documents[0];

  if (!currentDoc) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4 text-neutral-100">
        <div className="w-16 h-16 rounded-full bg-[#1e1545] border border-[#2d2259] flex items-center justify-center mx-auto text-[#c084fc]">
          <Volume2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-display">
          No document loaded
        </h2>
        <p className="text-xs text-neutral-400">
          Please upload or choose a medical record to start listening to the voice guide.
        </p>
      </div>
    );
  }

  const currentIndex = documents.findIndex((d) => d.id === currentDoc.id);

  return (
    <div id="medora-voice-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-20 text-neutral-100">
      {/* Top Controls & Document Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#120d28]/90 backdrop-blur-xs p-4 rounded-2xl border border-[#2d2259] shadow-xl shadow-purple-950/20">
        <div>
          <span className="text-[11px] font-bold text-[#c084fc] uppercase tracking-wider font-mono">
            VOICE MODE CONSOLE
          </span>
          <h1 className="text-lg font-bold text-white font-display">
            {currentDoc.title}
          </h1>
          <p className="text-xs text-neutral-400 font-mono">
            {currentDoc.doctorName || 'Prescribing Physician'} • {currentDoc.uploadedAt}
          </p>
        </div>

        {/* Previous / Next Document Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            disabled={currentIndex <= 0}
            onClick={() => onSelectDocument(documents[currentIndex - 1])}
            className="p-2 rounded-xl border border-[#2d2259] bg-[#181135] hover:bg-[#22174c] disabled:opacity-30 text-purple-200 hover:text-white transition-colors cursor-pointer"
            title="Previous document"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-purple-200 font-mono px-2">
            {currentIndex + 1} of {documents.length}
          </span>
          <button
            disabled={currentIndex >= documents.length - 1}
            onClick={() => onSelectDocument(documents[currentIndex + 1])}
            className="p-2 rounded-xl border border-[#2d2259] bg-[#181135] hover:bg-[#22174c] disabled:opacity-30 text-purple-200 hover:text-white transition-colors cursor-pointer"
            title="Next document"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Voice Player */}
      <VoicePlayer
        textToRead={currentDoc.audioText || currentDoc.plainSummary.overview}
        documentTitle={currentDoc.title}
        selectedLanguage={selectedLanguage}
        onLanguageChange={onLanguageChange}
      />

      {/* Large-Print Plain Language Script Display */}
      <div className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] p-6 sm:p-8 shadow-xl shadow-purple-950/20 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#261d4a]">
          <h2 className="text-lg sm:text-xl font-bold text-white font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#c084fc]" />
            Large-Print Spoken Script
          </h2>
          <button
            onClick={onOpenAnalysis}
            className="text-xs font-bold text-[#c084fc] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Switch to Visual Confidence Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* High Legibility Large Text */}
        <div className="space-y-4 text-base sm:text-lg text-neutral-200 leading-relaxed font-medium">
          <p className="bg-[#181135] p-5 rounded-2xl border border-[#2d2259] text-purple-100">
            {currentDoc.audioText}
          </p>

          <div className="pt-2 space-y-3">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono">
              Key Action Summary:
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {currentDoc.plainSummary.keyTakeaways.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-[#160f33] border border-[#2d2259] text-sm font-medium text-neutral-200"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety Note */}
        <div className="p-3.5 bg-[#0e0922] border border-[#261d4a] text-neutral-300 rounded-xl text-xs flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Spoken narration reflects extracted text. Always verify unclear doses with your pharmacist.
          </span>
        </div>
      </div>
    </div>
  );
};
