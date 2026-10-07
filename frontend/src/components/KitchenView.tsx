import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Package, Clock, MapPin, Bell, ChevronDown, Activity } from 'lucide-react';

interface Batch {
  id: string;
  ingredient: string;
  status: string;
  quantity: number;
  expiry_date?: string;
  received_date?: string;
}

interface Kitchen {
  id: string;
  name: string;
  city: string;
  location?: string;
}

interface RecallAction {
  stopProduction: boolean;
  quarantineInventory: boolean;
  disposeItems: boolean;
  confirmDisposal: boolean;
}

export const KitchenView: React.FC = () => {
  const [kitchenId, setKitchenId] = useState('K01');
  const [kitchenData, setKitchenData] = useState<Kitchen | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [actions, setActions] = useState<Record<string, RecallAction>>({});
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const pollBatches = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/investigate/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch_id: 'B002' }),
        });
        
        if (!response.ok) return;
        const data = await response.json();
        
        if (data.success) {
          const usesThisBatch = data.kitchens?.some((k: Kitchen) => k.id === kitchenId);
          
          if (usesThisBatch && data.batch) {
            const wasContaminated = batches.some(b => b.id === data.batch.id && b.status === 'CONTAMINATED');
            const nowContaminated = data.batch.status === 'CONTAMINATED';

            setBatches(prevBatches => {
              const existing = prevBatches.find(b => b.id === data.batch.id);
              if (existing) {
                return prevBatches.map(b => b.id === data.batch.id ? data.batch : b);
              } else {
                return [...prevBatches, data.batch];
              }
            });
            
            if (!wasContaminated && nowContaminated) {
              console.log('🚨 RECALL ALERT - Kitchen', kitchenId);
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⚠️ Batch Recall Alert', {
                  body: `Batch ${data.batch.id} has been recalled`,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    pollBatches();
    const interval = setInterval(pollBatches, 5000);
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    return () => clearInterval(interval);
  }, [kitchenId, isLoggedIn, batches]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/investigate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: 'B002' }),
      });
      
      if (!response.ok) throw new Error('Failed to connect');
      const data = await response.json();
      
      if (data.success && data.kitchens) {
        const kitchen = data.kitchens.find((k: Kitchen) => k.id === kitchenId);
        
        if (kitchen) {
          setKitchenData(kitchen);
          if (data.batch) setBatches([data.batch]);
          setIsLoggedIn(true);
        } else {
          alert(`Kitchen ${kitchenId} not found. Try: K01, K02, K03`);
        }
      }
    } catch (err) {
      alert('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setKitchenData(null);
    setBatches([]);
    setActions({});
  };

  const toggleAction = (batchId: string, action: keyof RecallAction) => {
    setActions(prev => ({
      ...prev,
      [batchId]: {
        ...(prev[batchId] || { stopProduction: false, quarantineInventory: false, disposeItems: false, confirmDisposal: false }),
        [action]: !(prev[batchId]?.[action] || false)
      }
    }));
  };

  const isAllActionsComplete = (batchId: string) => {
    const batchActions = actions[batchId];
    if (!batchActions) return false;
    return Object.values(batchActions).every(v => v === true);
  };

  const contaminatedBatches = batches.filter(b => b.status === 'CONTAMINATED');
  const safeBatches = batches.filter(b => b.status !== 'CONTAMINATED');

  if (!isLoggedIn) {
    return (
      <div className="h-full bg-canvas flex items-center justify-center">
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏪</div>
            <h1 className="text-4xl font-bold text-ink mb-2 font-mono tracking-tight">
              KITCHEN PARTNER
            </h1>
            <p className="text-muted text-sm uppercase tracking-widest font-bold">Manage inventory & compliance</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={kitchenId}
              onChange={(e) => setKitchenId(e.target.value.toUpperCase())}
              placeholder="ENTER KITCHEN ID"
              className="w-full px-4 py-3 border-2 border-ui-border bg-surface text-ink focus:outline-none focus:border-maroon transition-colors font-mono uppercase text-sm"
            />
            <button
              onClick={handleLogin}
              disabled={loading || !kitchenId}
              className="w-full bg-maroon hover:bg-burgundy text-white py-3.5 font-bold transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
            >
              {loading ? 'LOADING...' : 'ACCESS PORTAL →'}
            </button>
            <div className="flex gap-2">
              {['K01', 'K02', 'K03'].map(id => (
                <button key={id} onClick={() => setKitchenId(id)} className="flex-1 px-3 py-2 text-xs bg-surface border-2 border-ui-border hover:border-maroon text-ink font-mono font-bold transition-all uppercase">
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-canvas overflow-auto">
      {/* Header - Investigation Console Style */}
      <div className="bg-surface border-b-2 border-ui-border sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase">Kitchen Portal</h2>
              <p className="text-sm font-bold text-ink tracking-widest uppercase mt-1">{kitchenData?.name || kitchenId}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted mt-1 uppercase tracking-wide">
                <MapPin className="w-3 h-3" />
                {kitchenData?.city || 'Location'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-ui-bg border border-ui-border transition-colors"
              >
                <Bell className="w-5 h-5 text-ink" />
                {contaminatedBatches.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-critical rounded-full border border-surface"></span>
                )}
              </button>
              <button onClick={handleLogout} className="px-3 py-1.5 bg-surface hover:bg-ui-bg border border-ui-border text-ink text-[10px] font-bold tracking-widest uppercase transition-colors">
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="bg-surface border-b-2 border-ui-border">
          <div className="px-6 py-4">
            <h3 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-3 flex items-center justify-between">
              <span>NOTIFICATIONS</span>
              <button onClick={() => setShowNotifications(false)} className="text-ink hover:text-maroon">
                ✕
              </button>
            </h3>
            {contaminatedBatches.length > 0 ? (
              <div className="space-y-2">
                {contaminatedBatches.map(batch => (
                  <div key={batch.id} className="p-3 bg-critical-soft border-l-4 border-critical">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-critical flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-critical uppercase tracking-wide">🚨 BATCH RECALLED: {batch.id}</p>
                        <p className="text-xs text-ink font-mono mt-0.5">{batch.ingredient} - {batch.quantity} kg</p>
                        <button className="text-[10px] text-critical font-bold mt-1 uppercase tracking-wide hover:underline">TAKE ACTION →</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted font-mono uppercase">No alerts</p>
            )}
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-surface border border-ui-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-info" />
              <span className="text-2xl font-bold text-ink font-mono">{batches.length}</span>
            </div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Total Batches</p>
          </div>
          <div className={`border-2 p-4 ${contaminatedBatches.length > 0 ? 'bg-critical-soft border-critical' : 'bg-verified-soft border-verified'}`}>
            <div className="flex items-center gap-2 mb-2">
              {contaminatedBatches.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-critical" />
              ) : (
                <CheckCircle className="w-5 h-5 text-verified" />
              )}
              <span className={`text-2xl font-bold font-mono ${contaminatedBatches.length > 0 ? 'text-critical' : 'text-verified'}`}>
                {contaminatedBatches.length}
              </span>
            </div>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${contaminatedBatches.length > 0 ? 'text-critical' : 'text-verified'}`}>
              {contaminatedBatches.length > 0 ? 'RECALLED' : 'ALL CLEAR'}
            </p>
          </div>
          <div className="bg-surface border border-ui-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-verified" />
              <span className="text-2xl font-bold text-ink font-mono">{safeBatches.length}</span>
            </div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Safe Stock</p>
          </div>
        </div>

        {/* Batch Inventory */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-ink mb-4 uppercase tracking-widest">BATCH INVENTORY</h3>
          
          {batches.length === 0 ? (
            <div className="bg-surface border border-ui-border p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted" />
              <p className="text-muted font-mono text-xs uppercase tracking-wide">No batches found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => {
                const isContaminated = batch.status === 'CONTAMINATED';
                const isExpanded = selectedBatch === batch.id;
                const actionsComplete = isAllActionsComplete(batch.id);
                
                return (
                  <div key={batch.id} className={`bg-surface border-2 overflow-hidden ${isContaminated ? 'border-critical' : 'border-ui-border'}`}>
                    {/* Batch Header */}
                    <div className="p-4 border-b border-ui-border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-ink text-sm font-mono uppercase tracking-wide">{batch.id}</h4>
                          <p className="text-xs text-ink mt-1 uppercase tracking-wide">{batch.ingredient}</p>
                        </div>
                        {isContaminated ? (
                          <span className="px-3 py-1 bg-critical text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            CONTAMINATED
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-verified text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            SAFE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted font-mono uppercase tracking-wide">
                        <span>📦 {batch.quantity} kg</span>
                        {batch.received_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {batch.received_date}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Batch Details */}
                    <div className="p-4">
                      {isContaminated && (
                        <div className="p-3 bg-critical-soft border-l-4 border-critical mb-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-critical flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-critical mb-1 uppercase tracking-wide">⚠️ IMMEDIATE ACTION REQUIRED</p>
                              <p className="text-xs text-ink font-mono">This batch has been recalled. Follow safety protocol.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Batch Details Button */}
                      <button
                        onClick={() => setSelectedBatch(isExpanded ? null : batch.id)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-ui-bg hover:bg-canvas border border-ui-border transition-colors"
                      >
                        <span className="text-[10px] font-bold text-ink uppercase tracking-widest">BATCH DETAILS & ACTIONS</span>
                        <ChevronDown className={`w-4 h-4 text-ink transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Expanded Details & Actions */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-ui-border">
                          {isContaminated && (
                            <div className="mb-4">
                              <p className="text-[10px] font-bold text-muted mb-3 uppercase tracking-widest">COMPLIANCE CHECKLIST:</p>
                              <div className="space-y-2">
                                {[
                                  { key: 'stopProduction' as keyof RecallAction, label: 'Stop production using this batch', icon: '🛑' },
                                  { key: 'quarantineInventory' as keyof RecallAction, label: `Quarantine ${batch.quantity} kg inventory`, icon: '🔒' },
                                  { key: 'disposeItems' as keyof RecallAction, label: 'Dispose per safety protocol', icon: '🗑️' },
                                  { key: 'confirmDisposal' as keyof RecallAction, label: 'Generate compliance report', icon: '✅' },
                                ].map((action) => (
                                  <label key={action.key} className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                                    actions[batch.id]?.[action.key] ? 'bg-verified-soft border-verified' : 'bg-ui-bg border-ui-border hover:border-muted'
                                  }`}>
                                    <input
                                      type="checkbox"
                                      checked={actions[batch.id]?.[action.key] || false}
                                      onChange={() => toggleAction(batch.id, action.key)}
                                      className="w-4 h-4 accent-verified"
                                    />
                                    <span className="text-lg">{action.icon}</span>
                                    <span className={`text-xs flex-1 font-mono uppercase ${actions[batch.id]?.[action.key] ? 'text-verified line-through' : 'text-ink'}`}>
                                      {action.label}
                                    </span>
                                  </label>
                                ))}
                              </div>

                              {actionsComplete && (
                                <div className="mt-3 p-3 bg-verified-soft border-2 border-verified">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-verified" />
                                    <p className="text-[10px] font-bold text-verified uppercase tracking-widest">ALL ACTIONS COMPLETED! ✓</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="space-y-2 font-mono text-[10px] uppercase tracking-wide">
                            <div className="flex justify-between py-1">
                              <span className="text-muted">Batch ID</span>
                              <span className="font-bold text-ink">{batch.id}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-muted">Quantity</span>
                              <span className="font-bold text-ink">{batch.quantity} kg</span>
                            </div>
                            {batch.received_date && (
                              <div className="flex justify-between py-1">
                                <span className="text-muted">Received</span>
                                <span className="font-bold text-ink">{batch.received_date}</span>
                              </div>
                            )}
                            {batch.expiry_date && (
                              <div className="flex justify-between py-1">
                                <span className="text-muted">Expiry</span>
                                <span className="font-bold text-ink">{batch.expiry_date}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {!isContaminated && (
                      <div className="px-4 py-3 bg-ui-bg border-t border-ui-border">
                        <button className="text-[10px] font-bold text-maroon hover:text-burgundy uppercase tracking-widest">VIEW USAGE HISTORY →</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kitchen Info */}
        <div className="bg-surface border border-ui-border p-4 mb-20">
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">KITCHEN INFO</h3>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1">
              <span className="text-muted uppercase">Kitchen ID</span>
              <span className="font-bold text-ink">{kitchenData?.id}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted uppercase">Name</span>
              <span className="font-bold text-ink">{kitchenData?.name}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted uppercase">Location</span>
              <span className="font-bold text-ink">{kitchenData?.city}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

