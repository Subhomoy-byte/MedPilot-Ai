import React, { useState, useEffect } from 'react';
import { Sparkles, UploadCloud, Type, Menu, X } from 'lucide-react';
import { AppSettings } from '../../types';

interface LandingNavbarProps {
  onOpenUpload: () => void;
  onNavigateToDashboard: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenUpload,
  onNavigateToDashboard,
  settings,
  onUpdateSettings,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [highlightStyle, setHighlightStyle] = useState({ left: 0, width: 0 });
  const linksRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  const toggleTextSize = () => {
    onUpdateSettings({
      fontSize:
        settings.fontSize === 'sm'
          ? 'md'
          : settings.fontSize === 'md'
          ? 'lg'
          : settings.fontSize === 'lg'
          ? 'xl'
          : 'sm',
    });
  };

  // Nav Links for both desktop expanded and mobile dropdown
  const navLinks = [
    { id: 'section-features', label: 'Platform' },
    { id: 'section-confidence-map', label: 'Confidence Map' },
    { id: 'section-pipeline', label: 'How It Works' },
    { id: 'section-pricing', label: 'Pricing' },
    { id: 'section-faq', label: 'FAQ' },
  ];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      {/* Dynamic Island Pill */}
      <nav
        id="medora-landing-pill"
        className={`pointer-events-auto relative flex flex-col overflow-hidden glass-panel transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform ${
          isMobileMenuOpen ? 'rounded-[32px]' : 'rounded-full'
        }`}
      >
        {/* Main Horizontal Bar */}
        <div
          className={`flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isScrolled ? 'h-14 px-3 gap-3' : 'h-16 px-4 gap-4 md:gap-6'
          }`}
        >
          {/* Logo Section */}
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            <div
              className={`transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] rounded-xl bg-linear-to-br from-[#a855f7] via-[#8b5cf6] to-[#ec4899] p-0.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-105 ${
                isScrolled ? 'w-9 h-9' : 'w-10 h-10'
              }`}
            >
              <div className="w-full h-full bg-[#0d0a1d] rounded-[10px] flex items-center justify-center">
                <span className="font-display font-black text-lg text-transparent bg-clip-text bg-linear-to-r from-purple-300 via-pink-300 to-cyan-300">
                  M<span className="text-[#ec4899]">.</span>
                </span>
              </div>
            </div>

            {/* Expanded Logo Text */}
            <div
              className={`flex flex-col items-start overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] origin-left ${
                isScrolled ? 'w-0 opacity-0 -translate-x-4' : 'hidden sm:flex w-[100px] opacity-100 translate-x-0'
              }`}
            >
              <span className="font-display font-black text-lg text-white leading-none whitespace-nowrap tracking-tight">
                Medora<span className="text-transparent bg-clip-text bg-linear-to-r from-[#a855f7] to-[#ec4899]">AI</span>
              </span>
            </div>
          </button>

          {/* Desktop Nav Links (Hidden in compact/mobile state) */}
          <div
            className={`relative hidden lg:flex items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] origin-center ${
              isScrolled ? 'max-w-0 opacity-0 scale-95 px-0' : 'max-w-[500px] opacity-100 scale-100 px-2'
            }`}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Sliding Highlight Pill */}
            <div
              className={`absolute h-8 bg-purple-900/30 rounded-full transition-all duration-300 ease-out pointer-events-none ${
                hoveredIndex !== null ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              style={{ left: highlightStyle.left, width: highlightStyle.width }}
            />

            {navLinks.map((link, idx) => (
              <button
                key={link.id}
                ref={(el) => { linksRef.current[idx] = el; }}
                onMouseEnter={() => {
                  setHoveredIndex(idx);
                  if (linksRef.current[idx]) {
                    setHighlightStyle({
                      left: linksRef.current[idx]?.offsetLeft || 0,
                      width: linksRef.current[idx]?.offsetWidth || 0,
                    });
                  }
                }}
                onClick={() => scrollToSection(link.id)}
                className="relative px-3 py-1.5 text-xs font-semibold text-purple-200/80 hover:text-white transition-colors whitespace-nowrap cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-400 z-10"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Expanded Actions (Hidden on scroll/mobile) */}
            <div
              className={`hidden md:flex items-center gap-2 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                isScrolled ? 'max-w-0 opacity-0 scale-95 gap-0' : 'max-w-[200px] opacity-100 scale-100'
              }`}
            >
              <button
                onClick={toggleTextSize}
                className="w-9 h-9 rounded-full bg-[#14102c]/50 hover:bg-[#1f1747] border border-purple-500/30 hover:border-purple-500/60 flex items-center justify-center text-purple-200 transition-colors cursor-pointer"
                title={`Text size: ${settings.fontSize.toUpperCase()}`}
              >
                <Type className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onNavigateToDashboard}
                className="px-4 h-9 rounded-full bg-[#171135]/50 hover:bg-[#231a4c] border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Workspace</span>
              </button>
            </div>

            {/* Always Visible Primary CTA */}
            <button
              onClick={onOpenUpload}
              className={`rounded-full bg-linear-to-r from-[#8b5cf6] via-[#a855f7] to-[#ec4899] hover:from-[#9d6fff] hover:to-[#f43f5e] text-white text-xs font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                isScrolled ? 'px-4 h-9 gap-1.5' : 'px-4 sm:px-5 h-9 sm:h-10 gap-2 sm:text-sm'
              }`}
            >
              <UploadCloud className={isScrolled ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              <span className={isScrolled ? 'hidden sm:inline' : 'inline'}>Upload</span>
            </button>

            {/* Menu Toggle (Mobile + Scrolled Desktop) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`rounded-full bg-[#14102c]/80 hover:bg-[#1f1747] border-purple-500/30 hover:border-purple-500/60 flex items-center justify-center text-purple-200 transition-all cursor-pointer overflow-hidden ${
                isScrolled || isMobileMenuOpen
                  ? 'w-9 h-9 opacity-100 border'
                  : 'w-9 h-9 opacity-100 border lg:w-0 lg:h-9 lg:opacity-0 lg:border-0'
              }`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dropdown / Mobile Menu Area */}
        <div
          className={`w-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            isMobileMenuOpen ? 'max-h-[500px] opacity-100 border-t border-purple-900/30' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="w-full text-left px-4 py-3 rounded-xl bg-purple-900/10 hover:bg-purple-900/20 text-sm font-semibold text-purple-100 transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}

            <div className="h-px w-full bg-purple-900/30 my-2" />

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTextSize}
                className="flex-1 py-3 rounded-xl bg-[#14102c] hover:bg-[#1f1747] border border-purple-500/30 flex items-center justify-center gap-2 text-purple-200 text-sm font-bold transition-colors cursor-pointer"
              >
                <Type className="w-4 h-4" />
                <span>Text: {settings.fontSize.toUpperCase()}</span>
              </button>
              <button
                onClick={onNavigateToDashboard}
                className="flex-1 py-3 rounded-xl bg-[#171135] hover:bg-[#231a4c] border border-purple-500/40 flex items-center justify-center gap-2 text-white text-sm font-bold transition-colors cursor-pointer"
              >
                Workspace
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};
