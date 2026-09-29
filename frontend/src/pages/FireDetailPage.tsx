import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  Factory,
  Home,
  ShieldAlert,
  Cpu,
  Radio,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  Thermometer,
  Layers,
  Activity,
  FileText,
  Eye,
  CheckSquare,
  Sliders,
  History,
  Sparkles,
  Share2,
  Printer,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  HelpCircle,
  Building2,
  Users
} from 'lucide-react';
import {
  FireDetection,
  SatelliteContext,
  RiskExplanation,
  ImpactAnalysis,
  AnalystReview,
  WhatIfSimulationResult
} from '../types';
import { api } from '../services/api';
import { SeverityBadge, ClassBadge } from '../components/ui/Badge';

export const FireDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const cachedFire = id ? api.getCached<FireDetection>(`fire_${id}`) : undefined;
  const cachedSat = id ? api.getCached<SatelliteContext>(`fire_sat_${id}`) : undefined;
  const cachedExp = id ? api.getCached<RiskExplanation>(`fire_exp_${id}`) : undefined;
  const cachedImp = id ? api.getCached<ImpactAnalysis>(`fire_impact_${id}`) : undefined;

  const [fire, setFire] = useState<FireDetection | null>(() => cachedFire || null);
  const [satelliteContext, setSatelliteContext] = useState<SatelliteContext | null>(() => cachedSat || null);
  const [imageError, setImageError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(() => !cachedFire);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'explanation' | 'impact' | 'analyst' | 'simulation' | 'replay' | 'similar'
  >('overview');

  // Deep-dive intelligence states
  const [explanation, setExplanation] = useState<RiskExplanation | null>(() => cachedExp || null);
  const [impact, setImpact] = useState<ImpactAnalysis | null>(() => cachedImp || null);
  const [evidence, setEvidence] = useState<any | null>(null);
  const [reviews, setReviews] = useState<AnalystReview[]>([]);
  const [similarFires, setSimilarFires] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [replayData, setReplayData] = useState<{ incident_id: string; total_steps: number; steps: any[] } | null>(null);

  // Replay playback
  const [currentReplayStep, setCurrentReplayStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Analyst review form state
  const [reviewDecision, setReviewDecision] = useState<'CONFIRMED' | 'FALSE_POSITIVE' | 'INCORRECT_CLASSIFICATION' | 'UNKNOWN'>('CONFIRMED');
  const [correctedClass, setCorrectedClass] = useState<string>('Industrial Fire');
  const [analystName, setAnalystName] = useState<string>('Analyst-1');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // What-If Simulation State
  const [simFrpMult, setSimFrpMult] = useState<number>(1.3);
  const [simExtraDetections, setSimExtraDetections] = useState<number>(2);
  const [simWindSpeed, setSimWindSpeed] = useState<number>(25);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<WhatIfSimulationResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setImageError(false);

    const cachedF = api.getCached<FireDetection>(`fire_${id}`);
    const cachedS = api.getCached<SatelliteContext>(`fire_sat_${id}`);
    if (cachedF) {
      setFire(cachedF);
      setSatelliteContext(cachedS || null);
      setLoading(false);
      const cachedE = api.getCached<RiskExplanation>(`fire_exp_${id}`);
      const cachedI = api.getCached<ImpactAnalysis>(`fire_impact_${id}`);
      if (cachedE) setExplanation(cachedE);
      if (cachedI) setImpact(cachedI);
    } else {
      setLoading(true);
    }

    Promise.all([
      api.getFireById(id),
      api.getFireSatelliteContext(id).catch(() => null)
    ])
      .then(([fireData, satData]) => {
        setFire(fireData);
        setSatelliteContext(satData);

        // Preload supplementary intelligence asynchronously
        api.getFireExplanation(id).then(setExplanation).catch(() => null);
        api.getFireImpact(id).then(setImpact).catch(() => null);
        api.getFireEvidence(id).then(setEvidence).catch(() => null);
        api.getFireReviews(id).then(setReviews).catch(() => null);
        api.getSimilarFires(id).then(res => setSimilarFires(res.similar_fires || [])).catch(() => null);

        if (fireData.incident_id) {
          api.getIncidentTimeline(fireData.incident_id).then(setTimeline).catch(() => null);
          api.getIncidentReplay(fireData.incident_id).then(res => {
            setReplayData(res);
            setCurrentReplayStep((res.steps || []).length - 1);
          }).catch(() => null);
        }
      })
      .catch((err) => {
        if (!api.getCached(`fire_${id}`)) {
          setError(err.message || 'Incident not found');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Replay ticker effect
  useEffect(() => {
    let timer: any;
    if (isPlaying && replayData && replayData.steps.length > 0) {
      timer = setInterval(() => {
        setCurrentReplayStep((prev) => {
          if (prev >= replayData.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, replayData]);

  const handleAnalystSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingReview(true);
    setReviewSuccessMsg(null);

    try {
      const review = await api.submitAnalystReview(id, {
        decision: reviewDecision,
        corrected_class: reviewDecision === 'INCORRECT_CLASSIFICATION' ? correctedClass : undefined,
        analyst_id: 'usr-analyst-1',
        analyst_name: analystName,
        notes: reviewNotes
      });
      setReviews(prev => [review, ...prev]);
      setReviewSuccessMsg('Review recorded successfully and appended to labelled verification dataset.');
      setReviewNotes('');
    } catch (err: any) {
      alert(`Error submitting review: ${err.message}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!id) return;
    setSimulating(true);
    setSimError(null);
    try {
      const res = await api.simulateRisk(id, {
        frp_multiplier: simFrpMult,
        additional_detections_count: simExtraDetections,
        wind_speed_kmh: simWindSpeed
      });
      setSimulationResult(res);
    } catch (err: any) {
      console.error('Simulation error:', err);
      setSimError(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-geo-500 font-medium">Retrieving verified satellite telemetry and spatial dossier...</p>
      </div>
    );
  }

  if (error || !fire) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-geo-900">Incident Not Found</h2>
        <p className="text-sm text-geo-600">{error || 'The requested incident identifier does not exist.'}</p>
        <Link to="/fires" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fire Explorer</span>
        </Link>
      </div>
    );
  }

  const pred = fire.prediction;
  const probabilities = pred?.class_probabilities || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-geo-200">
        <div className="flex items-center gap-3">
          <Link
            to="/fires"
            className="p-2 rounded-xl border border-geo-200 bg-white text-geo-600 hover:text-geo-900 hover:bg-geo-50 transition-colors shadow-subtle"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-geo-500 uppercase">Detection ID:</span>
              <h1 className="text-2xl font-extrabold text-geo-900 font-mono tracking-tight">{fire.id}</h1>
              <SeverityBadge severity={pred?.severity || 'LOW'} />
              {fire.incident_id && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-mono font-semibold">
                  Incident: {fire.incident_id}
                </span>
              )}
            </div>
            <p className="text-xs text-geo-500 mt-0.5">
              Observed by {fire.satellite} ({fire.instrument}) on {new Date(fire.detection_time).toUTCString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-geo-200 bg-white text-geo-700 hover:bg-geo-50 text-xs font-bold shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
          {fire.is_demo_fallback && (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
              Offline Baseline Sample
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-bold font-mono">
            Model: {pred?.model_version || 'v1.0.0'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-geo-200 pb-2 text-xs font-bold text-geo-600">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'overview' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-geo-100 text-geo-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Overview & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('explanation')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'explanation' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-geo-100 text-geo-700'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Why High Risk?</span>
        </button>

        <button
          onClick={() => setActiveTab('impact')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'impact' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-geo-100 text-geo-700'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Impact & Exposure</span>
        </button>

        <button
          onClick={() => setActiveTab('analyst')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'analyst' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-geo-100 text-geo-700'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Analyst Verification ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'simulation' ? 'bg-amber-600 text-white shadow-sm' : 'hover:bg-amber-50 text-amber-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>What-If Simulation</span>
        </button>

        <button
          onClick={() => setActiveTab('replay')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'replay' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-geo-100 text-geo-700'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Timeline & Replay</span>
        </button>

        <button
          onClick={() => setActiveTab('similar')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'similar' ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-geo-100 text-geo-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Similar Events ({similarFires.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: AI Classification & Risk Assessment (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Card 1: AI Classification Breakdown */}
            <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-geo-900">AI Classification & Confidence</h3>
                    <p className="text-xs text-geo-500">Multi-feature machine learning prediction</p>
                  </div>
                </div>
                <ClassBadge predictedClass={pred?.predicted_class || 'Other / Uncertain'} />
              </div>

              {/* Primary Confidence Bar */}
              <div className="p-4 rounded-xl bg-geo-50 border border-geo-200 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-geo-700">Calibrated Confidence Score</span>
                  <span className="font-mono font-bold text-brand-600 text-sm">
                    {Math.round((pred?.confidence || 0.75) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-geo-200 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((pred?.confidence || 0.75) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Class Probability Distribution */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-geo-500 block">
                  Class Probability Distribution
                </span>
                <div className="space-y-2 text-xs">
                  {Object.entries(probabilities).map(([cls, prob]) => {
                    const isWinner = cls === pred?.predicted_class;
                    const pct = Math.round(Number(prob) * 100);
                    return (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className={isWinner ? 'font-bold text-geo-900' : 'text-geo-600'}>{cls}</span>
                          <span className="font-mono font-semibold text-geo-700">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-geo-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isWinner ? 'bg-brand-600' : 'bg-geo-300'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 2: Recommended Tactical Response Protocol */}
            <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-geo-900">Recommended Response Protocol</h3>
                  <p className="text-xs text-geo-500">Authorized guidelines based on risk level & proximity</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-geo-50 border border-geo-200 text-xs text-geo-800 leading-relaxed font-medium">
                {pred?.recommended_response || 'Standard orbital surveillance. No acute perimeter exposure detected.'}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-geo-200 bg-white">
                  <span className="text-geo-500 text-[10px] uppercase font-bold">Severity Tier</span>
                  <p className="font-bold text-sm text-geo-900 mt-0.5">{pred?.severity}</p>
                </div>
                <div className="p-3 rounded-xl border border-geo-200 bg-white">
                  <span className="text-geo-500 text-[10px] uppercase font-bold">Risk Assessment</span>
                  <p className="font-bold text-sm text-geo-900 mt-0.5 font-mono">{pred?.risk_score} / 100</p>
                </div>
              </div>
            </div>

            {/* Card 3: Satellite Context Imagery */}
            <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-geo-900">Satellite Context Imagery</h3>
                    <p className="text-xs text-geo-500">Orbital surface reflectance & context</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-geo-500">
                  {satelliteContext?.provider || 'NASA GIBS'}
                </span>
              </div>

              {satelliteContext?.available && satelliteContext.image_url && !imageError ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-geo-200 bg-geo-100 aspect-video flex items-center justify-center">
                    <img
                      src={satelliteContext.image_url}
                      alt="Satellite Context Imagery"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setImageError(true);
                      }}
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 text-white text-[10px] font-mono">
                      {satelliteContext.resolution || '250m Resolution'} &bull; {satelliteContext.capture_date}
                    </div>
                  </div>
                  <p className="text-[11px] text-geo-500 leading-relaxed italic">
                    {satelliteContext.disclaimer}
                  </p>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-geo-50 border border-geo-200 text-center space-y-2">
                  <ImageIcon className="w-8 h-8 text-geo-400 mx-auto" />
                  <p className="text-xs font-semibold text-geo-700">
                    Satellite imagery unavailable for this detection
                  </p>
                  <p className="text-[11px] text-geo-500">
                    True-color optical imagery requires daylight passes and minimal cloud coverage.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Telemetry Specs & Spatial Proximity (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Card 4: Sensor & Telemetry Readings */}
            <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-geo-900">Sensor Telemetry</h3>
                  <p className="text-xs text-geo-500">NASA FIRMS raw instrument metrics</p>
                </div>
              </div>

              <div className="space-y-3 text-xs divide-y divide-geo-100">
                <div className="flex justify-between pt-2">
                  <span className="text-geo-500">Brightness Temperature:</span>
                  <span className="font-mono font-bold text-geo-900">
                    {fire.brightness_temperature != null ? fire.brightness_temperature.toFixed(2) : 'N/A'} K
                  </span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-geo-500">Thermal Radiative Power (FRP):</span>
                  <span className="font-mono font-bold text-geo-900">{fire.frp ? fire.frp.toFixed(2) : '0.00'} MW</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-geo-500">FIRMS Raw Confidence:</span>
                  <span className="font-mono font-bold text-geo-900">{fire.confidence}%</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-geo-500">Solar Position:</span>
                  <span className="font-semibold text-geo-900">{fire.day_night === 'N' ? 'Nighttime Orbital Pass' : 'Daytime Orbital Pass'}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-geo-500">Satellite Platform:</span>
                  <span className="font-mono text-geo-900">{fire.satellite} ({fire.sensor})</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-geo-500">Geographic Coordinates:</span>
                  <span className="font-mono text-geo-900">
                    {fire.latitude != null ? fire.latitude.toFixed(4) : '0'}&deg;N, {fire.longitude != null ? fire.longitude.toFixed(4) : '0'}&deg;E
                  </span>
                </div>
              </div>
            </div>

            {/* Card 5: Spatial Proximity & Topology */}
            <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-geo-100 text-geo-800 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-geo-900">Spatial Topology</h3>
                  <p className="text-xs text-geo-500">OpenStreetMap proximity matching</p>
                </div>
              </div>

              {/* Industrial Proximity */}
              <div className="p-3.5 rounded-xl bg-geo-50 border border-geo-200 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-geo-700 font-bold">
                  <Factory className="w-4 h-4 text-brand-600" />
                  <span>Nearest Industrial Facility</span>
                </div>
                {pred?.nearby_industrial_name ? (
                  <div>
                    <p className="font-bold text-geo-900 text-sm">{pred.nearby_industrial_name}</p>
                    <div className="flex justify-between text-[11px] text-geo-500 mt-1">
                      <span>Category: <strong className="capitalize">{pred.nearby_industrial_type?.replace('_', ' ')}</strong></span>
                      <span className="font-bold text-brand-600">{pred.distance_to_industrial_km?.toFixed(2)} km away</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-geo-500 text-[11px]">No registered industrial site within 25 km.</p>
                )}
              </div>

              {/* Residential Proximity */}
              <div className="p-3.5 rounded-xl bg-geo-50 border border-geo-200 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-geo-700 font-bold">
                  <Home className="w-4 h-4 text-indigo-600" />
                  <span>Nearest Residential Settlement</span>
                </div>
                {pred?.nearby_residential_name ? (
                  <div>
                    <p className="font-bold text-geo-900 text-sm">{pred.nearby_residential_name}</p>
                    <div className="flex justify-between text-[11px] text-geo-500 mt-1">
                      <span>Proximity Buffer:</span>
                      <span className="font-bold text-red-600">{pred.distance_to_residential_km?.toFixed(2)} km</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-geo-500 text-[11px]">No sensitive population settlements within 15 km.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: EXPLAINABLE RISK */}
      {activeTab === 'explanation' && (
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-geo-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-geo-900">Why is this Fire High Risk?</h2>
                <p className="text-xs text-geo-500">Evidence-based explainable risk factors derived from real database calculations</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black font-mono text-geo-900">{pred?.risk_score || 0} / 100</div>
              <SeverityBadge severity={pred?.severity || 'LOW'} />
            </div>
          </div>

          {explanation?.summary_headline && (
            <div className="p-4 rounded-xl bg-geo-50 border border-geo-200 text-sm font-semibold text-geo-800">
              {explanation.summary_headline}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-geo-500">Calculated Multi-Factor Evidence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(explanation?.explanations || []).map((exp, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-2 text-xs ${
                    exp.level === 'CRITICAL'
                      ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                      : exp.level === 'ELEVATED'
                      ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                      : 'bg-geo-50/50 border-geo-200 text-geo-800'
                  }`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-sm">{exp.factor}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      exp.level === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      exp.level === 'ELEVATED' ? 'bg-amber-100 text-amber-800' : 'bg-geo-200 text-geo-700'
                    }`}>
                      {exp.level} &bull; Score {exp.score}/100
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">{exp.evidence}</p>
                  <div className="text-[10px] text-geo-500 pt-1 border-t border-geo-200/60">
                    Factor Contribution Weight: {(exp.weight * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {explanation?.recommendation && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-blue-800">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Tactical Operational Directive:</span>
              </span>
              <p>{explanation.recommendation}</p>
            </div>
          )}
        </div>
      )}



      {/* TAB 4: IMPACT & EXPOSURE ANALYSIS */}
      {activeTab === 'impact' && (
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-geo-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-geo-900">Multi-Factor Impact & Exposure Analysis</h2>
                <p className="text-xs text-geo-500">Spatial radius exposure across industrial sites, residential settlements, and critical infrastructure</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold text-xs">
              Danger Zone: {impact?.danger_zone || 'PERIMETER_MONITORING'}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-geo-50 border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] font-bold uppercase">Estimated Pop. Exposure</span>
              <p className="text-xl font-bold font-mono text-geo-900">
                {impact?.population_exposure_estimate ? impact.population_exposure_estimate.toLocaleString() : 'N/A'}
              </p>
              <span className="text-[10px] text-geo-400 block">{impact?.population_source || 'Census Buffer'}</span>
            </div>
            <div className="p-4 rounded-xl bg-geo-50 border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] font-bold uppercase">Industrial Facilities</span>
              <p className="text-xl font-bold font-mono text-geo-900">{impact?.facilities_at_risk_count || 0}</p>
              <span className="text-[10px] text-geo-400 block">within 10 km</span>
            </div>
            <div className="p-4 rounded-xl bg-geo-50 border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] font-bold uppercase">Residential Areas</span>
              <p className="text-xl font-bold font-mono text-geo-900">{impact?.residential_settlements_at_risk_count || 0}</p>
              <span className="text-[10px] text-geo-400 block">within 8 km</span>
            </div>
            <div className="p-4 rounded-xl bg-geo-50 border border-geo-200 space-y-1">
              <span className="text-geo-500 text-[10px] font-bold uppercase">Critical Infrastructure</span>
              <p className="text-xl font-bold font-mono text-geo-900">{impact?.critical_infrastructure_count || 0}</p>
              <span className="text-[10px] text-geo-400 block">power/transport</span>
            </div>
          </div>

          {/* Impact Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-geo-500">Exposed Spatial Assets</h3>
            <div className="overflow-x-auto rounded-xl border border-geo-200">
              <table className="w-full text-left text-xs divide-y divide-geo-200">
                <thead className="bg-geo-50 font-bold text-geo-700">
                  <tr>
                    <th className="p-3">Asset Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Proximity</th>
                    <th className="p-3">Danger Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-geo-100 bg-white">
                  {(impact?.impact_items || []).length > 0 ? (
                    impact?.impact_items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-geo-50/50">
                        <td className="p-3 font-bold text-geo-900">{item.name}</td>
                        <td className="p-3 text-geo-600 font-mono text-[11px]">{item.category}</td>
                        <td className="p-3 text-geo-600 capitalize">{item.type ? item.type.replace('_', ' ') : 'Asset'}</td>
                        <td className="p-3 font-mono font-semibold text-brand-600">
                          {item.distance_km != null ? item.distance_km.toFixed(2) : '0.00'} km
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.danger_tier === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            item.danger_tier === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            item.danger_tier === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                            'bg-geo-100 text-geo-700'
                          }`}>
                            {item.danger_tier}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-geo-500">
                        No critical assets registered within primary exposure radius.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ANALYST VERIFICATION */}
      {activeTab === 'analyst' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Review Submission Form */}
          <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-geo-900">Analyst Verification Workflow</h3>
                <p className="text-xs text-geo-500">Verify detection authenticity and contribute to labelled feedback dataset</p>
              </div>
            </div>

            {reviewSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{reviewSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleAnalystSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-geo-700">Analyst Determination</label>
                <select
                  value={reviewDecision}
                  onChange={(e: any) => setReviewDecision(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-geo-300 font-semibold text-geo-800 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="CONFIRMED">CONFIRMED (True Thermal Event)</option>
                  <option value="FALSE_POSITIVE">FALSE POSITIVE (Hot Roof / Flare Glare / Reflection)</option>
                  <option value="INCORRECT_CLASSIFICATION">INCORRECT CLASSIFICATION (Misidentified Class)</option>
                  <option value="UNKNOWN">UNKNOWN / INSUFFICIENT RESOLUTION</option>
                </select>
              </div>

              {reviewDecision === 'INCORRECT_CLASSIFICATION' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-geo-700">Corrected Classification Label</label>
                  <select
                    value={correctedClass}
                    onChange={(e) => setCorrectedClass(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-geo-300 font-semibold text-geo-800 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Industrial Fire">Industrial Fire</option>
                    <option value="Gas Flare / Persistent Thermal Source">Gas Flare / Persistent Thermal Source</option>
                    <option value="Wildfire / Natural Fire">Wildfire / Natural Fire</option>
                    <option value="Agricultural Burning">Agricultural Burning</option>
                    <option value="Mining / Slag Activity">Mining / Slag Activity</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-geo-700">Analyst Handle</label>
                <input
                  type="text"
                  value={analystName}
                  onChange={(e) => setAnalystName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-geo-300 text-geo-800 focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-geo-700">Verification Notes & Evidence</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Record satellite imagery observations, facility correspondence, or field confirmation details..."
                  className="w-full p-2.5 rounded-xl border border-geo-300 text-geo-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {submittingReview ? 'Submitting Review...' : 'Record Verification Decision'}
              </button>
            </form>
          </div>

          {/* Past Review History */}
          <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
            <h3 className="text-base font-bold text-geo-900">Verification Audit Trail</h3>
            <p className="text-xs text-geo-500">Historical expert reviews recorded for this detection</p>

            <div className="space-y-3">
              {reviews.length > 0 ? (
                reviews.map((rev, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-geo-50 border border-geo-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        rev.decision === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                        rev.decision === 'FALSE_POSITIVE' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {rev.decision}
                      </span>
                      <span className="text-[10px] text-geo-400 font-mono">
                        {rev.reviewed_at ? new Date(rev.reviewed_at).toLocaleString() : 'Recent'}
                      </span>
                    </div>
                    {rev.notes && <p className="text-geo-800 font-medium italic">"{rev.notes}"</p>}
                    <div className="text-[10px] text-geo-500">
                      Reviewed by: <strong>{rev.analyst_name}</strong> ({rev.analyst_id})
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-geo-400 text-xs">
                  No analyst reviews logged yet. Submit the first verification decision on the left.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 6: WHAT-IF SIMULATION */}
      {activeTab === 'simulation' && (
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-6">
          <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-dashed border-amber-500 text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <Sliders className="w-4 h-4 text-amber-700" />
              <span>SPECULATIVE WHAT-IF SCENARIO SIMULATION</span>
            </div>
            <p className="text-xs">
              Every value generated in this mode is <strong>SIMULATION ONLY</strong>. It tests sensitivity to elevated FRP, higher wind speeds, or clustering without modifying real database observations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2 p-4 rounded-xl bg-geo-50 border border-geo-200">
              <div className="flex justify-between font-bold text-geo-700">
                <span>FRP Multiplier:</span>
                <span className="font-mono text-brand-600">{simFrpMult}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={simFrpMult}
                onChange={(e) => setSimFrpMult(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-[10px] text-geo-500">Simulate rapid combustion intensification</span>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-geo-50 border border-geo-200">
              <div className="flex justify-between font-bold text-geo-700">
                <span>Nearby Secondary Detections:</span>
                <span className="font-mono text-brand-600">+{simExtraDetections}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={simExtraDetections}
                onChange={(e) => setSimExtraDetections(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-[10px] text-geo-500">Simulate spatial clustering expansion</span>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-geo-50 border border-geo-200">
              <div className="flex justify-between font-bold text-geo-700">
                <span>Surface Wind Speed:</span>
                <span className="font-mono text-brand-600">{simWindSpeed} km/h</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={simWindSpeed}
                onChange={(e) => setSimWindSpeed(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-[10px] text-geo-500">Simulate gusting advection risk</span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <Sliders className="w-4 h-4" />
              <span>{simulating ? 'Calculating Scenario...' : 'Execute What-If Risk Simulation'}</span>
            </button>
          </div>

          {simError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold text-center">
              {simError}
            </div>
          )}

          {simulationResult && (
            <div className="p-6 rounded-xl bg-geo-50 border-2 border-amber-300 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-geo-200">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Scenario Outcome [SIMULATION]
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-xs font-bold">
                  Delta: {simulationResult.risk_delta_vs_baseline !== undefined && simulationResult.risk_delta_vs_baseline !== null ? `${simulationResult.risk_delta_vs_baseline > 0 ? '+' : ''}${simulationResult.risk_delta_vs_baseline}` : 0} pts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-white rounded-xl border border-geo-200 space-y-1">
                  <span className="text-geo-500 text-[10px] font-bold">Simulated Risk Score</span>
                  <p className="text-2xl font-black font-mono text-red-600">
                    {simulationResult.simulated_risk_score} / 100
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-geo-200 space-y-1">
                  <span className="text-geo-500 text-[10px] font-bold">Simulated Severity</span>
                  <p className="text-lg font-bold text-geo-900">{simulationResult.simulated_severity}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-geo-200 space-y-1">
                  <span className="text-geo-500 text-[10px] font-bold">Recommended Response</span>
                  <p className="text-xs font-medium text-geo-800 leading-snug">
                    {simulationResult.recommended_response}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: TIMELINE & REPLAY */}
      {activeTab === 'replay' && (
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-geo-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-geo-900">Chronological Incident Timeline & Replay</h2>
                <p className="text-xs text-geo-500">Step-by-step sequential playback of thermal activity</p>
              </div>
            </div>

            {replayData && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause' : 'Play Replay'}</span>
                </button>
              </div>
            )}
          </div>

          {replayData && replayData.steps.length > 0 ? (
            <div className="space-y-6">
              
              {/* Playback Slider */}
              <div className="space-y-2 p-4 rounded-xl bg-geo-50 border border-geo-200">
                <div className="flex justify-between text-xs font-bold text-geo-700">
                  <span>Step {currentReplayStep + 1} of {replayData.steps.length}</span>
                  <span className="font-mono text-indigo-600">
                    {new Date(replayData.steps[currentReplayStep].timestamp).toUTCString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={replayData.steps.length - 1}
                  value={currentReplayStep}
                  onChange={(e) => setCurrentReplayStep(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Current Step State Card */}
              {replayData.steps[currentReplayStep] && (
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3 text-xs">
                  <div className="flex justify-between items-center font-bold text-indigo-900">
                    <span className="text-sm">Snapshot at Step {currentReplayStep + 1}</span>
                    <span className="font-mono text-xs">
                      Max FRP: {replayData.steps[currentReplayStep].frp.toFixed(1)} MW
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded bg-white border border-indigo-100">
                      <span className="text-geo-500 text-[10px] block">Coordinates</span>
                      <span className="font-mono font-bold text-geo-900">
                        {replayData.steps[currentReplayStep].latitude.toFixed(3)}, {replayData.steps[currentReplayStep].longitude.toFixed(3)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-indigo-100">
                      <span className="text-geo-500 text-[10px] block">Cumulative Detections</span>
                      <span className="font-bold text-geo-900">{replayData.steps[currentReplayStep].cumulative_detections}</span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-indigo-100">
                      <span className="text-geo-500 text-[10px] block">Incident Risk Score</span>
                      <span className="font-mono font-bold text-red-600">{replayData.steps[currentReplayStep].risk_score} / 100</span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-indigo-100">
                      <span className="text-geo-500 text-[10px] block">Lifecycle Status</span>
                      <span className="font-bold text-geo-900">{replayData.steps[currentReplayStep].status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Timeline Feed */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-geo-500">Incident Event Log</h3>
                <div className="space-y-2">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-geo-50 border border-geo-200 flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-geo-900">{event.event_type}</span>
                        <p className="text-geo-600 text-[11px]">{event.description}</p>
                      </div>
                      <span className="text-geo-400 font-mono text-[10px]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-geo-400 text-xs">
              Single detection observation. Timeline and replay activate when multiple observations cluster into an Incident.
            </div>
          )}
        </div>
      )}

      {/* TAB 8: SIMILAR HISTORICAL EVENTS */}
      {activeTab === 'similar' && (
        <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-geo-900">Similar Historical Events</h3>
              <p className="text-xs text-geo-500">Multi-attribute matches based on FRP, persistence, classification, and topology</p>
            </div>
          </div>

          <div className="space-y-3">
            {similarFires.length > 0 ? (
              similarFires.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-geo-50 border border-geo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/fires/${item.fire_id}`} className="font-mono font-bold text-brand-600 hover:underline">
                        {item.fire_id}
                      </Link>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                        {item.similarity_pct}% Match
                      </span>
                    </div>
                    <p className="text-geo-600 text-[11px]">{item.similarity_reason}</p>
                  </div>
                  <div className="text-right text-[11px] text-geo-500">
                    <div>FRP: <strong>{item.frp?.toFixed(1)} MW</strong></div>
                    <div>Distance: <strong>{item.distance_km?.toFixed(1)} km</strong></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-geo-400 text-xs">
                No closely matching historical events found in the rolling 90-day archive.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
