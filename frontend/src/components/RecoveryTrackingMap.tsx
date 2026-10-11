import { useState, useEffect, useRef } from 'react';
import { MapPin, Truck, CheckCircle2, Clock, Package, Play, Pause } from 'lucide-react';

interface Kitchen {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  quantity: number;
  status: 'pending' | 'collecting' | 'collected';
  collectedAt?: string;
}

interface RecoveryTrackingMapProps {
  batchId: string;
  kitchens: Array<{
    kitchen_id: string;
    kitchen_name: string;
    contaminated: number;
    remaining: number;
  }>;
  supplierLocation: string;
  totalQuantity: number;
}

// Mock coordinates for Delhi NCR kitchens
const KITCHEN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  'K01': { lat: 28.4595, lng: 77.0266 }, // Gurugram
  'K02': { lat: 28.5244, lng: 77.1855 }, // South Delhi
  'K03': { lat: 28.5355, lng: 77.3910 }, // Noida
  'K04': { lat: 28.7041, lng: 77.1025 }, // North Delhi
  'K05': { lat: 28.6139, lng: 77.2090 }, // Central Delhi
  'K06': { lat: 28.6692, lng: 77.4538 }, // East Delhi
};

const SUPPLIER_LOCATION = { lat: 28.4089, lng: 77.3178 }; // Faridabad (supplier hub)

