"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuthUser, UserRole, Language } from '../types';
import { Droplets, ShieldCheck, RefreshCw, Download, Globe, User, Settings, Scale, LogOut } from 'lucide-react';

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
      alert("To install PaaniPanchayat PWA: Open in Chrome/Edge, click 'Add to Home Screen' or 'Install Application' in browser menu.");
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-emerald-950/90 border-b border-emerald-800/50 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
            <div className="h-full w-full bg-emerald-950 rounded-[10px] flex items-center justify-center">
              <Droplets className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-emerald-100 to-cyan-300 bg-clip-text text-transparent">
                {t('appTitle')}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                PWA MVP
              </span>
            </div>
            <p className="text-xs text-emerald-300/70 hidden sm:block">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">

          {/* Active Role Badge */}
          <div className="flex items-center px-3 py-1 bg-emerald-900/80 rounded-lg border border-emerald-700/50 text-xs font-semibold">
            {currentRole === 'admin' ? (
              <span className="flex items-center space-x-1 text-amber-300">
                <Scale className="h-3.5 w-3.5 text-amber-400" />
                <span>Panchayat Admin</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-cyan-300">
                <User className="h-3.5 w-3.5 text-cyan-400" />
                <span>Farmer Portal</span>
              </span>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative flex items-center bg-emerald-900/60 px-2 py-1 rounded-lg border border-emerald-700/40 text-xs">
            <Globe className="h-3.5 w-3.5 text-emerald-300 mr-1.5" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-emerald-100 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-emerald-950 text-white">English</option>
              <option value="hi" className="bg-emerald-950 text-white">हिंदी</option>
              <option value="mr" className="bg-emerald-950 text-white">मराठी</option>
            </select>
          </div>

          {/* PWA Install App Button */}
          <button
            onClick={handleInstallApp}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-medium shadow-md shadow-cyan-900/40 transition"
            title="Install PWA to Home Screen"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t('installApp')}</span>
          </button>

          {/* User Profile & Logout */}
          {authUser && (
            <div className="flex items-center space-x-2 pl-2 border-l border-emerald-800/60">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-emerald-100">{authUser.name}</span>
                <span className="text-[10px] text-emerald-400/80 capitalize">{authUser.role}</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-rose-100 border border-rose-800/40 transition"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
