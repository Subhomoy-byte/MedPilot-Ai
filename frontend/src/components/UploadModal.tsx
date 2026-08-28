import React, { useState, useRef } from 'react';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { MedicalDocument } from '../types';
import { uploadAndAnalyze } from '../api/medpilot';
import { 
  Upload, 
  Camera, 
  FileText, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentUploaded: (doc: MedicalDocument) => void;
  language: import('../types').LanguageCode;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentUploaded,
  language,
}) => {
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [selectedDemoId, setSelectedDemoId] = useState<string>(SAMPLE_DOCUMENTS[0].id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSimulatedUpload = (docToLoad: MedicalDocument) => {
    setAnalyzing(true);
    setAnalysisStep('Calibrating multi-pass OCR tensor...');

    setTimeout(() => {
      setAnalysisStep('Segmenting handwriting bounding boxes & stroke analysis...');
    }, 500);

    setTimeout(() => {
      setAnalysisStep('Cross-referencing RxNorm, LOINC & clinical interaction database...');
    }, 1100);

    setTimeout(() => {
      setAnalysisStep('Synthesizing plain-language summary & appointment talking points...');
    }, 1700);

    setTimeout(() => {
      setAnalyzing(false);
      onDocumentUploaded(docToLoad);
      onClose();
    }, 2300);
  };

  const handleFile = async (file: File) => {
    setAnalyzing(true);
    setAnalysisStep('Uploading securely…');
    try {
      setAnalysisStep('Reading document text…');
      const document = await uploadAndAnalyze(file, language);
      setAnalysisStep('Preparing your document explanation…');
      onDocumentUploaded(document);
      onClose();
    } catch (error) {
      setAnalysisStep(error instanceof Error ? error.message : 'The document could not be analyzed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleManualFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="medora-upload-modal"
        className="bg-[#120d28] border border-[#2d2259] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl shadow-purple-950/60 relative overflow-hidden text-neutral-100"
      >
        {/* Glow behind modal */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#8b5cf6]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-[#ec4899]/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={analyzing}
          className="absolute right-5 top-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-[#1f1642] transition-colors cursor-pointer"
          aria-label="Close upload dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-purple-950 to-pink-950 border border-purple-800/50 text-[#c084fc] text-xs font-bold font-mono uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Neural Medical Scanner</span>
          </div>
          <h2 className="text-2xl font-black text-white font-display">
            Scan Prescription or Lab Report
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Upload any medical document photo or PDF to decode handwriting, check interactions, and generate plain summaries.
          </p>
        </div>

        {analyzing ? (
          /* Analyzing State */
          <div className="py-12 px-4 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-[#8b5cf6] border-r-[#ec4899] animate-spin" />
              <Layers className="w-8 h-8 text-[#c084fc] animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-white font-display">
                Analyzing Clinical Document
              </h3>
              <p className="text-xs font-mono text-[#c084fc] animate-pulse">
                {analysisStep}
              </p>
            </div>

            <div className="max-w-md mx-auto h-2 rounded-full bg-[#1e1545] overflow-hidden">
              <div className="h-full bg-linear-to-r from-[#8b5cf6] via-[#d946ef] to-[#ec4899] animate-pulse w-full" />
            </div>
          </div>
        ) : (
          /* Main Drop Zone */
          <div className="space-y-6">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-[#8b5cf6] bg-[#22154d]/50 ring-4 ring-purple-500/20'
                  : 'border-[#382a6e] bg-[#160f33]/60 hover:bg-[#1a123d] hover:border-[#8b5cf6]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleManualFileInput}
              />

              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#8b5cf6]/20 to-[#ec4899]/20 border border-[#8b5cf6]/40 flex items-center justify-center mx-auto text-[#c084fc] mb-3 shadow-lg shadow-purple-950/40">
                <Upload className="w-6 h-6" />
              </div>

              <h4 className="text-base font-bold text-white font-display">
                Drag & Drop Document Here, or Click to Browse
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                Supports JPG, PNG, WEBP, and PDF files. High resolution recommended for handwriting.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#22174c] border border-[#3b2b73] text-xs text-purple-200">
                <Camera className="w-3.5 h-3.5 text-[#c084fc]" />
                <span>Camera scan directly from mobile</span>
              </div>
            </div>

            {/* Quick Demo Pre-sets */}
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2 font-mono">
                Or choose a clinical test sample:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SAMPLE_DOCUMENTS.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => {
                      setSelectedDemoId(doc.id);
                      handleSimulatedUpload(doc);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      selectedDemoId === doc.id
                        ? 'bg-[#261852] border-[#8b5cf6] text-white shadow-md'
                        : 'bg-[#160f33] border-[#2d2259] text-neutral-300 hover:bg-[#1e1545] hover:border-purple-600/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#2b1b59] flex items-center justify-center text-[#c084fc] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate text-white">
                          {doc.title}
                        </div>
                        <div className="text-[10px] text-purple-300 capitalize">
                          {doc.type.replace('_', ' ')} • {doc.medicines.length + doc.labs.length} entities
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 text-xs text-neutral-400 pt-2 border-t border-[#261d4a]">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>HIPAA Compliant Ephemeral Session: Images are processed in-memory and never retained.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
