import React from 'react';
import { GlassCard } from './GlassCard';

interface MapCardProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
}

export const MapCard: React.FC<MapCardProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
  containerClassName = '',
  style
}) => {
  return (
    <GlassCard
      variant="primary"
      padding="none"
      className={`overflow-hidden flex flex-col w-full border border-[#CDDCE8]/75 shadow-[0_8px_24px_rgba(30,55,80,0.06)] ${className}`}
      style={style}
    >
      {(title || actions) && (
        <div className="p-3 sm:p-4 border-b border-[#CDDCE8]/65 flex flex-wrap items-center justify-between gap-3 bg-[#ECF3F9]/60 backdrop-blur-md shrink-0">
          <div>
            <div className="flex items-center gap-2">
              {title && (
                <h3 className="text-[15px] sm:text-[16px] font-semibold text-[#17324D] font-display">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-[12px] sm:text-[13px] text-[#61758A] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Map Content: guaranteed height with inline fallback */}
      <div 
        className={`relative w-full ${containerClassName || 'h-[520px] lg:h-[560px]'}`}
        style={{ minHeight: '500px' }}
      >
        {children}
      </div>
    </GlassCard>
  );
};
