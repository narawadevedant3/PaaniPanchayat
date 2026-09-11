"use client";

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AllocationResult, AuditLogItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Scale, ShieldCheck, FileText, Activity, Droplets, Users, Clock, History, AlertCircle } from 'lucide-react';

interface AdminDashboardProps {
  allocation: AllocationResult | null;
  auditLogs: AuditLogItem[];
  onTriggerReallocation: () => void;
}

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ allocation, auditLogs, onTriggerReallocation }) => {
  const { t } = useLanguage();

  if (!allocation) {
    return (
      <div className="p-8 text-center text-emerald-300">
        No allocation data available. Please reset demo scenario.
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
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Admin Title Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 rounded-3xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-black text-white">{t('adminView')}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
              WUA & Judge Inspector
            </span>
          </div>
          <p className="text-xs text-emerald-300 mt-1">
            Real-time OR-Tools Linear Solver status, LangGraph multi-agent execution, and audit trail.
          </p>
        </div>

        <button
          onClick={onTriggerReallocation}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs sm:text-sm shadow-lg transition flex items-center space-x-2"
        >
          <Activity className="h-4 w-4" />
          <span>Re-Run Solver Optimization</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-emerald-900/40 backdrop-blur-md p-5 rounded-2xl border border-emerald-700/40">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Available Canal Supply</span>
          <span className="text-3xl font-black text-cyan-300 mt-1 block">
            {allocation.available_volume_liters.toLocaleString()} L
          </span>
          <span className="text-[11px] text-emerald-300/80">Canal Source Capacity #1</span>
        </div>

        <div className="bg-emerald-900/40 backdrop-blur-md p-5 rounded-2xl border border-emerald-700/40">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Total Farmer Demand</span>
          <span className="text-3xl font-black text-amber-300 mt-1 block">
            {allocation.total_demand_liters.toLocaleString()} L
          </span>
          <span className="text-[11px] text-amber-400/90">Shortage: {allocation.shortage_liters.toLocaleString()} L</span>
        </div>

        <div className="bg-emerald-900/40 backdrop-blur-md p-5 rounded-2xl border border-emerald-700/40">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">System Fairness Index</span>
          <span className="text-3xl font-black text-emerald-200 mt-1 block">
            {allocation.overall_fairness_score}/100
          </span>
          <span className="text-[11px] text-emerald-300">Minimizes weighted unmet demand</span>
        </div>

        <div className="bg-emerald-900/40 backdrop-blur-md p-5 rounded-2xl border border-emerald-700/40">
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Allocation Version</span>
          <span className="text-3xl font-black text-white mt-1 block">
            v{allocation.version}
          </span>
          <span className="text-[11px] text-cyan-400">Validated by OR-Tools Solver</span>
        </div>

      </div>

      {/* Visual Analytics Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Required vs Allocated */}
        <div className="lg:col-span-2 bg-emerald-950/60 backdrop-blur-md p-6 rounded-3xl border border-emerald-800/50 shadow-lg">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <Droplets className="h-4 w-4 text-cyan-400" />
            <span>Farm Requirement vs Allocation Breakdown (Liters)</span>
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#022c22', borderColor: '#059669', borderRadius: '12px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Required" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Allocated" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Unmet" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Allocation Share */}
        <div className="bg-emerald-950/60 backdrop-blur-md p-6 rounded-3xl border border-emerald-800/50 shadow-lg flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
            <Users className="h-4 w-4 text-emerald-400" />
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
                <Tooltip contentStyle={{ backgroundColor: '#022c22', borderColor: '#059669', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-200 pt-2 border-t border-emerald-800">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate">{d.name.split(' ')[0]}: {d.value.toLocaleString()} L</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Farm Allocation Matrix Table */}
      <div className="bg-emerald-950/60 backdrop-blur-md rounded-3xl border border-emerald-800/50 shadow-xl overflow-hidden">
        <div className="p-5 bg-emerald-900/40 border-b border-emerald-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            <span>{t('farmAllocations')}</span>
          </h3>
          <span className="text-xs text-emerald-300 font-mono">
            Solver: OR-Tools GLOP | Status: OPTIMAL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-emerald-100">
            <thead className="bg-emerald-950 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-emerald-800/40">
              {allocation.allocations.map((item) => (
                <tr key={item.farm_id} className="hover:bg-emerald-900/30 transition">
                  <td className="p-4 font-bold text-white">{item.farmer_name}</td>
                  <td className="p-4">
                    <span className="font-semibold block text-cyan-300">{item.crop_name}</span>
                    <span className="text-[10px] text-emerald-300/80">{item.growth_stage}</span>
                  </td>
                  <td className="p-4">{item.area_acres} acres</td>
                  <td className="p-4 font-mono">{item.required_liters.toLocaleString()}</td>
                  <td className="p-4 font-mono text-emerald-300 font-bold">{item.allocated_liters.toLocaleString()}</td>
                  <td className="p-4 font-mono text-amber-400">{item.unmet_liters.toLocaleString()}</td>
                  <td className="p-4 font-mono text-cyan-300">{item.schedule_start} - {item.schedule_end}</td>
                  <td className="p-4 font-bold">{item.fairness_score}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Log Section */}
      <div className="bg-emerald-950/60 backdrop-blur-md rounded-3xl border border-emerald-800/50 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <History className="h-5 w-5 text-amber-400" />
            <span>{t('auditLogsTitle')}</span>
          </h3>
          <span className="text-xs text-emerald-300">Immutable Ledger</span>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-emerald-400 italic">No audit records logged yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-emerald-900/30 rounded-xl border border-emerald-800/40 text-xs flex flex-col sm:flex-row justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold text-[10px] uppercase">
                      {log.entity_type} #{log.entity_id}
                    </span>
                    <span className="font-bold text-white">{log.action}</span>
                  </div>
                  <pre className="text-[11px] text-emerald-200 font-mono mt-1 whitespace-pre-wrap">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono shrink-0">
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
