import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { FireExplorerPage } from './pages/FireExplorerPage';
import { FireDetailPage } from './pages/FireDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-geo-50 text-geo-900 font-sans">
      {/* Persistent Global Navigation for inner application pages */}
      {!isLanding && <Navbar />}

      {/* Dynamic Page Routing */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/fires" element={<FireExplorerPage />} />
          <Route path="/fires/:id" element={<FireDetailPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      {/* Global Footer for operational pages */}
      {!isLanding && (
        <footer className="border-t border-geo-200 bg-white py-8 text-xs text-geo-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-medium">
              <span className="font-bold text-geo-900">ThermoScope AI</span>
              <span>&bull;</span>
              <span>Industrial Thermal Intelligence &amp; Early Warning System</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-geo-100 font-mono text-geo-700">SIH PS ID 26162</span>
              <span>NASA FIRMS &bull; OpenStreetMap &bull; PostGIS &bull; Scikit-Learn</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;
