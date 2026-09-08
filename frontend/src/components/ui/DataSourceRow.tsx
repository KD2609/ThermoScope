import React from 'react';
import { IconBox, IconBoxColor } from './IconBox';
import { StatusBadge } from './StatusBadge';

export interface DataSourceItem {
  id?: string | number;
  name: string;
  type?: string;
  status: string;
  latencyMs?: number;
  records?: number | string;
  lastSync?: string;
  icon?: string;
  color?: IconBoxColor;
  message?: string;
}

interface DataSourceRowProps {
  source: DataSourceItem;
  className?: string;
  isLast?: boolean;
}

export const DataSourceRow: React.FC<DataSourceRowProps> = ({
  source,
  className = '',
  isLast = false
}) => {
  // Determine appropriate icon if not provided
  let icon = source.icon || 'dataset';
  let color: IconBoxColor = source.color || 'blue';

  const nameLower = source.name.toLowerCase();
  if (nameLower.includes('satellite') || nameLower.includes('viirs') || nameLower.includes('modis') || nameLower.includes('firms')) {
    icon = 'satellite_alt';
    color = 'blue';
  } else if (nameLower.includes('osm') || nameLower.includes('map') || nameLower.includes('context')) {
    icon = 'map';
    color = 'green';
  } else if (nameLower.includes('asset') || nameLower.includes('registry') || nameLower.includes('industrial')) {
    icon = 'factory';
    color = 'purple';
  } else if (nameLower.includes('weather') || nameLower.includes('atmosphere')) {
    icon = 'air';
    color = 'slate';
  }

  return (
    <div
      className={`py-3.5 flex items-center justify-between gap-3 ${
        !isLast ? 'border-b border-[#CDDCE8]/45' : ''
      } ${className}`}
    >
      {/* Left Icon and Details */}
      <div className="flex items-center gap-3 min-w-0">
        <IconBox
          icon={icon}
          color={color}
          size="heading"
        />

        <div className="space-y-0.5 min-w-0">
          <div className="text-[13.5px] font-semibold text-[#17324D] truncate">
            {source.name}
          </div>

          <div className="flex items-center gap-2.5 text-[12px] text-[#61758A] flex-wrap">
            {source.records !== undefined && (
              <span>
                <b className="font-mono text-[#17324D] font-normal">{typeof source.records === 'number' ? source.records.toLocaleString() : source.records}</b> records
              </span>
            )}
            {source.latencyMs !== undefined && (
              <span>• Latency: <b className="font-mono text-[#17324D] font-normal">{source.latencyMs}ms</b></span>
            )}
            {source.lastSync && (
              <span>• Sync: {source.lastSync}</span>
            )}
          </div>
          {source.message && (
            <div className="text-[11px] text-[#7B8D9D] italic truncate max-w-[360px]">
              {source.message}
            </div>
          )}
        </div>
      </div>

      {/* Right Status */}
      <div className="shrink-0">
        <StatusBadge status={source.status} size="sm" />
      </div>
    </div>
  );
};
