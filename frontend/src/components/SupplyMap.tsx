import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Location {
  id: string;
  name: string;
  type: 'kitchen' | 'supplier' | 'customer';
  lat: number;
  lng: number;
  city: string;
  status: string;
  details?: any;
}

export const SupplyMap: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'kitchen' | 'supplier' | 'customer'>('all');
  const [showContamination, setShowContamination] = useState(true);

  useEffect(() => {
    // Mock data with real Indian coordinates
    const mockLocations: Location[] = [
      {
        id: 'K01',
        name: 'Gurugram Central Kitchen',
        type: 'kitchen',
        lat: 28.4595,
        lng: 77.0266,
        city: 'Gurugram',
        status: 'ACTIVE'
      },
      {
        id: 'K02',
        name: 'South Delhi Hub',
        type: 'kitchen',
        lat: 28.5355,
        lng: 77.2500,
        city: 'Delhi',
        status: 'ACTIVE'
      },
      {
        id: 'K03',
        name: 'Noida Kitchen',
        type: 'kitchen',
        lat: 28.5355,
        lng: 77.3910,
        city: 'Noida',
        status: 'ACTIVE'
      },
      {
        id: 'S01',
        name: 'Farm Fresh Suppliers',
        type: 'supplier',
        lat: 30.9010,
        lng: 75.8573,
        city: 'Punjab',
        status: 'VERIFIED'
      },
      {
        id: 'S02',
        name: 'Organic Farms Ltd',
        type: 'supplier',
        lat: 28.7041,
        lng: 77.1025,
        city: 'Haryana',
        status: 'VERIFIED'
      }
    ];
    
    setLocations(mockLocations);
  }, []);

  const getMarkerColor = (type: string, status: string) => {
    if (status === 'CONTAMINATED' || status === 'RECALLED') return '#C41E3A';
    if (type === 'kitchen') return '#C41E3A';
    if (type === 'supplier') return '#27AE60';
    if (type === 'customer') return '#315C7D';
    return '#52545A';
  };

  const filteredLocations = selectedType === 'all' 
    ? locations 
    : locations.filter(loc => loc.type === selectedType);

  const center: [number, number] = [28.6139, 77.2090]; // Delhi

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <div className="bg-surface border-b border-ui-border px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-[10px] font-bold text-muted tracking-widest uppercase">Geospatial Intelligence</h2>
          <p className="text-sm font-bold text-ink tracking-widest uppercase mt-1">Supply Chain Map</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="bg-canvas border border-ui-border px-3 py-2 text-xs text-ink font-mono uppercase"
          >
            <option value="all">All Locations</option>
            <option value="kitchen">Kitchens Only</option>
            <option value="supplier">Suppliers Only</option>
            <option value="customer">Customers Only</option>
          </select>
          <button
            onClick={() => setShowContamination(!showContamination)}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
              showContamination 
                ? 'bg-critical text-white' 
                : 'bg-surface border border-ui-border text-ink'
            }`}
          >
            {showContamination ? 'Hide' : 'Show'} Contamination Zones
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Contamination Zone Circle */}
          {showContamination && (
            <Circle
              center={[28.5355, 77.2500]}
              radius={5000}
              pathOptions={{
                color: '#C41E3A',
                fillColor: '#C41E3A',
                fillOpacity: 0.2
              }}
            />
          )}

          {/* Supply Routes */}
          <Polyline
            positions={[
              [30.9010, 75.8573], // Supplier S01
              [28.4595, 77.0266]  // Kitchen K01
            ]}
            pathOptions={{ color: '#27AE60', weight: 2, dashArray: '5, 10' }}
          />
          <Polyline
            positions={[
              [30.9010, 75.8573], // Supplier S01
              [28.5355, 77.2500]  // Kitchen K02
            ]}
            pathOptions={{ color: '#C41E3A', weight: 3 }}
          />

          {/* Location Markers */}
          {filteredLocations.map((location) => (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold text-sm mb-1">{location.name}</div>
                  <div className="text-xs text-gray-600 mb-1">{location.id}</div>
                  <div className="text-xs mb-1">
                    <span className="font-semibold">Type:</span> {location.type.toUpperCase()}
                  </div>
                  <div className="text-xs mb-1">
                    <span className="font-semibold">City:</span> {location.city}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold">Status:</span>{' '}
                    <span className={`font-bold ${
                      location.status === 'ACTIVE' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {location.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-surface border border-ui-border p-4 z-[1000] shadow-lg">
          <div className="text-[10px] font-bold text-ink uppercase tracking-widest mb-3">Map Legend</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#C41E3A]"></div>
              <span>Kitchens</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#27AE60]"></div>
              <span>Suppliers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#315C7D]"></div>
              <span>Customers</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-ui-border">
              <div className="w-4 h-1 bg-[#27AE60]" style={{borderTop: '2px dashed #27AE60'}}></div>
              <span>Safe Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-[#C41E3A]"></div>
              <span>Contaminated Route</span>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="absolute top-4 left-4 bg-surface border border-ui-border p-4 z-[1000] shadow-lg">
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Network Stats</div>
          <div className="space-y-2">
            <div className="flex justify-between gap-6 text-xs">
              <span className="text-muted">Kitchens:</span>
              <span className="font-mono font-bold text-ink">{locations.filter(l => l.type === 'kitchen').length}</span>
            </div>
            <div className="flex justify-between gap-6 text-xs">
              <span className="text-muted">Suppliers:</span>
              <span className="font-mono font-bold text-ink">{locations.filter(l => l.type === 'supplier').length}</span>
            </div>
            <div className="flex justify-between gap-6 text-xs">
              <span className="text-muted">Coverage:</span>
              <span className="font-mono font-bold text-verified">3 Cities</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
