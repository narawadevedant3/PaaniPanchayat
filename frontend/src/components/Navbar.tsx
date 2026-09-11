"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AuthUser, UserRole, Language } from '../types';
import { Download, Globe, User, LogOut, ChevronDown, Mail, Phone, BadgeCheck, Shield } from 'lucide-react';

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

export const Navbar: React.FC<NavbarProps> = ({ authUser, onLogout }) => {
  const { language, setLanguage, t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
            className={`flex items-center space-x-1 px-2 py-1.5 sm:px-2.5 rounded-lg text-xs font-medium shadow-sm transition shrink-0 ${
              isInstallable ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
            title="Install PWA to Home Screen"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden lg:inline">{t('installApp')}</span>
          </button>

          {/* User Profile & Dropdown with Basic Info & Bottom Logout */}
          {authUser && (
            <div className="relative pl-1.5 sm:pl-2 border-l border-slate-200 shrink-0" ref={profileRef}>
              {/* Profile Trigger Button */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition text-left cursor-pointer"
                title={t('farmerProfile')}
                aria-expanded={isProfileOpen}
              >
                {/* Farmer Avatar with Online Indicator */}
                <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-emerald-600 text-white font-black text-xs shadow-sm shrink-0">
                  {authUser.name ? authUser.name.charAt(0).toUpperCase() : 'F'}
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-white" />
                </div>

                <div className="hidden md:flex flex-col min-w-0 pr-1">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {authUser.name}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 capitalize flex items-center gap-1">
                    {authUser.role === 'farmer' ? t('farmer') : t('admin')}
                  </span>
                </div>

                <ChevronDown className={`h-3.5 w-3.5 text-emerald-700 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Farmer Profile Popover Card */}
              {isProfileOpen && (
                <div className="absolute right-0 top-12 mt-1 w-80 sm:w-88 bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-100 shadow-2xl p-4 z-50 text-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Profile Header: Avatar, Full Name & Verified Farmer Badge */}
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                      {authUser.name ? authUser.name.charAt(0).toUpperCase() : 'F'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-extrabold text-slate-900 truncate">{authUser.name}</h4>
                        <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {authUser.role === 'farmer' ? `🌱 ${t('verifiedFarmer')}` : `⚖️ ${t('admin')}`}
                      </span>
                    </div>
                  </div>

                  {/* Basic Information Section */}
                  <div className="space-y-2.5 text-xs">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">
                      {t('accountDetails')}
                    </span>

                    {/* Email Address */}
                    <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 font-bold block">{t('emailAddress')}</span>
                        <span className="text-xs font-semibold text-slate-800 truncate block">{authUser.email}</span>
                      </div>
                    </div>

                    {/* Contact Phone */}
                    <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 font-bold block">{t('contactNumber')}</span>
                        <span className="text-xs font-semibold text-slate-800 truncate block">
                          {authUser.contact || '+91 9730076082'}
                        </span>
                      </div>
                    </div>

                    {/* Farmer ID & Irrigation Region */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">{t('farmerId')}</span>
                        <span className="text-xs font-mono font-bold text-emerald-800 block">
                          #PP-{authUser.user_id ? String(authUser.user_id).padStart(4, '0') : '0108'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">{t('region')}</span>
                        <span className="text-xs font-bold text-slate-800 truncate block">
                          {t('canalZone')}
                        </span>
                      </div>
                    </div>

                    {/* Canal Water Shareholder Tag */}
                    <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center space-x-2 text-[11px] text-emerald-800 font-medium">
                      <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{t('membership')}</span>
                    </div>
                  </div>

                  {/* Bottom: Logout Option */}
                  {onLogout && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onLogout();
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center space-x-2 border border-rose-200 transition shadow-sm cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>{t('signOut')}</span>
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
