import React, { useState } from 'react';
import { Alert } from '../types';
import { api } from '../services/api';
import { Bell, ShieldAlert, CheckCircle, UserCheck, Check, ExternalLink, Filter } from 'lucide-react';

interface AlertCenterProps {
  alerts: Alert[];
  onSelectAnomaly: (anomalyId: number) => void;
  onRefresh: () => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  alerts,
  onSelectAnomaly,
  onRefresh
}) => {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    return true;
  });

  const handleAcknowledge = async (id: number) => {
    try {
      setActionLoadingId(id);
      await api.acknowledgeAlert(id);
      onRefresh();
    } catch (e) {
      alert('Failed to acknowledge alert');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAssign = async (id: number) => {
    const officer = prompt('Assign to Responder / Safety Officer:', 'Emergency Dispatch Unit 4');
    if (!officer) return;

    try {
      setActionLoadingId(id);
      await api.assignAlert(id, officer);
      onRefresh();
    } catch (e) {
      alert('Failed to assign alert');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResolve = async (id: number) => {
    if (!confirm('Mark this alert as resolved?')) return;

    try {
      setActionLoadingId(id);
      await api.resolveAlert(id);
      onRefresh();
    } catch (e) {
      alert('Failed to resolve alert');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="p-6 bg-[#080d1a] min-h-[calc(100vh-105px)] space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            Alert Triage &amp; Incident Operational Center
          </h1>
          <p className="text-xs text-slate-400">
            Real-time investigation priority queue with multi-tier operational acknowledgement and dispatch
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-[#0f172a] rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL SEVERITIES</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="NEW">NEW</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400">
          Total Alerts: <b className="text-white">{filteredAlerts.length}</b>
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-[#0f172a] rounded-lg border border-slate-800 text-xs">
            No alerts match the selected criteria.
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isLoading = actionLoadingId === alert.id;
            return (
              <div
                key={alert.id}
                className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-200">{alert.alert_id}</span>
                    <span className="text-slate-500 text-xs">&bull;</span>
                    <span className="text-xs text-cyan-400 font-semibold">{alert.facility_name}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.status === 'RESOLVED' ? 'bg-slate-800 text-slate-400' : (alert.status === 'UNDER_REVIEW' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400')
                    }`}>
                      {alert.status}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      {new Date(alert.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{alert.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{alert.message}</p>
                    {alert.assigned_to && (
                      <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Assigned to: <b className="text-slate-300">{alert.assigned_to}</b></span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {alert.status === 'NEW' && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold border border-slate-700 transition"
                      >
                        Acknowledge
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleAssign(alert.id)}
                        className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 rounded text-xs font-semibold border border-cyan-800/80 transition"
                      >
                        Assign
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 rounded text-xs font-semibold border border-emerald-800/80 transition"
                      >
                        Resolve
                      </button>
                    )}

                    <button
                      onClick={() => onSelectAnomaly(alert.anomaly_id)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold transition flex items-center gap-1 shadow"
                    >
                      Dossier
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
