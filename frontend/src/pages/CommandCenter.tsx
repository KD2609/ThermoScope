import React, { useRef, useState } from 'react';
import { ThermalAnomaly, IndustrialAsset, Alert, AnalyticsSummary } from '../types';
import { MapComponent } from '../components/MapComponent';
import {
  GlassCard,
  MetricCard,
  RiskBadge,
  StatusBadge,
  SectionHeader,
  IconBox,
  MaterialIcon,
  ProgressBar,
  DataSourceRow,
  ChartCard,
  MapCard
} from '../components/ui';
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Info
} from 'lucide-react';

import heroBgImage from '../assets/images/hero-panoramic.jpg';

interface CommandCenterProps {
  anomalies: ThermalAnomaly[];
  assets: IndustrialAsset[];
  alerts: Alert[];
  analytics: AnalyticsSummary | null;
  onSelectAnomaly: (id: number) => void;
  onSelectAsset: (id: number) => void;
  onViewAlerts: () => void;
  onViewHealth?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  anomalies,
  assets,
  alerts,
  analytics,
  onSelectAnomaly,
  onSelectAsset,
  onViewAlerts,
  onViewHealth
}) => {
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [mapLayout, setMapLayout] = useState<'SPLIT' | 'FULL'>('SPLIT');

  // Compute metrics from actual data
  const totalAnomalies = analytics?.total_anomalies ?? anomalies.length;
  const industrialEvents = analytics?.industrial_events_count ?? anomalies.filter(a => 
    ['Potential Industrial Fire', 'Routine / Persistent Industrial Thermal Source', 'Gas Flare / Combustion Source'].includes(a.classification_class)
  ).length;
  const highRiskEvents = analytics?.high_risk_count ?? anomalies.filter(a => a.risk_level === 'CRITICAL' || a.risk_level === 'HIGH').length;
  const persistentCount = analytics?.persistent_sources_count ?? assets.filter(a => a.persistence_detected).length;
  const new24hCount = analytics?.new_events_24h ?? anomalies.slice(0, 5).length;
  const avgConfidence = analytics ? Math.round(analytics.avg_confidence * 100) : 88;

  const scrollToMap = () => {
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col font-sans text-[#102A43]">
      {/* ============================================================ */}
      {/* 1. HERO / COMMAND CENTER INTRODUCTION                        */}
      {/* ============================================================ */}
      <section 
        className="relative h-[485px] lg:h-[500px] xl:h-[510px] max-h-[520px] flex flex-col justify-center border-b border-[#D9E2EA] overflow-hidden bg-no-repeat bg-[position:center_top] bg-[length:100%_auto]"
        style={{
          backgroundImage: `url(${heroBgImage})`,
        }}
      >
        {/* Subtle, delicate gradient on the left for text readability; sheer and crisp on the right */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(248,250,252,0.68) 0%, rgba(248,250,252,0.40) 36%, rgba(248,250,252,0.10) 68%, rgba(248,250,252,0.02) 100%)'
          }}
        />

        <div className="w-full content-container relative z-10 py-2 sm:py-3">
          <div className="w-full max-w-[540px] xl:max-w-[580px] space-y-3 xl:space-y-3.5">
            {/* Organization Attribution Badge: Translucent Glass */}
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/70 backdrop-blur-[12px] border border-white/85 shadow-subtle text-[10.5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3978D8]" />
              <span className="font-semibold tracking-wider text-[#102A43] uppercase text-[10px] font-sans">
                National Technical Research Organisation
              </span>
            </div>

            {/* Title & Tagline */}
            <div className="space-y-1.5">
              <h1 className="text-[38px] sm:text-[44px] lg:text-[50px] xl:text-[54px] font-bold text-[#102A43] tracking-tight font-display leading-[1.04]">
                Industrial Intelligence <br />
                <span className="text-[#3978D8]">from Space</span>
              </h1>
              <p className="text-[16.5px] lg:text-[17.5px] text-[#243B53] font-medium leading-snug font-sans">
                Monitor. Analyze. Prioritize. For a safer tomorrow.
              </p>
            </div>

            {/* Action Buttons: 42px height */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <button
                onClick={scrollToMap}
                className="h-[42px] px-5 bg-[#3978D8] hover:bg-[#2D66BE] text-white font-medium rounded-xl text-[13px] xl:text-[13.5px] shadow-sm transition-all duration-150 flex items-center gap-2 group cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">explore</span>
                <span>Explore Map</span>
                <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </button>

              <button
                onClick={() => {
                  const scenarioBtn = document.querySelector('[title*="Jamnagar"]') as HTMLButtonElement;
                  if (scenarioBtn) scenarioBtn.click();
                }}
                className="h-[42px] px-5 bg-white/75 hover:bg-white/90 text-[#102A43] backdrop-blur-[12px] border border-white/90 font-medium rounded-xl text-[13px] xl:text-[13.5px] shadow-subtle transition-all duration-150 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px] text-[#D95C59]">local_fire_department</span>
                <span>Watch Demo Scenario</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. KPI STRIP (6 Frosted Cards)                                */}
      {/* ============================================================ */}
      <section className="pt-4 pb-2 content-container w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 xl:gap-4">
          <MetricCard
            label="Active Thermal Anomalies"
            value={totalAnomalies}
            icon="local_fire_department"
            iconColor="red"
            trend="+3 in last swath"
            trendPositive={false}
            sparklineData={[14, 16, 15, 18, 22, 20, totalAnomalies]}
          />

          <MetricCard
            label="Potential Industrial Events"
            value={industrialEvents}
            icon="factory"
            iconColor="purple"
            trend="Associated with assets"
            trendPositive={true}
            sparklineData={[4, 5, 5, 6, 5, 7, industrialEvents]}
          />

          <MetricCard
            label="High Priority Investigations"
            value={highRiskEvents}
            icon="warning"
            iconColor="amber"
            trend="Action required"
            trendPositive={false}
            sparklineData={[2, 3, 2, 4, 3, 4, highRiskEvents]}
          />

          <MetricCard
            label="Persistent Thermal Sources"
            value={persistentCount}
            icon="sync_alt"
            iconColor="slate"
            trend="Routine flares/boilers"
            sparklineData={[3, 4, 4, 4, 5, 4, persistentCount]}
          />

          <MetricCard
            label="New Events (24h)"
            value={new24hCount}
            icon="satellite_alt"
            iconColor="blue"
            trend="Latest satellite pass"
            sparklineData={[5, 6, 8, 7, 9, 6, new24hCount]}
          />

          <MetricCard
            label="Average Assessment Confidence"
            value={`${avgConfidence}%`}
            icon="verified"
            iconColor="green"
            trend="Verified multi-spectral"
            trendPositive={true}
            sparklineData={[82, 84, 85, 86, 87, 88, avgConfidence]}
          />
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. THERMAL ACTIVITY MAP & LIVE OPERATIONS                     */}
      {/* ============================================================ */}
      <section 
        ref={mapSectionRef}
        id="map-section"
        className="pt-7 pb-5 content-container w-full space-y-3"
      >
        <SectionHeader
          title="Thermal Activity Map"
          subtitle="Explore thermal anomalies and industrial assets across India"
          badge={
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF3FB] text-[#3B82F6] border border-[#3B82F6]/25 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
              Live Geospatial Telemetry
            </span>
          }
          actions={
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-[#ECF3F9]/80 border border-[#CDDCE8]/65 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMapLayout('SPLIT')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    mapLayout === 'SPLIT'
                      ? 'bg-white text-[#17324D] shadow-sm'
                      : 'text-[#61758A] hover:text-[#17324D]'
                  }`}
                >
                  Split View
                </button>
                <button
                  type="button"
                  onClick={() => setMapLayout('FULL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    mapLayout === 'FULL'
                      ? 'bg-white text-[#17324D] shadow-sm'
                      : 'text-[#61758A] hover:text-[#17324D]'
                  }`}
                >
                  Full Map
                </button>
              </div>

              <span className="text-xs text-[#61758A] hidden lg:inline">
                Click any anomaly to inspect intelligence
              </span>
            </div>
          }
        />

        {/* Map + Live Alert Triage Feed Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Main GIS Map */}
          <div className={mapLayout === 'SPLIT' ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <MapCard 
              containerClassName="h-[520px] lg:h-[560px]"
              title="National Geospatial Thermal Surveillance"
              badge={
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EAF3FB] text-[#3B82F6] border border-[#BFDBFE]">
                  {anomalies.length} Hotspots &bull; {assets.length} Facilities
                </span>
              }
              actions={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMapLayout(mapLayout === 'SPLIT' ? 'FULL' : 'SPLIT')}
                    className="p-1 rounded hover:bg-white/80 text-[#61758A] hover:text-[#17324D] transition"
                    title={mapLayout === 'SPLIT' ? 'Expand to full width' : 'Collapse to split view'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {mapLayout === 'SPLIT' ? 'fullscreen' : 'fullscreen_exit'}
                    </span>
                  </button>
                </div>
              }
            >
              <MapComponent
                anomalies={anomalies}
                assets={assets}
                onSelectAnomaly={onSelectAnomaly}
                className="w-full h-full min-h-[500px]"
              />
            </MapCard>
          </div>

          {/* Right Live Alert Feed Panel (Visible in Split View) */}
          {mapLayout === 'SPLIT' && (
            <div className="lg:col-span-4 flex flex-col">
              <GlassCard 
                variant="primary" 
                padding="none" 
                className="h-[520px] lg:h-[560px] flex flex-col overflow-hidden border border-[#CDDCE8]/75 shadow-[0_8px_24px_rgba(30,55,80,0.06)]"
              >
                {/* Panel Header */}
                <div className="p-3 sm:p-4 border-b border-[#CDDCE8]/65 flex items-center justify-between bg-[#ECF3F9]/60 backdrop-blur-md shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#D95C59] animate-pulse">
                      emergency
                    </span>
                    <h3 className="text-[15px] font-semibold text-[#17324D] font-display">
                      Live Alert Triage
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FCE8E8] text-[#D95C59] border border-[#F5C2C2]">
                      {alerts.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={onViewAlerts}
                    className="text-xs font-semibold text-[#2F6FED] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Alerts List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {alerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#61758A]">
                      <span className="material-symbols-outlined text-[32px] text-[#2D9B7A]/60 mb-2">verified_user</span>
                      <div className="font-semibold text-[13px] text-[#17324D]">All Feeds Nominal</div>
                      <p className="text-[11.5px] text-[#61758A] mt-1">No active high-risk alerts requiring immediate triage.</p>
                    </div>
                  ) : (
                    alerts.slice(0, 5).map((alert) => {
                      const isCritical = alert.severity === 'CRITICAL';
                      return (
                        <div
                          key={alert.id}
                          onClick={() => onSelectAnomaly(alert.anomaly_id)}
                          className="p-3 rounded-xl bg-white/70 hover:bg-white/95 border border-[#CDDCE8]/60 transition-all cursor-pointer group shadow-[0_2px_8px_rgba(30,55,80,0.03)] hover:shadow-[0_6px_16px_rgba(30,55,80,0.06)]"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isCritical
                                  ? 'bg-[#FCE8E8] text-[#D95C59] border border-[#F5C2C2]'
                                  : 'bg-[#FBF3DE] text-[#D89A2B] border border-[rgba(216,154,43,0.3)]'
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-[10.5px] text-[#7B8D9D] font-mono">
                              {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-[12px] font-semibold text-[#17324D] line-clamp-1 mb-1 group-hover:text-[#2F6FED] transition-colors">
                            {alert.facility_name}
                          </div>

                          <p className="text-[11.5px] text-[#61758A] line-clamp-2 leading-relaxed">
                            {alert.message}
                          </p>

                          <div className="mt-2 pt-2 border-t border-[#CDDCE8]/45 flex items-center justify-between text-[11px]">
                            <span className="text-[10px] font-mono text-[#7B8D9D]">
                              Hotspot #{alert.anomaly_id}
                            </span>
                            <span className="text-[#2F6FED] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                              <span>Triage Dossier</span>
                              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Facility Hotspots Sub-panel */}
                <div className="p-3 border-t border-[#CDDCE8]/65 bg-[#ECF3F9]/50 backdrop-blur-sm shrink-0">
                  <div className="text-[10px] uppercase font-bold text-[#61758A] tracking-wider mb-2 flex items-center justify-between">
                    <span>High Priority Facilities</span>
                    <span className="text-[#7B8D9D] font-normal lowercase">click to focus</span>
                  </div>
                  <div className="space-y-1.5">
                    {assets.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        onClick={() => onSelectAsset(a.id)}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/60 hover:bg-white border border-[#CDDCE8]/50 hover:border-[#3B82F6]/40 cursor-pointer transition text-xs"
                      >
                        <span className="font-medium text-[#17324D] truncate max-w-[190px]">
                          {a.name}
                        </span>
                        <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#FCE8E8] text-[#D95C59]">
                          {a.active_anomalies_count} active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SCROLL TRANSITION INDICATOR                               */}
      {/* ============================================================ */}
      <div className="py-2.5 flex flex-col items-center justify-center text-center select-none text-xs text-[#61758A]">
        <div className="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase text-[10px] text-[#6687A8] bg-[#F0F6FB]/70 backdrop-blur-md px-3 py-0.5 rounded-full border border-[#CDDCE8]/65 shadow-[0_4px_12px_rgba(30,55,80,0.04)] animate-bounce">
          <span>Scroll to explore more</span>
          <span className="material-symbols-outlined text-[13px]">expand_more</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. RECENT INCIDENTS (Full-Width Table)                       */}
      {/* ============================================================ */}
      <section className="py-5 content-container w-full space-y-3">
        <SectionHeader
          title="Recent Detections & Incidents"
          subtitle="Synthesized satellite thermal observations cross-referenced with industrial perimeters"
          badge={
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EEF3F7] text-[#52677D]">
              {anomalies.length} Records
            </span>
          }
          actions={
            <button
              onClick={onViewAlerts}
              className="text-xs font-semibold text-[#2F6FED] hover:underline flex items-center gap-1"
            >
              <span>View All Alerts</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          }
        />

        {/* Incidents Table */}
        <GlassCard variant="dense" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E8F0F7]/75 text-[#61758A] font-bold border-b border-[#CDDCE8]/65 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">Event ID</th>
                  <th className="py-3 px-3.5">Location / Coordinates</th>
                  <th className="py-3 px-3.5">Classification</th>
                  <th className="py-3 px-3.5">Investigation Risk</th>
                  <th className="py-3 px-3.5">Confidence</th>
                  <th className="py-3 px-3.5">Observation Time</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CDDCE8]/45">
                {anomalies.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#7B8D9D]">
                      No active thermal anomalies detected. Feeds nominal.
                    </td>
                  </tr>
                ) : (
                  anomalies.slice(0, 8).map((anom) => {
                    const confPct = Math.round(anom.classification_confidence * 100);
                    return (
                      <tr
                        key={anom.id}
                        onClick={() => onSelectAnomaly(anom.id)}
                        className="hover:bg-[#DCEDF8]/35 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-3.5 font-mono font-bold text-[#17324D]">
                          {anom.event_id}
                          {anom.is_simulated && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-[#EAF3FB] text-[#3B82F6] border border-[#3B82F6]/25 font-sans uppercase">
                              Sim
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3.5">
                          <div className="font-semibold text-[#17324D] truncate max-w-[180px]">
                            {anom.facility_name}
                          </div>
                          <div className="text-[11px] text-[#7B8D9D] font-mono">
                            {anom.latitude.toFixed(3)}&deg;N, {anom.longitude.toFixed(3)}&deg;E
                          </div>
                        </td>

                        <td className="py-2.5 px-3.5 font-medium text-[#17324D]">
                          {anom.classification_class}
                        </td>

                        <td className="py-2.5 px-3.5">
                          <RiskBadge level={anom.risk_level} score={anom.risk_score} size="sm" />
                        </td>

                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-[#B4C8DC]/28 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#5B8DEF] rounded-full"
                                style={{ width: `${confPct}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-[#61758A]">
                              {confPct}%
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3.5 text-[#61758A] whitespace-nowrap">
                          {new Date(anom.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          {new Date(anom.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="py-2.5 px-3.5">
                          <StatusBadge status={anom.processing_status || 'NEW'} size="sm" />
                        </td>

                        <td className="py-2.5 px-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAnomaly(anom.id);
                            }}
                            className="btn-card-secondary !text-[11px] !py-1 !px-2.5"
                          >
                            <span>Dossier</span>
                            <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </section>

      {/* ============================================================ */}
      {/* 6. SYSTEM STATUS + ANALYTICS (Two-Column Section)            */}
      {/* ============================================================ */}
      <section className="py-5 content-container w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: System Ingestion Status */}
          <div className="lg:col-span-5 space-y-3">
            <SectionHeader
              title="System Status"
              subtitle="Data ingestion pipelines & fallback connectivity"
            />

            <GlassCard variant="primary" padding="md" className="space-y-1">
              <DataSourceRow
                source={{
                  name: 'NASA FIRMS (VIIRS & MODIS)',
                  status: 'ACTIVE',
                  records: 48,
                  latencyMs: 142,
                  icon: 'satellite_alt',
                  color: 'blue',
                  message: 'Near-real-time thermal radiance'
                }}
              />
              <DataSourceRow
                source={{
                  name: 'OpenStreetMap Overpass',
                  status: 'CONNECTED',
                  records: 1250,
                  latencyMs: 310,
                  icon: 'map',
                  color: 'green',
                  message: 'Industrial boundaries & landuse'
                }}
              />
              <DataSourceRow
                source={{
                  name: 'Satellite Optical Context',
                  status: 'AVAILABLE',
                  records: 8,
                  latencyMs: 185,
                  icon: 'layers',
                  color: 'blue',
                  message: 'High-res imagery tile cache'
                }}
              />
              <DataSourceRow
                source={{
                  name: 'Industrial Asset Registry',
                  status: 'LOADED',
                  records: assets.length,
                  latencyMs: 45,
                  icon: 'factory',
                  color: 'purple',
                  message: 'Mapped facilities across India'
                }}
              />
              <DataSourceRow
                source={{
                  name: 'SIH Scenario Engine',
                  status: 'STANDBY',
                  records: 'A/B/C',
                  latencyMs: 10,
                  icon: 'auto_awesome',
                  color: 'amber',
                  message: 'Jamnagar & custom telemetry scenarios'
                }}
                isLast
              />
            </GlassCard>
          </div>

          {/* RIGHT: High-Level Analytics Preview */}
          <div className="lg:col-span-7 space-y-3">
            <SectionHeader
              title="Analytics Overview"
              subtitle="Classification split and severity distribution"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Classification Split */}
              <ChartCard
                title="Classification Split"
                subtitle="Top anomaly categories"
              >
                <div className="space-y-3">
                  {Object.entries(analytics?.by_classification || {
                    'Potential Industrial Fire': 3,
                    'Routine / Persistent Industrial Thermal Source': 4,
                    'Gas Flare / Combustion Source': 2,
                    'Agricultural Burn / Crop Residue': 8,
                    'Wildfire / Vegetation Fire': 1
                  }).slice(0, 4).map(([cls, count]) => (
                    <ProgressBar
                      key={cls}
                      label={cls}
                      countLabel={String(count)}
                      value={Number(count)}
                      max={10}
                      color="blue"
                    />
                  ))}
                </div>
              </ChartCard>

              {/* Risk Tier Stratification */}
              <ChartCard
                title="Risk Tier Distribution"
                subtitle="Operational severity breakdown"
              >
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-[12px] bg-[#F9ECEB] border border-[rgba(217,92,89,0.25)] text-center space-y-0.5 shadow-[0_2px_8px_rgba(30,55,80,0.02)]">
                    <div className="text-[10.5px] font-bold text-[#D95C59] uppercase tracking-wider">Critical</div>
                    <div className="text-[24px] font-bold text-[#D95C59] font-display leading-none">
                      {analytics?.by_severity?.['CRITICAL'] ?? 2}
                    </div>
                  </div>

                  <div className="p-3 rounded-[12px] bg-[#FFF1F2] border border-[#FECDD3] text-center space-y-0.5 shadow-[0_2px_8px_rgba(30,55,80,0.02)]">
                    <div className="text-[10.5px] font-bold text-[#D95C59] uppercase tracking-wider">High</div>
                    <div className="text-[24px] font-bold text-[#D95C59] font-display leading-none">
                      {analytics?.by_severity?.['HIGH'] ?? 3}
                    </div>
                  </div>

                  <div className="p-3 rounded-[12px] bg-[#FBF3DE] border border-[rgba(216,154,43,0.25)] text-center space-y-0.5 shadow-[0_2px_8px_rgba(30,55,80,0.02)]">
                    <div className="text-[10.5px] font-bold text-[#D89A2B] uppercase tracking-wider">Medium</div>
                    <div className="text-[24px] font-bold text-[#D89A2B] font-display leading-none">
                      {analytics?.by_severity?.['MEDIUM'] ?? 4}
                    </div>
                  </div>

                  <div className="p-3 rounded-[12px] bg-[#E7F5EE] border border-[rgba(45,155,122,0.25)] text-center space-y-0.5 shadow-[0_2px_8px_rgba(30,55,80,0.02)]">
                    <div className="text-[10.5px] font-bold text-[#2D9B7A] uppercase tracking-wider">Low / Info</div>
                    <div className="text-[24px] font-bold text-[#2D9B7A] font-display leading-none">
                      {analytics?.by_severity?.['LOW'] ?? 5}
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FEATURED EDITORIAL INSIGHT                                */}
      {/* ============================================================ */}
      <section className="py-5 content-container w-full">
        <GlassCard variant="secondary" padding="md" className="relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-8 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3FB] text-[#3B82F6] border border-[#3B82F6]/25 text-[11px] font-semibold">
                <span className="material-symbols-outlined text-[15px]">insights</span>
                <span>Featured Intelligence Insight</span>
              </div>
              <h3 className="text-[17px] sm:text-[18px] font-bold text-[#17324D] font-display leading-snug">
                Increased thermal activity detected in western industrial corridor
              </h3>
              <p className="text-[13px] text-[#61758A] leading-relaxed">
                Persistent thermal anomalies detected near petrochemical refining infrastructure over consecutive orbital passes. Sensor radiance readings deviate by +42% from the 30-day baseline envelope. Further operational investigation and on-site dispatch triage is recommended.
              </p>
              <div className="pt-1 flex items-center gap-3 text-[12px] text-[#7B8D9D]">
                <span>Confidence Level: <b className="text-[#17324D]">HIGH (91%)</b></span>
                <span>&bull;</span>
                <span className="text-[#2D9B7A] font-medium">Agricultural burn suppression active</span>
              </div>
            </div>

            {/* Subtle Illustration Vignette */}
            <div className="md:col-span-4 flex justify-center md:justify-end">
              <GlassCard variant="subtle" padding="sm" radius="sm" className="w-48 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-[#7B8D9D] tracking-wider">Corridor Summary</div>
                <div className="space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Zone:</span>
                    <span className="font-semibold text-[#17324D]">Gujarat Hub</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Mean FRP:</span>
                    <span className="font-semibold text-[#D95C59] font-mono">48.2 MW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#61758A]">Status:</span>
                    <span className="text-[#D89A2B] font-semibold">Under Review</span>
                  </div>
                </div>
                <div className="text-[10px] text-[#7B8D9D] italic pt-1 border-t border-[#CDDCE8]/45">
                  Ground dispatch recommended.
                </div>
              </GlassCard>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* ============================================================ */}
      {/* 8. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="mt-auto bg-white/70 backdrop-blur-md border-t border-[#D9E2EA] py-5">
        <div className="content-container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52677D]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-[#2F6FED]/10 text-[#2F6FED] flex items-center justify-center font-bold">
              T
            </div>
            <div>
              <span className="font-bold text-[#102A43]">ThermoScope AI</span>
              <span className="mx-2 text-[#CBD5E1]">&bull;</span>
              <span>From Thermal Anomaly to Action</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={onViewHealth}
              className="hover:text-[#2F6FED] font-medium transition cursor-pointer flex items-center gap-1.5"
              title="Inspect System Telemetry & Sensors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>System Health</span>
            </button>
            <a href="#about" className="hover:text-[#102A43] transition">About</a>
            <a href="#documentation" className="hover:text-[#102A43] transition">Documentation</a>
            <a href="#support" className="hover:text-[#102A43] transition">Support</a>
            <a href="#privacy" className="hover:text-[#102A43] transition">Privacy</a>
          </div>

          <div className="text-[#6B7C8F] text-[11px]">
            Built for a safer tomorrow &bull; NTRO SIH PS 26162
          </div>
        </div>
      </footer>
    </div>
  );
};
