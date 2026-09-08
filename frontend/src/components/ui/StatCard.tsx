import React from 'react';
import { GlassCard } from './GlassCard';
import { IconBox, IconBoxColor } from './IconBox';

export interface EnvironmentalMetric {
  id: string | number;
  label: string;
  value: string | number;
  unit?: string;
  icon: string; // Material Symbol name
  trend?: 'positive' | 'negative' | 'warning' | 'neutral';
  trendText?: string;
  color?: IconBoxColor;
}

interface StatCardProps {
  title?: string;
  subtitle?: string;
  metrics: EnvironmentalMetric[];
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  metrics,
  className = ''
}) => {
  const trendColorMap = {
    positive: 'text-[#2D9B7A]',
    negative: 'text-[#D95C59]',
    warning: 'text-[#D89A2B]',
    neutral: 'text-[#61758A]'
  };

  const trendIconMap = {
    positive: 'trending_up',
    negative: 'trending_down',
    warning: 'warning',
    neutral: 'remove'
  };

  return (
    <GlassCard variant="primary" padding="md" className={`space-y-3.5 ${className}`}>
      {(title || subtitle) && (
        <div className="border-b border-[#CDDCE8]/45 pb-2.5">
          {title && (
            <h3 className="text-[16px] font-semibold text-[#17324D] font-display">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[13px] text-[#61758A] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Metric Rows with thin dividers */}
      <div className="divide-y divide-[#CDDCE8]/45">
        {metrics.map((m) => (
          <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <IconBox
                icon={m.icon}
                color={m.color || 'slate'}
                size="list"
              />
              <span className="text-[13px] font-medium text-[#61758A]">
                {m.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-right">
              <span className="text-[15px] font-bold text-[#17324D] font-mono">
                {m.value}{m.unit && <span className="text-[12px] font-normal text-[#7B8D9D] ml-0.5">{m.unit}</span>}
              </span>
              {m.trend && (
                <span className={`flex items-center gap-0.5 text-[11px] font-medium ${trendColorMap[m.trend]}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {trendIconMap[m.trend]}
                  </span>
                  {m.trendText && <span>{m.trendText}</span>}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
