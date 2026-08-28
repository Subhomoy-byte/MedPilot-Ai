import React, { useState } from 'react';
import { MedicalDocument, MedicineEntity } from '../../types';
import { Sun, Sunset, Moon, Coffee, Utensils, CheckCircle, Clock, Pill, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ScheduleTimelineProps {
  documents: MedicalDocument[];
  onSelectDocument: (doc: MedicalDocument) => void;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  documents,
  onSelectDocument,
}) => {
  // Aggregate all medicines across all active documents
  const allMeds: { med: MedicineEntity; doc: MedicalDocument }[] = [];
  documents.forEach((doc) => {
    doc.medicines.forEach((med) => {
      allMeds.push({ med, doc });
    });
  });

  const [checkedMeds, setCheckedMeds] = useState<Record<string, boolean>>({});

  const toggleMedChecked = (medId: string) => {
    setCheckedMeds((prev) => ({
      ...prev,
      [medId]: !prev[medId],
    }));
  };

  // Group into Morning, Afternoon, Evening, Bedtime
  const morningMeds = allMeds.filter(
    ({ med }) =>
      med.frequency.toLowerCase().includes('morning') ||
      med.frequency.toLowerCase().includes('qam') ||
      med.instructions.toLowerCase().includes('morning') ||
      med.instructions.toLowerCase().includes('breakfast')
  );

  const eveningMeds = allMeds.filter(
    ({ med }) =>
      med.frequency.toLowerCase().includes('evening') ||
      med.frequency.toLowerCase().includes('dinner') ||
      med.frequency.toLowerCase().includes('qhs') ||
      med.instructions.toLowerCase().includes('dinner') ||
      med.instructions.toLowerCase().includes('evening')
  );

  const afternoonMeds = allMeds.filter(
    ({ med }) =>
      med.frequency.toLowerCase().includes('afternoon') ||
      med.frequency.toLowerCase().includes('lunch') ||
      (med.frequency.toLowerCase().includes('bid') &&
        !morningMeds.some((m) => m.med.id === med.id) &&
        !eveningMeds.some((m) => m.med.id === med.id))
  );

  const otherMeds = allMeds.filter(
    ({ med }) =>
      !morningMeds.some((m) => m.med.id === med.id) &&
      !eveningMeds.some((m) => m.med.id === med.id) &&
      !afternoonMeds.some((m) => m.med.id === med.id)
  );

  const timeSlots = [
    {
      id: 'morning',
      title: 'Morning Routine',
      time: '7:00 AM – 9:00 AM',
      icon: Sun,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
      borderColor: 'border-amber-500/30',
      items: morningMeds,
      tip: 'Take with a full glass of water. Enteric-coated Aspirin protects stomach lining.',
    },
    {
      id: 'afternoon',
      title: 'Midday / Lunch',
      time: '12:00 PM – 2:00 PM',
      icon: Coffee,
      iconColor: 'text-orange-400',
      bgColor: 'bg-orange-500/15',
      borderColor: 'border-orange-500/30',
      items: afternoonMeds,
      tip: 'Keep midday hydration steady. Take with nutritious lunch meal.',
    },
    {
      id: 'evening',
      title: 'Evening & Dinner',
      time: '6:00 PM – 8:00 PM',
      icon: Sunset,
      iconColor: 'text-[#c084fc]',
      bgColor: 'bg-purple-500/15',
      borderColor: 'border-purple-500/30',
      items: eveningMeds,
      tip: 'Take Metformin ER with your meal to reduce stomach upset. Take Atorvastatin with dinner.',
    },
    {
      id: 'other',
      title: 'As Needed / Bedtime',
      time: '9:00 PM – 10:30 PM',
      icon: Moon,
      iconColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/15',
      borderColor: 'border-indigo-500/30',
      items: otherMeds,
      tip: 'Maintain comfortable sleep posture and restful environment.',
    },
  ];

  const totalCount = allMeds.length;
  const completedCount = Object.values(checkedMeds).filter(Boolean).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div id="medora-schedule-timeline" className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] p-5 sm:p-7 shadow-xl shadow-purple-950/20 space-y-6">
      {/* Header & Daily Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#261d4a]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-linear-to-r from-purple-950 to-pink-950 border border-purple-800/50 text-[#c084fc] text-xs font-bold font-mono mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>DAILY MEDICATION REGIMEN</span>
          </div>
          <h3 className="text-xl font-extrabold text-white font-display">
            Interactive Daily Schedule & Food Timing
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400">
            Automatically organized into optimal time-of-day slots with food & hydration requirements.
          </p>
        </div>

        {/* Daily Compliance Ring / Progress Box */}
        <div className="bg-[#181135] border border-[#2d2259] rounded-xl p-3 sm:px-4 sm:py-2.5 flex items-center gap-3 self-start sm:self-auto min-w-[200px]">
          <div className="relative w-10 h-10 shrink-0">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                className="stroke-[#261d4a]"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                className="stroke-[#10b981] transition-all duration-500"
                strokeWidth="3.5"
                strokeDasharray={100}
                strokeDashoffset={100 - progressPercent}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold font-mono text-white">
              {progressPercent}%
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block font-mono">
              Today's Regimen
            </span>
            <span className="text-xs font-bold text-white">
              {completedCount} of {totalCount} Taken
            </span>
          </div>
        </div>
      </div>

      {/* Visual Time Slot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {timeSlots.map((slot) => {
          const Icon = slot.icon;
          const hasItems = slot.items.length > 0;

          return (
            <div
              key={slot.id}
              className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all ${
                hasItems
                  ? `${slot.borderColor} bg-[#160f33] hover:bg-[#1a123d] hover:shadow-md`
                  : 'border-[#261d4a] bg-[#0f0a24]/50 opacity-60'
              }`}
            >
              {/* Slot Header */}
              <div>
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#261d4a]">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl ${slot.bgColor} ${slot.iconColor} flex items-center justify-center shrink-0 border border-white/5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-display">
                        {slot.title}
                      </h4>
                      <span className="text-[11px] font-mono text-purple-300">
                        {slot.time}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#241a4a] border border-purple-800/40 text-purple-200 font-mono">
                    {slot.items.length} {slot.items.length === 1 ? 'Med' : 'Meds'}
                  </span>
                </div>

                {/* Slot Meds List */}
                {hasItems ? (
                  <div className="mt-3 space-y-2.5">
                    {slot.items.map(({ med, doc }) => {
                      const isChecked = Boolean(checkedMeds[med.id]);
                      const isLowConfidence = med.isLowConfidence;

                      return (
                        <div
                          key={med.id}
                          className={`p-3 rounded-xl border transition-all text-xs flex items-start justify-between gap-2.5 ${
                            isChecked
                              ? 'bg-emerald-950/40 border-emerald-500/40 opacity-80'
                              : isLowConfidence
                              ? 'bg-amber-950/30 border-dashed border-amber-500/50'
                              : 'bg-[#1b133d] border-[#2e235a] hover:border-[#8b5cf6]/50'
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`font-bold text-xs sm:text-sm font-display ${isChecked ? 'line-through text-neutral-500' : 'text-white'}`}>
                                {med.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#281c54] text-purple-200 font-mono">
                                {med.strength}
                              </span>
                              {med.withFood === 'with_food' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-0.5">
                                  <Utensils className="w-2.5 h-2.5" />
                                  With Food
                                </span>
                              )}
                              {isLowConfidence && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-950/80 text-amber-300 border border-amber-600/50 flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                  Verify Dose
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-neutral-300 leading-snug">
                              {med.instructions}
                            </p>

                            <div className="flex items-center gap-2 pt-1 text-[10px] text-neutral-400">
                              <span>Rx: {doc.title.split('&')[0]}</span>
                              <button
                                onClick={() => onSelectDocument(doc)}
                                className="text-[#c084fc] font-bold hover:underline cursor-pointer"
                              >
                                View Doc
                              </button>
                            </div>
                          </div>

                          {/* Checkbox trigger for daily tracking */}
                          <button
                            type="button"
                            onClick={() => toggleMedChecked(med.id)}
                            className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                              isChecked
                                ? 'bg-[#10b981] border-[#10b981] text-white shadow-xs'
                                : 'bg-[#241a4a] border-[#382a6e] text-purple-300 hover:border-purple-400 hover:text-white'
                            }`}
                            title={isChecked ? 'Mark as not taken' : 'Mark as taken today'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-neutral-500 italic font-mono">
                    No scheduled medications in this window.
                  </div>
                )}
              </div>

              {/* Slot Tip */}
              <div className="pt-2 border-t border-[#261d4a] text-[11px] text-neutral-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
                <span className="line-clamp-1">{slot.tip}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
