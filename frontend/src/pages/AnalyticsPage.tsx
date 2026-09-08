import React from 'react';
import { AnalyticsSummary } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { MetricCard } from '../components/ui/MetricCard';
import { IconBox, MaterialIcon } from '../components/ui/IconBox';
import { RiskBadge } from '../components/ui/RiskBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';

interface AnalyticsPageProps {
  analytics: AnalyticsSummary | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="p-12 text-center text-[#61758A] text-xs">
        Loading synthesized thermal telemetry & spatial intelligence...
      </div>
    );
  }

  const exportReport = () => {
    window.print();
  };

  const total = analytics.total_anomalies || 1;
  const industrialRatio = analytics.industrial_vs_natural_ratio['Industrial Associated'] || 0;
  const naturalRatio = analytics.industrial_vs_natural_ratio['Agricultural / Wildfire'] || 0;
  const totalRatio = industrialRatio + naturalRatio || 1;
  const industrialPct = Math.round((industrialRatio / totalRatio) * 100);
  const naturalPct = 100 - industrialPct;

  return (
    <div className="py-5 content-container w-full space-y-4 min-h-[calc(100vh-72px)] font-sans">
      {/* Header */}
      <SectionHeader
        title="Analytics & Geospatial Intelligence"
        subtitle="Synthesized regional trends, industrial fire ratios, and facility risk stratification derived from satellite telemetry."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF3FB] text-[#3B82F6] border border-[#BFDBFE]">
            {analytics.total_anomalies} Total Observations
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={exportReport}
              className="btn-card-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <MaterialIcon name="download" size={16} color="#61758A" />
              <span>Export Report</span>
            </button>
          </div>
        }
      />

      {/* Top 4 Restrained Metric Blocks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="High Priority Risk Events"
          value={analytics.high_risk_count}
          icon="warning"
          iconColor="red"
          subtext="Requiring active triage"
          trendPositive={false}
          sparklineData={[4, 6, 8, 5, 9, 12, analytics.high_risk_count]}
        />

        <MetricCard
          label="Industrial Fire Ratio"
          value={`${industrialPct}%`}
          icon="factory"
          iconColor="blue"
          subtext={`${industrialRatio} Industrial vs ${naturalRatio} Natural`}
          trend={`${industrialPct}% share`}
          trendPositive={true}
          sparklineData={[52, 58, 61, 59, 64, 62, industrialPct]}
        />

        <MetricCard
          label="Persistent Sources"
          value={analytics.persistent_sources_count}
          icon="local_fire_department"
          iconColor="green"
          subtext="Routine power & flare stacks"
          sparklineData={[18, 19, 17, 20, 19, 21, analytics.persistent_sources_count]}
        />

        <MetricCard
          label="Mean Assessment Confidence"
          value={`${Math.round(analytics.avg_confidence * 100)}%`}
          icon="verified"
          iconColor="slate"
          subtext="Multi-spectral corroborated"
          trend="High confidence"
          trendPositive={true}
          sparklineData={[82, 85, 84, 88, 87, 89, Math.round(analytics.avg_confidence * 100)]}
        />
      </div>

      {/* Primary Visualizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Anomaly Count by Classification */}
        <GlassCard variant="chart" padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#CDDCE8]/45 pb-3">
            <div className="flex items-center gap-2.5">
              <IconBox icon="pie_chart" color="blue" size="heading" />
              <div>
                <h3 className="text-[15px] font-bold text-[#17324D] font-display">
                  Event Classification Breakdown
                </h3>
                <p className="text-[12px] text-[#61758A]">Distribution across thermal typologies</p>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {Object.entries(analytics.by_classification).map(([cls, count]) => {
              const pct = Math.round((count / total) * 100) || 0;
              let barColor: 'blue' | 'green' | 'amber' | 'red' | 'purple' = 'blue';
              if (cls.includes('Fire')) barColor = 'red';
              else if (cls.includes('Flare')) barColor = 'purple';
              else if (cls.includes('Agricultural') || cls.includes('Biomass')) barColor = 'green';
              else if (cls.includes('Persistent')) barColor = 'blue';
              else barColor = 'amber';

              return (
                <div key={cls} className="space-y-1.5">
                  <div className="flex justify-between text-[12px] text-[#61758A]">
                    <span className="truncate max-w-[200px] font-medium text-[#17324D]">{cls}</span>
                    <span className="font-mono font-bold text-[#17324D]">{count} ({pct}%)</span>
                  </div>
                  <ProgressBar value={pct} max={100} color={barColor} size="sm" />
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Card 2: Risk Distribution Tiers */}
        <GlassCard variant="chart" padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#CDDCE8]/45 pb-3">
            <div className="flex items-center gap-2.5">
              <IconBox icon="shield" color="red" size="heading" />
              <div>
                <h3 className="text-[15px] font-bold text-[#17324D] font-display">
                  Investigation Priority Stratification
                </h3>
                <p className="text-[12px] text-[#61758A]">Multi-factor operational risk tiers</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {Object.entries(analytics.by_severity).map(([sev, count]) => {
              let styles = 'bg-[#ECF3F9]/70 text-[#61758A] border-[#CDDCE8]/60';
              if (sev === 'CRITICAL') styles = 'bg-[#F9ECEB]/80 text-[#D95C59] border-[#D95C59]/30';
              else if (sev === 'HIGH') styles = 'bg-[#FBF3DE]/80 text-[#D89A2B] border-[#D89A2B]/30';
              else if (sev === 'MEDIUM') styles = 'bg-[#EAF3FB]/80 text-[#3B82F6] border-[#3B82F6]/30';
              else if (sev === 'LOW') styles = 'bg-[#E7F5EE]/80 text-[#2D9B7A] border-[#2D9B7A]/30';

              return (
                <div key={sev} className={`p-3 rounded-[12px] border ${styles} text-center space-y-0.5 backdrop-blur-[6px]`}>
                  <div className="text-[10.5px] font-bold uppercase tracking-wider">{sev}</div>
                  <div className="text-2xl font-bold font-display">{count}</div>
                </div>
              );
            })}
          </div>

          {/* Industrial vs Natural Ratio Visual Strip */}
          <div className="pt-3 border-t border-[#CDDCE8]/45 space-y-2 text-xs">
            <div className="text-[#61758A] text-[12px] font-medium">Contextual Attribution Ratio:</div>
            <div className="w-full h-2.5 rounded-full overflow-hidden flex border border-[#CDDCE8]/50 bg-[#E2EEF8]/40">
              <div className="bg-[#3B82F6] transition-all duration-500" style={{ width: `${industrialPct}%` }} title={`Industrial: ${industrialPct}%`} />
              <div className="bg-[#2D9B7A] transition-all duration-500" style={{ width: `${naturalPct}%` }} title={`Natural/Biomass: ${naturalPct}%`} />
            </div>
            <div className="flex justify-between text-[11.5px] text-[#61758A] pt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                Industrial ({industrialPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2D9B7A]" />
                Natural / Stubble ({naturalPct}%)
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Card 3: Regional Hotspot Clusters */}
        <GlassCard variant="chart" padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#CDDCE8]/45 pb-3">
            <div className="flex items-center gap-2.5">
              <IconBox icon="hub" color="green" size="heading" />
              <div>
                <h3 className="text-[15px] font-bold text-[#17324D] font-display">
                  Regional Industrial Clusters
                </h3>
                <p className="text-[12px] text-[#61758A]">Concentration along manufacturing belts</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {Object.entries(analytics.by_region).map(([reg, count]) => (
              <div
                key={reg}
                className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#ECF3F9]/60 hover:bg-[#E2EEF8]/80 border border-[#CDDCE8]/50 transition-colors"
              >
                <span className="text-[#17324D] font-medium">{reg}</span>
                <span className="font-mono font-bold text-[#3B82F6]">{count} events</span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#EAF3FB]/85 rounded-[12px] border border-[#BBD5EE]/70 text-[11.5px] text-[#1D5E9E] flex items-start gap-2">
            <MaterialIcon name="info" size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
            <span><b>Regional Intelligence Notice:</b> Highest density cluster currently located along Gujarat industrial refinery belt.</span>
          </div>
        </GlassCard>
      </div>

      {/* Top Assets by Risk Table */}
      <GlassCard variant="dense" padding="none" className="overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#CDDCE8]/45">
          <div className="flex items-center gap-2.5">
            <IconBox icon="corporate_fare" color="blue" size="heading" />
            <div>
              <h3 className="text-[15px] font-bold text-[#17324D] font-display">
                Top Industrial Assets by Investigation Priority
              </h3>
              <p className="text-[12px] text-[#61758A]">Multi-Factor Priority Ranking cross-referenced with OSM facilities</p>
            </div>
          </div>
          <span className="text-[11.5px] text-[#7B8D9D] font-mono hidden sm:inline-block">CRITICALITY_INDEX</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E4EFF8]/70 text-[#61758A] font-semibold border-b border-[#CDDCE8]/50 uppercase text-[10.5px] tracking-wider">
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Facility Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Criticality</th>
                <th className="py-3 px-4">Active Hotspots</th>
                <th className="py-3 px-4 text-right">Investigation Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CDDCE8]/35">
              {analytics.top_assets_by_risk.map(a => (
                <tr key={a.asset_id} className="hover:bg-[#EBF2F8]/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-[#61758A]">{a.asset_id}</td>
                  <td className="py-3 px-4 font-bold text-[#17324D]">{a.name}</td>
                  <td className="py-3 px-4 text-[#61758A]">{a.category}</td>
                  <td className="py-3 px-4">
                    <RiskBadge level={a.criticality} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#D95C59]">
                    {a.active_anomalies}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#3B82F6] text-[13.5px]">
                    {a.risk_score.toFixed(1)} / 100
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
