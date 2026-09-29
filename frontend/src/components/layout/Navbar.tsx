import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Flame,
  LayoutDashboard,
  Search,
  Bell,
  BarChart3,
  Settings,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { api, API_BASE } from '../../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
<<<<<<< HEAD
  const [firmsConnected, setFirmsConnected] = useState<boolean>(true);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
=======
  const [criticalAlertsCount, setCriticalAlertsCount] = useState<number>(0);
>>>>>>> eabe1ca (Frontend Upadated)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const refreshAlertsCount = () => {
    api.getActiveAlertsCount().then((count) => {
      setActiveAlertsCount(count);
    }).catch(() => {
      setActiveAlertsCount(0);
    });
  };

  useEffect(() => {
    // Initial fetch on route change or mount
    refreshAlertsCount();

    api.getDashboardStats().then((stats) => {
<<<<<<< HEAD
      setFirmsConnected(stats.is_live_firms_connected);
    }).catch(() => {});
=======
      if (isMounted) {
        setCriticalAlertsCount(stats.critical_alerts_count);
      }
    }).catch(() => { });
>>>>>>> eabe1ca (Frontend Upadated)

    // 1. Listen for local alert state actions (e.g. acknowledge or resolve in AlertsPage)
    const handleLocalAlertUpdate = () => {
      refreshAlertsCount();
    };
    window.addEventListener('thermoscope:alerts_updated', handleLocalAlertUpdate);

    // 2. Real-Time SSE Event Stream for live multi-tab & server broadcast sync
    let es: EventSource | null = null;
    try {
      es = new EventSource(`${API_BASE}/events/stream`);
      const handleSseEvent = () => {
        // Reconcile real alert state from backend instead of naive +1
        refreshAlertsCount();
      };

      es.addEventListener('new_alert', handleSseEvent);
      es.addEventListener('alert_acknowledged', handleSseEvent);
      es.addEventListener('alert_resolved', handleSseEvent);
      es.addEventListener('alert_escalated', handleSseEvent);
      es.addEventListener('alert_assigned', handleSseEvent);
      es.addEventListener('incident_updated', handleSseEvent);

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          const ev = payload.event || payload.type;
          if (ev && ev !== 'ping' && ev !== 'connected') {
            refreshAlertsCount();
          }
        } catch {}
      };
    } catch (e) {
      console.warn('Navbar SSE listener unavailable', e);
    }

    return () => {
      window.removeEventListener('thermoscope:alerts_updated', handleLocalAlertUpdate);
      if (es) {
        es.close();
      }
    };
  }, []);

  const navLinks = [
    { name: 'Home', path: '/', icon: Flame },
    { name: 'Live Map', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Fire Explorer', path: '/fires', icon: Search },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: activeAlertsCount },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Awareness', path: '/settings', icon: Settings },
  ];

  const isLanding = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-white/95 ">
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
              <p className="text-[11px] text-geo-600 font-medium hidden sm:block">Industrial Thermal Intelligence</p>
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
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-geo-100/90 text-brand-700 font-semibold shadow-xs'
                      : 'text-geo-700 hover:text-geo-950 hover:bg-white/60'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-geo-500'}`} />
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

          {/* Right Action */}
          <div className="hidden lg:flex items-center gap-4">
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
              className="p-2 rounded-lg text-geo-700 hover:text-geo-950 hover:bg-white/70 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="relative z-20 md:hidden border-t border-geo-200 bg-white/95 backdrop-blur-md px-4 pt-2 pb-4 space-y-1 shadow-elevated">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-geo-100 text-brand-700 font-semibold' : 'text-geo-700 hover:bg-geo-50'
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
