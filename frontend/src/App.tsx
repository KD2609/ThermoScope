import React, { useState, useEffect } from 'react';
import { 
  ThermalAnomaly, IndustrialAsset, Alert, AnalyticsSummary,
  SystemHealth, AnomalyIntelligence 
} from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { ScenarioBar } from './components/ScenarioBar';
import { DossierModal } from './components/DossierModal';
import { GlobalBackground } from './components/layout/GlobalBackground';

// Pages
import { CommandCenter } from './pages/CommandCenter';
import { ThermalMapPage } from './pages/ThermalMapPage';
import { IncidentExplorer } from './pages/IncidentExplorer';
import { IncidentDetail } from './pages/IncidentDetail';
import { AssetRegistry } from './pages/AssetRegistry';
import { AlertCenter } from './pages/AlertCenter';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('command');
  const [systemMode, setSystemMode] = useState<'LIVE' | 'DEMO'>('DEMO');
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<string>('ANALYST');

  // Data states
  const [anomalies, setAnomalies] = useState<ThermalAnomaly[]>([]);
  const [assets, setAssets] = useState<IndustrialAsset[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  // Selection states
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<number | null>(null);
  const [selectedIntelligence, setSelectedIntelligence] = useState<AnomalyIntelligence | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);

  // Scenario & UI feedback
  const [scenarioText, setScenarioText] = useState<string | null>(null);
  const [loadingScenario, setLoadingScenario] = useState<boolean>(false);

  // Dossier modal
  const [showDossierModal, setShowDossierModal] = useState<boolean>(false);
  const [dossierAnomalyId, setDossierAnomalyId] = useState<number | null>(null);

  // Initial Data Fetch
  const loadData = async () => {
    try {
      const [anomsData, assetsData, alertsData, analyticsData, healthData] = await Promise.all([
        api.getAnomalies(),
        api.getAssets(),
        api.getAlerts(),
        api.getAnalyticsSummary(),
        api.getSystemHealth()
      ]);
      setAnomalies(anomsData);
      setAssets(assetsData);
      setAlerts(alertsData);
      setAnalytics(analyticsData);
      setHealth(healthData);
      setSystemMode(healthData.system_mode);
    } catch (err) {
      console.error('Error loading initial telemetry:', err);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 8000);
    return () => clearInterval(timer);
  }, []);

  // Inspect Anomaly Detail
  const handleSelectAnomaly = async (id: number) => {
    try {
      setSelectedAnomalyId(id);
      const intel = await api.getAnomalyIntelligence(id);
      setSelectedIntelligence(intel);
      setActiveTab('incident-detail');
    } catch (err) {
      alert('Failed to load incident intelligence dossier');
    }
  };

  const handleRefreshIntelligence = async () => {
    if (selectedAnomalyId) {
      const intel = await api.getAnomalyIntelligence(selectedAnomalyId);
      setSelectedIntelligence(intel);
    }
    loadData();
  };

  // Toggle Mode (LIVE vs DEMO)
  const handleToggleMode = async () => {
    const nextMode = systemMode === 'LIVE' ? 'DEMO' : 'LIVE';
    try {
      await api.toggleSystemMode(nextMode);
      setSystemMode(nextMode);
      loadData();
    } catch (err) {
      alert('Mode toggle failed');
    }
  };

  // Scenario Triggers
  const handleTriggerScenario = async (scenario: 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C') => {
    try {
      setLoadingScenario(true);
      const result = await api.triggerScenario(scenario);
      setScenarioText(`${result.title}: ${result.narrative}`);
      await loadData();

      // Open new event intelligence directly
      if (result.anomaly_id) {
        handleSelectAnomaly(result.anomaly_id);
      }
    } catch (err) {
      alert('Failed to execute demo scenario');
    } finally {
      setLoadingScenario(false);
    }
  };

  const handleResetScenario = async () => {
    try {
      setLoadingScenario(true);
      const res = await api.resetScenario();
      setScenarioText(res.message);
      setSelectedIntelligence(null);
      setSelectedAnomalyId(null);
      setActiveTab('command');
      await loadData();
    } catch (err) {
      alert('Reset failed');
    } finally {
      setLoadingScenario(false);
    }
  };

  // 1-Click SIH Key Scenario Walkthrough
  const handleRunKeyScenario = async () => {
    await handleTriggerScenario('SCENARIO_A');
  };

  const handleSelectAsset = (id: number) => {
    setSelectedAssetId(id);
    setActiveTab('assets');
  };

  const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;

  return (
    <div className="min-h-screen relative flex flex-col font-sans selection:bg-[#2F6FED]/20 selection:text-[#102A43] bg-[#F4F7FA]">
      {/* Global Shared Page Background & Atmospheric Overlay */}
      <GlobalBackground activeTab={activeTab} />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemMode={systemMode}
        onToggleMode={handleToggleMode}
        onRunKeyScenario={handleRunKeyScenario}
        presentationMode={presentationMode}
        setPresentationMode={setPresentationMode}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        criticalAlertsCount={criticalAlertsCount}
      />

      {/* Demo Scenario Controller Bar (Removed from home page) */}
      {activeTab !== 'command' && (
        <ScenarioBar
          onTriggerScenario={handleTriggerScenario}
          onResetScenario={handleResetScenario}
          activeScenarioText={scenarioText}
          loading={loadingScenario}
        />
      )}

      {/* Main Screen Body */}
      <main className="relative z-10 flex-1 overflow-x-hidden">
        {activeTab === 'command' && (
          <CommandCenter
            anomalies={anomalies}
            assets={assets}
            alerts={alerts}
            analytics={analytics}
            onSelectAnomaly={handleSelectAnomaly}
            onSelectAsset={handleSelectAsset}
            onViewAlerts={() => setActiveTab('alerts')}
            onViewHealth={() => setActiveTab('health')}
          />
        )}

        {activeTab === 'map' && (
          <ThermalMapPage
            anomalies={anomalies}
            assets={assets}
            onSelectAnomaly={handleSelectAnomaly}
          />
        )}

        {activeTab === 'incidents' && (
          <IncidentExplorer
            anomalies={anomalies}
            onSelectAnomaly={handleSelectAnomaly}
          />
        )}

        {activeTab === 'incident-detail' && selectedIntelligence && (
          <IncidentDetail
            intel={selectedIntelligence}
            onBack={() => setActiveTab('incidents')}
            onOpenReportModal={() => {
              setDossierAnomalyId(selectedIntelligence.event.id);
              setShowDossierModal(true);
            }}
            onRefresh={handleRefreshIntelligence}
          />
        )}

        {activeTab === 'assets' && (
          <AssetRegistry
            assets={assets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
            onSelectAnomaly={handleSelectAnomaly}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertCenter
            alerts={alerts}
            onSelectAnomaly={handleSelectAnomaly}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage analytics={analytics} />
        )}

        {activeTab === 'health' && (
          <SystemHealthPage
            health={health}
            onToggleMode={handleToggleMode}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Printable Dossier Modal */}
      {showDossierModal && (
        <DossierModal
          anomalyId={dossierAnomalyId}
          onClose={() => setShowDossierModal(false)}
        />
      )}
    </div>
  );
};

export default App;
