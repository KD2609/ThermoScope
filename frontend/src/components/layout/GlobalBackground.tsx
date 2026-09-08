import React from 'react';
import pageBgImage from '../../assets/images/page-bg.png';

interface GlobalBackgroundProps {
  activeTab: string;
}

export const GlobalBackground: React.FC<GlobalBackgroundProps> = ({ activeTab }) => {
  // Page-specific subtle positioning & overlay tuning
  let bgPosition = 'center top';
  let overlayStyle = 'linear-gradient(180deg, rgba(248,250,252,0.52) 0%, rgba(248,250,252,0.68) 45%, rgba(248,250,252,0.80) 100%)';

  switch (activeTab) {
    case 'command':
      // Command center: allow illustration to feel expansive behind KPI strip and bottom insight
      bgPosition = 'center top';
      overlayStyle = 'linear-gradient(180deg, rgba(248,250,252,0.46) 0%, rgba(248,250,252,0.62) 35%, rgba(248,250,252,0.76) 100%)';
      break;
    case 'map':
      // Thermal map: Leaflet covers most of the viewport; overlay provides clean frame
      bgPosition = 'center top';
      overlayStyle = 'linear-gradient(180deg, rgba(248,250,252,0.70) 0%, rgba(248,250,252,0.85) 100%)';
      break;
    case 'incidents':
      // Incident explorer: high clarity overlay for dense data table
      bgPosition = 'center 12%';
      overlayStyle = 'linear-gradient(180deg, rgba(248,250,252,0.64) 0%, rgba(248,250,252,0.78) 50%, rgba(248,250,252,0.86) 100%)';
      break;
    case 'incident-detail':
      // Incident detail: allow geospatial and industrial horizon to subtly frame header
      bgPosition = 'center top';
      overlayStyle = 'linear-gradient(180deg, rgba(248,250,252,0.48) 0%, rgba(248,250,252,0.68) 30%, rgba(248,250,252,0.80) 100%)';
      break;
    case 'assets':
      bgPosition = 'center top';
      overlayStyle = 'linear-gradient(180deg, rgba(248,250,252,0.62) 0%, rgba(248,250,252,0.76) 100%)';
      break;
    case 'analytics':
      // Analytics: higher opacity overlay so charts dominate with high contrast
      bgPosition = 'center top';
      overlayStyle = 'linear-gradient(180deg, rgba(248,250,252,0.68) 0%, rgba(248,250,252,0.82) 100%)';
      break;
    case 'health':
      bgPosition = 'center top';
      overlayStyle = 'linear-gradient(180deg, rgba(248,250,252,0.62) 0%, rgba(248,250,252,0.78) 100%)';
      break;
    default:
      bgPosition = 'center top';
      overlayStyle = 'linear-gradient(180deg, rgba(248,250,252,0.58) 0%, rgba(248,250,252,0.74) 100%)';
  }

  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
    >
      {/* 1. Base Shared Illustration */}
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-300 ease-out"
        style={{
          backgroundImage: `url(${pageBgImage})`,
          backgroundPosition: bgPosition,
        }}
      />

      {/* 2. Delicate Atmospheric Overlay: Ensures content readability without hiding the art */}
      <div 
        className="absolute inset-0 transition-all duration-300 ease-out"
        style={{
          background: overlayStyle,
        }}
      />
    </div>
  );
};

