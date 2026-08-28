import React, { useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Globe, 
  Gauge, 
  Sparkles,
  Radio,
  FileAudio
} from 'lucide-react';

interface VoicePlayerProps {
  textToRead: string;
  documentTitle: string;
  selectedLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  textToRead,
  documentTitle,
  selectedLanguage,
  onLanguageChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([40, 65, 30, 85, 95, 45, 70, 60, 90, 75, 50, 80, 65, 95, 40, 60]);

  // Clean sentences for highlighting
  const sentences = textToRead
    .split(/(?<=[.?!])\s+/)
    .filter((s) => s.trim().length > 0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      // Simulate reading through sentences
      interval = setInterval(() => {
        setCurrentSentenceIndex((prev) => {
          if (prev >= sentences.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });

        // Jitter waveform bars
        setWaveformBars((prev) =>
          prev.map(() => Math.floor(Math.random() * 75) + 25)
        );
      }, 3500 / rate);
    }
    return () => clearInterval(interval);
  }, [isPlaying, rate, sentences.length]);

  const handlePlayToggle = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = rate;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        
        // Match language code
        const langMap: Record<LanguageCode, string> = {
          en: 'en-US',
          bn: 'bn-BD',
          es: 'es-ES',
          hi: 'hi-IN',
          fr: 'fr-FR',
          zh: 'zh-CN',
          de: 'de-DE',
          tl: 'fil-PH',
          ar: 'ar-SA',
        };
        utterance.lang = langMap[selectedLanguage] || 'en-US';

        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          // fallback simulator
        }
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentSentenceIndex(0);
  };

  return (
    <div
      id="medora-voice-player"
      className="bg-[#120d28]/95 backdrop-blur-md rounded-2xl border border-[#2d2259] p-5 sm:p-6 shadow-xl shadow-purple-950/20 text-white space-y-5"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#261d4a]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-r from-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white shadow-md shadow-purple-500/30">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#241a4a] text-purple-200 text-[10px] font-bold font-mono uppercase tracking-wider border border-purple-800/40">
                Large-Print Audio Guide
              </span>
              {isPlaying && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Broadcasting
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">
              Spoken Patient Briefing
            </h3>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Globe className="w-4 h-4 text-purple-400" />
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
            className="bg-[#1e1545] border border-[#2d2259] text-purple-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-[#8b5cf6] cursor-pointer"
            aria-label="Select audio translation language"
          >
            <option value="en">English (US)</option>
            <option value="es">Español (Spanish)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="fr">Français (French)</option>
            <option value="zh">中文 (Mandarin)</option>
            <option value="de">Deutsch (German)</option>
            <option value="tl">Tagalog (Filipino)</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
        </div>
      </div>

      {/* Dynamic Animated Waveform */}
      <div className="bg-[#0e0922] p-4 rounded-xl border border-[#261d4a] flex items-center justify-between gap-1 h-16 px-6">
        {waveformBars.map((height, idx) => (
          <div
            key={idx}
            className={`w-1.5 sm:w-2 rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-linear-to-t from-[#8b5cf6] via-[#d946ef] to-[#ec4899]'
                : 'bg-purple-900/40'
            }`}
            style={{
              height: isPlaying ? `${height}%` : '20%',
            }}
          />
        ))}
      </div>

      {/* Synchronized Large-Print Teleprompter Display */}
      <div className="bg-[#181135] p-4 sm:p-5 rounded-xl border border-[#2d2259] text-sm sm:text-base leading-relaxed text-neutral-300 max-h-36 overflow-y-auto">
        {sentences.map((sentence, idx) => {
          const isCurrent = isPlaying && idx === currentSentenceIndex;
          return (
            <span
              key={idx}
              className={`transition-all duration-200 ${
                isCurrent
                  ? 'bg-linear-to-r from-[#8b5cf6]/30 to-[#ec4899]/30 text-white font-bold px-1.5 py-0.5 rounded-md border-b-2 border-[#ec4899]'
                  : 'text-neutral-300'
              }`}
            >
              {sentence}{' '}
            </span>
          );
        })}
      </div>

      {/* Playback Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
        <div className="flex items-center gap-3">
          {/* Main Play/Pause Button */}
          <button
            onClick={handlePlayToggle}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#8b5cf6] to-[#ec4899] hover:from-[#7c3aed] hover:to-[#db2777] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-950/40 transition-all active:scale-95 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? 'Pause Narration' : 'Listen in Plain Words'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-[#1e1545] border border-[#2d2259] text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Restart playback from beginning"
            aria-label="Restart playback"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Pitch Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-mono hidden sm:inline">Speed:</span>
          <div className="flex items-center bg-[#1e1545] rounded-xl border border-[#2d2259] p-0.5">
            {[0.75, 1.0, 1.25].map((s) => (
              <button
                key={s}
                onClick={() => setRate(s)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                  rate === s
                    ? 'bg-[#8b5cf6] text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
