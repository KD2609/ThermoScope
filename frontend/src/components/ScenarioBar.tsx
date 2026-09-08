import React from 'react';
import { PlayCircle, ShieldCheck, Flame, RotateCcw, Sparkles } from 'lucide-react';

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
    <div className="bg-[#0b1222] border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-orange-400">
          <Sparkles className="w-3.5 h-3.5" />
          SIH Demo Engine:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            disabled={loading}
            onClick={() => onTriggerScenario('SCENARIO_A')}
            className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 rounded font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
            title="Inject an abnormal high-intensity fire anomaly at Jamnagar Refinery"
          >
            <Flame className="w-3 h-3 text-red-400" />
            Scenario A: Industrial Fire
          </button>

          <button
            disabled={loading}
            onClick={() => onTriggerScenario('SCENARIO_B')}
            className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
            title="Inject an agricultural hotspot near industrial corridor and verify false-positive suppression"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Scenario B: Agricultural False-Positive
          </button>

          <button
            disabled={loading}
            onClick={() => onTriggerScenario('SCENARIO_C')}
            className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
            title="Catalog a persistent routine power station heat source without triggering a false alarm"
          >
            <PlayCircle className="w-3 h-3 text-cyan-400" />
            Scenario C: Persistent Source
          </button>

          <button
            disabled={loading}
            onClick={onResetScenario}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition flex items-center gap-1 disabled:opacity-50"
            title="Reset simulated test anomalies"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {activeScenarioText && (
        <div className="bg-orange-950/40 border border-orange-500/40 text-orange-200 px-3 py-1 rounded text-[11px] font-medium animate-pulse flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span>{activeScenarioText}</span>
        </div>
      )}
    </div>
  );
};
