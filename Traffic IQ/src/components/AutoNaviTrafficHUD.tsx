import React, { useState, useEffect } from 'react';
import { TrafficSignal, EmergencyVehicle, RoadblockPrediction } from '../types/traffic';
import { 
  ArrowUp, 
  ArrowUpRight, 
  CornerUpRight, 
  Compass, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Siren, 
  AlertTriangle,
  LocateFixed,
  Zap
} from 'lucide-react';

interface AutoNaviTrafficHUDProps {
  signals: TrafficSignal[];
  emergencies: EmergencyVehicle[];
  roadblocks: RoadblockPrediction[];
  currentSpeedKmph: number;
  onSpeedChange?: (speed: number) => void;
  streetName?: string;
  destinationName?: string;
}

export const AutoNaviTrafficHUD: React.FC<AutoNaviTrafficHUDProps> = ({
  signals,
  emergencies,
  roadblocks,
  currentSpeedKmph,
  onSpeedChange,
  streetName = 'Grand Trunk Boulevard (West Highway)',
  destinationName = 'Apollo Medical Hub & Central City'
}) => {
  const [muted, setMuted] = useState(false);
  const [lanePosition, setLanePosition] = useState(2); // 0=left, 1=center-left, 2=center-right, 3=right
  const [carOffset, setCarOffset] = useState(0);

  // Active emergency alert on path
  const activeEmergency = emergencies.find(e => e.status !== 'CLEARED');
  const activeRoadblock = roadblocks[0];

  // Subtle car breathing/sway animation while driving
  useEffect(() => {
    const interval = setInterval(() => {
      setCarOffset((prev) => (prev === 0 ? 1 : 0));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[9/19] max-h-[820px] bg-slate-950 rounded-[42px] border-[8px] border-slate-900 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden font-sans select-none flex flex-col justify-between">
      {/* 1. Phone Top Status Bar */}
      <div className="relative z-30 pt-3 px-6 pb-2 flex items-center justify-between text-[11px] text-slate-300 font-medium">
        <div className="flex items-center gap-1.5 font-bold font-mono">
          <span>15:46</span>
          <span className="text-[10px] text-cyan-400">● 5G</span>
        </div>
        {/* Dynamic Island / Notch Speaker */}
        <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center border border-slate-800">
          <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700"></div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-emerald-400">Beidou/GPS</span>
          <span>87%</span>
        </div>
      </div>

      {/* 2. Top Turn Navigation Banner (Exactly like screenshot) */}
      <div className="relative z-30 mx-4 mt-1 bg-gradient-to-r from-blue-950/95 via-indigo-950/95 to-slate-900/95 rounded-3xl p-4 border border-blue-500/30 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          {/* Speedometer Ring */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-cyan-500/80 bg-slate-950/80 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <div className="text-center">
              <span className="text-2xl font-black font-mono text-white leading-none block">
                {currentSpeedKmph}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase">km/h</span>
            </div>
          </div>

          {/* Turn Arrow + Distance */}
          <div className="flex-1 pl-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CornerUpRight className="w-7 h-7 text-white stroke-[2.5]" />
                <span className="text-2xl font-black text-white tracking-tight">1.2 km</span>
              </div>
              <button 
                onClick={() => setMuted(!muted)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Lane Guidance Arrows with Active Lane highlighted */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold mr-1">Lanes</span>
                {/* Lane 1 */}
                <ArrowUp className={`w-3.5 h-3.5 ${lanePosition === 0 ? 'text-emerald-400 stroke-[3]' : 'text-slate-500'}`} />
                {/* Lane 2 */}
                <ArrowUp className={`w-3.5 h-3.5 ${lanePosition === 1 ? 'text-emerald-400 stroke-[3]' : 'text-slate-500'}`} />
                {/* Lane 3 (Recommended) */}
                <div className="relative">
                  <ArrowUp className={`w-4 h-4 ${lanePosition === 2 ? 'text-emerald-400 stroke-[3] animate-pulse' : 'text-slate-500'}`} />
                  <span className="absolute -top-1.5 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                {/* Lane 4 (Turn Right) */}
                <ArrowUpRight className={`w-3.5 h-3.5 ${lanePosition === 3 ? 'text-emerald-400 stroke-[3]' : 'text-slate-500'}`} />
              </div>

              {/* Green Wave Match speed recommendation */}
              <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Wave: 45 km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real 3D Perspective Roadway with Floating Signal Countdown HUD Bubbles */}
      <div className="relative flex-1 w-full overflow-hidden perspective-[600px]">
        {/* Perspective Road Surface */}
        <div 
          className="absolute inset-0 origin-bottom transform rotateX-[56deg] scale-y-[1.2] flex justify-center"
          style={{ background: 'radial-gradient(circle at 50% 10%, #090e1a 0%, #020617 100%)' }}
        >
          {/* Main Highway Canvas */}
          <div className="relative w-[340px] h-full bg-[#1b2333] border-x-4 border-slate-600 shadow-2xl flex justify-center">
            {/* Green Recommended Wave Corridor Lane in Center */}
            <div className="absolute top-0 bottom-0 w-[110px] bg-gradient-to-b from-emerald-600/40 via-emerald-500/35 to-emerald-600/20 border-x-2 border-dashed border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              {/* Chinese/English Lane Designation Markings */}
              <div className="absolute top-[28%] w-full text-center text-white/40 font-bold text-[11px] tracking-widest uppercase rotate-180 transform">
                Recommended Green Lane
              </div>
              <div className="absolute top-[68%] w-full text-center text-white/40 font-bold text-[11px] tracking-widest uppercase rotate-180 transform">
                Wave Corridor
              </div>
            </div>

            {/* Left & Right Asphalt Lanes */}
            <div className="absolute left-0 top-0 bottom-0 w-[110px] border-r border-dashed border-slate-500/50"></div>
            <div className="absolute right-0 top-0 bottom-0 w-[110px] border-l border-dashed border-slate-500/50"></div>

            {/* Zebra Pedestrian Crosswalks across intersections */}
            {/* Near Intersection Zebra */}
            <div className="absolute bottom-[240px] w-full flex justify-center gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
                <div key={k} className="w-4 h-14 bg-white/70"></div>
              ))}
            </div>

            {/* Distant Intersection Zebra */}
            <div className="absolute bottom-[520px] w-full flex justify-center gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((k) => (
                <div key={k} className="w-3 h-8 bg-white/50"></div>
              ))}
            </div>

            {/* Painted Road Direction Arrows */}
            <div className="absolute bottom-[80px] w-full flex justify-around px-8 text-white/60">
              <ArrowUp className="w-7 h-10 stroke-[3]" />
              <ArrowUp className="w-7 h-10 stroke-[3] text-emerald-300" />
              <ArrowUpRight className="w-7 h-10 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* 4. FLOATING 3D TRAFFIC SIGNAL COUNTDOWN BUBBLES (MATCHING SCREENSHOT) */}

        {/* === SIGNAL 1 (IMMEDIATE UPCOMING - RED 8s WITH STRAIGHT ARROW) === */}
        {signals[1] && (
          <div className="absolute bottom-[280px] left-1/2 transform -translate-x-[20px] z-20 flex flex-col items-center">
            {/* The Famous Dual-Pill Countdown Bubble */}
            <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-110">
              {/* Pulsing Glow behind badge */}
              <div className="absolute -inset-1 rounded-full bg-rose-600/40 blur-sm animate-pulse"></div>

              {/* Main Rounded Pill Container */}
              <div className="relative flex items-center bg-[#241014] border-2 border-rose-500 rounded-full px-2.5 py-1.5 shadow-[0_0_20px_rgba(244,63,94,0.6)]">
                {/* Red Circular Arrow Disc */}
                <div className="w-8 h-8 rounded-full bg-rose-600 border border-white/50 flex items-center justify-center shadow-inner">
                  <ArrowUp className="w-5 h-5 text-white stroke-[3.5]" />
                </div>
                {/* Big Bold Countdown Seconds */}
                <div className="pl-2.5 pr-2">
                  <span className="text-2xl font-black font-mono text-white leading-none">
                    {signals[1].timeRemaining}
                  </span>
                </div>
              </div>

              {/* Speech bubble pointer pointing down to the physical signal light */}
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-rose-500 mx-auto -mt-[1px]"></div>
            </div>

            {/* Physical Miniature Traffic Light Post on the road */}
            <div className="mt-1 bg-black/90 border border-slate-700 p-1 rounded-md shadow-lg flex flex-col gap-0.5 items-center">
              <div className={`w-2.5 h-2.5 rounded-full ${signals[1].currentStatus === 'RED' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-rose-950'}`}></div>
              <div className={`w-2.5 h-2.5 rounded-full ${signals[1].currentStatus === 'YELLOW' ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-amber-950'}`}></div>
              <div className={`w-2.5 h-2.5 rounded-full ${signals[1].currentStatus === 'GREEN' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-emerald-950'}`}></div>
            </div>
          </div>
        )}

        {/* === SIGNAL 2 (NEXT UPCOMING - GREEN 80s WITH CIRCULAR OUTLINE) === */}
        {signals[0] && (
          <div className="absolute bottom-[440px] right-[24%] z-20 flex flex-col items-center">
            <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-110">
              <div className="absolute -inset-1 rounded-full bg-emerald-500/40 blur-sm animate-pulse"></div>

              {/* Green Circular Badge matching screenshot (80) */}
              <div className="relative w-14 h-14 rounded-full bg-[#052e16]/90 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_18px_rgba(52,211,153,0.7)]">
                <span className="text-xl font-black font-mono text-emerald-300">
                  {signals[0].timeRemaining}
                </span>
              </div>
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-emerald-400 mx-auto -mt-[1px]"></div>
            </div>

            {/* Miniature Traffic Light */}
            <div className="mt-1 bg-black/90 border border-slate-700 p-0.5 rounded shadow flex flex-col gap-0.5 items-center scale-75">
              <div className="w-2 h-2 rounded-full bg-rose-950"></div>
              <div className="w-2 h-2 rounded-full bg-amber-950"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></div>
            </div>
          </div>
        )}

        {/* === SIGNAL 3 (THIRD DISTANT INTERSECTION - CIRCLE WITH VERTICAL LIGHTS ICON) === */}
        {signals[2] && (
          <div className="absolute bottom-[560px] left-[26%] z-20 flex flex-col items-center scale-90">
            <div className="relative group cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-slate-950/90 border-2 border-rose-400/80 flex items-center justify-center shadow-[0_0_14px_rgba(244,63,94,0.5)]">
                {/* Traffic Light glyph inside circle */}
                <div className="flex flex-col gap-1 items-center bg-black/80 p-1 rounded border border-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                </div>
              </div>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-rose-400 mx-auto -mt-[1px]"></div>
            </div>
          </div>
        )}

        {/* Emergency Vehicle Corridor Alert on road if active */}
        {activeEmergency && (
          <div className="absolute top-28 left-6 right-6 z-20 bg-red-950/90 border-2 border-red-500 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Siren className="w-5 h-5 text-red-400 animate-bounce" />
              <div>
                <div className="text-[11px] font-black text-white uppercase tracking-wider">
                  EMERGENCY CORRIDOR OVERRIDE
                </div>
                <div className="text-[10px] text-red-200">
                  {activeEmergency.type === 'AMBULANCE' ? 'Ambulance' : 'Fire Engine'} {activeEmergency.plateNumber} Approaching
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-white bg-red-600 px-2 py-0.5 rounded">
              ETA {activeEmergency.etaMinutes}m
            </span>
          </div>
        )}

        {/* Floating Mascot / Assistant Avatar (as seen on top right of screenshot) */}
        <div className="absolute top-8 right-5 z-20 flex flex-col items-center">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-lg">
              🤖
            </div>
          </div>
        </div>

        {/* Real User's Car Model on Road (as seen in screenshot with pulsing radar halo) */}
        <div 
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center transition-all duration-300"
          style={{ transform: `translateX(calc(-50% + ${carOffset}px))` }}
        >
          {/* Compass / Cardinal Direction Badge */}
          <div className="text-[10px] font-black text-rose-500 tracking-wider mb-1 flex items-center gap-3">
            <span className="text-slate-400 text-[9px]">西</span>
            <span className="bg-rose-950/80 px-1 rounded border border-rose-500/50">北 (North)</span>
            <span className="text-slate-400 text-[9px]">东</span>
          </div>

          {/* Pulsing Circular Safety Radar Halo under car */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-28 h-28 rounded-full border-2 border-rose-500/60 bg-rose-500/15 animate-ping"></div>
            <div className="absolute w-20 h-20 rounded-full border border-cyan-400/80 bg-cyan-500/10"></div>

            {/* 3D Realistic White EV Sedan (Front view looking ahead) */}
            <div className="relative w-14 h-20 bg-gradient-to-b from-slate-100 to-slate-300 rounded-2xl shadow-[0_12px_25px_rgba(0,0,0,0.8)] border-2 border-white flex flex-col justify-between p-1.5">
              {/* Rear Window / Roof */}
              <div className="w-full h-6 bg-slate-900 rounded-lg border border-slate-700/80"></div>
              {/* Brake Lights */}
              <div className="flex justify-between px-1">
                <div className="w-3 h-1.5 bg-rose-600 rounded-sm shadow-[0_0_8px_#f43f5e]"></div>
                <div className="w-3 h-1.5 bg-rose-600 rounded-sm shadow-[0_0_8px_#f43f5e]"></div>
              </div>
            </div>
          </div>

          {/* Current Road Name Label */}
          <div className="mt-3 bg-black/80 border border-slate-700 text-white font-bold text-xs px-3 py-1 rounded-full shadow-lg">
            {streetName}
          </div>
        </div>

        {/* Floating Quick Action Left Widget (Mode Switch / Overview) */}
        <div className="absolute bottom-28 left-4 z-20 flex flex-col gap-2">
          <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-2xl shadow-xl flex flex-col items-center gap-1 text-[9px] text-slate-300">
            <LocateFixed className="w-4 h-4 text-cyan-400" />
            <span>3D HUD</span>
          </div>
        </div>

        {/* Floating Parking / User Insight Widget (Right side) */}
        <div className="absolute bottom-28 right-4 z-20 bg-slate-900/90 border border-slate-700 rounded-2xl p-2.5 shadow-xl text-[10px] max-w-[110px]">
          <div className="text-rose-400 font-bold">● Stop & Go</div>
          <div className="text-slate-400 text-[9px] mt-0.5">56% drivers slow here</div>
        </div>
      </div>

      {/* 5. Bottom Navigation Summary Card (Exactly like the screenshot footer) */}
      <div className="relative z-30 mx-4 mb-4 bg-slate-900/95 border border-slate-800 rounded-3xl p-3.5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                NAV
              </span>
              <span className="text-base font-black text-white font-mono">
                4.1 km &nbsp; 10 mins
              </span>
              <span className="text-xs text-slate-400">₹4 Toll</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Estimated Arrival: <strong className="text-emerald-400 font-mono">15:56</strong> • {destinationName}
            </div>
          </div>

          {/* Lane Shift / Simulated Cruise Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSpeedChange?.(Math.max(0, currentSpeedKmph - 5))}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-xs font-bold"
            >
              -
            </button>
            <button
              onClick={() => onSpeedChange?.(Math.min(90, currentSpeedKmph + 5))}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-xs font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

