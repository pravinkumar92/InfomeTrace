import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { InvestigationConsole } from './components/InvestigationConsole';
import { ImpactSummary } from './components/ImpactSummary';
import { ImpactGraph } from './components/ImpactGraph';
import { RecallSimulator } from './components/RecallSimulator';
import { RecallNotificationCenter } from './components/RecallNotificationCenter';
import { ViewCypher } from './components/ViewCypher';
import { TraceAssist } from './components/TraceAssist';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { StatusDashboard } from './components/StatusDashboard';
import { AnalyticsHub } from './components/AnalyticsHub';
import { CustomerView } from './components/CustomerView';
import { KitchenView } from './components/KitchenView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { investigateEntity } from './api/investigation';
import { recallBatch } from './api/recall';
import type { InvestigationResponse, SimulateContainmentResponse } from './api/types';

type ViewMode = 'dashboard' | 'investigation' | 'analytics' | 'customer' | 'kitchen';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [impactResult, setImpactResult] = useState<InvestigationResponse | null>(null);
  const [simResult, setSimResult] = useState<SimulateContainmentResponse | null>(null);
  const [isRecalling, setIsRecalling] = useState(false);
  const [recallError, setRecallError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== App.tsx: simResult changed ===');
    console.log('New simResult:', simResult);
  }, [simResult]);

  const handleInvestigate = async (entityType: string, entityId: string) => {
    setIsLoading(true);
    setError(null);
    setActiveType(entityType);
    setActiveId(entityId);
    setImpactResult(null);
    setSimResult(null);
    setRecallError(null);

    try {
      const data = await investigateEntity(entityType, entityId);
      setImpactResult(data);
    } catch (err: any) {
      setError(err.message || 'Investigation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRecall = async () => {
    if (!impactResult || !impactResult.batch) return;
    setIsRecalling(true);
    setRecallError(null);
    try {
      await recallBatch({ batch_id: impactResult.batch.id });
      const data = await investigateEntity('Batch', impactResult.batch.id);
      setImpactResult(data);
      setSimResult(null);
    } catch (err: any) {
      setRecallError(err.message || 'Recall mutation failed');
    } finally {
      setIsRecalling(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <BackgroundAnimation />
      <div className="relative z-10">
        <Layout>
          {/* View Mode Switcher - 3 Core Tabs */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-6 py-3 font-bold text-sm tracking-wider uppercase transition-all ${
                viewMode === 'dashboard'
                  ? 'bg-accent text-surface border-2 border-accent'
                  : 'bg-surface text-ink border-2 border-ui-border hover:border-accent'
              }`}
            >
              Command Center
            </button>
            <button
              onClick={() => setViewMode('investigation')}
              className={`px-6 py-3 font-bold text-sm tracking-wider uppercase transition-all ${
                viewMode === 'investigation'
                  ? 'bg-accent text-surface border-2 border-accent'
                  : 'bg-surface text-ink border-2 border-ui-border hover:border-accent'
              }`}
            >
              Investigation Console
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-6 py-3 font-bold text-sm tracking-wider uppercase transition-all ${
                viewMode === 'analytics'
                  ? 'bg-accent text-surface border-2 border-accent'
                  : 'bg-surface text-ink border-2 border-ui-border hover:border-accent'
              }`}
            >
              Risk Analytics
            </button>
            <button
              onClick={() => setViewMode('customer')}
              className={`px-6 py-3 font-bold text-sm tracking-wider uppercase transition-all ${
                viewMode === 'customer'
                  ? 'bg-accent text-surface border-2 border-accent'
                  : 'bg-surface text-ink border-2 border-ui-border hover:border-accent'
              }`}
            >
              Customer View
            </button>
            <button
              onClick={() => setViewMode('kitchen')}
              className={`px-6 py-3 font-bold text-sm tracking-wider uppercase transition-all ${
                viewMode === 'kitchen'
                  ? 'bg-accent text-surface border-2 border-accent'
                  : 'bg-surface text-ink border-2 border-ui-border hover:border-accent'
              }`}
            >
              Kitchen View
            </button>
          </div>

          {viewMode === 'dashboard' ? (
            <div className="h-[calc(100vh-180px)] border border-ui-border bg-surface shadow-xl">
              <StatusDashboard />
            </div>
          ) : viewMode === 'analytics' ? (
            <div className="h-[calc(100vh-180px)] border border-ui-border bg-surface shadow-xl">
              <AnalyticsHub />
            </div>
          ) : viewMode === 'customer' ? (
            <div className="h-[calc(100vh-180px)] border border-ui-border bg-surface shadow-xl">
              <CustomerView />
            </div>
          ) : viewMode === 'kitchen' ? (
            <div className="h-[calc(100vh-180px)] border border-ui-border bg-surface shadow-xl">
              <KitchenView />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <InvestigationConsole onInvestigate={handleInvestigate} isLoading={isLoading} error={error} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8 xl:gap-12">
                <div className="space-y-12">
                  {impactResult && (
                    <div className="flex flex-col space-y-12">
                      <ErrorBoundary>
                        <div className="h-[calc(100vh-280px)] min-h-[600px] border border-ui-border bg-surface shadow-xl">
                          <ImpactGraph result={impactResult} simResult={simResult} />
                        </div>
                      </ErrorBoundary>

                      {/* Recall Notification Center - Only show for contaminated batches */}
                      {impactResult.investigation_type === 'batch' && impactResult.batch?.status === 'CONTAMINATED' && (
                        <div className="pt-8">
                          <RecallNotificationCenter result={impactResult} />
                        </div>
                      )}

                      <div className="border-t border-ui-border pt-12">
                        <ImpactSummary result={impactResult} simResult={simResult} />
                      </div>
                      
                      {impactResult.investigation_type === 'batch' && impactResult.batch && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
                          <RecallSimulator 
                            result={impactResult} 
                            onApplyRecall={handleApplyRecall}
                            isRecalling={isRecalling}
                            recallError={recallError}
                            onSimulationUpdate={setSimResult}
                          />
                          <ViewCypher result={impactResult} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  {activeType && activeId && (
                    <div className="sticky top-6">
                      <TraceAssist 
                        entityType={activeType}
                        entityId={activeId}
                        containmentKitchenId={simResult?.containment_kitchen_id}
                        isRecalled={impactResult?.batch?.status === 'CONTAMINATED'}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Layout>
      </div>
    </div>
  );
}

export default App;
