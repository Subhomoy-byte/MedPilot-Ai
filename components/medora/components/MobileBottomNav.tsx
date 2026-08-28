import React from 'react';
import { LayoutDashboard, Sparkles, Volume2, History, Settings, Home, UploadCloud } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: 'landing' | 'dashboard' | 'analysis' | 'voice' | 'history' | 'settings';
  onNavigate: (view: 'landing' | 'dashboard' | 'analysis' | 'voice' | 'history' | 'settings') => void;
  onOpenUpload: () => void;
  hasActiveDocument: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenUpload,
  hasActiveDocument,
}) => {
  const navItems = [
    {
      id: 'landing' as const,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'analysis' as const,
      label: 'Analysis',
      icon: Sparkles,
      hasBadge: hasActiveDocument,
      highlight: true,
    },
    {
      id: 'voice' as const,
      label: 'Voice',
      icon: Volume2,
    },
    {
      id: 'history' as const,
      label: 'History',
      icon: History,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav
      id="medora-mobile-bottom-nav"
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09070f]/95 backdrop-blur-md border-t border-purple-900/40 px-2 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.8)] pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[52px] min-h-[48px] transition-all relative select-none active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-purple-300/60 hover:text-purple-200'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-linear-to-r from-[#8b5cf6] to-[#a855f7] text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-[#09070f] shadow-[0_0_6px_#22d3ee]" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? 'font-bold text-white' : 'font-medium text-purple-300/60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
