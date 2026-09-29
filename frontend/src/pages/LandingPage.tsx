import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Footer } from '../components/layout/Footer';
import {
  Search,
  ArrowRight,
  Play,
  Leaf,
  Factory,
  Sprout,
  Globe,
  BarChart3,
  Cpu,
  Users,
  Shield,
  Layers,
  Flame,
  Radio,
  Plus,
  Minus,
  Crosshair,
  TreePine,
  Building2,
  X,
  Lock,
  ChevronRight,
  Menu,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeNav, setActiveNav] = useState<string>('Home');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showStoryModal, setShowStoryModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(1);
  const [selectedLegendFilter, setSelectedLegendFilter] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Logical Navigation Items
  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'The Challenge', href: '#challenge' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Platform Impact', href: '#impact' },
    { name: 'Live Monitoring', href: '#monitoring' },
    { name: 'Live Map', href: '/dashboard', isRoute: true },
  ];

  // Concrete Platform Metrics & Scale
  const stats = [
    {
      value: '10K+',
      label: 'Thermal Events Monitored',
      sublabel: 'Continuous global tracking',
      icon: BarChart3,
    },
    {
      value: '500+',
      label: 'Industrial Zones Mapped',
      sublabel: 'Refineries, depots & plants',
      icon: Factory,
    },
    {
      value: '375m',
      label: 'VIIRS Sensor Resolution',
      sublabel: 'High-precision orbital payload',
      icon: Globe,
    },
    {
      value: '< 15ms',
      label: 'AI Classification Speed',
      sublabel: 'Real-time hazard inference',
      icon: Cpu,
    },
    {
      value: '24/7',
      label: 'Near Real-Time Telemetry',
      sublabel: 'NASA FIRMS direct ingestion',
      icon: Radio,
    },
  ];

  // The Challenge Cards
  const challengeCards = [
    {
      id: 1,
      title: 'Industrial Facilities at Risk',
      subtitle: 'Prevent explosive disruptions, refinery flare runaway, and severe capital loss.',
      icon: Factory,
      image: '/images/challenge-industries.jpg',
    },
    {
      id: 2,
      title: 'Ecosystems Under Threat',
      subtitle: 'Protect forests, rivers, and natural habitats adjacent to industrial corridors.',
      icon: TreePine,
      image: '/images/challenge-ecosystems.jpg',
    },
    {
      id: 3,
      title: 'Communities Need Protection',
      subtitle: 'Ensure timely evacuation buffers and air quality safeguarding for nearby populations.',
      icon: Building2,
      image: '/images/challenge-communities.jpg',
    },
    {
      id: 4,
      title: 'Resilient Infrastructure',
      subtitle: 'Support proactive containment and regulatory compliance with verified ground truth.',
      icon: Globe,
      image: '/images/challenge-planet.jpg',
    },
  ];

  // 5-Stage Technical Workflow
  const workflowSteps = [
    {
      number: '01',
      title: 'Detect',
      subtitle: 'NASA Satellite Thermal Signals',
      description: 'Ingests near real-time VIIRS (375m) and MODIS (1km) orbital thermal anomaly feeds with sensor metadata directly from NASA FIRMS.',
      tag: 'Raw Telemetry',
      icon: Radio,
    },
    {
      number: '02',
      title: 'Contextualize',
      subtitle: 'Geospatial Infrastructure + Buffers',
      description: 'Cross-references thermal coordinates with industrial boundaries, petrochemical plants, and residential buffer zones using PostGIS & OSM.',
      tag: 'Spatial Topology',
      icon: Layers,
    },
    {
      number: '03',
      title: 'Classify',
      subtitle: 'Machine Learning Hazard Classifier',
      description: 'Distinguishes routine operational gas flaring from uncontained industrial fire emergencies in under 15ms using calibrated ML models.',
      tag: 'Machine Learning',
      icon: Cpu,
    },
    {
      number: '04',
      title: 'Assess',
      subtitle: 'Risk & Anomaly Severity Analysis',
      description: 'Quantifies Fire Radiative Power (FRP), brightness temperature trends, and proximity risks to trigger targeted severity alerts.',
      tag: 'Risk Analytics',
      icon: Shield,
    },
    {
      number: '05',
      title: 'Investigate',
      subtitle: 'Interactive Map + Dossier Intelligence',
      description: 'Equips plant safety teams and emergency responders with live interactive maps, audit trails, and comprehensive incident dossiers.',
      tag: 'Incident Response',
      icon: Crosshair,
    },
  ];

  return (
    <div id="home" className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* ==================================================== */}
      {/* 1. NAVBAR                                            */}
      {/* ==================================================== */}
      {/* ==================================================== */}
      {/* HERO SECTION — CINEMATIC SATELLITE INTELLIGENCE      */}
      {/* ==================================================== */}
      <section 
        className="relative min-h-screen flex flex-col justify-between bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(5, 20, 45, 0.25), rgba(5, 20, 45, 0.25)), url('/images/hero-satellite-industrial.png')`,
        }}
      >
        {/* 1. NAVBAR — Sits above hero background with subtle translucency */}
        <header className="relative z-30 w-full border-b border-white/10 bg-slate-950/20 backdrop-blur-[2px] select-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-[76px]">
              
              {/* Brand Logo & Identity */}
              <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
                  <Flame className="w-5 h-5 text-amber-300 fill-amber-300" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg sm:text-xl text-white tracking-tight font-sans leading-none">
                      ThermoScope
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/25 text-blue-200 border border-blue-400/30 leading-none">
                      GEOAI
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-200 font-medium hidden sm:block leading-tight mt-0.5">
                    Industrial Thermal Intelligence
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center space-x-6 xl:space-x-7 text-[13px] font-medium text-slate-200">
                {navItems.map((item) => {
                  const isActive = activeNav === item.name;
                  return item.isRoute ? (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setActiveNav(item.name)}
                      className={`py-1 transition-colors hover:text-white ${
                        isActive ? 'text-sky-400 font-semibold' : ''
                      }`}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setActiveNav(item.name)}
                      className={`py-1 transition-colors hover:text-white ${
                        isActive ? 'text-sky-400 font-semibold' : ''
                      }`}
                    >
                      {item.name}
                    </a>
                  );
                })}
              </nav>

              {/* Right: Search, Sign In, Live Map button, Mobile Toggle */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowSearchModal(true)}
                  aria-label="Search thermal incidents"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                  title="Search incidents & coordinates"
                >
                  <Search className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowLoginModal(true)}
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Sign In
                </button>

                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md shadow-blue-600/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] shrink-0"
                >
                  <span>Live Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Navigation Menu"
                  className="lg:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 focus:outline-none shrink-0"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>

            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative z-50 lg:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-1 shadow-2xl"
              >
                {navItems.map((item) => {
                  return item.isRoute ? (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {item.name}
                    </a>
                  );
                })}

                <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowLoginModal(true);
                    }}
                    className="text-xs font-semibold text-slate-300 hover:text-white py-1.5"
                  >
                    Enterprise Sign In
                  </button>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
                  >
                    <span>Launch Live Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* 2. HERO CONTENT — Positioned toward LEFT side, Satellite + Globe visible on RIGHT */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 flex-1 flex flex-col justify-center">
          <div className="max-w-2xl text-left">
            
            {/* Small Badge */}
            <div className="inline-flex items-center mb-4 sm:mb-6">
              <span className="text-[11px] sm:text-xs font-bold tracking-wider text-sky-200 uppercase bg-slate-950/40 border border-white/20 px-3.5 py-1.5 rounded-full shadow-sm">
                SATELLITE INTELLIGENCE &bull; EARLY WARNING
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-[3.75rem] font-bold tracking-tight text-white leading-[1.15] sm:leading-[1.12] mb-4 sm:mb-6 max-w-[700px]">
              Satellite Intelligence for<br />
              <span className="text-sky-400">
                Industrial Thermal Safety
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-lg lg:text-xl text-slate-100 leading-relaxed max-w-[650px] mb-6 sm:mb-10 font-normal">
              ThermoScope combines satellite thermal data, geospatial intelligence and AI to detect industrial thermal anomalies before they become critical.
            </p>

            {/* Two Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-center"
              >
                <span>Explore Live Map &rarr;</span>
              </Link>

              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById('how-it-works');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold text-white bg-slate-900/60 hover:bg-slate-900/80 border border-white/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-center"
              >
                <span>See How It Works</span>
              </a>
            </div>

          </div>
        </div>

        {/* Bottom breathing space so landscape is visible */}
        <div className="h-8 sm:h-12" aria-hidden="true" />
      </section>

      {/* ==================================================== */}
      {/* 3. THE CHALLENGE                                     */}
      {/* ==================================================== */}
      <section id="challenge" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Split Concept Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12 sm:mb-16">
            <div className="lg:col-span-5">
              <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase block mb-3 font-mono">
                THE CHALLENGE
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                Thermal anomalies are signals.<br />
                <span className="text-blue-600">Context turns them into intelligence.</span>
              </h2>
            </div>
            <div className="lg:col-span-7">
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
                Raw orbital thermal readings only indicate heat on the Earth's surface. Without spatial context, emergency responders cannot tell a controlled petrochemical flare stack from a catastrophic tank farm blaze.
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                ThermoScope fuses NASA orbital sensors with industrial site boundaries, residential buffer corridors, and real-time machine learning inference to deliver verified situational awareness before an anomaly escalates.
              </p>
            </div>
          </div>

          {/* 4 Image Panels (Tightly Balanced Heights) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {challengeCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className="group relative h-64 sm:h-72 lg:h-80 rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Background Image */}
                  <img
                    src={card.image}
                    alt={card.title}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />

                  {/* Dark Gradient Overlay for Crisp Legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />

                  {/* Bottom Content Card */}
                  <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end text-white z-10">
                    <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center mb-2.5 border border-white/30 text-white">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mb-1 leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ==================================================== */}
      {/* 4. HOW IT WORKS (CONNECTED 5-STAGE PIPELINE)         */}
      {/* ==================================================== */}
      <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-slate-50/60 border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase block mb-2 font-mono">
              HOW IT WORKS
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-tight mb-3">
              Connected Pipeline: From Orbit to Ground Truth
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              ThermoScope automates the complete lifecycle of thermal anomaly detection across five structured stages — delivering verifiable intelligence within seconds of satellite telemetry availability.
            </p>
          </div>

          {/* 5-Stage Connected Workflow Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-4 relative">
            {workflowSteps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.number}
                  className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative group"
                >
                  <div>
                    {/* Step Number & Graphic Container */}
                    <div className="h-16 rounded-lg bg-blue-50/60 border border-blue-100/60 flex items-center justify-between px-3.5 mb-3.5 relative">
                      <span className="text-xs font-mono font-bold text-blue-700">
                        STAGE {step.number}
                      </span>
                      <StepIcon className="w-5 h-5 text-blue-600" />
                    </div>

                    {/* Step Title & Details */}
                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-[11px] font-semibold text-blue-700 mb-1.5">
                      {step.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Stage Tag Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">{step.tag}</span>
                    <span className="text-emerald-600 font-mono font-bold text-[10px]">VERIFIED</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Workflow Action */}
          <div className="mt-10 text-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors"
            >
              <span>Explore Live Telemetry Workflow</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ==================================================== */}
      {/* 5. PLATFORM IMPACT & METRICS STRIP                   */}
      {/* ==================================================== */}
      <section id="impact" className="py-12 sm:py-14 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`flex items-center gap-3.5 ${idx > 0 ? 'pt-4 sm:pt-0 sm:pl-4 lg:pl-6' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-700 font-semibold leading-tight mt-0.5">
                      {stat.label}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">
                      {stat.sublabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 6. LIVE GLOBAL MONITORING (PRODUCT PREVIEW)          */}
      {/* ==================================================== */}
      <section id="monitoring" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Context & Capabilities */}
            <div className="lg:col-span-4">
              <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase block mb-2 sm:mb-3">
                LIVE MONITORING INTERFACE
              </span>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-tight mb-4 sm:mb-5">
                Interactive Thermal Hotspots &amp; Risk Telemetry
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Explore real-time thermal detections, industrial site polygons, and danger buffer zones directly on an interactive global map. Filter by risk tier, inspect raw sensor metrics, and track telemetry logs.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Interactive geospatial layers with Leaflet &amp; OpenStreetMap</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time polygon containment calculation</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Detailed incident audit logs and sensor timestamps</span>
                </div>
              </div>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors"
              >
                <span>Launch Full-Screen Map</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right Column: Geospatial Map Preview Container */}
            <div className="lg:col-span-8 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-[#090d16] aspect-[16/10] w-full">
                
                {/* World Night Thermal Map */}
                <img
                  src="/images/map-world-dark.jpg"
                  alt="Live Global Thermal Monitoring Map Preview"
                  className="w-full h-full object-cover object-center opacity-90 transition-transform duration-300 ease-out"
                  style={{ transform: `scale(${mapZoomLevel})` }}
                />

                {/* Map Grid Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/40 pointer-events-none" />

                {/* Top-Left Legend Filter Pill */}
                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 bg-slate-900/90 backdrop-blur-md rounded-xl p-3 border border-slate-700/60 shadow-lg text-white">
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2 font-mono">
                    HOTSPOT CLASSIFICATION
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <button
                      onClick={() => setSelectedLegendFilter(selectedLegendFilter === 'fire' ? null : 'fire')}
                      className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${
                        selectedLegendFilter && selectedLegendFilter !== 'fire' ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-medium text-slate-200">Active Fire</span>
                    </button>
                    <button
                      onClick={() => setSelectedLegendFilter(selectedLegendFilter === 'industrial' ? null : 'industrial')}
                      className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${
                        selectedLegendFilter && selectedLegendFilter !== 'industrial' ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="font-medium text-slate-200">Industrial Flare</span>
                    </button>
                    <button
                      onClick={() => setSelectedLegendFilter(selectedLegendFilter === 'risk' ? null : 'risk')}
                      className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${
                        selectedLegendFilter && selectedLegendFilter !== 'risk' ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <span className="font-medium text-slate-200">High Risk Buffer</span>
                    </button>
                    <button
                      onClick={() => setSelectedLegendFilter(selectedLegendFilter === 'recent' ? null : 'recent')}
                      className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${
                        selectedLegendFilter && selectedLegendFilter !== 'recent' ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      <span className="font-medium text-slate-200">Recent Telemetry</span>
                    </button>
                  </div>
                </div>

                {/* Map Zoom Controls (Top Right) */}
                <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 flex flex-col gap-1 bg-slate-900/90 backdrop-blur-md rounded-lg p-1 border border-slate-700/60 shadow-lg text-white">
                  <button
                    onClick={() => setMapZoomLevel(prev => Math.min(prev + 0.15, 1.45))}
                    aria-label="Zoom in"
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMapZoomLevel(prev => Math.max(prev - 0.15, 0.95))}
                    aria-label="Zoom out"
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMapZoomLevel(1)}
                    aria-label="Reset view"
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Floating Incident Information Card (Bottom Right) */}
                <div className="absolute bottom-3.5 right-3.5 sm:bottom-5 sm:right-5 bg-white/95 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-slate-200 shadow-2xl max-w-[280px] sm:max-w-[310px] text-slate-900">
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                        <span className="text-xs font-bold text-slate-900 leading-tight">Industrial Fire Event</span>
                      </div>
                      
                      <div className="space-y-0.5 text-[10px] font-mono text-slate-600 mb-2">
                        <div>Lat: 28.6139° N</div>
                        <div>Lon: 77.2090° E</div>
                        <div className="flex items-center gap-1">
                          <span>Confidence:</span>
                          <span className="font-bold text-emerald-600">92% High</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Risk Level:</span>
                          <span className="font-bold text-red-600">Critical</span>
                        </div>
                      </div>

                      <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <span>Inspect in Live Map</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Real Industrial Fire Incident Thumbnail */}
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-inner">
                      <img
                        src="/images/incident-thumbnail.jpg"
                        alt="Incident smoke thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 7. CALL TO ACTION (SHARED RESPONSIBILITY)            */}
      {/* ==================================================== */}
      <section id="shared-responsibility" className="relative py-20 sm:py-24 lg:py-28 overflow-hidden bg-slate-900 text-white">
        
        {/* Panoramic Mountain Landscape Background */}
        <div className="absolute inset-0">
          <img
            src="/images/cta-mountains.jpg"
            alt="Misty mountain landscape"
            className="w-full h-full object-cover object-bottom opacity-35 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/85 to-slate-900/70" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Subtle Top Tags */}
          <div className="flex justify-between items-start mb-8 text-[11px] font-mono tracking-widest text-slate-400">
            <div className="hidden sm:block leading-relaxed">
              PEOPLE &bull; INDUSTRIES &bull; NATURE<br />
              A SAFER INDUSTRIAL TOMORROW
            </div>
            
            <div className="text-right font-mono text-slate-400 text-xs">
              SIH PROBLEM STATEMENT ID 26162
            </div>
          </div>

          {/* Center Headline & Call to Action */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase block mb-3">
              OPERATIONAL READINESS
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-5 sm:mb-6 leading-tight">
              Start Monitoring Industrial Thermal Intelligence Today
            </h2>

            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
              Whether safeguarding petrochemical refineries, pipeline corridors, or nearby community buffer zones, ThermoScope delivers the verified real-time ground truth you need.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-xs sm:text-sm font-semibold text-slate-950 bg-white hover:bg-slate-100 shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Launch Live Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => setShowStoryModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-xs sm:text-sm font-semibold text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/80 transition-colors backdrop-blur-sm"
              >
                <span>View System Overview</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ==================================================== */}
      {/* 8. FOOTER                                            */}
      {/* ==================================================== */}
      <Footer />

      {/* ==================================================== */}
      {/* STORY / OVERVIEW MODAL                               */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showStoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200"
            >
              <button
                onClick={() => setShowStoryModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-blue-600 mb-3">
                <Radio className="w-5 h-5 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Platform Mission &amp; Technology</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                Turning Orbital Telemetry into Verifiable Ground Truth
              </h3>

              <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                <p>
                  Industrial complexes, petrochemical refineries, and chemical storage depots represent critical infrastructure. When a thermal event strikes, rapid verification determines whether it remains routine operational gas flaring or escalates into an emergency blaze.
                </p>
                <p>
                  By fusing <strong>NASA FIRMS VIIRS (375m) satellite data</strong> with real-time OpenStreetMap infrastructure topology and machine learning classification, ThermoScope detects real anomalies within minutes of satellite pass.
                </p>
                <p>
                  Disaster response teams and plant managers receive immediate containment buffer insights, minimizing industrial downtime and protecting surrounding populations.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-400">Powered by NASA LANCE &bull; OpenStreetMap &bull; GeoAI</span>
                <Link
                  to="/dashboard"
                  onClick={() => setShowStoryModal(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                >
                  <span>Open Live Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* ENTERPRISE LOGIN MODAL                               */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200"
            >
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Enterprise Observer Sign In
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Sign in with official credentials to access real-time dispatch alerts and system administration.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="operator@disastermgmt.gov.in"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>

                <Link
                  to="/admin"
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Sign In as Observer / Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link
                  to="/dashboard"
                  onClick={() => setShowLoginModal(false)}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Continue as Guest Observer &rarr;
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================== */}
      {/* SEARCH MODAL                                         */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl relative border border-slate-200"
            >
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search coordinates, industrial clusters, or incident IDs..."
                  className="w-full text-sm outline-none text-slate-900 placeholder:text-slate-400"
                />
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-3 text-xs text-slate-500">
                <div className="font-semibold text-slate-700 mb-2">Suggested Locations:</div>
                <div className="space-y-1.5">
                  <Link
                    to="/dashboard"
                    onClick={() => setShowSearchModal(false)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <span>Gujarat Petrochemical Corridor (Jamnagar)</span>
                    <span className="text-[10px] font-mono text-slate-400">22.4707° N, 70.0577° E</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setShowSearchModal(false)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <span>Bokaro Steel &amp; Industrial Complex</span>
                    <span className="text-[10px] font-mono text-slate-400">23.6693° N, 86.1511° E</span>
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setShowSearchModal(false)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <span>Manali Petrochemicals &amp; Refinery Basin</span>
                    <span className="text-[10px] font-mono text-slate-400">13.1678° N, 80.2600° E</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default LandingPage;
