import React, { useState } from 'react';
import { MedicalDocument } from '../types';
import { 
  History, 
  FileText, 
  Calendar, 
  Search, 
  Download, 
  ArrowRight, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Check, 
  Plus,
  Sparkles
} from 'lucide-react';

interface HistoryViewProps {
  documents: MedicalDocument[];
  onSelectDocument: (doc: MedicalDocument) => void;
  onDeleteDocument: (id: string) => void;
  onOpenUpload: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  documents,
  onSelectDocument,
  onDeleteDocument,
  onOpenUpload,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedExport, setCopiedExport] = useState<boolean>(false);

  const filtered = documents.filter((doc) => {
    return (
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.doctorName && doc.doctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.clinicName && doc.clinicName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const exportAllSummaries = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(documents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `medora_medical_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  return (
    <div id="medora-history-view" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-20 text-neutral-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#120d28]/90 backdrop-blur-xs p-6 rounded-2xl border border-[#2d2259] shadow-xl shadow-purple-950/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono">
              Audit & Record Timeline
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white font-display mt-1">
            Prescription & Lab History
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5 font-sans">
            Chronological audit log of analyzed prescriptions, lab panels, and patient translations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={exportAllSummaries}
            className="px-4 py-2.5 rounded-xl border border-[#2d2259] bg-[#181135] hover:bg-[#22174c] text-xs font-bold text-purple-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-[#c084fc]" />}
            <span>{copiedExport ? 'Exported JSON' : 'Export Records'}</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-4 py-2.5 rounded-xl bg-linear-to-r from-[#8b5cf6] to-[#ec4899] hover:from-[#7c3aed] hover:to-[#db2777] text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-purple-950/40 cursor-pointer"
          >
            + Upload New
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by physician, test, or medication..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0e0a20] border border-[#2d2259] focus:border-[#8b5cf6] rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-hidden"
        />
      </div>

      {/* Timeline List or Empty State */}
      {filtered.length > 0 ? (
        <div className="space-y-3.5">
          {filtered.map((doc) => {
            const isNeedsReview = doc.status === 'needs_review' || doc.hasUncertainties;

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] hover:border-[#8b5cf6] hover:bg-[#181135] shadow-xl shadow-purple-950/20 transition-all p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#22164a] border border-[#342468] text-white flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#c084fc]" />
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#241a4a] text-purple-200 border border-purple-800/40 text-[10px] font-bold uppercase tracking-wider font-mono">
                        {doc.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {doc.uploadedAt}
                      </span>
                      {isNeedsReview ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 font-mono">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Needs Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Verified
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white font-display mt-1 group-hover:text-[#c084fc] transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                      {doc.doctorName || 'Prescribing Physician'} • {doc.clinicName || 'Clinic'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-mono font-bold text-purple-300 hidden md:inline">
                    {doc.overallConfidence}% OCR
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDocument(doc);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Re-open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(doc.id);
                    }}
                    className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-[#120d28] rounded-2xl border border-dashed border-[#2d2259] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1e1545] text-purple-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">
              No records in history
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
              {searchTerm ? 'No items match your search term.' : 'Uploaded and analyzed medical documents will automatically be archived here.'}
            </p>
          </div>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 rounded-xl border border-[#2d2259] bg-[#181135] text-xs font-bold text-purple-200 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Search</span>
            </button>
          ) : (
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-[#8b5cf6] to-[#ec4899] text-white text-xs font-bold hover:from-[#7c3aed] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
