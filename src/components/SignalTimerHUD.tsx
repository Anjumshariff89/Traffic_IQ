import React from 'react';
import { TrafficSignal } from '../types/traffic';
import { Radio, Compass, AlertOctagon, Zap, ShieldCheck } from 'lucide-react';

interface SignalTimerHUDProps {
  signals: TrafficSignal[];
  onManualOverride?: (signalId: string) => void;
  userSpeedKmph?: number;
}

export const SignalTimerHUD: React.FC<SignalTimerHUDProps> = ({
  signals,
  onManualOverride,
  userSpeedKmph = 42
}) => {
  return (
    <div className="bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl p-5 shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[#DADCE0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#188038] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#188038]"></span>
            </span>
            <h2 className="text-lg font-bold text-[#202124] tracking-tight flex items-center gap-2">
              In-Vehicle HUD & Live Signal Release Predictor
            </h2>
            <span className="bg-[#E8F0FE] text-[#1A73E8] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#DADCE0]">
              V2X Connected
            </span>
          </div>
          <p className="text-xs text-[#5F6368] mt-1">
            Real-time telemetry showing countdown to Green/Red release for upcoming signals on your travel trajectory.
          </p>
        </div>

        {/* Speed / Green Wave Advisory */}
        <div className="flex items-center gap-4 bg-[#F8F9FA] px-4 py-2 rounded-xl border border-[#DADCE0]">
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-[#5F6368]">Your Cruising Speed</div>
            <div className="text-lg font-mono font-bold text-[#188038]">{userSpeedKmph} km/h</div>
          </div>
          <div className="h-8 w-px bg-[#DADCE0]"></div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#5F6368] flex items-center gap-1">
              <Compass className="w-3 h-3 text-[#1A73E8]" /> Green Wave Advisory
            </div>
            <div className="text-xs font-semibold text-[#1A73E8]">Maintain 42-46 km/h to catch 3 Green Lights</div>
          </div>
        </div>
      </div>

      {/* Signal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {signals.map((sig, idx) => {
          const isNextImmediate = idx === 0;
          const statusBg =
            sig.currentStatus === 'GREEN'
              ? 'border-[#CEEAD6] bg-[#FFFFFF]'
              : sig.currentStatus === 'YELLOW'
                ? 'border-[#FEF7E0] bg-[#FFFFFF]'
                : 'border-[#FAD2CF] bg-[#FFFFFF]';

          return (
            <div
              key={sig.id}
              className={`relative rounded-xl p-4 border transition-all duration-300 card-interactive ${statusBg} ${isNextImmediate ? 'ring-2 ring-[#1A73E8]/50 shadow-md scale-[1.01]' : 'shadow-sm'
                }`}
            >
              {/* Badge for immediate next or override */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]">
                  {sig.id}
                </span>
                {sig.emergencyOverridden ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-[#D93025] text-white font-semibold px-2 py-0.5 rounded-full animate-pulse">
                    <Zap className="w-3 h-3" /> EMERGENCY GREEN WAVE
                  </span>
                ) : isNextImmediate ? (
                  <span className="text-[10px] bg-[#1A73E8] text-white font-semibold px-2 py-0.5 rounded">
                    NEXT INTERSECTION
                  </span>
                ) : (
                  <span className="text-[10px] text-[#5F6368]">
                    +{sig.distanceFromUserMeters}m
                  </span>
                )}
              </div>

              {/* Junction title */}
              <h3 className="font-semibold text-sm text-[#202124] truncate" title={sig.name}>
                {sig.name}
              </h3>
              <p className="text-[11px] text-[#5F6368] mb-3 truncate">{sig.junction}</p>

              {/* Physical Traffic Light Graphic & Giant Countdown */}
              <div className="flex items-center justify-between bg-[#F8F9FA] rounded-xl p-3 border border-[#DADCE0]">
                {/* Visual 3-light pillar */}
                <div className="bg-[#FFFFFF] p-1.5 rounded-lg border border-[#DADCE0] flex flex-col gap-1.5 items-center shadow-inner">
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${sig.currentStatus === 'RED'
                        ? 'bg-[#D93025] shadow-[0_0_8px_rgba(217,48,37,0.7)] scale-110'
                        : 'bg-[#D93025]/20'
                      }`}
                  />
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${sig.currentStatus === 'YELLOW'
                        ? 'bg-[#F9AB00] shadow-[0_0_8px_rgba(249,171,0,0.7)] scale-110'
                        : 'bg-[#F9AB00]/20'
                      }`}
                  />
                  <div
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${sig.currentStatus === 'GREEN'
                        ? 'bg-[#188038] shadow-[0_0_8px_rgba(24,128,56,0.7)] scale-110'
                        : 'bg-[#188038]/20'
                      }`}
                  />
                </div>

                {/* Big Digital Timer Display */}
                <div className="text-right flex-1 pl-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6368]">
                    {sig.currentStatus === 'GREEN'
                      ? 'Green Time Left'
                      : sig.currentStatus === 'YELLOW'
                        ? 'Changing In'
                        : 'Time to Green'}
                  </div>
                  <div className="flex items-baseline justify-end gap-1">
                    <span
                      className={`text-4xl font-black font-mono tracking-tight ${sig.currentStatus === 'GREEN'
                          ? 'text-[#188038]'
                          : sig.currentStatus === 'YELLOW'
                            ? 'text-[#B06000]'
                            : 'text-[#D93025]'
                        }`}
                    >
                      {String(sig.timeRemaining).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-mono text-[#5F6368]">sec</span>
                  </div>
                  <div className="text-[10px] text-[#5F6368]">
                    {sig.currentStatus === 'RED' ? (
                      <span className="text-[#188038] font-medium">Turns GREEN soon</span>
                    ) : sig.currentStatus === 'GREEN' ? (
                      <span className="text-[#5F6368]">Cycle: {sig.greenDuration}s</span>
                    ) : (
                      <span className="text-[#B06000]">Prepare to stop</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Speed match & distance bar */}
              <div className="mt-3 pt-2 border-t border-[#DADCE0] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-[#5F6368]">
                  <Radio className="w-3 h-3 text-[#1A73E8]" />
                  <span>Target:</span>
                  <span className="font-semibold text-[#202124]">{sig.recommendedSpeedKmph} km/h</span>
                </div>
                <div className="text-[#5F6368]">
                  {Math.round(sig.distanceFromUserMeters / 1000 * 10) / 10} km away
                </div>
              </div>

              {/* Quick controller override button */}
              {onManualOverride && (
                <button
                  onClick={() => onManualOverride(sig.id)}
                  className="btn-interactive mt-2.5 w-full text-[11px] py-1.5 px-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F1F3F4] text-[#1A73E8] font-semibold transition flex items-center justify-center gap-1.5 border border-[#DADCE0] shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1A73E8]" />
                  {sig.emergencyOverridden ? 'Reset Override' : 'Force Green Wave'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

