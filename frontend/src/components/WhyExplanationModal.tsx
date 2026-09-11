"use client";

import React from 'react';
import { AllocationItem, RequirementBreakdown } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { HelpCircle, CheckCircle2, Calculator } from 'lucide-react';

interface WhyExplanationModalProps {
  item: AllocationItem | null;
  breakdown: RequirementBreakdown | null;
  onClose: () => void;
}

const fmt = (n: number) => Math.round(n).toLocaleString();

export const WhyExplanationModal: React.FC<WhyExplanationModalProps> = ({ item, breakdown, onClose }) => {
  const { t } = useLanguage();
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-emerald-100 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-800 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t('whyThisAmount')}</h3>
              <p className="text-xs text-emerald-700 font-medium">
                {item.farmer_name} — {item.crop_name} ({item.area_acres} {t('acres')})
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
            <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">{t('estimatedNeed')}</span>
            <span className="text-3xl font-black text-emerald-900">
              {(breakdown ? breakdown.final_estimated_liters : item.required_liters).toLocaleString()} L
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">{t('yourAllocation')}</span>
            <span className="text-2xl font-black text-emerald-700">{item.allocated_liters.toLocaleString()} L</span>
          </div>
        </div>

        {/* TRUE requirement breakdown (live from backend engine) */}
        {breakdown && (
          <div className="space-y-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5" />
              Requirement Calculation Factors
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">{t('base')}</span>
                <span className="font-extrabold text-slate-800">{fmt(breakdown.base_requirement_liters)} L</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-emerald-600 font-bold block text-[10px] uppercase">{t('stage')}</span>
                <span className="font-extrabold text-emerald-700">
                  {breakdown.growth_stage_adjustment_pct >= 0 ? '+' : ''}{Math.round(breakdown.growth_stage_adjustment_pct)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-amber-600 font-bold block text-[10px] uppercase">Weather</span>
                <span className="font-extrabold text-amber-700">
                  {breakdown.weather_adjustment_pct >= 0 ? '+' : ''}{Math.round(breakdown.weather_adjustment_pct)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-blue-600 font-bold block text-[10px] uppercase">Soil</span>
                <span className="font-extrabold text-blue-700">
                  {breakdown.soil_factor_adjustment_pct >= 0 ? '+' : ''}{Math.round(breakdown.soil_factor_adjustment_pct)}%
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-sky-600 font-bold block text-[10px] uppercase">Rain Forecast Credit</span>
                <span className="font-extrabold text-sky-700">−{fmt(breakdown.forecast_rainfall_deduction_liters)} L</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-bold block text-[10px] uppercase">Previous Irrigation Credit</span>
                <span className="font-extrabold text-slate-700">−{fmt(breakdown.previous_irrigation_deduction_liters)} L</span>
              </div>
            </div>
          </div>
        )}

        {/* Reasoning Factor List */}
        <div className="space-y-3">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
            {breakdown ? 'Engine Explanation' : 'Allocation Reasoning'}
          </span>
          <div className="space-y-2">
            {(breakdown?.explanation ?? item.reasoning).map((reason, idx) => (
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
