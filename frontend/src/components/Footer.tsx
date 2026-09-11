"use client";

import React from 'react';
import { Droplet, ShieldCheck, Cpu, Phone, HelpCircle, Heart, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-900 pt-12 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        
        {/* Column 1: Brand & Overview */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 p-0.5 shadow-md shadow-emerald-600/30 overflow-hidden shrink-0">
              <img src="/logo.png" alt="PaaniPanchayat Logo" className="w-full h-full object-cover rounded-[10px]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-wide">PaaniPanchayat</h3>
              <p className="text-[11px] text-emerald-400 font-medium">Fair Water. Peaceful Farming.</p>
            </div>
          </div>
          <p className="text-xs text-emerald-200/80 leading-relaxed">
            AI-Powered Water Sharing & Dispute Mediation Platform for Indian Farmers. Optimizing canal allocations with Google OR-Tools to eliminate water disputes.
          </p>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-800 text-[11px] text-emerald-300 font-semibold">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>AI Solver Status: Active & Operational</span>
          </div>
        </div>

        {/* Column 2: Quick Links / Features */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-400 border-b border-emerald-900 pb-2">
            System Features
          </h4>
          <ul className="space-y-2 text-xs text-emerald-200/80">
            <li className="hover:text-white transition flex items-center space-x-1.5">
              <Droplet className="w-3.5 h-3.5 text-emerald-400" />
              <span>OR-Tools Linear Canal Optimizer</span>
            </li>
            <li className="hover:text-white transition flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Dispute Mediation Assistant</span>
            </li>
            <li className="hover:text-white transition flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transparent Fairness Score (0-100)</span>
            </li>
            <li className="hover:text-white transition flex items-center space-x-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>3-Day Request Rate Limit Policy</span>
            </li>
          </ul>
        </div>

        {/* Column 3: Panchayat Water Support & Helpline */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-400 border-b border-emerald-900 pb-2">
            Panchayat Assistance
          </h4>
          <div className="space-y-2 text-xs text-emerald-200/80">
            <p className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Water Helpline: <strong>1800-PAANI-108</strong></span>
            </p>
            <p className="text-[11px] text-emerald-300">
              Dispute Officers available 24/7 during canal rotation cycles.
            </p>
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-900/50 border border-emerald-800 text-[11px]">
              <span className="font-bold text-white block">📍 Irrigation Officer Desk:</span>
              <span className="text-emerald-300">Gram Panchayat Office, Canal Zone #1</span>
            </div>
          </div>
        </div>

        {/* Column 4: Platform & Hackathon Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-400 border-b border-emerald-900 pb-2">
            Hackathon MVP
          </h4>
          <p className="text-xs text-emerald-200/80 leading-relaxed">
            Built for PS14 Hackathon. Engineered to bring equity, transparency, and data-driven irrigation management to smallholder agricultural communities.
          </p>
          <div className="pt-2 text-[11px] text-emerald-400 font-medium">
            Language Options: English | हिंदी | मराठी
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto border-t border-emerald-900/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-400/80 gap-3">
        <p>© {new Date().getFullYear()} PaaniPanchayat. All Rights Reserved.</p>
        <p className="flex items-center space-x-1">
          <span>Empowering Farmers with Fair Water Allocation</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 ml-1 inline" />
        </p>
      </div>
    </footer>
  );
};
