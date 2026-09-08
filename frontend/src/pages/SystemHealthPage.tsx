import React from 'react';
import { SystemHealth } from '../types';
import { Activity, Database, Satellite, Server, ShieldCheck, RefreshCw } from 'lucide-react';

interface SystemHealthPageProps {
  health: SystemHealth | null;
  onToggleMode: () => void;
  onRefresh: () => void;
}

export const SystemHealthPage: React.FC<SystemHealthPageProps> = ({
  health,
  onToggleMode,
  onRefresh
}) => {
  if (!health) {
    return <div className="p-12 text-center text-slate-500 text-xs">Loading telemetry...</div>;
  }

  return (
    <div className="p-6 bg-[#080d1a] min-h-[calc(100vh-105px)] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            System Health &amp; Ingestion Telemetry
          </h1>
          <p className="text-xs text-slate-400">
            Real-time connection states, ingestion latency, and satellite data source fallback telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Mode Control Banner */}
      <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold text-slate-400">Current Operational Mode</div>
          <div className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${health.system_mode === 'LIVE' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            {health.system_mode} MODE {health.system_mode === 'DEMO' ? '(OFFLINE DEMO DATASET)' : '(NASA FIRMS API)'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {health.system_mode === 'LIVE'
              ? 'Attempting queries to live NASA FIRMS & OSM Overpass services.'
              : 'Using high-resolution bundled Indian industrial clusters. Completely functional offline without internet.'}
          </div>
        </div>

        <button
          onClick={onToggleMode}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-lg text-xs shadow transition"
        >
          Switch to {health.system_mode === 'LIVE' ? 'DEMO MODE' : 'LIVE MODE'}
        </button>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {health.sources.map((src) => {
          const isOk = src.status === 'CONNECTED' || src.status === 'AVAILABLE' || src.status === 'ACTIVE' || src.status === 'OPTIONAL';
          return (
            <div key={src.source_name} className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-white">{src.source_name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                  isOk ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {src.status}
                </span>
              </div>

              <div className="text-xs text-slate-300">{src.message}</div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div>Record Count: <b className="text-slate-200">{src.record_count}</b></div>
                <div>Latency: <b className="text-cyan-400 font-mono">{src.latency_ms} ms</b></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture Information for Judges */}
      <div className="p-5 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3">
        <div className="font-extrabold text-sm text-white uppercase tracking-wider">
          Architectural Fault-Tolerance &amp; Fallback Design
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          ThermoScope AI is architected to eliminate judging-time network failure. When live FIRMS API keys are unconfigured or Overpass servers experience rate-limiting, the internal adapter layer automatically serves normalized local geospatial assets without user interruption.
        </p>
      </div>
    </div>
  );
};
