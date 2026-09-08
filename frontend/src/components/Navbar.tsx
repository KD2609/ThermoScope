import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  Menu, 
  X,
  Play,
  Presentation
} from 'lucide-react';
import navbarBgImage from '../assets/images/navbar-bg.png';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  interface NavItem {
    id: string;
    label: string;
    icon: string;
    badge?: number;
  }

  // EXACT 5 Primary Desktop Navigation Destinations
  const navItems: NavItem[] = [
    { id: 'command', label: 'Command Center', icon: 'local_fire_department' },
    { id: 'map', label: 'Thermal Map', icon: 'map' },
    { id: 'incidents', label: 'Incidents', icon: 'fact_check' },
    { id: 'assets', label: 'Assets', icon: 'factory' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  ];

  // Mobile drawer comprehensive list
  const mobileNavItems: NavItem[] = [
    ...navItems,
    { id: 'alerts', label: 'Alert Center', icon: 'notifications', badge: criticalAlertsCount },
    { id: 'health', label: 'System Health', icon: 'dns' },
  ];

  const roles = ['ANALYST', 'ADMIN', 'RESPONDER', 'VIEWER'];

  if (presentationMode) {
    return (
      <header className="relative h-[72px] border-b border-[rgba(210,220,230,0.75)] sticky top-0 z-50 select-none overflow-hidden">
        {/* Dedicated Navbar Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${navbarBgImage})` }}
        />
        {/* Subtle Translucent White Frosting */}
        <div 
          className="absolute inset-0 bg-white/76 backdrop-blur-[14px] pointer-events-none"
        />

        <div className="relative z-10 max-w-[1440px] mx-auto w-full px-4 sm:px-6 xl:px-8 h-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#EAF2FF] border border-[#DCE5EC] flex items-center justify-center text-[#4B82D8]">
              <span className="material-symbols-outlined text-[17px]">local_fire_department</span>
            </div>
            <div>
              <div className="text-[16px] font-bold text-[#17324D] flex items-center gap-2 font-display tracking-tight leading-snug">
                <span>ThermoScope</span>
                <span className="text-[#4B82D8]">AI</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF2FF] text-[#4B82D8] font-medium border border-[#4B82D8]/20">
                  PRESENTATION MODE
                </span>
              </div>
              <div className="text-[10px] text-[#61758A] font-normal leading-tight">
                NTRO Problem Statement 26162 &bull; Industrial Thermal Intelligence
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRunKeyScenario}
              className="h-[36px] px-3 bg-[#4B82D8] hover:bg-[#3B72C8] text-white font-medium rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run SIH Key Scenario</span>
            </button>
            <button
              onClick={() => setPresentationMode(false)}
              className="h-[36px] px-3 bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#61758A] hover:text-[#17324D] rounded-xl text-xs font-medium transition"
            >
              Exit Presentation
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="relative h-[72px] border-b border-[rgba(210,220,230,0.75)] sticky top-0 z-50 select-none overflow-hidden transition-all duration-200">
      {/* Dedicated Navbar Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${navbarBgImage})` }}
      />
      {/* Subtle Translucent White Frosting */}
      <div 
        className="absolute inset-0 bg-white/76 backdrop-blur-[14px] pointer-events-none"
      />

      <div className="relative z-10 max-w-[1440px] mx-auto w-full px-4 sm:px-6 xl:px-8 h-full flex items-center justify-between gap-2 lg:gap-4 xl:gap-6">
        
        {/* ============================================================ */}
        {/* 1. LEFT GROUP: BRAND AREA                                    */}
        {/* ============================================================ */}
        <div 
          className="shrink-0 flex items-center gap-2.5 cursor-pointer group"
          onClick={() => setActiveTab('command')}
          title="ThermoScope AI &bull; Command Center"
        >
          {/* Compact Logo Emblem */}
          <div className="w-8 h-8 xl:w-8.5 xl:h-8.5 rounded-xl bg-[#EAF2FF] border border-[#DCE5EC] flex items-center justify-center text-[#3978D8] group-hover:border-[#3978D8]/40 transition-all duration-150 shrink-0 shadow-subtle">
            <span className="material-symbols-outlined text-[17px] leading-none">
              local_fire_department
            </span>
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="text-[15.5px] xl:text-[16.5px] font-bold text-[#102A43] font-display tracking-tight leading-snug flex items-center gap-1">
              <span>ThermoScope</span>
              <span className="text-[#3978D8]">AI</span>
            </div>
            <div className="text-[10px] xl:text-[10.5px] font-normal text-[#627D98] tracking-normal leading-tight truncate">
              From Thermal Anomaly to Action
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. CENTER GROUP: PRIMARY NAVIGATION (5 Links Only)           */}
        {/* ============================================================ */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 justify-center min-w-0">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`h-[38px] xl:h-[40px] px-2.5 xl:px-3 rounded-[10px] text-[13px] xl:text-[13.5px] font-medium font-sans flex items-center gap-1.5 transition-all duration-150 shrink-0 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#EDF4FF] text-[#3978D8] font-semibold shadow-xs'
                    : 'text-[#486581] hover:text-[#102A43] hover:bg-[#F0F4F8]/70'
                }`}
              >
                <span className={`material-symbols-outlined text-[17px] xl:text-[18px] leading-none ${
                  isActive ? 'text-[#3978D8]' : 'text-[#627D98]'
                }`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ============================================================ */}
        {/* 3. RIGHT GROUP: SEARCH + ALERTS + MODE + ANALYST              */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 xl:gap-2.5 shrink-0">
          {/* Compact Search Field (170-240px width, 40-42px height) */}
          <div className="relative hidden md:block w-[160px] lg:w-[185px] xl:w-[220px] 2xl:w-[240px] shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8292A2] pointer-events-none" />
            <input
              type="text"
              placeholder="Search anomalies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setActiveTab('incidents');
                }
              }}
              className="h-[40px] xl:h-[42px] w-full bg-[#F0F4F8]/70 hover:bg-[#F0F4F8] focus:bg-white border border-[#DCE5EC] focus:border-[#4B82D8] focus:ring-2 focus:ring-[#4B82D8]/15 rounded-xl pl-8.5 pr-3 text-[12.5px] text-[#17324D] placeholder-[#8292A2] outline-none transition-all duration-150 font-sans"
            />
          </div>

          {/* Alert Center Compact Bell Control (40-42px control, 20px icon) */}
          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative h-[40px] w-[40px] xl:h-[42px] xl:w-[42px] rounded-xl border flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-[#EDF4FF] text-[#3978D8] border-[#3978D8]/40 shadow-xs'
                : 'bg-[#F0F4F8]/70 hover:bg-[#EAEFF5] text-[#486581] hover:text-[#102A43] border-[#DCE5EC]'
            }`}
            title={`Alert Center${criticalAlertsCount > 0 ? ` (${criticalAlertsCount} critical)` : ''}`}
            aria-label="Alert Center"
          >
            <span className="material-symbols-outlined text-[20px] leading-none">
              notifications
            </span>
            {criticalAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E53E3E] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                {criticalAlertsCount}
              </span>
            )}
          </button>

          {/* Mode Control (Compact Status Button: 98-110px, Height: 40-42px) */}
          <button
            onClick={onToggleMode}
            className={`h-[40px] xl:h-[42px] px-2.5 w-[98px] sm:w-[105px] rounded-xl border text-[11.5px] font-medium font-sans transition-all duration-150 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
              systemMode === 'LIVE'
                ? 'bg-[#E8F5EF] text-[#065F46] border-[#A7F3D0] hover:bg-[#DCF2E7]'
                : 'bg-[#FFF7DD] text-[#8C6A18] border-[#F0D98A] hover:bg-[#FEEDC2]'
            }`}
            title="Click to switch between LIVE NASA FIRMS and DEMO offline dataset"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              systemMode === 'LIVE' ? 'bg-[#10B981] animate-pulse' : 'bg-[#D99A14]'
            }`} />
            <span className="tracking-tight whitespace-nowrap">
              MODE: <span className="font-semibold">{systemMode}</span>
            </span>
          </button>

          {/* Analyst Control (Target: 105-120px, Height: 40-42px) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="h-[40px] xl:h-[42px] px-2.5 sm:px-3 w-[105px] xl:w-[115px] bg-[#F0F4F8]/70 hover:bg-[#EAEFF5] border border-[#DCE5EC] rounded-xl text-[12px] text-[#17324D] font-medium flex items-center justify-between transition-all duration-150 font-sans cursor-pointer"
              title="Analyst Menu & System Settings"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-[17px] text-[#61758A] leading-none shrink-0">
                  person
                </span>
                <span className="font-semibold text-[#17324D] truncate">{currentRole}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#61758A] shrink-0 transition-transform duration-150 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Role Dropdown Menu with System Health */}
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-[#DCE5EC] rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in slide-in-from-top-1 text-xs">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8292A2] uppercase tracking-wider">
                  Operational Role
                </div>
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setCurrentRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 text-left rounded-lg transition font-medium flex items-center justify-between ${
                      currentRole === r
                        ? 'bg-[#EDF4FF] text-[#3978D8] font-bold'
                        : 'text-[#61758A] hover:bg-[#F0F4F8] hover:text-[#17324D]'
                    }`}
                  >
                    <span>{r}</span>
                    {currentRole === r && (
                      <span className="material-symbols-outlined text-[14px] text-[#3978D8]">check</span>
                    )}
                  </button>
                ))}

                <div className="my-1.5 border-t border-[#DCE5EC]" />

                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8292A2] uppercase tracking-wider">
                  Operations & Telemetry
                </div>

                {/* System Health Destination */}
                <button
                  onClick={() => {
                    setActiveTab('health');
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 text-left rounded-lg transition font-medium flex items-center gap-2 ${
                    activeTab === 'health'
                      ? 'bg-[#EDF4FF] text-[#3978D8] font-bold'
                      : 'text-[#486581] hover:bg-[#F0F4F8] hover:text-[#102A43]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-[#3978D8]">dns</span>
                  <span>System Health</span>
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10B981]" title="Sensors Online" />
                </button>

                {/* Presentation Mode */}
                <button
                  onClick={() => {
                    setPresentationMode(true);
                    setRoleDropdownOpen(false);
                  }}
                  className="w-full px-2.5 py-2 text-left rounded-lg transition font-medium flex items-center gap-2 text-[#486581] hover:bg-[#F0F4F8] hover:text-[#102A43]"
                >
                  <Presentation className="w-3.5 h-3.5 text-[#61758A]" />
                  <span>Presentation Mode</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-[40px] w-[40px] rounded-xl border border-[#DCE5EC] bg-[#F0F4F8]/70 hover:bg-[#EAEFF5] text-[#17324D] flex items-center justify-center transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MOBILE / TABLET COLLAPSED DRAWER MENU                     */}
      {/* ============================================================ */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-lg border-b border-[#DCE5EC] px-6 py-4 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          {/* Mobile Search */}
          <div className="relative md:hidden mb-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8292A2]" />
            <input
              type="text"
              placeholder="Search anomalies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setActiveTab('incidents');
                  setMobileMenuOpen(false);
                }
              }}
              className="h-[40px] w-full bg-[#F0F4F8] border border-[#DCE5EC] rounded-xl pl-9 pr-3 text-[13px] text-[#17324D] outline-none font-sans"
            />
          </div>

          {/* Mobile Navigation List */}
          <div className="grid grid-cols-2 gap-1.5">
            {mobileNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`h-[42px] px-3 rounded-xl text-[13px] font-medium flex items-center gap-2 transition ${
                    isActive
                      ? 'bg-[#EDF4FF] text-[#3978D8] font-bold'
                      : 'text-[#61758A] hover:bg-[#F0F4F8] hover:text-[#17324D]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-auto px-1.5 py-0.2 rounded-full bg-[#FEF2F2] text-[#991B1B] text-[10px] font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* SIH Key Scenario Mobile Action */}
          <div className="pt-2 border-t border-[#DCE5EC] flex items-center justify-between">
            <button
              onClick={() => {
                onRunKeyScenario();
                setMobileMenuOpen(false);
              }}
              className="h-[38px] px-4 bg-[#4B82D8] hover:bg-[#3B72C8] text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run SIH Key Scenario</span>
            </button>
            <button
              onClick={() => {
                setPresentationMode(true);
                setRoleDropdownOpen(false);
                setMobileMenuOpen(false);
              }}
              className="h-[38px] px-3 bg-[#F0F4F8] text-[#61758A] hover:text-[#17324D] rounded-xl text-xs font-medium transition"
            >
              Presentation
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

