import React from 'react';

interface RiskBadgeProps {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | string;
  score?: number;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showDot = true,
  size = 'md',
  className = ''
}) => {
  const norm = (level || '').toUpperCase();

  let styles = 'bg-[#E6EEF5]/65 text-[#6687A8] border border-[#CDDCE8]/65';
  let dotColor = 'bg-[#6687A8]';

  if (norm === 'CRITICAL') {
    // Pale red background
    styles = 'bg-[#F9ECEB] text-[#D95C59] border border-[rgba(217,92,89,0.25)]';
    dotColor = 'bg-[#D95C59]';
  } else if (norm === 'HIGH') {
    // Very light rose
    styles = 'bg-[#FFF1F2] text-[#D95C59] border border-[#FECDD3]';
    dotColor = 'bg-[#D95C59]';
  } else if (norm === 'MEDIUM') {
    // Pale amber
    styles = 'bg-[#FBF3DE] text-[#D89A2B] border border-[rgba(216,154,43,0.25)]';
    dotColor = 'bg-[#D89A2B]';
  } else if (norm === 'LOW') {
    // Pale green
    styles = 'bg-[#E7F5EE] text-[#2D9B7A] border border-[rgba(45,155,122,0.25)]';
    dotColor = 'bg-[#2D9B7A]';
  } else if (norm === 'INFO') {
    styles = 'bg-[#EAF3FB] text-[#3B82F6] border border-[rgba(59,130,246,0.25)]';
    dotColor = 'bg-[#3B82F6]';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-1',
    md: 'text-[12px] px-3 py-1.5 font-semibold',
    lg: 'text-[13px] px-3.5 py-2 font-bold'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide ${styles} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span>{norm}</span>
      {score !== undefined && (
        <span className="opacity-80 font-mono text-[11px] font-normal ml-0.5">
          ({score.toFixed(0)})
        </span>
      )}
    </span>
  );
};
