import { useState, useEffect } from 'react';
import type { InvestigationResponse, SimulateContainmentResponse } from '../api/types';
import { simulateContainment } from '../api/simulation';

interface Props {
  result: InvestigationResponse | null;
  onApplyRecall: () => Promise<void>;
  isRecalling: boolean;
  recallError: string | null;
  onSimulationUpdate: (sim: SimulateContainmentResponse | null) => void;
}

export const RecallSimulator: React.FC<Props> = ({ result, onApplyRecall, isRecalling, recallError, onSimulationUpdate }) => {
  const [selectedKitchen, setSelectedKitchen] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== RecallSimulator MOUNTED ===');
    console.log('Result:', result);
    console.log('Batch:', result?.batch);
    console.log('Kitchens:', result?.kitchens);
  }, []);

  if (!result || !result.batch || result.batch.status === 'CONTAMINATED') return null;

    const handleSimulate = async () => {
    if (!selectedKitchen) {
      console.error('No kitchen selected!');
      return;
    }
    
    console.log('=== handleSimulate() CALLED ===');
    setIsSimulating(true);
    setSimError(null);
    
    try {
      console.log('=== Starting Simulation ===');
      console.log('Batch ID:', result.batch!.id);
      console.log('Kitchen ID:', selectedKitchen);
      
      const simResult = await simulateContainment({ batch_id: result.batch!.id, kitchen_id: selectedKitchen });
      
      console.log('=== Simulation API Response ===');
      console.log('Success:', simResult.success);
      console.log('Contained kitchens:', simResult.contained.kitchens);
      console.log('Remaining kitchens:', simResult.remaining.kitchens);
      console.log('Selected kitchen city:', simResult.contained.kitchens[0]?.city);
      
      console.log('=== Calling onSimulationUpdate ===');
      onSimulationUpdate(simResult);
      
      console.log('=== Simulation Update Complete ===');
    } catch (err: any) {
      console.error('Simulation error:', err);
      setSimError(err.message || 'Simulation failed');
      onSimulationUpdate(null);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetSim = () => {
    setSelectedKitchen('');
    onSimulationUpdate(null);
  };

  return (
    <section className="bg-surface border-2 border-ui-border p-8 shadow-lg">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-ui-border">
        <div className="w-3 h-3 rounded-full bg-simulation animate-pulse"></div>
        <h2 className="text-sm font-bold text-ink tracking-widest uppercase">
          Operational Simulation
        </h2>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xs font-bold text-ink uppercase tracking-widest mb-2">Counterfactual Containment</h3>
        <p className="text-[10px] text-muted leading-relaxed">
          Simulate early containment at a specific kitchen to assess impact reduction.
        </p>
      </div>
      
      <div className="mb-8 border-2 border-simulation bg-simulation-soft/20 p-6 rounded-sm">
        <label className="block text-[11px] font-bold text-simulation uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="text-simulation">?</span>
          Select Containment Point
        </label>
        <div className="flex flex-col gap-4">
          <select 
            value={selectedKitchen}
            onChange={(e) => {
              console.log('=== DROPDOWN CHANGED ===');
              console.log('Selected value:', e.target.value);
              setSelectedKitchen(e.target.value);
            }}
            className="w-full bg-surface border-2 border-ui-border px-4 py-3 text-sm text-ink focus:outline-none focus:border-simulation font-mono uppercase transition-colors hover:border-simulation/50"
          >
            <option value="">??? Select Kitchen ???</option>
            {Array.from(new Set(result.kitchens.map(k => k.city || 'Unknown'))).sort().map(city => (
              <optgroup key={city} label={`??? ${city.toUpperCase()} ???`}>
                {result.kitchens
                  .filter(k => (k.city || 'Unknown') === city)
                  .map(k => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.id})
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('=== SIMULATE BUTTON CLICKED ===');
                console.log('Selected Kitchen:', selectedKitchen);
                console.log('Batch ID:', result?.batch?.id);
                console.log('isSimulating:', isSimulating);
                if (selectedKitchen && !isSimulating) {
                  handleSimulate();
                } else {
                  console.log('Button click ignored - conditions not met');
                }
              }}
              disabled={!selectedKitchen || isSimulating}
              className="flex-1 bg-simulation hover:bg-simulation/80 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 font-bold text-xs tracking-widest uppercase transition-all cursor-pointer border-2 border-transparent hover:border-simulation disabled:hover:border-transparent"
              style={{ pointerEvents: 'auto' }}
            >
              {isSimulating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  SIMULATING...
                </span>
              ) : (
                '? RUN SIMULATION'
              )}
            </button>
            <button 
              type="button"
              onClick={() => {
                console.log('=== RESET BUTTON CLICKED ===');
                handleResetSim();
              }}
              className="px-5 bg-surface text-ink font-bold text-xs tracking-widest uppercase hover:bg-ui-border transition-colors border-2 border-ui-border hover:border-ink"
            >
              ? RESET
            </button>
          </div>
        </div>
        
        {simError && (
          <div className="mt-4 p-3 bg-critical/10 border-2 border-critical">
            <div className="text-[10px] text-critical font-bold font-mono tracking-widest uppercase">
              ? {simError}
            </div>
          </div>
        )}
      </div>

      <div className="border-t-2 border-ui-border pt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-critical"></div>
          <h3 className="text-xs font-bold text-ink uppercase tracking-widest">Execute Recall</h3>
        </div>
        <p className="text-[10px] text-muted mb-6 leading-relaxed">
          Mark this batch as contaminated and update all connected entities in the graph database.
        </p>
        <button 
          onClick={onApplyRecall}
          disabled={isRecalling}
          className="bg-critical hover:bg-maroon disabled:opacity-50 text-white px-8 py-4 font-bold tracking-widest uppercase text-xs transition-all w-full border-2 border-transparent hover:border-white disabled:hover:border-transparent shadow-lg hover:shadow-xl"
        >
          {isRecalling ? '? EXECUTING RECALL...' : '? APPLY RECALL'}
        </button>
      </div>
      {recallError && (
        <div className="mt-4 p-3 bg-critical/10 border-2 border-critical">
          <div className="text-[10px] text-critical font-bold font-mono tracking-widest uppercase">
            ? {recallError}
          </div>
        </div>
      )}
    </section>
  );
};
