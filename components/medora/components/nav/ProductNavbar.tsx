import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Volume2, 
  History, 
  Settings, 
  UploadCloud, 
  Type, 
  Globe, 
  Check, 
  FileText, 
  ExternalLink,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { AppSettings, LanguageCode } from '../../types';

interface ProductNavbarProps {
  currentView: 'dashboard' | 'analysis' | 'voice' | 'history' | 'settings';
  onNavigate: (view: 'landing' | 'dashboard' | 'analysis' | 'voice' | 'history' | 'settings') => void;
  onOpenUpload: () => void;
  hasActiveDocument: boolean;
  activeDocumentTitle?: string;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const ProductNavbar: React.FC<ProductNavbarProps> = ({
  currentView,
  onNavigate,
  onOpenUpload,
  hasActiveDocument,
  activeDocumentTitle = 'Jane Miller — Rx Cardiology',
  settings,
  onUpdateSettings,
}) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);

  const languages: Array<{ code: LanguageCode; label: string; flag: string }> = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  return (
    <header
      id="medora-product-navbar"
      className="sticky top-0 z-40 bg-[#0c0919] border-b border-[#241c42] shadow-[0_2px_15px_rgba(0,0,0,0.5)]"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Product Workspace Title & Active Context */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="Return to Landing Page"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1f173d] border border-[#3b2d6e] flex items-center justify-center text-white font-display font-black text-sm text-purple-300 group-hover:border-purple-400 transition-colors">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white font-display tracking-tight">
                  MedPilot
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1c1538] text-purple-300 border border-[#332661]">
                  WORKSPACE
                </span>
              </div>
            </div>
          </button>

          {/* Active Context Breadcrumb (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[#241c42] text-xs text-neutral-400 font-mono">
            <span className="text-neutral-500">Document:</span>
            <span className="font-semibold text-purple-200 truncate max-w-[200px]" title={activeDocumentTitle}>
              {activeDocumentTitle}
            </span>
          </div>
        </div>

        {/* Center: In-Product Functional Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#140f29] p-1 rounded-xl border border-[#261d46] text-xs font-semibold">
          <button
            id="nav-product-dashboard"
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-[#2b1f59] text-white font-bold shadow-xs'
                : 'text-neutral-300 hover:text-white hover:bg-[#1d163a]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-purple-300" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-product-analysis"
            onClick={() => onNavigate('analysis')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer relative ${
              currentView === 'analysis'
                ? 'bg-[#2b1f59] text-white font-bold shadow-xs'
                : 'text-neutral-300 hover:text-white hover:bg-[#1d163a]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Analysis</span>
            {hasActiveDocument && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            id="nav-product-voice"
            onClick={() => onNavigate('voice')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'voice'
                ? 'bg-[#2b1f59] text-white font-bold shadow-xs'
                : 'text-neutral-300 hover:text-white hover:bg-[#1d163a]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-pink-300" />
            <span>Voice Guide</span>
          </button>

          <button
            id="nav-product-history"
            onClick={() => onNavigate('history')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'history'
                ? 'bg-[#2b1f59] text-white font-bold shadow-xs'
                : 'text-neutral-300 hover:text-white hover:bg-[#1d163a]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-neutral-300" />
            <span>History</span>
          </button>

          <button
            id="nav-product-settings"
            onClick={() => onNavigate('settings')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentView === 'settings'
                ? 'bg-[#2b1f59] text-white font-bold shadow-xs'
                : 'text-neutral-300 hover:text-white hover:bg-[#1d163a]'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-neutral-300" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right: Functional Utilities (Language + Text Size + Upload) */}
        <div className="flex items-center gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="px-2.5 py-1.5 rounded-lg bg-[#15102a] border border-[#2b204e] hover:border-[#43327a] text-neutral-200 text-xs font-medium flex items-center gap-1.5 min-h-[36px] cursor-pointer transition-colors"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span className="uppercase text-[11px] font-mono font-bold">{settings.language}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-[#16112d] border border-[#3b2d69] rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onUpdateSettings({ language: lang.code });
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#251b4c] transition-colors cursor-pointer ${
                      settings.language === lang.code ? 'text-purple-300 font-bold bg-[#1d153e]' : 'text-neutral-300'
                    }`}
                  >
                    <span>
                      {lang.flag} {lang.label}
                    </span>
                    {settings.language === lang.code && <Check className="w-3 h-3 text-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text Size Accessibility Toggle */}
          <button
            id="product-text-size-toggle"
            onClick={() =>
              onUpdateSettings({
                fontSize:
                  settings.fontSize === 'sm'
                    ? 'md'
                    : settings.fontSize === 'md'
                    ? 'lg'
                    : settings.fontSize === 'lg'
                    ? 'xl'
                    : 'sm',
              })
            }
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#15102a] border border-[#2b204e] hover:border-[#43327a] text-neutral-200 text-xs font-medium flex items-center gap-1 min-h-[36px] cursor-pointer transition-colors"
            title={`Font size: ${settings.fontSize.toUpperCase()}`}
          >
            <Type className="w-3.5 h-3.5 text-[#a855f7]" />
            <span className="uppercase text-[10px] sm:text-[11px] font-mono">{settings.fontSize}</span>
          </button>

          {/* Primary Action Button */}
          <button
            id="product-upload-btn"
            onClick={onOpenUpload}
            className="px-3 sm:px-3.5 py-1.5 rounded-lg bg-linear-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#6d28d9] hover:to-[#7e22ce] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Document</span>
            <span className="sm:hidden">Upload</span>
          </button>

          {/* Exit to Overview / Landing */}
          <button
            onClick={() => onNavigate('landing')}
            className="hidden xl:flex px-2.5 py-1.5 rounded-lg bg-[#140f29] border border-[#261d46] hover:bg-[#1d163a] text-neutral-400 hover:text-neutral-200 text-[11px] font-mono items-center gap-1 transition-colors cursor-pointer"
            title="Exit workspace to marketing landing page"
          >
            <span>Exit</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
