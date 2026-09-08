import React from 'react';
import { GlassCard } from './GlassCard';

export interface ChartLegendItem {
  label: string;
  color: string;
  value?: string | number;
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  legend?: ChartLegendItem[];
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  badge,
  actions,
  legend,
  children,
  className = ''
}) => {
  return (
    <GlassCard
      variant="chart"
      padding="md"
      className={`space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#CDDCE8]/45 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-semibold text-[#17324D] font-display">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-[13px] text-[#61758A] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Main Chart Content */}
      <div className="relative">
        {children}
      </div>

      {/* Optional Legend */}
      {legend && legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#CDDCE8]/35 text-[12px]">
          {legend.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#61758A]">{item.label}</span>
              {item.value !== undefined && (
                <span className="font-semibold text-[#17324D] font-mono ml-0.5">
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
