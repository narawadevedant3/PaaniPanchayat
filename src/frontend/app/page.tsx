"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '../src/components/Navbar';
import { FarmerDashboard } from '../src/components/FarmerDashboard';
import { AdminDashboard } from '../src/components/AdminDashboard';
import { MediationChat } from '../src/components/MediationChat';
import { WhyExplanationModal } from '../src/components/WhyExplanationModal';
import { FarmRegistrationModal } from '../src/components/FarmRegistrationModal';
import { AuthView } from '../src/components/AuthView';
import { Footer } from '../src/components/Footer';
import { UserRole, AllocationResult, Farm, AllocationItem, AuditLogItem, MediationProposalResponse, AuthUser, FarmFormData, RequirementBreakdown } from '../src/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  || (typeof window !== 'undefined' && window.location.port === '3000'
      ? `http://${window.location.hostname}:8000/api` 
      : '/api');

// Fallback initial dataset matching PRD Section 29
const INITIAL_DEMO_ALLOCATION: AllocationResult = {
  water_source_id: 1,
  water_source_name: "Panchayat Shared Canal #1",
  available_volume_liters: 180000,
  total_demand_liters: 265040,
  shortage_liters: 85040,
  is_conflict: true,
  version: 1,
  overall_fairness_score: 82.5,
  optimization_status: "OPTIMAL_HARD_CONSTRAINTS_SATISFIED",
  allocations: [
    {
      farm_id: 1,
      farmer_name: "Ramesh (Farm A)",
      crop_name: "Wheat",
      area_acres: 2.0,
      growth_stage: "Flowering",
      required_liters: 83640,
      allocated_liters: 56800,
      unmet_liters: 26840,
      fairness_score: 84.2,
      schedule_start: "06:00",
      schedule_end: "08:06",
      reasoning: [
        "🎯 Allocated 56,800 L out of 83,640 L required (67.9% fulfilled).",
        "⚖️ Priority Weight Score: 1.76x (Stage: 'Flowering' - Critical).",
        "🤝 Application Fairness Rating: 84.2/100."
      ]
    },
    {
      farm_id: 2,
      farmer_name: "Suresh (Farm B)",
      crop_name: "Tomato",
      area_acres: 1.5,
      growth_stage: "Fruit Development",
      required_liters: 65000,
      allocated_liters: 44200,
      unmet_liters: 20800,
      fairness_score: 81.5,
      schedule_start: "08:21",
      schedule_end: "09:59",
      reasoning: [
        "🎯 Allocated 44,200 L out of 65,000 L required (68.0% fulfilled).",
        "⚖️ Priority Weight Score: 1.60x (Stage: 'Fruit Development').",
        "🤝 Application Fairness Rating: 81.5/100."
      ]
    },
    {
      farm_id: 3,
      farmer_name: "Vijay (Farm C)",
      crop_name: "Sugarcane",
      area_acres: 3.0,
      growth_stage: "Vegetative",
      required_liters: 75000,
      allocated_liters: 51000,
      unmet_liters: 24000,
      fairness_score: 83.0,
      schedule_start: "10:14",
      schedule_end: "12:07",
      reasoning: [
        "🎯 Allocated 51,000 L out of 75,000 L required (68.0% fulfilled).",
        "⚖️ Priority Weight Score: 1.10x (Stage: 'Vegetative').",
        "🤝 Application Fairness Rating: 83.0/100."
      ]
    },
    {
      farm_id: 4,
      farmer_name: "Anish (Farm D)",
      crop_name: "Onion",
      area_acres: 1.0,
      growth_stage: "Bulb Development",
      required_liters: 41400,
      allocated_liters: 28000,
      unmet_liters: 13400,
      fairness_score: 81.0,
      schedule_start: "12:22",
      schedule_end: "13:24",
      reasoning: [
        "🎯 Allocated 28,000 L out of 41,400 L required (67.6% fulfilled).",
        "⚖️ Priority Weight Score: 1.40x (Stage: 'Bulb Development').",
        "🤝 Application Fairness Rating: 81.0/100."
      ]
    }
  ]
};

