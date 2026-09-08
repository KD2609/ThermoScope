import React, { useState } from 'react';
import { AnomalyIntelligence } from '../types';
import { api } from '../services/api';
import {
  GlassCard,
  RiskBadge,
  StatusBadge,
  PipelineStepper,
  ProgressBar,
  IconBox,
  MaterialIcon
} from '../components/ui';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'thermal' | 'baseline' | 'spatial' | 'triage' | 'audit'>('overview');
  const [newNoteText, setNewNoteText] = useState('');
  const [analystName, setAnalystName] = useState('Officer Verma (Triage Lead)');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { event, spatial, thermal, temporal, classification: clf, risk, investigation: inv, audit_logs: auditLogs } = intel;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      setIsSubmittingNote(true);
      await api.addInvestigationNote(event.id, analystName, newNoteText);
      setNewNoteText('');
      onRefresh();
    } catch (err) {
      alert('Failed to submit triage note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      await api.updateInvestigation(event.id, { status: newStatus, recommendation: 'Investigator triage review' });
      onRefresh();
    } catch (err) {
      alert('Failed to update operational status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getTierFromVal = (val: number) => {
    if (val >= 70) return { label: 'HIGH', color: 'text-[#D95C59] bg-[#F9ECEB] border-[rgba(217,92,89,0.25)]' };
    if (val >= 35) return { label: 'MEDIUM', color: 'text-[#D89A2B] bg-[#FBF3DE] border-[rgba(216,154,43,0.25)]' };
    return { label: 'LOW', color: 'text-[#2D9B7A] bg-[#E7F5EE] border-[rgba(45,155,122,0.25)]' };
  };

  const proximityTier = getTierFromVal(risk.components.proximity);
  const intensityTier = getTierFromVal(risk.components.intensity);
  const abnormalityTier = getTierFromVal(risk.components.abnormality);
  const persistenceTier = getTierFromVal(risk.components.persistence);

  return (
    <div className="py-5 content-container w-full space-y-4 min-h-[calc(100vh-72px)]">
      {/* ============================================================ */}
      {/* HEADER SECTION WITH TRANSLUCENT GLASS BACKDROP               */}
      {/* ============================================================ */}
      <GlassCard variant="primary" padding="lg" className="relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          {/* Top Back Nav & Action Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="btn-card-secondary !text-[11px] !py-1.5 !px-3"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              <span>Back to Incident Explorer</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenReportModal}
                className="btn-card-primary !text-[12px] !py-1.5 !px-3.5"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Generate Incident Dossier</span>
              </button>
            </div>
          </div>

          {/* Title, Severity Badges & Coordinates */}
          <div className="flex flex-wrap items-start justify-between gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-[#17324D] font-display">
                  {clf.predicted_class}
                </h1>
                <RiskBadge level={risk.risk_level} score={risk.risk_score} size="md" />
                <StatusBadge status={inv.status} size="md" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#61758A]">
                <span>Event ID: <b className="font-mono text-[#17324D]">{event.event_id}</b></span>
                <span className="text-[#CDDCE8]">&bull;</span>
                <span>Observed: <b className="text-[#17324D]">{new Date(event.timestamp).toUTCString()}</b></span>
                <span className="text-[#CDDCE8]">&bull;</span>
                <span>Facility: <b className="text-[#17324D]">{spatial.nearest_asset_name}</b></span>
                <span className="text-[#CDDCE8]">&bull;</span>
                <span className="font-mono text-[11px] text-[#7B8D9D]">{event.latitude.toFixed(4)}&deg;N, {event.longitude.toFixed(4)}&deg;E</span>
              </div>
            </div>

            {/* Assessment Confidence Cardlet */}
            <div className="bg-[#EAF3FB]/70 border border-[#3B82F6]/30 px-3.5 py-2 rounded-xl text-right">
              <div className="text-[10px] uppercase font-bold text-[#3B82F6]">Assessment Confidence</div>
              <div className="text-2xl font-bold font-display text-[#17324D] leading-none mt-0.5">
                {(clf.confidence_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Responsible AI Notice */}
      <div className="bg-[#FBF3DE]/75 border border-[#D89A2B]/30 p-3 rounded-xl flex items-start gap-3 text-xs text-[#92400E]">
        <span className="material-symbols-outlined text-[18px] text-[#D89A2B] shrink-0 mt-0.5">shield</span>
        <div>
          <span className="font-bold text-[#D89A2B]">PROBABILISTIC OBSERVATION NOTICE:</span> Satellite-derived thermal observations are radiometric heat indicators and do not constitute ground confirmation of an uncontained fire. This AI assessment synthesizes multi-spectral evidence to prioritize investigative triage.
        </div>
      </div>

      {/* ============================================================ */}
      {/* STRUCTURED INTELLIGENCE TABS                                 */}
      {/* ============================================================ */}
      <div className="flex items-center gap-1 border-b border-[#D9E2EA] pb-1 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview & AI Pipeline' },
          { id: 'thermal', label: 'Thermal Observations' },
          { id: 'baseline', label: 'Temporal & 30-Day Baseline' },
          { id: 'spatial', label: 'Spatial & Land Context' },
          { id: 'triage', label: 'Investigation & Triage' },
          { id: 'audit', label: 'Audit Trail' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-[#2F6FED] border border-[#D9E2EA] shadow-subtle font-bold'
                : 'text-[#52677D] hover:text-[#102A43] hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: OVERVIEW & AI INSPECTION PIPELINE                      */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* AI Inspection Pipeline Visual Flow */}
          <GlassCard variant="primary" padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#CDDCE8]/65 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#3B82F6]">memory</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                  AI Inspection Pipeline
                </span>
              </div>
              <span className="text-[11px] text-[#7B8D9D]">Model: {clf.model_name}</span>
            </div>

            {/* Pipeline Stepper Component */}
            <PipelineStepper
              steps={[
                { id: 1, label: '1. Inputs', description: `${thermal.frp.toFixed(1)} MW VIIRS`, status: 'completed' },
                { id: 2, label: '2. Feature Extr.', description: `${spatial.distance_to_nearest_asset_m.toFixed(0)}m proximity`, status: 'completed' },
                { id: 3, label: '3. Evidence Fusion', description: `${temporal.observation_count} passes`, status: 'completed' },
                { id: 4, label: '4. Classification', description: clf.predicted_class, status: 'completed' },
                { id: 5, label: '5. Confidence', description: `${(clf.confidence_score * 100).toFixed(0)}% calibrated`, status: 'active' },
                { id: 6, label: '6. Explanation', description: risk.risk_level, status: 'completed' }
              ]}
            />
          </GlassCard>

          {/* Contributing Factors & Evidence Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contributing Qualitative Factors */}
            <GlassCard variant="primary" padding="md" className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#17324D] border-b border-[#CDDCE8]/65 pb-2">
                Contributing Factors (Qualitative Tiers)
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#EAF3FB]/60 border border-[#CDDCE8]/65">
                  <div>
                    <div className="font-bold text-[#17324D]">Industrial Proximity</div>
                    <div className="text-[11px] text-[#61758A]">
                      {spatial.distance_to_nearest_asset_m.toFixed(0)} m to {spatial.nearest_asset_name}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${proximityTier.color}`}>
                    {proximityTier.label}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#EAF3FB]/60 border border-[#CDDCE8]/65">
                  <div>
                    <div className="font-bold text-[#17324D]">Thermal Radiative Intensity</div>
                    <div className="text-[11px] text-[#61758A]">{thermal.frp.toFixed(1)} MW radiance detected</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${intensityTier.color}`}>
                    {intensityTier.label}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#EAF3FB]/60 border border-[#CDDCE8]/65">
                  <div>
                    <div className="font-bold text-[#17324D]">Historical Baseline Abnormality</div>
                    <div className="text-[11px] text-[#61758A]">
                      Deviation: {temporal.deviation_percent ? `+${temporal.deviation_percent}%` : 'Normal'}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${abnormalityTier.color}`}>
                    {abnormalityTier.label}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#EAF3FB]/60 border border-[#CDDCE8]/65">
                  <div>
                    <div className="font-bold text-[#17324D]">Temporal Persistence</div>
                    <div className="text-[11px] text-[#61758A]">
                      {temporal.persistence_detected ? 'Persistent Source cataloged' : 'Transient / Sudden Occurrence'}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${persistenceTier.color}`}>
                    {persistenceTier.label}
                  </span>
                </div>
              </div>
            </GlassCard>

            {/* Supporting Evidence & Uncertainty */}
            <GlassCard variant="primary" padding="md" className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#17324D] border-b border-[#CDDCE8]/65 pb-2">
                Explainable Evidence &amp; Limitations
              </div>

              {/* Supporting Evidence */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#2D9B7A] flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  Supporting Evidence Factors:
                </div>
                <ul className="space-y-1.5">
                  {clf.supporting_evidence.map((ev, i) => (
                    <li key={i} className="text-xs text-[#17324D] flex items-start gap-2 bg-[#E7F5EE]/70 p-2.5 rounded-xl border border-[#2D9B7A]/25">
                      <span className="text-[#2D9B7A] font-bold">&bull;</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Uncertainty factors */}
              <div className="space-y-2 pt-2 border-t border-[#CDDCE8]/45">
                <div className="text-xs font-bold text-[#D89A2B] flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[15px]">warning</span>
                  Known Limitations &amp; Uncertainty:
                </div>
                <ul className="space-y-1.5">
                  {clf.uncertainty_factors.map((un, i) => (
                    <li key={i} className="text-xs text-[#61758A] flex items-start gap-2 bg-[#FBF3DE]/70 p-2.5 rounded-xl border border-[#D89A2B]/25">
                      <span className="text-[#D89A2B] font-bold">&bull;</span>
                      <span>{un}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: THERMAL OBSERVATIONS                                  */}
      {/* ============================================================ */}
      {activeTab === 'thermal' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard variant="primary" padding="md" hoverEffect className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#61758A]">Fire Radiative Power (FRP)</div>
            <div className="text-2xl font-bold font-display text-[#D95C59] mt-1">{thermal.frp.toFixed(1)} MW</div>
            <div className="text-[11px] text-[#7B8D9D] mt-1">Satellite thermal intensity index</div>
          </GlassCard>

          <GlassCard variant="primary" padding="md" hoverEffect className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#61758A]">Brightness Temperature</div>
            <div className="text-2xl font-bold font-display text-[#17324D] mt-1">{thermal.brightness.toFixed(1)} K</div>
            <div className="text-[11px] text-[#7B8D9D] mt-1">Channel 21 / 22 radiometric temp</div>
          </GlassCard>

          <GlassCard variant="primary" padding="md" hoverEffect className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#61758A]">Satellite &amp; Orbit</div>
            <div className="text-2xl font-bold font-display text-[#3B82F6] mt-1">{thermal.satellite}</div>
            <div className="text-[11px] text-[#7B8D9D] mt-1">{thermal.daynight === 'N' ? 'Night orbit swath' : 'Daytime orbit swath'}</div>
          </GlassCard>

          <GlassCard variant="primary" padding="md" hoverEffect className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-[#61758A]">Source Confidence</div>
            <div className="text-2xl font-bold font-display text-[#2D9B7A] mt-1">{thermal.source_confidence}</div>
            <div className="text-[11px] text-[#7B8D9D] mt-1">Instrument-level detection quality</div>
          </GlassCard>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: BASELINE ANALYSIS                                     */}
      {/* ============================================================ */}
      {activeTab === 'baseline' && (
        <GlassCard variant="primary" padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#CDDCE8]/65 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
              30-Day Historical Baseline Operating Envelope
            </span>
            <span className="text-[11px] font-semibold text-[#3B82F6]">
              {temporal.observation_count} Satellite Observations Recorded
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-[#EAF3FB]/60 rounded-xl border border-[#CDDCE8]/65">
              <div className="text-[10px] text-[#61758A] uppercase font-bold">Current FRP</div>
              <div className="text-xl font-bold font-mono text-[#D95C59] mt-1">{temporal.current_frp.toFixed(1)} MW</div>
            </div>
            <div className="p-3.5 bg-[#EAF3FB]/60 rounded-xl border border-[#CDDCE8]/65">
              <div className="text-[10px] text-[#61758A] uppercase font-bold">Historical Median</div>
              <div className="text-xl font-bold font-mono text-[#17324D] mt-1">{temporal.historical_median_frp?.toFixed(1) ?? 'N/A'} MW</div>
            </div>
            <div className="p-3.5 bg-[#EAF3FB]/60 rounded-xl border border-[#CDDCE8]/65">
              <div className="text-[10px] text-[#61758A] uppercase font-bold">Normal Envelope</div>
              <div className="text-sm font-semibold text-[#17324D] mt-1.5 font-mono">
                {temporal.frp_min ?? 0} - {temporal.frp_max ?? 0} MW
              </div>
            </div>
            <div className="p-3.5 bg-[#EAF3FB]/60 rounded-xl border border-[#CDDCE8]/65">
              <div className="text-[10px] text-[#61758A] uppercase font-bold">Persistence Status</div>
              <div className="text-sm font-bold text-[#3B82F6] mt-1.5">
                {temporal.persistence_detected ? 'Cataloged Source' : 'Sudden Transient'}
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#EAF3FB]/40 rounded-xl border border-[#CDDCE8]/65 text-xs text-[#61758A] italic">
            &ldquo;{temporal.interpretation}&rdquo;
          </div>
        </GlassCard>
      )}

      {/* ============================================================ */}
      {/* TAB 4: SPATIAL & LAND CONTEXT                                */}
      {/* ============================================================ */}
      {activeTab === 'spatial' && (
        <GlassCard variant="primary" padding="md" className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[#17324D] border-b border-[#CDDCE8]/65 pb-2">
            Geospatial Proximity &amp; Surrounding Land Use
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-[#EAF3FB]/60 rounded-xl border border-[#CDDCE8]/65 space-y-1">
              <div className="text-[10px] font-bold text-[#61758A] uppercase">Nearest Industrial Asset</div>
              <div className="text-base font-bold text-[#17324D]">{spatial.nearest_asset_name}</div>
              <div className="text-[11px] text-[#3B82F6] font-semibold">
                {spatial.distance_to_nearest_asset_m.toFixed(0)} meters distance
              </div>
            </div>

            <div className="p-3.5 bg-[#EAF3FB]/60 rounded-xl border border-[#CDDCE8]/65 space-y-1">
              <div className="text-[10px] font-bold text-[#61758A] uppercase">Asset Category</div>
              <div className="text-base font-bold text-[#17324D]">{spatial.asset_category}</div>
              <div className="text-[11px] text-[#61758A]">
                Inside boundary: <b>{spatial.is_inside_boundary ? 'Yes (Geofenced)' : 'No'}</b>
              </div>
            </div>

            <div className="p-3.5 bg-[#EAF3FB]/60 rounded-xl border border-[#CDDCE8]/65 space-y-1">
              <div className="text-[10px] font-bold text-[#61758A] uppercase">Settlement Buffer</div>
              <div className="text-base font-bold text-[#17324D]">~{spatial.settlement_distance_m.toFixed(0)} meters</div>
              <div className="text-[11px] text-[#61758A]">Land context: {spatial.land_context}</div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ============================================================ */}
      {/* TAB 5: TRIAGE & INVESTIGATION LOGGING                        */}
      {/* ============================================================ */}
      {activeTab === 'triage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Status Change & Workflow Buttons */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard className="p-5 border border-[#D9E2EA] space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#102A43] border-b border-[#D9E2EA] pb-2">
                Operational Status Workflow
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['UNDER REVIEW', 'VERIFIED', 'FALSE POSITIVE', 'RESOLVED'].map((st) => (
                  <button
                    key={st}
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusChange(st)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      inv.status === st
                        ? 'btn-card-primary !text-[11.5px] !py-2 !px-3'
                        : 'btn-card-secondary !text-[11.5px] !py-2 !px-3'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Quick recommendation */}
            <GlassCard variant="primary" padding="md" className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#17324D]">
                AI Recommended Action
              </div>
              <p className="text-xs text-[#61758A] leading-relaxed">
                {inv.recommendation || 'Initiate standard thermal sensor cross-check and assign on-site inspection officer.'}
              </p>
            </GlassCard>
          </div>

          {/* Notes Log & Submission */}
          <div className="lg:col-span-7 space-y-4">
            <GlassCard variant="primary" padding="md" className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#17324D] border-b border-[#CDDCE8]/65 pb-2">
                Analyst Investigation Notes
              </div>

              {/* Notes list */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {inv.notes.length === 0 ? (
                  <div className="text-xs text-[#7B8D9D] italic py-4 text-center">
                    No investigation notes logged yet for this incident.
                  </div>
                ) : (
                  inv.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-xl bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[#7B8D9D] text-[11px]">
                        <span className="font-bold text-[#17324D]">{note.author}</span>
                        <span>{note.timestamp}</span>
                      </div>
                      <div className="text-[#17324D]">{note.text}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleAddNote} className="space-y-2.5 pt-2 border-t border-[#CDDCE8]/45">
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Enter analyst inspection update, radio log, or dispatch note..."
                  className="w-full bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 p-2.5 rounded-xl text-xs text-[#17324D] placeholder-[#7B8D9D] focus:outline-none focus:border-[#3B82F6] focus:bg-white resize-none transition"
                />
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={analystName}
                    onChange={(e) => setAnalystName(e.target.value)}
                    className="bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 px-2.5 py-1 rounded-lg text-xs text-[#17324D] w-36 focus:outline-none focus:border-[#3B82F6]"
                    placeholder="Analyst Name"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !newNoteText.trim()}
                    className="btn-card-primary !text-[11.5px] !py-1.5 !px-3.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    <span>Post Note</span>
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 6: AUDIT TRAIL                                           */}
      {/* ============================================================ */}
      {activeTab === 'audit' && (
        <GlassCard variant="dense" padding="none" className="overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E8F0F7]/75 text-[#61758A] font-bold border-b border-[#CDDCE8]/65 uppercase text-[10px]">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CDDCE8]/45">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#7B8D9D]">
                    No audit records logged.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#DCEDF8]/35 transition-colors">
                    <td className="py-3 px-4 text-[#61758A] font-mono text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#17324D]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-[#61758A]">
                      {log.user_name}
                    </td>
                    <td className="py-3 px-4 text-[#17324D]">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
};
