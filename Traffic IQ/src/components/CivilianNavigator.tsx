import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TrafficSignal, RoadblockPrediction } from '../types/traffic';
import { fetchRoadRoute, RouteGeometryResult } from '../services/routingService';
import { UnifiedSignalHUD } from './UnifiedSignalHUD';
import {
  Navigation,
  MapPin,
  Search,
  Play,
  Pause,
  RotateCcw,
  CornerUpRight,
  ArrowUp,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Clock,
  TrendingDown,
  Layers,
  Compass,
  LocateFixed,
  Car,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface CivilianNavigatorProps {
  signals: TrafficSignal[];
  roadblocks: RoadblockPrediction[];
  onReportIncident?: () => void;
}

interface DestinationPreset {
  name: string;
  category: string;
  coords: [number, number];
  primaryRouteCoords: [number, number][];
  detourRouteCoords: [number, number][];
  normalDurationMins: number;
  congestedDurationMins: number;
  detourDurationMins: number;
  primaryDistanceKm: number;
  detourDistanceKm: number;
  bottleneckName: string;
  bottleneckCause: string;
}

export const CivilianNavigator: React.FC<CivilianNavigatorProps> = ({
  signals,
  roadblocks,
  onReportIncident
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const animIntervalRef = useRef<number | null>(null);

  // Map Tile Style
  const [mapStyle, setMapStyle] = useState<'GOOGLE_STREETS' | 'GOOGLE_SATELLITE' | 'DARK_MATTER'>('GOOGLE_STREETS');

  // Origin & Destination State
  const [origin, setOrigin] = useState<string>('My Current GPS Location (Sector 62)');
  const [originCoords, setOriginCoords] = useState<[number, number]>([28.6280, 77.3649]);

  // Destination Presets
  const destinationPresets: DestinationPreset[] = [
    {
      name: 'Cyber City Tech Park & Hub',
      category: 'Commercial Hub',
      coords: [28.6440, 77.3880],
      // Primary Route: Direct via Grand Trunk Expressway (Heavy bottleneck)
      primaryRouteCoords: [
        [28.6280, 77.3649],
        [28.6320, 77.3685],
        [28.6360, 77.3730], // Bottleneck collision point
        [28.6400, 77.3800],
        [28.6440, 77.3880]
      ],
      // Alternative / Complimentary Route: via Canal Bypass & Underpass (Smooth traffic)
      detourRouteCoords: [
        [28.6280, 77.3649],
        [28.6300, 77.3580], // Detour turn
        [28.6370, 77.3590],
        [28.6430, 77.3720],
        [28.6440, 77.3880]
      ],
      normalDurationMins: 12,
      congestedDurationMins: 42,
      detourDurationMins: 16,
      primaryDistanceKm: 4.8,
      detourDistanceKm: 5.6,
      bottleneckName: 'Expressway Flyover Kilometer 14',
      bottleneckCause: 'Multi-Vehicle Collision blocking lanes 1 & 2'
    },
    {
      name: 'Apollo Hospital & Central Medical Center',
      category: 'Health Hub',
      coords: [28.6495, 77.3910],
      primaryRouteCoords: [
        [28.6280, 77.3649],
        [28.6330, 77.3700],
        [28.6450, 77.3850], // Flooded Causeway
        [28.6480, 77.3910],
        [28.6495, 77.3910]
      ],
      detourRouteCoords: [
        [28.6280, 77.3649],
        [28.6350, 77.3710],
        [28.6420, 77.3800], // Elevated flyover above flood
        [28.6490, 77.3860],
        [28.6495, 77.3910]
      ],
      normalDurationMins: 14,
      congestedDurationMins: 55,
      detourDurationMins: 18,
      primaryDistanceKm: 5.4,
      detourDistanceKm: 6.1,
      bottleneckName: 'Riverbank Causeway & Lowland Road',
      bottleneckCause: 'Waterlogging & 1.8ft Stormwater Overflow'
    },
    {
      name: 'Central Secretariat & Convention Plaza',
      category: 'Civic District',
      coords: [28.6180, 77.3480],
      primaryRouteCoords: [
        [28.6280, 77.3649],
        [28.6240, 77.3590],
        [28.6200, 77.3540], // VIP hold point
        [28.6180, 77.3480]
      ],
      detourRouteCoords: [
        [28.6280, 77.3649],
        [28.6220, 77.3650],
        [28.6160, 77.3580],
        [28.6180, 77.3480]
      ],
      normalDurationMins: 9,
      congestedDurationMins: 28,
      detourDurationMins: 12,
      primaryDistanceKm: 3.2,
      detourDistanceKm: 3.7,
      bottleneckName: 'Governor Boulevard',
      bottleneckCause: 'VIP Motorcade Transition & Signal Hold'
    }
  ];

  const [selectedDestIndex, setSelectedDestIndex] = useState<number>(0);
  const activeDest = destinationPresets[selectedDestIndex];

  // Active Choice: 'PRIMARY' (congested) or 'DETOUR' (recommended alternative)
  const [selectedPathType, setSelectedPathType] = useState<'DETOUR' | 'PRIMARY'>('DETOUR');

  // Real road-geometry route states (calculated from OSRM road network)
  const [liveRoadPrimary, setLiveRoadPrimary] = useState<RouteGeometryResult | null>(null);
  const [liveRoadDetour, setLiveRoadDetour] = useState<RouteGeometryResult | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState<boolean>(false);

  // Driving Simulation State
  const [isDriving, setIsDriving] = useState<boolean>(false);
  const [carProgressIndex, setCarProgressIndex] = useState<number>(0);
  const [currentCarCoords, setCurrentCarCoords] = useState<[number, number]>(originCoords);
  const [drivingSpeedKmph, setDrivingSpeedKmph] = useState<number>(45);

  // Mobile Google Maps-style panel collapse state
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = useState<boolean>(false);

  // Animated progressive route drawing state
  const [routeDrawPercent, setRouteDrawPercent] = useState<number>(100);
  const routeAnimationTimerRef = useRef<number | null>(null);

  // Trigger progressive route reveal animation along real road geometry when destination or path changes
  useEffect(() => {
    setRouteDrawPercent(0);
    if (routeAnimationTimerRef.current) clearInterval(routeAnimationTimerRef.current);

    const startTime = Date.now();
    const duration = 900; // 900ms smooth road-reveal

    routeAnimationTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setRouteDrawPercent(progress);

      if (progress >= 100) {
        clearInterval(routeAnimationTimerRef.current!);
      }
    }, 20);

    return () => {
      if (routeAnimationTimerRef.current) clearInterval(routeAnimationTimerRef.current);
    };
  }, [selectedDestIndex, selectedPathType]);

  // Fetch real road-network routes dynamically when destination changes
  useEffect(() => {
    let isMounted = true;
    const abortCtrl = new AbortController();

    async function computeRealRoadRoutes() {
      setIsRoutingLoading(true);

      // Primary road path via actual roads
      const primaryRes = await fetchRoadRoute(activeDest.primaryRouteCoords, { signal: abortCtrl.signal });
      // Detour route path via actual roads
      const detourRes = await fetchRoadRoute(activeDest.detourRouteCoords, { signal: abortCtrl.signal });

      if (isMounted) {
        if (primaryRes) setLiveRoadPrimary(primaryRes);
        if (detourRes) setLiveRoadDetour(detourRes);
        setIsRoutingLoading(false);
      }
    }

    computeRealRoadRoutes();

    return () => {
      isMounted = false;
      abortCtrl.abort();
    };
  }, [activeDest]);

  const googleTileLayers: Record<string, { url: string; subdomains: string[] }> = {
    GOOGLE_STREETS: {
      url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      subdomains: ['0', '1', '2', '3'],
    },
    GOOGLE_SATELLITE: {
      url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      subdomains: ['0', '1', '2', '3'],
    },
    DARK_MATTER: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      subdomains: ['a', 'b', 'c', 'd'],
    },
  };

  // Init Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.634, 77.373],
        zoom: 14,
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
      routeLayerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Map Tile Toggle
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

  // Handle GPS location lookup for user
  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setOriginCoords([lat, lng]);
        setCurrentCarCoords([lat, lng]);
        setOrigin('My Real GPS Location (Detected)');
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 15);
        }
      });
    }
  };

  // Render Routes (Primary Blocked Route vs. Alternative Suggested Detour)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = routeLayerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Use real road geometry if loaded, otherwise fallback to waypoint anchors
    const primaryCoords = (liveRoadPrimary && liveRoadPrimary.coordinates.length > 0)
      ? liveRoadPrimary.coordinates
      : activeDest.primaryRouteCoords;

    const detourCoords = (liveRoadDetour && liveRoadDetour.coordinates.length > 0)
      ? liveRoadDetour.coordinates
      : activeDest.detourRouteCoords;

    // Slice coordinates based on progressive route reveal percentage
    const drawDetourCoords = routeDrawPercent < 100
      ? detourCoords.slice(0, Math.max(2, Math.round((detourCoords.length * routeDrawPercent) / 100)))
      : detourCoords;

    const drawPrimaryCoords = routeDrawPercent < 100
      ? primaryCoords.slice(0, Math.max(2, Math.round((primaryCoords.length * routeDrawPercent) / 100)))
      : primaryCoords;

    // 1. PRIMARY ROAD: Show congested/blocked section in Red (#D93025)
    const primaryLine = L.polyline(drawPrimaryCoords, {
      color: selectedPathType === 'PRIMARY' ? '#D93025' : '#EA4335',
      weight: selectedPathType === 'PRIMARY' ? 7 : 5,
      opacity: selectedPathType === 'PRIMARY' ? 0.95 : 0.65,
      dashArray: '10, 8',
    });

    primaryLine.bindPopup(`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Google Sans', sans-serif; font-size: 12px; color: #202124; min-width: 220px; padding: 4px;">
        <strong style="color: #D93025; font-size: 13px;">⚠️ Congested Primary Route</strong><br/>
        <div style="margin-top: 4px; color: #5F6368;">Travel Time: <strong style="color: #202124;">${activeDest.congestedDurationMins} mins</strong> (${liveRoadPrimary ? (liveRoadPrimary.distanceMeters / 1000).toFixed(1) : activeDest.primaryDistanceKm} km)</div>
        <div style="background: #FCE8E6; border: 1px solid #FAD2CF; border-radius: 8px; padding: 6px; margin-top: 6px; font-size: 11px; color: #C5221F;">
          <strong>Roadblock Ahead:</strong> ${activeDest.bottleneckCause}
        </div>
      </div>
    `);
    primaryLine.on('click', () => setSelectedPathType('PRIMARY'));
    layerGroup.addLayer(primaryLine);

    // Hazard warning marker on bottleneck location
    const bottleneckCoord = activeDest.primaryRouteCoords[2] || primaryCoords[Math.floor(primaryCoords.length / 2)];
    const hazardHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
        <div style="background: #D93025; color: white; border: 2.5px solid #FFFFFF; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; box-shadow: 0 2px 8px rgba(217, 48, 37, 0.4);">
          !
        </div>
        <div style="background: #FFFFFF; color: #D93025; border: 1px solid #DADCE0; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; margin-top: 3px; white-space: nowrap; box-shadow: 0 2px 6px rgba(60,64,67,0.15);">
          Roadblock
        </div>
      </div>
    `;
    const hazardMarker = L.marker(bottleneckCoord, {
      icon: L.divIcon({ html: hazardHtml, className: 'hazard-pin', iconSize: [0, 0] })
    });
    hazardMarker.on('click', () => setSelectedPathType('PRIMARY'));
    layerGroup.addLayer(hazardMarker);

    // 2. SUGGESTED ALTERNATIVE DETOUR ROUTE: In Success Green (#188038)
    const detourLine = L.polyline(drawDetourCoords, {
      color: selectedPathType === 'DETOUR' ? '#188038' : '#34A853',
      weight: selectedPathType === 'DETOUR' ? 8 : 5,
      opacity: selectedPathType === 'DETOUR' ? 1.0 : 0.7,
      lineCap: 'round',
      lineJoin: 'round',
    });

    detourLine.bindPopup(`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Google Sans', sans-serif; font-size: 12px; color: #202124; min-width: 220px; padding: 4px;">
        <strong style="color: #188038; font-size: 13px;">✓ Recommended Detour Route</strong><br/>
        <div style="margin-top: 4px; color: #5F6368;">Travel Time: <strong style="color: #202124;">${activeDest.detourDurationMins} mins</strong> (${liveRoadDetour ? (liveRoadDetour.distanceMeters / 1000).toFixed(1) : activeDest.detourDistanceKm} km)</div>
        <div style="background: #E6F4EA; border: 1px solid #CEEAD6; border-radius: 8px; padding: 6px; margin-top: 6px; font-size: 11px; color: #137333;">
          <strong>Saves ${activeDest.congestedDurationMins - activeDest.detourDurationMins} minutes!</strong> Bypasses bottleneck completely.
        </div>
      </div>
    `);
    detourLine.on('click', () => setSelectedPathType('DETOUR'));
    layerGroup.addLayer(detourLine);

    // Detour callout label right on the map turn
    const detourDivergePoint = detourCoords[Math.min(10, Math.floor(detourCoords.length / 3))];
    const divergeHtml = `
      <div style="background: #188038; color: white; border: 2px solid #FFFFFF; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 12px; transform: translate(-50%, -100%); box-shadow: 0 2px 8px rgba(24,128,56,0.35); cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
        <span>✓ Fastest Detour</span>
        <span style="background: #137333; padding: 1px 5px; border-radius: 6px; font-size: 9px;">-${activeDest.congestedDurationMins - activeDest.detourDurationMins}m</span>
      </div>
    `;
    const divergeMarker = L.marker(detourDivergePoint, {
      icon: L.divIcon({ html: divergeHtml, className: 'diverge-pin', iconSize: [0, 0] })
    });
    divergeMarker.on('click', () => setSelectedPathType('DETOUR'));
    layerGroup.addLayer(divergeMarker);

    // 3. Origin Marker (Start)
    const startHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: #1A73E8; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; border: 2px solid white; box-shadow: 0 2px 6px rgba(60,64,67,0.3);">
          START
        </div>
        <div style="width: 12px; height: 12px; background: #1A73E8; border: 2px solid white; border-radius: 50%; margin-top: 1px;"></div>
      </div>
    `;
    layerGroup.addLayer(L.marker(originCoords, {
      icon: L.divIcon({ html: startHtml, className: 'start-pin', iconSize: [0, 0] })
    }));

    // 4. Destination Marker (Finish)
    const endHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: #D93025; color: white; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; border: 2px solid white; box-shadow: 0 2px 6px rgba(60,64,67,0.3);">
          DESTINATION
        </div>
        <div style="width: 14px; height: 14px; background: #D93025; border: 2px solid white; border-radius: 50%; margin-top: 1px;"></div>
      </div>
    `;
    layerGroup.addLayer(L.marker(activeDest.coords, {
      icon: L.divIcon({ html: endHtml, className: 'dest-pin', iconSize: [0, 0] })
    }));

    // 5. Moving Civilian Vehicle Marker
    const carHtml = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
        <div style="position: absolute; width: 40px; height: 40px; background: #1A73E8; opacity: 0.25; border-radius: 50%; animation: ping 2s infinite;"></div>
        <div style="width: 24px; height: 24px; background: #1A73E8; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 8px rgba(26,115,232,0.5); display: flex; align-items: center; justify-content: center; z-index: 10;">
          <div style="width: 7px; height: 7px; background: #FFFFFF; border-radius: 50%;"></div>
        </div>
        <div style="background: #FFFFFF; color: #1A73E8; border: 1px solid #DADCE0; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 6px; margin-top: 2px; white-space: nowrap; box-shadow: 0 2px 4px rgba(60,64,67,0.15); z-index: 10;">
          Your Vehicle
        </div>
      </div>
    `;
    const carMarker = L.marker(currentCarCoords, {
      icon: L.divIcon({ html: carHtml, className: 'car-live-pin', iconSize: [0, 0] }),
      zIndexOffset: 2000
    });
    layerGroup.addLayer(carMarker);

    // Traffic Signal Countdown Pins along the way
    signals.slice(0, 3).forEach((sig) => {
      const isRed = sig.currentStatus === 'RED';
      const sigColor = isRed ? '#D93025' : '#188038';
      const sigBg = isRed ? '#FCE8E6' : '#E6F4EA';
      const sigHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #FFFFFF; border: 2px solid ${sigColor}; color: ${sigColor}; font-size: 11px; font-family: -apple-system, sans-serif; font-weight: 700; padding: 2px 6px; border-radius: 8px; box-shadow: 0 2px 6px rgba(60,64,67,0.2);">
            ${sig.timeRemaining}s
          </div>
          <div style="width: 2px; height: 4px; background: ${sigColor};"></div>
        </div>
      `;
      layerGroup.addLayer(L.marker(sig.coordinates, {
        icon: L.divIcon({ html: sigHtml, className: 'sig-pin', iconSize: [0, 0] })
      }));
    });

    const chosenRouteCoords = selectedPathType === 'DETOUR'
      ? ((liveRoadDetour && liveRoadDetour.coordinates.length > 0) ? liveRoadDetour.coordinates : activeDest.detourRouteCoords)
      : ((liveRoadPrimary && liveRoadPrimary.coordinates.length > 0) ? liveRoadPrimary.coordinates : activeDest.primaryRouteCoords);

    // Zoom/fit route into view smoothly when routes change
    if (map && detourCoords.length > 1 && routeDrawPercent >= 90) {
      const bounds = L.latLngBounds(detourCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }

  }, [activeDest, selectedPathType, currentCarCoords, signals, liveRoadPrimary, liveRoadDetour, routeDrawPercent]);

  // Turn-by-Turn Driving Journey Loop following precise road coordinates
  const handleStartJourney = () => {
    if (isDriving) {
      // Pause
      setIsDriving(false);
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
      return;
    }

    setIsDriving(true);
    // Automatically collapse mobile search card like Google Maps once journey starts
    setIsMobilePanelExpanded(false);
    const chosenRoute = selectedPathType === 'DETOUR'
      ? ((liveRoadDetour && liveRoadDetour.coordinates.length > 0) ? liveRoadDetour.coordinates : activeDest.detourRouteCoords)
      : ((liveRoadPrimary && liveRoadPrimary.coordinates.length > 0) ? liveRoadPrimary.coordinates : activeDest.primaryRouteCoords);

    // Animate car step by step along real street road nodes
    let idx = carProgressIndex;
    animIntervalRef.current = window.setInterval(() => {
      if (idx >= chosenRoute.length - 1) {
        // Reached destination!
        clearInterval(animIntervalRef.current!);
        setIsDriving(false);
        setCarProgressIndex(0);
        setCurrentCarCoords(chosenRoute[chosenRoute.length - 1]);
        alert(`🏁 You have arrived at ${activeDest.name}!`);
        return;
      }

      // Progress along route nodes (step adaptive to route density)
      const step = chosenRoute.length > 30 ? Math.max(1, Math.floor(chosenRoute.length / 40)) : 1;
      idx = Math.min(idx + step, chosenRoute.length - 1);
      setCarProgressIndex(idx);
      setCurrentCarCoords(chosenRoute[idx]);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(chosenRoute[idx], { animate: true, duration: 0.6 });
      }
    }, 800);
  };

  const handleResetJourney = () => {
    if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    setIsDriving(false);
    setCarProgressIndex(0);
    const chosenRoute = selectedPathType === 'DETOUR'
      ? ((liveRoadDetour && liveRoadDetour.coordinates.length > 0) ? liveRoadDetour.coordinates : activeDest.detourRouteCoords)
      : ((liveRoadPrimary && liveRoadPrimary.coordinates.length > 0) ? liveRoadPrimary.coordinates : activeDest.primaryRouteCoords);
    setCurrentCarCoords(chosenRoute[0]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(chosenRoute[0], 15);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-[#F8F9FA] font-sans">
      {/* 1. Left Direction & Route Selection Sidebar (Normal Vehicles) */}
      {/* On desktop: standard 420px sidebar. On mobile: floating Google Maps-style collapsible top panel */}
      <div className={`w-full lg:w-[420px] bg-[#FFFFFF] border-r border-[#DADCE0] flex flex-col justify-between p-4 sm:p-5 z-20 shadow-md transition-all duration-300 ${isMobilePanelExpanded
        ? 'absolute inset-x-0 top-0 bottom-0 z-[600] overflow-y-auto max-h-screen'
        : 'hidden lg:flex max-h-screen overflow-y-auto'
        }`}>
        <div className="space-y-4">
          {/* Section Header with Mobile Close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#E8F0FE] text-[#1A73E8] border border-[#DADCE0]">
                <Car className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#202124] tracking-tight">
                  Normal Vehicle Directions & Detour
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[#5F6368] font-mono font-medium">
                    CIVILIAN ROUTE DISPATCH
                  </span>
                  {isRoutingLoading ? (
                    <span className="text-[9px] bg-[#FEF7E0] text-[#B06000] border border-[#F9AB00]/30 px-1.5 py-0.5 rounded font-medium animate-pulse">
                      Calculating Route...
                    </span>
                  ) : (
                    <span className="text-[9px] bg-[#E6F4EA] text-[#188038] border border-[#CEEAD6] px-1.5 py-0.5 rounded font-medium">
                      ✓ Real Road Network
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Close / Collapse button */}
            <button
              onClick={() => setIsMobilePanelExpanded(false)}
              className="lg:hidden p-2 rounded-xl text-[#5F6368] hover:bg-[#F1F3F4] border border-[#DADCE0]"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-[#5F6368]">
            Enter origin and destination. Navigation aligns with actual street curves, turns, and highway geometry.
          </p>

          {/* Origin & Destination Inputs */}
          <div className="bg-[#F8F9FA] rounded-xl p-4 border border-[#DADCE0] space-y-3">
            {/* Origin */}
            <div>
              <label className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider block mb-1">
                Starting Location
              </label>
              <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#DADCE0] rounded-lg px-3 py-2 text-xs text-[#202124] shadow-sm">
                <MapPin className="w-4 h-4 text-[#1A73E8] flex-shrink-0" />
                <span className="truncate flex-1 font-medium">{origin}</span>
                <button
                  onClick={handleUseCurrentGPS}
                  title="Use my real GPS location"
                  className="p-1 rounded-md bg-[#E8F0FE] text-[#1A73E8] hover:bg-[#D2E3FC] text-[10px] font-bold px-2 transition"
                >
                  GPS
                </button>
              </div>
            </div>

            {/* Destination Selection */}
            <div>
              <label className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider block mb-1">
                Target Destination
              </label>
              <select
                value={selectedDestIndex}
                onChange={(e) => {
                  setSelectedDestIndex(Number(e.target.value));
                  handleResetJourney();
                }}
                className="w-full bg-[#FFFFFF] border border-[#DADCE0] rounded-lg px-3 py-2 text-xs text-[#202124] font-medium focus:outline-none focus:border-[#1A73E8] shadow-sm"
              >
                {destinationPresets.map((preset, idx) => (
                  <option key={idx} value={idx}>
                    {preset.name} ({preset.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BOTTLENECK ALERT & COMPLIMENTARY ROUTE SUGGESTION CARD */}
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#DADCE0] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#D93025]" />
                Live Traffic Status
              </span>
              <span className="text-[10px] bg-[#FCE8E6] text-[#D93025] px-2 py-0.5 rounded-full border border-[#FAD2CF] font-bold">
                HEAVY BOTTLENECK
              </span>
            </div>

            <div className="text-xs bg-[#FCE8E6]/50 border border-[#FAD2CF] rounded-lg p-3">
              <div className="font-bold text-[#D93025] mb-0.5">
                {activeDest.bottleneckName}
              </div>
              <p className="text-[11px] text-[#5F6368]">
                Cause: {activeDest.bottleneckCause}
              </p>
            </div>

            {/* Two Route Choices: Suggested Detour vs Primary Congested */}
            <div className="space-y-2 pt-1">
              {/* Option 1: Suggested Alternative Detour (Recommended) */}
              <div
                onClick={() => setSelectedPathType('DETOUR')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${selectedPathType === 'DETOUR'
                  ? 'border-[#188038] bg-[#E6F4EA]/40 shadow-sm ring-2 ring-[#188038]/30'
                  : 'border-[#DADCE0] bg-[#FFFFFF] hover:border-[#BDC1C6]'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#188038]"></span>
                    <strong className="text-xs font-bold text-[#202124]">Suggested Detour Route</strong>
                  </div>
                  <span className="bg-[#188038] text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                    RECOMMENDED
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#5F6368] mt-1">
                  <span>Travel Time: <strong className="text-[#188038] font-bold">{activeDest.detourDurationMins} mins</strong></span>
                  <span className="text-[#5F6368]">{activeDest.detourDistanceKm} km</span>
                </div>
                <div className="mt-2 text-[11px] text-[#137333] font-medium flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Saves ~{activeDest.congestedDurationMins - activeDest.detourDurationMins} mins (Bypasses traffic bottleneck)
                </div>
              </div>

              {/* Option 2: Primary Congested Route */}
              <div
                onClick={() => setSelectedPathType('PRIMARY')}
                className={`p-3 rounded-xl border cursor-pointer transition ${selectedPathType === 'PRIMARY'
                  ? 'border-[#D93025] bg-[#FCE8E6]/40 ring-2 ring-[#D93025]/30'
                  : 'border-[#DADCE0] bg-[#FFFFFF] hover:border-[#BDC1C6]'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D93025]"></span>
                    <strong className="text-xs font-bold text-[#202124]">Direct Highway (Blocked)</strong>
                  </div>
                  <span className="text-[10px] text-[#D93025] font-bold">
                    +{(activeDest.congestedDurationMins - activeDest.normalDurationMins)}m Delay
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#5F6368]">
                  <span>Travel Time: <strong className="text-[#D93025] font-bold">{activeDest.congestedDurationMins} mins</strong></span>
                  <span>{activeDest.primaryDistanceKm} km</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Start / Drive Controls Footer */}
        <div className="pt-4 border-t border-[#DADCE0] space-y-3">
          <div className="flex items-center justify-between text-xs text-[#5F6368]">
            <span>Selected Path: <strong className={selectedPathType === 'DETOUR' ? 'text-[#188038]' : 'text-[#D93025]'}>{selectedPathType === 'DETOUR' ? 'Detour Route' : 'Blocked Highway'}</strong></span>
            <span className="font-mono text-[#202124] font-bold">{drivingSpeedKmph} km/h</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleStartJourney}
              className={`btn-interactive flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition shadow-sm ${isDriving
                ? 'bg-[#F9AB00] hover:bg-[#E37400] text-[#202124]'
                : 'bg-[#1A73E8] hover:bg-[#1558B0] text-white'
                }`}
            >
              {isDriving ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              {isDriving ? 'Pause Driving' : 'Start Journey'}
            </button>

            <button
              onClick={handleResetJourney}
              className="btn-interactive flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold bg-[#FFFFFF] hover:bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0] transition shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Position
            </button>

            {onReportIncident && (
              <button
                onClick={onReportIncident}
                className="btn-interactive flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] border border-[#DADCE0] transition shadow-sm"
              >
                <AlertTriangle className="w-4 h-4 text-[#1A73E8]" />
                Report Hazard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Right Dedicated Map for Normal Vehicles */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {/* Leaflet Google Map Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* MOBILE FLOATING SEARCH & NAVIGATION BAR (Google Maps Pattern) */}
        <div className="lg:hidden absolute top-3 inset-x-3 z-[500] pointer-events-none flex flex-col gap-2">
          {/* Compact Google Maps Search Box */}
          <div className="pointer-events-auto bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl shadow-lg p-2.5 flex items-center justify-between gap-2">
            <button
              onClick={() => setIsMobilePanelExpanded(!isMobilePanelExpanded)}
              className="flex-1 flex items-center gap-2 text-left truncate"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#1A73E8]"></span>
                <span className="w-0.5 h-3 bg-[#DADCE0]"></span>
                <span className="w-2 h-2 rounded-full bg-[#D93025]"></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-[#5F6368] truncate">From: {origin.replace(' (Detected)', '')}</div>
                <div className="text-xs font-bold text-[#202124] truncate flex items-center gap-1">
                  <span>To: {activeDest.name}</span>
                </div>
              </div>
              <span className="p-1 rounded-lg bg-[#F1F3F4] text-[#1A73E8]">
                <SlidersHorizontal className="w-4 h-4" />
              </span>
            </button>

            {/* Quick Play / Pause Button in mobile search bar */}
            <button
              onClick={handleStartJourney}
              className={`p-2 rounded-xl text-white font-bold transition shadow-sm flex items-center gap-1 text-xs px-3 ${isDriving ? 'bg-[#F9AB00] text-[#202124]' : 'bg-[#1A73E8]'
                }`}
            >
              {isDriving ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span className="hidden sm:inline">{isDriving ? 'Pause' : 'Start'}</span>
            </button>
          </div>

          {/* Active Mobile Turn-by-Turn Pill */}
          <div className="pointer-events-auto bg-[#FFFFFF] border border-[#DADCE0] rounded-xl px-3 py-2 shadow-md flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <CornerUpRight className="w-4 h-4 text-[#1A73E8] flex-shrink-0" />
              <div className="truncate">
                <span className="font-bold text-[#202124]">In 650m: </span>
                <span className="text-[#5F6368]">Sector 58 Bypass Link</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0 pl-2">
              <span className="font-mono font-bold text-[#188038]">
                {selectedPathType === 'DETOUR' ? activeDest.detourDurationMins : activeDest.congestedDurationMins}m
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Top Floating Map Controls */}
        <div className="hidden lg:flex absolute top-4 left-4 right-4 z-[500] pointer-events-none flex-wrap items-center justify-between gap-3">
          {/* Active Navigation HUD Bar */}
          <div className="pointer-events-auto bg-[#FFFFFF] border border-[#DADCE0] px-4 py-2.5 rounded-xl shadow-md flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CornerUpRight className="w-5 h-5 text-[#1A73E8]" />
              <div>
                <div className="text-xs font-bold text-[#202124]">
                  Next Turn: In 650m take Sector 58 Bypass Link
                </div>
                <div className="text-[10px] text-[#5F6368]">
                  Target: <span className="text-[#202124] font-medium">{activeDest.name}</span>
                </div>
              </div>
            </div>
            <div className="h-6 w-px bg-[#DADCE0]"></div>
            <div className="text-right">
              <div className="text-[10px] text-[#5F6368] uppercase font-semibold">ETA</div>
              <div className="text-sm font-mono font-bold text-[#188038]">
                {selectedPathType === 'DETOUR' ? activeDest.detourDurationMins : activeDest.congestedDurationMins} min
              </div>
            </div>
          </div>

          {/* Tile Switcher */}
          <div className="pointer-events-auto flex items-center gap-1 bg-[#FFFFFF] p-1.5 rounded-xl border border-[#DADCE0] shadow-md text-xs">
            <button
              onClick={() => setMapStyle('GOOGLE_STREETS')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${mapStyle === 'GOOGLE_STREETS' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
            >
              Google Streets
            </button>
            <button
              onClick={() => setMapStyle('GOOGLE_SATELLITE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${mapStyle === 'GOOGLE_SATELLITE' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle('DARK_MATTER')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${mapStyle === 'DARK_MATTER' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
            >
              Dark HUD
            </button>
          </div>
        </div>

        {/* Floating Signal HUD during Vehicle Navigation */}
        <div className="absolute bottom-16 sm:bottom-20 left-3 right-3 sm:left-6 sm:right-6 z-[450] pointer-events-none flex flex-col items-center">
          <UnifiedSignalHUD
            signals={signals.slice(0, 3)}
            title="Next Signals On Navigation Path"
            advisoryText="Cruising Advisory: 42–46 km/h"
            defaultExpanded={false}
          />
        </div>

        {/* Bottom Route Summary Pill (Responsive placement) */}
        <div className="absolute bottom-4 left-3 right-3 sm:right-auto sm:left-6 z-[500] pointer-events-none">
          <div className="pointer-events-auto bg-[#FFFFFF] border border-[#DADCE0] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-md text-xs space-y-1">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#188038] animate-pulse"></span>
                <strong className="text-[#202124]">Civilian Route:</strong>
                <span className="text-[#188038] font-bold">{selectedPathType === 'DETOUR' ? 'Detour (Clear)' : 'Direct (Congested)'}</span>
              </div>
              <button
                onClick={() => setSelectedPathType(selectedPathType === 'DETOUR' ? 'PRIMARY' : 'DETOUR')}
                className="lg:hidden text-[11px] text-[#1A73E8] font-bold underline pl-2"
              >
                Switch
              </button>
            </div>
            <div className="text-[#5F6368] text-[11px] hidden sm:block">
              Click on either the <strong className="text-[#188038]">Green Detour line</strong> or <strong className="text-[#D93025]">Red Blocked line</strong> on the map to switch routes anytime.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

