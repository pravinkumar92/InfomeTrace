import { useState, useEffect, useMemo } from 'react';
import { MapPin, Clock, Star, Bell, AlertTriangle, Package, ChevronDown } from 'lucide-react';

interface CustomerData {
  id: string;
  name: string;
  phone?: string;
  city: string;
}

interface Order {
  id: string;
  timestamp: string;
  status: string;
}

interface Batch {
  id: string;
  ingredient: string;
  status: string;
  quantity: number;
}

interface Dish {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
}

interface Kitchen {
  id: string;
  name: string;
  city: string;
}

export const CustomerView: React.FC = () => {
  const [customerId, setCustomerId] = useState('C01');
  const [customerData, setCustomData] = useState<CustomerData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [recallMessage, setRecallMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderBatchMap, setOrderBatchMap] = useState<Record<string, string[]>>({});

  const orderDishMap = useMemo(() => {
    const mapping: Record<string, Dish[]> = {};
    orders.forEach((order, idx) => {
      const startIdx = (idx * 2) % dishes.length;
      mapping[order.id] = dishes.slice(startIdx, startIdx + 2);
    });
    return mapping;
  }, [orders, dishes]);

  useEffect(() => {
    if (!isLoggedIn || !customerId) return;

    const pollCustomerData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/investigate/customer?customer_id=${customerId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) return;
        const data = await response.json();
        
        if (data.success) {
          if (data.customer) setCustomData(data.customer);
          if (data.dishes) setDishes(data.dishes);
          if (data.kitchens) setKitchens(data.kitchens);
          if (data.orders) setOrders(data.orders);
          
          if (data.batches && data.batches.length > 0) {
            const prevContaminated = batches.some(b => b.status === 'CONTAMINATED');
            setBatches(data.batches);
            const nowContaminated = data.batches.some((b: Batch) => b.status === 'CONTAMINATED');
            
            if (!prevContaminated && nowContaminated) {
              const contaminatedBatch = data.batches.find((b: Batch) => b.status === 'CONTAMINATED');
              if (contaminatedBatch) fetchRecallMessage(contaminatedBatch.id);
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const fetchRecallMessage = async (batchId: string) => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/recall/verify/${batchId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.customer_notifications?.[0]?.notification_content) {
            setRecallMessage(data.customer_notifications[0].notification_content);
          }
        }
      } catch (err) {
        // Silent fail
      }
    };

    pollCustomerData();
    const interval = setInterval(pollCustomerData, 5000);
    return () => clearInterval(interval);
  }, [customerId, isLoggedIn, batches]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/investigate/customer?customer_id=${customerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Customer not found');
      const data = await response.json();
      
      if (data.success && data.customer) {
        setCustomData(data.customer);
        setOrders(data.orders || []);
        setDishes(data.dishes || []);
        setKitchens(data.kitchens || []);
        setBatches(data.batches || []);
        
        const mapping: Record<string, string[]> = {};
        const safeBatches = (data.batches || []).filter((b: Batch) => b.status !== 'CONTAMINATED');
        const contaminatedBatches = (data.batches || []).filter((b: Batch) => b.status === 'CONTAMINATED');
        
        (data.orders || []).forEach((order: Order, idx: number) => {
          if (idx === 0 && safeBatches.length > 0) {
            mapping[order.id] = safeBatches.map((b: Batch) => b.id);
          } else if (contaminatedBatches.length > 0) {
            mapping[order.id] = contaminatedBatches.map((b: Batch) => b.id);
          } else {
            mapping[order.id] = safeBatches.map((b: Batch) => b.id);
          }
        });
        
        setOrderBatchMap(mapping);
        if (contaminatedBatches.length > 0) {
          fetchRecallMessage(contaminatedBatches[0].id);
        }
        setIsLoggedIn(true);
      } else {
        alert('Customer not found. Try: C01, C02, C03');
      }
    } catch (err) {
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecallMessage = async (batchId: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/recall/verify/${batchId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.customer_notifications?.[0]?.notification_content) {
          setRecallMessage(data.customer_notifications[0].notification_content);
        }
      }
    } catch (err) {
      // Silent fail
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCustomData(null);
    setOrders([]);
    setBatches([]);
    setDishes([]);
    setKitchens([]);
    setRecallMessage(null);
    setOrderBatchMap({});
  };

  const isOrderContaminated = (orderId: string): boolean => {
    const orderBatchIds = orderBatchMap[orderId] || [];
    return orderBatchIds.some(batchId => batches.some(b => b.id === batchId && b.status === 'CONTAMINATED'));
  };

  const getOrderContaminatedBatches = (orderId: string): Batch[] => {
    const orderBatchIds = orderBatchMap[orderId] || [];
    return batches.filter(b => orderBatchIds.includes(b.id) && b.status === 'CONTAMINATED');
  };

  const contaminatedBatches = batches.filter(b => b.status === 'CONTAMINATED');
  const hasAnyRecall = contaminatedBatches.length > 0;

  if (!isLoggedIn) {
    return (
      <div className="h-full bg-canvas flex items-center justify-center">
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🍽️</div>
            <h1 className="text-4xl font-bold text-ink mb-2 font-mono tracking-tight">
              CUSTOMER PORTAL
            </h1>
            <p className="text-muted text-sm uppercase tracking-widest font-bold">Your orders, tracked safely</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value.toUpperCase())}
              placeholder="ENTER CUSTOMER ID"
              className="w-full px-4 py-3 border-2 border-ui-border bg-surface text-ink focus:outline-none focus:border-maroon transition-colors font-mono uppercase text-sm"
            />
            <button
              onClick={handleLogin}
              disabled={loading || !customerId}
              className="w-full bg-maroon hover:bg-burgundy text-white py-3.5 font-bold transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
            >
              {loading ? 'LOADING...' : 'ACCESS PORTAL →'}
            </button>
            <div className="flex gap-2">
              {['C01', 'C02', 'C03'].map(id => (
                <button key={id} onClick={() => setCustomerId(id)} className="flex-1 px-3 py-2 text-xs bg-surface border-2 border-ui-border hover:border-maroon text-ink font-mono font-bold transition-all uppercase">
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
              <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase">Customer Portal</h2>
              <p className="text-sm font-bold text-ink tracking-widest uppercase mt-1">{customerData?.name || customerId}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted mt-1 uppercase tracking-wide">
                <MapPin className="w-3 h-3" />
                {customerData?.city || 'Your Location'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-ui-bg border border-ui-border transition-colors"
              >
                <Bell className="w-5 h-5 text-ink" />
                {hasAnyRecall && (
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
            {hasAnyRecall && recallMessage ? (
              <div className="p-3 bg-critical-soft border-l-4 border-critical">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-critical flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-critical mb-1 uppercase tracking-wide">🚨 FOOD SAFETY ALERT</p>
                    <p className="text-xs text-ink font-mono">{recallMessage.substring(0, 100)}...</p>
                    <button className="text-[10px] text-critical font-bold mt-2 uppercase tracking-wide hover:underline">VIEW DETAILS →</button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted font-mono uppercase">No notifications</p>
            )}
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        {/* Orders Section */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-ink mb-4 uppercase tracking-widest">YOUR ORDERS</h3>
          
          {orders.length === 0 ? (
            <div className="bg-surface border border-ui-border p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted" />
              <p className="text-muted font-mono text-xs uppercase tracking-wide">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isContaminated = isOrderContaminated(order.id);
                const contamBatches = getOrderContaminatedBatches(order.id);
                const orderDishes = orderDishMap[order.id] || [];
                const orderKitchen = kitchens[0];
                const isExpanded = selectedOrder === order.id;
                
                return (
                  <div key={order.id} className={`bg-surface border-2 overflow-hidden ${isContaminated ? 'border-critical' : 'border-ui-border'}`}>
                    {/* Order Header */}
                    <div className="p-4 border-b border-ui-border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-ink text-sm uppercase tracking-wide">{orderKitchen?.name || 'Restaurant'}</h4>
                          <div className="flex items-center gap-1 text-[10px] text-muted mt-1 uppercase tracking-wide">
                            <MapPin className="w-3 h-3" />
                            {orderKitchen?.city || customerData?.city}
                          </div>
                        </div>
                        {isContaminated ? (
                          <span className="px-3 py-1 bg-critical text-white text-[10px] font-bold uppercase tracking-widest">RECALLED</span>
                        ) : (
                          <span className="px-3 py-1 bg-verified text-white text-[10px] font-bold uppercase tracking-widest">DELIVERED</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted uppercase tracking-wide font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-4">
                      {orderDishes.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {orderDishes.map((dish) => (
                            <div key={dish.id} className="flex items-center justify-between font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 border-2 flex items-center justify-center ${dish.category === 'Veg' ? 'border-verified' : 'border-critical'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${dish.category === 'Veg' ? 'bg-verified' : 'bg-critical'}`}></div>
                                </div>
                                <span className="text-ink uppercase">{dish.name}</span>
                              </div>
                              <span className="text-ink font-bold">₹{dish.price}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Recall Warning */}
                      {isContaminated && contamBatches.length > 0 && (
                        <div className="p-3 bg-critical-soft border-l-4 border-critical mb-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-critical flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-bold text-critical mb-1 uppercase tracking-wide">⚠️ FOOD SAFETY RECALL</p>
                              <p className="text-xs text-ink font-mono">Contains: {contamBatches.map(b => b.ingredient).join(', ')}</p>
                              <p className="text-xs text-critical font-bold mt-1 uppercase">DO NOT CONSUME!</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Order Details Button */}
                      <button
                        onClick={() => setSelectedOrder(isExpanded ? null : order.id)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-ui-bg hover:bg-canvas border border-ui-border transition-colors"
                      >
                        <span className="text-[10px] font-bold text-ink uppercase tracking-widest">ORDER DETAILS</span>
                        <ChevronDown className={`w-4 h-4 text-ink transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-ui-border space-y-2 font-mono text-[10px] uppercase tracking-wide">
                          <div className="flex justify-between">
                            <span className="text-muted">Order ID</span>
                            <span className="font-bold text-ink">{order.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Date</span>
                            <span className="font-bold text-ink">{new Date(order.timestamp).toLocaleDateString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted">Time</span>
                            <span className="font-bold text-ink">{new Date(order.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {isContaminated && (
                            <div className="pt-2 border-t border-ui-border">
                              <p className="text-critical font-bold">STATUS: RECALLED</p>
                              <p className="text-ink mt-1">Support: recall@foodtrace.com</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-ui-bg border-t border-ui-border flex items-center justify-between">
                      <button className="text-[10px] font-bold text-maroon hover:text-burgundy uppercase tracking-widest">REORDER</button>
                      {!isContaminated && (
                        <button className="flex items-center gap-1 text-[10px] font-bold text-ink hover:text-maroon uppercase tracking-widest">
                          <Star className="w-3 h-3" />
                          RATE
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-surface border border-ui-border p-4 mb-20">
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">ACCOUNT</h3>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1">
              <span className="text-muted uppercase">Name</span>
              <span className="font-bold text-ink">{customerData?.name}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted uppercase">ID</span>
              <span className="font-bold text-ink">{customerData?.id}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted uppercase">Location</span>
              <span className="font-bold text-ink">{customerData?.city}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
