import React from 'react';
import { AnalyticsSummary } from '../types';
import { BarChart3, PieChart, TrendingUp, ShieldAlert, Building2 } from 'lucide-react';

interface AnalyticsPageProps {
  analytics: AnalyticsSummary | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">Loading analytics data...</div>
    );
  }

  return (
    <div className="p-6 bg-[#080d1a] min-h-[calc(100vh-105px)] space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-500" />
          Thermal Intelligence &amp; Spatial Risk Analytics
        </h1>
        <p className="text-xs text-slate-400">
          Synthesized regional trends, industrial fire ratios, and facility risk stratification
        </p>
      </div>

      {/* Grid of Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Anomalies by Classification */}
        <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <PieChart className="w-4 h-4 text-orange-400" />
            Classified Event Distribution
          </div>
          <div className="space-y-2 text-xs">
            {Object.entries(analytics.by_classification).map(([cls, count]) => {
              const pct = Math.round((count / analytics.total_anomalies) * 100) || 0;
              return (
                <div key={cls}>
                  <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                    <span className="truncate max-w-[220px]">{cls}</span>
                    <span className="font-mono font-bold text-orange-400">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Severity / Risk Tiers */}
        <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Investigation Priority Breakdown
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {Object.entries(analytics.by_severity).map(([sev, count]) => {
              const color = sev === 'CRITICAL' ? 'text-red-400 border-red-500/30 bg-red-950/20' : (sev === 'HIGH' ? 'text-orange-400 border-orange-500/30 bg-orange-950/20' : 'text-amber-400 border-amber-500/30 bg-amber-950/20');
              return (
                <div key={sev} className={`p-3 rounded-lg border ${color} text-center`}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{sev}</div>
                  <div className="text-2xl font-mono font-black mt-1">{count}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
            <div className="text-slate-400 text-[11px] mb-1">Contextual Ratio:</div>
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span>Industrial: {analytics.industrial_vs_natural_ratio['Industrial Associated']}</span>
              <span>Natural / Stubble: {analytics.industrial_vs_natural_ratio['Agricultural / Wildfire']}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Regional Hotspot Distribution */}
        <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3">
          <div className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Regional Industrial Clusters
          </div>
          <div className="space-y-2 text-xs">
            {Object.entries(analytics.by_region).map(([reg, count]) => (
              <div key={reg} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-300">{reg}</span>
                <span className="font-mono font-bold text-cyan-400">{count} events</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Assets by Risk Table */}
      <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3">
        <div className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
          <Building2 className="w-4 h-4 text-orange-400" />
          Top Industrial Assets by Investigation Priority
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                <th className="p-2.5">Asset ID</th>
                <th className="p-2.5">Facility Name</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Criticality</th>
                <th className="p-2.5">Active Hotspots</th>
                <th className="p-2.5 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {analytics.top_assets_by_risk.map(a => (
                <tr key={a.asset_id} className="hover:bg-slate-800/40">
                  <td className="p-2.5 font-mono text-slate-400">{a.asset_id}</td>
                  <td className="p-2.5 font-bold text-white">{a.name}</td>
                  <td className="p-2.5 text-slate-300">{a.category}</td>
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-bold">
                      {a.criticality}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-cyan-400 font-bold">{a.active_anomalies}</td>
                  <td className="p-2.5 text-right font-mono font-black text-orange-400 text-sm">
                    {a.risk_score.toFixed(1)} / 100
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
