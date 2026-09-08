import React from 'react';

interface IndustrialLandscapeProps {
  variant?: 'hero' | 'header' | 'subtle' | 'compact';
  className?: string;
}

export const IndustrialLandscape: React.FC<IndustrialLandscapeProps> = ({
  variant = 'hero',
  className = ''
}) => {
  if (variant === 'compact') {
    return (
      <div className={`pointer-events-none select-none overflow-hidden ${className}`}>
        <svg
          viewBox="0 0 800 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover opacity-25"
          preserveAspectRatio="none"
        >
          {/* Subtle Mountain Silhouette */}
          <path
            d="M0 160 L0 120 Q120 70 240 100 T480 80 T720 110 L800 90 L800 160 Z"
            fill="url(#compactMountainGrad)"
          />
          {/* Refinery Silhouettes */}
          <rect x="140" y="70" width="14" height="70" rx="2" fill="#6687A8" fillOpacity="0.4" />
          <rect x="160" y="85" width="22" height="55" rx="2" fill="#52677D" fillOpacity="0.3" />
          <line x1="147" y1="50" x2="147" y2="70" stroke="#2F6FED" strokeWidth="1.5" strokeOpacity="0.5" />
          
          <rect x="380" y="60" width="18" height="80" rx="3" fill="#6687A8" fillOpacity="0.35" />
          <rect x="404" y="80" width="28" height="60" rx="2" fill="#52677D" fillOpacity="0.3" />
          <line x1="389" y1="40" x2="389" y2="60" stroke="#3BAA91" strokeWidth="1.5" strokeOpacity="0.5" />
          
          <rect x="620" y="75" width="16" height="65" rx="2" fill="#6687A8" fillOpacity="0.3" />
          {/* Topographic Lines */}
          <path
            d="M0 140 Q200 130 400 142 T800 135"
            stroke="#6687A8"
            strokeWidth="0.75"
            strokeOpacity="0.3"
            strokeDasharray="4 4"
          />
          <defs>
            <linearGradient id="compactMountainGrad" x1="400" y1="60" x2="400" y2="160" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9FB3C8" stopOpacity="0.25" />
              <stop offset="1" stopColor="#E8EEF3" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`pointer-events-none select-none overflow-hidden absolute inset-0 ${className}`}>
        <svg
          viewBox="0 0 1200 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover opacity-20"
          preserveAspectRatio="none"
        >
          {/* Distant Hills */}
          <path
            d="M0 240 L0 160 C150 110 300 180 500 130 C700 80 850 170 1050 120 L1200 150 L1200 240 Z"
            fill="#CBD5E1"
            fillOpacity="0.35"
          />
          {/* Industrial Towers */}
          <g opacity="0.45">
            <rect x="750" y="110" width="16" height="110" rx="3" fill="#64748B" />
            <line x1="758" y1="80" x2="758" y2="110" stroke="#475569" strokeWidth="2" />
            <rect x="772" y="130" width="36" height="90" rx="4" fill="#94A3B8" />
            <rect x="814" y="145" width="24" height="75" rx="3" fill="#64748B" />
            <rect x="880" y="100" width="12" height="120" rx="2" fill="#475569" />
            <circle cx="886" cy="95" r="4" fill="#3BAA91" />
          </g>
          {/* Orbit Contour Line */}
          <path
            d="M100 80 C400 30 800 40 1150 90"
            stroke="#2F6FED"
            strokeWidth="1.2"
            strokeOpacity="0.3"
            strokeDasharray="6 6"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1440 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="skyAtmosphere" x1="720" y1="0" x2="720" y2="480" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="0.4" stopColor="#EEF3F7" stopOpacity="0.6" />
            <stop offset="0.85" stopColor="#E2E8F0" stopOpacity="0.4" />
            <stop offset="1" stopColor="#CBD5E1" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="mountainFar" x1="720" y1="120" x2="720" y2="380" gradientUnits="userSpaceOnUse">
            <stop stopColor="#94A3B8" stopOpacity="0.28" />
            <stop offset="1" stopColor="#E2E8F0" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="mountainMid" x1="720" y1="180" x2="720" y2="420" gradientUnits="userSpaceOnUse">
            <stop stopColor="#64748B" stopOpacity="0.35" />
            <stop offset="1" stopColor="#CBD5E1" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="waterGrad" x1="720" y1="360" x2="720" y2="480" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93C5FD" stopOpacity="0.25" />
            <stop offset="1" stopColor="#60A5FA" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="satelliteBeam" x1="1240" y1="40" x2="1000" y2="340" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2F6FED" stopOpacity="0.15" />
            <stop offset="1" stopColor="#3BAA91" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Atmospheric Sky Backdrop */}
        <rect width="1440" height="480" fill="url(#skyAtmosphere)" />

        {/* Satellite Imagery / Sensor Orbit Track */}
        <g opacity="0.6">
          <ellipse cx="720" cy="80" rx="680" ry="140" stroke="#2F6FED" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="8 6" />
          <ellipse cx="720" cy="110" rx="720" ry="160" stroke="#3BAA91" strokeWidth="0.75" strokeOpacity="0.15" strokeDasharray="12 8" />
          
          {/* Subtle Satellite Vector */}
          <g transform="translate(1220, 48)">
            <rect x="-14" y="-8" width="28" height="16" rx="2" fill="#334155" fillOpacity="0.4" stroke="#64748B" strokeWidth="1" />
            <rect x="-38" y="-5" width="20" height="10" rx="1" fill="#2F6FED" fillOpacity="0.5" />
            <rect x="18" y="-5" width="20" height="10" rx="1" fill="#2F6FED" fillOpacity="0.5" />
            <circle cx="0" cy="0" r="3" fill="#3BAA91" />
            {/* Sensor beam toward earth */}
            <polygon points="0,8 -120,240 80,240" fill="url(#satelliteBeam)" />
          </g>
        </g>

        {/* Topographic Contour Lines - Subtle GIS Intelligence Motif */}
        <g opacity="0.45">
          <path d="M-50 280 C200 240 450 310 750 270 C1050 230 1250 290 1500 260" stroke="#6687A8" strokeWidth="0.8" strokeDasharray="4 6" />
          <path d="M-50 310 C250 270 500 340 800 300 C1100 260 1300 320 1500 290" stroke="#6687A8" strokeWidth="0.8" strokeDasharray="5 7" />
          <path d="M-50 340 C220 300 480 370 820 330 C1150 290 1350 350 1500 320" stroke="#6687A8" strokeWidth="0.8" strokeDasharray="6 8" />
        </g>

        {/* Distant Mountain Range */}
        <path
          d="M0 480 L0 260 L80 230 L210 280 L360 210 L520 270 L680 195 L840 265 L1020 200 L1180 250 L1340 215 L1440 240 L1440 480 Z"
          fill="url(#mountainFar)"
        />

        {/* Mid-ground Rolling Foothills */}
        <path
          d="M0 480 L0 310 C180 280 320 330 480 300 C640 270 780 325 940 295 C1100 265 1280 320 1440 285 L1440 480 Z"
          fill="url(#mountainMid)"
        />

        {/* River / Waterbody in Foreground */}
        <path
          d="M0 430 Q350 380 720 420 T1440 395 L1440 480 L0 480 Z"
          fill="url(#waterGrad)"
        />

        {/* Industrial Complex & Refinery Infrastructure Silhouettes */}
        <g opacity="0.6">
          {/* Western Cluster */}
          <g transform="translate(180, 190)">
            {/* Distillation Column Tower 1 */}
            <rect x="0" y="40" width="16" height="110" rx="3" fill="#475569" fillOpacity="0.4" stroke="#64748B" strokeWidth="0.75" />
            <line x1="8" y1="15" x2="8" y2="40" stroke="#334155" strokeWidth="1.5" strokeOpacity="0.6" />
            <circle cx="8" cy="12" r="2.5" fill="#C53030" fillOpacity="0.8" />
            {/* Platform Rings */}
            <line x1="-3" y1="65" x2="19" y2="65" stroke="#64748B" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="-3" y1="95" x2="19" y2="95" stroke="#64748B" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="-3" y1="125" x2="19" y2="125" stroke="#64748B" strokeWidth="1" strokeOpacity="0.5" />

            {/* Storage Tanks */}
            <rect x="24" y="80" width="45" height="70" rx="4" fill="#64748B" fillOpacity="0.3" stroke="#94A3B8" strokeWidth="0.75" />
            <ellipse cx="46.5" cy="80" rx="22.5" ry="6" fill="#94A3B8" fillOpacity="0.4" />
            <rect x="76" y="92" width="38" height="58" rx="4" fill="#64748B" fillOpacity="0.3" stroke="#94A3B8" strokeWidth="0.75" />
            <ellipse cx="95" cy="92" rx="19" ry="5" fill="#94A3B8" fillOpacity="0.4" />

            {/* Factory Warehouse Structure with Gable Roof */}
            <polygon points="125,150 125,100 155,80 185,100 185,150" fill="#475569" fillOpacity="0.3" />
            <polygon points="185,150 185,100 215,80 245,100 245,150" fill="#64748B" fillOpacity="0.25" />
            {/* Piping Gantries */}
            <path d="M16 110 H125 M16 125 H125" stroke="#64748B" strokeWidth="1" strokeOpacity="0.4" />
          </g>

          {/* Eastern Deep Industrial Refinery Cluster */}
          <g transform="translate(980, 160)">
            {/* Flare Stack */}
            <line x1="20" y1="30" x2="20" y2="180" stroke="#334155" strokeWidth="2.5" strokeOpacity="0.5" />
            <line x1="20" y1="60" x2="6" y2="180" stroke="#64748B" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="20" y1="60" x2="34" y2="180" stroke="#64748B" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx="20" cy="26" r="3" fill="#2F6FED" fillOpacity="0.7" />

            {/* High Capacity Towers */}
            <rect x="50" y="55" width="22" height="125" rx="4" fill="#475569" fillOpacity="0.35" />
            <rect x="78" y="70" width="18" height="110" rx="3" fill="#64748B" fillOpacity="0.3" />
            <rect x="102" y="90" width="30" height="90" rx="4" fill="#475569" fillOpacity="0.3" />
            
            {/* Cooling Towers (Curved Hyperboloid outline) */}
            <path
              d="M150 180 Q160 135 156 100 L184 100 Q180 135 190 180 Z"
              fill="#94A3B8"
              fillOpacity="0.3"
              stroke="#64748B"
              strokeWidth="0.75"
            />
            <ellipse cx="170" cy="100" rx="14" ry="4" fill="#CBD5E1" fillOpacity="0.4" />

            <path
              d="M200 180 Q210 140 206 110 L230 110 Q226 140 236 180 Z"
              fill="#94A3B8"
              fillOpacity="0.25"
              stroke="#64748B"
              strokeWidth="0.75"
            />
            {/* Soft steam/exhaust plume from cooling tower at very low opacity */}
            <path
              d="M170 96 C165 70 178 50 172 30 C168 15 178 0 174 -15"
              stroke="#FFFFFF"
              strokeWidth="10"
              strokeLinecap="round"
              strokeOpacity="0.25"
              filter="blur(6px)"
            />
          </g>

          {/* Sparse Vegetation / Tree Silhouettes in Mid-Distance */}
          <g transform="translate(560, 310)" opacity="0.35">
            <ellipse cx="0" cy="0" rx="12" ry="18" fill="#3BAA91" />
            <ellipse cx="16" cy="4" rx="10" ry="14" fill="#2F6FED" />
            <ellipse cx="-14" cy="6" rx="9" ry="12" fill="#3BAA91" />
            <line x1="0" y1="14" x2="0" y2="30" stroke="#52677D" strokeWidth="1.5" />
          </g>
          <g transform="translate(860, 290)" opacity="0.3">
            <ellipse cx="0" cy="0" rx="14" ry="16" fill="#3BAA91" />
            <ellipse cx="18" cy="2" rx="11" ry="13" fill="#52677D" />
            <line x1="0" y1="12" x2="0" y2="28" stroke="#52677D" strokeWidth="1.5" />
          </g>
        </g>

        {/* Soft Bottom Atmospheric Fog Gradient to blend into page content */}
        <rect y="380" width="1440" height="100" fill="url(#bottomFade)" />
        <defs>
          <linearGradient id="bottomFade" x1="720" y1="380" x2="720" y2="480" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F4F7FA" stopOpacity="0" />
            <stop offset="0.6" stopColor="#F4F7FA" stopOpacity="0.7" />
            <stop offset="1" stopColor="#F4F7FA" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
