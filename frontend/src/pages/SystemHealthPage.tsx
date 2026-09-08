import React from 'react';
import { SystemHealth } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { IconBox, MaterialIcon } from '../components/ui/IconBox';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SectionHeader } from '../components/ui/SectionHeader';

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
    return (
      <div className="p-12 text-center text-[#61758A] text-xs">
        Connecting to system telemetry health monitor...
      </div>
    );
  }

  return (
    <div className="py-5 content-container w-full space-y-4 min-h-[calc(100vh-72px)] font-sans">
      {/* Header */}
      <SectionHeader
        title="System Health & Ingestion Telemetry"
        subtitle="Data sources, ingestion pipeline states, and satellite adapter fallback availability."
        badge={
          <StatusBadge status="CONNECTED" label="System Operational" size="md" />
        }
        actions={
          <button
            onClick={onRefresh}
            className="btn-card-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <MaterialIcon name="refresh" size={16} color="#61758A" />
            <span>Refresh Feeds</span>
          </button>
        }
      />

      {/* Operational Mode Control Card */}
      <GlassCard variant="primary" padding="md" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <IconBox
            icon="tune"
            color={health.system_mode === 'LIVE' ? 'green' : 'amber'}
            size="kpi"
          />
          <div className="space-y-1">
            <div className="text-[11px] uppercase font-bold text-[#61758A] tracking-wider">
              Current Operating Ingestion Mode
            </div>
            <div className="text-lg font-bold text-[#17324D] flex items-center gap-2.5 font-display">
              <span className={`w-2.5 h-2.5 rounded-full ${health.system_mode === 'LIVE' ? 'bg-[#2D9B7A] animate-pulse' : 'bg-[#D89A2B]'}`} />
              <span>{health.system_mode} MODE</span>
              <span className="text-xs font-normal text-[#61758A]">
                {health.system_mode === 'DEMO' ? '(Offline-Ready Demo Dataset)' : '(Live NASA FIRMS & OSM API)'}
              </span>
            </div>
            <p className="text-xs text-[#61758A] max-w-2xl leading-relaxed">
              {health.system_mode === 'LIVE'
                ? 'Attempting queries to live NASA FIRMS near-real-time satellite swaths and OSM Overpass servers.'
                : 'Utilizing verified, bundled Indian industrial cluster dataset with calibrated multi-spectral baselines. Zero internet dependency.'}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleMode}
          className="btn-card-primary px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <MaterialIcon name="swap_horiz" size={16} />
          <span>Switch to {health.system_mode === 'LIVE' ? 'DEMO MODE' : 'LIVE MODE'}</span>
        </button>
      </GlassCard>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {health.sources.map((src) => {
          let iconName = 'database';
          let iconColor: 'blue' | 'green' | 'amber' | 'purple' = 'blue';

          const nameLower = src.source_name.toLowerCase();
          if (nameLower.includes('firms') || nameLower.includes('satellite')) {
            iconName = 'satellite_alt';
            iconColor = 'blue';
          } else if (nameLower.includes('osm') || nameLower.includes('overpass')) {
            iconName = 'map';
            iconColor = 'green';
          } else if (nameLower.includes('demo')) {
            iconName = 'auto_awesome';
            iconColor = 'amber';
          } else {
            iconName = 'database';
            iconColor = 'purple';
          }

          return (
            <GlassCard key={src.source_name} variant="secondary" padding="md" className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconBox icon={iconName} color={iconColor} size="heading" />
                  <div>
                    <span className="font-bold text-[14px] text-[#17324D]">{src.source_name}</span>
                    <div className="text-[11.5px] text-[#7B8D9D]">Sync: {src.last_sync}</div>
                  </div>
                </div>
                <StatusBadge status={src.status} size="sm" />
              </div>

              <div className="text-xs text-[#61758A] bg-[#ECF3F9]/65 p-2.5 rounded-[12px] border border-[#CDDCE8]/50">
                {src.message}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#CDDCE8]/45 text-[12px] text-[#61758A]">
                <div>Record Count: <b className="text-[#17324D] font-mono ml-1">{src.record_count.toLocaleString()}</b></div>
                <div>Latency: <b className="text-[#3B82F6] font-mono ml-1">{src.latency_ms} ms</b></div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Institutional Architecture Information */}
      <GlassCard variant="primary" padding="md" className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <IconBox icon="verified_user" color="green" size="heading" />
          <h3 className="text-xs font-bold text-[#17324D] uppercase tracking-wider font-display">
            Architectural Fault-Tolerance & Fallback Design
          </h3>
        </div>
        <p className="text-xs text-[#61758A] leading-relaxed pl-1">
          ThermoScope AI is engineered to guarantee zero operational interruption during critical disaster management evaluations. When live NASA FIRMS API keys are unconfigured or Overpass servers experience rate limiting, the internal adapter layer automatically serves normalized high-resolution local geospatial assets without user interruption.
        </p>
      </GlassCard>
    </div>
  );
};