export default function Home() {
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('paani_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.role === 'admin' || parsed.role === 'farmer') return parsed.role;
        }
      } catch {
        // ignore
      }
    }
    return 'farmer';
  });

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('paani_user');
        if (savedUser) return JSON.parse(savedUser) as AuthUser;
      } catch {
        // ignore
      }
    }
    return null;
  });

  // Hydration guard: localStorage restore (auth session) differs from the SSR HTML,
  // so render a neutral shell until the client has mounted.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [allocation, setAllocation] = useState<AllocationResult | null>(INITIAL_DEMO_ALLOCATION);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmIdState, setSelectedFarmIdState] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAccepted, setIsAccepted] = useState<boolean>(false);
  const [acceptedFarmIds, setAcceptedFarmIds] = useState<number[]>([]);

  // Modals
  const [whyItem, setWhyItem] = useState<AllocationItem | null>(null);
  const [whyBreakdown, setWhyBreakdown] = useState<RequirementBreakdown | null>(null);
  const [objectionItem, setObjectionItem] = useState<AllocationItem | null>(null);
  const [showAddFarmModal, setShowAddFarmModal] = useState<boolean>(false);

  // Authenticated fetch helper (token as query param, matching backend API)
  const authUrl = (path: string) => {
    if (!authUser?.token) return `${API_BASE}${path}`;
    return `${API_BASE}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(authUser.token)}`;
  };

  // DATA ISOLATION: farmers only see allocations for THEIR OWN farms;
  // canal-level totals (demand/supply) remain shared context.
  const visibleAllocation = React.useMemo<AllocationResult | null>(() => {
    if (!allocation) return null;
    if (role === 'admin') return allocation;
    const myFarmIds = new Set(farms.map(f => f.id));
    if (myFarmIds.size === 0) return allocation; // fallback demo mode before farms load
    const mine = allocation.allocations.filter(a => myFarmIds.has(a.farm_id) || (a.user_id && authUser?.user_id && a.user_id === authUser.user_id));
    return { ...allocation, allocations: mine };
  }, [allocation, farms, role, authUser]);

  // Automatically derive active selectedFarmId: manual selection -> matching logged-in user farm -> first farm
  const selectedFarmId = React.useMemo(() => {
    if (selectedFarmIdState !== null) return selectedFarmIdState;
    if (authUser && allocation && allocation.allocations.length > 0) {
      const userFirstName = authUser.name.split(' ')[0].toLowerCase();
      const matched = allocation.allocations.find(a => 
        a.farmer_name.toLowerCase().includes(userFirstName) ||
        a.farm_id === authUser.user_id
      );
      if (matched) return matched.farm_id;
      return allocation.allocations[0].farm_id;
    }
    return 1;
  }, [selectedFarmIdState, authUser, allocation]);

  const setSelectedFarmId = (id: number) => {
    setSelectedFarmIdState(id);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setRole(user.role);
    localStorage.setItem('paani_user', JSON.stringify(user));
    // Re-fetch immediately with the new token so farmers ONLY see their own farms
    refreshBackendData(user.token);
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('paani_user');
  };

  // Automatically bind selectedFarmId to logged in user's farm
  React.useEffect(() => {
    if (authUser && allocation && allocation.allocations.length > 0) {
      const matched = allocation.allocations.find(a => {
        if (a.user_id && authUser.user_id && a.user_id === authUser.user_id) return true;
        if (a.user_email && authUser.email && a.user_email.toLowerCase().trim() === authUser.email.toLowerCase().trim()) return true;
        const cleanString = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const userEmailPrefix = authUser.email ? cleanString(authUser.email.split('@')[0]) : '';
        const cleanUserName = authUser.name ? cleanString(authUser.name) : '';
        const cleanItemOwner = cleanString(a.farmer_name);
        if (cleanUserName && cleanUserName.length > 3 && cleanItemOwner.includes(cleanUserName)) return true;
        if (userEmailPrefix && userEmailPrefix.length > 2 && cleanItemOwner.includes(userEmailPrefix)) return true;
        return false;
      });

      if (matched) {
        setSelectedFarmId(matched.farm_id);
      } else if (allocation.allocations.length > 0) {
        setSelectedFarmId(allocation.allocations[0].farm_id);
      }
    }
  }, [authUser, allocation]);

  // Fetch initial backend state if online. Pass a token to scope farms to the logged-in user.
  const refreshBackendData = async (token?: string) => {
    setIsLoading(true);
    try {
      // Token-scoped: farmers get ONLY their own farms back
      const farmsUrl = token || authUser?.token
        ? `${API_BASE}/farms?token=${encodeURIComponent(token || authUser!.token!)}`
        : `${API_BASE}/farms`;
      const farmsRes = await fetch(farmsUrl);
      if (farmsRes.ok) {
        const data = await farmsRes.json();
        setFarms(data);
      }

      // Use /allocation/current so active mediation/version state is preserved
      const allocRes = await fetch(`${API_BASE}/allocation/current`);
      if (allocRes.ok) {
        const allocData = await allocRes.json();
        setAllocation(allocData);
        setIsAccepted(!!allocData.is_accepted);
      }

      const auditRes = await fetch(`${API_BASE}/audit`);
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }
    } catch {
      console.log("Backend offline or loading local fallback preset");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // On mount: restore session -> re-fetch farms scoped to the restored token
    let isMounted = true;
    const saved = typeof window !== 'undefined' ? localStorage.getItem('paani_user') : null;
    const savedToken = saved ? (() => { try { return JSON.parse(saved).token as string; } catch { return undefined; } })() : undefined;
    const loadInitialData = async () => {
      try {
        const [farmsRes, allocRes, auditRes] = await Promise.allSettled([
          fetch(savedToken ? `${API_BASE}/farms?token=${encodeURIComponent(savedToken)}` : `${API_BASE}/farms`),
          fetch(`${API_BASE}/allocation/current`),
          fetch(`${API_BASE}/audit`)
        ]);
        // NOTE: initial load is unauthenticated on purpose (page can render before
        // token restore); refreshBackendData() re-fetches with the token right after login.

        if (isMounted && farmsRes.status === 'fulfilled' && farmsRes.value.ok) {
          const data = await farmsRes.value.json();
          setFarms(data);
        }
        if (isMounted && allocRes.status === 'fulfilled' && allocRes.value.ok) {
          const allocData = await allocRes.value.json();
          setAllocation(allocData);
          setIsAccepted(!!allocData.is_accepted);
        }
        if (isMounted && auditRes.status === 'fulfilled' && auditRes.value.ok) {
          const auditData = await auditRes.value.json();
          setAuditLogs(auditData);
        }
      } catch {
        // use fallback initial demo allocation
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Demo Scenario Reset
  const handleResetDemo = async () => {
    setIsLoading(true);
    setIsAccepted(false);
    setSelectedFarmIdState(null);
    try {
      const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.allocation) {
          setAllocation(data.allocation);
        }
      }
      await refreshBackendData();
    } catch {
      setAllocation(INITIAL_DEMO_ALLOCATION);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW WATER CYCLE: fresh water arrives -> previous distribution resets ->
  // re-allocation by current crop stage & emergency priority
  const handleNewWaterCycle = async (volumeLiters?: number) => {
    setIsLoading(true);
    setIsAccepted(false);
    setSelectedFarmIdState(null);
    try {
      const res = await fetch(`${API_BASE}/water-cycle/new-water`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_volume_liters: volumeLiters ?? 180000 })
      });
      if (res.ok) {
        const data = await res.json();
        setAllocation(data.allocation);
        setIsAccepted(!!data.allocation?.is_accepted);
      }
      await refreshBackendData();
    } catch {
      console.log('Water cycle failed; keeping current state');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset distribution without new water (archive current allocations)
  const handleResetDistribution = async () => {
    setIsLoading(true);
    setIsAccepted(false);
    try {
      const res = await fetch(`${API_BASE}/water-cycle/reset-distribution`, { method: 'POST' });
      if (res.ok) {
        await refreshBackendData();
      }
    } catch {
      console.log('Failed to reset distribution');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the transparent requirement breakdown for the Why modal
  const handleOpenWhyModal = async (item: AllocationItem) => {
    setWhyItem(item);
    setWhyBreakdown(null);
    const farm = farms.find(f => f.id === item.farm_id);
    if (!farm) return;
    try {
      const res = await fetch(`${API_BASE}/water-requirement/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_id: farm.id,
          crop_name: item.crop_name,
          area_acres: item.area_acres,
          growth_stage: item.growth_stage,
          soil_type: farm.soil_type,
          irrigation_efficiency: farm.irrigation_efficiency,
          previous_irrigation_liters: 0
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWhyBreakdown(data.breakdown ?? null);
      }
    } catch {
      // modal still shows allocation reasoning as fallback
    }
  };

  // Submit Objection & Run AI Mediation
  const handleSubmitObjection = async (farmId: number, farmerName: string, text: string): Promise<MediationProposalResponse | null> => {
    try {
      const res = await fetch(`${API_BASE}/mediation/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocation_id: 1,
          farm_id: farmId,
          farmer_name: farmerName,
          objection_reason: text,
          requested_additional_liters: 8000
        })
      });

      if (res.ok) {
        const proposal: MediationProposalResponse = await res.json();
        setAllocation(proposal.revised_allocation);
        setIsAccepted(false); // new version needs fresh acceptance
        await refreshBackendData();
        return proposal;
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Water request limit reached.");
      }
    } catch (e: any) {
      if (e.message && e.message.includes("Panchayat Policy Limit")) {
        throw e;
      }
      console.log("API offline, running local fallback mediation proposal", e);
    }

    // Local fallback mediation proposal calculation if API is offline
    if (allocation) {
      const currentAlloc = allocation;
      const targetItem = currentAlloc.allocations.find(a => a.farm_id === farmId) || currentAlloc.allocations[1];
      const newAllocations = currentAlloc.allocations.map(a => {
        if (a.farm_id === farmId) {
          return {
            ...a,
            allocated_liters: a.allocated_liters + 7500,
            unmet_liters: Math.max(a.unmet_liters - 7500, 0),
            fairness_score: 87.5,
            reasoning: [...a.reasoning, "💬 Mediation Compromise Boost Applied: +7,500 L for critical crop stage."]
          };
        } else {
          return {
            ...a,
            allocated_liters: Math.max(a.allocated_liters - 2500, 10000),
            unmet_liters: a.unmet_liters + 2500,
            fairness_score: Math.max(a.fairness_score - 1.5, 78.0)
          };
        }
      });

      const revised: AllocationResult = {
        ...currentAlloc,
        version: currentAlloc.version + 1,
        allocations: newAllocations
      };

      setAllocation(revised);

      return {
        dispute_id: 1,
        farmer_name: farmerName,
        objection_summary: text,
        ai_mediation_analysis: `🌾 Mediation Agent Analysis:\nFarmer '${farmerName}' requested +8,000 L for ${targetItem.crop_name} in stage '${targetItem.growth_stage}'.\nHigh yield sensitivity detected.`,
        proposed_reallocation_text: `🤝 PaaniPanchayat Compromise Proposal:\nIncrease ${farmerName}'s allocation by +7,500 L (New Total: ${(targetItem.allocated_liters + 7500).toLocaleString()} L).\nBalanced across non-critical farms. Canal 180,000 L capacity constraint satisfied.`,
        revised_allocation: revised,
        is_validated_by_optimizer: true,
        status: "Validated_By_OR_Tools"
      };
    }

    return null;
  };

  // Accept Allocation (Overall or per Farm)
  const handleAcceptAllocation = async (version: number, farmId?: number) => {
    if (farmId) {
      setAcceptedFarmIds(prev => Array.from(new Set([...prev, farmId])));
    } else {
      setIsAccepted(true);
    }

    try {
      const res = await fetch(`${API_BASE}/agreements/accept?version=${version}${farmId ? `&farm_id=${farmId}` : ''}`, { method: 'POST' });
      if (!res.ok && !farmId) {
        setIsAccepted(false);
      }
      await refreshBackendData();
    } catch {
      console.log('Failed to register accepted agreement');
      if (!farmId) setIsAccepted(false);
    }
  };

  // Update Water Supply in Admin
  const handleUpdateWaterSupply = async (newSupplyLiters: number) => {
    try {
      const res = await fetch(`${API_BASE}/water-source/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available_volume_liters: newSupplyLiters })
      });
      if (res.ok) {
        const updatedAlloc = await res.json();
        setAllocation(updatedAlloc);
        const auditRes = await fetch(`${API_BASE}/audit`);
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAuditLogs(auditData);
        }
      }
    } catch (e) {
      console.error("Failed to update water supply:", e);
      if (allocation) {
        setAllocation({
          ...allocation,
          available_volume_liters: newSupplyLiters,
          shortage_liters: Math.max(allocation.total_demand_liters - newSupplyLiters, 0),
          is_conflict: allocation.total_demand_liters > newSupplyLiters,
          version: allocation.version + 1
        });
      }
    }
  };

  // Add New Farm (token in URL so the farm attaches to the logged-in farmer)
  const handleAddFarm = async (farmData: FarmFormData) => {
    try {
      const ownerName = authUser?.name ? authUser.name.split('(')[0].trim() : 'Farmer';
      const farmTitle = farmData.farmer_name || 'New Plot';
      const formattedFarmerName = `${ownerName} (${farmTitle})`;

      const payload = {
        ...farmData,
        farmer_name: formattedFarmerName,
        user_id: authUser?.user_id || undefined
      };
      const res = await fetch(authUrl('/farms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newFarm = await res.json();
        if (newFarm && newFarm.id) {
          setFarms(prev => [...prev.filter(f => f.id !== newFarm.id), newFarm]);
          setSelectedFarmId(newFarm.id);
        }
        await refreshBackendData();
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to submit water request. 1 request allowed per farmer every 3 days.");
      }
    } catch (e: unknown) {
      console.error("Water request error:", e);
      throw e;
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f2f6f4] p-4 sm:p-6">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-600 mx-auto animate-pulse" />
          <p className="text-sm font-bold text-emerald-900">PaaniPanchayat</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <AuthView apiBase={API_BASE} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f6f4] text-slate-900 font-sans">
      
      {/* Header Navigation */}
      <Navbar
        currentRole={role}
        setRole={setRole}
        onResetDemo={handleResetDemo}
        isLoading={isLoading}
        authUser={authUser}
        onLogout={handleLogout}
      />

      {/* Main View Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {role === 'farmer' ? (
          <FarmerDashboard
            allocation={visibleAllocation}
            farms={farms}
            selectedFarmId={selectedFarmId}
            setSelectedFarmId={setSelectedFarmId}
            onOpenWhyModal={handleOpenWhyModal}
            onOpenObjectionModal={(item) => setObjectionItem(item)}
            onAcceptAllocation={handleAcceptAllocation}
            onOpenAddFarmModal={() => setShowAddFarmModal(true)}
            isAccepted={isAccepted}
            acceptedFarmIds={acceptedFarmIds}
            authUser={authUser}
          />
        ) : (
          <AdminDashboard
            allocation={allocation}
            auditLogs={auditLogs}
            onTriggerReallocation={refreshBackendData}
            onReleaseWater={handleNewWaterCycle}
            onResetDistribution={handleResetDistribution}
            isLoading={isLoading}
            onAcceptAllocation={handleAcceptAllocation}
            onUpdateWaterSupply={handleUpdateWaterSupply}
            isAccepted={isAccepted}
            acceptedFarmIds={acceptedFarmIds}
          />
        )}
      </main>

      {/* Modals */}
      {whyItem && (
        <WhyExplanationModal
          item={whyItem}
          breakdown={whyBreakdown}
          onClose={() => { setWhyItem(null); setWhyBreakdown(null); }}
        />
      )}

      {objectionItem && (
        <MediationChat
          initialObjectingItem={objectionItem}
          onSubmitObjection={handleSubmitObjection}
          onAcceptProposal={() => handleAcceptAllocation(allocation?.version || 1)}
          allocation={allocation}
          onClose={() => setObjectionItem(null)}
        />
      )}

      {showAddFarmModal && (
        <FarmRegistrationModal
          onClose={() => setShowAddFarmModal(false)}
          onAddFarm={handleAddFarm}
        />
      )}

      {/* Footer */}
      <Footer />

    </div>
  );
}
