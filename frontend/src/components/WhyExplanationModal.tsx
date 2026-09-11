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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-emerald-100 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Why this Water Requirement?</h3>
              <p className="text-xs text-emerald-700 font-medium">
                {item.farmer_name} — {item.crop_name} ({item.area_acres} acres)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Calculation Total */}
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 flex justify-between items-center">
          <div>
            <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">Estimated Need</span>
            <span className="text-3xl font-black text-emerald-900">{item.required_liters.toLocaleString()} L</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">Allocated</span>
            <span className="text-2xl font-black text-emerald-700">{item.allocated_liters.toLocaleString()} L</span>
          </div>
        </div>

        {/* Reasoning Factor List */}
        <div className="space-y-3">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
            Calculation Factors (PRD Section 6):
          </span>
          <div className="space-y-2">
            {item.reasoning.map((reason, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-sm"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
};
