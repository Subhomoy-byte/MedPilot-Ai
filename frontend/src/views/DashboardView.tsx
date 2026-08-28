import React, { useState } from 'react';
import { MedicalDocument } from '../types';
import { SafetyBanner } from '../components/SafetyBanner';
import { ScheduleTimeline } from '../components/dashboard/ScheduleTimeline';
import { BiomarkerRadar } from '../components/dashboard/BiomarkerRadar';
import { ConfidenceQualityGauge } from '../components/dashboard/ConfidenceQualityGauge';
import { DoctorQuestionsHub } from '../components/dashboard/DoctorQuestionsHub';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Search, 
  Calendar, 
  ArrowRight, 
  Layers, 
  Activity, 
  Clock, 
  HelpCircle,
  Pill,
  ExternalLink,
  ChevronRight,
  Radio,
  Trash2,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface DashboardViewProps {
  documents: MedicalDocument[];
  onSelectDocument: (doc: MedicalDocument) => void;
  onOpenUpload: () => void;
  onOpenVoice?: (doc: MedicalDocument) => void;
  onDeleteDocument?: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  onSelectDocument,
  onOpenUpload,
  onOpenVoice,
  onDeleteDocument,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'biomarkers' | 'confidence' | 'questions'>('overview');

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.plainSummary.overview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.doctorName && doc.doctorName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Calculate metrics
  const totalMeds = documents.reduce((acc, doc) => acc + doc.medicines.length, 0);
  const totalLabs = documents.reduce((acc, doc) => acc + doc.labs.length, 0);
  const totalInteractions = documents.reduce((acc, doc) => acc + doc.interactions.length, 0);
  const totalUncertainties = documents.reduce(
    (acc, doc) => acc + doc.medicines.filter((m) => m.isLowConfidence).length,
    0
  );

  return (
    <div id="medora-dashboard-view" className="space-y-5 pb-20 text-neutral-100">
      {/* Safety Notice Banner */}
      <SafetyBanner />

      {/* Main Workspace Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-5">
        {/* Clinical Workbench Header (Calm, High-Density, Instructional) */}
        <div className="bg-[#110e24] border border-[#261d48] rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  Clinical Workspace • Active Session
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
                Patient Records & Care Plan Center
              </h1>
              <p className="text-xs text-neutral-300 mt-0.5 max-w-2xl font-sans leading-relaxed">
                {documents.length} document{documents.length !== 1 ? 's' : ''} on file • {totalMeds} active medications •{' '}
                {totalUncertainties > 0 ? (
                  <span className="text-amber-300 font-semibold">
                    {totalUncertainties} handwriting item requires pharmacist review
                  </span>
                ) : (
                  <span className="text-emerald-300 font-semibold">All OCR items verified</span>
                )}
              </p>
            </div>

            {/* Quick Primary Actions */}
            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
              <button
                id="dashboard-upload-btn"
                onClick={onOpenUpload}
                className="px-4 py-2 rounded-xl bg-linear-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#6d28d9] hover:to-[#7e22ce] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          {/* High-Density Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-4 border-t border-[#1e173d]">
            <div className="p-3 rounded-xl bg-[#16122e] border border-[#2b2152] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#251b4c] text-purple-300 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">
                  Documents
                </span>
                <span className="text-base font-bold font-mono text-white">
                  {documents.length}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#16122e] border border-[#2b2152] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#251b4c] text-purple-300 flex items-center justify-center shrink-0">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">
                  Prescriptions
                </span>
                <span className="text-base font-bold font-mono text-white">
                  {totalMeds} active
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#16122e] border border-[#2b2152] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#142928] text-emerald-300 border border-emerald-800/40 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">
                  Lab Biomarkers
                </span>
                <span className="text-base font-bold font-mono text-white">
                  {totalLabs} metrics
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#16122e] border border-[#2b2152] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2e1d1a] text-amber-300 border border-amber-800/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">
                  Safety Review
                </span>
                <span className="text-base font-bold font-mono text-amber-300">
                  {totalInteractions + totalUncertainties} items
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Workspace Navigation Tabs (High Density) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#110e24] border border-[#261d48] rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-[#2b1f59] text-white font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-[#181335]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            <span>Document Feed ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-[#2b1f59] text-white font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-[#181335]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-pink-300" />
            <span>Medication Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('biomarkers')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'biomarkers'
                ? 'bg-[#2b1f59] text-white font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-[#181335]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-300" />
            <span>Biomarker Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('confidence')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'confidence'
                ? 'bg-[#2b1f59] text-white font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-[#181335]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>OCR Fidelity Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'questions'
                ? 'bg-[#2b1f59] text-white font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-[#181335]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
            <span>Doctor Questions Hub</span>
          </button>
        </div>

        {/* Tab 1: Overview & Document Feed */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#110e24] p-3.5 rounded-xl border border-[#261d48]">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by medication, lab test, or physician..."
                  className="w-full pl-9 pr-3 py-2 bg-[#0c0919] border border-[#261d48] focus:border-[#7c3aed] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-hidden"
                />
              </div>

              {/* Type filter chips */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'prescription', label: 'Prescriptions' },
                  { id: 'lab_report', label: 'Labs' },
                  { id: 'discharge_summary', label: 'Discharge' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterType(tab.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      filterType === tab.id
                        ? 'bg-[#7c3aed] text-white font-bold'
                        : 'bg-[#16122e] text-neutral-300 hover:text-white border border-[#281e4d]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Cards Grid (Calm, High Legibility, Tighter Spacing) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => {
                const isNeedsReview = doc.status === 'needs_review' || doc.hasUncertainties;

                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className="bg-[#110e24] rounded-xl border border-[#261d48] hover:border-[#7c3aed] hover:bg-[#15112f] transition-all p-4.5 flex flex-col justify-between space-y-3 cursor-pointer group"
                  >
                    <div className="space-y-2.5">
                      {/* Document Type & Upload Date */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-[#1c1538] text-purple-300 border border-[#37286b]">
                          {doc.type.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{doc.uploadedAt}</span>
                        </div>
                      </div>

                      {/* Document Title */}
                      <h3 className="text-sm font-bold text-white font-display group-hover:text-purple-300 transition-colors leading-snug">
                        {doc.title}
                      </h3>

                      {/* Doctor & Clinic */}
                      <p className="text-[11px] text-neutral-400 font-mono">
                        {doc.doctorName || 'Prescribing Physician'} • {doc.clinicName || 'Clinic'}
                      </p>

                      {/* Overview snippet */}
                      <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                        {doc.plainSummary.overview}
                      </p>

                      {/* Counts */}
                      <div className="flex items-center flex-wrap gap-1.5 pt-1">
                        {doc.medicines.length > 0 && (
                          <span className="px-2 py-0.5 rounded bg-[#1c1538] text-purple-200 border border-[#37286b] text-[10px] font-mono font-medium">
                            {doc.medicines.length} Meds
                          </span>
                        )}
                        {doc.labs.length > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[10px] font-mono font-medium">
                            {doc.labs.length} Labs
                          </span>
                        )}
                        {isNeedsReview && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-700/50 text-[10px] font-mono font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Review Flag
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer with OCR Score & Action */}
                    <div className="pt-2.5 border-t border-[#1e173d] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-neutral-400 text-[11px]">Fidelity:</span>
                        <span
                          className={`font-bold text-[11px] ${
                            doc.overallConfidence >= 90
                              ? 'text-emerald-400'
                              : doc.overallConfidence >= 75
                              ? 'text-purple-300'
                              : 'text-amber-300'
                          }`}
                        >
                          {doc.overallConfidence}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenVoice && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenVoice(doc);
                            }}
                            className="p-1 rounded bg-[#1c1538] border border-[#37286b] text-purple-300 hover:text-white hover:bg-[#2a1e54] cursor-pointer"
                            title="Listen to audio translation"
                          >
                            <Radio className="w-3 h-3" />
                          </button>
                        )}
                        <span className="text-xs font-semibold text-purple-300 group-hover:text-white flex items-center gap-0.5">
                          View Analysis <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Schedule & Daily Medication Regimen */}
        {activeTab === 'schedule' && (
          <ScheduleTimeline documents={documents} onSelectDocument={onSelectDocument} />
        )}

        {/* Tab 3: Biomarkers Visual Range Meters */}
        {activeTab === 'biomarkers' && (
          <BiomarkerRadar documents={documents} onSelectDocument={onSelectDocument} />
        )}

        {/* Tab 4: Optical Fidelity Audit & Disclosed Handwriting */}
        {activeTab === 'confidence' && (
          <ConfidenceQualityGauge documents={documents} onSelectDocument={onSelectDocument} />
        )}

        {/* Tab 5: Doctor Questions Hub */}
        {activeTab === 'questions' && (
          <DoctorQuestionsHub documents={documents} onSelectDocument={onSelectDocument} />
        )}
      </div>
    </div>
  );
};
