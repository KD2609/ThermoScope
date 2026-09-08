import React, { useEffect, useState, useRef } from 'react';
import { AnomalyIntelligence } from '../types';
import { api } from '../services/api';
import { RiskBadge } from './ui/RiskBadge';
import { StatusBadge } from './ui/StatusBadge';
import { 
  X, 
  Printer, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  Building2, 
  Clock, 
  FileText, 
  ExternalLink,
  Satellite,
  Activity
} from 'lucide-react';

interface DossierModalProps {
  anomalyId: number | null;
  onClose: () => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({ anomalyId, onClose }) => {
  const [intel, setIntel] = useState<AnomalyIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [showIframePrint, setShowIframePrint] = useState(false);
  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!anomalyId) return;

    let isMounted = true;
    setLoading(true);
    api.getAnomalyIntelligence(anomalyId)
      .then(data => {
        if (isMounted) setIntel(data);
      })
      .catch(err => {
        console.error('Failed to load dossier intelligence:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [anomalyId]);

  if (!anomalyId) return null;

  const handlePrint = () => {
    window.print();
  };

  const reportUrl = api.getReportUrl(anomalyId);

  return (
    <div className="fixed inset-0 z-50 bg-[#102A43]/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-[#D9E2EA] w-full max-w-4xl max-h-[92vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 font-sans">
        {/* Modal Top Bar */}
        <div className="p-4 bg-[#F4F7FA] border-b border-[#D9E2EA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2F6FED]" />
            <span className="font-bold text-sm text-[#102A43] font-display">
              Incident Intelligence Dossier Preview
            </span>
            {intel && (
              <span className="text-[11px] font-mono text-[#52677D]">
                &bull; {intel.event.event_id}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#2F6FED] hover:bg-[#2558BE] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>

            <a
              href={reportUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-white hover:bg-[#EEF3F7] text-[#102A43] border border-[#D9E2EA] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition hidden sm:inline-flex"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#52677D]" />
              <span>Raw HTML</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-[#52677D] hover:text-[#102A43] hover:bg-[#EEF3F7] rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-[#102A43] bg-white">
          {loading || !intel ? (
            <div className="py-20 text-center text-[#6B7C8F] text-xs">
              Synthesizing multi-spectral dossier intelligence...
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Document Header */}
              <div className="border-b-2 border-[#102A43] pb-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#52677D] font-mono uppercase tracking-wider">
                  <span>NTRO SIH PS ID 26162 &bull; DISASTER INTELLIGENCE</span>
                  <span>CONFIDENTIAL &bull; INTERNAL TRIAGE ONLY</span>
                </div>
                <h1 className="text-2xl font-black font-display tracking-tight text-[#102A43]">
                  INCIDENT INTELLIGENCE DOSSIER
                </h1>
                <div className="text-xs text-[#52677D]">
                  Automated radiometric anomaly analysis and evidence synthesis.
                </div>
              </div>

              {/* Responsible AI Notice */}
              <div className="bg-[#FEF3C7] border border-[#FDE68A] p-3 rounded-xl text-xs text-[#92400E] flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <b>RESPONSIBLE AI NOTIFICATION:</b> Satellite thermal detections reflect radiometric heat observations and do not represent physical on-ground confirmation. Ground dispatch triage and verified inspection are recommended prior to operational intervention.
                </div>
              </div>

              {/* Section 1: Event Identification & Location */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#52677D] border-b border-[#D9E2EA] pb-1">
                  1. Event Identification &amp; Geospatial Coordinates
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F4F7FA] p-3 rounded-xl border border-[#D9E2EA] text-xs">
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Event ID</div>
                    <div className="font-mono font-bold text-[#102A43]">{intel.event.event_id}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Observation Time</div>
                    <div className="font-medium text-[#102A43]">{new Date(intel.event.timestamp).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Latitude / Longitude</div>
                    <div className="font-mono text-[#102A43]">
                      {intel.event.latitude.toFixed(4)}&deg;, {intel.event.longitude.toFixed(4)}&deg;
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Nearest Facility</div>
                    <div className="font-bold text-[#102A43] truncate">{intel.spatial.nearest_asset_name}</div>
                  </div>
                </div>
              </div>

              {/* Section 2: Radiative Heat Observations */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#52677D] border-b border-[#D9E2EA] pb-1">
                  2. Thermal Sensor Observations
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F4F7FA] p-3 rounded-xl border border-[#D9E2EA] text-xs">
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Radiative Power (FRP)</div>
                    <div className="text-base font-bold font-mono text-[#B91C1C]">{intel.thermal.frp.toFixed(1)} MW</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Brightness Temp</div>
                    <div className="text-base font-bold font-mono text-[#102A43]">{intel.thermal.brightness.toFixed(1)} K</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Instrument Orbit</div>
                    <div className="font-medium text-[#102A43]">{intel.thermal.satellite} ({intel.thermal.daynight === 'N' ? 'Night' : 'Day'})</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Detection Quality</div>
                    <div className="font-bold text-[#3BAA91]">{intel.thermal.source_confidence}</div>
                  </div>
                </div>
              </div>

              {/* Section 3: Industrial Context & Baseline Analysis */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#52677D] border-b border-[#D9E2EA] pb-1">
                  3. Industrial Context &amp; 30-Day Temporal History
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F4F7FA] p-3 rounded-xl border border-[#D9E2EA] text-xs">
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Distance to Asset</div>
                    <div className="font-bold text-[#2F6FED]">{intel.spatial.distance_to_nearest_asset_m.toFixed(0)} m</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Inside Boundary</div>
                    <div className="font-bold text-[#102A43]">{intel.spatial.is_inside_boundary ? 'Yes (Geofenced)' : 'No'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Historical Baseline Median</div>
                    <div className="font-mono text-[#102A43]">{intel.temporal.historical_median_frp?.toFixed(1) ?? 'N/A'} MW</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6B7C8F] uppercase font-bold">Persistence Status</div>
                    <div className="font-bold text-[#2F6FED]">
                      {intel.temporal.persistence_detected ? 'Cataloged Source' : 'Transient / Sudden'}
                    </div>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F4F7FA] border border-[#D9E2EA] text-xs text-[#52677D] italic">
                  &ldquo;{intel.temporal.interpretation}&rdquo;
                </div>
              </div>

              {/* Section 4: Classification, Confidence & Risk */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#52677D] border-b border-[#D9E2EA] pb-1">
                  4. Multi-Evidence AI Classification &amp; Priority
                </h2>
                <div className="p-4 rounded-xl bg-[#EEF4FF] border border-[#BFDBFE] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#1E40AF]">Assessed Classification</span>
                      <div className="text-lg font-bold text-[#102A43]">{intel.classification.predicted_class}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#1E40AF]">Assessment Confidence</span>
                      <div className="text-lg font-bold text-[#1E40AF]">
                        {(intel.classification.confidence_score * 100).toFixed(0)}% HIGH
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-[#1E40AF] pt-1 border-t border-[#BFDBFE]/60">
                    Recommended Investigation Priority: <b>{intel.risk.risk_level}</b> (Score: {intel.risk.risk_score.toFixed(1)}/100)
                  </div>
                </div>
              </div>

              {/* Section 5: Supporting Evidence & Uncertainties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#E8F7F3]/70 rounded-xl border border-[#A7F3D0] space-y-1.5">
                  <div className="font-bold text-[#065F46] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Supporting Evidence Factors:
                  </div>
                  <ul className="space-y-1 text-[#102A43] list-disc list-inside">
                    {intel.classification.supporting_evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-[#FEF3C7]/70 rounded-xl border border-[#FDE68A] space-y-1.5">
                  <div className="font-bold text-[#92400E] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Limitations &amp; Uncertainties:
                  </div>
                  <ul className="space-y-1 text-[#52677D] list-disc list-inside">
                    {intel.classification.uncertainty_factors.map((un, i) => (
                      <li key={i}>{un}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Section 6: Analyst Notes & Audit Log */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#52677D] border-b border-[#D9E2EA] pb-1">
                  5. Analyst Notes &amp; Audit Trail
                </h2>
                <div className="space-y-2 text-xs">
                  {intel.investigation.notes.length === 0 ? (
                    <div className="text-[#6B7C8F] italic">No analyst inspection notes logged.</div>
                  ) : (
                    intel.investigation.notes.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-lg bg-[#F4F7FA] border border-[#D9E2EA]">
                        <span className="font-bold text-[#102A43]">{n.author}</span>{' '}
                        <span className="text-[#6B7C8F] text-[11px]">({n.timestamp})</span>:
                        <div className="mt-0.5 text-[#102A43]">{n.text}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sign-off footer */}
              <div className="pt-6 border-t-2 border-[#102A43] flex items-center justify-between text-[11px] text-[#52677D]">
                <div>Generated by ThermoScope AI Intelligence Engine &bull; NTRO PS 26162</div>
                <div className="font-mono">INTELLIGENCE_DISPATCH_AUTHORIZED</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
