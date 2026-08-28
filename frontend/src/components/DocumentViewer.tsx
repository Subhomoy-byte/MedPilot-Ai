import React, { useState } from 'react';
import { MedicalDocument } from '../types';
import { FileText, Eye, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, CheckCircle2, Sparkles, Layers } from 'lucide-react';

interface DocumentViewerProps {
  document: MedicalDocument;
  selectedEntityId?: string | null;
  onSelectEntity?: (id: string | null) => void;
  highlightedBox?: { x: number; y: number; width: number; height: number } | null;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  selectedEntityId,
  onSelectEntity,
  highlightedBox,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [showRawOcr, setShowRawOcr] = useState<boolean>(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 60));
  const handleResetZoom = () => setZoom(100);

  return (
    <div
      id="medora-document-viewer"
      className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] overflow-hidden shadow-xl shadow-purple-950/20 flex flex-col"
    >
      {/* Header with Viewer Tools */}
      <div className="p-3.5 sm:p-4 bg-[#181135] border-b border-[#261d4a] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#8b5cf6]/20 to-[#ec4899]/20 border border-[#8b5cf6]/30 flex items-center justify-center text-[#c084fc]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white font-display">
              Original Clinical Source
            </h3>
            <span className="text-[11px] text-neutral-400 font-mono">
              OCR Fidelity Score: <strong className="text-purple-300">{document.overallConfidence}%</strong>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showBoundingBoxes
                ? 'bg-purple-900/60 text-purple-200 border border-purple-600/50'
                : 'bg-[#1e1545] text-neutral-400 border border-[#2d2259] hover:text-white'
            }`}
            title="Toggle OCR entity bounding boxes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bounding Boxes</span>
          </button>

          <button
            onClick={() => setShowRawOcr(!showRawOcr)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showRawOcr
                ? 'bg-purple-900/60 text-purple-200 border border-purple-600/50'
                : 'bg-[#1e1545] text-neutral-400 border border-[#2d2259] hover:text-white'
            }`}
            title="View Raw OCR Stream"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Raw OCR</span>
          </button>

          {/* Zoom buttons */}
          <div className="flex items-center bg-[#1e1545] rounded-lg border border-[#2d2259] p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-purple-200 px-1.5 min-w-[40px] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 text-neutral-400 hover:text-white border-l border-[#2d2259] cursor-pointer"
              title="Reset zoom"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative bg-[#0b0818] min-h-[380px] max-h-[540px] overflow-auto flex items-center justify-center p-4">
        {showRawOcr ? (
          <div className="w-full h-full bg-[#080512] rounded-xl p-4 font-mono text-xs text-purple-300 space-y-3 overflow-auto border border-[#261d4a]">
            <div className="flex items-center justify-between text-neutral-500 pb-2 border-b border-[#261d4a]">
              <span>[RAW OCR STREAM TRACE]</span>
              <span>Tokens: {(document.rawOcrTokens || []).length}</span>
            </div>
            <div className="space-y-1.5">
              {(document.rawOcrTokens || []).map((token, idx) => (
                <div key={idx} className="flex items-center justify-between hover:bg-[#1a1236] p-1 rounded">
                  <span className="text-neutral-200">"{token.text}"</span>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 text-[10px]">
                      [{token.boundingBox.x},{token.boundingBox.y},{token.boundingBox.width}x{token.boundingBox.height}]
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        token.confidence >= 90
                          ? 'text-emerald-400'
                          : token.confidence >= 75
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }`}
                    >
                      {token.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="relative transition-transform duration-200 origin-top shadow-2xl rounded-lg bg-[#140e2e] border border-[#37286b] p-6 max-w-full text-neutral-200"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {/* Simulated Rx Header inside paper */}
            <div className="border-b border-[#2d2259] pb-4 mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold font-mono text-[#c084fc] uppercase tracking-wider">
                  {document.clinicName || 'ST. JUDE CLINICAL MEDICAL CARE'}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  Physician: {document.doctorName || 'Dr. Eleanor Vance, MD (Cardiology)'}
                </div>
              </div>
              <div className="text-right font-mono text-[10px] text-neutral-400">
                <div>DATE: {document.uploadedAt}</div>
                <div className="text-[#a78bfa]">RX #849204-A</div>
              </div>
            </div>

            {/* Document Content Text with simulated handwritten styling */}
            <div className="space-y-4 py-2 font-mono text-xs leading-relaxed text-neutral-300">
              <div className="text-neutral-400 text-[11px]">
                Patient: <span className="text-white font-bold">John Doe</span> (DOB: 11/14/1962)
              </div>

              <div className="space-y-3 pt-2">
                {document.medicines.map((med, idx) => {
                  const isSelected = selectedEntityId === med.id;
                  return (
                    <div
                      key={med.id}
                      onClick={() => onSelectEntity && onSelectEntity(med.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2a1b5c] border-[#8b5cf6] text-white shadow-md'
                          : 'bg-[#181138]/60 border-[#2b1e57] hover:border-[#8b5cf6]/60 hover:bg-[#1e1547]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          {idx + 1}. {med.name} {med.strength}
                        </span>
                        <span className="text-[10px] font-bold text-[#c084fc]">
                          {med.ocrConfidence}% Conf
                        </span>
                      </div>
                      <div className="text-neutral-400 text-[11px] mt-0.5 font-sans">
                        Sig: {med.instructions} ({med.frequency})
                      </div>
                    </div>
                  );
                })}

                {document.labs.map((lab, idx) => {
                  const isSelected = selectedEntityId === lab.id;
                  return (
                    <div
                      key={lab.id}
                      onClick={() => onSelectEntity && onSelectEntity(lab.id)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2a1b5c] border-[#8b5cf6] text-white shadow-md'
                          : 'bg-[#181138]/60 border-[#2b1e57] hover:border-[#8b5cf6]/60 hover:bg-[#1e1547]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          • {lab.name}
                        </span>
                        <span className="text-purple-300 font-bold">
                          {lab.value} {lab.unit}
                        </span>
                      </div>
                      <div className="text-neutral-400 text-[11px] mt-0.5 font-sans">
                        Ref: {lab.referenceRange} (Status: {lab.status})
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Physician Signature Line */}
              <div className="pt-8 flex items-end justify-between border-t border-[#261d4a]">
                <div className="text-[10px] text-neutral-500">
                  SECURITY DISCLOSURE: OCR Optical Verification Active
                </div>
                <div className="text-right">
                  <div className="font-serif italic text-sm text-[#c084fc] font-bold">
                    E. Vance MD
                  </div>
                  <div className="w-32 border-t border-neutral-600 mt-1" />
                  <div className="text-[10px] text-neutral-500">DEA / NPI Verified</div>
                </div>
              </div>
            </div>

            {/* Bounding box overlays */}
            {showBoundingBoxes && highlightedBox && (
              <div
                className="absolute border-2 border-[#ec4899] bg-[#ec4899]/20 rounded transition-all duration-300 pointer-events-none"
                style={{
                  left: `${highlightedBox.x}%`,
                  top: `${highlightedBox.y}%`,
                  width: `${highlightedBox.width}%`,
                  height: `${highlightedBox.height}%`,
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer info banner */}
      <div className="p-3 bg-[#181135] border-t border-[#261d4a] flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Multi-pass vision parsing with handwriting disambiguation</span>
        </div>
        <span className="font-mono text-purple-300 text-[11px]">HIPAA Safe Ephemeral Processing</span>
      </div>
    </div>
  );
};
