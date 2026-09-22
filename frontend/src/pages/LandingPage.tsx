import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ExternalLink,
  Plus,
  Minus,
  Crosshair,
  TreePine,
  Building2,
  X,
  Lock,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeNav, setActiveNav] = useState<string>('Home');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
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

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Live Map', href: '/dashboard', isRoute: true },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Impact', href: '#impact' },
    { name: 'Resources', href: '#challenge' },
    { name: 'About', href: '#shared-responsibility' },
  ];

  // Stats Strip Items
  const stats = [
    {
      value: '10K+',
      label: 'Thermal Detections Monitored',
      icon: BarChart3,
    },
    {
      value: '500+',
      label: 'Industrial Sites Mapped',
      icon: Factory,
    },
    {
      value: 'Global',
      label: 'Coverage',
      icon: Globe,
    },
    {
      value: 'AI-Powered',
      label: 'Risk Analysis',
      icon: Cpu,
    },
    {
      value: 'Real Impact',
      label: 'Safer Communities',
      icon: Users,
    },
  ];

  // Challenge Cards
  const challengeCards = [
    {
      id: 1,
      title: 'Industries at Risk',
      subtitle: 'Prevent disruptions and reduce risks',
      icon: Factory,
      image: '/images/challenge-industries.jpg',
    },
    {
      id: 2,
      title: 'Ecosystems Under Threat',
      subtitle: 'Protect forests, wildlife and natural resources',
      icon: TreePine,
      image: '/images/challenge-ecosystems.jpg',
    },
    {
      id: 3,
      title: 'Communities Need Protection',
      subtitle: 'Support safer, healthier and more resilient cities',
      icon: Building2,
      image: '/images/challenge-communities.jpg',
    },
    {
      id: 4,
      title: 'A Healthier Planet',
      subtitle: 'A more sustainable tomorrow for future generations',
      icon: Globe,
      image: '/images/challenge-planet.jpg',
    },
  ];

  // How It Works Steps
  const workflowSteps = [
    {
      number: '01',
      title: 'Collect Satellite Data',
      subtitle: '(NASA FIRMS)',
      description: 'Detect thermal anomalies in near real-time',
      tag: 'NASA FIRMS',
      iconType: 'satellite',
    },
    {
      number: '02',
      title: 'Analyze with AI',
      subtitle: 'Classify & Contextualize',
      description: 'Classify, assess risk and enrich with geospatial context',
      tag: 'Machine Learning',
      iconType: 'layers',
    },
    {
      number: '03',
      title: 'Generate Insights',
      subtitle: 'Spatial Intelligence',
      description: 'Identify high-risk areas and potential impact',
      tag: 'Risk Scoring',
      iconType: 'network',
    },
    {
      number: '04',
      title: 'Enable Action',
      subtitle: 'Authority & Public Alerts',
      description: 'Support authorities, industries and communities with timely alerts',
      tag: 'Early Warning',
      iconType: 'responders',
    },
  ];

  return (
    <div id="home" className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* ==================================================== */}
      {/* 1. NAVBAR                                            */}
      {/* ==================================================== */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3'
            : 'bg-white/90 backdrop-blur-sm border-b border-slate-100 py-4 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Left: Brand Logo & Subtitle */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full border border-blue-600/30 bg-blue-50/60 text-blue-700 shadow-sm transition-transform duration-200 group-hover:scale-105">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
                </svg>
                {/* Crosshair ring subtle effect */}
                <div className="absolute inset-0 rounded-full border border-dashed border-blue-400/40 animate-[spin_20s_linear_infinite]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-slate-950 font-sans">TerraGuard</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                    GeoAI
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 tracking-wide">Observe &bull; Understand &bull; Protect</span>
              </div>
            </Link>

            {/* Center: Navigation Links */}
            <nav className="hidden md:flex items-center space-x-7 lg:space-x-8 text-[14px] font-medium text-slate-600">
              {navItems.map((item) => {
                const isActive = activeNav === item.name;
                return item.isRoute ? (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setActiveNav(item.name)}
                    className={`relative py-1 transition-colors hover:text-slate-950 ${
                      isActive ? 'text-blue-700 font-semibold' : ''
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setActiveNav(item.name)}
                    className={`relative py-1 transition-colors hover:text-slate-950 ${
                      isActive ? 'text-blue-700 font-semibold' : ''
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </a>
                );
              })}
            </nav>

            {/* Right: Search, Login, Get Started */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowSearchModal(true)}
                aria-label="Search thermal incidents"
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-1.5 text-[13px] font-medium text-slate-700 hover:text-slate-950 transition-colors rounded-lg hover:bg-slate-50"
              >
                Login
              </button>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all duration-200 hover:shadow hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </motion.header>

      {/* ==================================================== */}
      {/* 2. HERO SECTION                                      */}
      {/* ==================================================== */}
      <section className="relative pt-6 pb-16 md:pt-10 md:pb-24 overflow-hidden border-b border-slate-100">
        
        {/* Background Subtle Grid Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 z-10"
            >
              {/* Eyebrow */}
              <div className="mb-4">
                <span className="text-[11px] sm:text-xs font-semibold tracking-widest text-slate-500 uppercase">
                  SATELLITE INTELLIGENCE FOR A SAFER TOMORROW
                </span>
              </div>

              {/* Large Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-slate-900 leading-[1.12] mb-6">
                Turning<br />
                Satellite Signals<br />
                into <span className="text-[#1D70B8]">a Safer Tomorrow</span>
              </h1>

              {/* Explanation text */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
                We combine NASA satellite data, geospatial intelligence and AI to detect, classify and monitor industrial fires and thermal risks — helping protect industries, communities and the planet.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Explore Live Map</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => setShowStoryModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  <span>Watch Our Story</span>
                </button>
              </div>

              {/* 4 Feature Indicator Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200/80 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700">Safer Communities</span>
                </div>
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-slate-600 shrink-0" />
                  <span className="font-medium text-slate-700">More Resilient Industries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700">Healthier Ecosystems</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-medium text-slate-700">A Safer Tomorrow</span>
                </div>
              </div>

            </motion.div>

            {/* Right Visual: Satellite & Earth Landscape Artwork */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 relative w-full"
            >
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200/90 bg-white">
                
                {/* Main Hero Composite Image */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] w-full overflow-hidden">
                  <img
                    src="/images/hero-industrial-satellite.png"
                    alt="Satellite monitoring industrial facility with thermal anomaly detection"
                    className="w-full h-full object-cover object-center transform hover:scale-[1.02] transition-transform duration-700 ease-out"
                    loading="eager"
                  />

                  {/* Gentle left & bottom gradient mask blending into white background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent pointer-events-none" />

                  {/* Satellite Floating Badge */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-right pointer-events-none"
                  >
                    <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">TELEMETRY</div>
                    <div className="text-xs font-bold text-slate-800">From Space to a Safer Earth</div>
                  </motion.div>

                  {/* Pulsing Thermal Anomaly Beacon on the Refinery */}
                  <div className="absolute top-[58%] right-[28%] -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="relative flex items-center justify-center">
                      {/* Ripple 1 */}
                      <div className="absolute w-12 h-12 rounded-full bg-red-500/30 animate-thermal-ripple" />
                      {/* Ripple 2 */}
                      <div className="absolute w-7 h-7 rounded-full bg-orange-500/50 animate-ping" />
                      {/* Center Point */}
                      <div className="w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-md shadow-red-500/50" />
                    </div>
                  </div>

                  {/* Pinned Industrial Thermal Anomaly Floating Callout Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
                    className="absolute top-[28%] right-[6%] sm:right-[10%] z-30 max-w-[210px] sm:max-w-[230px] bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200 shadow-xl"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="text-[11px] font-bold text-slate-900 leading-tight">Industrial Thermal Anomaly</span>
                    </div>

                    <div className="space-y-0.5 text-[10px] font-mono text-slate-600 mb-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lat:</span>
                        <span className="font-semibold text-slate-800">28.6139° N</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lon:</span>
                        <span className="font-semibold text-slate-800">77.2090° E</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Confidence:</span>
                        <span className="font-bold text-emerald-600">92% High</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Source:</span>
                        <span className="text-slate-700">NASA FIRMS (VIIRS)</span>
                      </div>
                    </div>

                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <span>Investigate in Map</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </motion.div>

                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 3. STATS / IMPACT STRIP                              */}
      {/* ==================================================== */}
      <section id="impact" className="relative py-10 bg-slate-50/70 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`flex items-center gap-3.5 ${idx > 0 ? 'pt-4 md:pt-0 md:pl-6' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-500 font-medium leading-tight">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 4. THE CHALLENGE                                     */}
      {/* ==================================================== */}
      <section id="challenge" className="py-20 md:py-28 bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
            
            {/* Left Column: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4"
            >
              <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase block mb-3">
                THE CHALLENGE
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight mb-5">
                Industrial Fires<br />
                A Growing Global Risk.
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Undetected industrial fires and persistent thermal sources can harm people, damage ecosystems and disrupt economies. Early detection and accurate insights are critical for a safer, more resilient future.
              </p>

              <button
                onClick={() => {
                  const elem = document.getElementById('how-it-works');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors"
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Right Column: 4 Image Panels */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {challengeCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.6, delay: idx * 0.12 }}
                      className="group relative h-80 sm:h-96 rounded-xl overflow-hidden shadow-md border border-slate-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {/* Background Image */}
                      <img
                        src={card.image}
                        alt={card.title}
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />

                      {/* Dark Gradient Overlay for Crisp Text Contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                      {/* Bottom Info Content */}
                      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end text-white z-10">
                        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 border border-white/30 text-white">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
                          {card.title}
                        </h3>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {card.subtitle}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 5. HOW IT WORKS                                      */}
      {/* ==================================================== */}
      <section id="how-it-works" className="py-20 md:py-28 bg-slate-50/50 border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
            
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4"
            >
              <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase block mb-3">
                HOW IT WORKS
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight mb-5">
                From Raw Data<br />
                to Real-World Impact.
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                We transform real-time satellite data into actionable insights using AI and geospatial analysis — enabling faster response, better planning and greater safety.
              </p>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors"
              >
                <span>See How It Works</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Right Column: 4-Stage Horizontal Flow */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                {workflowSteps.map((step, idx) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                    className="relative bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    {/* Top Step Graphic / Icon Box */}
                    <div className="h-28 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-3 mb-4 relative overflow-hidden">
                      
                      {step.iconType === 'satellite' && (
                        <div className="flex flex-col items-center">
                          <Radio className="w-8 h-8 text-blue-600 animate-pulse" />
                          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Telemetry Ingest</span>
                        </div>
                      )}

                      {step.iconType === 'layers' && (
                        <div className="flex flex-col items-center">
                          <Layers className="w-8 h-8 text-indigo-600" />
                          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Spatial Fusion</span>
                        </div>
                      )}

                      {step.iconType === 'network' && (
                        <div className="flex flex-col items-center">
                          <Cpu className="w-8 h-8 text-blue-700" />
                          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">ML Assessment</span>
                        </div>
                      )}

                      {step.iconType === 'responders' && (
                        <div className="flex flex-col items-center">
                          <Users className="w-8 h-8 text-emerald-600" />
                          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Response Alert</span>
                        </div>
                      )}

                      <span className="absolute top-2 left-2 text-[10px] font-mono font-bold text-slate-400">
                        {step.number}
                      </span>
                    </div>

                    {/* Step Title & Details */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                        {step.number} {step.title}
                      </h4>
                      <p className="text-[11px] font-medium text-blue-700 mb-2">
                        {step.subtitle}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Stage indicator pill */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{step.tag}</span>
                      {idx < workflowSteps.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 6. LIVE GLOBAL MONITORING                            */}
      {/* ==================================================== */}
      <section id="monitoring" className="py-20 md:py-28 bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4"
            >
              <span className="text-xs font-semibold tracking-widest text-slate-500 uppercase block mb-3">
                LIVE GLOBAL MONITORING
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight mb-5">
                See What's Happening<br />
                Around the World.
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                Explore real-time thermal detections, industrial sites and high-risk areas on an interactive global map. Zoom into regions, view incident details and understand the broader context.
              </p>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-colors mb-8"
              >
                <span>View Live Map</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Decorative Badge */}
              <div className="flex items-center gap-3 pt-6 border-t border-slate-200/80 text-slate-500">
                <Globe className="w-6 h-6 text-slate-400 stroke-1" />
                <div className="text-[11px] font-mono tracking-wider uppercase leading-tight">
                  REAL DATA<br />
                  REAL PLACES<br />
                  REAL CHANGE.
                </div>
              </div>
            </motion.div>

            {/* Right Column: Dark Geospatial Map Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-8 relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#090d16] aspect-[16/10] w-full">
                
                {/* World Night Thermal Map */}
                <img
                  src="/images/map-world-dark.jpg"
                  alt="Live Global Thermal Monitoring Map"
                  className="w-full h-full object-cover object-center opacity-90"
                  style={{ transform: `scale(${mapZoomLevel})`, transition: 'transform 0.4s ease-out' }}
                />

                {/* Map Grid Scanlines / Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/40 pointer-events-none" />

                {/* Top-Left Legend Pill */}
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md rounded-xl p-3 border border-slate-700/60 shadow-lg text-white">
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">HOTSPOT CLASSIFICATION</div>
                  <div className="space-y-1.5 text-xs">
                    <button
                      onClick={() => setSelectedLegendFilter(selectedLegendFilter === 'fire' ? null : 'fire')}
                      className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${selectedLegendFilter && selectedLegendFilter !== 'fire' ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-medium text-slate-200">Active Fire</span>
                    </button>
                    <button
                      onClick={() => setSelectedLegendFilter(selectedLegendFilter === 'industrial' ? null : 'industrial')}
                      className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${selectedLegendFilter && selectedLegendFilter !== 'industrial' ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="font-medium text-slate-200">Industrial Site</span>
                    </button>
                    <button
                      onClick={() => setSelectedLegendFilter(selectedLegendFilter === 'risk' ? null : 'risk')}
                      className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${selectedLegendFilter && selectedLegendFilter !== 'risk' ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <span className="font-medium text-slate-200">High Risk Area</span>
                    </button>
                    <button
                      onClick={() => setSelectedLegendFilter(selectedLegendFilter === 'recent' ? null : 'recent')}
                      className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${selectedLegendFilter && selectedLegendFilter !== 'recent' ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      <span className="font-medium text-slate-200">Recent Detection</span>
                    </button>
                  </div>
                </div>

                {/* Map Control Buttons (Top Right) */}
                <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md rounded-lg p-1 border border-slate-700/60 shadow-lg text-white">
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
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/95 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-slate-200 shadow-2xl max-w-[280px] sm:max-w-[320px] text-slate-900"
                >
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping shrink-0" />
                        <span className="text-xs font-bold text-slate-900 leading-tight">Industrial Fire Detected</span>
                      </div>
                      
                      <div className="space-y-0.5 text-[11px] font-mono text-slate-600 mb-2">
                        <div>Lat: 28.6139° N</div>
                        <div>Lon: 77.2090° E</div>
                        <div className="flex items-center gap-1">
                          <span>Confidence:</span>
                          <span className="font-bold text-emerald-600">92%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Risk Level:</span>
                          <span className="font-bold text-red-600">High</span>
                        </div>
                      </div>

                      <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Real Industrial Fire Incident Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-inner">
                      <img
                        src="/images/incident-thumbnail.jpg"
                        alt="Incident smoke thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </motion.div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ==================================================== */}
      {/* 7. SHARED RESPONSIBILITY / FINAL CTA                 */}
      {/* ==================================================== */}
      <section id="shared-responsibility" className="relative py-24 md:py-32 overflow-hidden bg-slate-900 text-white">
        
        {/* Panoramic Mountain Landscape Background */}
        <div className="absolute inset-0">
          <img
            src="/images/cta-mountains.jpg"
            alt="Misty mountain landscape"
            className="w-full h-full object-cover object-bottom opacity-40 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Subtle Top Tags */}
          <div className="flex justify-between items-start mb-8 text-[11px] font-mono tracking-widest text-slate-400">
            <div className="hidden sm:block leading-relaxed">
              PEOPLE<br />
              INDUSTRIES<br />
              NATURE<br />
              A SAFER TOMORROW
            </div>
            
            <div className="text-right italic font-serif text-slate-300 text-xs sm:text-sm">
              Different Landscapes<br />
              One Planet<br />
              Our Responsibility
            </div>
          </div>

          {/* Center Headline & Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase block mb-3">
              A Safer Tomorrow
            </span>

            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
              Is a Shared Responsibility.
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
              Let's build a future where industries grow, communities thrive and nature is protected — together.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-slate-950 bg-white hover:bg-slate-100 shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={() => setShowStoryModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/80 transition-colors backdrop-blur-sm"
              >
                <span>Join the Movement</span>
              </button>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ==================================================== */}
      {/* 8. FOOTER                                            */}
      {/* ==================================================== */}
      <footer className="py-12 bg-white border-t border-slate-200 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
            
            {/* Brand Logo & Subtitle */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-blue-600/30 bg-blue-50 text-blue-700 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-900 leading-none">TerraGuard</span>
                <span className="text-[11px] text-slate-400">Observe &bull; Understand &bull; Protect</span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-wrap justify-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
              <a href="#home" className="hover:text-slate-950 transition-colors">Home</a>
              <Link to="/dashboard" className="hover:text-slate-950 transition-colors">Live Map</Link>
              <a href="#how-it-works" className="hover:text-slate-950 transition-colors">How It Works</a>
              <a href="#impact" className="hover:text-slate-950 transition-colors">Impact</a>
              <a href="#challenge" className="hover:text-slate-950 transition-colors">Resources</a>
              <a href="#shared-responsibility" className="hover:text-slate-950 transition-colors">About</a>
            </div>

            {/* Social Icons & Tagline */}
            <div className="flex items-center gap-4 text-slate-400">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-blue-600 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.27a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z"/></svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X Twitter" className="hover:text-slate-900 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-red-600 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="hover:text-slate-900 transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
              </a>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} TerraGuard &bull; Industrial Thermal Intelligence Platform.
            </div>
            <div className="italic">
              A safer tomorrow is a brighter tomorrow.
            </div>
          </div>

        </div>
      </footer>

      {/* ==================================================== */}
      {/* STORY MODAL                                          */}
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
                <span className="text-xs font-bold uppercase tracking-wider">Our Mission &amp; Technology</span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                Turning Orbital Telemetry into Ground Truth
              </h3>

              <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                <p>
                  Industrial facilities, petrochemical refineries, and remote storage depots represent immense capital and environmental value. When an undetected thermal event strikes, minutes determine whether it becomes a minor containment or a catastrophic disaster.
                </p>
                <p>
                  By harnessing <strong>NASA FIRMS VIIRS (375m) and MODIS satellite data</strong> alongside real-time OpenStreetMap infrastructure topology, our AI engine identifies genuine thermal anomalies and separates operational gas flaring from emergency blazes.
                </p>
                <p>
                  Authorities and nearby communities receive verified danger buffer notifications, protecting ecosystems, reducing industrial downtime, and ensuring a resilient future.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
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
      {/* LOGIN MODAL                                          */}
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
                Enterprise Portal Login
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Sign in to access real-time dispatch alerts and authority controls.
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
