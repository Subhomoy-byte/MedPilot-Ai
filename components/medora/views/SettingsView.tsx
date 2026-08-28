import React from 'react';
import { AppSettings, LanguageCode } from '../types';
import { Settings, Globe, Eye, Volume2, ShieldCheck, User, Trash2, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
}) => {
  return (
    <div id="medora-settings-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 pb-24 text-neutral-100">
      {/* Header */}
      <div className="bg-[#120d28]/90 backdrop-blur-xs p-6 rounded-2xl border border-[#2d2259] shadow-xl shadow-purple-950/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-r from-[#8b5cf6] to-[#ec4899] text-white flex items-center justify-center shadow-md shadow-purple-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-sans">
              Customize language, accessibility, voice narration, and patient privacy.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Language Preferences */}
      <div className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] p-6 shadow-xl shadow-purple-950/20 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#261d4a]">
          <Globe className="w-5 h-5 text-[#c084fc]" />
          <h2 className="text-base font-bold text-white font-display">
            Preferred Translation Language
          </h2>
        </div>
        <p className="text-xs text-neutral-400">
          All document overviews, plain-language instructions, and audio narrations will default to this language.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {[
            { code: 'en' as const, label: 'English', flag: '🇺🇸' },
            { code: 'es' as const, label: 'Español', flag: '🇪🇸' },
            { code: 'hi' as const, label: 'हिन्दी', flag: '🇮🇳' },
            { code: 'fr' as const, label: 'Français', flag: '🇫🇷' },
            { code: 'zh' as const, label: '中文 (Mandarin)', flag: '🇨🇳' },
            { code: 'de' as const, label: 'Deutsch', flag: '🇩🇪' },
            { code: 'tl' as const, label: 'Tagalog', flag: '🇵🇭' },
            { code: 'ar' as const, label: 'العربية', flag: '🇸🇦' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => onUpdateSettings({ language: lang.code })}
              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                settings.language === lang.code
                  ? 'bg-[#25184f] border-[#8b5cf6] text-white font-bold shadow-md'
                  : 'bg-[#181135] border-[#2d2259] text-neutral-300 hover:bg-[#201544] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{lang.flag}</span>
                <span className="text-xs font-semibold">{lang.label}</span>
              </div>
              {settings.language === lang.code && (
                <CheckCircle2 className="w-4 h-4 text-[#c084fc]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Accessibility Controls */}
      <div className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] p-6 shadow-xl shadow-purple-950/20 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[#261d4a]">
          <Eye className="w-5 h-5 text-[#c084fc]" />
          <h2 className="text-base font-bold text-white font-display">
            Accessibility & Visual Comfort
          </h2>
        </div>

        {/* Text Scaling */}
        <div>
          <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2 font-mono">
            Text Size Scale:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { size: 'sm' as const, label: 'Default (14px)' },
              { size: 'md' as const, label: 'Medium (16px)' },
              { size: 'lg' as const, label: 'Large (18px)' },
              { size: 'xl' as const, label: 'Extra Large (20px)' },
            ].map((scale) => (
              <button
                key={scale.size}
                onClick={() => onUpdateSettings({ fontSize: scale.size })}
                className={`py-2.5 px-3 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                  settings.fontSize === scale.size
                    ? 'bg-[#8b5cf6] text-white font-bold border-[#8b5cf6]'
                    : 'bg-[#181135] border-[#2d2259] text-neutral-300 hover:bg-[#201544] hover:text-white'
                }`}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          {/* High Contrast */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181135] border border-[#2d2259]">
            <div>
              <span className="text-xs font-bold text-white block">
                High Contrast Mode
              </span>
              <span className="text-[11px] text-neutral-400">
                Increases border weights and maximizes foreground/background contrast
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })}
              className="w-5 h-5 accent-[#8b5cf6] cursor-pointer"
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181135] border border-[#2d2259]">
            <div>
              <span className="text-xs font-bold text-white block">
                Reduce Animations & Motion
              </span>
              <span className="text-[11px] text-neutral-400">
                Disables pulsating glows on the confidence map for vestibular comfort
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
              className="w-5 h-5 accent-[#8b5cf6] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Voice Playback Preferences */}
      <div className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] p-6 shadow-xl shadow-purple-950/20 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#261d4a]">
          <Volume2 className="w-5 h-5 text-[#c084fc]" />
          <h2 className="text-base font-bold text-white font-display">
            Voice Narration Preferences
          </h2>
        </div>

        <div>
          <label className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2 font-mono">
            Default Speech Speed:
          </label>
          <div className="flex items-center gap-2">
            {[0.75, 1.0, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                onClick={() => onUpdateSettings({ voiceSpeed: speed })}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  settings.voiceSpeed === speed
                    ? 'bg-[#8b5cf6] text-white border-[#8b5cf6]'
                    : 'bg-[#181135] border-[#2d2259] text-purple-200 hover:text-white hover:bg-[#201544]'
                }`}
              >
                {speed}x {speed === 0.75 ? '(Gentle / Slower)' : speed === 1.0 ? '(Normal)' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Privacy & Data Security */}
      <div className="bg-[#120d28]/90 backdrop-blur-xs rounded-2xl border border-[#2d2259] p-6 shadow-xl shadow-purple-950/20 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#261d4a]">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white font-display">
            Privacy, Compliance & Ephemeral Cache
          </h2>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 space-y-1">
          <span className="font-bold block">🔒 Local Session Security Guarantee</span>
          <p className="leading-relaxed">
            Medora AI processes document images strictly in ephemeral memory for the active analysis session. Uploaded documents are stored only in your local browser sandbox and never retained on third-party public servers.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white block">
              Clear All Uploaded Records & History
            </span>
            <span className="text-[11px] text-neutral-400">
              Resets demo documents and restores initial samples.
            </span>
          </div>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all document history?')) {
                onResetAllData();
              }
            }}
            className="px-4 py-2 rounded-xl bg-red-950/60 border border-red-500/40 hover:bg-red-900/60 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
