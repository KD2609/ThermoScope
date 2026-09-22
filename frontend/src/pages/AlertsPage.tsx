import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { AlertItem } from '../types';
import { api } from '../services/api';
import { SeverityBadge } from '../components/ui/Badge';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [resolveModalAlert, setResolveModalAlert] = useState<AlertItem | null>(null);
  const [resolveNotes, setResolveNotes] = useState<string>('Verified on-site conditions. Thermal emission contained.');
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts({
        status: statusTab === 'ALL' ? undefined : statusTab,
        severity: severityFilter || undefined
      });
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusTab, severityFilter]);

  const handleAcknowledge = async (id: string) => {
    try {
      setActionInProgress(true);
      await api.acknowledgeAlert(id, 'Authorized Analyst');
      await loadAlerts();
    } catch (err) {
      alert('Failed to acknowledge alert: ' + err);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveModalAlert) return;
    try {
      setActionInProgress(true);
      await api.resolveAlert(resolveModalAlert.id, 'Incident Commander', resolveNotes);
      setResolveModalAlert(null);
      await loadAlerts();
    } catch (err) {
      alert('Failed to resolve alert: ' + err);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-geo-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-geo-900 tracking-tight">
            Operational Alert Center
          </h1>
          <p className="text-sm text-geo-500 mt-1">
            Automated, deduplicated early warnings dispatched to industrial responders and municipal authorities.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-geo-300 bg-white text-geo-700 hover:bg-geo-50 font-semibold text-xs shadow-subtle transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Tabs & Severity Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-geo-200 shadow-card">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'NEW', 'ACKNOWLEDGED', 'RESOLVED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusTab === tab
                  ? 'bg-geo-900 text-white shadow-sm'
                  : 'text-geo-600 hover:bg-geo-100 hover:text-geo-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-geo-500 font-medium">Filter Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-geo-200 bg-geo-50 font-semibold text-geo-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-geo-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
            <span className="text-xs">Loading operational alerts...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 rounded-2xl border border-geo-200 bg-white text-center text-geo-500 text-sm">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-geo-900">No Active Alerts In Current Filter</p>
            <p className="text-xs text-geo-500 mt-1">All monitored industrial perimeters are operating within baseline thresholds.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            return (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border bg-white shadow-card transition-all ${
                  alert.status === 'NEW'
                    ? isCritical
                      ? 'border-red-300 ring-1 ring-red-500/20'
                      : 'border-geo-300'
                    : 'border-geo-200 opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-geo-500">{alert.id}</span>
                      <SeverityBadge severity={alert.severity} />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        alert.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                        alert.status === 'ACKNOWLEDGED' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {alert.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-geo-900">{alert.title}</h3>
                    <p className="text-xs text-geo-700 leading-relaxed">{alert.message}</p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-geo-500 pt-1">
                      {alert.facility_name && (
                        <span>Asset: <strong className="text-geo-800">{alert.facility_name}</strong></span>
                      )}
                      {alert.residential_area_name && (
                        <span>Residential Buffer: <strong className="text-geo-800">{alert.residential_area_name} ({alert.distance_to_residence_km?.toFixed(1)} km)</strong></span>
                      )}
                      <span>Time: {new Date(alert.created_at || '').toUTCString()}</span>
                    </div>

                    {/* Resolution Notes if Resolved */}
                    {alert.status === 'RESOLVED' && alert.resolution_notes && (
                      <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        <strong>Resolution Notes:</strong> {alert.resolution_notes}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                    <Link
                      to={`/fires/${encodeURIComponent(alert.fire_detection_id)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-geo-100 hover:bg-geo-200 text-geo-800 text-xs font-semibold transition-colors"
                    >
                      <span>Inspect Dossier</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {alert.status === 'NEW' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={actionInProgress}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => setResolveModalAlert(alert)}
                        disabled={actionInProgress}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve Modal */}
      {resolveModalAlert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-geo-200 shadow-elevated max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-geo-900">Resolve Operational Alert</h3>
            <p className="text-xs text-geo-500">
              Provide closure documentation for alert {resolveModalAlert.id}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-geo-700 mb-1">
                Resolution Assessment / Field Notes
              </label>
              <textarea
                rows={3}
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-geo-200 bg-geo-50 text-xs text-geo-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setResolveModalAlert(null)}
                className="px-4 py-2 rounded-xl border border-geo-200 text-xs font-semibold text-geo-700 hover:bg-geo-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={actionInProgress}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
