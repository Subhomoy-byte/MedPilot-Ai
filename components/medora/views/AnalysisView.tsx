import React, { useState } from 'react';
import { MedicalDocument, LanguageCode } from '../types';
import { ConfidenceMap } from '../components/ConfidenceMap';
import { DocumentViewer } from '../components/DocumentViewer';
import { MedicineCard } from '../components/MedicineCard';
import { LabCard } from '../components/LabCard';
import { InteractionCard } from '../components/InteractionCard';
import { VoicePlayer } from '../components/VoicePlayer';
import { CopilotChat } from '../components/CopilotChat';
import { SafetyBanner } from '../components/SafetyBanner';
import { 
  Sparkles, 
  Volume2, 
  MessageSquare, 
  Pill, 
  Activity, 
  AlertTriangle, 
  ArrowLeft, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Check, 
  Copy,
  Layers,
  Radio
} from 'lucide-react';

interface AnalysisViewProps {
  document: MedicalDocument;
  onBack: () => void;
  selectedLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  document,
  onBack,
  selectedLanguage,
  onLanguageChange,
}) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'medicines' | 'labs' | 'interactions'>('all');
  const [showVoicePlayer, setShowVoicePlayer] = useState<boolean>(true);
  const [highlightedBox, setHighlightedBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleJumpToDocumentBox = (box: { x: number; y: number; width: number; height: number }) => {
    setHighlightedBox(box);
    const el = window.document.getElementById('medora-document-viewer');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `${document.title}\n\nOverview:\n${document.plainSummary.overview}\n\nKey Takeaways:\n${document.plainSummary.keyTakeaways.join('\n')}`;
    navigator.clipboard.writeText(text);
    showToast('Copied full plain-language briefing to clipboard');
  };

  return (
    <div id="medora-analysis-view" className="space-y-6 pb-24 text-neutral-100">
      {/* Toast notification overlay */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1545] text-white px-4 py-3 rounded-xl border border-[#8b5cf6] shadow-2xl shadow-purple-950/60 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Header */}
      <div className="bg-[#120d28]/90 backdrop-blur-md border-b border-[#261d4a] py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-[#2d2259] bg-[#181135] hover:bg-[#22174c] text-purple-200 hover:text-white transition-colors cursor-pointer"
              title="Return to Dashboard"
              aria-label="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-linear-to-r from-purple-950 to-pink-950 border border-purple-800/50 text-[#c084fc] text-[11px] font-bold uppercase tracking-wider font-mono">
                  {document.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {document.uploadedAt}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white font-display mt-0.5">
                {document.title}
              </h1>
              <p className="text-xs text-neutral-400 font-mono">
                {document.doctorName || 'Prescribing Physician'} • {document.clinicName || 'Health Center'}
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              id="analysis-voice-toggle-btn"
              onClick={() => setShowVoicePlayer(!showVoicePlayer)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showVoicePlayer
                  ? 'bg-linear-to-r from-[#8b5cf6] to-[#ec4899] text-white shadow-md shadow-purple-950/40'
                  : 'bg-[#181135] text-purple-200 hover:text-white border border-[#2d2259]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Voice Player</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl border border-[#2d2259] bg-[#181135] hover:bg-[#22174c] text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy plain briefing"
            >
              <Copy className="w-3.5 h-3.5 text-[#c084fc]" />
              <span>Copy Briefing</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl border border-[#2d2259] bg-[#181135] hover:bg-[#22174c] text-purple-200 cursor-pointer"
              title="Print document summary"
              aria-label="Print document summary"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Safety Disclaimer Banner */}
        <SafetyBanner compact />

        {/* Embedded Voice Player (If Toggled) */}
        {showVoicePlayer && (
          <VoicePlayer
            textToRead={document.audioText || document.plainSummary.overview}
            documentTitle={document.title}
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
          />
        )}

        {/* Centerpiece Split Layout: Interactive Confidence Map & Source Document */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Signature Confidence Map (7 Cols on desktop) */}
          <div className="lg:col-span-7 space-y-4">
            <ConfidenceMap
              medicines={document.medicines}
              labs={document.labs}
              interactions={document.interactions}
              selectedEntityId={selectedEntityId}
              onSelectEntity={setSelectedEntityId}
              onJumpToDocumentBox={handleJumpToDocumentBox}
            />
          </div>

          {/* Source Document Viewer (5 Cols on desktop) */}
          <div className="lg:col-span-5 space-y-4">
            <DocumentViewer
              document={document}
              selectedEntityId={selectedEntityId}
              onSelectEntity={setSelectedEntityId}
              highlightedBox={highlightedBox}
            />
          </div>
        </div>

        {/* Plain Language Summary & Action Items Block */}
        <div className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] p-6 sm:p-8 shadow-xl shadow-purple-950/20 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#261d4a]">
            <div>
              <span className="text-xs font-bold uppercase text-[#c084fc] tracking-wider font-mono">
                TRANSLATED PATIENT BRIEFING
              </span>
              <h2 className="text-xl font-bold text-white font-display mt-0.5">
                Plain-Language Overview & Care Plan
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 text-xs font-bold border border-emerald-500/40 font-mono self-start sm:self-auto">
              ✓ Verified Patient-Ready
            </span>
          </div>

          <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-sans">
            {document.plainSummary.overview}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Key Takeaways */}
            <div className="p-4 rounded-xl bg-[#160f33] border border-[#2d2259] space-y-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Key Takeaways
              </h3>
              <ul className="space-y-2 text-xs text-neutral-300">
                {document.plainSummary.keyTakeaways.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div className="p-4 rounded-xl bg-[#160f33] border border-[#2d2259] space-y-2.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5 font-mono">
                <Sparkles className="w-4 h-4 text-[#ec4899]" />
                Next Steps to Take
              </h3>
              <ul className="space-y-2 text-xs text-neutral-300">
                {document.plainSummary.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899] shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Filter Tabs for Extracted Details */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
          <div className="flex items-center bg-[#120d28] p-1 rounded-xl border border-[#2d2259] text-xs font-semibold shadow-lg shadow-purple-950/20">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-[#8b5cf6] text-white' : 'text-purple-200 hover:text-white'
              }`}
            >
              All Findings ({document.medicines.length + document.labs.length + document.interactions.length})
            </button>
            {document.medicines.length > 0 && (
              <button
                onClick={() => setActiveTab('medicines')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'medicines' ? 'bg-[#8b5cf6] text-white' : 'text-purple-200 hover:text-white'
                }`}
              >
                Medications ({document.medicines.length})
              </button>
            )}
            {document.labs.length > 0 && (
              <button
                onClick={() => setActiveTab('labs')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'labs' ? 'bg-[#8b5cf6] text-white' : 'text-purple-200 hover:text-white'
                }`}
              >
                Lab Tests ({document.labs.length})
              </button>
            )}
            {document.interactions.length > 0 && (
              <button
                onClick={() => setActiveTab('interactions')}
                className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'interactions' ? 'bg-linear-to-r from-[#ef4444] to-[#f43f5e] text-white' : 'text-purple-200 hover:text-white'
                }`}
              >
                Clinician Questions ({document.interactions.length})
              </button>
            )}
          </div>
        </div>

        {/* Detailed Cards Section */}
        <div className="space-y-6">
          {/* Flagged Interaction & Safety Discussion Cards */}
          {(activeTab === 'all' || activeTab === 'interactions') && document.interactions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Questions to Discuss With Your Doctor or Pharmacist ({document.interactions.length})
                </h3>
                <span className="text-xs text-neutral-400 font-medium hidden sm:inline font-mono">
                  • Non-diagnostic safety questions for your next appointment
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {document.interactions.map((int) => (
                  <InteractionCard
                    key={int.id}
                    interaction={int}
                    onAskDoctor={() => {
                      navigator.clipboard?.writeText(int.doctorQuestionPrompt);
                      showToast('Copied question prompt for your appointment!');
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Medications Section */}
          {(activeTab === 'all' || activeTab === 'medicines') && document.medicines.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-display">
                    Prescribed Medications ({document.medicines.length})
                  </h3>
                  <span className="text-xs text-neutral-400 hidden sm:inline font-mono">
                    • Select any card to inspect bounding box and OCR score
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {document.medicines.map((med) => (
                  <MedicineCard
                    key={med.id}
                    medicine={med}
                    isSelected={selectedEntityId === med.id}
                    onSelect={() => {
                      setSelectedEntityId(selectedEntityId === med.id ? null : med.id);
                      if (med.boundingBox) {
                        handleJumpToDocumentBox(med.boundingBox);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Lab Tests Section */}
          {(activeTab === 'all' || activeTab === 'labs') && document.labs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Extracted Lab Biomarkers ({document.labs.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {document.labs.map((lab) => (
                  <LabCard
                    key={lab.id}
                    lab={lab}
                    isSelected={selectedEntityId === lab.id}
                    onSelect={() => {
                      setSelectedEntityId(selectedEntityId === lab.id ? null : lab.id);
                      if (lab.boundingBox) {
                        handleJumpToDocumentBox(lab.boundingBox);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Copilot Q&A Box */}
        <div className="pt-4">
          <CopilotChat document={document} />
        </div>
      </div>
    </div>
  );
};
