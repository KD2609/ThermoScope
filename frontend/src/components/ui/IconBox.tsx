import React from 'react';

export type IconBoxColor = 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'purple';
export type IconBoxSize = 'kpi' | 'heading' | 'list' | 'small';

interface IconBoxProps {
  icon?: string; // Google Material Symbol name e.g. 'local_fire_department', 'factory', 'radar'
  children?: React.ReactNode;
  color?: IconBoxColor;
  size?: IconBoxSize;
  className?: string;
  ariaLabel?: string;
}

export const MaterialIcon: React.FC<{
  name: string;
  size?: number;
  color?: string;
  className?: string;
}> = ({ name, size = 20, color, className = '' }) => {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: `${size}px`,
        color: color || undefined,
        lineHeight: 1
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};

export const IconBox: React.FC<IconBoxProps> = ({
  icon,
  children,
  color = 'blue',
  size = 'heading',
  className = '',
  ariaLabel
}) => {
  // Dimensions and corresponding icon sizes according to design guidelines:
  // KPI: 44px container (24px icon)
  // Heading: 38-40px container (20px icon)
  // Table/list: 32px container (18px icon)
  // Small metadata: 26-28px container (16px icon)
  const sizeConfig = {
    kpi: {
      box: 'w-8 h-8 min-w-[32px]',
      iconSize: 20,
      radius: 'rounded-[10px]'
    },
    heading: {
      box: 'w-9 h-9 min-w-[36px]',
      iconSize: 20,
      radius: 'rounded-[10px]'
    },
    list: {
      box: 'w-8 h-8 min-w-[32px]',
      iconSize: 18,
      radius: 'rounded-[9px]'
    },
    small: {
      box: 'w-7 h-7 min-w-[28px]',
      iconSize: 16,
      radius: 'rounded-[8px]'
    }
  }[size];

  // Soft tinted rounded square containers with 1px white/45 border
  const colorConfig = {
    blue: {
      bg: 'bg-[#DCEDF8]/55 border border-white/45',
      text: '#3B82F6'
    },
    green: {
      bg: 'bg-[#E7F5EE]/65 border border-white/45',
      text: '#2D9B7A'
    },
    amber: {
      bg: 'bg-[#FBF3DE]/65 border border-white/45',
      text: '#D89A2B'
    },
    red: {
      bg: 'bg-[#F9ECEB]/65 border border-white/45',
      text: '#D95C59'
    },
    slate: {
      bg: 'bg-[#E6EEF5]/65 border border-white/45',
      text: '#6687A8'
    },
    purple: {
      bg: 'bg-[#EEEBFA]/65 border border-white/45',
      text: '#7C6FD1'
    }
  }[color];

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(30,55,80,0.03)] ${sizeConfig.box} ${sizeConfig.radius} ${colorConfig.bg} ${className}`}
      aria-label={ariaLabel}
    >
      {icon ? (
        <MaterialIcon
          name={icon}
          size={sizeConfig.iconSize}
          color={colorConfig.text}
        />
      ) : (
        <span style={{ color: colorConfig.text }}>{children}</span>
      )}
    </div>
  );
};
