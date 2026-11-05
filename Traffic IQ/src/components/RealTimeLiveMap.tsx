import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TrafficSignal, RoadblockPrediction, EmergencyVehicle, ComplimentaryRoute } from '../types/traffic';
import { fetchRoadRoute } from '../services/routingService';
import { UnifiedSignalHUD } from './UnifiedSignalHUD';
import {
  Navigation,
  MapPin,
  Siren,
  Compass,
  LocateFixed,
  AlertTriangle,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface RealTimeLiveMapProps {
  signals: TrafficSignal[];
  roadblocks: RoadblockPrediction[];
  selectedRoadblock: RoadblockPrediction | null;
  selectedRoute: ComplimentaryRoute | null;
  emergencies: EmergencyVehicle[];
  onSelectRoadblock?: (rb: RoadblockPrediction) => void;
  onSelectSignal?: (sig: TrafficSignal) => void;
  onLocationUpdate?: (lat: number, lng: number) => void;
  driverSpeedKmph?: number;
}

export const RealTimeLiveMap: React.FC<RealTimeLiveMapProps> = ({
  signals,
  roadblocks,
  selectedRoadblock,
  selectedRoute,
  emergencies,
  onSelectRoadblock,
  onSelectSignal,
  onLocationUpdate,
  driverSpeedKmph = 44
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [mapStyle, setMapStyle] = useState<'GOOGLE_STREETS' | 'GOOGLE_SATELLITE' | 'GOOGLE_TERRAIN' | 'DARK_MATTER'>('GOOGLE_STREETS');
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'SEARCHING' | 'LOCKED' | 'ERROR'>('SEARCHING');
  const [showQuickHUD, setShowQuickHUD] = useState<boolean>(true);
  const [roadDetourCoords, setRoadDetourCoords] = useState<[number, number][] | null>(null);

  // Fetch actual street road geometry for active detour route
  useEffect(() => {
    let isMounted = true;
    if (!selectedRoute || !selectedRoute.coordinates || selectedRoute.coordinates.length < 2) {
      setRoadDetourCoords(null);
      return;
    }

    fetchRoadRoute(selectedRoute.coordinates).then((res) => {
      if (isMounted && res && res.coordinates.length > 0) {
        setRoadDetourCoords(res.coordinates);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedRoute]);

  const googleTileLayers: Record<string, { url: string; subdomains: string[] }> = {
    GOOGLE_STREETS: {
      url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      subdomains: ['0', '1', '2', '3'],
    },
    GOOGLE_SATELLITE: {
      url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      subdomains: ['0', '1', '2', '3'],
    },
    GOOGLE_TERRAIN: {
      url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      subdomains: ['0', '1', '2', '3'],
    },
    DARK_MATTER: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      subdomains: ['a', 'b', 'c', 'd'],
    },
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.6280, 77.3649],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const cfg = googleTileLayers[mapStyle];
      const baseTile = L.tileLayer(cfg.url, {
        maxZoom: 20,
        subdomains: cfg.subdomains,
      }).addTo(map);

      (map as any)._currentTileLayer = baseTile;

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentTile = (map as any)._currentTileLayer;
    if (currentTile) map.removeLayer(currentTile);

    const cfg = googleTileLayers[mapStyle];
    const newTile = L.tileLayer(cfg.url, {
      maxZoom: 20,
      subdomains: cfg.subdomains,
    }).addTo(map);

    newTile.bringToBack();
    (map as any)._currentTileLayer = newTile;
  }, [mapStyle]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('ERROR');
      return;
    }

    const onLocationSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = Math.round(pos.coords.accuracy);

      setCurrentLocation([lat, lng]);
      setGpsAccuracy(acc);
      setGpsStatus('LOCKED');
      onLocationUpdate?.(lat, lng);
    };

    const onLocationError = () => {
      setGpsStatus('ERROR');
      if (!currentLocation) setCurrentLocation([28.6280, 77.3649]);
    };

    navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
      enableHighAccuracy: true,
      timeout: 10000,
    });

    const watchId = navigator.geolocation.watchPosition(onLocationSuccess, onLocationError, {
      enableHighAccuracy: true,
      timeout: 15000,
    });

    watchIdRef.current = watchId;
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Render Map Layers with AutoNavi Styled Floating Bubble Pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Live User Marker (Sedan with Radar Halo)
    if (currentLocation) {
      const userHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
          <div style="position: absolute; width: 48px; height: 48px; background: #3b82f6; opacity: 0.3; border-radius: 50%; animation: ping 2s infinite;"></div>
          <div style="width: 28px; height: 28px; background: #1d4ed8; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 16px rgba(29, 78, 216, 0.9); display: flex; align-items: center; justify-content: center; z-index: 5;">
            <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.95); color: #60a5fa; border: 1.5px solid #3b82f6; font-size: 10px; font-weight: 800; font-family: monospace; padding: 2px 7px; border-radius: 12px; margin-top: 3px; white-space: nowrap; box-shadow: 0 2px 10px rgba(0,0,0,0.5); z-index: 5;">
            YOU (LIVE GPS)
          </div>
        </div>
      `;

      const userIcon = L.divIcon({ html: userHtml, className: 'user-live-pin', iconSize: [0, 0] });
      layerGroup.addLayer(L.marker(currentLocation, { icon: userIcon, zIndexOffset: 1000 }));
    }

    // 2. Traffic Signals Rendered as Screenshot-style Floating Bubbles
    signals.forEach((sig) => {
      const isRed = sig.currentStatus === 'RED';
      const isGreen = sig.currentStatus === 'GREEN';

      let bubbleHtml = '';

      if (isRed) {
        bubbleHtml = `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <div style="display: flex; align-items: center; background: #1a080c; border: 2.5px solid #ef4444; border-radius: 30px; padding: 3px 10px 3px 4px; box-shadow: 0 0 18px rgba(239,68,68,0.85);">
              <div style="width: 26px; height: 26px; background: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
              </div>
              <span style="color: #ffffff; font-family: monospace; font-size: 19px; font-weight: 900; line-height: 1; margin-left: 8px;">
                ${sig.timeRemaining}
              </span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #ef4444; margin-top: -1px;"></div>
            <div style="width: 8px; height: 8px; background: #ef4444; border: 1.5px solid white; border-radius: 50%; margin-top: 2px;"></div>
          </div>
        `;
      } else if (isGreen) {
        bubbleHtml = `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <div style="width: 44px; height: 44px; background: #064e3b; border: 2.5px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 18px rgba(16,185,129,0.85);">
              <span style="color: #34d399; font-family: monospace; font-size: 20px; font-weight: 900; line-height: 1;">
                ${sig.timeRemaining}
              </span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #10b981; margin-top: -1px;"></div>
            <div style="width: 8px; height: 8px; background: #10b981; border: 1.5px solid white; border-radius: 50%; margin-top: 2px;"></div>
          </div>
        `;
      } else {
        bubbleHtml = `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <div style="width: 40px; height: 40px; background: #451a03; border: 2px solid #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(245,158,11,0.8);">
              <span style="color: #fbbf24; font-family: monospace; font-size: 18px; font-weight: 900;">
                ${sig.timeRemaining}
              </span>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #f59e0b; margin-top: -1px;"></div>
          </div>
        `;
      }

      const icon = L.divIcon({ html: bubbleHtml, className: 'autonavi-signal-pin', iconSize: [0, 0] });
      const marker = L.marker(sig.coordinates, { icon });
      marker.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; min-width: 180px;">
          <strong style="font-size: 13px; color: #1e293b;">${sig.name}</strong><br/>
          <span style="color: #64748b;">${sig.junction}</span>
          <hr style="margin: 6px 0; border: none; border-top: 1px solid #e2e8f0;"/>
          <div style="display: flex; justify-content: space-between;">
            <span>Phase:</span>
            <strong style="color: ${isGreen ? '#10b981' : isRed ? '#ef4444' : '#f59e0b'};">${sig.currentStatus} (${sig.timeRemaining}s)</strong>
          </div>
        </div>
      `);
      marker.on('click', () => onSelectSignal?.(sig));
      layerGroup.addLayer(marker);
    });

    // 3. Roadblocks
    roadblocks.forEach((rb) => {
      const isSelected = selectedRoadblock?.id === rb.id;
      const polyline = L.polyline(rb.coordinates, {
        color: '#dc2626',
        weight: isSelected ? 8 : 6,
        dashArray: '10, 6',
        opacity: 0.9,
      });
      polyline.on('click', () => onSelectRoadblock?.(rb));
      polyline.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; min-width: 200px;">
          <strong style="color: #dc2626;">⚠️ Bottleneck: ${rb.roadName}</strong><br/>
          <span style="font-size: 11px; color: #475569;">Cause: ${rb.primaryCause} (${rb.confidenceScore}% AI Confidence)</span>
          <p style="font-size: 11px; margin-top: 4px; color: #1e293b;">${rb.causeDetails}</p>
        </div>
      `);
      layerGroup.addLayer(polyline);
    });

    // 4. Detour Route (Follows actual road network curves if available)
    if (selectedRoute) {
      const activeDetourCoords = (roadDetourCoords && roadDetourCoords.length > 0)
        ? roadDetourCoords
        : selectedRoute.coordinates;

      const detourLine = L.polyline(activeDetourCoords, {
        color: '#10b981',
        weight: 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });
      detourLine.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; min-width: 180px;">
          <strong style="color: #059669;">✓ ${selectedRoute.name}</strong><br/>
          <span style="font-size: 11px; color: #475569;">Time: ${selectedRoute.estimatedTimeMinutes} mins • Saves ~${selectedRoute.savingsMinutes} mins</span>
        </div>
      `);
      layerGroup.addLayer(detourLine);
    }

    // 5. Emergency Corridor
    emergencies.filter(e => e.status !== 'CLEARED').forEach((ev) => {
      const beaconColor = ev.type === 'AMBULANCE' ? '#ef4444' : '#f97316';
      const corridorLine = L.polyline([ev.currentCoordinates, ev.destinationCoordinates], {
        color: beaconColor,
        weight: 6,
        dashArray: '8, 8',
      });
      layerGroup.addLayer(corridorLine);

      const evHtml = `
        <div style="transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background: ${beaconColor}; opacity: 0.4; border-radius: 50%; animation: ping 1.5s infinite;"></div>
          <div style="background: #0f172a; border: 2px solid ${beaconColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px;">
            ${ev.type === 'AMBULANCE' ? '🚑' : '🚒'}
          </div>
        </div>
      `;
      layerGroup.addLayer(L.marker(ev.currentCoordinates, {
        icon: L.divIcon({ html: evHtml, className: 'ev-marker', iconSize: [0, 0] })
      }));
    });

  }, [signals, roadblocks, selectedRoadblock, selectedRoute, roadDetourCoords, emergencies, currentLocation]);

  const handleCenterUserLocation = () => {
    if (currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(currentLocation, 17, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden z-0 bg-[#F8F9FA]">
      {/* 1. Full Screen Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 2. Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-[500] pointer-events-none flex flex-wrap items-center justify-between gap-3">
        {/* Left Status Badge */}
        <div className="pointer-events-auto bg-[#FFFFFF] border border-[#DADCE0] px-4 py-2.5 rounded-xl shadow-md flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#188038] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#188038]"></span>
            </span>
            <span className="text-sm font-bold text-[#202124] tracking-wide">Live Google Maps</span>
          </div>
          {gpsStatus === 'LOCKED' && (
            <span className="bg-[#E6F4EA] text-[#188038] text-xs px-2.5 py-0.5 rounded-full border border-[#CEEAD6] font-mono font-bold">
              GPS ±{gpsAccuracy}m
            </span>
          )}
          <div className="h-4 w-px bg-[#DADCE0]"></div>
          <div className="text-xs font-mono font-bold text-[#188038]">
            Speed: {driverSpeedKmph} km/h
          </div>
        </div>

        {/* Right Map Layer Mode & GPS Center */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#FFFFFF] p-1.5 rounded-xl border border-[#DADCE0] shadow-md text-xs">
            <button
              onClick={() => setMapStyle('GOOGLE_STREETS')}
              className={`px-3 py-1.5 rounded-lg font-semibold btn-interactive ${mapStyle === 'GOOGLE_STREETS' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
            >
              Google Streets
            </button>
            <button
              onClick={() => setMapStyle('GOOGLE_SATELLITE')}
              className={`px-3 py-1.5 rounded-lg font-semibold btn-interactive ${mapStyle === 'GOOGLE_SATELLITE' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle('DARK_MATTER')}
              className={`px-3 py-1.5 rounded-lg font-semibold btn-interactive ${mapStyle === 'DARK_MATTER' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
            >
              Dark HUD
            </button>
          </div>

          <button
            onClick={handleCenterUserLocation}
            className="flex items-center gap-1.5 bg-[#1A73E8] hover:bg-[#1558B0] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md btn-interactive"
          >
            <LocateFixed className="w-4 h-4" />
            Track My Location
          </button>
        </div>
      </div>

      {/* 3. Floating Bottom Mini Signal HUD (Unified Design) */}
      <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-6 z-[500] pointer-events-none flex flex-col items-center">
        <UnifiedSignalHUD
          signals={signals}
          title="Upcoming Signal Countdown On Your Route"
          advisoryText="Green Wave Advisory: 42–46 km/h"
          onSelectSignal={onSelectSignal}
        />
      </div>
    </div>
  );
};
