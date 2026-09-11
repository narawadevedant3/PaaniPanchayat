"use client";

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AllocationResult, Farm, AllocationItem } from '../types';
import { Droplets, Calendar, Clock, AlertTriangle, Scale, CheckCircle2, HelpCircle, MessageSquarePlus, ChevronRight, Sprout, Sun, CloudRain, ShieldCheck } from 'lucide-react';

interface FarmerDashboardProps {
  allocation: AllocationResult | null;
  farms: Farm[];
  selectedFarmId: number;
  setSelectedFarmId: (id: number) => void;
  onOpenWhyModal: (item: AllocationItem) => void;
  onOpenObjectionModal: (item: AllocationItem) => void;
  onAcceptAllocation: (version: number) => void;
  onOpenAddFarmModal: () => void;
  isAccepted: boolean;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  allocation,
  farms,
  selectedFarmId,
  setSelectedFarmId,
  onOpenWhyModal,
  onOpenObjectionModal,
  onAcceptAllocation,
  onOpenAddFarmModal,
  isAccepted
}) => {
  const { t } = useLanguage();

  if (!allocation || !allocation.allocations || allocation.allocations.length === 0) {
    return (
      <div className="p-8 text-center bg-emerald-950/40 rounded-2xl border border-emerald-800/40 my-8">
        <Droplets className="h-12 w-12 text-cyan-400 mx-auto animate-bounce mb-3" />
        <h3 className="text-xl font-bold text-white">Loading Water Allocation Data...</h3>
        <p className="text-sm text-emerald-300 mt-1">Estimating farm requirements and running OR-Tools optimizer.</p>
      </div>
    );
  }

  // Active farm selected in Farmer view
  const currentAllocationItem = allocation.allocations.find(a => a.farm_id === selectedFarmId) || allocation.allocations[0];
  const activeFarm = farms.find(f => f.id === currentAllocationItem.farm_id);

  const reqLiters = currentAllocationItem.required_liters;
  const allocLiters = currentAllocationItem.allocated_liters;
  const unmetLiters = currentAllocationItem.unmet_liters;
  const fairness = currentAllocationItem.fairness_score;

  const shortagePct = Math.round((allocation.shortage_liters / allocation.total_demand_liters) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Logged-in Farmer Header */}
      <div className="bg-emerald-900/40 backdrop-blur-md p-4 rounded-2xl border border-emerald-700/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <Sprout className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Logged In Farmer</span>
            <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
              <span>👨‍🌾 {currentAllocationItem.farmer_name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-cyan-300 font-medium border border-emerald-600/40">
                {currentAllocationItem.crop_name} ({currentAllocationItem.area_acres} Acres)
              </span>
            </h2>
          </div>
        </div>

        <button
          onClick={onOpenAddFarmModal}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-md flex items-center justify-center space-x-1.5"
        >
          <span>+ Add New Farm</span>
        </button>
      </div>

      {/* Main Farmer Water Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Card 1: Estimated Water Requirement */}
        <div className="bg-gradient-to-br from-emerald-900/60 to-teal-950/80 backdrop-blur-md p-6 rounded-3xl border border-emerald-700/50 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition">
            <Droplets className="h-32 w-32 text-cyan-300" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              {t('waterNeedTitle')}
            </span>
            <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
              <Sun className="h-3.5 w-3.5 text-amber-400" /> 32.5°C Warm
            </span>
          </div>

          <div className="my-4">
            <p className="text-sm text-emerald-200">{t('estimatedNeed')}</p>
            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                {reqLiters.toLocaleString()}
              </span>
              <span className="text-lg text-cyan-300 font-bold">{t('liters')}</span>
            </div>
          </div>

          {/* Quick Farm Metadata */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-emerald-950/60 rounded-xl border border-emerald-800/40 text-xs my-4">
            <div>
              <span className="text-emerald-400 block text-[10px] uppercase font-bold">{t('crop')}</span>
              <span className="text-white font-semibold">{currentAllocationItem.crop_name}</span>
            </div>
            <div>
              <span className="text-emerald-400 block text-[10px] uppercase font-bold">{t('growthStage')}</span>
              <span className="text-white font-semibold">{currentAllocationItem.growth_stage}</span>
            </div>
            <div>
              <span className="text-emerald-400 block text-[10px] uppercase font-bold">{t('soilType')}</span>
              <span className="text-white font-semibold">{activeFarm?.soil_type || 'Clay'}</span>
            </div>
          </div>

          <button
            onClick={() => onOpenWhyModal(currentAllocationItem)}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-100 text-xs font-bold flex items-center justify-center space-x-2 border border-emerald-600/30 transition"
          >
            <HelpCircle className="h-4 w-4 text-cyan-400" />
            <span>{t('whyThisAmount')}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 2: Shared Canal Water Conflict Status */}
        <div className="bg-gradient-to-br from-slate-900/70 to-emerald-950/90 backdrop-blur-md p-6 rounded-3xl border border-amber-700/40 shadow-xl relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              {t('waterSituationTitle')}
            </span>
            <span className="text-xs text-amber-200 font-semibold bg-amber-900/40 px-2 py-0.5 rounded">
              {allocation.version > 1 ? `Revision v${allocation.version}` : 'Initial Plan'}
            </span>
          </div>

          {/* Available vs Demand Progress Meter */}
          <div className="space-y-3 my-4">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-300">{t('availableSupply')}: {allocation.available_volume_liters.toLocaleString()} L</span>
              <span className="text-amber-300">{t('totalDemand')}: {allocation.total_demand_liters.toLocaleString()} L</span>
            </div>

            <div className="h-4 w-full bg-emerald-950 rounded-full p-0.5 border border-emerald-800 relative overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-amber-500 transition-all duration-700"
                style={{ width: `${Math.min((allocation.available_volume_liters / allocation.total_demand_liters) * 100, 100)}%` }}
              />
            </div>

            <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-800/40 text-xs text-amber-200 leading-relaxed">
              <strong>⚠️ {t('waterShortage')}:</strong> {allocation.shortage_liters.toLocaleString()} L ({shortagePct}% deficit).
              <p className="text-[11px] text-amber-300/80 mt-0.5">{t('conflictNotice')}</p>
            </div>
          </div>

          {/* Allocation Outcome Box */}
          <div className="bg-emerald-950/80 p-4 rounded-2xl border border-emerald-700/60 mt-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{t('yourAllocation')}</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-cyan-300">
                    {allocLiters.toLocaleString()}
                  </span>
                  <span className="text-sm text-emerald-200 font-bold">{t('liters')}</span>
                </div>
                {unmetLiters > 0 && (
                  <span className="text-xs text-amber-400 font-medium block mt-0.5">
                    (Shortage gap: {unmetLiters.toLocaleString()} L)
                  </span>
                )}
              </div>

              {/* Fairness Score Badge */}
              <div className="text-right bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/50">
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">{t('fairnessScore')}</span>
                <span className="text-2xl font-black text-emerald-200">{fairness}/100</span>
              </div>
            </div>

            {/* Schedule Slot */}
            <div className="mt-4 pt-3 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-200">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span><strong>{t('timeSlot')}:</strong> Today {currentAllocationItem.schedule_start} – {currentAllocationItem.schedule_end}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[11px]">Canal Gate #1</span>
            </div>
          </div>

        </div>

      </div>

      {/* Action Buttons Bar */}
      <div className="bg-emerald-950/60 backdrop-blur-md p-5 rounded-2xl border border-emerald-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="h-6 w-6 text-cyan-400 shrink-0" />
          <div className="text-xs">
            <span className="text-white font-bold block">Deterministic OR-Tools Verification:</span>
            <span className="text-emerald-300">
              {allocation.optimization_status === 'OPTIMAL_HARD_CONSTRAINTS_SATISFIED'
                ? '✅ All hard capacity and fairness constraints verified.'
                : '⚠️ Dynamic allocation in progress.'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Raise Objection Button */}
          <button
            onClick={() => onOpenObjectionModal(currentAllocationItem)}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/50 transition flex items-center justify-center space-x-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>{t('raiseObjection')}</span>
          </button>

          {/* Accept Allocation Button */}
          <button
            onClick={() => onAcceptAllocation(allocation.version)}
            disabled={isAccepted}
            className={`flex-1 sm:flex-initial px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition flex items-center justify-center space-x-2 ${
              isAccepted
                ? 'bg-emerald-800 text-emerald-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-emerald-950'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isAccepted ? 'Agreement Accepted ✅' : t('acceptAllocation')}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
