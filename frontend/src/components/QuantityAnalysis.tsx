import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import QuantityFlowGraph from './QuantityFlowGraph';
import RecoveryTrackingMap from './RecoveryTrackingMap';
import { investigateEntity } from '../api/investigation';
import type { InvestigationResponse } from '../api/types';

interface KitchenQuantity {
  kitchen_id: string;
  kitchen_name: string;
  received: number;
  used: number;
  remaining: number;
  contaminated: number;
  status: string;
}

interface BatchBreakdown {
  batch_id: string;
  ingredient: string;
  initial_quantity: number;
  total_distributed: number;
  total_used: number;
  total_remaining: number;
  total_contaminated: number;
  unit: string;
  kitchens: KitchenQuantity[];
}

interface RecoverySimulation {
  success: boolean;
  batch_id: string;
  ingredient: string;
  total_contaminated: number;
  recoverable_quantity: number;
  waste_quantity: number;
  unit: string;
  recommended_partner: {
    id: string;
    name: string;
    type: string;
    location: string;
    rate_per_kg: number;
  } | null;
  estimated_recovery: number;
  transportation_cost: number;
  net_recovery: number;
  financial_impact: {
    original_batch_cost: number;
    contaminated_value_loss: number;
    recovery_value: number;
    transportation_cost: number;
    net_recovery: number;
    recovery_percentage: number;
    final_loss: number;
  };
  kitchens: {
    kitchen_id: string;
    kitchen_name: string;
    contaminated: number;
    used: number;
    remaining: number;
  }[];
}

const API_URL = 'http://127.0.0.1:8000';

