import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Layers,
  Factory,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { DashboardStats } from '../types';
import { api } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const classDist = stats?.class_distribution || {
    'Industrial Fire': 12,
    'Gas Flare / Persistent Thermal Source': 10,
    'Mining / Industrial Thermal Activity': 10,
    'Wildfire / Natural Fire': 10,
    'Agricultural Burn': 8,
    'Other / Uncertain': 5
  };

  const severityDist = stats?.severity_distribution || {
    'CRITICAL': 4,
    'HIGH': 14,
    'MEDIUM': 22,
    'LOW': 15
  };

  const totalEvents = Object.values(classDist).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-geo-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-geo-900 tracking-tight">
            Thermal Intelligence & Historical Analytics
          </h1>
          <p className="text-sm text-geo-500 mt-1">
            Aggregated patterns, classification distributions, and longitudinal industrial thermal recurrence.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-geo-600 bg-white px-3 py-1.5 rounded-xl border border-geo-200 shadow-subtle">
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          <span>Historical Horizon: 30 Days</span>
        </div>
      </div>

      {/* Grid: Visual Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: AI Classification Distribution */}
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-geo-900">Thermal Source Classification</h3>
                <p className="text-xs text-geo-500">Breakdown of AI identified categories</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-geo-700">{totalEvents} Total Events</span>
          </div>

          <div className="space-y-3">
            {Object.entries(classDist).map(([cls, count]) => {
              const pct = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0;
              let barColor = 'bg-brand-600';
              if (cls.includes('Industrial Fire')) barColor = 'bg-red-600';
              else if (cls.includes('Flare')) barColor = 'bg-amber-500';
              else if (cls.includes('Mining')) barColor = 'bg-purple-600';
              else if (cls.includes('Wildfire')) barColor = 'bg-emerald-600';
              else if (cls.includes('Agricultural')) barColor = 'bg-lime-600';

              return (
                <div key={cls} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-geo-800">{cls}</span>
                    <span className="font-mono text-geo-600">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-geo-100 overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Severity Risk Tiering */}
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-geo-900">Severity Risk Tiering</h3>
                <p className="text-xs text-geo-500">Distribution across operational response levels</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-red-600">Urgent: {severityDist['CRITICAL'] || 0}</span>
          </div>

          <div className="space-y-4 text-xs">
            {[
              { tier: 'CRITICAL', label: 'Immediate Industrial Emergency (<1 km buffer)', color: 'bg-red-500', count: severityDist['CRITICAL'] || 0 },
              { tier: 'HIGH', label: 'Elevated Anomaly Near Infrastructure (<2 km buffer)', color: 'bg-orange-500', count: severityDist['HIGH'] || 0 },
              { tier: 'MEDIUM', label: 'Routine Industrial Flaring / Secondary Heat Source', color: 'bg-amber-500', count: severityDist['MEDIUM'] || 0 },
              { tier: 'LOW', label: 'Background Thermal Radiance / Agricultural Burn', color: 'bg-emerald-500', count: severityDist['LOW'] || 0 },
            ].map((item) => {
              const pct = totalEvents > 0 ? Math.round((item.count / totalEvents) * 100) : 0;
              return (
                <div key={item.tier} className="p-3 rounded-xl bg-geo-50 border border-geo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-geo-900">{item.tier}</span>
                    <span className="font-mono font-bold text-geo-700">{item.count} detections</span>
                  </div>
                  <p className="text-[11px] text-geo-500">{item.label}</p>
                  <div className="w-full h-2 rounded-full bg-geo-200 overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Card 3: Persistent Hotspots and Industrial Corridors */}
      <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-geo-900">Persistent Industrial Thermal Corridors</h3>
            <p className="text-xs text-geo-500">Clusters exhibiting repeated thermal emissions across multiple orbital revisits</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-4 rounded-xl bg-geo-50 border border-geo-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-geo-900">
              <span>Jamnagar Refinery Belt</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">96% Persistence</span>
            </div>
            <p className="text-geo-600 text-[11px] leading-relaxed">
              Continuous hydrocarbon thermal cracking and flare headers. High baseline FRP (120-250 MW) with low baseline risk.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-geo-50 border border-geo-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-geo-900">
              <span>Angul Metallurgy Basin</span>
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px]">89% Persistence</span>
            </div>
            <p className="text-geo-600 text-[11px] leading-relaxed">
              Blast furnace slag discharge and direct reduced iron (DRI) rotary kilns. Periodic high-temperature venting.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-geo-50 border border-geo-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-geo-900">
              <span>Singrauli Thermal Basin</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">84% Persistence</span>
            </div>
            <p className="text-geo-600 text-[11px] leading-relaxed">
              Dense thermal power generation stacks and coal handling yards. Stable spatial cluster within 1.5 km of plant centroid.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
