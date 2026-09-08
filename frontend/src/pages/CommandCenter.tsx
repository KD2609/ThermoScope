import React from 'react';
import { ThermalAnomaly, IndustrialAsset, Alert, AnalyticsSummary } from '../types';
import { MapComponent } from '../components/MapComponent';
import { 
  Flame, 
  Building2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  ExternalLink,
  Radio
} from 'lucide-react';

interface CommandCenterProps {
  anomalies: ThermalAnomaly[];
  assets: IndustrialAsset[];
  alerts: Alert[];
  analytics: AnalyticsSummary | null;
  onSelectAnomaly: (id: number) => void;
  onSelectAsset: (id: number) => void;
  onViewAlerts: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  anomalies,
  assets,
  alerts,
  analytics,
  onSelectAnomaly,
  onSelectAsset,
  onViewAlerts
}) => {
  const activeCount = analytics?.total_anomalies ?? anomalies.length;
  const industrialCount = analytics?.industrial_events_count ?? 5;
  const highRiskCount = analytics?.high_risk_count ?? 3;
  const persistentCount = analytics?.persistent_sources_count ?? 4;
  const new24h = analytics?.new_events_24h ?? 7;
  const avgConf = analytics ? Math.round(analytics.avg_confidence * 100) : 84;

  const kpis = [
    { label: 'Active Anomalies', val: activeCount, icon: Flame, color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-950/20' },
    { label: 'Industrial Probable', val: industrialCount, icon: Building2, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-950/20' },
    { label: 'High Priority (Risk)', val: highRiskCount, icon: AlertTriangle, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-950/20' },
    { label: 'Persistent Sources', val: persistentCount, icon: Clock, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-950/20' },
    { label: 'New Detections (24h)', val: new24h, icon: Radio, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-950/20' },
    { label: 'Avg AI Confidence', val: `${avgConf}%`, icon: CheckCircle2, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-950/20' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-105px)] bg-[#080d1a] overflow-hidden">
      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 bg-[#0b1222]/80 border-b border-slate-800/80">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border ${kpi.border} ${kpi.bg} flex items-center justify-between shadow-sm`}
            >
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{kpi.label}</div>
                <div className={`text-xl font-extrabold ${kpi.color} tracking-tight mt-0.5`}>{kpi.val}</div>
              </div>
              <div className={`p-2 rounded-lg bg-slate-900/60 ${kpi.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Command Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Large GIS Map */}
        <div className="flex-1 relative">
          <MapComponent
            anomalies={anomalies}
            assets={assets}
            onSelectAnomaly={onSelectAnomaly}
          />
        </div>

        {/* Right Live Alert Feed Panel */}
        <div className="w-80 lg:w-96 bg-[#0c1427] border-l border-slate-800 flex flex-col h-full shadow-2xl z-10">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500 animate-pulse" />
              <span className="font-extrabold text-xs uppercase tracking-wider text-white">Live Alert Triage Feed</span>
            </div>
            <button
              onClick={onViewAlerts}
              className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition"
            >
              View All ({alerts.length})
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {alerts.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No active alerts. All thermal feeds nominal.</div>
            ) : (
              alerts.slice(0, 10).map((alert) => {
                const isCrit = alert.severity === 'CRITICAL';
                const isHigh = alert.severity === 'HIGH';
                const badgeBg = isCrit ? 'bg-red-500/20 text-red-400 border-red-500/30' : (isHigh ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30');

                return (
                  <div
                    key={alert.id}
                    onClick={() => onSelectAnomaly(alert.anomaly_id)}
                    className="p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${badgeBg}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-slate-200 group-hover:text-orange-400 transition line-clamp-1">
                      {alert.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {alert.message}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-medium text-slate-300 truncate max-w-[170px]">{alert.facility_name}</span>
                      <span className="text-orange-400 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                        Triage &rarr;
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Facility Hotspots */}
          <div className="p-3 border-t border-slate-800 bg-[#090f1d] text-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">High Priority Facilities</div>
            <div className="space-y-1.5">
              {assets.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  onClick={() => onSelectAsset(a.id)}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-slate-800/60 cursor-pointer transition text-[11px]"
                >
                  <span className="text-slate-300 truncate max-w-[200px]">{a.name}</span>
                  <span className="text-orange-400 font-mono font-semibold">{a.active_anomalies_count} active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
