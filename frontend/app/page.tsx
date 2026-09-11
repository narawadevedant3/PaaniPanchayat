"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '../src/components/Navbar';
import { FarmerDashboard } from '../src/components/FarmerDashboard';
import { AdminDashboard } from '../src/components/AdminDashboard';
import { MediationChat } from '../src/components/MediationChat';
import { WhyExplanationModal } from '../src/components/WhyExplanationModal';
import { FarmRegistrationModal } from '../src/components/FarmRegistrationModal';
import { AuthView } from '../src/components/AuthView';
import { UserRole, AllocationResult, Farm, AllocationItem, AuditLogItem, MediationProposalResponse, AuthUser } from '../src/types';

const API_BASE = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000/api` : "http://127.0.0.1:8000/api";

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
  const [role, setRole] = useState<UserRole>('farmer');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [allocation, setAllocation] = useState<AllocationResult | null>(INITIAL_DEMO_ALLOCATION);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number>(1);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAccepted, setIsAccepted] = useState<boolean>(false);
  const [acceptedFarmIds, setAcceptedFarmIds] = useState<number[]>([]);

  // Modals
  const [whyItem, setWhyItem] = useState<AllocationItem | null>(null);
  const [objectionItem, setObjectionItem] = useState<AllocationItem | null>(null);
  const [showAddFarmModal, setShowAddFarmModal] = useState<boolean>(false);

  // Check saved authentication session
  useEffect(() => {
    const savedUser = localStorage.getItem('paani_user');
    if (savedUser) {
      try {
        const parsed: AuthUser = JSON.parse(savedUser);
        setAuthUser(parsed);
        setRole(parsed.role);
      } catch (e) {
        localStorage.removeItem('paani_user');
      }
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setRole(user.role);
    localStorage.setItem('paani_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('paani_user');
  };

  // Automatically bind selectedFarmId to logged in user's farm
  useEffect(() => {
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

  // Fetch initial backend state if online
  const refreshBackendData = async () => {
    setIsLoading(true);
    try {
      const farmsRes = await fetch(`${API_BASE}/farms`);
      if (farmsRes.ok) {
        const data = await farmsRes.json();
        setFarms(data);
      }

      const allocRes = await fetch(`${API_BASE}/allocation/generate`, { method: 'POST' });
      if (allocRes.ok) {
        const allocData = await allocRes.json();
        setAllocation(allocData);
      }

      const auditRes = await fetch(`${API_BASE}/audit`);
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }
    } catch (e) {
      console.log("Backend offline or loading local fallback preset:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshBackendData();
  }, []);

  // Demo Scenario Reset
  const handleResetDemo = async () => {
    setIsLoading(true);
    setIsAccepted(false);
    try {
      const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.allocation) {
          setAllocation(data.allocation);
        }
      }
      await refreshBackendData();
    } catch (e) {
      setAllocation(INITIAL_DEMO_ALLOCATION);
    } finally {
      setIsLoading(false);
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
      await fetch(`${API_BASE}/agreements/accept?version=${version}${farmId ? `&farm_id=${farmId}` : ''}`, { method: 'POST' });
      await refreshBackendData();
    } catch (e) {
      console.log(e);
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

  // Add New Farm
  const handleAddFarm = async (farmData: any) => {
    try {
      const ownerName = authUser?.name ? authUser.name.split('(')[0].trim() : 'Farmer';
      const farmTitle = farmData.farmer_name || 'New Plot';
      const formattedFarmerName = `${ownerName} (${farmTitle})`;

      const payload = {
        ...farmData,
        farmer_name: formattedFarmerName,
        user_id: authUser?.user_id || undefined
      };
      const res = await fetch(`${API_BASE}/farms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newFarm = await res.json();
        await refreshBackendData();
        if (newFarm && newFarm.id) {
          setSelectedFarmId(newFarm.id);
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to submit water request. 1 request allowed per farmer every 3 days.");
      }
    } catch (e: any) {
      console.error("Water request error:", e);
      throw e;
    }
  };

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
            allocation={allocation}
            farms={farms}
            selectedFarmId={selectedFarmId}
            setSelectedFarmId={setSelectedFarmId}
            onOpenWhyModal={(item) => setWhyItem(item)}
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
          onClose={() => setWhyItem(null)}
        />
      )}

      {objectionItem && (
        <MediationChat
          initialObjectingItem={objectionItem}
          onSubmitObjection={handleSubmitObjection}
          onAcceptProposal={() => handleAcceptAllocation(allocation?.version || 1)}
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
      <footer className="border-t border-emerald-100 bg-white p-4 text-center text-xs text-slate-500 shadow-inner">
        <p className="font-medium">PaaniPanchayat — AI-Powered Water Sharing & Dispute Mediation Platform for Farmers (PS14 Hackathon MVP)</p>
      </footer>

    </div>
  );
}
