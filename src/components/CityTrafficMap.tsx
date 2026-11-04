import React from 'react';
import { TrafficSignal, RoadblockPrediction, EmergencyVehicle, ComplimentaryRoute } from '../types/traffic';
import { 
  Navigation, 
  Layers, 
  MapPin, 
  AlertTriangle, 
  Siren, 
  Compass, 
  CheckCircle2, 
  Radio
} from 'lucide-react';

interface CityTrafficMapProps {
  signals: TrafficSignal[];
  roadblocks: RoadblockPrediction[];
  selectedRoadblock: RoadblockPrediction | null;
  selectedRoute: ComplimentaryRoute | null;
  emergencies: EmergencyVehicle[];
  onSelectSignal?: (sig: TrafficSignal) => void;
  onSelectRoadblock?: (rb: RoadblockPrediction) => void;
}

export const CityTrafficMap: React.FC<CityTrafficMapProps> = ({
  signals,
  roadblocks,
  selectedRoadblock,
  selectedRoute,
  emergencies,
  onSelectSignal,
  onSelectRoadblock
}) => {
  // SVG Geographic Projection Helpers
  // Map bounds in Delhi NCR region mock coordinates:
  // Lat: 28.610 to 28.660 (Span ~0.050)
  // Lng: 77.340 to 77.400 (Span ~0.060)
  const minLat = 28.615;
  const maxLat = 28.658;
  const minLng = 77.342;
  const maxLng = 77.402;

  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 1000;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 600;
    return { x, y };
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl p-5 shadow-sm relative overflow-hidden">
      {/* Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E8F0FE] text-[#1A73E8] border border-[#DADCE0]">
              <Navigation className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#202124] tracking-tight">
              Live City GIS Network & Corridor Vector Grid
            </h2>
            <span className="text-xs bg-[#F1F3F4] text-[#5F6368] px-2 py-0.5 rounded-full border border-[#DADCE0] font-medium">
              Real-Time Dynamic Mesh
            </span>
          </div>
          <p className="text-xs text-[#5F6368] mt-1">
            Visualizing active bottlenecks, emergency green corridors, detour routes, and signal release status.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-[#F8F9FA] px-3 py-1.5 rounded-xl border border-[#DADCE0] text-xs">
          <div className="flex items-center gap-1.5 text-[#5F6368]">
            <span className="w-3 h-3 rounded-full bg-[#188038] inline-block shadow-sm"></span>
            <span>Signal Green</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#5F6368]">
            <span className="w-3 h-3 rounded-full bg-[#D93025] inline-block shadow-sm"></span>
            <span>Signal Red / Roadblock</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#188038] font-medium">
            <span className="w-4 h-1 bg-[#188038] inline-block rounded"></span>
            <span>Complimentary Route</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#D93025] font-medium">
            <span className="w-4 h-1 bg-[#D93025] inline-block rounded"></span>
            <span>Emergency Corridor</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Map Canvas */}
      <div className="relative w-full aspect-[16/9] max-h-[500px] bg-[#F8F9FA] rounded-xl overflow-hidden border border-[#DADCE0] shadow-inner">
        {/* Subtle Map Grid lines */}
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full select-none"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E8EAED" strokeWidth="0.8" />
            </pattern>
            <linearGradient id="emergencyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D93025" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EA4335" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="greenDetourGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#188038" />
              <stop offset="100%" stopColor="#34A853" />
            </linearGradient>
          </defs>

          {/* Background grid */}
          <rect width="1000" height="600" fill="url(#grid)" />

          {/* Base Road Network (Highways & Boulevards) */}
          <g stroke="#BDC1C6" strokeWidth="6" strokeLinecap="round" opacity="0.6">
            {/* Main Arterial Expressway */}
            <path d="M 80,480 Q 300,380 500,280 T 920,80" fill="none" />
            {/* Cross Avenue */}
            <path d="M 120,100 Q 400,250 850,520" fill="none" />
            {/* Outer Ring loop */}
            <path d="M 220,520 Q 550,560 880,420" fill="none" />
            {/* North Connector */}
            <path d="M 320,120 Q 600,100 850,220" fill="none" />
            {/* Vertical spine */}
            <path d="M 500,80 L 520,550" fill="none" />
          </g>

          {/* Bottlenecks / Roadblocks Layer */}
          {roadblocks.map((rb) => {
            const isSelected = selectedRoadblock?.id === rb.id;
            const points = rb.coordinates.map(c => project(c[0], c[1]));
            const pathData = points.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x},${curr.y}`, '');

            return (
              <g key={rb.id} className="cursor-pointer" onClick={() => onSelectRoadblock?.(rb)}>
                {/* Thick Red Warning Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={isSelected ? 10 : 7}
                  strokeDasharray="6,4"
                  className="animate-pulse"
                />
                {/* Midpoint marker with warning sign */}
                {points[1] && (
                  <g transform={`translate(${points[1].x}, ${points[1].y})`}>
                    <circle r="14" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fill="#fee2e2" fontSize="11" fontWeight="bold">!</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Selected Complimentary Detour Route (Green Wave) */}
          {selectedRoute && (
            <g>
              {(() => {
                const routePoints = selectedRoute.coordinates.map(c => project(c[0], c[1]));
                const pathData = routePoints.reduce((acc, curr, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${curr.x},${curr.y}`, '');
                return (
                  <>
                    <path
                      d={pathData}
                      fill="none"
                      stroke="url(#greenDetourGlow)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="10,6"
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </>
                );
              })()}
            </g>
          )}

          {/* Active Emergency Corridors */}
          {emergencies.filter(e => e.status !== 'CLEARED').map((ev) => {
            const pStart = project(ev.currentCoordinates[0], ev.currentCoordinates[1]);
            const pDest = project(ev.destinationCoordinates[0], ev.destinationCoordinates[1]);

            return (
              <g key={ev.id}>
                {/* Pulsing Emergency Path */}
                <line
                  x1={pStart.x}
                  y1={pStart.y}
                  x2={pDest.x}
                  y2={pDest.y}
                  stroke="#ef4444"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="8,5"
                  className="animate-pulse"
                />

                {/* Emergency Vehicle Icon Node */}
                <g transform={`translate(${pStart.x}, ${pStart.y})`}>
                  <circle r="18" fill="#991b1b" className="animate-ping" opacity="0.5" />
                  <circle r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                  <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                    {ev.type === 'AMBULANCE' ? '🚑' : '🚒'}
                  </text>
                </g>

                {/* Destination Node */}
                <g transform={`translate(${pDest.x}, ${pDest.y})`}>
                  <circle r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                  <circle r="4" fill="#ef4444" />
                </g>
              </g>
            );
          })}

          {/* Traffic Signal Nodes */}
          {signals.map((sig) => {
            const pos = project(sig.coordinates[0], sig.coordinates[1]);
            const colorFill = 
              sig.currentStatus === 'GREEN' ? '#10b981' :
              sig.currentStatus === 'YELLOW' ? '#f59e0b' : '#f43f5e';

            return (
              <g
                key={sig.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onClick={() => onSelectSignal?.(sig)}
              >
                {/* Halo */}
                <circle
                  r="16"
                  fill={colorFill}
                  opacity="0.25"
                  className={sig.currentStatus === 'GREEN' ? 'animate-pulse' : ''}
                />
                {/* Main Body */}
                <circle
                  r="9"
                  fill="#090d16"
                  stroke={colorFill}
                  strokeWidth="2.5"
                />
                <circle r="4.5" fill={colorFill} />

                {/* Overhead Badge Countdown Label */}
                <rect
                  x="-16"
                  y="-26"
                  width="32"
                  height="14"
                  rx="4"
                  fill="#020617"
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="-16"
                  textAnchor="middle"
                  fill={colorFill}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {sig.timeRemaining}s
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Overlay HUD Pill */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs flex items-center gap-3 backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>GIS Grid: <strong className="text-white">Active Sector 62-65</strong></span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="text-slate-400">
            Signal Mesh: <strong className="text-emerald-400">All 5 Nodes Online</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

