import type { InvestigationResponse, SimulateContainmentResponse } from '../api/types';

interface Props {
  result: InvestigationResponse;
  simResult?: SimulateContainmentResponse | null;
}

export const ImpactSummary: React.FC<Props> = ({ result, simResult }) => {
  // Handle different investigation types
  const investigationType = result.investigation_type || 'batch';
  
  console.log('ImpactSummary: investigationType:', investigationType);
  console.log('ImpactSummary: result:', result);
  
  // Get impact data based on investigation type
  const getImpactCounts = () => {
    if (simResult) {
      return simResult.remaining.counts;
    }
    
    if (investigationType === 'order') {
      const orderData = result as any;
      return {
        dishes: orderData.dishes?.length || 0,
        kitchens: orderData.kitchens?.length || 0,
        batches: orderData.batches?.length || 0,
        suppliers: orderData.suppliers?.length || 0,
        orders: 1,
        customers: 1
      };
    } else if (investigationType === 'customer') {
      const customerData = result as any;
      return {
        orders: customerData.orders?.length || 0,
        dishes: customerData.dishes?.length || 0,
        kitchens: customerData.kitchens?.length || 0,
        batches: customerData.batches?.length || 0,
        suppliers: customerData.suppliers?.length || 0,
        customers: 1
      };
    } else {
      // Batch investigation
      return {
        ...result.impact,
        batches: 0,
        suppliers: 0
      };
    }
  };

  const impactCounts = getImpactCounts();

  return (
    <section>
      {/* Investigation Target */}
      <div className="mb-12">
        <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-4 pb-2 border-b border-ui-border">Investigation Target</h2>
        
        {investigationType === 'batch' && result.batch && (
          <>
            <div className="flex items-baseline gap-4">
              <div className="text-4xl font-bold font-mono text-ink">{result.batch.id}</div>
              <div className="text-sm text-ink font-medium uppercase tracking-wider">{result.batch.ingredient}</div>
            </div>
            <div className="text-[10px] font-mono text-muted flex gap-6 mt-3 uppercase tracking-widest">
              <div><span className="font-bold text-ink">RCVD:</span> {result.batch.received_date}</div>
              <div><span className="font-bold text-ink">EXP:</span> {result.batch.expiry_date}</div>
              <div>
                <span className="font-bold text-ink">STATUS: </span> 
                <span className={result.batch.status === 'SAFE' ? 'text-verified font-bold' : 'text-critical font-bold'}>
                  {result.batch.status}
                </span>
              </div>
            </div>
          </>
        )}

        {investigationType === 'order' && (result as any).order && (
          <>
            <div className="flex items-baseline gap-4">
              <div className="text-4xl font-bold font-mono text-ink">{(result as any).order.id}</div>
              <div className="text-sm text-ink font-medium uppercase tracking-wider">Order Investigation</div>
            </div>
            <div className="text-[10px] font-mono text-muted flex gap-6 mt-3 uppercase tracking-widest">
              <div><span className="font-bold text-ink">PLACED:</span> {(result as any).order.timestamp?.substring(0,10)}</div>
              <div>
                <span className="font-bold text-ink">STATUS: </span> 
                <span className="text-verified font-bold">{(result as any).order.status}</span>
              </div>
              {(result as any).customer && (
                <div><span className="font-bold text-ink">CUSTOMER:</span> {(result as any).customer.name}</div>
              )}
            </div>
          </>
        )}

        {investigationType === 'customer' && (result as any).customer && (
          <>
            <div className="flex items-baseline gap-4">
              <div className="text-4xl font-bold font-mono text-ink">{(result as any).customer.id}</div>
              <div className="text-sm text-ink font-medium uppercase tracking-wider">{(result as any).customer.name}</div>
            </div>
            <div className="text-[10px] font-mono text-muted flex gap-6 mt-3 uppercase tracking-widest">
              <div><span className="font-bold text-ink">CITY:</span> {(result as any).customer.city}</div>
              <div><span className="font-bold text-ink">ORDERS:</span> {(result as any).orders?.length || 0}</div>
            </div>
          </>
        )}
      </div>

      {/* Impact Summary */}
      <h3 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-6 border-b border-ui-border pb-2">
        {simResult ? (
          <div className="flex gap-12">
            <span className="text-ink">Live Impact</span>
            <span className="text-simulation">Simulated Remaining (Read Only)</span>
          </div>
        ) : investigationType === 'batch' ? 'Downstream Impact' : 'Supply Chain Traceability'}
      </h3>
      
      <div className="flex gap-12 text-ink mb-12 flex-wrap">
        {/* Show different metrics based on investigation type */}
        {investigationType === 'batch' && (
          <>
            <div>
              <div className="font-bold font-mono text-6xl mb-2 flex items-baseline gap-4">
                {simResult && <span className="text-3xl text-muted line-through">{String(result.impact.kitchens).padStart(2, '0')}</span>}
                <span className={simResult ? 'text-simulation' : ''}>
                  {String(impactCounts.kitchens).padStart(2, '0')}
                </span>
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Kitchens</div>
            </div>
            <div>
              <div className="font-bold font-mono text-6xl mb-2 flex items-baseline gap-4">
                {simResult && <span className="text-3xl text-muted line-through">{String(result.impact.dishes).padStart(2, '0')}</span>}
                <span className={simResult ? 'text-simulation' : ''}>
                  {String(impactCounts.dishes).padStart(2, '0')}
                </span>
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Dishes</div>
            </div>
            <div>
              <div className="font-bold font-mono text-6xl mb-2 flex items-baseline gap-4">
                {simResult && <span className="text-3xl text-muted line-through">{String(result.impact.orders).padStart(2, '0')}</span>}
                <span className={simResult ? 'text-simulation' : ''}>
                  {String(impactCounts.orders).padStart(2, '0')}
                </span>
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Orders</div>
            </div>
            <div>
              <div className="font-bold font-mono text-6xl mb-2 flex items-baseline gap-4">
                {simResult && <span className="text-3xl text-muted line-through">{String(result.impact.customers).padStart(2, '0')}</span>}
                <span className={simResult ? 'text-simulation' : ''}>
                  {String(impactCounts.customers).padStart(2, '0')}
                </span>
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Customers</div>
            </div>
          </>
        )}

        {investigationType === 'order' && (
          <>
            <div>
              <div className="font-bold font-mono text-6xl mb-2">{String(impactCounts.dishes).padStart(2, '0')}</div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Dishes</div>
            </div>
            <div>
              <div className="font-bold font-mono text-6xl mb-2">{String(impactCounts.kitchens).padStart(2, '0')}</div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Kitchens</div>
            </div>
            <div>
              <div className="font-bold font-mono text-6xl mb-2">{String(impactCounts.batches).padStart(2, '0')}</div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Batches</div>
            </div>
            <div>
              <div className="font-bold font-mono text-6xl mb-2">{String(impactCounts.suppliers).padStart(2, '0')}</div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Suppliers</div>
            </div>
          </>
        )}

        {investigationType === 'customer' && (
          <>
            <div>
              <div className="font-bold font-mono text-6xl mb-2">{String(impactCounts.orders).padStart(2, '0')}</div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Orders</div>
            </div>
            <div>
              <div className="font-bold font-mono text-6xl mb-2">{String(impactCounts.dishes).padStart(2, '0')}</div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Dishes</div>
            </div>
            <div>
              <div className="font-bold font-mono text-6xl mb-2">{String(impactCounts.kitchens).padStart(2, '0')}</div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Kitchens</div>
            </div>
            <div>
              <div className="font-bold font-mono text-6xl mb-2">{String(impactCounts.batches).padStart(2, '0')}</div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Batches</div>
            </div>
          </>
        )}
      </div>
      
      {/* Operational Actions */}
      {investigationType === 'batch' && (
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-ui-border">
            <div className="w-3 h-3 rounded-full bg-accent"></div>
            <h3 className="text-sm font-bold text-ink tracking-widest uppercase">Operational Actions Required</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border-2 border-ui-border p-6 hover:border-accent transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <span className="text-lg">🏭</span>
                </div>
                <div className="text-3xl font-bold font-mono text-accent">{String(impactCounts.kitchens).padStart(2, '0')}</div>
              </div>
              <div className="text-xs font-bold text-ink uppercase tracking-wider leading-relaxed">
                Kitchens requiring operational review
              </div>
            </div>

            <div className="bg-surface border-2 border-ui-border p-6 hover:border-accent transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <span className="text-lg">🍽️</span>
                </div>
                <div className="text-3xl font-bold font-mono text-accent">{String(impactCounts.dishes).padStart(2, '0')}</div>
              </div>
              <div className="text-xs font-bold text-ink uppercase tracking-wider leading-relaxed">
                Dishes requiring menu suppression
              </div>
            </div>

            <div className="bg-surface border-2 border-ui-border p-6 hover:border-accent transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <span className="text-lg">📦</span>
                </div>
                <div className="text-3xl font-bold font-mono text-accent">{String(impactCounts.orders).padStart(2, '0')}</div>
              </div>
              <div className="text-xs font-bold text-ink uppercase tracking-wider leading-relaxed">
                Customer orders potentially affected
              </div>
            </div>

            <div className="bg-surface border-2 border-ui-border p-6 hover:border-accent transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <span className="text-lg">👤</span>
                </div>
                <div className="text-3xl font-bold font-mono text-accent">{String(impactCounts.customers).padStart(2, '0')}</div>
              </div>
              <div className="text-xs font-bold text-ink uppercase tracking-wider leading-relaxed">
                Customers requiring notification
              </div>
            </div>
          </div>
        </div>
      )}

      {investigationType === 'order' && (
        <div className="max-w-2xl">
          <h3 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-4 border-b border-ui-border pb-2">Supply Chain Details</h3>
          <div className="space-y-3 text-xs text-ink font-mono uppercase tracking-wider bg-surface p-6 border border-ui-border">
            <div className="flex justify-between border-b border-ui-border pb-2">
              <span>Dishes in this order</span>
              <span className="font-bold">{impactCounts.dishes}</span>
            </div>
            <div className="flex justify-between border-b border-ui-border pb-2">
              <span>Kitchens involved</span>
              <span className="font-bold">{impactCounts.kitchens}</span>
            </div>
            <div className="flex justify-between border-b border-ui-border pb-2">
              <span>Ingredient batches traced</span>
              <span className="font-bold">{impactCounts.batches}</span>
            </div>
            <div className="flex justify-between">
              <span>Suppliers identified</span>
              <span className="font-bold">{impactCounts.suppliers}</span>
            </div>
          </div>
        </div>
      )}

      {investigationType === 'customer' && (
        <div className="max-w-2xl">
          <h3 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-4 border-b border-ui-border pb-2">Customer Activity Summary</h3>
          <div className="space-y-3 text-xs text-ink font-mono uppercase tracking-wider bg-surface p-6 border border-ui-border">
            <div className="flex justify-between border-b border-ui-border pb-2">
              <span>Total orders placed</span>
              <span className="font-bold">{impactCounts.orders}</span>
            </div>
            <div className="flex justify-between border-b border-ui-border pb-2">
              <span>Unique dishes ordered</span>
              <span className="font-bold">{impactCounts.dishes}</span>
            </div>
            <div className="flex justify-between border-b border-ui-border pb-2">
              <span>Kitchens serviced from</span>
              <span className="font-bold">{impactCounts.kitchens}</span>
            </div>
            <div className="flex justify-between">
              <span>Ingredient batches traced</span>
              <span className="font-bold">{impactCounts.batches}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
