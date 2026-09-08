import React from 'react';

export type ProgressColor = 'blue' | 'green' | 'amber' | 'red' | 'purple';

interface ProgressBarProps {
  value: number; // 0 to 100 or actual count if max is provided
  max?: number;
  color?: ProgressColor;
  label?: string;
  countLabel?: string | number;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'blue',
  label,
  countLabel,
  className = '',
  showPercentage = false,
  size = 'md'
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorConfig = {
    blue: 'bg-[#5B8DEF]',
    green: 'bg-[#47A87D]',
    amber: 'bg-[#D8A23A]',
    red: 'bg-[#D96C6C]',
    purple: 'bg-[#7C6FD1]'
  }[color];

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5'
  }[size];

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {(label || countLabel !== undefined || showPercentage) && (
        <div className="flex items-center justify-between text-[12px]">
          {label && <span className="font-medium text-[#61758A] truncate">{label}</span>}
          <div className="flex items-center gap-1.5 ml-auto text-[#17324D] font-medium font-mono text-[11.5px]">
            {countLabel !== undefined && <span>{countLabel}</span>}
            {showPercentage && <span className="text-[#7B8D9D]">({percentage.toFixed(0)}%)</span>}
          </div>
        </div>
      )}

      {/* Elegant thin track */}
      <div className={`w-full ${heightClass} bg-[#B4C8DC]/28 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorConfig}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
