import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowRight, CheckCircle, Package, Store, Truck, User } from 'lucide-react';

interface TraceStep {
  type: 'supplier' | 'batch' | 'kitchen' | 'dish' | 'order' | 'customer';
  id: string;
  name: string;
  location?: string;
  timestamp?: string;
  status: string;
}

export const PublicTrace: React.FC = () => {
  const [orderId, setOrderId] = useState('O05');
  const [showQR, setShowQR] = useState(false);
  const [traceData, setTraceData] = useState<TraceStep[] | null>(null);

  const handleTrace = () => {
    // Mock trace data
    const mockTrace: TraceStep[] = [
      {
        type: 'supplier',
        id: 'S01',
        name: 'Farm Fresh Suppliers',
        location: 'Punjab, India',
        timestamp: '2026-09-01',
        status: 'VERIFIED'
      },
      {
        type: 'batch',
        id: 'B002',
        name: 'Organic Paneer Block',
        location: 'Received at Warehouse',
        timestamp: '2026-09-05',
        status: 'SAFE'
      },
      {
        type: 'kitchen',
        id: 'K02',
        name: 'South Delhi Hub',
        location: 'Saket, Delhi',
        timestamp: '2026-09-06',
        status: 'ACTIVE'
      },
      {
        type: 'dish',
        id: 'D04',
        name: 'Kadai Paneer',
        location: 'Prepared',
        timestamp: '2026-09-10 18:15',
        status: 'READY'
      },
      {
        type: 'order',
        id: 'O05',
        name: 'Order #O05',
        location: 'Delivered',
        timestamp: '2026-09-10 18:30',
        status: 'COMPLETED'
      },
      {
        type: 'customer',
        id: 'C05',
        name: 'Vikram Malhotra',
        location: 'Delhi',
        timestamp: '2026-09-10 18:30',
        status: 'RECEIVED'
      }
    ];
    
    setTraceData(mockTrace);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'supplier': return Truck;
      case 'batch': return Package;
      case 'kitchen': return Store;
      case 'dish': return Package;
      case 'order': return Package;
      case 'customer': return User;
      default: return Package;
    }
  };

  const qrUrl = `https://infometrace.com/trace/${orderId}`;

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <div className="bg-surface border-b border-ui-border px-8 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase">Customer Portal</h2>
            <p className="text-sm font-bold text-ink tracking-widest uppercase mt-1">Public Traceability</p>
          </div>
          <div className="px-3 py-1.5 bg-verified/10 border border-verified">
            <span className="text-[9px] font-bold text-verified uppercase tracking-widest">✓ FSSAI VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-8">
        
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-surface border-2 border-ui-border p-8">
            <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Trace Your Order</h3>
            <p className="text-xs text-muted mb-6">Enter your order ID or scan QR code from your receipt</p>
            
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter Order ID (e.g., O05)"
                className="flex-1 bg-canvas border border-ui-border px-4 py-3 text-sm text-ink font-mono uppercase focus:outline-none focus:border-accent"
              />
              <button
                onClick={handleTrace}
                className="bg-accent hover:bg-accent/80 text-white px-8 py-3 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Trace Journey →
              </button>
            </div>

            <button
              onClick={() => setShowQR(!showQR)}
              className="text-xs text-accent font-bold uppercase tracking-wider hover:underline"
            >
              {showQR ? 'Hide' : 'Show'} QR Code
            </button>

            {showQR && (
              <div className="mt-6 p-6 bg-canvas border border-ui-border text-center">
                <QRCodeSVG value={qrUrl} size={200} className="mx-auto mb-4" />
                <div className="text-xs text-muted font-mono">{qrUrl}</div>
              </div>
            )}
          </div>
        </div>

        {/* Trace Results */}
        {traceData && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-ui-border">
              <CheckCircle className="w-5 h-5 text-verified" />
              <h3 className="text-sm font-bold text-ink uppercase tracking-widest">
                Complete Journey Traced
              </h3>
              <span className="ml-auto text-xs text-verified font-bold font-mono">
                Verified in 0.3 seconds
              </span>
            </div>

            {/* Journey Timeline */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-ui-border"></div>

              {/* Steps */}
              <div className="space-y-6">
                {traceData.map((step, index) => {
                  const Icon = getIcon(step.type);
                  return (
                    <div key={index} className="relative pl-16">
                      {/* Icon Circle */}
                      <div className="absolute left-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      {/* Content Card */}
                      <div className="bg-surface border border-ui-border p-6 hover:border-accent transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
                              {step.type}
                            </div>
                            <div className="text-xl font-bold text-ink font-mono mb-1">
                              {step.id}
                            </div>
                            <div className="text-sm text-ink font-medium">
                              {step.name}
                            </div>
                          </div>
                          <div className={`px-3 py-1 border text-[9px] font-bold uppercase tracking-widest ${
                            step.status === 'VERIFIED' || step.status === 'COMPLETED' || step.status === 'RECEIVED'
                              ? 'border-verified text-verified bg-verified/10'
                              : 'border-accent text-accent bg-accent/10'
                          }`}>
                            {step.status}
                          </div>
                        </div>

                        <div className="flex gap-6 text-xs text-muted font-mono">
                          {step.location && (
                            <div>
                              <span className="font-bold text-ink">Location:</span> {step.location}
                            </div>
                          )}
                          {step.timestamp && (
                            <div>
                              <span className="font-bold text-ink">Date:</span> {step.timestamp}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow for next step */}
                      {index < traceData.length - 1 && (
                        <div className="absolute left-5 -bottom-3 text-accent">
                          <ArrowRight className="w-5 h-5 transform rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trust Badge */}
            <div className="mt-12 p-6 bg-verified/5 border-2 border-verified text-center">
              <CheckCircle className="w-12 h-12 text-verified mx-auto mb-3" />
              <h4 className="text-sm font-bold text-verified uppercase tracking-widest mb-2">
                ✓ Verified Safe Journey
              </h4>
              <p className="text-xs text-muted">
                This order has been traced through our Neo4j-powered supply chain
                <br />
                All entities verified by FSSAI standards
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!traceData && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-sm text-muted uppercase tracking-wider">
              Enter an order ID to trace your food journey
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
