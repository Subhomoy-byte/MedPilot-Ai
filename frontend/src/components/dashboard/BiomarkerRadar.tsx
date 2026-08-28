import React, { useState } from 'react';
import { MedicalDocument, LabTestEntity } from '../../types';
import { Activity, AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight, Info, HelpCircle, ChevronRight } from 'lucide-react';

interface BiomarkerRadarProps {
  documents: MedicalDocument[];
  onSelectDocument: (doc: MedicalDocument) => void;
}

export const BiomarkerRadar: React.FC<BiomarkerRadarProps> = ({
  documents,
  onSelectDocument,
}) => {
  // Aggregate all lab tests from documents
  const allLabs: { lab: LabTestEntity; doc: MedicalDocument }[] = [];
  documents.forEach((doc) => {
    doc.labs.forEach((lab) => {
      allLabs.push({ lab, doc });
    });
  });

  const [selectedLabId, setSelectedLabId] = useState<string>(allLabs[0]?.lab.id || '');

  const activeLabItem = allLabs.find(({ lab }) => lab.id === selectedLabId) || allLabs[0];

  const getBiomarkerMeterProps = (lab: LabTestEntity) => {
    const numVal = typeof lab.value === 'number' ? lab.value : parseFloat(String(lab.value));
    
    let min = 0;
    let max = 200;
    let refLow = 70;
    let refHigh = 110;

    const name = lab.name.toLowerCase();
    if (name.includes('glucose')) {
      min = 50;
      max = 200;
      refLow = 70;
      refHigh = 99;
    } else if (name.includes('a1c')) {
      min = 4.0;
      max = 12.0;
      refLow = 4.0;
      refHigh = 5.6;
    } else if (name.includes('egfr') || name.includes('filtration')) {
      min = 15;
      max = 120;
      refLow = 60;
      refHigh = 120;
    } else if (name.includes('cholesterol') || name.includes('lipid')) {
      min = 100;
      max = 300;
      refLow = 125;
      refHigh = 200;
    } else if (name.includes('potassium')) {
      min = 2.5;
      max = 6.5;
      refLow = 3.5;
      refHigh = 5.1;
    }

    const clampedVal = Math.min(Math.max(numVal, min), max);
    const valuePercent = ((clampedVal - min) / (max - min)) * 100;
    const refLowPercent = ((refLow - min) / (max - min)) * 100;
    const refHighPercent = ((refHigh - min) / (max - min)) * 100;

    return {
      numVal,
      valuePercent: Math.round(valuePercent),
      refLowPercent: Math.round(refLowPercent),
      refHighPercent: Math.round(refHighPercent),
      refLow,
      refHigh,
      min,
      max,
    };
  };

  return (
    <div id="medora-biomarker-radar" className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] p-5 sm:p-7 shadow-xl shadow-purple-950/20 space-y-6">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[#261d4a]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>METABOLIC & LAB PANELS</span>
          </div>
          <h3 className="text-xl font-extrabold text-white font-display">
            Biomarker Visual Range Meters
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400">
            Translates numerical lab values into clear visual safety zones (Normal vs High vs Low).
          </p>
        </div>

        <span className="text-xs font-bold text-purple-200 bg-[#241a4a] border border-purple-800/40 px-3 py-1.5 rounded-lg self-start sm:self-auto font-mono">
          {allLabs.length} Biomarkers Tracked
        </span>
      </div>

      {allLabs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Biomarkers List / Gauge Bars (Left Column) */}
          <div className="lg:col-span-7 space-y-3.5">
            {allLabs.map(({ lab, doc }) => {
              const meter = getBiomarkerMeterProps(lab);
              const isSelected = selectedLabId === lab.id;
              const isHigh = lab.status === 'high';
              const isLow = lab.status === 'low';
              const isNormal = lab.status === 'normal';

              return (
                <div
                  key={lab.id}
                  onClick={() => setSelectedLabId(lab.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#8b5cf6] bg-[#22164a] shadow-lg ring-1 ring-[#8b5cf6]'
                      : 'border-[#281d4e] bg-[#160f33] hover:bg-[#1a123d] hover:border-purple-600/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-white font-display">
                        {lab.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a1c57] text-purple-200 font-mono">
                        {lab.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-extrabold font-mono text-xs sm:text-sm text-white">
                        {lab.value} <span className="text-[11px] text-purple-300 font-sans">{lab.unit}</span>
                      </span>
                      {isHigh ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-950/60 text-red-300 border border-red-500/40 text-[10px] font-bold flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          High
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-500/40 text-[10px] font-bold flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" />
                          Low
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          Normal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Range Bar */}
                  <div className="space-y-1">
                    <div className="relative h-4 bg-[#0d091e] rounded-full overflow-hidden border border-[#2a1d52]">
                      {/* Normal Range Target Zone */}
                      <div
                        className="absolute top-0 bottom-0 bg-[#10b981]/25 border-x border-[#10b981]/60"
                        style={{
                          left: `${meter.refLowPercent}%`,
                          width: `${Math.max(meter.refHighPercent - meter.refLowPercent, 8)}%`,
                        }}
                        title={`Target Normal Range: ${lab.referenceRange}`}
                      />

                      {/* Actual Value Needle Marker */}
                      <div
                        className={`absolute top-0 bottom-0 w-2.5 rounded-full shadow-sm transform -translate-x-1/2 transition-all duration-500 ${
                          isHigh
                            ? 'bg-[#ef4444] ring-2 ring-red-400'
                            : isLow
                            ? 'bg-[#3b82f6] ring-2 ring-blue-400'
                            : 'bg-[#10b981] ring-2 ring-emerald-400'
                        }`}
                        style={{ left: `${Math.max(Math.min(meter.valuePercent, 96), 4)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>Low ({meter.min})</span>
                      <span className="text-emerald-400 font-bold">Standard Target: {lab.referenceRange}</span>
                      <span>High ({meter.max})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Biomarker Deep Explanation Panel (Right Column) */}
          <div className="lg:col-span-5 bg-[#160f33] rounded-xl border border-[#2d2259] p-5 flex flex-col justify-between space-y-4">
            {activeLabItem ? (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-[#261d4a]">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
                      Selected Biomarker
                    </span>
                    <h4 className="text-base font-bold text-white font-display">
                      {activeLabItem.lab.name}
                    </h4>
                  </div>
                  <span className="text-lg font-black font-mono text-[#c084fc]">
                    {activeLabItem.lab.value} <span className="text-xs text-purple-300">{activeLabItem.lab.unit}</span>
                  </span>
                </div>

                {/* Plain-Language Explanation */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-200 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-[#c084fc]" />
                    What this means for you:
                  </span>
                  <p className="text-xs text-neutral-200 bg-[#0e0922] p-3 rounded-lg border border-[#281d4e] leading-relaxed">
                    {activeLabItem.lab.plainExplanation}
                  </p>
                </div>

                {/* Clinical Context */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-200">
                    Clinical Background:
                  </span>
                  <p className="text-[11px] text-purple-200/90 leading-relaxed bg-[#1b123d] p-2.5 rounded-lg border border-purple-900/40">
                    {activeLabItem.lab.clinicalContext}
                  </p>
                </div>

                {/* Doc Reference */}
                <div className="flex items-center justify-between text-xs pt-2 text-neutral-400">
                  <span>Source: {activeLabItem.doc.title}</span>
                  <button
                    onClick={() => onSelectDocument(activeLabItem.doc)}
                    className="text-[#c084fc] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    Open Document <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-neutral-400 py-10">
                Select a biomarker to view clinical explanation.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center bg-[#160f33] rounded-xl border border-dashed border-[#2d2259]">
          <Activity className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
          <p className="text-xs text-neutral-400 font-medium">
            No lab panels uploaded yet. Upload a blood panel or metabolic test to see visual range meters.
          </p>
        </div>
      )}
    </div>
  );
};
