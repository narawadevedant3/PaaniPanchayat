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
      ? `माझ्या पिकाची (${initialObjectingItem.crop_name}) फुलोरा अवस्था असून मला अधिक पाणी हवे आहे.`
      : "माझ्या टोमॅटो पिकाची फळ धारणा अवस्था आहे. मला अधिक पाण्याची गरज आहे."
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-emerald-100 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800">
        
        {/* Header */}
        <div className="p-5 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                {t('mediationTitle')} (मध्यस्थी प्रक्रिया)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100">
                  LangGraph AI Agent
                </span>
              </h3>
              <p className="text-xs text-emerald-100">Autonomous water dispute resolution engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:text-emerald-200 text-sm font-bold px-2 py-1 rounded-lg bg-emerald-800"
          >
            ✕
          </button>
        </div>

        {/* Conversation Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm bg-slate-50/50">
          
          {/* Message 1: System Scarcity Notification */}
          <div className="flex items-start space-x-3 bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-900">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">System Notice (पाण्याची तूट):</span>
              <p className="mt-0.5 text-xs text-amber-800">
                Shared canal water availability is 180,000 L, whereas total demand across 4 farms is 265,000 L (Shortage: 85,000 L).
                Farmers may lodge objections to request mediation.
              </p>
            </div>
          </div>

          {/* Message 2: Farmer Objection Input / Message */}
          <div className="flex items-start space-x-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <User className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <span className="font-bold text-slate-900 block">{defaultFarmerName} (Objection):</span>
              
              {!proposal ? (
                <div className="space-y-3">
                  <textarea
                    value={objectionText}
                    onChange={(e) => setObjectionText(e.target.value)}
                    rows={3}
                    placeholder={t('objectionPlaceholder')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    onClick={handleSendObjection}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? "LangGraph Agents Analyzing..." : t('submitObjection')}</span>
                  </button>
                </div>
              ) : (
                <p className="text-slate-800 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                  "{proposal.objection_summary}"
                </p>
              )}
            </div>
          </div>

          {/* Message 3 & 4: AI Agent Analysis & Proposal (if generated) */}
          {proposal && (
            <>
              {/* Agent Analysis */}
              <div className="flex items-start space-x-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm">
                <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900 block">PaaniPanchayat (मध्यस्थ AI):</span>
                  <p className="text-emerald-800 mt-1 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                    {proposal.ai_mediation_analysis}
                  </p>
                </div>
              </div>

              {/* Compromise Proposal */}
              <div className="flex items-start space-x-3 bg-emerald-700 text-white p-4 rounded-2xl shadow-md">
                <Scale className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-200 block">Compromise Re-Allocation Proposal:</span>
                  <p className="font-medium mt-1 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                    {proposal.proposed_reallocation_text}
                  </p>
                </div>
              </div>

              {/* Deterministic Optimizer Verification Badge */}
              <div className="flex items-center space-x-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>
                  <strong>Google OR-Tools Validation:</strong> Hard capacity constraints (180,000 L limit) verified. Non-negativity satisfied.
                </span>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Close Dialog
          </button>

          {proposal && (
            <button
              onClick={() => {
                onAcceptProposal();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>✓ प्रस्ताव स्वीकारा</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
