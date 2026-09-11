"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuthUser, UserRole, Language } from '../types';
import { Droplets, RefreshCw, Download, Globe, User, Scale, LogOut } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface NavbarProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  onResetDemo: () => void;
  isLoading: boolean;
  authUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, setRole, onResetDemo, isLoading, authUser, onLogout }) => {
  const { language, setLanguage, t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
      alert("To install PaaniPanchayat PWA: Open in Chrome/Edge, click 'Add to Home Screen' or 'Install Application' in browser menu.");
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-emerald-100 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-600 p-0.5 shadow-md shadow-emerald-600/20 flex items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.png" alt="PaaniPanchayat Logo" className="h-full w-full object-cover rounded-[8px] sm:rounded-[10px]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-emerald-950 truncate">
                {t('appTitle')}
              </span>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 shrink-0">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block truncate">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">

          {/* Demo Scenario Reset Button */}
          <button
            onClick={onResetDemo}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold shadow-sm transition disabled:opacity-50"
            title="Reset to 4-Farm Demo Scenario (180,000 L)"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{t('demoReset')}</span>
          </button>

          {/* Active Role Switcher Toggle */}
          <button
            onClick={() => setRole(currentRole === 'farmer' ? 'admin' : 'farmer')}
            className="flex items-center px-2 sm:px-3 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 text-xs font-semibold transition cursor-pointer"
            title="Click to toggle Farmer / Admin view"
          >
            {currentRole === 'admin' ? (
              <span className="flex items-center space-x-1 text-amber-700">
                <Scale className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">{t('adminView')}</span>
                <span className="sm:hidden text-[11px]">{t('admin')}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-emerald-800">
                <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">{t('farmerView')}</span>
                <span className="sm:hidden text-[11px]">{t('farmer')}</span>
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <div className="relative flex items-center bg-slate-100 px-1.5 sm:px-2 py-1 rounded-lg border border-slate-200 text-xs">
            <Globe className="h-3.5 w-3.5 text-slate-600 mr-1 shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none cursor-pointer pr-0"
            >
              <option value="en" className="bg-white text-slate-900">EN</option>
              <option value="hi" className="bg-white text-slate-900">हिंदी</option>
              <option value="mr" className="bg-white text-slate-900">मराठी</option>
            </select>
          </div>

          {/* PWA Install App Button */}
          <button
            onClick={handleInstallApp}
            className={`flex items-center space-x-1 px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium shadow-sm transition shrink-0 ${isInstallable ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            title="Install PWA to Home Screen"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden lg:inline">{t('installApp')}</span>
          </button>

          {/* User Profile & Logout */}
          {authUser && (
            <div className="flex items-center space-x-1.5 pl-1.5 sm:pl-2 border-l border-slate-200 shrink-0">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[100px]">{authUser.name}</span>
                <span className="text-[10px] text-emerald-700 font-semibold capitalize">{authUser.role}</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5 shrink-0" />
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
