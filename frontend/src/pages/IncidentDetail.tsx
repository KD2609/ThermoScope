import React, { useState } from 'react';
import { AnomalyIntelligence } from '../types';
import { api } from '../services/api';
import { 
  ArrowLeft, 
  Printer, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Clock, 
  MapPin, 
  Activity, 
  Send,
  Sliders,
  FileText,
  UserCheck
} from 'lucide-react';

interface IncidentDetailProps {
  intel: AnomalyIntelligence;
  onBack: () => void;
  onOpenReportModal: () => void;
  onRefresh: () => void;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({
  intel,
  onBack,
  onOpenReportModal,
  onRefresh
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [analystName, setAnalystName] = useState('Analyst Demo');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [expandAiPanel, setExpandAiPanel] = useState(false);

  const event = intel.event;
  const spatial = intel.spatial;
  const thermal = intel.thermal;
  const temporal = intel.temporal;
  const clf = intel.classification;
  const risk = intel.risk;
  const inv = intel.investigation;
  const auditLogs = intel.audit_logs;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      await api.updateInvestigation(inv.id, {
        status: newStatus,
        author: analystName
      });
      onRefresh();
    } catch (e) {
      alert('Failed to update investigation status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      setIsSubmittingNote(true);
      await api.addInvestigationNote(inv.id, newNoteText.trim(), analystName);
      setNewNoteText('');
      onRefresh();
    } catch (e) {
      alert('Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const getSeverityBadgeClass = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="p-6 bg-[#080d1a] min-h-[calc(100vh-105px)] space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition"
            title="Back to Explorer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white">{clf.predicted_class}</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-black border ${getSeverityBadgeClass(risk.risk_level)}`}>
                {risk.risk_level} INVESTIGATION PRIORITY
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                Confidence: {(clf.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
              <span>Event ID: <b className="text-slate-200 font-mono">{event.event_id}</b></span>
              <span>&bull;</span>
              <span>Observed: <b className="text-slate-200">{new Date(event.timestamp).toUTCString()}</b></span>
              <span>&bull;</span>
              <span>Coordinates: <b className="text-slate-200 font-mono">{event.latitude.toFixed(4)}&deg;N, {event.longitude.toFixed(4)}&deg;E</b></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReportModal}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-orange-950/40 transition"
          >
            <Printer className="w-4 h-4" />
            Generate Incident Intelligence Dossier
          </button>
        </div>
      </div>

      {/* Responsible AI Disclaimer Banner */}
      <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-lg flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">PROBABILISTIC OBSERVATION NOTICE:</span> Satellite-derived thermal observations are radiometric heat measurements and do not constitute ground confirmation of an uncontained fire. This AI assessment provides structured evidence to prioritize investigative triage.
        </div>
      </div>

      {/* Core Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Evidence & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spatial & Thermal Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Radiative Power (FRP)</div>
              <div className="text-xl font-mono font-extrabold text-orange-400 mt-0.5">{thermal.frp.toFixed(1)} MW</div>
              <div className="text-[10px] text-slate-500 mt-1">{thermal.satellite} ({thermal.daynight === 'N' ? 'Night orbit' : 'Day orbit'})</div>
            </div>

            <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Nearest Facility</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5 truncate">{spatial.nearest_asset_name}</div>
              <div className="text-[10px] text-cyan-400 mt-1">{spatial.distance_to_nearest_asset_m.toFixed(0)} m distance ({spatial.asset_category})</div>
            </div>

            <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Land-Use Context</div>
              <div className="text-sm font-bold text-slate-200 mt-0.5">{spatial.land_context}</div>
              <div className="text-[10px] text-slate-500 mt-1">Settlement: ~{spatial.settlement_distance_m.toFixed(0)} m</div>
            </div>

            <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Investigation Status</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{inv.status}</div>
              <div className="text-[10px] text-slate-500 mt-1">Analyst: {inv.assigned_analyst}</div>
            </div>
          </div>

          {/* Temporal Persistence & Historical Baseline Card */}
          <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-extrabold text-sm text-white uppercase tracking-wider">
                  Temporal Persistence &amp; 30-Day Baseline Analysis
                </span>
              </div>
              {temporal.has_sufficient_history ? (
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                  {temporal.observation_count} Historical Observations
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                  Sparse History (&lt; 3 obs)
                </span>
              )}
            </div>

            {temporal.has_sufficient_history ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Current FRP</div>
                  <div className="text-base font-mono font-bold text-orange-400">{temporal.current_frp.toFixed(1)} MW</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Historical Median</div>
                  <div className="text-base font-mono font-bold text-slate-300">{temporal.historical_median_frp?.toFixed(1)} MW</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Baseline Deviation</div>
                  <div className={`text-base font-mono font-bold ${temporal.deviation_percent && temporal.deviation_percent > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {temporal.deviation_percent !== undefined && temporal.deviation_percent > 0 ? `+${temporal.deviation_percent}%` : `${temporal.deviation_percent}%`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Persistence Flag</div>
                  <div className="text-sm font-bold text-cyan-300 mt-0.5">
                    {temporal.persistence_detected ? 'PERSISTENT SOURCE' : 'TRANSIENT EVENT'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-slate-400 text-xs">
                Insufficient historical satellite passes available at this coordinate to construct a verified 30-day baseline envelope.
              </div>
            )}

            <div className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded border border-slate-800 italic">
              &ldquo;{temporal.interpretation}&rdquo;
            </div>
          </div>

          {/* Explainable AI Evidence & Uncertainties */}
          <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white uppercase tracking-wider">
                Explainable AI Evidence Fusion
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Model: {clf.model_name}</span>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Contributing Supporting Evidence:
              </div>
              <ul className="space-y-1.5">
                {clf.supporting_evidence.map((ev, i) => (
                  <li key={i} className="text-xs text-slate-200 flex items-start gap-2 bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="text-emerald-500 font-bold">&bull;</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5" />
                Known Uncertainty &amp; Limitations:
              </div>
              <ul className="space-y-1.5">
                {clf.uncertainty_factors.map((un, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/40 p-2 rounded border border-slate-800/60">
                    <span className="text-amber-500 font-bold">&bull;</span>
                    <span>{un}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature Contributions Bars */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">Feature Weight Influence:</div>
              <div className="space-y-2">
                {Object.entries(clf.feature_contributions).map(([k, v]) => (
                  <div key={k} className="text-xs">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                      <span>{k}</span>
                      <span className="font-mono font-bold text-slate-200">{(v * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                        style={{ width: `${Math.min(100, v * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Operational Workflow & Triage */}
        <div className="space-y-6">
          {/* Risk Formula Breakdown Card */}
          <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-extrabold text-sm text-white uppercase tracking-wider">Multi-Factor Risk Engine</span>
              <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${getSeverityBadgeClass(risk.risk_level)}`}>
                Score: {risk.risk_score.toFixed(1)}/100
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Thermal Intensity</span>
                <span className="font-mono font-bold text-orange-400">{risk.components.intensity.toFixed(0)} / 100</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Industrial Proximity</span>
                <span className="font-mono font-bold text-cyan-400">{risk.components.proximity.toFixed(0)} / 100</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Baseline Abnormality</span>
                <span className="font-mono font-bold text-red-400">{risk.components.abnormality.toFixed(0)} / 100</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Temporal Persistence</span>
                <span className="font-mono font-bold text-slate-300">{risk.components.persistence.toFixed(0)} / 100</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Asset Criticality</span>
                <span className="font-mono font-bold text-amber-400">{risk.components.criticality.toFixed(0)} / 100</span>
              </div>
            </div>
          </div>

          {/* Investigation Operational Action Center */}
          <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="font-extrabold text-sm text-white uppercase tracking-wider">Operational Triage</span>
              <span className="text-[10px] text-slate-400">Workflow State</span>
            </div>

            {/* Status Change Buttons */}
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Change Status:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {['UNDER REVIEW', 'VERIFIED', 'FALSE POSITIVE', 'RESOLVED'].map((st) => (
                  <button
                    key={st}
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2.5 py-1.5 rounded text-[11px] font-bold border transition ${
                      inv.status === st
                        ? 'bg-orange-600 text-white border-orange-500'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Analyst Investigation Notes:</div>
              <div className="max-h-48 overflow-y-auto space-y-2 mb-2">
                {inv.notes.length === 0 ? (
                  <div className="text-slate-500 text-xs italic">No notes logged yet.</div>
                ) : (
                  inv.notes.map((note) => (
                    <div key={note.id} className="p-2 rounded bg-slate-900 border-l-2 border-orange-500 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-bold text-slate-300">{note.author}</span>
                        <span>{note.timestamp}</span>
                      </div>
                      <div className="text-slate-200">{note.text}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Add analyst note or inspection update..."
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={analystName}
                    onChange={(e) => setAnalystName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-300 w-32 focus:outline-none"
                    placeholder="Analyst name"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !newNoteText.trim()}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded text-xs flex items-center gap-1 transition"
                  >
                    <Send className="w-3 h-3" />
                    Add Note
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Audit Log History</div>
            <div className="space-y-1 text-xs">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-slate-300">{log.action}</span>
                    <span className="text-[10px]">{log.timestamp.split(' ')[1]}</span>
                  </div>
                  <div className="text-slate-400 text-[10px] truncate">{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
