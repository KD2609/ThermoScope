import React from 'react';

export interface PipelineStep {
  id: string | number;
  label: string;
  status: 'completed' | 'active' | 'pending';
  description?: string;
}

interface PipelineStepperProps {
  steps: PipelineStep[];
  className?: string;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  steps,
  className = ''
}) => {
  return (
    <div className={`w-full overflow-x-auto py-2 ${className}`}>
      <div className="flex items-center justify-between min-w-[500px] w-full">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          let circleColor = 'bg-[#6687A8]/40 border-2 border-[#CDDCE8]';
          let textColor = 'text-[#7B8D9D]';

          if (step.status === 'completed') {
            circleColor = 'bg-[#2D9B7A] ring-4 ring-[#E7F5EE]';
            textColor = 'text-[#17324D] font-semibold';
          } else if (step.status === 'active') {
            circleColor = 'bg-[#3B82F6] ring-4 ring-[#DCEDF8] animate-pulse';
            textColor = 'text-[#3B82F6] font-bold';
          }

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <div className="flex flex-col items-center text-center group cursor-default">
                {/* 12px Circle */}
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-200 shrink-0 ${circleColor}`}
                />
                <span className={`text-[12px] mt-2 tracking-tight whitespace-nowrap ${textColor}`}>
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-[11px] text-[#7B8D9D] mt-0.5 max-w-[100px] truncate">
                    {step.description}
                  </span>
                )}
              </div>

              {/* Thin connecting line */}
              {!isLast && (
                <div className="flex-1 mx-3 h-[1.5px] bg-[#CDDCE8]/65 relative">
                  {step.status === 'completed' && (
                    <div className="absolute inset-0 bg-[#2D9B7A]/60" />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
