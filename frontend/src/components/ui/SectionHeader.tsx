import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-[#CDDCE8]/65 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-[20px] lg:text-[22px] font-bold text-[#17324D] tracking-tight font-display leading-tight">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-[13px] lg:text-[13.5px] text-[#61758A] mt-0.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
};
