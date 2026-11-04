import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmergencyVehicle, TrafficControllerAlert, TrafficSignal } from '../types/traffic';
import { fetchRoadRoute } from '../services/routingService';
import { UnifiedSignalHUD } from './UnifiedSignalHUD';
import {
  Siren,
  Flame,
  Hospital,
  Radio,
  Volume2,
  VolumeX,
  CheckCheck,
  PlusCircle,
  Crosshair,
  Zap,
  Navigation,
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface EmergencyCorridorMapProps {
  emergencies: EmergencyVehicle[];
  alerts: TrafficControllerAlert[];
  signals: TrafficSignal[];
  onDispatchVehicle: (type: 'AMBULANCE' | 'FIRE_ENGINE', destination: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onClearCorridor: (vehicleId: string) => void;
}

// Destination coordinates lookup
const destinationCoordinatesMap: Record<string, [number, number]> = {
  'City General Super-Speciality Hospital (Trauma ICU)': [28.6510, 77.3950],
  'Fortis Critical Heart & Trauma Ward': [28.6495, 77.3910],
  'Commercial Sector 63 - Structural Fire': [28.6430, 77.3820],
  'Expressway KM 18 Collision Incident': [28.6360, 77.3730],
};

export const EmergencyCorridorMap: React.FC<EmergencyCorridorMapProps> = ({
  emergencies,
  alerts,
  signals,
  onDispatchVehicle,
  onAcknowledgeAlert,
  onClearCorridor
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const sirenAudioLoopRef = useRef<number | null>(null);

  const [mapStyle, setMapStyle] = useState<'DARK_COMMAND' | 'GOOGLE_STREETS' | 'GOOGLE_SATELLITE'>('GOOGLE_STREETS');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(emergencies[0]?.id || '');
  const [sirenSfx, setSirenSfx] = useState<boolean>(true);
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [newType, setNewType] = useState<'AMBULANCE' | 'FIRE_ENGINE'>('AMBULANCE');
  const [newDestination, setNewDestination] = useState<string>('City General Super-Speciality Hospital (Trauma ICU)');
  const [mobilePanelOpen, setMobilePanelOpen] = useState<boolean>(false);

  // Auto camera follow toggle
  const [autoFollow, setAutoFollow] = useState<boolean>(false);

  // Selected vehicle reference
  const selectedVehicle = emergencies.find(e => e.id === selectedVehicleId) || emergencies[0];
  const activeEmergencies = emergencies.filter(e => e.status !== 'CLEARED');
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  // Real road coordinates map for emergency vehicles
  const [realRoadRoutes, setRealRoadRoutes] = useState<Record<string, [number, number][]>>({});

  // Fetch real road geometry for emergency vehicle paths
  useEffect(() => {
    let isMounted = true;
    const abortCtrl = new AbortController();

    async function loadRoadRoutes() {
      for (const ev of emergencies) {
        const start = ev.currentCoordinates;
        const end = destinationCoordinatesMap[ev.destinationHospital] || ev.destinationCoordinates;
        const res = await fetchRoadRoute([start, end], { signal: abortCtrl.signal });
        if (res && res.coordinates.length > 0 && isMounted) {
          setRealRoadRoutes((prev) => ({
            ...prev,
            [ev.id]: res.coordinates
          }));
        }
      }
    }

    loadRoadRoutes();

    return () => {
      isMounted = false;
      abortCtrl.abort();
    };
  }, [emergencies]);

  // Dynamic Trajectories for ANY emergency vehicle (strictly follows road geometry if available)
  const getRoadWaypointsForVehicle = (ev: EmergencyVehicle): [number, number][] => {
    if (realRoadRoutes[ev.id] && realRoadRoutes[ev.id].length > 1) {
      return realRoadRoutes[ev.id];
    }

    const start = ev.currentCoordinates;
    const end = destinationCoordinatesMap[ev.destinationHospital] || ev.destinationCoordinates;

    // Intermediate realistic roadway waypoints fallback
    const mid1: [number, number] = [start[0] + (end[0] - start[0]) * 0.25 - 0.0015, start[1] + (end[1] - start[1]) * 0.25 + 0.0020];
    const mid2: [number, number] = [start[0] + (end[0] - start[0]) * 0.50 + 0.0010, start[1] + (end[1] - start[1]) * 0.50 + 0.0015];
    const mid3: [number, number] = [start[0] + (end[0] - start[0]) * 0.75 - 0.0008, start[1] + (end[1] - start[1]) * 0.75 + 0.0010];

    return [start, mid1, mid2, mid3, end];
  };

  // State storing real-time position, progress, and arrival status for EVERY emergency vehicle
  const [vehiclePositions, setVehiclePositions] = useState<Record<string, {
    coords: [number, number];
    headingDeg: number;
    speedKmph: number;
    pathIndex: number;
    progressRatio: number;
    strobePhase: number;
    hasArrived: boolean;
  }>>(() => {
    const initPos: Record<string, any> = {};
    emergencies.forEach((ev) => {
      initPos[ev.id] = {
        coords: ev.currentCoordinates,
        headingDeg: 45,
        speedKmph: 76,
        pathIndex: 0,
        progressRatio: 0,
        strobePhase: 0,
        hasArrived: false,
      };
    });
    return initPos;
  });

  // Reference that always holds latest live positions for instantaneous camera tracking
  const livePositionsRef = useRef(vehiclePositions);
  livePositionsRef.current = vehiclePositions;

  const googleTileLayers: Record<string, { url: string; subdomains: string[] }> = {
    DARK_COMMAND: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      subdomains: ['a', 'b', 'c', 'd'],
    },
    GOOGLE_STREETS: {
      url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      subdomains: ['0', '1', '2', '3'],
    },
    GOOGLE_SATELLITE: {
      url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      subdomains: ['0', '1', '2', '3'],
    },
  };

  // Two-tone Emergency Siren Synthesizer using Web Audio API
  const playSirenChirp = (isFire = false) => {
    if (!sirenSfx) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = isFire ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isFire ? 450 : 650, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isFire ? 850 : 950, audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) { }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.635, 77.372],
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
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (sirenAudioLoopRef.current) clearInterval(sirenAudioLoopRef.current);
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

  // Ensure new dispatched vehicles are immediately tracked in vehiclePositions
  useEffect(() => {
    setVehiclePositions((prev) => {
      const updated = { ...prev };
      emergencies.forEach((ev) => {
        if (!updated[ev.id]) {
          updated[ev.id] = {
            coords: ev.currentCoordinates,
            headingDeg: 50,
            speedKmph: 78,
            pathIndex: 0,
            progressRatio: 0,
            strobePhase: 0,
            hasArrived: false,
          };
        }
      });
      return updated;
    });

    if (emergencies.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(emergencies[0].id);
    }
  }, [emergencies]);

  // Continuous Realistic Movement Loop — STOPS AT DESTINATION (NO LOOPING)
  useEffect(() => {
    const moveTimer = setInterval(() => {
      setVehiclePositions((prev) => {
        const next = { ...prev };

        activeEmergencies.forEach((ev) => {
          const path = getRoadWaypointsForVehicle(ev);
          if (path.length < 2) return;

          const curr = next[ev.id] || {
            coords: path[0],
            headingDeg: 45,
            speedKmph: 75,
            pathIndex: 0,
            progressRatio: 0,
            strobePhase: 0,
            hasArrived: false
          };

          // If vehicle has arrived at destination, hold position at final destination coordinates
          if (curr.hasArrived) {
            const finalCoord = path[path.length - 1];
            next[ev.id] = {
              ...curr,
              coords: finalCoord,
              speedKmph: 0,
              strobePhase: (curr.strobePhase + 1) % 2
            };
            return;
          }

          let pIdx = curr.pathIndex;
          // Dynamically adjust speed based on coordinate density (dense road points need smaller ratio)
          const pStep = path.length > 30 ? 0.20 : 0.05;
          let pRatio = curr.progressRatio + pStep;

          // Check if reached the final waypoint segment
          if (pRatio >= 1.0) {
            if (pIdx >= path.length - 2) {
              // VEHICLE HAS REACHED FINAL DESTINATION! STOP HERE!
              const finalCoord = path[path.length - 1];
              next[ev.id] = {
                coords: finalCoord,
                headingDeg: curr.headingDeg,
                speedKmph: 0,
                pathIndex: path.length - 2,
                progressRatio: 1.0,
                strobePhase: 0,
                hasArrived: true,
              };
              return;
            } else {
              pRatio = 0;
              pIdx += 1;
            }
          }

          const p1 = path[pIdx];
          const p2 = path[pIdx + 1];

          // Linear interpolation between waypoints
          const curLat = p1[0] + (p2[0] - p1[0]) * pRatio;
          const curLng = p1[1] + (p2[1] - p1[1]) * pRatio;

          // Heading calculation
          const dLat = p2[0] - p1[0];
          const dLng = p2[1] - p1[1];
          const heading = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI);

          next[ev.id] = {
            coords: [curLat, curLng],
            headingDeg: heading,
            speedKmph: 72 + Math.floor(Math.sin(Date.now() / 600) * 10),
            pathIndex: pIdx,
            progressRatio: pRatio,
            strobePhase: (curr.strobePhase + 1) % 2,
            hasArrived: false
          };
        });

        return next;
      });
    }, 180);

    return () => clearInterval(moveTimer);
  }, [activeEmergencies]);

  // Auto-pan camera smoothly if autoFollow is active
  useEffect(() => {
    if (!autoFollow || !mapInstanceRef.current || !selectedVehicle) return;

    const cur = livePositionsRef.current[selectedVehicle.id];
    if (cur) {
      mapInstanceRef.current.panTo(cur.coords, { animate: true, duration: 0.5 });
    }
  }, [autoFollow, vehiclePositions, selectedVehicle]);

  // Periodic Siren Audio Tone Chirp
  useEffect(() => {
    if (sirenSfx && activeEmergencies.length > 0) {
      sirenAudioLoopRef.current = window.setInterval(() => {
        playSirenChirp(selectedVehicle?.type === 'FIRE_ENGINE');
      }, 3500);
    }
    return () => {
      if (sirenAudioLoopRef.current) clearInterval(sirenAudioLoopRef.current);
    };
  }, [sirenSfx, selectedVehicle, activeEmergencies.length]);

  // Render Map Layers: Green Corridors, Vehicles & Target Nodes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Emergency Transit Corridor Lines
    activeEmergencies.forEach((ev) => {
      const roadPath = getRoadWaypointsForVehicle(ev);
      const isSelected = selectedVehicle?.id === ev.id;
      const isAmbulance = ev.type === 'AMBULANCE';
      const corridorColor = isAmbulance ? '#ef4444' : '#f97316';

      // Wide Glow Aura Line
      layerGroup.addLayer(L.polyline(roadPath, {
        color: corridorColor,
        weight: isSelected ? 14 : 8,
        opacity: isSelected ? 0.45 : 0.25,
        lineCap: 'round',
        lineJoin: 'round',
      }));

      // Core Clear Green Wave Transit Line
      const corePolyline = L.polyline(roadPath, {
        color: '#10b981',
        weight: isSelected ? 6 : 4,
        opacity: 0.95,
        dashArray: '10, 6',
        lineCap: 'round',
      });
      corePolyline.on('click', () => setSelectedVehicleId(ev.id));
      layerGroup.addLayer(corePolyline);

      // Destination Hospital / Incident Target Pin
      const destCoords = roadPath[roadPath.length - 1];
      const destHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
          <div style="background: #FFFFFF; border: 2px solid ${corridorColor}; box-shadow: 0 2px 8px rgba(60,64,67,0.25); padding: 3px 9px; border-radius: 10px; display: flex; align-items: center; gap: 4px; color: #202124; font-weight: 700; font-size: 11px;">
            <span>${isAmbulance ? '🏥' : '🔥'}</span>
            <span>${ev.destinationHospital.split(' ')[0]}</span>
          </div>
          <div style="width: 2px; height: 5px; background: ${corridorColor};"></div>
          <div style="width: 8px; height: 8px; background: ${corridorColor}; border: 1.5px solid white; border-radius: 50%;"></div>
        </div>
      `;
      layerGroup.addLayer(L.marker(destCoords, {
        icon: L.divIcon({ html: destHtml, className: 'dest-marker', iconSize: [0, 0] })
      }));
    });

    // 2. Render Moving Emergency Vehicles (Ambulance / Fire Engine) with Rotating 3D Models
    activeEmergencies.forEach((ev) => {
      const pos = vehiclePositions[ev.id] || {
        coords: ev.currentCoordinates,
        headingDeg: 45,
        speedKmph: 75,
        strobePhase: 0,
        hasArrived: false
      };

      const isAmbulance = ev.type === 'AMBULANCE';
      const isRedStrobe = pos.strobePhase === 0;

      const vehicleHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); cursor: pointer;">
          <!-- Siren Light Aura Flare -->
          ${!pos.hasArrived ? `
            <div style="position: absolute; width: 68px; height: 68px; border-radius: 50%; background: ${isRedStrobe ? 'rgba(239,68,68,0.45)' : 'rgba(59,130,246,0.45)'}; box-shadow: 0 0 35px ${isRedStrobe ? '#ef4444' : '#3b82f6'}; animation: ping 1s infinite; z-index: 1;"></div>
          ` : `
            <div style="position: absolute; width: 68px; height: 68px; border-radius: 50%; background: rgba(16,185,129,0.3); border: 2px solid #10b981; z-index: 1;"></div>
          `}

          <!-- Vehicle Body Oriented Along Path Heading -->
          <div style="transform: rotate(${pos.headingDeg}deg); transition: transform 0.15s ease; z-index: 5;">
            <div style="width: 26px; height: 48px; background: ${isAmbulance ? '#ffffff' : '#dc2626'}; border: 2.5px solid #0f172a; border-radius: 8px; box-shadow: 0 6px 16px rgba(0,0,0,0.8); position: relative; display: flex; flex-direction: column; justify-content: space-between; padding: 2px;">
              <!-- Front Windshield -->
              <div style="width: 100%; height: 9px; background: #0f172a; border-radius: 3px;"></div>
              
              <!-- Roof Strobe Bar (Red & Blue Alternating) -->
              <div style="width: 100%; height: 6px; background: #020617; border-radius: 2px; display: flex; justify-content: space-between; padding: 1px;">
                <div style="width: 7px; height: 100%; background: ${isRedStrobe ? '#ef4444' : '#7f1d1d'}; box-shadow: 0 0 12px #ef4444; border-radius: 1px;"></div>
                <div style="width: 7px; height: 100%; background: ${!isRedStrobe ? '#3b82f6' : '#1e3a8a'}; box-shadow: 0 0 12px #3b82f6; border-radius: 1px;"></div>
              </div>

              <!-- Tail Lights -->
              <div style="width: 100%; height: 4px; display: flex; justify-content: space-between;">
                <div style="width: 4px; height: 4px; background: #ef4444;"></div>
                <div style="width: 4px; height: 4px; background: #ef4444;"></div>
              </div>
            </div>
          </div>

          <!-- Overhead Live Tag -->
          <div style="margin-top: 5px; background: #FFFFFF; border: 1.5px solid ${pos.hasArrived ? '#188038' : isAmbulance ? '#D93025' : '#E37400'}; box-shadow: 0 2px 6px rgba(60,64,67,0.2); padding: 2px 7px; border-radius: 8px; display: flex; align-items: center; gap: 4px; z-index: 10; white-space: nowrap;">
            <span style="font-size: 10px;">${isAmbulance ? '🚑' : '🚒'}</span>
            <span style="color: #202124; font-family: -apple-system, sans-serif; font-size: 10px; font-weight: 700;">${ev.plateNumber}</span>
            ${pos.hasArrived ? `
              <span style="color: #188038; font-weight: 700; font-size: 10px;">ARRIVED</span>
            ` : `
              <span style="color: #1A73E8; font-family: -apple-system, sans-serif; font-size: 10px; font-weight: bold;">${pos.speedKmph} km/h</span>
            `}
          </div>
        </div>
      `;

      const evMarker = L.marker(pos.coords, {
        icon: L.divIcon({ html: vehicleHtml, className: 'emergency-3d-unit', iconSize: [0, 0] }),
        zIndexOffset: 3000
      });

      evMarker.on('click', () => setSelectedVehicleId(ev.id));
      layerGroup.addLayer(evMarker);
    });

    // 3. Traffic Signals: Displaying Locked "EMERGENCY GREEN" Status
    signals.forEach((sig) => {
      const isGreen = sig.emergencyOverridden || sig.currentStatus === 'GREEN';
      const sigHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #0f172a; border: 2px solid ${isGreen ? '#10b981' : '#f59e0b'}; color: ${isGreen ? '#34d399' : '#fbbf24'}; padding: 2px 6px; border-radius: 8px; font-size: 9px; font-family: monospace; font-weight: 800; display: flex; align-items: center; gap: 3px; box-shadow: 0 0 12px ${isGreen ? 'rgba(16,185,129,0.8)' : 'rgba(245,158,11,0.5)'};">
            <span style="width: 5px; height: 5px; border-radius: 50%; background: ${isGreen ? '#10b981' : '#f59e0b'}; ${isGreen ? 'animation: pulse 1s infinite;' : ''}"></span>
            ${sig.emergencyOverridden ? '⚡GREEN CORRIDOR' : `${sig.timeRemaining}s`}
          </div>
          <div style="width: 2px; height: 5px; background: #64748b;"></div>
        </div>
      `;
      layerGroup.addLayer(L.marker(sig.coordinates, {
        icon: L.divIcon({ html: sigHtml, className: 'corridor-sig', iconSize: [0, 0] })
      }));
    });

  }, [activeEmergencies, vehiclePositions, selectedVehicle, signals]);

  // Center camera strictly on selected emergency vehicle
  const handleFollowVehicle = () => {
    if (!mapInstanceRef.current) return;

    const targetVehicle = selectedVehicle || activeEmergencies[0];
    if (!targetVehicle) return;

    // Direct access to latest live animated coordinates
    const livePos = livePositionsRef.current[targetVehicle.id];
    const targetCoords = livePos?.coords || targetVehicle.currentCoordinates;

    // Direct setView with zoom 16 for 100% instantaneous accuracy
    mapInstanceRef.current.setView(targetCoords, 16, { animate: true });
  };

  // Reset vehicle back to starting point so user can watch it drive again
  const handleReplayVehicle = (vehId: string) => {
    const ev = emergencies.find(e => e.id === vehId);
    if (!ev) return;
    const path = getRoadWaypointsForVehicle(ev);

    setVehiclePositions(prev => ({
      ...prev,
      [vehId]: {
        coords: path[0],
        headingDeg: 45,
        speedKmph: 78,
        pathIndex: 0,
        progressRatio: 0,
        strobePhase: 0,
        hasArrived: false
      }
    }));

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(path[0], 16, { animate: true });
    }
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatchVehicle(newType, newDestination);
    setShowDispatchModal(false);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-[#F8F9FA] font-sans">
      {/* 1. Left Dedicated Emergency Dispatch & Controller Panel */}
      <div className={`w-full lg:w-[420px] bg-[#FFFFFF] border-r border-[#DADCE0] flex flex-col justify-between p-4 sm:p-5 z-20 shadow-md transition-all duration-300 ${mobilePanelOpen
        ? 'absolute inset-x-0 top-0 bottom-0 z-[600] overflow-y-auto max-h-screen'
        : 'hidden lg:flex max-h-screen overflow-y-auto'
        }`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#DADCE0] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#FCE8E6] text-[#D93025] border border-[#FAD2CF]">
                <Siren className="w-5 h-5 text-[#D93025]" />
              </span>
              <div>
                <h2 className="text-base font-bold text-[#202124] tracking-tight">
                  Emergency Fleet Command
                </h2>
                <div className="flex items-center gap-2 text-[10px] text-[#D93025] font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#D93025] animate-ping"></span>
                  AMBULANCE & FIRE TRACKING
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSirenSfx(!sirenSfx)}
                title={sirenSfx ? 'Mute Siren SFX' : 'Enable Siren Audio'}
                className={`p-2 rounded-xl border transition ${sirenSfx
                  ? 'bg-[#FCE8E6] text-[#D93025] border-[#FAD2CF]'
                  : 'bg-[#F1F3F4] text-[#5F6368] border-[#DADCE0]'
                  }`}
              >
                {sirenSfx ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setMobilePanelOpen(false)}
                className="lg:hidden p-2 rounded-xl text-[#5F6368] hover:bg-[#F1F3F4] border border-[#DADCE0]"
                title="Close fleet panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Dispatch Unit Trigger */}
          <button
            onClick={() => setShowDispatchModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#D93025] hover:bg-[#C5221F] text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Dispatch New Ambulance / Fire Unit
          </button>

          {/* Traffic Controller Way Notification Card */}
          {unacknowledgedAlerts.length > 0 && (
            <div className="bg-[#FCE8E6]/60 border-l-4 border-[#D93025] border-y border-r border-[#FAD2CF] rounded-xl p-3.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase text-[#D93025] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  WAY CONTROLLER NOTIFIED
                </span>
                <span className="text-[10px] bg-[#D93025] text-white px-2 py-0.5 rounded font-medium">
                  PRIORITY 1
                </span>
              </div>
              <div className="text-xs font-bold text-[#202124]">
                {unacknowledgedAlerts[0].title}
              </div>
              <p className="text-[11px] text-[#5F6368]">
                {unacknowledgedAlerts[0].message}
              </p>
              <button
                onClick={() => onAcknowledgeAlert(unacknowledgedAlerts[0].id)}
                className="w-full mt-1 flex items-center justify-center gap-1 bg-[#188038] hover:bg-[#137333] text-white text-[11px] font-semibold py-1.5 rounded-lg transition shadow-sm"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Controller Acknowledge & Lock Green Wave
              </button>
            </div>
          )}

          {/* Active Emergency Vehicles List */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368] block">
              Active Priority Corridors ({activeEmergencies.length})
            </span>

            {activeEmergencies.map((ev) => {
              const isSelected = selectedVehicle?.id === ev.id;
              const isAmbulance = ev.type === 'AMBULANCE';
              const pos = vehiclePositions[ev.id];

              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    setSelectedVehicleId(ev.id);
                    if (mapInstanceRef.current && pos) {
                      mapInstanceRef.current.setView(pos.coords, 16, { animate: true });
                    }
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${isSelected
                    ? 'border-[#D93025] bg-[#FCE8E6]/40 ring-2 ring-[#D93025]/30 shadow-sm'
                    : 'border-[#DADCE0] bg-[#FFFFFF] hover:border-[#BDC1C6]'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${isAmbulance ? 'bg-[#FCE8E6] text-[#D93025]' : 'bg-[#FEF7E0] text-[#E37400]'} border border-[#DADCE0]`}>
                        {isAmbulance ? <Hospital className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#202124]">{ev.stationName.split(' ')[0]} {isAmbulance ? 'Ambulance' : 'Fire'}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]">
                            {ev.plateNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5F6368] truncate max-w-[210px]">
                          Target: {ev.destinationHospital}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry pill */}
                  <div className="grid grid-cols-3 gap-1.5 text-center mt-2 bg-[#F8F9FA] p-2 rounded-lg border border-[#DADCE0] text-[10px]">
                    <div>
                      <div className="text-[#5F6368]">Live Speed</div>
                      <div className="font-mono font-bold text-[#188038] text-xs">
                        {pos?.hasArrived ? '0 km/h' : `${pos?.speedKmph || 75} km/h`}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#5F6368]">Status</div>
                      <div className="font-mono font-bold text-[#1A73E8] text-xs">
                        {pos?.hasArrived ? 'ARRIVED' : `${ev.etaMinutes} min`}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#5F6368]">Signals</div>
                      <div className="font-mono font-bold text-[#188038] text-xs">
                        3 GREEN
                      </div>
                    </div>
                  </div>

                  {/* Controller Assigned & Status */}
                  <div className="mt-2 text-[10px] text-[#5F6368] flex items-center justify-between pt-2 border-t border-[#DADCE0]">
                    <span className="truncate">Desk: <strong className="text-[#202124]">{ev.assignedController.split('(')[0]}</strong></span>
                    <div className="flex items-center gap-1.5">
                      {pos?.hasArrived && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplayVehicle(ev.id);
                          }}
                          className="text-[10px] bg-[#E6F4EA] text-[#188038] hover:bg-[#CEEAD6] px-2 py-0.5 rounded font-bold border border-[#CEEAD6] flex items-center gap-1"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Re-run
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearCorridor(ev.id);
                        }}
                        className="text-[10px] bg-[#FFFFFF] hover:bg-[#F1F3F4] text-[#5F6368] px-2 py-0.5 rounded font-semibold border border-[#DADCE0]"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Focus Button */}
        <div className="pt-3 border-t border-[#DADCE0] space-y-2">
          <button
            onClick={handleFollowVehicle}
            className="w-full flex items-center justify-center gap-1.5 bg-[#1A73E8] hover:bg-[#1558B0] text-white text-xs font-semibold py-2.5 rounded-lg shadow-sm transition"
          >
            <Crosshair className="w-4 h-4" />
            Center Camera On Selected Vehicle
          </button>
        </div>
      </div>

      {/* 2. Right Dedicated Map Container (Ambulance & Fire Engine Tracking Only) */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* MOBILE FLOATING EMERGENCY HEADER */}
        <div className="lg:hidden absolute top-3 inset-x-3 z-[500] pointer-events-none flex flex-col gap-2">
          <div className="pointer-events-auto bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl shadow-lg p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D93025] animate-ping flex-shrink-0"></span>
              <div className="truncate">
                <div className="text-xs font-bold text-[#202124] truncate flex items-center gap-1.5">
                  <span>{selectedVehicle?.stationName.split(' ')[0]} {selectedVehicle?.type === 'AMBULANCE' ? 'Ambulance' : 'Fire Unit'}</span>
                </div>
                <div className="text-[10px] text-[#5F6368] truncate">
                  Target: {selectedVehicle?.destinationHospital.split('(')[0]}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setMobilePanelOpen(true)}
                className="p-1.5 rounded-lg bg-[#FCE8E6] text-[#D93025] text-xs font-bold px-2.5 border border-[#FAD2CF] flex items-center gap-1 btn-interactive"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Fleet
              </button>

              <button
                onClick={() => setShowDispatchModal(true)}
                className="p-1.5 rounded-lg bg-[#D93025] text-white text-xs font-bold px-2.5 shadow-sm btn-interactive"
              >
                + Dispatch
              </button>
            </div>
          </div>

          {/* Mobile Layer Selector Pill */}
          <div className="pointer-events-auto self-end flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-xl border border-[#DADCE0] shadow-md text-[11px]">
            <button
              onClick={() => setMapStyle('GOOGLE_STREETS')}
              className={`px-2.5 py-1 rounded-lg font-semibold btn-interactive ${mapStyle === 'GOOGLE_STREETS' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
            >
              Streets
            </button>
            <button
              onClick={() => setMapStyle('GOOGLE_SATELLITE')}
              className={`px-2.5 py-1 rounded-lg font-semibold btn-interactive ${mapStyle === 'GOOGLE_SATELLITE' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle('DARK_COMMAND')}
              className={`px-2.5 py-1 rounded-lg font-semibold btn-interactive ${mapStyle === 'DARK_COMMAND' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Top Floating Emergency Command Banner (Desktop) */}
        <div className="hidden lg:flex absolute top-4 left-4 right-4 z-[500] pointer-events-none flex-wrap items-center justify-between gap-3">
          <div className="pointer-events-auto bg-[#FFFFFF] border border-[#DADCE0] px-4 py-2.5 rounded-xl shadow-md flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D93025] animate-ping"></span>
            <div>
              <div className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
                <span>Priority Emergency Transit Corridor</span>
                <span className="bg-[#FCE8E6] text-[#D93025] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#FAD2CF] font-bold">
                  AUTOPILOT V2X
                </span>
              </div>
              <div className="text-[10px] text-[#5F6368]">
                Civilian roads held at RED • Emergency signals locked GREEN
              </div>
            </div>
          </div>

          {/* Map Layer Mode */}
          <div className="pointer-events-auto flex items-center gap-1 bg-[#FFFFFF] p-1.5 rounded-xl border border-[#DADCE0] shadow-md text-xs">
            <button
              onClick={() => setMapStyle('DARK_COMMAND')}
              className={`px-3 py-1.5 rounded-lg font-semibold btn-interactive ${mapStyle === 'DARK_COMMAND' ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:bg-[#F1F3F4]'
                }`}
            >
              Command Dark
            </button>
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
          </div>
        </div>

        {/* Bottom Floating Unified Emergency Signal HUD */}
        <div className="absolute bottom-16 sm:bottom-20 left-3 right-3 sm:left-6 sm:right-6 z-[450] pointer-events-none flex flex-col items-center">
          <UnifiedSignalHUD
            signals={signals.slice(0, 3)}
            title="Corridor Signal Interlocks (V2X Overrides)"
            advisoryText="Emergency Transit: Guaranteed Green Corridor"
            isEmergencyCorridor={true}
            defaultExpanded={false}
          />
        </div>

        {/* Bottom Legend Pill */}
        <div className="absolute bottom-4 left-3 right-3 sm:right-auto sm:left-6 z-[500] pointer-events-none">
          <div className="pointer-events-auto bg-[#FFFFFF] border border-[#DADCE0] rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-md text-xs flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 text-[#D93025] font-semibold text-[11px] sm:text-xs">
              <span>🚑</span> Ambulance
            </div>
            <div className="flex items-center gap-1.5 text-[#E37400] font-semibold text-[11px] sm:text-xs">
              <span>🚒</span> Fire Rescue
            </div>
            <div className="flex items-center gap-1.5 text-[#188038] font-semibold text-[11px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-[#188038] animate-pulse"></span>
              Green Wave
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Modal with maximum z-index */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative z-[100000] bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-modal-pop">
            <h3 className="text-base font-bold text-[#202124] mb-1.5 flex items-center gap-2">
              <Siren className="w-5 h-5 text-[#D93025]" />
              Dispatch Emergency Vehicle & Clear Corridor
            </h3>
            <p className="text-xs text-[#5F6368] mb-4">
              Instantly notifies assigned traffic controller with automatic green wave override.
            </p>

            <form onSubmit={handleDispatch} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                  Emergency Unit Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('AMBULANCE')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition ${newType === 'AMBULANCE'
                      ? 'border-[#D93025] bg-[#FCE8E6] text-[#D93025]'
                      : 'border-[#DADCE0] bg-[#F8F9FA] text-[#5F6368]'
                      }`}
                  >
                    <Hospital className="w-5 h-5" />
                    Ambulance (Trauma)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('FIRE_ENGINE')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition ${newType === 'FIRE_ENGINE'
                      ? 'border-[#E37400] bg-[#FEF7E0] text-[#E37400]'
                      : 'border-[#DADCE0] bg-[#F8F9FA] text-[#5F6368]'
                      }`}
                  >
                    <Flame className="w-5 h-5" />
                    Fire Engine (Rescue)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5F6368] block mb-1">
                  Destination Hospital / Fire Site
                </label>
                <select
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DADCE0] rounded-lg px-3 py-2 text-xs text-[#202124] focus:outline-none focus:border-[#1A73E8]"
                >
                  <option value="City General Super-Speciality Hospital (Trauma ICU)">City General Super-Speciality Hospital (Trauma ICU)</option>
                  <option value="Fortis Critical Heart & Trauma Ward">Fortis Critical Heart & Trauma Ward</option>
                  <option value="Commercial Sector 63 - Structural Fire">Commercial Sector 63 - Structural Fire</option>
                  <option value="Expressway KM 18 Collision Incident">Expressway KM 18 Collision Incident</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#D93025] hover:bg-[#C5221F] text-white shadow-sm transition"
                >
                  Activate Emergency Corridor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
