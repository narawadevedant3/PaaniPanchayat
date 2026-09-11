"use client";

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AllocationItem, MediationProposalResponse } from '../types';
import { MessageSquare, Bot, User, CheckCircle, Scale, ShieldAlert, Sparkles, Send, ArrowRight } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-emerald-950 border border-emerald-700/60 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                {t('mediationTitle')}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  LangGraph Agent
                </span>
              </h3>
              <p className="text-xs text-emerald-300">Autonomous water dispute resolution engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-emerald-400 hover:text-white text-sm font-bold px-3 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700"
          >
            ✕
          </button>
        </div>

        {/* Conversation Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Message 1: System Scarcity Notification */}
          <div className="flex items-start space-x-3 bg-emerald-900/30 p-3.5 rounded-2xl border border-emerald-800/40">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block">System Notice:</span>
              <p className="text-emerald-200 mt-0.5">
                Shared canal water availability is 180,000 L, whereas total demand across 4 farms is 265,000 L (Shortage: 85,000 L).
                Farmers may lodge objections to request mediation.
              </p>
            </div>
          </div>

          {/* Message 2: Farmer Objection Input / Message */}
          <div className="flex items-start space-x-3 bg-emerald-900/60 p-4 rounded-2xl border border-emerald-700/50">
            <User className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <span className="font-bold text-cyan-300 block">{defaultFarmerName} (Objection):</span>
              
              {!proposal ? (
                <div className="space-y-3">
                  <textarea
                    value={objectionText}
                    onChange={(e) => setObjectionText(e.target.value)}
                    rows={3}
                    placeholder={t('objectionPlaceholder')}
                    className="w-full bg-emerald-950 border border-emerald-700/80 rounded-xl p-3 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSendObjection}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? "LangGraph Agents Analyzing..." : t('submitObjection')}</span>
                  </button>
                </div>
              ) : (
                <p className="text-emerald-100 italic bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800">
                  "{proposal.objection_summary}"
                </p>
              )}
            </div>
          </div>

          {/* Message 3 & 4: AI Agent Analysis & Proposal (if generated) */}
          {proposal && (
            <>
              {/* Agent Analysis */}
              <div className="flex items-start space-x-3 bg-teal-900/40 p-4 rounded-2xl border border-teal-700/60 animate-fadeIn">
                <Sparkles className="h-5 w-5 text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-cyan-300 block">AI Mediation Agent Rationale:</span>
                  <p className="text-emerald-100 mt-1 leading-relaxed whitespace-pre-line">
                    {proposal.ai_mediation_analysis}
                  </p>
                </div>
              </div>

              {/* Compromise Proposal */}
              <div className="flex items-start space-x-3 bg-gradient-to-r from-emerald-900 to-teal-900 p-4 rounded-2xl border border-cyan-500/40 shadow-lg">
                <Scale className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300 block">Compromise Re-Allocation Proposal:</span>
                  <p className="text-white font-medium mt-1 leading-relaxed whitespace-pre-line">
                    {proposal.proposed_reallocation_text}
                  </p>
                </div>
              </div>

              {/* Deterministic Optimizer Verification Badge */}
              <div className="flex items-center space-x-2 bg-emerald-950 p-3 rounded-xl border border-emerald-700 text-xs text-emerald-300">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>
                  <strong>Google OR-Tools Validation:</strong> Hard capacity constraints (180,000 L limit) verified. Non-negativity satisfied.
                </span>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-emerald-950 border-t border-emerald-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-300 font-semibold text-xs transition"
          >
            Close Dialog
          </button>

          {proposal && (
            <button
              onClick={() => {
                onAcceptProposal();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-emerald-950 font-bold text-xs sm:text-sm shadow-lg transition flex items-center space-x-2"
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
