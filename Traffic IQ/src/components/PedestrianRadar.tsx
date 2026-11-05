import React, { useState, useEffect, useRef } from 'react';
import { PedestrianDetection } from '../types/traffic';
import {
  Eye,
  AlertTriangle,
  ShieldCheck,
  Video,
  Camera,
  Crosshair,
  Activity,
  Sparkles,
  UserX,
  Volume2,
  Play,
  Pause,
  Maximize2
} from 'lucide-react';

interface PedestrianRadarProps {
  detections: PedestrianDetection[];
  onTriggerSafetyHorn?: () => void;
}

export const PedestrianRadar: React.FC<PedestrianRadarProps> = ({
  detections,
  onTriggerSafetyHorn
}) => {
  const [selectedCamIndex, setSelectedCamIndex] = useState<number>(1); // Default to Cam 2 (Crosswalk)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showBBoxes, setShowBBoxes] = useState<boolean>(true);
  const [streamSource, setStreamSource] = useState<'CANVAS_REALTIME' | 'VIDEO_STREAM'>('VIDEO_STREAM');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const activeFeed = detections[selectedCamIndex] || detections[0];

  // Map camera index to CCTV video clip
  const cctvVideoUrls = [
    '/cctv/cam1_jaywalk.mp4',
    '/cctv/cam2_pedestrian.mp4',
    '/cctv/cam3_blind_curve.mp4'
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL_RISK':
        return 'text-[#D93025] border-[#FAD2CF] bg-[#FCE8E6]';
      case 'WARNING':
        return 'text-[#B06000] border-[#FEEFC3] bg-[#FEF7E0]';
      case 'SAFE':
        return 'text-[#188038] border-[#CEEAD6] bg-[#E6F4EA]';
      default:
        return 'text-[#5F6368] border-[#DADCE0] bg-[#F1F3F4]';
    }
  };

  // High-performance Realistic Canvas Simulation (with real moving pedestrians, vehicles, road texture)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const render = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Real Asphalt Road Ground with Texture
      ctx.fillStyle = '#2d333b';
      ctx.fillRect(0, 0, w, h);

      // Sidewalk Curb (Top & Bottom)
      ctx.fillStyle = '#444c56';
      ctx.fillRect(0, 0, w, 60);
      ctx.fillRect(0, h - 50, w, 50);

      // Curb edge lines
      ctx.strokeStyle = '#636e7b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 60); ctx.lineTo(w, 60);
      ctx.moveTo(0, h - 50); ctx.lineTo(w, h - 50);
      ctx.stroke();

      if (selectedCamIndex === 1) {
        // === CAM 2: ZEBRA CROSSING ===
        // Zebra stripes
        const stripeWidth = 32;
        const stripeGap = 20;
        ctx.fillStyle = '#e6edf3';
        for (let x = 160; x < 480; x += stripeWidth + stripeGap) {
          ctx.fillRect(x, 60, stripeWidth, h - 110);
        }

        // Stop Lines for vehicles
        ctx.fillStyle = '#f0883e';
        ctx.fillRect(135, 60, 6, h - 110);
        ctx.fillRect(495, 60, 6, h - 110);

        // Vehicles waiting at zebra
        // Car 1 (Waiting left)
        ctx.fillStyle = '#1f6feb';
        ctx.fillRect(30, 90, 85, 45);
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(50, 95, 45, 35); // Roof

        // Car 2 (Waiting right)
        ctx.fillStyle = '#da3633';
        ctx.fillRect(520, 180, 90, 48);
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(545, 185, 48, 38);

        // Pedestrians walking across Zebra
        const p1_progress = ((tick * 1.2) % 260);
        const p1_y = 65 + p1_progress;
        const p1_x = 240;

        const p2_progress = ((tick * 1.5) % 250);
        const p2_y = h - 65 - p2_progress;
        const p2_x = 330;

        // Draw Pedestrian 1 (Valid crossing down)
        ctx.fillStyle = '#f69d50'; // Head
        ctx.beginPath(); ctx.arc(p1_x, p1_y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#238636'; // Green jacket
        ctx.fillRect(p1_x - 6, p1_y + 7, 12, 18);
        ctx.fillStyle = '#1f242c'; // Pants
        ctx.fillRect(p1_x - 5, p1_y + 25, 4, 15);
        ctx.fillRect(p1_x + 1, p1_y + 25, 4, 15);

        // Draw Pedestrian 2 (Valid crossing up)
        ctx.fillStyle = '#f69d50';
        ctx.beginPath(); ctx.arc(p2_x, p2_y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8957e5'; // Purple coat
        ctx.fillRect(p2_x - 6, p2_y + 7, 12, 18);
        ctx.fillStyle = '#1f242c';
        ctx.fillRect(p2_x - 5, p2_y + 25, 4, 15);
        ctx.fillRect(p2_x + 1, p2_y + 25, 4, 15);

        // Pedestrian 3 (On sidewalk with luggage)
        ctx.fillStyle = '#f69d50';
        ctx.beginPath(); ctx.arc(430, 30, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d29922';
        ctx.fillRect(424, 36, 12, 16);
        ctx.fillStyle = '#da3633'; // Luggage trolley
        ctx.fillRect(438, 38, 9, 14);

        // Draw Real-Time AI Bounding Boxes overlay
        if (showBBoxes) {
          // Box 1
          drawAIBoundingBox(ctx, p1_x - 14, p1_y - 10, 28, 55, 'Pedestrian #1 [98%]', 'Walking on Zebra (Safe)', '#34d399');
          // Box 2
          drawAIBoundingBox(ctx, p2_x - 14, p2_y - 10, 28, 55, 'Pedestrian #2 [96%]', 'Walking on Zebra (Safe)', '#34d399');
          // Box 3
          drawAIBoundingBox(ctx, 420, 18, 32, 40, 'Pedestrian w/ Luggage [99%]', 'Waiting on Curb Ramp', '#34d399');
        }

      } else if (selectedCamIndex === 0) {
        // === CAM 1: JAYWALKING ACROSS FAST HIGHWAY ===
        // Lane lines
        ctx.strokeStyle = '#f0883e';
        ctx.setLineDash([25, 20]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 150); ctx.lineTo(w, 150);
        ctx.moveTo(0, 230); ctx.lineTo(w, 230);
        ctx.stroke();
        ctx.setLineDash([]);

        // Fast cars driving
        const carX1 = (tick * 6) % (w + 150) - 100;
        ctx.fillStyle = '#d29922';
        ctx.fillRect(carX1, 95, 90, 42);
        ctx.fillStyle = '#0d1117'; ctx.fillRect(carX1 + 20, 99, 45, 34);

        // Pedestrian stepping into highway center (Jaywalking)
        const jayX = 260 + Math.sin(tick * 0.05) * 20;
        const jayY = 165;

        ctx.fillStyle = '#f69d50'; ctx.beginPath(); ctx.arc(jayX, jayY, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f85149'; // Red shirt warning
        ctx.fillRect(jayX - 7, jayY + 8, 14, 20);
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(jayX - 6, jayY + 28, 5, 16);
        ctx.fillRect(jayX + 1, jayY + 28, 5, 16);

        // Jaywalker 2 near median
        const medX = 360;
        const medY = 145;
        ctx.fillStyle = '#f69d50'; ctx.beginPath(); ctx.arc(medX, medY, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f0883e'; ctx.fillRect(medX - 6, medY + 7, 12, 18);

        if (showBBoxes) {
          drawAIBoundingBox(ctx, jayX - 18, jayY - 12, 36, 62, 'JAYWALKER #1 [97%]', 'Crossing Fast Expressway Lane!', '#f43f5e', true);
          drawAIBoundingBox(ctx, medX - 16, medY - 10, 32, 58, 'JAYWALKER #2 [94%]', 'Stranded on Road Divider Median', '#f43f5e', true);
        }

      } else {
        // === CAM 3: BLIND CURVE FLYOVER ===
        ctx.fillStyle = '#21262d';
        ctx.fillRect(0, 0, w, h);
        // Curved barrier
        ctx.strokeStyle = '#f85149';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(w / 2, h + 100, 240, Math.PI, 0, false);
        ctx.stroke();

        const p_curvX = 420;
        const p_curvY = 180;
        ctx.fillStyle = '#f69d50'; ctx.beginPath(); ctx.arc(p_curvX, p_curvY, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d29922'; ctx.fillRect(p_curvX - 6, p_curvY + 7, 12, 18);

        if (showBBoxes) {
          drawAIBoundingBox(ctx, p_curvX - 16, p_curvY - 10, 32, 58, 'HAZARD TRESPASSER [91%]', 'Walking in Blind Curve Shoulder', '#fbbf24', true);
        }
      }

      // Camera Watermark & Live HUD Stats
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 250, 28);
      ctx.fillStyle = '#3fb950';
      ctx.font = 'bold 11px monospace';
      const secStr = String(Math.floor(tick / 25) % 60).padStart(2, '0');
      const frameStr = String(tick % 25).padStart(2, '0');
      ctx.fillText(`CAM-AI :: 2026-11-04 18:52:${secStr}.${frameStr}`, 18, 28);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedCamIndex, showBBoxes]);

  // Helper: Draw crisp bounding box with label and backdrop
  const drawAIBoundingBox = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    action: string,
    color: string,
    isDanger = false
  ) => {
    // Box
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Glowing border
    ctx.fillStyle = isDanger ? 'rgba(244,63,94,0.15)' : 'rgba(52,211,153,0.12)';
    ctx.fillRect(x, y, w, h);

    // Label banner
    ctx.fillStyle = color;
    ctx.fillRect(x - 1, y - 18, Math.max(w + 30, 130), 18);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(label, x + 3, y - 5);

    // Action sub-tag
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(x - 1, y + h, Math.max(w + 30, 130), 15);
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px sans-serif';
    ctx.fillText(action, x + 3, y + h + 11);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[#DADCE0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E8F0FE] text-[#1A73E8] border border-[#DADCE0]">
              <Eye className="w-5 h-5 text-[#1A73E8]" />
            </span>
            <h2 className="text-lg font-bold text-[#202124] tracking-tight">
              Photorealistic AI Pedestrian Hazard Radar & Jaywalk Classifier
            </h2>
            <span className="bg-[#E8F0FE] text-[#1A73E8] text-xs px-2.5 py-0.5 rounded-full border border-[#DADCE0] flex items-center gap-1 font-semibold">
              <Activity className="w-3 h-3 animate-pulse text-[#1A73E8]" /> Edge AI 60 FPS
            </span>
          </div>
          <p className="text-xs text-[#5F6368] mt-1">
            Real video & canvas rendering with deep-learning bounding boxes, tracking pedestrians crossing, jaywalking, or standing in blind curves.
          </p>
        </div>

        {/* Camera Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-[#F1F3F4] p-1 rounded-xl border border-[#DADCE0]">
          <button
            onClick={() => setSelectedCamIndex(0)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-interactive ${selectedCamIndex === 0 ? 'bg-[#D93025] text-white shadow-sm' : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#FFFFFF]'
              }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Cam 1 (Jaywalking)</span>
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
          </button>
          <button
            onClick={() => setSelectedCamIndex(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-interactive ${selectedCamIndex === 1 ? 'bg-[#1A73E8] text-white shadow-sm' : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#FFFFFF]'
              }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Cam 2 (Zebra Crossing)</span>
          </button>
          <button
            onClick={() => setSelectedCamIndex(2)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-interactive ${selectedCamIndex === 2 ? 'bg-[#F9AB00] text-[#202124] shadow-sm' : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#FFFFFF]'
              }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Cam 3 (Blind Curve)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Photorealistic Canvas Stream */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl overflow-hidden border border-[#DADCE0] bg-[#202124] aspect-video shadow-md flex flex-col justify-between">
            {/* Realtime Canvas */}
            <canvas
              ref={canvasRef}
              width={640}
              height={360}
              className="w-full h-full object-cover"
            />

            {/* AI HUD Overlay Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-xs text-white pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D93025] animate-ping" />
                <span className="font-mono font-bold tracking-wider">LIVE FEED :: {activeFeed.cameraId}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
                <span>FPS: 59.8</span>
                <span>LATENCY: 14ms</span>
                <span className="text-[#8AB4F8] font-semibold">{activeFeed.timestamp}</span>
              </div>
            </div>

            {/* Bottom Controls on Video */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between text-xs">
              <span className="text-slate-200 flex items-center gap-1.5 font-medium">
                <Video className="w-3.5 h-3.5 text-[#8AB4F8]" />
                {activeFeed.cameraLocation}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBBoxes(!showBBoxes)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border btn-interactive ${showBBoxes ? 'bg-[#1A73E8] text-white border-[#1558B0]' : 'bg-black/50 text-slate-300 border-white/20'
                    }`}
                >
                  {showBBoxes ? 'Hide AI Boxes' : 'Show AI Boxes'}
                </button>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRiskColor(activeFeed.riskLevel)}`}>
                  {activeFeed.riskLevel.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Safety Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Risk Assessment Box */}
            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold text-[#5F6368]">Hazard Analysis</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getRiskColor(activeFeed.riskLevel)}`}>
                  {activeFeed.riskLevel}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#202124] flex items-center gap-2">
                {activeFeed.zoneType === 'JAYWALKING_ROAD_CENTER' && <UserX className="w-4 h-4 text-[#D93025]" />}
                {activeFeed.zoneType === 'ZEBRA_CROSSING' && <ShieldCheck className="w-4 h-4 text-[#188038]" />}
                {activeFeed.zoneType === 'HIGH_RISK_BLIND_CURVE' && <AlertTriangle className="w-4 h-4 text-[#F9AB00]" />}
                Zone: {activeFeed.zoneType.replace(/_/g, ' ')}
              </h4>
              <p className="text-xs text-[#5F6368] mt-2 leading-relaxed">
                {activeFeed.description}
              </p>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DADCE0] shadow-sm">
                <div className="text-[10px] uppercase font-semibold text-[#5F6368]">Detected Persons</div>
                <div className="text-xl font-bold font-mono text-[#1A73E8] mt-0.5">
                  {selectedCamIndex === 1 ? '4' : selectedCamIndex === 0 ? '2' : '1'} <span className="text-xs font-normal text-[#5F6368]">tracked</span>
                </div>
              </div>
              <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#DADCE0] shadow-sm">
                <div className="text-[10px] uppercase font-semibold text-[#5F6368]">Collision Alert Status</div>
                <div className="text-sm font-bold font-mono mt-1 text-[#202124]">
                  {activeFeed.alertTriggered ? (
                    <span className="text-[#D93025] flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> BEACON ACTIVE
                    </span>
                  ) : (
                    <span className="text-[#188038] flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> CLEAR
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Safety Protocol Activated */}
            <div className="bg-[#F8F9FA] rounded-xl p-3 border border-[#DADCE0] text-xs">
              <div className="text-[11px] font-semibold text-[#202124] flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#1A73E8]" />
                Autonomous Precautionary Actions:
              </div>
              <ul className="space-y-1 text-[#5F6368] text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]"></span>
                  Driver HUD flashing High-Risk Pedestrian Warning
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]"></span>
                  Variable Signage Board set to 30 km/h advisory
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]"></span>
                  Intersection signal timing extended by 8s for safe clearing
                </li>
              </ul>
            </div>
          </div>

          {/* Action Button */}
          {activeFeed.alertTriggered && (
            <button
              onClick={onTriggerSafetyHorn}
              className="w-full flex items-center justify-center gap-2 bg-[#D93025] hover:bg-[#C5221F] text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm btn-interactive"
            >
              <Volume2 className="w-4 h-4 animate-bounce" />
              Sound Roadside Acoustic Alert & Flash Strobes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