export default function QuantityAnalysis() {
  const [batchId, setBatchId] = useState('B002');
  const [impactResult, setImpactResult] = useState<InvestigationResponse | null>(null);
  const [batchBreakdown, setBatchBreakdown] = useState<BatchBreakdown | null>(null);
  const [simulation, setSimulation] = useState<RecoverySimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    if (!batchId.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setHasAnalyzed(true);
      
      // Fetch investigation data (same as Investigation Console)
      const investigationData = await investigateEntity('Batch', batchId);
      setImpactResult(investigationData);
      
      // Fetch all data in parallel
      const [batchResponse, simulationResponse] = await Promise.all([
        fetch(`${API_URL}/api/quantity/batch/${batchId}`),
        fetch(`${API_URL}/api/quantity/recovery/simulate?batch_id=${batchId}`, { method: 'POST' })
      ]);
      
      if (!batchResponse.ok) throw new Error('Failed to fetch batch data');
      if (!simulationResponse.ok) throw new Error('Failed to simulate recovery');
      
      const batchData = await batchResponse.json();
      const simulationData = await simulationResponse.json();
      
      setBatchBreakdown(batchData);
      setSimulation(simulationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Build quantity graph from investigation data
  const buildQuantityGraph = () => {
    if (!impactResult || !batchBreakdown || !simulation) return { nodes: [], links: [] };

    try {
      const nodes: any[] = [];
      const links: any[] = [];

      // Add batch node
      nodes.push({
        id: impactResult.batch?.id || batchBreakdown.batch_id,
        label: impactResult.batch?.id || batchBreakdown.batch_id,
        type: 'batch',
        quantity: batchBreakdown.total_contaminated
      });

      // Add kitchen and inventory nodes from investigation data
      batchBreakdown.kitchens.forEach(kitchen => {
        // Kitchen node
        nodes.push({
          id: kitchen.kitchen_id,
          label: kitchen.kitchen_id,
          type: 'kitchen',
          status: kitchen.status
        });

        // Link from batch to kitchen with quantity
        links.push({
          source: impactResult.batch?.id || batchBreakdown.batch_id,
          target: kitchen.kitchen_id,
          quantity: kitchen.received,
          type: 'distributed'
        });

        // Inventory node (if contaminated)
        if (kitchen.contaminated > 0) {
          const invId = `INV_${kitchen.kitchen_id}`;
          nodes.push({
            id: invId,
            label: `${kitchen.remaining}kg`,
            type: 'inventory',
            quantity: kitchen.remaining,
            contaminated: kitchen.contaminated
          });

          // Link from kitchen to inventory
          links.push({
            source: kitchen.kitchen_id,
            target: invId,
            quantity: kitchen.contaminated,
            type: 'contaminated'
          });
        }
      });

      // DON'T add partner nodes - supplier will handle recovery directly

      return { nodes, links };
    } catch (error) {
      console.error('Error building quantity graph:', error);
      return { nodes: [], links: [] };
    }
  };

  const graphData = buildQuantityGraph();

  return (
    <div className="relative">
      {/* Investigation Console Style Header */}
      <section className="relative bg-surface border border-ui-border p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm mb-6">
        <div className="shrink-0">
          <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase">Quantity Analysis Console</h2>
          <p className="text-sm font-bold text-ink tracking-widest uppercase mt-1">Track Contaminated Quantities & Recovery</p>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="flex flex-1 items-end md:items-center justify-end gap-4 max-w-2xl">
          <div className="w-2/3">
            <input 
              type="text" 
              value={batchId}
              onChange={(e) => setBatchId(e.target.value.toUpperCase())}
              className="bg-canvas border border-ui-border px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-maroon rounded-none w-full font-mono uppercase transition-colors"
              placeholder="Enter Batch ID (e.g. B002)"
            />
          </div>
          <div className="w-1/3">
            <button 
              type="submit" 
              disabled={loading || !batchId.trim()}
              className="bg-maroon hover:bg-burgundy disabled:opacity-50 text-white px-4 py-2.5 font-bold tracking-widest uppercase text-[10px] transition-colors rounded-none w-full whitespace-nowrap flex items-center justify-center gap-2"
            >
              {loading ? 'ANALYZING...' : (
                <>
                  ANALYZE
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </form>
        
        {error && (
          <div className="absolute -bottom-6 right-0 text-[10px] text-critical font-mono font-bold tracking-widest uppercase">
            {error}
          </div>
        )}
      </section>

      {/* Main Content - Graph + Side Panels like Investigation Console */}
      {!loading && hasAnalyzed && impactResult && batchBreakdown && simulation && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
            {/* Left: Quantity Flow Graph */}
            <div className="space-y-6">
              {/* Quantity Graph with kg labels */}
              <div className="h-[calc(100vh-280px)] min-h-[600px] border border-ui-border bg-surface shadow-xl">
                <QuantityFlowGraph 
                  batchId={batchId}
                  nodes={graphData.nodes}
                  links={graphData.links}
                  recommendedPartnerId={simulation.recommended_partner?.id}
                />
              </div>

              {/* Summary Cards Below Graph */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface border border-ui-border p-4">
                  <div className="text-[10px] font-bold text-muted tracking-widest uppercase mb-2">Total Contaminated</div>
                  <div className="text-2xl font-bold text-critical">
                    {batchBreakdown.total_contaminated} {batchBreakdown.unit}
                  </div>
                </div>
                <div className="bg-surface border border-ui-border p-4">
                  <div className="text-[10px] font-bold text-muted tracking-widest uppercase mb-2">Recoverable Stock</div>
                  <div className="text-2xl font-bold text-accent">
                    {simulation.recoverable_quantity} {batchBreakdown.unit}
                  </div>
                </div>
                <div className="bg-surface border border-ui-border p-4">
                  <div className="text-[10px] font-bold text-muted tracking-widest uppercase mb-2">Already Wasted</div>
                  <div className="text-2xl font-bold text-ink">
                    {simulation.waste_quantity} {batchBreakdown.unit}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Supplier Recovery Info Panel */}
            <div className="space-y-6">
              {/* Supplier Recovery Card - No Financial Analysis */}
              <div className="bg-surface border border-ui-border p-6">
                <h3 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-4">Supplier Recovery</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-muted mb-1">Contaminated Material</div>
                    <div className="text-3xl font-bold text-critical">
                      {batchBreakdown.total_contaminated} {batchBreakdown.unit}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted mb-1">Recoverable (Unused Stock)</div>
                    <div className="text-2xl font-bold text-accent">
                      {simulation.recoverable_quantity} {batchBreakdown.unit}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted mb-1">Already Used (Waste)</div>
                    <div className="text-xl font-bold text-ink">
                      {simulation.waste_quantity} {batchBreakdown.unit}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-ui-border">
                    <div className="bg-canvas border border-ui-border p-3 rounded">
                      <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-3">Return Process</div>
                      <div className="space-y-2 text-xs text-muted">
                        <div className="flex items-start gap-2">
                          <span className="text-accent font-bold">•</span>
                          <span>Contaminated stock ({simulation.recoverable_quantity}kg) will be returned to supplier</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kitchen-wise Contamination Details */}
              <div className="bg-surface border border-ui-border p-6">
                <h3 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-4">Kitchen-wise Breakdown</h3>
                <div className="space-y-3">
                  {batchBreakdown.kitchens.map((kitchen) => (
                    <div
                      key={kitchen.kitchen_id}
                      className="bg-canvas border border-ui-border rounded p-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="font-bold text-ink text-sm">{kitchen.kitchen_name}</div>
                          <div className="text-[10px] text-muted">{kitchen.kitchen_id}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-muted mb-1">Contaminated</div>
                          <div className="font-bold text-critical">{kitchen.contaminated} kg</div>
                        </div>
                        <div>
                          <div className="text-muted mb-1">Remaining</div>
                          <div className="font-bold text-accent">{kitchen.remaining} kg</div>
                        </div>
                        <div>
                          <div className="text-muted mb-1">Used</div>
                          <div className="font-bold text-ink">{kitchen.used} kg</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Tracking Map - Below Graph */}
          <div className="mt-8">
            <RecoveryTrackingMap
              batchId={batchId}
              kitchens={simulation.kitchens}
              supplierLocation="Faridabad, Haryana"
              totalQuantity={simulation.recoverable_quantity}
            />
          </div>
        </>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20 bg-surface border border-ui-border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <div className="text-[10px] font-bold text-muted tracking-widest uppercase">Analyzing Quantities...</div>
          </div>
        </div>
      )}
    </div>
  );
}