export default function RecoveryTrackingMap({ kitchens, totalQuantity }: RecoveryTrackingMapProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [collectedKitchens, setCollectedKitchens] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prepare kitchen data with locations
  const trackingKitchens: Kitchen[] = kitchens
    .filter(k => k.remaining > 0) // Only kitchens with recoverable stock
    .map((k, idx) => ({
      id: k.kitchen_id,
      name: k.kitchen_name,
      location: KITCHEN_LOCATIONS[k.kitchen_id] || SUPPLIER_LOCATION,
      quantity: k.remaining,
      status: idx === 0 ? 'collecting' : 'pending',
    }));

  const totalStops = trackingKitchens.length + 2; // Supplier start + kitchens + supplier return

  // Simulate vehicle movement
  useEffect(() => {
    if (!isSimulating) return;

    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= totalStops - 1) {
          setIsSimulating(false);
          return prev;
        }

        // Update kitchen collection status
        if (prev > 0 && prev <= trackingKitchens.length) {
          const kitchen = trackingKitchens[prev - 1];
          setCollectedKitchens(prevSet => new Set([...prevSet, kitchen.id]));
        }

        return prev + 1;
      });
    }, 2000); // Move every 2 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSimulating, trackingKitchens.length, totalStops]);

  const toggleSimulation = () => {
    if (currentStep >= totalStops - 1) {
      // Reset
      setCurrentStep(0);
      setCollectedKitchens(new Set());
    }
    setIsSimulating(!isSimulating);
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const getProgressPercentage = () => {
    return Math.min(100, (currentStep / (totalStops - 1)) * 100);
  };

  const collectedQuantity = trackingKitchens
    .filter(k => collectedKitchens.has(k.id))
    .reduce((sum, k) => sum + k.quantity, 0);

  return (
    <div className="bg-surface border border-ui-border">
      {/* Header */}
      <div className="border-b border-ui-border p-4 flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-bold text-muted tracking-widest uppercase mb-1">Recovery Vehicle Tracking</h3>
          <p className="text-sm font-bold text-ink">Batch Collection Route</p>
        </div>
        <button
          onClick={toggleSimulation}
          className="bg-maroon hover:bg-burgundy text-white px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center gap-2"
        >
          {isSimulating ? (
            <>
              <Pause className="w-3 h-3" />
              PAUSE
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              {currentStep >= totalStops - 1 ? 'RESTART' : 'START'} SIMULATION
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-ui-border">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold text-muted uppercase tracking-wide">Collection Progress</div>
          <div className="text-xs font-bold text-accent">{Math.round(getProgressPercentage())}%</div>
        </div>
        <div className="h-2 bg-canvas border border-ui-border relative overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-accent transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-bold text-muted">
          <span>Collected: {collectedQuantity.toFixed(1)} kg</span>
          <span>Total: {totalQuantity.toFixed(1)} kg</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Left: Map View */}
        <div className="space-y-4">
          <div className="bg-canvas border border-ui-border p-4 h-[400px] relative">
            {/* Simple Map Representation */}
            <div className="absolute inset-0 p-4">
              {/* Supplier Location (Start/End) */}
              <div 
                className="absolute"
                style={{ 
                  left: '50%', 
                  top: '80%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-accent/20 rounded-full animate-ping" />
                  <MapPin className="w-6 h-6 text-accent relative z-10" />
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className="text-[10px] font-bold text-accent uppercase">Supplier Hub</div>
                    <div className="text-[8px] text-muted">Faridabad</div>
                  </div>
                </div>
              </div>

              {/* Kitchen Locations */}
              {trackingKitchens.map((kitchen, idx) => {
                const isCollected = collectedKitchens.has(kitchen.id);
                const isActive = currentStep === idx + 1;
                
                // Position kitchens in a circle around the map
                const angle = (idx / trackingKitchens.length) * 2 * Math.PI;
                const radius = 35; // percentage
                const x = 50 + radius * Math.cos(angle);
                const y = 35 + radius * Math.sin(angle);

                return (
                  <div
                    key={kitchen.id}
                    className="absolute"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="relative">
                      {isActive && (
                        <div className="absolute -inset-3 bg-maroon/20 rounded-full animate-pulse" />
                      )}
                      {isCollected ? (
                        <CheckCircle2 className="w-5 h-5 text-accent relative z-10" />
                      ) : (
                        <Package className="w-5 h-5 text-muted relative z-10" />
                      )}
                      <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <div className={`text-[8px] font-bold uppercase ${isCollected ? 'text-accent' : 'text-muted'}`}>
                          {kitchen.id}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Vehicle Icon */}
              {currentStep > 0 && currentStep < totalStops && (
                <div
                  className="absolute transition-all duration-1000"
                  style={{
                    left: currentStep <= trackingKitchens.length 
                      ? `${50 + 35 * Math.cos(((currentStep - 1) / trackingKitchens.length) * 2 * Math.PI)}%`
                      : '50%',
                    top: currentStep <= trackingKitchens.length
                      ? `${35 + 35 * Math.sin(((currentStep - 1) / trackingKitchens.length) * 2 * Math.PI)}%`
                      : '80%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="relative">
                    <div className="absolute -inset-4 bg-maroon/30 rounded-full" />
                    <Truck className="w-8 h-8 text-maroon animate-bounce relative z-10" />
                  </div>
                </div>
              )}

              {/* Route Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#8B4513" />
                  </marker>
                </defs>
                {/* Draw routes from supplier to each kitchen */}
                {trackingKitchens.map((kitchen, idx) => {
                  const angle = (idx / trackingKitchens.length) * 2 * Math.PI;
                  const x = 50 + 35 * Math.cos(angle);
                  const y = 35 + 35 * Math.sin(angle);
                  const isCompleted = idx < currentStep - 1;

                  return (
                    <line
                      key={kitchen.id}
                      x1="50%"
                      y1="80%"
                      x2={`${x}%`}
                      y2={`${y}%`}
                      stroke={isCompleted ? "#10b981" : "#8B4513"}
                      strokeWidth="2"
                      strokeDasharray={isCompleted ? "0" : "5,5"}
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Current Status Card */}
          <div className="bg-canvas border border-ui-border p-4">
            <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-3">Current Status</div>
            <div className="space-y-2">
              {currentStep === 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted" />
                  <span className="text-ink">Ready to start collection route</span>
                </div>
              )}
              {currentStep > 0 && currentStep <= trackingKitchens.length && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-maroon animate-pulse" />
                  <span className="text-ink">
                    Collecting from <span className="font-bold">{trackingKitchens[currentStep - 1]?.name}</span>
                  </span>
                </div>
              )}
              {currentStep > trackingKitchens.length && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span className="text-ink font-bold">Returning to supplier with collected stock</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Collection Timeline */}
        <div className="space-y-4">
          <div className="text-[10px] font-bold text-muted uppercase tracking-wide mb-3">Collection Timeline</div>
          
          <div className="space-y-3">
            {/* Start at Supplier */}
            <div className={`border-l-2 pl-4 pb-4 ${getStepStatus(0) === 'completed' ? 'border-accent' : 'border-ui-border'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  getStepStatus(0) === 'completed' ? 'bg-accent' : 
                  getStepStatus(0) === 'active' ? 'bg-maroon animate-pulse' : 
                  'bg-canvas border border-ui-border'
                }`}>
                  {getStepStatus(0) === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-ink">Supplier Hub - Departure</div>
                  <div className="text-[10px] text-muted mt-1">Faridabad</div>
                  {getStepStatus(0) === 'completed' && (
                    <div className="text-[10px] text-accent font-bold mt-1">Started collection route</div>
                  )}
                </div>
              </div>
            </div>

            {/* Kitchen Stops */}
            {trackingKitchens.map((kitchen, idx) => {
              const stepIndex = idx + 1;
              const status = getStepStatus(stepIndex);
              const isCollected = collectedKitchens.has(kitchen.id);

              return (
                <div 
                  key={kitchen.id}
                  className={`border-l-2 pl-4 pb-4 ${isCollected ? 'border-accent' : 'border-ui-border'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      status === 'completed' ? 'bg-accent' : 
                      status === 'active' ? 'bg-maroon animate-pulse' : 
                      'bg-canvas border border-ui-border'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : status === 'active' ? (
                        <Package className="w-4 h-4 text-white animate-bounce" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-ink">{kitchen.name}</div>
                      <div className="text-[10px] text-muted mt-1">{kitchen.id}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Package className="w-3 h-3 text-critical" />
                        <span className="text-xs font-bold text-critical">{kitchen.quantity} kg contaminated stock</span>
                      </div>
                      {isCollected && (
                        <div className="flex items-center gap-2 mt-2 bg-accent/10 border border-accent/30 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3 h-3 text-accent" />
                          <span className="text-[10px] text-accent font-bold uppercase">Collected</span>
                        </div>
                      )}
                      {status === 'active' && (
                        <div className="flex items-center gap-2 mt-2 bg-maroon/10 border border-maroon/30 px-2 py-1 rounded">
                          <Truck className="w-3 h-3 text-maroon" />
                          <span className="text-[10px] text-maroon font-bold uppercase">Collecting Now...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Return to Supplier */}
            <div className={`border-l-2 pl-4 ${getStepStatus(totalStops - 1) === 'completed' ? 'border-accent' : 'border-ui-border'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  getStepStatus(totalStops - 1) === 'completed' ? 'bg-accent' : 
                  getStepStatus(totalStops - 1) === 'active' ? 'bg-maroon animate-pulse' : 
                  'bg-canvas border border-ui-border'
                }`}>
                  {getStepStatus(totalStops - 1) === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-ink">Supplier Hub - Return</div>
                  <div className="text-[10px] text-muted mt-1">Faridabad</div>
                  {getStepStatus(totalStops - 1) === 'completed' && (
                    <div className="bg-accent/10 border border-accent/30 px-3 py-2 rounded mt-2">
                      <div className="text-xs font-bold text-accent">Collection Complete!</div>
                      <div className="text-[10px] text-muted mt-1">
                        Total collected: {collectedQuantity.toFixed(1)} kg
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
