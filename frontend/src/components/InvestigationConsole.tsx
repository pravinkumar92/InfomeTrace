import { useState } from 'react';
import type { FormEvent } from 'react';

interface Props {
  onInvestigate: (entityType: string, entityId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const InvestigationConsole: React.FC<Props> = ({ onInvestigate, isLoading, error }) => {
  const [entityType, setEntityType] = useState('Batch');
  const [entityId, setEntityId] = useState('B002');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (entityId.trim()) {
      onInvestigate(entityType, entityId.trim());
    }
  };

  return (
    <section className="relative bg-surface border border-ui-border p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
      <div className="shrink-0">
        <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase">Investigation Console</h2>
        <p className="text-sm font-bold text-ink tracking-widest uppercase mt-1">Trace An Incident</p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-1 items-end md:items-center justify-end gap-4 max-w-2xl">
        <div className="w-1/3">
          <select 
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="bg-canvas border border-ui-border px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-maroon rounded-none w-full font-mono uppercase transition-colors"
          >
            <option value="Batch">Batch</option>
            <option value="Order">Order</option>
            <option value="Customer">Customer</option>
          </select>
        </div>
        <div className="w-1/3">
          <input 
            type="text" 
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="bg-canvas border border-ui-border px-3 py-2.5 text-xs text-ink focus:outline-none focus:border-maroon rounded-none w-full font-mono uppercase transition-colors"
            placeholder={entityType === 'Order' ? 'e.g. O07' : entityType === 'Customer' ? 'e.g. C01' : 'e.g. B002'}
          />
        </div>
        <div className="w-1/3">
          <button 
            type="submit" 
            disabled={isLoading || !entityId.trim()}
            className="bg-maroon hover:bg-burgundy disabled:opacity-50 text-white px-4 py-2.5 font-bold tracking-widest uppercase text-[10px] transition-colors rounded-none w-full whitespace-nowrap"
          >
            {isLoading ? 'RUNNING...' : 'INVESTIGATE →'}
          </button>
        </div>
      </form>
      {error && (
        <div className="absolute -bottom-6 right-0 text-[10px] text-critical font-mono font-bold tracking-widest uppercase">
          {error}
        </div>
      )}
    </section>
  );
};
