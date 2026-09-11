"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { UserRole, Language } from '../types';
import { Droplets, RefreshCw, Download, Globe, User, Scale } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  onResetDemo: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, setRole, onResetDemo, isLoading }) => {
  const { language, setLanguage, t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install PaaniPanchayat PWA: Open in Chrome/Edge and tap 'Add to Home Screen' from browser menu.");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-canal)] text-white border-b border-[var(--color-canal-hover)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-[var(--color-canal-hover)] border border-white/20 flex items-center justify-center">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">
                {t('appTitle')}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-canal-hover)] text-white/90 font-medium border border-white/20">
                PWA MVP
              </span>
            </div>
            <p className="text-xs text-white/80 hidden sm:block">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Demo Reset Button */}
          <button
            onClick={onResetDemo}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-canal-hover)] hover:bg-[#144744] text-white text-xs sm:text-sm font-medium transition border border-white/20 disabled:opacity-50"
            title="Load 4-Farmer Scarcity Demo Preset"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{t('demoReset')}</span>
          </button>

          {/* Role View Toggle Button */}
          <div className="flex items-center bg-[var(--color-canal-hover)] p-1 rounded-lg border border-white/20">
            <button
              onClick={() => setRole('farmer')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                currentRole === 'farmer'
                  ? 'bg-white text-[var(--color-canal)]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>{t('farmerView')}</span>
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                currentRole === 'admin'
                  ? 'bg-[var(--color-wheat)] text-[var(--color-text-primary)]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              <span>{t('adminView')}</span>
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-[var(--color-canal-hover)] px-2 py-1 rounded-lg border border-white/20 text-xs">
            <Globe className="h-3.5 w-3.5 text-white/80 mr-1.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">English</option>
              <option value="hi" className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">हिंदी</option>
              <option value="mr" className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">मराठी</option>
            </select>
          </div>

          {/* PWA Install App Button */}
          <button
            onClick={handleInstallApp}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-canal-hover)] hover:bg-[#144744] text-white text-xs font-medium border border-white/20 transition"
            title="Install PWA to Home Screen"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t('installApp')}</span>
          </button>

        </div>

      </div>
    </header>
  );
};
