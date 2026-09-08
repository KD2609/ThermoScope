import React, { useState, useMemo } from 'react';
import { Alert } from '../types';
import { api } from '../services/api';
import { GlassCard } from '../components/ui/GlassCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SectionHeader } from '../components/ui/SectionHeader';
import { 
  Bell, 
  ShieldAlert, 
  CheckCircle, 
  UserCheck, 
  ExternalLink, 
  Check, 
  Clock, 
  Flame, 
  ArrowRight,
  Filter,
  AlertCircle
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (activeTab !== 'ALL' && a.severity !== activeTab) return false;
      if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
      return true;
    });
  }, [alerts, activeTab, filterStatus]);

  const counts = useMemo(() => {
    return {
      ALL: alerts.length,
      CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
      HIGH: alerts.filter(a => a.severity === 'HIGH').length,
      MEDIUM: alerts.filter(a => a.severity === 'MEDIUM').length,
      LOW: alerts.filter(a => a.severity === 'LOW').length
    };
  }, [alerts]);

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

  return (
    <div className="py-5 content-container w-full space-y-4 min-h-[calc(100vh-72px)]">
      {/* Header */}
      <SectionHeader
        title="Alert Center"
        subtitle="Monitor and manage real-time thermal intelligence alerts."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2F6FED] border border-[#BFDBFE]">
            {alerts.filter(a => a.status !== 'RESOLVED').length} Active Alerts
          </span>
        }
      />

      {/* Operational Workflow Breadcrumb / Protocol Strip */}
      <GlassCard variant="secondary" padding="sm" className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#61758A] flex-wrap">
          <span className="font-bold text-[#17324D] uppercase text-[11px]">Workflow Protocol:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3FB] text-[#3B82F6] font-bold text-[10.5px] border border-[#3B82F6]/25">NEW</span>
          <span className="text-[#CDDCE8]">&rarr;</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FBF3DE] text-[#D89A2B] font-bold text-[10.5px] border border-[#D89A2B]/25">UNDER REVIEW</span>
          <span className="text-[#CDDCE8]">&rarr;</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#F9ECEB] text-[#D95C59] font-bold text-[10.5px] border border-[#D95C59]/25">VERIFIED / FALSE POSITIVE</span>
          <span className="text-[#CDDCE8]">&rarr;</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#E7F5EE] text-[#2D9B7A] font-bold text-[10.5px] border border-[#2D9B7A]/25">RESOLVED</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#7B8D9D]">Status Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 px-2.5 py-1 rounded-lg text-xs text-[#17324D] focus:outline-none focus:border-[#3B82F6] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#CDDCE8]/65 pb-1.5 overflow-x-auto text-xs">
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-white/85 text-[#3B82F6] border border-[#CDDCE8]/75 shadow-[0_2px_8px_rgba(30,55,80,0.04)] font-bold'
                : 'text-[#61758A] hover:text-[#17324D] hover:bg-white/50'
            }`}
          >
            <span>{tab === 'ALL' ? 'All Alerts' : tab}</span>
            <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === tab ? 'bg-[#EAF3FB] text-[#3B82F6]' : 'bg-[#E6EEF5]/70 text-[#7B8D9D]'
            }`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Main Alert Queue Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <GlassCard variant="secondary" padding="lg" className="text-center text-xs text-[#7B8D9D]">
            <span className="material-symbols-outlined text-[32px] text-[#2D9B7A] mx-auto mb-2">check_circle</span>
            <div className="font-bold text-sm text-[#17324D]">Queue clear in selected category</div>
            <div className="text-xs text-[#61758A] mt-0.5">No pending alerts matching the filter. Feeds nominal.</div>
          </GlassCard>
        ) : (
          filteredAlerts.map(alert => {
            const isLoading = actionLoadingId === alert.id;

            return (
              <GlassCard
                key={alert.id}
                variant="primary"
                padding="md"
                hoverEffect
                className="space-y-3 group"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CDDCE8]/45 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <RiskBadge level={alert.severity} size="sm" />
                    <span className="font-mono text-xs font-bold text-[#17324D]">{alert.alert_id}</span>
                    <span className="text-[#CDDCE8]">&bull;</span>
                    <span className="text-xs font-semibold text-[#3B82F6] truncate max-w-[240px]">
                      {alert.facility_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <StatusBadge status={alert.status} size="sm" />
                    <span className="text-[#7B8D9D] text-[11px] font-mono">
                      {new Date(alert.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Content & Action Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[14.5px] font-bold text-[#17324D] group-hover:text-[#3B82F6] transition">
                      {alert.title}
                    </h3>
                    <p className="text-[12.5px] text-[#61758A] leading-relaxed max-w-3xl">
                      {alert.message}
                    </p>
                    {alert.assigned_to && (
                      <div className="text-[11px] text-[#7B8D9D] flex items-center gap-1.5 pt-1">
                        <span className="material-symbols-outlined text-[14px] text-[#3B82F6]">person_check</span>
                        <span>Assigned to: <b className="text-[#17324D]">{alert.assigned_to}</b></span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {alert.status === 'NEW' && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleAcknowledge(alert.id)}
                        className="btn-card-secondary !text-[11px] !py-1 !px-2.5"
                      >
                        Acknowledge
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleAssign(alert.id)}
                        className="btn-card-secondary !text-[11px] !py-1 !px-2.5"
                      >
                        Assign
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleResolve(alert.id)}
                        className="btn-card-secondary !text-[11px] !py-1 !px-2.5 text-[#2D9B7A]"
                      >
                        Resolve
                      </button>
                    )}

                    <button
                      onClick={() => onSelectAnomaly(alert.anomaly_id)}
                      className="btn-card-primary !text-[11px] !py-1 !px-2.5"
                    >
                      <span>Dossier</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
};
