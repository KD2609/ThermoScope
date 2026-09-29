import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer 
      className="relative border-t border-slate-200/90 text-slate-700 bg-white overflow-hidden"
    >

      {/* Main Content Container - Compact Desktop Target 320px - 410px */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 sm:pt-12 sm:pb-8 flex flex-col justify-between min-h-[320px] md:min-h-[360px] lg:max-h-[420px]">
        
        {/* 3-Column Layout: Brand | Product | Connect */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Column 1: Brand / Tagline / Short Description */}
          <div className="md:col-span-6 lg:col-span-5 space-y-2.5">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 tracking-tight font-sans">
                  ThermoScope
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 leading-none">
                  GeoAI
                </span>
              </div>
            </Link>

            <p className="text-xs font-semibold text-slate-700 font-mono tracking-wide">
              Industrial Thermal Intelligence &bull; GeoAI
            </p>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
              Satellite-powered intelligence for detecting, classifying and investigating industrial thermal anomalies.
            </p>
          </div>

          {/* Column 2: Product Navigation */}
          <div className="md:col-span-3 lg:col-span-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              Product
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm font-medium">
              <li>
                <a href="#home" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#challenge" className="text-slate-600 hover:text-slate-950 transition-colors">
                  The Challenge
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-slate-600 hover:text-slate-950 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#impact" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Platform Impact
                </a>
              </li>
              <li>
                <a href="#monitoring" className="text-slate-600 hover:text-slate-950 transition-colors">
                  Live Monitoring
                </a>
              </li>
              <li>
                <Link to="/dashboard" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Live Map
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Connect / Socials */}
          <div className="md:col-span-3 lg:col-span-3 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              Connect
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>
                <a
                  href="https://github.com/Sammmyyyyyyy/ThermoScope"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-950 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current shrink-0 text-slate-700" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                  </svg>
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current shrink-0 text-[#0077b5]" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.27a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z"/>
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </li>
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X Twitter"
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-950 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current shrink-0 text-slate-800" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>X / Twitter</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Bar with subtle divider */}
        <div className="mt-8 pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500">
          <div>
            &copy; 2026 ThermoScope &bull; Industrial Thermal Intelligence Platform
          </div>
          <div className="text-slate-500 text-[11px] sm:text-xs font-mono">
            NASA FIRMS &bull; VIIRS &bull; OpenStreetMap &bull; PostGIS &bull; Scikit-Learn
          </div>
        </div>

      </div>
    </footer>
  );
};

