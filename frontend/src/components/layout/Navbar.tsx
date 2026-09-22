import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Flame,
  LayoutDashboard,
  Search,
  Bell,
  BarChart3,
  Settings,
  ShieldCheck,
  Radio,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { api } from '../../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [firmsConnected, setFirmsConnected] = useState<boolean>(true);
  const [criticalAlertsCount, setCriticalAlertsCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    api.getDashboardStats().then((stats) => {
      if (isMounted) {
        setFirmsConnected(stats.is_live_firms_connected);
        setCriticalAlertsCount(stats.critical_alerts_count);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/', icon: Flame },
    { name: 'Live Map', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Fire Explorer', path: '/fires', icon: Search },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: criticalAlertsCount },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Awareness', path: '/settings', icon: Settings },
    { name: 'System', path: '/admin', icon: ShieldCheck },
  ];

  const isLanding = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-geo-200 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/20 text-white group-hover:scale-105 transition-transform duration-200">
              <Flame className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-geo-900 tracking-tight">ThermoScope</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  GeoAI
                </span>
              </div>
              <p className="text-[11px] text-geo-500 font-medium hidden sm:block">Industrial Thermal Intelligence</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-geo-100 text-brand-700 font-semibold'
                      : 'text-geo-600 hover:text-geo-900 hover:bg-geo-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-geo-400'}`} />
                  <span>{link.name}</span>
                  {link.badge && link.badge > 0 ? (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-severity-critical text-white">
                      {link.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Telemetry Pill */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-geo-100 border border-geo-200 text-xs text-geo-700 font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>NASA FIRMS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            {isLanding && (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all hover:shadow-lg"
              >
                <span>Live Dashboard</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-geo-600 hover:text-geo-900 hover:bg-geo-100 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-geo-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-elevated">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-geo-100 text-brand-700 font-semibold' : 'text-geo-700 hover:bg-geo-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-geo-500" />
                  <span>{link.name}</span>
                </div>
                {link.badge && link.badge > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-severity-critical text-white">
                    {link.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
