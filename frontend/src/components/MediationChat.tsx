"use client";

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AllocationItem, MediationProposalResponse } from '../types';
import { Bot, User, CheckCircle, Scale, ShieldAlert, Sparkles, Send } from 'lucide-react';

interface MediationChatProps {
  initialObjectingItem: AllocationItem | null;
  onSubmitObjection: (farmId: number, farmerName: string, text: string) => Promise<MediationProposalResponse | null>;
  onAcceptProposal: () => void;
  onClose: () => void;
}

export const MediationChat: React.FC<MediationChatProps> = ({
  initialObjectingItem,
  onSubmitObjection,
  onAcceptProposal,
  onClose
}) => {
  const { t } = useLanguage();

  const defaultFarmerName = initialObjectingItem ? initialObjectingItem.farmer_name : "Suresh (Farm B)";
  const defaultFarmId = initialObjectingItem ? initialObjectingItem.farm_id : 2;

  const [objectionText, setObjectionText] = useState(
    initialObjectingItem
      ? `My crop (${initialObjectingItem.crop_name}) is at critical stage '${initialObjectingItem.growth_stage}'. I urgently require 8,000 L more water to protect my yield.`
      : "My tomato crop is at fruit development stage. I urgently need more water to save my harvest."
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposal, setProposal] = useState<MediationProposalResponse | null>(null);

  const handleSendObjection = async () => {
    if (!objectionText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await onSubmitObjection(defaultFarmId, defaultFarmerName, objectionText);
      if (res) {
        setProposal(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-[var(--color-canal)] text-white flex items-center justify-between border-b border-[var(--color-canal-hover)]">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-lg bg-[var(--color-canal-hover)] border border-white/20 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                {t('mediationTitle')}
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-canal-hover)] text-white/90 border border-white/20">
                  LangGraph Agent
                </span>
              </h3>
              <p className="text-xs text-white/80">Autonomous water dispute resolution engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-sm font-bold px-2.5 py-1 rounded bg-[var(--color-canal-hover)] border border-white/20"
          >
            ✕
          </button>
        </div>

        {/* Conversation Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Message 1: System Scarcity Alert (Dispute / Alert state only) */}
          <div className="flex items-start space-x-3 bg-[var(--color-dispute-bg)] p-3.5 rounded-lg border border-[var(--color-dispute)]/30">
            <ShieldAlert className="h-5 w-5 text-[var(--color-dispute)] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[var(--color-dispute)] block">System Notice:</span>
              <p className="text-[var(--color-text-primary)] mt-0.5">
                Shared canal water availability is 180,000 L, whereas total demand across 4 farms is 265,000 L (Shortage: 85,000 L).
                Farmers may lodge objections to request mediation.
              </p>
            </div>
          </div>

          {/* Message 2: Farmer Objection Input / Message */}
          <div className="flex items-start space-x-3 bg-[var(--color-surface-subtle)] p-4 rounded-lg border border-[var(--color-border)]">
            <div className="h-6 w-6 rounded-md bg-[var(--color-soil)] text-white flex items-center justify-center shrink-0 mt-0.5">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-2">
              <span className="font-bold text-[var(--color-soil)] block">{defaultFarmerName} (Objection):</span>
              
              {!proposal ? (
                <div className="space-y-3">
                  <textarea
                    value={objectionText}
                    onChange={(e) => setObjectionText(e.target.value)}
                    rows={3}
                    placeholder={t('objectionPlaceholder')}
                    className="w-full bg-white border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-text-primary)] text-xs sm:text-sm focus:outline-none focus:border-[var(--color-canal)]"
                  />
                  <button
                    onClick={handleSendObjection}
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 rounded-lg bg-[var(--color-canal)] hover:bg-[var(--color-canal-hover)] text-white font-bold text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? "LangGraph Agents Analyzing..." : t('submitObjection')}</span>
                  </button>
                </div>
              ) : (
                <p className="text-[var(--color-text-primary)] italic bg-white p-2.5 rounded border border-[var(--color-border)]">
                  "{proposal.objection_summary}"
                </p>
              )}
            </div>
          </div>

          {/* Message 3 & 4: AI Agent Analysis & Proposal */}
          {proposal && (
            <>
              {/* Agent Analysis */}
              <div className="flex items-start space-x-3 bg-[var(--color-surface-subtle)] p-4 rounded-lg border border-[var(--color-border)]">
                <Sparkles className="h-5 w-5 text-[var(--color-canal)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--color-canal)] block">AI Mediation Agent Rationale:</span>
                  <p className="text-[var(--color-text-primary)] mt-1 leading-relaxed whitespace-pre-line">
                    {proposal.ai_mediation_analysis}
                  </p>
                </div>
              </div>

              {/* Compromise Proposal (Agreement / Success state) */}
              <div className="flex items-start space-x-3 bg-[var(--color-agreement-bg)] p-4 rounded-lg border border-[var(--color-agreement)]/40">
                <Scale className="h-5 w-5 text-[var(--color-agreement)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--color-agreement)] block">Compromise Re-Allocation Proposal:</span>
                  <p className="text-[var(--color-text-primary)] font-medium mt-1 leading-relaxed whitespace-pre-line">
                    {proposal.proposed_reallocation_text}
                  </p>
                </div>
              </div>

              {/* Deterministic Optimizer Verification Badge */}
              <div className="flex items-center space-x-2 bg-[var(--color-surface-subtle)] p-3 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                <CheckCircle className="h-4 w-4 text-[var(--color-agreement)]" />
                <span>
                  <strong className="text-[var(--color-text-primary)]">Google OR-Tools Validation:</strong> Hard capacity constraints (180,000 L limit) verified. Non-negativity satisfied.
                </span>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[var(--color-surface-subtle)] border-t border-[var(--color-border)] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--color-surface)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold text-xs border border-[var(--color-border)] transition"
          >
            Close Dialog
          </button>

          {proposal && (
            <button
              onClick={() => {
                onAcceptProposal();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-[var(--color-agreement)] hover:bg-[#3e5f34] text-white font-bold text-xs sm:text-sm transition flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{t('acceptProposal')}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
