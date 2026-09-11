import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translateCrop, translateStage } from '../i18n/translations';
import { AllocationResult, AuditLogItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Scale, ShieldCheck, FileText, Activity, Droplets, Users, History, AlertCircle, Edit3, Check, X, Waves, RotateCcw } from 'lucide-react';

interface AdminDashboardProps {
  allocation: AllocationResult | null;
  auditLogs: AuditLogItem[];
  onTriggerReallocation: () => void;
  onReleaseWater?: (volumeLiters?: number) => void;
  onResetDistribution?: () => void;
  isLoading?: boolean;
  onAcceptAllocation?: (version: number, farmId?: number) => void;
  onUpdateWaterSupply?: (newSupplyLiters: number) => Promise<void>;
  isAccepted?: boolean;
  acceptedFarmIds?: number[];
}

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  allocation,
  auditLogs,
  onTriggerReallocation,
  onReleaseWater,
  onResetDistribution,
  isLoading = false,
  onAcceptAllocation,
  onUpdateWaterSupply,
  isAccepted = false,
  acceptedFarmIds = []
}) => {
  const { t, language } = useLanguage();
  const [isEditingSupply, setIsEditingSupply] = useState(false);
  const [supplyInput, setSupplyInput] = useState<string>('');
  const [isSavingSupply, setIsSavingSupply] = useState(false);

  const handleStartEditSupply = () => {
    if (allocation) {
      setSupplyInput(allocation.available_volume_liters.toString());
      setIsEditingSupply(true);
    }
  };

  const handleSaveSupply = async () => {
    const val = parseFloat(supplyInput);
    if (!isNaN(val) && val >= 0 && onUpdateWaterSupply) {
      setIsSavingSupply(true);
      try {
        await onUpdateWaterSupply(val);
        setIsEditingSupply(false);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSavingSupply(false);
      }
    }
  };

  const handleReleaseWater = () => {
    const input = window.prompt(
      `Release new water into the canal (liters).\nPrevious distribution will be reset and re-allocated by crop-stage urgency.`,
      '180000'
    );
    if (input === null) return;
    const volume = parseFloat(input.replace(/[^0-9.]/g, ''));
    if (onReleaseWater) {
      onReleaseWater(isNaN(volume) ? undefined : volume);
    }
  };

  if (!allocation) {
    return (
      <div className="p-8 text-center text-slate-500">
        No allocation data available.
      </div>
    );
  }

  // Filter dispute audit logs
  const disputeLogs = auditLogs.filter(
    log => log.entity_type === 'Dispute' || log.action.includes('MEDIATION') || log.action.includes('OBJECTION')
  );

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
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Scale className="h-6 w-6 text-amber-600 shrink-0" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">{t('adminView')}</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
              WUA & Water Officer Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time OR-Tools Linear Solver status, AI Dispute Mediation logs, and village audit ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WATER CYCLE: release new water -> reset -> re-allocate */}
          {onReleaseWater && (
            <button
              onClick={handleReleaseWater}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
              title="Simulate new water arriving in the canal; previous distribution resets and re-allocation runs by crop-stage urgency"
            >
              <Waves className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
              <span>{t('releaseWater')}</span>
            </button>
          )}
          {onResetDistribution && (
            <button
              onClick={onResetDistribution}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
              title="Clear current allocations until the next water release"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t('resetDistribution')}</span>
            </button>
          )}
          <button
            onClick={onTriggerReallocation}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm shadow-sm transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Activity className={`h-4 w-4 text-emerald-600 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t('reRunSolver')}</span>
          </button>

          {onAcceptAllocation && (
            <button
              onClick={() => onAcceptAllocation(allocation.version)}
              disabled={isAccepted}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center justify-center space-x-1.5 ${
                isAccepted
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>{isAccepted ? t('allocationAcceptedAndLocked') : `${t('acceptAndLock')} (v${allocation.version})`}</span>
            </button>
          )}
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
        
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Available Canal Supply</span>
              {!isEditingSupply && (
                <button
                  onClick={handleStartEditSupply}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition"
                  title="Edit Canal Water Supply"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditingSupply ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={supplyInput}
                    onChange={(e) => setSupplyInput(e.target.value)}
                    placeholder="Volume in Liters"
                    className="w-full text-base font-bold px-3 py-1.5 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                  />
                  <span className="text-xs font-bold text-slate-600">L</span>
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={handleSaveSupply}
                    disabled={isSavingSupply}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1 transition shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{isSavingSupply ? 'Saving...' : 'Save & Solve'}</span>
                  </button>
                  <button
                    onClick={() => setIsEditingSupply(false)}
                    disabled={isSavingSupply}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-3xl font-black text-emerald-700 mt-1 block">
                {allocation.available_volume_liters.toLocaleString()} L
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">Canal Source Capacity #1</span>
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
          <table className="w-full min-w-[700px] text-left text-xs text-slate-800">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">{t('farmer')}</th>
                <th className="p-4">{t('cropAndStage')}</th>
                <th className="p-4">{t('acres')}</th>
                <th className="p-4">{t('requestLiters')}</th>
                <th className="p-4">{t('allocatedLiters')}</th>
                <th className="p-4">{t('shortageLiters')}</th>
                <th className="p-4">{t('timeSlot')}</th>
                <th className="p-4">{t('fairness')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allocation.allocations.map((item) => (
                <tr key={item.farm_id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-bold text-slate-900">{item.farmer_name}</td>
                  <td className="p-4">
                    <span className="font-semibold block text-emerald-800">{translateCrop(item.crop_name, language)}</span>
                    <span className="text-[10px] text-slate-500">{translateStage(item.growth_stage, language)}</span>
                  </td>
                  <td className="p-4">{item.area_acres} {t('acres')}</td>
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

      {/* Active Disputes & AI Mediations Section */}
      <div className="bg-white rounded-3xl border border-amber-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900">Active Farmer Objections & AI Mediation Proposals</h3>
          </div>
          <span className="text-xs text-amber-800 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            {disputeLogs.length} Dispute Event(s)
          </span>
        </div>

        {disputeLogs.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
            No active disputes raised yet. All farmers are currently on standard allocation version v{allocation.version}.
          </div>
        ) : (
          <div className="space-y-3">
            {disputeLogs.map((dispute) => {
              const disputeFarmId = Number(dispute.entity_id);
              const isThisDisputeAccepted = isAccepted || (acceptedFarmIds && acceptedFarmIds.includes(disputeFarmId));
              const detailsObj = (typeof dispute.details === 'object' && dispute.details !== null)
                ? (dispute.details as Record<string, unknown>)
                : null;
              const farmerDisplayName = detailsObj?.farmer ? String(detailsObj.farmer) : `Farm #${dispute.entity_id}`;
              const objectionText = detailsObj?.objection ? String(detailsObj.objection) : null;

              return (
                <div key={dispute.id} className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">
                        👨‍🌾 {farmerDisplayName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase border border-amber-200">
                        Farm #{dispute.entity_id} Objection
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(dispute.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {objectionText && (
                    <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-amber-100 italic">
                      &quot;{objectionText}&quot;
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      AI Compromise Plan Validated by OR-Tools
                    </span>

                    {onAcceptAllocation && (
                      <button
                        onClick={() => onAcceptAllocation(allocation.version, disputeFarmId)}
                        disabled={isThisDisputeAccepted}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm transition ${
                          isThisDisputeAccepted
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isThisDisputeAccepted ? 'Approved & Accepted ✅' : 'Approve & Accept Proposal'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
