import React from 'react';

export type GlassCardVariant = 'primary' | 'secondary' | 'dense' | 'chart' | 'glass' | 'subtle' | 'solid';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: GlassCardVariant;
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg' | 'full';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'primary',
  hoverEffect = false,
  padding = 'md',
  radius = 'md',
  ...props
}) => {
  let baseStyle = '';

  switch (variant) {
    case 'primary':
    case 'glass':
      // Primary cards: background: rgba(236,243,249,0.62)
      baseStyle = 'bg-[#ECF3F9]/62 backdrop-blur-[14px] border border-[#CDDCE8]/65 shadow-[0_6px_18px_rgba(30,55,80,0.05)]';
      break;
    case 'secondary':
      // Secondary cards: background: rgba(240,246,251,0.48)
      baseStyle = 'bg-[#F0F6FB]/48 backdrop-blur-[14px] border border-[#CDDCE8]/65 shadow-[0_6px_18px_rgba(30,55,80,0.05)]';
      break;
    case 'dense':
      // Dense data cards: background: rgba(232,240,247,0.72)
      baseStyle = 'bg-[#E8F0F7]/72 backdrop-blur-[14px] border border-[#CDDCE8]/65 shadow-[0_6px_18px_rgba(30,55,80,0.05)]';
      break;
    case 'chart':
      // Chart cards: background: rgba(238,245,250,0.68)
      baseStyle = 'bg-[#EEF5FA]/68 backdrop-blur-[14px] border border-[#CDDCE8]/65 shadow-[0_6px_18px_rgba(30,55,80,0.05)]';
      break;
    case 'subtle':
      baseStyle = 'bg-[#EBF2F8]/58 backdrop-blur-[14px] border border-white/55 shadow-[0_6px_18px_rgba(30,55,80,0.05)]';
      break;
    case 'solid':
      baseStyle = 'bg-white/88 backdrop-blur-md border border-[#CDDCE8]/75 shadow-[0_6px_18px_rgba(30,55,80,0.05)]';
      break;
    default:
      baseStyle = 'bg-[#ECF3F9]/62 backdrop-blur-[14px] border border-[#CDDCE8]/65 shadow-[0_6px_18px_rgba(30,55,80,0.05)]';
  }

  const paddingClass = {
    none: 'p-0',
    sm: 'p-3.5 sm:p-4', // 16px small cards
    md: 'p-4 sm:p-5',   // 20px main cards
    lg: 'p-5 sm:p-6'
  }[padding];

  const radiusClass = {
    sm: 'rounded-[12px]',
    md: 'rounded-[16px]', // Standard 16px
    lg: 'rounded-[20px]',
    full: 'rounded-full'
  }[radius];

  const hoverClass = hoverEffect
    ? 'transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:border-[#78A0D2]/45 hover:shadow-[0_12px_28px_rgba(30,55,80,0.08)]'
    : '';

  return (
    <div
      className={`${radiusClass} ${baseStyle} ${paddingClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
