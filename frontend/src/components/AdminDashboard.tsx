"use client";

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AllocationResult, AuditLogItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Scale, FileText, Activity, Droplets, Users, History, Waves, RotateCcw } from 'lucide-react';

interface AdminDashboardProps {
  allocation: AllocationResult | null;
  auditLogs: AuditLogItem[];
  onTriggerReallocation: () => void;
  onReleaseWater: (volumeLiters?: number) => void;
  onResetDistribution: () => void;
  isLoading: boolean;
}

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ allocation, auditLogs, onTriggerReallocation, onReleaseWater, onResetDistribution, isLoading }) => {
  const { t } = useLanguage();

  const handleReleaseWater = () => {
    const input = window.prompt(
      `Release new water into the canal (liters).\nPrevious distribution will be reset and re-allocated by crop-stage urgency.`,
      '180000'
    );
    if (input === null) return;
    const volume = parseFloat(input.replace(/[^0-9.]/g, ''));
    onReleaseWater(isNaN(volume) ? undefined : volume);
  };

  if (!allocation) {
    return (
      <div className="p-8 text-center text-slate-500">
        No allocation data available.
      </div>
    );
  }

  const chartData = allocation.allocations.map(a => ({
    name: a.farmer_name.split(' ')[0],
    Required: a.required_liters,
    Allocated: a.allocated_liters,
    Unmet: a.unmet_liters
  }));

  const pieData = allocation.allocations.map(a => ({
    name: a.farmer_name,
    value: a.allocated_liters
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans text-slate-900">
      
      {/* Admin Title Header */}
      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-black text-slate-900">{t('adminView')}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
              WUA & Judge Inspector
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time OR-Tools Linear Solver status, LangGraph multi-agent execution, and audit trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WATER CYCLE: release new water -> reset -> re-allocate */}
          <button
            onClick={handleReleaseWater}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
            title="Simulate new water arriving in the canal; previous distribution resets and re-allocation runs by crop-stage urgency"
          >
            <Waves className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
            <span>{t('releaseWater')}</span>
          </button>
          <button
            onClick={onResetDistribution}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
            title="Clear current allocations until the next water release"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t('resetDistribution')}</span>
          </button>
          <button
            onClick={onTriggerReallocation}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Activity className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-Run Solver Optimization</span>
          </button>
        </div>
      </div>

      {/* Water Cycle Banner */}
      {allocation.cycle_number !== undefined && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-5 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
          <span className="flex items-center gap-2 font-bold">
            <Waves className="h-4 w-4 text-blue-600" />
            {t('waterCycle')} #{allocation.cycle_number}
          </span>
          <span className="text-blue-700 hidden sm:block">{t('waterArrivalNotice')}</span>
          {allocation.is_accepted ? (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">✓ Accepted</span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold border border-amber-200">Pending Acceptance</span>
          )}
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Available Canal Supply</span>
          <span className="text-3xl font-black text-emerald-700 mt-1 block">
            {allocation.available_volume_liters.toLocaleString()} L
          </span>
          <span className="text-[11px] text-slate-500">Canal Source Capacity #1</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Farmer Demand</span>
          <span className="text-3xl font-black text-amber-600 mt-1 block">
            {allocation.total_demand_liters.toLocaleString()} L
          </span>
          <span className="text-[11px] text-rose-600 font-semibold">Shortage: {allocation.shortage_liters.toLocaleString()} L</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">System Fairness Index</span>
          <span className="text-3xl font-black text-emerald-700 mt-1 block">
            {allocation.overall_fairness_score}/100
          </span>
          <span className="text-[11px] text-slate-500">Minimizes weighted unmet demand</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Allocation Version</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">
            v{allocation.version}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Validated by OR-Tools Solver</span>
          {allocation.cycle_number !== undefined && (
            <span className="text-[11px] text-blue-600 font-bold block mt-0.5">{t('cycle')} #{allocation.cycle_number}</span>
          )}
        </div>

      </div>

      {/* Visual Analytics Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Required vs Allocated */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Droplets className="h-4 w-4 text-emerald-600" />
            <span>Farm Requirement vs Allocation Breakdown (Liters)</span>
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Required" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Allocated" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Unmet" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Allocation Share */}
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center space-x-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <span>Water Share Distribution</span>
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate font-medium">{d.name.split(' ')[0]}: {d.value.toLocaleString()} L</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Farm Allocation Matrix Table */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <span>{t('farmAllocations')}</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Solver: OR-Tools GLOP | Status: OPTIMAL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Farmer</th>
                <th className="p-4">Crop & Stage</th>
                <th className="p-4">Area</th>
                <th className="p-4">Required (L)</th>
                <th className="p-4">Allocated (L)</th>
                <th className="p-4">Unmet (L)</th>
                <th className="p-4">Time Slot</th>
                <th className="p-4">Fairness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocation.allocations.map((item) => (
                <tr key={item.farm_id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-900">{item.farmer_name}</td>
                  <td className="p-4">
                    <span className="font-semibold block text-emerald-800">{item.crop_name}</span>
                    <span className="text-[10px] text-slate-500">{item.growth_stage}</span>
                  </td>
                  <td className="p-4">{item.area_acres} acres</td>
                  <td className="p-4 font-mono">{item.required_liters.toLocaleString()}</td>
                  <td className="p-4 font-mono text-emerald-700 font-bold">{item.allocated_liters.toLocaleString()}</td>
                  <td className="p-4 font-mono text-rose-600">{item.unmet_liters.toLocaleString()}</td>
                  <td className="p-4 font-mono text-slate-600">{item.schedule_start} - {item.schedule_end}</td>
                  <td className="p-4 font-bold">{item.fairness_score}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Log Section */}
      <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
            <History className="h-5 w-5 text-amber-500" />
            <span>{t('auditLogsTitle')}</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Immutable Ledger</span>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No audit records logged yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={`${log.id}-${log.timestamp}`} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase border border-emerald-200">
                      {log.entity_type} #{log.entity_id}
                    </span>
                    <span className="font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                  </div>
                  
                  {log.details && typeof log.details === 'object' ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-1">
                      {Object.entries(log.details).map(([k, v]) => {
                        const formattedKey = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        const formattedVal = typeof v === 'boolean' ? (v ? 'Yes' : 'No') : typeof v === 'number' ? v.toLocaleString() : String(v);
                        return (
                          <span key={k} className="inline-flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                            <span className="text-slate-500 font-medium">{formattedKey}:</span>
                            <span className="text-slate-900 font-semibold">{formattedVal}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-600">{String(log.details)}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
