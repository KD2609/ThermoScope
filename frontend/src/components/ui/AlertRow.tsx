import React from 'react';
import { IconBox, IconBoxColor } from './IconBox';
import { StatusBadge } from './StatusBadge';
import { RiskBadge } from './RiskBadge';

export interface AlertRowItem {
  id: number;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  timestamp?: string;
  assignedTo?: string | null;
}

interface AlertRowProps {
  item: AlertRowItem;
  onAction?: () => void;
  onInspect?: () => void;
  className?: string;
  isLast?: boolean;
}

export const AlertRow: React.FC<AlertRowProps> = ({
  item,
  onAction,
  onInspect,
  className = '',
  isLast = false
}) => {
  const severityColorMap: Record<string, IconBoxColor> = {
    CRITICAL: 'red',
    HIGH: 'red',
    MEDIUM: 'amber',
    LOW: 'green'
  };

  const iconNameMap: Record<string, string> = {
    CRITICAL: 'warning',
    HIGH: 'priority_high',
    MEDIUM: 'error_outline',
    LOW: 'info'
  };

  const color = severityColorMap[item.severity] || 'slate';
  const icon = iconNameMap[item.severity] || 'notification_important';

  return (
    <div
      className={`py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        !isLast ? 'border-b border-[#CDDCE8]/45' : ''
      } ${className}`}
    >
      {/* Left Icon and Details */}
      <div className="flex items-start gap-3 min-w-0">
        <IconBox
          icon={icon}
          color={color}
          size="heading"
        />

        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              onClick={onInspect}
              className="text-[14px] font-semibold text-[#17324D] hover:text-[#3B82F6] cursor-pointer transition-colors truncate"
            >
              {item.title}
            </span>
            <RiskBadge level={item.severity} size="sm" />
          </div>

          <p className="text-[12px] text-[#61758A] leading-relaxed line-clamp-2">
            {item.description}
          </p>

          <div className="flex items-center gap-3 text-[11px] text-[#7B8D9D] pt-0.5">
            {item.timestamp && <span>{item.timestamp}</span>}
            {item.assignedTo && <span>• Assigned: {item.assignedTo}</span>}
          </div>
        </div>
      </div>

      {/* Right: Status Pill & Action */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <StatusBadge status={item.status} size="sm" />
        {onAction && (
          <button
            onClick={onAction}
            className="btn-card-secondary !text-[11px] !py-1 !px-2.5"
          >
            Review
          </button>
        )}
      </div>
    </div>
  );
};
