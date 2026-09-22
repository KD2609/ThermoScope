import React, { useEffect, useState } from 'react';
import {
  Bell,
  MapPin,
  Shield,
  Trash2,
  Plus,
  Mail,
  Smartphone,
  Globe,
  CheckCircle2,
  Info
} from 'lucide-react';
import { NotificationSubscription } from '../types';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [userEmail, setUserEmail] = useState<string>('resident@thermoscope.local');
  const [areaName, setAreaName] = useState<string>('My Residential Sector');
  const [latitude, setLatitude] = useState<number>(22.4900);
  const [longitude, setLongitude] = useState<number>(70.0750);
  const [radiusKm, setRadiusKm] = useState<number>(5.0);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(true);
  const [browserEnabled, setBrowserEnabled] = useState<boolean>(true);
  const [smsEnabled, setSmsEnabled] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await api.getSubscriptions(userEmail);
      setSubscriptions(data);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [userEmail]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createSubscription({
        user_email: userEmail,
        area_name: areaName,
        latitude,
        longitude,
        radius_km: radiusKm,
        email_enabled: emailEnabled,
        browser_enabled: browserEnabled,
        sms_enabled: smsEnabled
      });
      setAreaName('');
      await loadSubscriptions();
      alert('Geographic watch area registered successfully!');
    } catch (err) {
      alert('Failed to register subscription: ' + err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this geographic watch subscription?')) return;
    try {
      await api.deleteSubscription(id);
      await loadSubscriptions();
    } catch (err) {
      alert('Failed to delete subscription: ' + err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="pb-2 border-b border-geo-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-geo-900 tracking-tight">
          Public Awareness & Geographic Subscriptions
        </h1>
        <p className="text-sm text-geo-500 mt-1">
          Opt into automated early warnings for thermal incidents and industrial emergencies within your local sector.
        </p>
      </div>

      {/* Responsible Wording Notice */}
      <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 flex items-start gap-3 text-xs text-brand-900">
        <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Responsible Public Awareness Architecture:</span>
          <p className="leading-relaxed">
            The platform delivers verified warnings when high-risk industrial anomalies intersect your watch radius.
            Exact residential addresses are never stored or exposed; only spatial circle buffers are evaluated.
            Notifications advise verifying local district directives and observing safety guidance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Create Subscription Form (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-geo-100">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-geo-900">Register New Geographic Watch Area</h3>
              <p className="text-xs text-geo-500">Configure alert coordinates and safety perimeter</p>
            </div>
          </div>

          <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-geo-700 mb-1">Watch Area Label</label>
              <input
                type="text"
                required
                placeholder="e.g. Moti Khavdi Community Watch"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-geo-200 bg-geo-50 text-geo-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-geo-700 mb-1">Subscriber Contact Email</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-geo-200 bg-geo-50 text-geo-900 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-geo-700 mb-1">Center Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-geo-200 bg-geo-50 text-geo-900 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-geo-700 mb-1">Center Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-geo-200 bg-geo-50 text-geo-900 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>

            {/* Radius Slider */}
            <div className="space-y-1.5 p-3 rounded-xl bg-geo-50 border border-geo-200">
              <div className="flex justify-between font-semibold text-geo-800">
                <span>Alert Watch Radius:</span>
                <span className="font-mono text-brand-600 font-bold">{radiusKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-[10px] text-geo-500">
                <span>1 km (Immediate Perimeter)</span>
                <span>25 km (Regional Corridor)</span>
              </div>
            </div>

            {/* Channel Toggles */}
            <div className="space-y-2 pt-1">
              <span className="font-semibold text-geo-700 block">Dispatch Channels</span>
              <div className="grid grid-cols-3 gap-2">
                
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-geo-200 bg-geo-50 cursor-pointer text-geo-800 font-medium">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="rounded border-geo-300 text-brand-600 focus:ring-brand-500"
                  />
                  <Mail className="w-3.5 h-3.5 text-geo-600" />
                  <span>Email</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-geo-200 bg-geo-50 cursor-pointer text-geo-800 font-medium">
                  <input
                    type="checkbox"
                    checked={browserEnabled}
                    onChange={(e) => setBrowserEnabled(e.target.checked)}
                    className="rounded border-geo-300 text-brand-600 focus:ring-brand-500"
                  />
                  <Globe className="w-3.5 h-3.5 text-geo-600" />
                  <span>Browser</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-geo-200 bg-geo-50 cursor-pointer text-geo-800 font-medium">
                  <input
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    className="rounded border-geo-300 text-brand-600 focus:ring-brand-500"
                  />
                  <Smartphone className="w-3.5 h-3.5 text-geo-600" />
                  <span>SMS</span>
                </label>

              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-colors"
            >
              {submitting ? 'Registering Watch Perimeter...' : 'Activate Geographic Watch Area'}
            </button>
          </form>
        </div>

        {/* Right Column: Active Subscriptions List (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-geo-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-geo-100">
              <div>
                <h3 className="text-base font-bold text-geo-900">Active Watch Subscriptions</h3>
                <p className="text-xs text-geo-500">Currently monitored geographic perimeters</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-geo-100 text-geo-700 font-mono font-bold text-xs">
                {subscriptions.length} Areas
              </span>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="p-8 text-center text-xs text-geo-400">Loading subscriptions...</div>
              ) : subscriptions.length === 0 ? (
                <div className="p-8 rounded-xl bg-geo-50 border border-geo-200 text-center text-xs text-geo-500 space-y-1">
                  <MapPin className="w-6 h-6 text-geo-400 mx-auto" />
                  <p className="font-semibold text-geo-700">No active geographic subscriptions</p>
                  <p>Register your first watch area using the form to receive early warnings.</p>
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-geo-200 bg-geo-50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-geo-900">{sub.area_name}</span>
                        <span className="px-2 py-0.2 rounded-full font-bold bg-brand-100 text-brand-800 text-[10px]">
                          {sub.radius_km} km radius
                        </span>
                      </div>
                      <p className="text-geo-500 font-mono text-[11px]">
                        Center: {sub.latitude.toFixed(4)}&deg;N, {sub.longitude.toFixed(4)}&deg;E
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-geo-600 pt-1">
                        <span>Email: {sub.email_enabled ? 'Active' : 'Off'}</span>
                        <span>&bull;</span>
                        <span>Browser: {sub.browser_enabled ? 'Active' : 'Off'}</span>
                        <span>&bull;</span>
                        <span>SMS: {sub.sms_enabled ? 'Active' : 'Off'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Delete Subscription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
