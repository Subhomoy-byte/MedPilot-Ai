import React from 'react';
import { AppSettings } from '../types';
import { LandingNavbar } from './nav/LandingNavbar';
import { ProductNavbar } from './nav/ProductNavbar';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'analysis' | 'voice' | 'history' | 'settings';
  onNavigate: (view: 'landing' | 'dashboard' | 'analysis' | 'voice' | 'history' | 'settings') => void;
  onOpenUpload: () => void;
  hasActiveDocument: boolean;
  activeDocumentTitle?: string;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenUpload,
  hasActiveDocument,
  activeDocumentTitle,
  settings,
  onUpdateSettings,
}) => {
  if (currentView === 'landing') {
    return (
      <LandingNavbar
        onOpenUpload={onOpenUpload}
        onNavigateToDashboard={() => onNavigate('dashboard')}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    );
  }

  return (
    <ProductNavbar
      currentView={currentView}
      onNavigate={onNavigate}
      onOpenUpload={onOpenUpload}
      hasActiveDocument={hasActiveDocument}
      activeDocumentTitle={activeDocumentTitle}
      settings={settings}
      onUpdateSettings={onUpdateSettings}
    />
  );
};
