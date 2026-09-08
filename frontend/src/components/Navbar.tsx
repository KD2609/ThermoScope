import React from 'react';
import { 
  Flame, 
  Map, 
  ListFilter, 
  Building2, 
  Bell, 
  BarChart3, 
  Activity, 
  Play, 
  Presentation, 
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemMode: 'LIVE' | 'DEMO';
  onToggleMode: () => void;
  onRunKeyScenario: () => void;
  presentationMode: boolean;
  setPresentationMode: (val: boolean) => void;
  currentRole: string;
  setCurrentRole: (role: string) => void;
  criticalAlertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  systemMode,
  onToggleMode,
  onRunKeyScenario,
  presentationMode,
  setPresentationMode,
  currentRole,
  setCurrentRole,
  criticalAlertsCount
}) => {
  const navItems = [
    { id: 'command', label: 'Command Center', icon: Flame },
    { id: 'map', label: 'Thermal GIS Map', icon: Map },
    { id: 'incidents', label: 'Incident Explorer', icon: ListFilter },
    { id: 'assets', label: 'Asset Intelligence', icon: Building2 },
    { id: 'alerts', label: 'Alert Center', icon: Bell, badge: criticalAlertsCount },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'health', label: 'System Health', icon: Activity },
  ];

  if (presentationMode) {
    return (
      <header className="bg-[#0b1222]/95 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-600/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-lg font-black tracking-wider text-white flex items-center gap-2">
              THERMOSCOPE AI <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">PRESENTATION MODE</span>
            </div>
            <div className="text-xs text-slate-400">NTRO SIH PS ID 26162 &bull; Industrial Thermal Intelligence</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunKeyScenario}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-lg text-sm shadow-lg shadow-orange-900/30 flex items-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            Run SIH Key Scenario
          </button>
          <button
            onClick={() => setPresentationMode(false)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
          >
            Exit Presentation Mode
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-[#080d1a] border-b border-slate-800/80 sticky top-0 z-50">
      {/* Top Telemetry Strip */}
      <div className="bg-[#0b1222] px-4 py-1 border-b border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
            NTRO SIH 26162
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Sensors: <span className="text-slate-200">VIIRS NOAA-21 &bull; NOAA-20 &bull; MODIS</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Spatial Anchor: <span className="text-slate-200">OSM Industrial Registry (India)</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <button
            onClick={onToggleMode}
            className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition flex items-center gap-1.5 ${
              systemMode === 'LIVE'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}
            title="Click to toggle between LIVE and DEMO mode"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${systemMode === 'LIVE' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            MODE: {systemMode} {systemMode === 'DEMO' ? '(OFFLINE READY)' : ''}
          </button>

          {/* Role Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
            <UserCheck className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">ROLE:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ANALYST" className="bg-slate-900 text-slate-200">ANALYST</option>
              <option value="ADMIN" className="bg-slate-900 text-slate-200">ADMIN</option>
              <option value="RESPONDER" className="bg-slate-900 text-slate-200">RESPONDER</option>
              <option value="VIEWER" className="bg-slate-900 text-slate-200">VIEWER</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('command')}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-md shadow-orange-950/20">
            <Flame className="w-6 h-6 animate-thermal-pulse" />
          </div>
          <div>
            <div className="text-lg font-black tracking-wider text-white flex items-center gap-2">
              THERMOSCOPE <span className="text-orange-500">AI</span>
            </div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Industrial Thermal Intelligence &bull; Early Warning
            </div>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 relative ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRunKeyScenario}
            className="px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-lg text-xs shadow-md shadow-orange-900/30 flex items-center gap-1.5 transition"
            title="Execute the end-to-end SIH Demonstration Scenario"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Run SIH Key Scenario
          </button>

          <button
            onClick={() => setPresentationMode(true)}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs transition"
            title="Toggle SIH Presentation Mode"
          >
            <Presentation className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
