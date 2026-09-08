import React from 'react';
import { GlassCard } from './GlassCard';
import { IconBox, IconBoxColor, MaterialIcon } from './IconBox';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: string; // Material Symbol name
  iconComponent?: React.ComponentType<{ className?: string }>;
  iconColor?: IconBoxColor;
  trend?: string;
  trendPositive?: boolean;
  subtext?: string;
  sparklineData?: number[];
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon = 'local_fire_department',
  iconComponent: IconComponent,
  iconColor = 'blue',
  trend,
  trendPositive,
  subtext,
  sparklineData = [12, 16, 14, 20, 18, 23, 22],
  className = ''
}) => {
  // Generate subtle mini sparkline with thin stroke
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const width = 42;
  const height = 15;
  const points = sparklineData
    .map((d, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((d - minVal) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <GlassCard
      variant="primary"
      radius="sm"
      padding="none"
      hoverEffect
      className={`p-3.5 xl:p-4 flex flex-col justify-between h-[116px] max-h-[120px] group rounded-[15px] ${className}`}
    >
      {/* Top Row: Icon Container and Sparkline */}
      <div className="flex items-center justify-between gap-2">
        <IconBox
          icon={icon}
          color={iconColor}
          size="kpi"
        >
          {IconComponent && <IconComponent className="w-4 h-4" />}
        </IconBox>

        {/* Subtle mini sparkline */}
        <div className="shrink-0 opacity-65 group-hover:opacity-100 transition-opacity">
          <svg width={width} height={height} className="overflow-visible">
            <polyline
              fill="none"
              stroke="#6687A8"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* Center: Label and KPI number */}
      <div className="space-y-0.5 min-w-0">
        <div className="text-[11.5px] font-medium text-[#61758A] leading-tight truncate" title={label}>
          {label}
        </div>
        <div className="text-[26px] xl:text-[28px] font-bold text-[#17324D] tracking-tight font-display leading-none">
          {value}
        </div>
      </div>

      {/* Bottom: Trend / Subtext */}
      {(trend || subtext) && (
        <div className="pt-1 border-t border-[#CDDCE8]/45 flex items-center justify-between text-[11px] text-[#7B8D9D] min-w-0">
          {trend && (
            <span
              className={`inline-flex items-center font-medium truncate gap-0.5 ${
                trendPositive === true
                  ? 'text-[#2D9B7A]'
                  : trendPositive === false
                  ? 'text-[#D95C59]'
                  : 'text-[#61758A]'
              }`}
            >
              <span>{trend.startsWith('↑') || trend.startsWith('↓') || trend.startsWith('+') ? '' : (trendPositive ? '↑ ' : '')}</span>
              <span className="truncate">{trend}</span>
            </span>
          )}
          {subtext && <span className="truncate ml-auto text-[10.5px]">{subtext}</span>}
        </div>
      )}
    </GlassCard>
  );
};
