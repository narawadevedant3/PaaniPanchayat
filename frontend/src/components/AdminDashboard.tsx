"use client";

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AllocationResult, AuditLogItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Scale, FileText, Activity, Droplets, Users, History } from 'lucide-react';

interface AdminDashboardProps {
  allocation: AllocationResult | null;
  auditLogs: AuditLogItem[];
  onTriggerReallocation: () => void;
}

const PIE_COLORS = ['#1F6F6A', '#B5651D', '#D9A441', '#4F7942'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ allocation, auditLogs, onTriggerReallocation }) => {
  const { t } = useLanguage();

  if (!allocation) {
    return (
      <div className="p-8 text-center bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)]">
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Admin Title Header */}
      <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="h-6 w-6 text-[var(--color-canal)]" />
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{t('adminView')}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] font-bold border border-[var(--color-border)]">
              WUA & Judge Inspector
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Real-time OR-Tools Linear Solver telemetry, multi-agent constraint validation, and audit ledger.
          </p>
        </div>

        <button
          onClick={onTriggerReallocation}
          className="px-4 py-2 rounded-lg bg-[var(--color-canal)] hover:bg-[var(--color-canal-hover)] text-white font-bold text-xs sm:text-sm transition flex items-center space-x-2"
        >
          <Activity className="h-4 w-4" />
          <span>Re-Run Solver Optimization</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[var(--color-surface)] p-5 rounded-xl border border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider block">Available Canal Supply</span>
          <span className="text-3xl font-black text-[var(--color-canal)] mt-1 block">
            {allocation.available_volume_liters.toLocaleString()} L
          </span>
          <span className="text-[11px] text-[var(--color-text-secondary)]">Shared Canal Capacity #1</span>
        </div>

        <div className="bg-[var(--color-dispute-bg)] p-5 rounded-xl border border-[var(--color-dispute)]/30">
          <span className="text-xs text-[var(--color-dispute)] font-bold uppercase tracking-wider block">Total Farmer Demand</span>
          <span className="text-3xl font-black text-[var(--color-dispute)] mt-1 block">
            {allocation.total_demand_liters.toLocaleString()} L
          </span>
          <span className="text-[11px] text-[var(--color-dispute)] font-medium">Shortage: {allocation.shortage_liters.toLocaleString()} L</span>
        </div>

        <div className="bg-[var(--color-agreement-bg)] p-5 rounded-xl border border-[var(--color-agreement)]/30">
          <span className="text-xs text-[var(--color-agreement)] font-bold uppercase tracking-wider block">System Fairness Index</span>
          <span className="text-3xl font-black text-[var(--color-agreement)] mt-1 block">
            {allocation.overall_fairness_score}/100
          </span>
          <span className="text-[11px] text-[var(--color-agreement)] font-medium">Minimizes weighted unmet demand</span>
        </div>

        <div className="bg-[var(--color-surface)] p-5 rounded-xl border border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider block">Allocation Version</span>
          <span className="text-3xl font-black text-[var(--color-text-primary)] mt-1 block">
            v{allocation.version}
          </span>
          <span className="text-[11px] text-[var(--color-canal)] font-medium">Validated by OR-Tools Solver</span>
        </div>

      </div>

      {/* Visual Analytics Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Required vs Allocated */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4 flex items-center space-x-2">
            <Droplets className="h-4 w-4 text-[var(--color-canal)]" />
            <span>Farm Requirement vs Allocation Breakdown (Liters)</span>
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#5C5849" fontSize={12} />
                <YAxis stroke="#5C5849" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DDD6C4', borderRadius: '8px', color: '#24211B' }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#24211B' }} />
                <Bar dataKey="Required" fill="#5C5849" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Allocated" fill="#1F6F6A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Unmet" fill="#B23A2E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Allocation Share */}
        <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)] flex flex-col justify-between">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-2 flex items-center space-x-2">
            <Users className="h-4 w-4 text-[var(--color-canal)]" />
            <span>Water Share Distribution</span>
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DDD6C4', borderRadius: '8px', color: '#24211B' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)]">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="truncate">{d.name.split(' ')[0]}: {d.value.toLocaleString()} L</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Farm Allocation Matrix Table */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="p-4 bg-[var(--color-surface-subtle)] border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center space-x-2">
            <FileText className="h-4 w-4 text-[var(--color-canal)]" />
            <span>{t('farmAllocations')}</span>
          </h3>
          <span className="text-xs text-[var(--color-text-secondary)] font-mono">
            Solver: OR-Tools GLOP | Status: OPTIMAL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--color-text-primary)]">
            <thead className="bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider text-[10px] border-b border-[var(--color-border)]">
              <tr>
                <th className="p-3">Farmer</th>
                <th className="p-3">Crop & Stage</th>
                <th className="p-3">Area</th>
                <th className="p-3">Required (L)</th>
                <th className="p-3">Allocated (L)</th>
                <th className="p-3">Unmet (L)</th>
                <th className="p-3">Time Slot</th>
                <th className="p-3">Fairness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {allocation.allocations.map((item) => (
                <tr key={item.farm_id} className="hover:bg-[var(--color-surface-subtle)] transition">
                  <td className="p-3 font-bold text-[var(--color-text-primary)]">{item.farmer_name}</td>
                  <td className="p-3">
                    <span className="font-semibold block text-[var(--color-canal)]">{item.crop_name}</span>
                    <span className="text-[10px] text-[var(--color-text-secondary)]">{item.growth_stage}</span>
                  </td>
                  <td className="p-3">{item.area_acres} acres</td>
                  <td className="p-3 font-mono">{item.required_liters.toLocaleString()}</td>
                  <td className="p-3 font-mono text-[var(--color-canal)] font-bold">{item.allocated_liters.toLocaleString()}</td>
                  <td className="p-3 font-mono text-[var(--color-dispute)] font-medium">{item.unmet_liters.toLocaleString()}</td>
                  <td className="p-3 font-mono text-[var(--color-text-primary)] font-medium">{item.schedule_start} - {item.schedule_end}</td>
                  <td className="p-3 font-bold">{item.fairness_score}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Audit Log Section */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center space-x-2">
            <History className="h-4 w-4 text-[var(--color-canal)]" />
            <span>{t('auditLogsTitle')}</span>
          </h3>
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">Immutable Ledger</span>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-[var(--color-text-secondary)] italic">No audit records logged yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[var(--color-surface-subtle)] rounded-lg border border-[var(--color-border)] text-xs flex flex-col sm:flex-row justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-[var(--color-canal)]/10 text-[var(--color-canal)] font-bold text-[10px] uppercase border border-[var(--color-canal)]/20">
                      {log.entity_type} #{log.entity_id}
                    </span>
                    <span className="font-bold text-[var(--color-text-primary)]">{log.action}</span>
                  </div>
                  <pre className="text-[11px] text-[var(--color-text-secondary)] font-mono mt-1 whitespace-pre-wrap">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
                <span className="text-[10px] text-[var(--color-text-secondary)] font-mono shrink-0">
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
