import React from 'react';

interface SeverityBadgeProps {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const sev = severity.toUpperCase();
  let colorStyles = 'bg-geo-100 text-geo-700 border-geo-200';

  if (sev === 'CRITICAL') {
    colorStyles = 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/20';
  } else if (sev === 'HIGH') {
    colorStyles = 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-500/20';
  } else if (sev === 'MEDIUM') {
    colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (sev === 'LOW') {
    colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase ${colorStyles} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        sev === 'CRITICAL' ? 'bg-red-500 animate-pulse' :
        sev === 'HIGH' ? 'bg-orange-500' :
        sev === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />
      {severity}
    </span>
  );
};

interface ClassBadgeProps {
  predictedClass: string;
}

export const ClassBadge: React.FC<ClassBadgeProps> = ({ predictedClass }) => {
  let style = 'bg-geo-100 text-geo-800 border-geo-200';

  if (predictedClass.includes('Industrial Fire')) {
    style = 'bg-red-100 text-red-900 border-red-200';
  } else if (predictedClass.includes('Gas Flare')) {
    style = 'bg-amber-100 text-amber-900 border-amber-200';
  } else if (predictedClass.includes('Mining')) {
    style = 'bg-purple-100 text-purple-900 border-purple-200';
  } else if (predictedClass.includes('Wildfire')) {
    style = 'bg-emerald-100 text-emerald-900 border-emerald-200';
  } else if (predictedClass.includes('Agricultural')) {
    style = 'bg-lime-100 text-lime-900 border-lime-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${style}`}>
      {predictedClass}
    </span>
  );
};
