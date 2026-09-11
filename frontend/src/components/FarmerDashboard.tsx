"use client";

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AllocationResult, Farm, AllocationItem } from '../types';
import { Droplets, Clock, AlertTriangle, CheckCircle2, HelpCircle, MessageSquarePlus, ChevronRight, Sprout, Sun, ShieldCheck } from 'lucide-react';

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
      <div className="p-8 text-center bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] my-8">
        <Droplets className="h-10 w-10 text-[var(--color-canal)] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Loading Water Allocation Data...</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Estimating farm requirements and running OR-Tools optimizer.</p>
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
      
      {/* Farmer Selection Bar */}
      <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Soil color avatar identity */}
          <div className="h-10 w-10 rounded-lg bg-[var(--color-soil)] text-white flex items-center justify-center shrink-0">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] font-semibold block uppercase tracking-wider">
              Select Farmer Profile:
            </label>
            <select
              value={currentAllocationItem.farm_id}
              onChange={(e) => setSelectedFarmId(Number(e.target.value))}
              className="bg-transparent text-[var(--color-text-primary)] font-bold text-base sm:text-lg focus:outline-none cursor-pointer pr-4"
            >
              {allocation.allocations.map(item => (
                <option key={item.farm_id} value={item.farm_id} className="bg-white text-[var(--color-text-primary)]">
                  👨‍🌾 {item.farmer_name} — {item.crop_name} ({item.area_acres} acres)
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onOpenAddFarmModal}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[var(--color-canal)] hover:bg-[var(--color-canal-hover)] text-white text-xs font-bold transition flex items-center justify-center space-x-1.5"
        >
          <span>+ Add New Farm</span>
        </button>
      </div>

      {/* Main Farmer Water Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Card 1: Estimated Water Requirement */}
        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-canal)] bg-[var(--color-canal)]/10 px-2.5 py-1 rounded border border-[var(--color-canal)]/20">
                {t('waterNeedTitle')}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] font-medium flex items-center gap-1">
                <Sun className="h-3.5 w-3.5 text-[var(--color-wheat)]" /> 32.5°C Warm
              </span>
            </div>

            <div className="my-4">
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">{t('estimatedNeed')}</p>
              <div className="flex items-baseline space-x-2 my-1">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--color-text-primary)]">
                  {reqLiters.toLocaleString()}
                </span>
                <span className="text-base text-[var(--color-text-secondary)] font-bold">{t('liters')}</span>
              </div>
            </div>

            {/* Farm Metadata Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--color-surface-subtle)] rounded-lg border border-[var(--color-border)] text-xs my-4">
              <div>
                <span className="text-[var(--color-text-secondary)] block text-[10px] uppercase font-bold">{t('crop')}</span>
                <span className="text-[var(--color-text-primary)] font-semibold">{currentAllocationItem.crop_name}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)] block text-[10px] uppercase font-bold">{t('growthStage')}</span>
                <span className="text-[var(--color-text-primary)] font-semibold">{currentAllocationItem.growth_stage}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-secondary)] block text-[10px] uppercase font-bold">{t('soilType')}</span>
                <span className="text-[var(--color-text-primary)] font-semibold">{activeFarm?.soil_type || 'Clay'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenWhyModal(currentAllocationItem)}
            className="w-full py-2.5 px-4 rounded-lg bg-[var(--color-surface-subtle)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] text-xs font-bold flex items-center justify-center space-x-2 border border-[var(--color-border)] transition mt-2"
          >
            <HelpCircle className="h-4 w-4 text-[var(--color-canal)]" />
            <span>{t('whyThisAmount')}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 2: Shared Canal Water Situation & Proposed Allocation */}
        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-dispute)] bg-[var(--color-dispute-bg)] px-2.5 py-1 rounded border border-[var(--color-dispute)]/20 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t('waterSituationTitle')}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] font-semibold bg-[var(--color-surface-subtle)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                {allocation.version > 1 ? `Revision v${allocation.version}` : 'Initial Plan'}
              </span>
            </div>

            {/* Supply vs Demand Meter */}
            <div className="space-y-2.5 my-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[var(--color-canal)]">{t('availableSupply')}: {allocation.available_volume_liters.toLocaleString()} L</span>
                <span className="text-[var(--color-dispute)]">{t('totalDemand')}: {allocation.total_demand_liters.toLocaleString()} L</span>
              </div>

              <div className="h-3 w-full bg-[var(--color-surface-subtle)] rounded-full border border-[var(--color-border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-canal)]"
                  style={{ width: `${Math.min((allocation.available_volume_liters / allocation.total_demand_liters) * 100, 100)}%` }}
                />
              </div>

              {/* Scarcity Alert Message */}
              <div className="p-3 bg-[var(--color-dispute-bg)] rounded-lg border border-[var(--color-dispute)]/30 text-xs text-[var(--color-text-primary)]">
                <strong className="text-[var(--color-dispute)]">⚠️ {t('waterShortage')}:</strong> {allocation.shortage_liters.toLocaleString()} L ({shortagePct}% deficit).
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{t('conflictNotice')}</p>
              </div>
            </div>

            {/* Allocation Outcome Box */}
            <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl border border-[var(--color-border)] mt-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">{t('yourAllocation')}</span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-[var(--color-wheat)]">
                      {allocLiters.toLocaleString()}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)] font-bold">{t('liters')}</span>
                  </div>
                  {unmetLiters > 0 && (
                    <span className="text-xs text-[var(--color-dispute)] font-medium block mt-0.5">
                      (Shortage gap: {unmetLiters.toLocaleString()} L)
                    </span>
                  )}
                </div>

                {/* Fairness Score Badge */}
                <div className="text-right bg-[var(--color-agreement-bg)] p-2 rounded-lg border border-[var(--color-agreement)]/40">
                  <span className="text-[10px] text-[var(--color-agreement)] uppercase font-bold block">{t('fairnessScore')}</span>
                  <span className="text-xl font-black text-[var(--color-agreement)]">{fairness}/100</span>
                </div>
              </div>

              {/* Schedule Slot */}
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-primary)]">
                <div className="flex items-center space-x-1.5">
                  <Clock className="h-4 w-4 text-[var(--color-wheat)]" />
                  <span><strong>{t('timeSlot')}:</strong> Today {currentAllocationItem.schedule_start} – {currentAllocationItem.schedule_end}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] font-mono text-[11px]">
                  Canal Gate #1
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons Bar */}
      <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="h-5 w-5 text-[var(--color-agreement)] shrink-0" />
          <div className="text-xs">
            <span className="text-[var(--color-text-primary)] font-bold block">Deterministic OR-Tools Verification:</span>
            <span className="text-[var(--color-text-secondary)]">
              {allocation.optimization_status === 'OPTIMAL_HARD_CONSTRAINTS_SATISFIED'
                ? 'All hard capacity and fairness constraints verified.'
                : 'Dynamic allocation calculation active.'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Raise Objection Button (Alert / Dispute Action) */}
          <button
            onClick={() => onOpenObjectionModal(currentAllocationItem)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg bg-[var(--color-dispute)] hover:bg-[#962e24] text-white font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>{t('raiseObjection')}</span>
          </button>

          {/* Accept Allocation Button (Success / Agreement Action) */}
          <button
            onClick={() => onAcceptAllocation(allocation.version)}
            disabled={isAccepted}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 ${
              isAccepted
                ? 'bg-[var(--color-agreement-bg)] text-[var(--color-agreement)] border border-[var(--color-agreement)] cursor-not-allowed'
                : 'bg-[var(--color-agreement)] hover:bg-[#3e5f34] text-white'
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
