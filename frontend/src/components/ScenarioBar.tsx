import React from 'react';
import { Sparkles, Flame, ShieldCheck, PlayCircle, RotateCcw } from 'lucide-react';

interface ScenarioBarProps {
  onTriggerScenario: (scenario: 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C') => void;
  onResetScenario: () => void;
  activeScenarioText: string | null;
  loading: boolean;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  onTriggerScenario,
  onResetScenario,
  activeScenarioText,
  loading
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm border-b border-[#D9E2EA] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-[#102A43] tracking-tight">
          <Sparkles className="w-3.5 h-3.5 text-[#2F6FED]" />
          <span>SIH Scenario Engine:</span>
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            disabled={loading}
            onClick={() => onTriggerScenario('SCENARIO_A')}
            className="px-2.5 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA] rounded-lg font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            title="Inject an abnormal high-intensity fire anomaly at Jamnagar Refinery"
          >
            <Flame className="w-3 h-3 text-[#B91C1C]" />
            <span>Scenario A: Industrial Fire</span>
          </button>

          <button
            disabled={loading}
            onClick={() => onTriggerScenario('SCENARIO_B')}
            className="px-2.5 py-1 bg-[#E8F7F3] hover:bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] rounded-lg font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            title="Inject an agricultural hotspot near industrial corridor and verify false-positive suppression"
          >
            <ShieldCheck className="w-3 h-3 text-[#059669]" />
            <span>Scenario B: Agricultural False-Positive</span>
          </button>

          <button
            disabled={loading}
            onClick={() => onTriggerScenario('SCENARIO_C')}
            className="px-2.5 py-1 bg-[#EEF4FF] hover:bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] rounded-lg font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            title="Catalog a persistent routine power station heat source without triggering a false alarm"
          >
            <PlayCircle className="w-3 h-3 text-[#2F6FED]" />
            <span>Scenario C: Persistent Source</span>
          </button>

          <button
            disabled={loading}
            onClick={onResetScenario}
            className="px-2.5 py-1 bg-[#EEF3F7] hover:bg-[#E2E8F0] text-[#52677D] border border-[#D9E2EA] rounded-lg transition flex items-center gap-1 font-medium disabled:opacity-50"
            title="Reset simulated test anomalies"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {activeScenarioText && (
        <div className="bg-[#EEF4FF] border border-[#2F6FED]/30 text-[#102A43] px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2F6FED] animate-pulse" />
          <span className="font-semibold">{activeScenarioText}</span>
        </div>
      )}
    </div>
  );
};
