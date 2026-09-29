import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw, Database } from 'lucide-react';

interface StatusEntity {
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  status: string;
  reason: string;
  timestamp: string;
  updated_by: string | null;
}

interface StatusAuditResponse {
  success: boolean;
  count: number;
  entities: StatusEntity[];
}

export const StatusDashboard: React.FC = () => {
  const [statusData, setStatusData] = useState<StatusAuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchStatusAudit();
    const interval = setInterval(fetchStatusAudit, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatusAudit = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/status/audit');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStatusData(data);
      setError(null);
      setLoading(false);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Status audit fetch error:', err);
      setError(`Failed to fetch status data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon mx-auto mb-4"></div>
          <div className="text-muted font-mono text-xs tracking-widest uppercase">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !statusData) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="max-w-md text-center">
          <XCircle className="w-16 h-16 text-critical mx-auto mb-4" />
          <div className="text-ink font-bold text-sm uppercase tracking-widest mb-2">Connection Error</div>
          <div className="text-muted text-xs font-mono mb-6">{error || 'No data available'}</div>
          <button
            onClick={fetchStatusAudit}
            className="px-6 py-2.5 bg-maroon text-white font-bold text-[10px] uppercase tracking-widest hover:bg-burgundy transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const countByStatus = {
    RECALLED: statusData.entities.filter(e => e.status === 'RECALLED').length,
    QUARANTINED: statusData.entities.filter(e => e.status === 'QUARANTINED').length,
    FLAGGED: statusData.entities.filter(e => e.status === 'FLAGGED').length,
    SUSPENDED: statusData.entities.filter(e => e.status === 'SUSPENDED').length,
  };

  const totalCritical = countByStatus.RECALLED + countByStatus.SUSPENDED;
  const hasActiveIncidents = statusData.count > 0;

  const getStatusColor = (status: string) => {
    const colors = {
      RECALLED: 'text-critical',
      QUARANTINED: 'text-[#FF6B35]',
      FLAGGED: 'text-[#F7B801]',
      SUSPENDED: 'text-[#9B59B6]',
    };
    return colors[status as keyof typeof colors] || 'text-muted';
  };

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">
      {/* Simple Header Bar */}
      <div className="bg-surface border-b border-ui-border px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase">Real-Time Monitoring</h2>
          <p className="text-sm font-bold text-ink tracking-widest uppercase mt-1">System Status</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] text-muted tracking-widest uppercase font-bold">Last Updated</div>
            <div className="text-xs font-mono text-ink font-bold mt-0.5">
              {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
          <button
            onClick={fetchStatusAudit}
            className="p-2 border border-ui-border hover:border-maroon transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-ink" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto px-8 py-8">
        
        {/* Status Overview - Grid Boxes */}
        <div className="mb-12">
          <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-6 pb-2 border-b border-ui-border">
            Status Overview
          </h2>
          
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-surface border border-ui-border p-6">
              <div className="font-bold font-mono text-5xl mb-3 text-critical">
                {String(countByStatus.RECALLED).padStart(2, '0')}
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Recalled</div>
            </div>
            <div className="bg-surface border border-ui-border p-6">
              <div className="font-bold font-mono text-5xl mb-3 text-[#9B59B6]">
                {String(countByStatus.SUSPENDED).padStart(2, '0')}
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Suspended</div>
            </div>
            <div className="bg-surface border border-ui-border p-6">
              <div className="font-bold font-mono text-5xl mb-3 text-[#F7B801]">
                {String(countByStatus.FLAGGED).padStart(2, '0')}
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Flagged</div>
            </div>
            <div className="bg-surface border border-ui-border p-6">
              <div className="font-bold font-mono text-5xl mb-3 text-[#FF6B35]">
                {String(countByStatus.QUARANTINED).padStart(2, '0')}
              </div> 
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted">Quarantined</div>
            </div>
          </div>
        </div>

        {/* Incident List */}
        {hasActiveIncidents && (
          <div>
            <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-6 pb-2 border-b border-ui-border">
              Active Incidents ({statusData.count})
            </h2>
            <div className="space-y-4">
              {statusData.entities.map((entity, index) => (
                <div
                  key={index}
                  className="bg-surface border border-ui-border p-6 hover:border-maroon transition-colors"
                >
                  {/* Entity Header */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-2xl font-bold font-mono text-ink">{entity.entity_id}</div>
                    {entity.entity_name && (
                      <div className="text-sm text-ink font-medium uppercase tracking-wider">{entity.entity_name}</div>
                    )}
                  </div>

                  {/* Status & Type */}
                  <div className="text-[10px] font-mono text-muted flex gap-6 mb-4 uppercase tracking-widest">
                    <div>
                      <span className="font-bold text-ink">TYPE:</span> {entity.entity_type}
                    </div>
                    <div>
                      <span className="font-bold text-ink">STATUS:</span>{' '}
                      <span className={`font-bold ${getStatusColor(entity.status)}`}>
                        {entity.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-ink">TIME:</span> {new Date(entity.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="bg-canvas border-l-2 border-critical p-4">
                    <div className="text-[10px] font-bold text-muted tracking-widest uppercase mb-2">Reason</div>
                    <p className="text-sm text-ink leading-relaxed">{entity.reason}</p>
                  </div>

                  {entity.updated_by && (
                    <div className="text-[10px] text-muted font-mono mt-3 uppercase tracking-widest">
                      Updated by {entity.updated_by}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Incidents */}
        {!hasActiveIncidents && (
          <div className="text-center py-20">
            <CheckCircle className="w-16 h-16 text-verified mx-auto mb-4" />
            <h3 className="text-sm font-bold text-ink tracking-widest uppercase mb-2">
              All Systems Operational
            </h3>
            <p className="text-[10px] text-muted font-mono tracking-wider uppercase">
              No active incidents detected
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
