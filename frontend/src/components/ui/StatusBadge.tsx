import React from 'react';

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
  size = 'md'
}) => {
  const norm = (status || '').toUpperCase().replace('_', ' ');
  const displayText = label || norm;

  let styles = 'bg-[rgba(100,130,170,0.12)] text-[#526F91] border border-[rgba(100,130,170,0.25)]';
  let dot = 'bg-[#526F91]';

  if (norm === 'ACTIVE' || norm === 'CONNECTED' || norm === 'RUNNING' || norm === 'OPERATIONAL' || norm === 'RESOLVED' || norm === 'AVAILABLE') {
    // Soft green
    styles = 'bg-[rgba(46,160,120,0.12)] text-[#237A5B] border border-[rgba(46,160,120,0.25)]';
    dot = 'bg-[#2D9B7A]';
  } else if (norm === 'CACHED' || norm === 'STANDBY' || norm === 'OPTIONAL') {
    // Slate
    styles = 'bg-[rgba(100,130,170,0.12)] text-[#526F91] border border-[rgba(100,130,170,0.25)]';
    dot = 'bg-[#6687A8]';
  } else if (norm === 'NEW') {
    // Soft blue
    styles = 'bg-[rgba(59,130,246,0.12)] text-[#3B82F6] border border-[rgba(59,130,246,0.25)]';
    dot = 'bg-[#3B82F6] animate-pulse';
  } else if (norm === 'UNDER REVIEW' || norm === 'INVESTIGATING' || norm === 'WARNING') {
    // Soft amber
    styles = 'bg-[rgba(216,154,43,0.12)] text-[#D89A2B] border border-[rgba(216,154,43,0.25)]';
    dot = 'bg-[#D89A2B]';
  } else if (norm === 'HIGH RISK' || norm === 'CRITICAL' || norm === 'UNAVAILABLE' || norm === 'OFFLINE' || norm === 'VERIFIED') {
    // Soft pale red
    styles = 'bg-[#F9ECEB] text-[#D95C59] border border-[rgba(217,92,89,0.25)]';
    dot = 'bg-[#D95C59]';
  } else if (norm === 'FALSE POSITIVE') {
    styles = 'bg-[#E7F5EE] text-[#2D9B7A] border border-[rgba(45,155,122,0.25)]';
    dot = 'bg-[#2D9B7A]';
  }

  const sizeClass = size === 'sm'
    ? 'text-[11px] px-2.5 py-1'
    : 'text-[12px] px-3 py-1.5 font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide ${styles} ${sizeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      <span>{displayText}</span>
    </span>
  );
};
