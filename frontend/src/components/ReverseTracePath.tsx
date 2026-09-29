import type { TraceOriginResponse } from '../api/types';

interface Props {
  result: TraceOriginResponse;
  onExpandImpact: (batchId: string) => void;
}

export const ReverseTracePath: React.FC<Props> = ({ result, onExpandImpact }) => {
  const batchNode = result.path.find(p => p.label === 'Batch');

  const getRelationshipText = (index: number, path: any[]) => {
    if (index === path.length - 1) return null;
    const current = path[index];
    const next = path[index + 1];
    
    if (current.label === 'Customer' && next.label === 'Order') return 'PLACED';
    if (current.label === 'Order' && next.label === 'Dish') return 'ORDERED AS';
    if (current.label === 'Dish' && next.label === 'Kitchen') return 'USED IN';
    if (current.label === 'Kitchen' && next.label === 'Batch') return 'DELIVERED TO';
    if (current.label === 'Batch' && next.label === 'Supplier') return 'SUPPLIED BY';
    
    return 'CONNECTED TO';
  };

  return (
    <section className="text-center mt-12 mb-24">
      <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-12 border-b border-ui-border pb-2 inline-block">Root Cause Trace</h2>
      
      <div className="space-y-2">
        {result.path.map((node, i) => (
          <div key={node.id} className="flex flex-col items-center">
            <div className={`px-6 py-4 font-mono text-sm border-2 ${node.label === 'Batch' ? 'border-maroon text-maroon bg-maroon-soft' : 'border-ink text-ink bg-surface'}`}>
              <span className="font-bold">{node.id}</span>
              <span className="text-[10px] uppercase tracking-widest ml-4 font-sans opacity-70">{node.label}</span>
              {node.name && <div className="text-xs font-sans mt-2 opacity-80">{node.name}</div>}
            </div>
            
            {i < result.path.length - 1 && (
              <div className="text-[10px] font-bold text-muted my-6 tracking-widest uppercase">
                ↓ {getRelationshipText(i, result.path)}
              </div>
            )}
          </div>
        ))}
      </div>

      {batchNode && (
        <div className="mt-20 pt-12 border-t border-ui-border">
          <p className="text-sm text-ink mb-8 font-mono">
            Origin traced to <strong className="text-maroon border-b border-maroon">{batchNode.id}</strong>.
          </p>
          <button 
            onClick={() => onExpandImpact(batchNode.id)}
            className="bg-ink hover:bg-muted text-white px-8 py-4 font-bold tracking-widest uppercase text-[10px] transition-colors rounded-none"
          >
            Expand Full Impact Scope →
          </button>
        </div>
      )}
    </section>
  );
};
