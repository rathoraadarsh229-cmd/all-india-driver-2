import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Compass, RefreshCw, Crosshair, MapPin, Eye, CheckCircle2 } from 'lucide-react';
import { DriverProfile } from '../types';

// Fix Leaflet's missing default marker icon in bundlers
const defaultDriverIcon = L.divIcon({
  className: 'custom-driver-pin',
  html: `
    <div style="
      background-color: #fca311;
      border: 2.5px solid #14213d;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      position: relative;
    ">
      <span style="font-size: 16px;">🚚</span>
      <span style="
        position: absolute;
        bottom: -2px;
        right: -2px;
        background: #10b981;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid white;
      "></span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userCenterIcon = L.divIcon({
  className: 'custom-center-pin',
  html: `
    <div style="
      background-color: #14213d;
      border: 2px solid #ffffff;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
    ">
      <div style="
        background-color: #38bdf8;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      "></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});

// Component to dynamically re-center the map when coords change
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface OpenStreetTrackerProps {
  userLocation: { lat: number; lng: number };
  drivers: DriverProfile[];
  selectedDriver: DriverProfile | null;
  onSelectDriver: (driver: DriverProfile) => void;
  radiusKm?: number;
  onRefreshGps?: () => void;
  isLocating?: boolean;
}

export default function OpenStreetTracker({
  userLocation,
  drivers,
  selectedDriver,
  onSelectDriver,
  radiusKm = 5,
  onRefreshGps,
  isLocating = false
}: OpenStreetTrackerProps) {
  const [mapZoom, setMapZoom] = useState(13);
  const [activeCenter, setActiveCenter] = useState<[number, number]>([userLocation.lat, userLocation.lng]);

  useEffect(() => {
    setActiveCenter([userLocation.lat, userLocation.lng]);
  }, [userLocation.lat, userLocation.lng]);

  const handleCenterOnMe = () => {
    setActiveCenter([userLocation.lat, userLocation.lng]);
    setMapZoom(14);
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 flex flex-col">
      {/* Top Map HUD Bar */}
      <div className="absolute top-2 left-2 right-2 z-[400] flex items-center justify-between gap-1.5 pointer-events-none">
        {/* OpenStreetMap 100% Free badge */}
        <div className="pointer-events-auto bg-navy/90 text-white backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-md border border-white/10 flex items-center gap-1.5 text-[9.5px] font-black">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-brand-orange">OpenStreetMap</span>
          <span className="bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded text-[8px] font-bold">100% मुफ़्त (₹0)</span>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1">
          <button
            type="button"
            onClick={handleCenterOnMe}
            className="p-1.5 bg-white/95 hover:bg-white text-navy rounded-xl shadow-md border border-slate-200 text-xs font-black transition-all active:scale-95 cursor-pointer"
            title="मेरी लोकेशन पर री-सेंटर करें"
          >
            <Crosshair className="h-3.5 w-3.5 text-navy" />
          </button>

          {onRefreshGps && (
            <button
              type="button"
              onClick={onRefreshGps}
              disabled={isLocating}
              className="p-1.5 bg-white/95 hover:bg-white text-navy rounded-xl shadow-md border border-slate-200 text-xs font-black transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="GPS रीफ्रेश करें"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-brand-orange ${isLocating ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Leaflet Map View */}
      <div className="flex-1 w-full h-full">
        <MapContainer
          center={activeCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', minHeight: '260px' }}
          attributionControl={false}
        >
          <ChangeView center={activeCenter} zoom={mapZoom} />

          {/* 100% Free OpenStreetMap Global Tile Layer (No API Key Required) */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* 5 KM Radius Geofence Circle around User/Owner */}
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#fca311',
              fillColor: '#fca311',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '4, 8'
            }}
          />

          {/* User/Owner Center Location Marker */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userCenterIcon}>
            <Popup>
              <div className="text-center p-1 text-[11px] font-sans">
                <strong className="text-navy block">📍 आपका कार्यस्थल (Your Hub)</strong>
                <span className="text-[10px] text-slate-500">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
                <span className="block text-[9px] text-emerald-600 font-bold mt-1">
                  {radiusKm}km लाइव खोज दायरा सक्रिय
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Live Driver Markers */}
          {drivers.map((drv) => {
            // Assign coordinate from driver or fallback calculation
            const lat = (drv as any).computedLat || (drv as any).lat || userLocation.lat + 0.008;
            const lng = (drv as any).computedLng || (drv as any).lng || userLocation.lng + 0.009;

            return (
              <Marker
                key={drv.id}
                position={[lat, lng]}
                icon={defaultDriverIcon}
                eventHandlers={{
                  click: () => {
                    onSelectDriver(drv);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[140px] text-left text-xs font-sans space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-navy text-xs">{drv.name}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">
                        ★ {drv.rating}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium">
                      🚚 {drv.vehicleType}
                    </div>
                    <div className="text-[9.5px] text-slate-400">
                      📍 {drv.location}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectDriver(drv)}
                      className="w-full mt-1.5 py-1 px-2 bg-brand-orange hover:bg-orange-500 text-navy font-black text-[10px] rounded-lg transition-all cursor-pointer shadow-xs text-center"
                    >
                      विवरण देखें (View Profile)
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Bottom Map Legend */}
      <div className="bg-white/95 border-t border-slate-200 px-3 py-1.5 flex items-center justify-between text-[9.5px] font-sans">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-navy font-bold">
            <span className="h-2 w-2 rounded-full bg-sky-500 ring-2 ring-sky-200"></span>
            आपका केंद्र
          </span>
          <span className="flex items-center gap-1 text-slate-600 font-bold">
            <span className="h-2 w-2 rounded-full bg-brand-orange ring-2 ring-orange-200"></span>
            सक्रिय ड्राइवर (Active Drivers)
          </span>
        </div>
        <span className="text-slate-400 text-[8.5px] font-mono">
          Leaflet + OSM Tiles (₹0)
        </span>
      </div>
    </div>
  );
}
