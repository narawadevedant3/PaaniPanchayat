"use client";

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AllocationResult, Farm, AllocationItem, AuthUser } from '../types';
import { Droplets, Calendar, Clock, CheckCircle2, HelpCircle, MessageSquarePlus, ChevronRight, Sprout, Sun, Home, User, MessageSquare } from 'lucide-react';

interface FarmerDashboardProps {
  allocation: AllocationResult | null;
  farms: Farm[];
  selectedFarmId: number;
  setSelectedFarmId: (id: number) => void;
  onOpenWhyModal: (item: AllocationItem) => void;
  onOpenObjectionModal: (item: AllocationItem) => void;
  onAcceptAllocation: (version: number, farmId?: number) => void;
  onOpenAddFarmModal: () => void;
  isAccepted: boolean;
  acceptedFarmIds?: number[];
  authUser?: AuthUser | null;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  allocation,
  farms = [],
  selectedFarmId,
  setSelectedFarmId,
  onOpenWhyModal,
  onOpenObjectionModal,
  onAcceptAllocation,
  onOpenAddFarmModal,
  isAccepted,
  acceptedFarmIds = [],
  authUser
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'home' | 'farm' | 'water' | 'mediation' | 'profile'>('home');
  const [cooldown, setCooldown] = useState<{ can_request: boolean; message?: string; hours_remaining?: number; days_remaining?: number } | null>(null);

