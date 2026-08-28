import React, { useState, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { MedicalDocument, AppSettings, LanguageCode } from './types';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { Navbar } from './components/Navbar';
import { UploadModal } from './components/UploadModal';
import { LandingView } from './views/LandingView';
import { DashboardView } from './views/DashboardView';
import { AnalysisView } from './views/AnalysisView';
import { VoiceView } from './views/VoiceView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { MobileBottomNav } from './components/MobileBottomNav';

const STORAGE_KEY_DOCS = 'medora_documents_v1';
const STORAGE_KEY_SETTINGS = 'medora_settings_v1';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'landing' | 'dashboard' | 'analysis' | 'voice' | 'history' | 'settings'
  >('landing');

  // Load documents from localStorage or initialize with curated samples
  const [documents, setDocuments] = useState<MedicalDocument[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DOCS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved documents:', e);
      }
    }
    return SAMPLE_DOCUMENTS;
  });

  // Active document selected for inspection / analysis / voice
  const [activeDocumentId, setActiveDocumentId] = useState<string>(SAMPLE_DOCUMENTS[0].id);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  // App settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
    return {
      language: 'en',
      fontSize: 'md',
      highContrast: false,
      reducedMotion: false,
      voiceSpeed: 1.0,
      autoPlayVoice: false,
    };
  });

  // Persist documents on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(documents));
  }, [documents]);

  // Persist settings on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));

    // Apply high contrast and reduced motion classes to root
    const root = document.documentElement;
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  const activeDoc = documents.find((d) => d.id === activeDocumentId) || documents[0];

  const handleSelectDocument = (doc: MedicalDocument) => {
    setActiveDocumentId(doc.id);
    setCurrentView('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDocumentProcessed = (newDoc: MedicalDocument) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    setActiveDocumentId(newDoc.id);
    setCurrentView('analysis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    setDocuments(updated);
    if (activeDocumentId === id && updated.length > 0) {
      setActiveDocumentId(updated[0].id);
    }
  };

  const handleResetAllData = () => {
    setDocuments(SAMPLE_DOCUMENTS);
    setActiveDocumentId(SAMPLE_DOCUMENTS[0].id);
    localStorage.removeItem(STORAGE_KEY_DOCS);
    setCurrentView('dashboard');
  };

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // Font size multiplier class mapping
  const fontSizeClass =
    settings.fontSize === 'sm'
      ? 'text-[14px]'
      : settings.fontSize === 'lg'
      ? 'text-[18px]'
      : settings.fontSize === 'xl'
      ? 'text-[20px]'
      : 'text-[16px]';

  const isLanding = currentView === 'landing';

  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? 'always' : 'user'}>
      <div
        id="medora-app-root"
        className={`min-h-screen bg-[#030106] text-[#f8fafc] flex flex-col font-sans selection:bg-[#8b5cf6] selection:text-white ${fontSizeClass} ${
          isLanding ? 'bg-aurora bg-noise' : ''
        }`}
      >
      {/* Dynamic Landing / Product Workspace Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenUpload={() => setIsUploadOpen(true)}
        hasActiveDocument={Boolean(activeDoc)}
        activeDocumentTitle={activeDoc?.title}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-20 md:pb-0">
        {currentView === 'landing' && (
          <LandingView
            onOpenUpload={() => setIsUploadOpen(true)}
            onSelectSample={handleSelectDocument}
            onNavigateToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            documents={documents}
            onSelectDocument={handleSelectDocument}
            onOpenUpload={() => setIsUploadOpen(true)}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {currentView === 'analysis' && activeDoc && (
          <AnalysisView
            document={activeDoc}
            onBack={() => setCurrentView('dashboard')}
            selectedLanguage={settings.language}
            onLanguageChange={(lang) => handleUpdateSettings({ language: lang })}
          />
        )}

        {currentView === 'voice' && (
          <VoiceView
            documents={documents}
            activeDocument={activeDoc}
            onSelectDocument={(doc) => setActiveDocumentId(doc.id)}
            selectedLanguage={settings.language}
            onLanguageChange={(lang) => handleUpdateSettings({ language: lang })}
            onOpenAnalysis={() => setCurrentView('analysis')}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            documents={documents}
            onSelectDocument={handleSelectDocument}
            onDeleteDocument={handleDeleteDocument}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Persistent Mobile Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenUpload={() => setIsUploadOpen(true)}
        hasActiveDocument={Boolean(activeDoc)}
      />

      {/* Global Upload & Scanning Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDocumentUploaded={handleDocumentProcessed}
      />
      </div>
    </MotionConfig>
  );
}

