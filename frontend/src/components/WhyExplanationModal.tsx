"use client";

import React from 'react';
import { AllocationItem } from '../types';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

interface WhyExplanationModalProps {
  item: AllocationItem | null;
  onClose: () => void;
}

export const WhyExplanationModal: React.FC<WhyExplanationModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl max-w-xl w-full p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[var(--color-canal)]/10 text-[var(--color-canal)] border border-[var(--color-canal)]/20">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Why this Water Requirement?</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {item.farmer_name} — {item.crop_name} ({item.area_acres} acres)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Calculation Total Banner */}
        <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl border border-[var(--color-border)] flex justify-between items-center">
          <div>
            <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider block">Estimated Need</span>
            <span className="text-2xl font-black text-[var(--color-text-primary)]">{item.required_liters.toLocaleString()} L</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider block">Allocated</span>
            <span className="text-2xl font-black text-[var(--color-wheat)]">{item.allocated_liters.toLocaleString()} L</span>
          </div>
        </div>

        {/* Reasoning Factor List */}
        <div className="space-y-2.5">
          <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider block">
            Calculation Factors (PRD Section 6):
          </span>
          <div className="space-y-2">
            {item.reasoning.map((reason, idx) => (
              <div key={idx} className="p-3 bg-[var(--color-surface-subtle)] rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-canal)] shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--color-border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--color-canal)] hover:bg-[var(--color-canal-hover)] text-white font-bold text-xs transition"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
};
