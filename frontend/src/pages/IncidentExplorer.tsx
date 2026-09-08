import React, { useState } from 'react';
import { ThermalAnomaly } from '../types';
import { 
  Search, 
  Download, 
  ArrowUpDown, 
  Flame, 
  ShieldAlert, 
  ExternalLink,
  Filter
} from 'lucide-react';

interface IncidentExplorerProps {
  anomalies: ThermalAnomaly[];
  onSelectAnomaly: (id: number) => void;
}

export const IncidentExplorer: React.FC<IncidentExplorerProps> = ({
  anomalies,
  onSelectAnomaly
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [sortBy, setSortBy] = useState<'frp' | 'risk' | 'timestamp'>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = anomalies.filter(anom => {
    if (selectedClass !== 'ALL' && anom.classification_class !== selectedClass) return false;
    if (selectedSeverity !== 'ALL' && anom.risk_level !== selectedSeverity) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        anom.event_id.toLowerCase().includes(q) ||
        anom.facility_name.toLowerCase().includes(q) ||
        anom.classification_class.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comp = 0;
    if (sortBy === 'frp') comp = a.frp - b.frp;
    else if (sortBy === 'risk') comp = a.risk_score - b.risk_score;
    else comp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    return sortAsc ? comp : -comp;
  });

  const exportCSV = () => {
    const headers = ['Event ID', 'Latitude', 'Longitude', 'Timestamp', 'Satellite', 'FRP (MW)', 'Classification', 'Confidence', 'Risk Level', 'Risk Score', 'Facility'];
    const rows = sorted.map(a => [
      a.event_id,
      a.latitude,
      a.longitude,
      a.timestamp,
      a.satellite,
      a.frp,
      `"${a.classification_class}"`,
      (a.classification_confidence * 100).toFixed(1) + '%',
      a.risk_level,
      a.risk_score,
      `"${a.facility_name}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `thermoscope_incidents_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (level: string) => {
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
    <div className="p-6 bg-[#080d1a] min-h-[calc(100vh-105px)] space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Thermal Incident &amp; Anomaly Explorer
          </h1>
          <p className="text-xs text-slate-400">
            Multi-spectral satellite detections cross-referenced with industrial GIS perimeters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-[#0f172a] rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, facility, class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 pl-8 pr-3 py-1.5 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 w-56"
            />
          </div>

          {/* Classification */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded text-xs text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="ALL">All Classifications</option>
            <option value="Potential Industrial Fire">Potential Industrial Fire</option>
            <option value="Routine / Persistent Industrial Thermal Source">Routine / Persistent Industrial Thermal Source</option>
            <option value="Gas Flare / Combustion Source">Gas Flare / Combustion Source</option>
            <option value="Agricultural / Biomass Burn">Agricultural / Biomass Burn</option>
            <option value="Vegetation / Wildfire">Vegetation / Wildfire</option>
            <option value="Mining-Related Thermal Activity">Mining-Related Thermal Activity</option>
          </select>

          {/* Severity */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded text-xs text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="timestamp">Timestamp</option>
            <option value="frp">Radiative Power (FRP)</option>
            <option value="risk">Risk Score</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 hover:text-white"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Anomaly Table */}
      <div className="bg-[#0f172a] rounded-lg border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#131e36] text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="p-3">Event ID</th>
                <th className="p-3">Coordinates</th>
                <th className="p-3">Observation Time</th>
                <th className="p-3">FRP (MW)</th>
                <th className="p-3">Assessed Classification</th>
                <th className="p-3">AI Confidence</th>
                <th className="p-3">Investigation Risk</th>
                <th className="p-3">Nearest Facility Context</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No thermal anomalies match the selected criteria.
                  </td>
                </tr>
              ) : (
                sorted.map((anom) => {
                  const confPct = Math.round(anom.classification_confidence * 100);
                  const isSim = anom.is_simulated;

                  return (
                    <tr
                      key={anom.id}
                      onClick={() => onSelectAnomaly(anom.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition group"
                    >
                      <td className="p-3 font-mono font-bold text-white flex items-center gap-1.5">
                        {anom.event_id}
                        {isSim && (
                          <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] uppercase font-sans">
                            Sim
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {anom.latitude.toFixed(4)}&deg;, {anom.longitude.toFixed(4)}&deg;
                      </td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">
                        {new Date(anom.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        <span className="ml-1 text-[10px] text-slate-500">({anom.daynight === 'N' ? 'Night' : 'Day'})</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-orange-400">
                        {anom.frp.toFixed(1)} MW
                      </td>
                      <td className="p-3 font-semibold text-slate-200">
                        {anom.classification_class}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-emerald-400 rounded-full"
                              style={{ width: `${confPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-300">{confPct}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getSeverityBadge(anom.risk_level)}`}>
                          {anom.risk_level} ({anom.risk_score.toFixed(0)})
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 font-medium truncate max-w-[200px]">
                        {anom.facility_name}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAnomaly(anom.id);
                          }}
                          className="px-2.5 py-1 bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/40 rounded text-xs font-bold transition inline-flex items-center gap-1"
                        >
                          Dossier
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
