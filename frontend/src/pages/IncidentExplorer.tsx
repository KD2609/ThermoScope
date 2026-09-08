import React, { useState, useMemo } from 'react';
import { ThermalAnomaly } from '../types';
import { GlassCard } from '../components/ui/GlassCard';
import { RiskBadge } from '../components/ui/RiskBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SectionHeader } from '../components/ui/SectionHeader';
import { 
  Search, 
  Download, 
  ArrowUpDown, 
  Flame, 
  ExternalLink, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  X,
  Eye,
  FileCheck
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
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [minConfidence, setMinConfidence] = useState(0);
  const [sortBy, setSortBy] = useState<'frp' | 'risk' | 'timestamp'>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return anomalies.filter(anom => {
      if (selectedClass !== 'ALL' && anom.classification_class !== selectedClass) return false;
      if (selectedSeverity !== 'ALL' && anom.risk_level !== selectedSeverity) return false;
      if (selectedStatus !== 'ALL' && anom.processing_status !== selectedStatus) return false;
      if (anom.classification_confidence * 100 < minConfidence) return false;

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
  }, [anomalies, selectedClass, selectedSeverity, selectedStatus, minConfidence, searchTerm]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comp = 0;
      if (sortBy === 'frp') comp = a.frp - b.frp;
      else if (sortBy === 'risk') comp = a.risk_score - b.risk_score;
      else comp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortAsc ? comp : -comp;
    });
  }, [filtered, sortBy, sortAsc]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const exportCSV = () => {
    const headers = ['Event ID', 'Latitude', 'Longitude', 'Timestamp', 'Satellite', 'FRP (MW)', 'Classification', 'Confidence', 'Risk Level', 'Risk Score', 'Facility', 'Status'];
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
      `"${a.facility_name}"`,
      a.processing_status || 'NEW'
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

  return (
    <div className="py-5 content-container w-full space-y-4 min-h-[calc(100vh-72px)]">
      {/* Header & Export Action */}
      <SectionHeader
        title="Incident Explorer"
        subtitle="Search, filter and investigate detected thermal events across Indian industrial and ecological zones."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EEF4FF] text-[#2F6FED] border border-[#BFDBFE]">
            {filtered.length} Filtered Events
          </span>
        }
        actions={
          <button
            onClick={exportCSV}
            className="px-3.5 py-1.5 bg-white hover:bg-[#F4F7FA] text-[#102A43] text-xs rounded-xl border border-[#D9E2EA] font-semibold flex items-center gap-1.5 shadow-subtle transition"
          >
            <Download className="w-3.5 h-3.5 text-[#52677D]" />
            <span>Export CSV</span>
          </button>
        }
      />

      {/* Filter Toolbar Card */}
      <GlassCard variant="secondary" padding="sm" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined text-[16px] absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7B8D9D]">search</span>
              <input
                type="text"
                placeholder="Search event ID, facility, class..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 pl-8 pr-7 py-1.5 rounded-lg text-xs text-[#17324D] placeholder-[#7B8D9D] focus:outline-none focus:border-[#3B82F6] focus:bg-white w-60 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7B8D9D] hover:text-[#17324D]"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* Classification */}
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 px-2.5 py-1.5 rounded-lg text-xs text-[#17324D] focus:outline-none focus:border-[#3B82F6] cursor-pointer"
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
              onChange={(e) => {
                setSelectedSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 px-2.5 py-1.5 rounded-lg text-xs text-[#17324D] focus:outline-none focus:border-[#3B82F6] cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Min Confidence Slider */}
            <div className="flex items-center gap-2 pl-2">
              <span className="text-[#61758A] text-[11px]">Min Conf:</span>
              <input
                type="range"
                min={0}
                max={90}
                step={10}
                value={minConfidence}
                onChange={(e) => {
                  setMinConfidence(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-20 accent-[#3B82F6] cursor-pointer"
              />
              <span className="font-mono text-[11px] font-semibold text-[#17324D]">{minConfidence}%</span>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[#61758A] text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 px-2 py-1 rounded-lg text-xs text-[#17324D] focus:outline-none cursor-pointer"
            >
              <option value="timestamp">Observation Time</option>
              <option value="frp">Radiative Power (FRP)</option>
              <option value="risk">Risk Score</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1.5 bg-[#EAF3FB]/60 border border-[#CDDCE8]/65 rounded-lg text-[#61758A] hover:text-[#17324D] transition"
              title="Toggle sort direction"
            >
              <span className="material-symbols-outlined text-[15px]">swap_vert</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Main Table Card */}
      <GlassCard variant="dense" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E8F0F7]/75 text-[#61758A] font-bold border-b border-[#CDDCE8]/65 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Event ID</th>
                <th className="py-3.5 px-4">Facility / Location</th>
                <th className="py-3.5 px-4">Assessed Classification</th>
                <th className="py-3.5 px-4">Investigation Risk</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">FRP (MW)</th>
                <th className="py-3.5 px-4">Observation Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E2EA]/70">
              {pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[#6B7C8F]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Flame className="w-6 h-6 text-[#9FB3C8]" />
                      <span className="font-semibold text-[#102A43]">No thermal anomalies match the selected criteria</span>
                      <span className="text-xs text-[#6B7C8F]">Try adjusting search keywords or clearing active filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedItems.map((anom) => {
                  const confPct = Math.round(anom.classification_confidence * 100);

                  return (
                    <tr
                      key={anom.id}
                      onClick={() => onSelectAnomaly(anom.id)}
                      className="hover:bg-[#EEF4FF]/50 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#102A43]">
                        {anom.event_id}
                        {anom.is_simulated && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-[#EEF4FF] text-[#2F6FED] border border-[#BFDBFE] font-sans uppercase">
                            Sim
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#102A43] truncate max-w-[200px]">
                          {anom.facility_name}
                        </div>
                        <div className="text-[11px] text-[#6B7C8F] font-mono">
                          {anom.latitude.toFixed(3)}&deg;N, {anom.longitude.toFixed(3)}&deg;E
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-[#102A43]">
                        {anom.classification_class}
                      </td>

                      <td className="py-3.5 px-4">
                        <RiskBadge level={anom.risk_level} score={anom.risk_score} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-[#EEF3F7] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#2F6FED] rounded-full"
                              style={{ width: `${confPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-[#52677D]">
                            {confPct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#B91C1C]">
                        {anom.frp.toFixed(1)} MW
                      </td>

                      <td className="py-3.5 px-4 text-[#52677D] whitespace-nowrap">
                        {new Date(anom.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        {new Date(anom.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={anom.processing_status || 'NEW'} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectAnomaly(anom.id)}
                            className="btn-card-secondary !text-[11px] !py-1 !px-2.5"
                            title="Inspect Intelligence Dossier"
                          >
                            <span className="material-symbols-outlined text-[14px]">assignment</span>
                            <span>Investigate</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {sorted.length > pageSize && (
          <div className="px-4 py-3 bg-[#E8F0F7]/40 border-t border-[#CDDCE8]/65 flex items-center justify-between text-xs text-[#61758A]">
            <div>
              Showing <b className="text-[#17324D]">{(currentPage - 1) * pageSize + 1}</b> to <b className="text-[#17324D]">{Math.min(currentPage * pageSize, sorted.length)}</b> of <b className="text-[#17324D]">{sorted.length}</b> events
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1 rounded-lg border border-[#CDDCE8]/65 bg-white/60 hover:bg-white disabled:opacity-40 transition"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="px-2.5 py-1 font-semibold text-[#17324D]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 rounded-lg border border-[#CDDCE8]/65 bg-white/60 hover:bg-white disabled:opacity-40 transition"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
