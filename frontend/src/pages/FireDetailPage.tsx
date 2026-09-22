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
  FileText
} from 'lucide-react';
import { FireDetection, SatelliteContext } from '../types';
import { api } from '../services/api';
import { SeverityBadge, ClassBadge } from '../components/ui/Badge';

export const FireDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [fire, setFire] = useState<FireDetection | null>(null);
  const [satelliteContext, setSatelliteContext] = useState<SatelliteContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      api.getFireById(id),
      api.getFireSatelliteContext(id).catch(() => null)
    ])
      .then(([fireData, satData]) => {
        setFire(fireData);
        setSatelliteContext(satData);
      })
      .catch((err) => {
        setError(err.message || 'Incident not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

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
              <span className="text-xs font-mono font-bold text-geo-500 uppercase">Dossier ID:</span>
              <h1 className="text-2xl font-extrabold text-geo-900 font-mono tracking-tight">{fire.id}</h1>
              <SeverityBadge severity={pred?.severity || 'LOW'} />
            </div>
            <p className="text-xs text-geo-500 mt-0.5">
              Observed by {fire.satellite} ({fire.instrument}) on {new Date(fire.detection_time).toUTCString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Main Grid: Telemetry & AI Cards */}
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

            {satelliteContext?.available && satelliteContext.image_url ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-geo-200 bg-geo-900 aspect-video flex items-center justify-center">
                  <img
                    src={satelliteContext.image_url}
                    alt="Satellite Context Imagery"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback display if tile server has network latency
                      (e.target as HTMLElement).style.display = 'none';
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
                <span className="font-mono font-bold text-geo-900">{fire.brightness_temperature.toFixed(2)} K</span>
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
                <span className="font-mono text-geo-900">{fire.latitude.toFixed(4)}&deg;N, {fire.longitude.toFixed(4)}&deg;E</span>
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

    </div>
  );
};
