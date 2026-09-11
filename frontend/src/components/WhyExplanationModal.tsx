"use client";

import React from 'react';
import { AllocationItem } from '../types';
import { HelpCircle, CheckCircle2, Sprout, Sun, CloudRain, ShieldCheck } from 'lucide-react';

interface WhyExplanationModalProps {
  item: AllocationItem | null;
  onClose: () => void;
}

export const WhyExplanationModal: React.FC<WhyExplanationModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-emerald-950 border border-emerald-700/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Why this Water Requirement?</h3>
              <p className="text-xs text-emerald-300">
                {item.farmer_name} — {item.crop_name} ({item.area_acres} acres)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-emerald-400 hover:text-white font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Calculation Total */}
        <div className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-700 flex justify-between items-center">
          <div>
            <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">Estimated Need</span>
            <span className="text-3xl font-black text-cyan-300">{item.required_liters.toLocaleString()} L</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-300 font-bold uppercase tracking-wider block">Allocated</span>
            <span className="text-2xl font-black text-emerald-200">{item.allocated_liters.toLocaleString()} L</span>
          </div>
        </div>

        {/* Reasoning Factor List */}
        <div className="space-y-3">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">
            Calculation Factors (PRD Section 6):
          </span>
          <div className="space-y-2">
            {item.reasoning.map((reason, idx) => (
              <div key={idx} className="p-3 bg-emerald-900/30 rounded-xl border border-emerald-800/40 text-xs text-emerald-100 flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-emerald-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
};
