import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Database,
  Radio,
  Cpu,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Play,
  Download,
  Layers,
  Activity,
  Server
} from 'lucide-react';
import { SystemHealth, DataQualityReport, ModelMonitoring } from '../types';
import { api } from '../services/api';

export const AdminPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(() => api.getCached<SystemHealth>('system_health') || null);
  const [firmsStatus, setFirmsStatus] = useState<any>(() => api.getCached<any>('firms_status') || null);
  const [syncLogs, setSyncLogs] = useState<any[]>(() => api.getCached<any[]>('sync_logs_15') || []);
  const [loading, setLoading] = useState<boolean>(() => !api.getCached('system_health') && !api.getCached('model_monitoring'));
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  // Feature Expansion State
  const [dataQuality, setDataQuality] = useState<DataQualityReport | null>(() => api.getCached<DataQualityReport>('data_quality_report') || null);
  const [modelMonitoring, setModelMonitoring] = useState<ModelMonitoring | null>(() => api.getCached<ModelMonitoring>('model_monitoring') || null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const loadHealthData = async (forceFresh: boolean = false) => {
    let isMounted = true;
    if (forceFresh || (!health && !modelMonitoring)) {
      setLoading(true);
    }

    let settledCount = 0;
    const checkSettled = () => {
      settledCount++;
      if (settledCount >= 2 && isMounted) {
        setLoading(false);
      }
    };

    api.getSystemHealth(forceFresh)
      .then((data) => { if (isMounted) setHealth(data); })
      .catch((err) => console.error('Health error:', err))
      .finally(checkSettled);

    api.getFirmsStatus(forceFresh)
      .then((data) => { if (isMounted) setFirmsStatus(data); })
      .catch((err) => console.error('FIRMS status error:', err))
      .finally(checkSettled);

    api.getSyncLogs(15, forceFresh)
      .then((data) => { if (isMounted) setSyncLogs(data || []); })
      .catch((err) => console.error('Sync logs error:', err))
      .finally(checkSettled);

    api.getDataQualityReport(forceFresh)
      .then((data) => { if (isMounted) setDataQuality(data); })
      .catch((err) => console.error('Data quality error:', err))
      .finally(checkSettled);

    api.getModelMonitoring(forceFresh)
      .then((data) => { if (isMounted) setModelMonitoring(data); })
      .catch((err) => console.error('Model monitoring error:', err))
      .finally(checkSettled);
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setSyncResultMsg(null);
      const res = await api.triggerManualSync();
      setSyncResultMsg(`Sync completed successfully. Status: ${res.details?.status}, ${res.details?.records_inserted} new records inserted.`);
      await loadHealthData();
    } catch (err: any) {
      setSyncResultMsg('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleExportDataset = async (format: 'json' | 'csv') => {
    try {
      const data = await api.exportFeedbackDataset(format);
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thermoscope_analyst_feedback_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg(`Exported analyst feedback dataset (${format.toUpperCase()}) successfully.`);
      setTimeout(() => setExportMsg(null), 4000);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Manual Trigger Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-geo-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-geo-900 tracking-tight">
            System Observability & Administration
          </h1>
          <p className="text-sm text-geo-500 mt-1">
            Real-time health telemetry for NASA FIRMS ingestion, PostgreSQL/PostGIS database, and ML inference monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadHealthData(true)}
            className="p-2.5 rounded-xl border border-geo-300 bg-white text-geo-700 hover:bg-geo-50 shadow-subtle transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizing Telemetry...' : 'Trigger NASA FIRMS Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Sync Result Banner if triggered */}
      {syncResultMsg && (
        <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-xs text-brand-900 font-medium flex items-center justify-between">
          <span>{syncResultMsg}</span>
          <button onClick={() => setSyncResultMsg(null)} className="font-bold text-brand-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Data Quality & Stale Warning Card */}
      {dataQuality && (
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-geo-900">Data Quality & Freshness Telemetry</h3>
                <p className="text-xs text-geo-500">Live operational validation of ingested satellite feeds</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                dataQuality.is_data_stale
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {dataQuality.freshness_status}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-geo-100 text-geo-800 text-xs font-mono font-bold">
                Quality: {dataQuality.quality_score_pct.toFixed(1)}%
              </span>
            </div>
          </div>


          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-geo-50 rounded-xl border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] uppercase font-bold">Lifetime Fetched</span>
              <p className="text-lg font-bold font-mono text-geo-900">{dataQuality.lifetime_records_fetched}</p>
            </div>
            <div className="p-3 bg-geo-50 rounded-xl border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] uppercase font-bold">Lifetime Inserted</span>
              <p className="text-lg font-bold font-mono text-emerald-600">{dataQuality.lifetime_records_inserted}</p>
            </div>
            <div className="p-3 bg-geo-50 rounded-xl border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] uppercase font-bold">Deduplicated / Filtered</span>
              <p className="text-lg font-bold font-mono text-geo-700">{dataQuality.lifetime_duplicates_or_filtered}</p>
            </div>
            <div className="p-3 bg-geo-50 rounded-xl border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] uppercase font-bold">PostGIS Engine</span>
              <p className="text-sm font-bold text-geo-900 truncate">
                {dataQuality.postgis_enabled ? (dataQuality.postgis_version || 'Enabled') : 'PostGIS Active'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Model Monitoring Telemetry (Without Modifying ML) */}
      {modelMonitoring && (
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-geo-900">Machine Learning Telemetry & Monitoring</h3>
                <p className="text-xs text-geo-500">
                  Operational inference statistics and analyst verification performance (<code>ml/</code> locked)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800">
              Model {modelMonitoring.model_version}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-geo-50 rounded-xl border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] uppercase font-bold">Logged Inferences</span>
              <p className="text-xl font-bold font-mono text-geo-900">{modelMonitoring.total_inferences}</p>
            </div>
            <div className="p-3 bg-geo-50 rounded-xl border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] uppercase font-bold">Avg. Confidence</span>
              <p className="text-xl font-bold font-mono text-brand-600">
                {(modelMonitoring.average_confidence * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-geo-50 rounded-xl border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] uppercase font-bold">Analyst Reviews Logged</span>
              <p className="text-xl font-bold font-mono text-geo-900">{modelMonitoring.analyst_reviews_total}</p>
            </div>
            <div className="p-3 bg-geo-50 rounded-xl border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] uppercase font-bold">Analyst Confirmed Accuracy</span>
              <p className="text-xl font-bold font-mono text-emerald-600">
                {modelMonitoring.analyst_confirmed_accuracy_pct.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Export Dataset Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-geo-100 text-xs">
            <div>
              <span className="font-bold text-geo-900">Analyst Verification Feedback Dataset</span>
              <p className="text-geo-500 text-[11px]">
                Export expert labels collected from operational reviews for model evaluation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportDataset('json')}
                className="px-3.5 py-1.5 rounded-xl border border-geo-300 hover:bg-geo-50 font-bold text-geo-700 flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={() => handleExportDataset('csv')}
                className="px-3.5 py-1.5 rounded-xl bg-geo-900 hover:bg-geo-800 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
          {exportMsg && <div className="text-xs text-emerald-600 font-semibold">{exportMsg}</div>}
        </div>
      )}


      {/* Sync Logs Audit Table */}
      <div className="rounded-2xl border border-geo-200 bg-white shadow-card overflow-hidden">
        <div className="p-4 border-b border-geo-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-geo-900">NASA FIRMS Synchronization Audit Trail</h3>
          </div>
          <span className="text-xs text-geo-500 font-mono">{syncLogs.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-geo-700">
            <thead className="bg-geo-50 border-b border-geo-200 text-[11px] font-bold text-geo-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Sync Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Records Fetched</th>
                <th className="py-3 px-4">New Deduplicated</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Telemetry Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geo-100 font-medium font-mono text-[11px]">
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-geo-500 font-sans">
                    No synchronization logs recorded yet.
                  </td>
                </tr>
              ) : (
                syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-geo-50/70">
                    <td className="py-3 px-4 text-geo-900">
                      {log.sync_time ? new Date(log.sync_time).toUTCString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'OFFLINE_FALLBACK' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-geo-800">{log.records_fetched}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{log.records_inserted}</td>
                    <td className="py-3 px-4 text-geo-600">{log.duration_seconds}s</td>
                    <td className="py-3 px-4 font-sans text-geo-500 truncate max-w-xs">
                      {log.error_message || 'Automatic validation and deduplication passed.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