  const API_BASE = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000/api` : "http://127.0.0.1:8000/api";

  React.useEffect(() => {
    if (selectedFarmId) {
      fetch(`${API_BASE}/water-request/cooldown?farm_id=${selectedFarmId}${authUser?.user_id ? `&user_id=${authUser.user_id}` : ''}`)
        .then(res => res.json())
        .then(data => setCooldown(data))
        .catch(err => console.log(err));
    }
  }, [selectedFarmId, authUser]);

  if (!allocation || !allocation.allocations || allocation.allocations.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-emerald-100 shadow-sm my-8">
        <Droplets className="h-12 w-12 text-emerald-600 mx-auto animate-bounce mb-3" />
        <h3 className="text-xl font-bold text-slate-900">Loading Water Allocation Data...</h3>
        <p className="text-sm text-slate-600 mt-1">Estimating farm requirements and running OR-Tools optimizer.</p>
      </div>
    );
  }

  // Helper to match farmer allocations strictly to logged in user profile by user_id or email
  const matchFarmerAllocation = (item: AllocationItem, user: AuthUser | null | undefined) => {
    if (!user) return true;

    // 1. Direct user_id match
    if (item.user_id && user.user_id && item.user_id === user.user_id) {
      return true;
    }

    // 2. Direct email match
    const userEmail = user.email ? user.email.toLowerCase().trim() : '';
    const itemEmail = item.user_email ? item.user_email.toLowerCase().trim() : '';
    if (itemEmail && userEmail && itemEmail === userEmail) {
      return true;
    }

    // 3. Email handle prefix match (e.g. "ramesh@paanipanchayat.org" matches "Ramesh (Farm A)")
    const cleanString = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanEmailPrefix = userEmail ? cleanString(userEmail.split('@')[0]) : '';
    const cleanItemOwner = cleanString(item.farmer_name);

    if (cleanEmailPrefix && cleanEmailPrefix.length > 2 && cleanItemOwner.includes(cleanEmailPrefix)) {
      return true;
    }

    // 4. Full user name containment match (e.g. user.name === "Ramesh")
    const cleanUserName = cleanString(user.name || '');
    if (cleanUserName && cleanUserName.length > 3 && cleanItemOwner.includes(cleanUserName)) {
      return true;
    }

    return false;
  };

  // Filter allocations to strictly show ONLY lands belonging to this logged-in farmer profile
  const myAllocations = allocation.allocations.filter(a => matchFarmerAllocation(a, authUser));

  // Show ONLY the latest active request for the farmer profile, hiding older requests from view (while keeping in DB)
  const displayedAllocations = myAllocations.length > 0 ? [myAllocations[myAllocations.length - 1]] : [];

  // Active farm selected dynamically in Farmer view
  const currentAllocationItem = displayedAllocations.find(a => a.farm_id === selectedFarmId) || displayedAllocations[0];

  const farmerGreetingName = authUser?.name || (currentAllocationItem ? currentAllocationItem.farmer_name : 'Farmer');

  // If logged in farmer has no registered farms in their profile yet
  if (displayedAllocations.length === 0 || !currentAllocationItem) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-24 font-sans text-slate-900">
        <div className="bg-emerald-700 text-white p-6 rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-white">Welcome, {farmerGreetingName}</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-100 font-semibold">
                Farmer Profile Active
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-1">No active water request found for profile: {authUser?.email}</p>
          </div>
          <button
            onClick={onOpenAddFarmModal}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition shadow-md flex items-center space-x-1.5"
          >
            <Droplets className="h-4 w-4 text-emerald-700" />
            <span>💧 Create Water Request</span>
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-emerald-100 text-center shadow-sm space-y-3">
          <Droplets className="h-12 w-12 text-emerald-600 mx-auto animate-pulse" />
          <h3 className="text-lg font-bold text-slate-900">No Active Water Request</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You are logged in as <strong>{authUser?.name}</strong>. Click <strong>&quot;💧 Create Water Request&quot;</strong> above to submit your crop stage and land details for OR-Tools canal allocation.
          </p>
        </div>
      </div>
    );
  }

  const reqLiters = currentAllocationItem.required_liters;
  const allocLiters = currentAllocationItem.allocated_liters;
  const fairness = currentAllocationItem.fairness_score;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 font-sans text-slate-900">

      {/* 3. Farmer Dashboard Header Card (Ref UI Screen 3) */}
      <div className="bg-emerald-700 text-white p-4 sm:p-6 rounded-3xl shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/20 p-0.5 flex items-center justify-center shrink-0">
            <div className="h-full w-full bg-white rounded-[14px] flex items-center justify-center">
              <Sprout className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-700" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white truncate">
                {language === 'mr' ? `नमस्कार, ${farmerGreetingName}` : language === 'hi' ? `नमस्ते, ${farmerGreetingName}` : `Welcome, ${farmerGreetingName}`}
              </h2>
              <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-100 font-semibold shrink-0">
                {currentAllocationItem.crop_name} ({currentAllocationItem.area_acres} Acres)
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5 truncate">
              Active Request: <strong>{currentAllocationItem.farmer_name}</strong> — {language === 'mr' ? 'शेताची माहिती व पाणी गरज खालीलप्रमाणे आहे.' : language === 'hi' ? 'खेत की जानकारी और पानी की आवश्यकता नीचे है।' : 'Active water request and allocations below.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-stretch md:justify-end">
          <button
            onClick={onOpenAddFarmModal}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1.5"
          >
            <Droplets className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>💧 Create Water Request</span>
          </button>
        </div>
      </div>      {/* Farm Switcher Tabs when multiple farms exist */}
      {allocation.allocations.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 shrink-0">{t('selectFarm')}</span>
          {allocation.allocations.map((item) => (
            <button
              key={item.farm_id}
              onClick={() => setSelectedFarmId(item.farm_id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border cursor-pointer ${
                item.farm_id === currentAllocationItem.farm_id
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🌾 {item.farmer_name} ({item.crop_name})
            </button>
          ))}
        </div>
      )}

      {/* Main Grid: Water Requirement Details & Allocation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 4. Water Requirement Details Card */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {t('waterNeedTitle')}
            </span>
            <span className="text-xs text-amber-700 font-medium flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <Sun className="h-3.5 w-3.5 text-amber-500" /> 32°C Warm & Dry
            </span>
          </div>

          <div className="my-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{t('estimatedNeed')}</p>
            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
                {reqLiters.toLocaleString()}
              </span>
              <span className="text-lg text-emerald-600 font-bold">{t('liters')}</span>
            </div>
          </div>

          {/* Breakdown Factor Adjustments */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs my-4">
            <div className="p-2.5 bg-white rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('base')}</span>
              <span className="text-sm font-extrabold text-slate-800">{Math.round(reqLiters / 1.18).toLocaleString()} L</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-slate-100">
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">{t('stage')}</span>
              <span className="text-sm font-extrabold text-emerald-700">+18% ({currentAllocationItem.growth_stage})</span>
            </div>
          </div>

          <button
            onClick={() => onOpenWhyModal(currentAllocationItem)}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-between border border-emerald-200 transition"
          >
            <span className="flex items-center space-x-2">
              <HelpCircle className="h-4 w-4 text-emerald-600" />
              <span>{t('whyThisAmount')} (कारण पाहा)</span>
            </span>
            <ChevronRight className="h-4 w-4 text-emerald-600" />
          </button>
        </div>

        {/* 5. Allocation & Schedule Summary (Cleaned - Conflict Alert Removed) */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm relative flex flex-col justify-between">

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>सिंचन वाटप (Allocated Water)</span>
            </span>
            <span className="text-[11px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              v{allocation.version}
            </span>
          </div>

          {/* Shortage Stats Grid */}
          {allocation.shortage_liters > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center p-3 bg-rose-50/50 rounded-2xl border border-rose-100 my-2">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">{t('totalDemand')}</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900">{allocation.total_demand_liters.toLocaleString()} L</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-600 font-bold block">{t('availableSupply')}</span>
                <span className="text-sm sm:text-base font-extrabold text-blue-700">{allocation.available_volume_liters.toLocaleString()} L</span>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 font-bold block">{t('waterShortage')}</span>
                <span className="text-sm sm:text-base font-extrabold text-rose-600">{allocation.shortage_liters.toLocaleString()} L</span>
              </div>
            </div>
          )}
          {/* Outcome Allocation Summary */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 my-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">{t('yourAllocation')}</span>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-3xl font-black text-emerald-700">{allocLiters.toLocaleString()}</span>
                  <span className="text-xs text-slate-600 font-bold">{t('liters')}</span>
                </div>
              </div>
              <div className="text-right bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">{t('fairnessScore')}</span>
                <span className="text-xl font-black text-emerald-700">{fairness}/100</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/70 flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span><strong>{t('timeSlot')}:</strong> {currentAllocationItem.schedule_start} – {currentAllocationItem.schedule_end}</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-white text-emerald-800 font-mono text-[10px] border border-emerald-200 font-bold">Canal Turn Active</span>
            </div>
          </div>

        </div>

      </div>

      {/* 6 & 8. Allocation Matrix Table - Showing All Farms of Logged-In Farmer */}
      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900">{t('yourAllocationDetails')}</h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                OR-Tools Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Showing all registered farm parcels and water allocations for your account.</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              Your Fairness Rating: <strong>{currentAllocationItem.fairness_score}/100</strong>
            </span>
          </div>
        </div>

        {/* Allocations Table - All Farms of Logged-In Farmer */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[600px] text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">{t('farmer')}</th>
                <th className="p-3">{t('cropAndStage')}</th>
                <th className="p-3">{t('requestLiters')}</th>
                <th className="p-3">{t('allocatedLiters')}</th>
                <th className="p-3">{t('shortageLiters')}</th>
                <th className="p-3 text-right">{t('fairness')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedAllocations.map((item, idx) => (
                <tr
                  key={item.farm_id || idx}
                  onClick={() => setSelectedFarmId(item.farm_id)}
                  className={`cursor-pointer transition-colors ${item.farm_id === selectedFarmId
                      ? 'bg-emerald-50/70 font-semibold border-l-4 border-emerald-600'
                      : 'hover:bg-slate-50'
                    }`}
                >
                  <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                    <span>🌾 {item.farmer_name}</span>
                    {item.farm_id === selectedFarmId && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold">Active</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-700">
                    {item.crop_name} <span className="text-[10px] text-emerald-700">({item.growth_stage} — {item.area_acres} Acres)</span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{item.required_liters.toLocaleString()} L</td>
                  <td className="p-3 font-bold text-emerald-700 font-mono">{item.allocated_liters.toLocaleString()} L</td>
                  <td className="p-3 text-rose-600 font-mono">{item.unmet_liters.toLocaleString()} L</td>
                  <td className="p-3 text-right">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      {item.fairness_score}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* 9. Irrigation Schedule Timeline for Logged-In Farmer Only */}
      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">{t('yourIrrigationSchedule')}</h3>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            📅 {t('todaySlot')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3 flex flex-col sm:flex-row items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">💧</span>
                <span className="font-bold text-lg text-slate-900">{currentAllocationItem.farmer_name}</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                  {currentAllocationItem.crop_name} ({currentAllocationItem.growth_stage})
                </span>
                {allocation.cycle_number && allocation.cycle_number > 0 && (
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {t('cycle')} #{allocation.cycle_number}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-600 flex items-center space-x-2 my-2">
                <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-mono font-bold text-slate-900 text-base">
                  Today {currentAllocationItem.schedule_start} – {currentAllocationItem.schedule_end}
                </span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-6 pt-2 sm:pt-0">
              <span className="text-slate-500 text-xs font-bold uppercase block">Water Scheduled</span>
              <span className="font-black text-2xl text-emerald-700 font-mono">{currentAllocationItem.allocated_liters.toLocaleString()} L</span>
            </div>
          </div>
        </div>
      </div>

      {/* 10. Final Agreement & Audit Trail (Ref UI Screen 10) */}
      <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Agreement Status</span>
            <h4 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <span>
                {isAccepted || acceptedFarmIds.includes(currentAllocationItem.farm_id)
                  ? (language === 'mr' ? '✓ अंतिम करार पूर्ण (Accepted)' : language === 'hi' ? '✓ अंतिम समझौता पूर्ण (Accepted)' : '✓ Final Agreement Accepted')
                  : (language === 'mr' ? 'प्रस्तावित वाटप तयार आहे (Pending Confirmation)' : language === 'hi' ? 'प्रस्तावित आवंटन तैयार है (Pending Confirmation)' : 'Proposed Allocation Pending Confirmation')}
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">OR-Tools hard constraints verified with transparent AI audit log.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {cooldown && !cooldown.can_request && (
            <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center space-x-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>3-Day Policy Cooldown ({cooldown.hours_remaining}h left)</span>
            </div>
          )}

          <button
            onClick={() => onOpenObjectionModal(currentAllocationItem)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition flex items-center justify-center space-x-1.5"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>{t('raiseObjection')}</span>
          </button>

          <button
            onClick={() => onAcceptAllocation(allocation.version, currentAllocationItem.farm_id)}
            disabled={isAccepted || acceptedFarmIds.includes(currentAllocationItem.farm_id)}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center space-x-1.5 ${isAccepted || acceptedFarmIds.includes(currentAllocationItem.farm_id)
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isAccepted || acceptedFarmIds.includes(currentAllocationItem.farm_id) ? 'Accepted ✅' : t('acceptAllocation')}</span>
          </button>
        </div>
      </div>

      {/* Mobile App Navigation Bar (Bottom Navigation for Mobile View) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-4 py-2 flex items-center justify-around text-[10px] text-slate-600">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-emerald-700 font-bold' : ''}`}
        >
          <Home className="h-4 w-4" />
          <span>{language === 'mr' ? 'मुख्य पान' : language === 'hi' ? 'होम' : 'Home'}</span>
        </button>
        <button
          onClick={() => setActiveTab('farm')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'farm' ? 'text-emerald-700 font-bold' : ''}`}
        >
          <Sprout className="h-4 w-4" />
          <span>{t('farm')}</span>
        </button>
        <button
          onClick={() => setActiveTab('water')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'water' ? 'text-emerald-700 font-bold' : ''}`}
        >
          <Droplets className="h-4 w-4" />
          <span>{language === 'mr' ? 'पाणी' : language === 'hi' ? 'पानी' : 'Water'}</span>
        </button>
        <button
          onClick={() => onOpenObjectionModal(currentAllocationItem)}
          className="flex flex-col items-center space-y-1 text-amber-600 font-bold"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{language === 'mr' ? 'मध्यस्थी' : language === 'hi' ? 'मध्यस्थता' : 'Mediation'}</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'profile' ? 'text-emerald-700 font-bold' : ''}`}
        >
          <User className="h-4 w-4" />
          <span>{language === 'mr' ? 'प्रोफाइल' : language === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}</span>
        </button>
      </div>

    </div>
  );
};


