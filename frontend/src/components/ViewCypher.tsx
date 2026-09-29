import { useState } from 'react';
import type { InvestigationResponse } from '../api/types';

interface Props {
  result: InvestigationResponse | null;
}

export const ViewCypher: React.FC<Props> = ({ result }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!result) return null;

  return (
    <section className="mt-8 border-t border-ui-border pt-4">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="text-[10px] font-bold text-muted tracking-widest uppercase mb-2 cursor-pointer hover:text-ink transition-colors"
      >
        VIEW CYPHER {isOpen ? '▼' : '▶'}
      </div>
      
      {isOpen && (
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-[10px] text-muted font-bold tracking-widest uppercase mb-2">Parameterized Query</div>
            <pre className="text-[10px] font-mono text-ink bg-surface p-4 border border-ui-border overflow-x-auto whitespace-pre-wrap">
              {result.cypher}
            </pre>
          </div>
          <div>
            <div className="text-[10px] text-muted font-bold tracking-widest uppercase mb-2">Parameters</div>
            <pre className="text-[10px] font-mono text-ink bg-surface p-4 border border-ui-border overflow-x-auto">
              {JSON.stringify(result.parameters, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
};
