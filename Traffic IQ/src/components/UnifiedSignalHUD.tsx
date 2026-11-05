import React, { useState } from 'react';
import { TrafficSignal } from '../types/traffic';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';

export interface UnifiedSignalHUDProps {
  signals: TrafficSignal[];
  title?: string;
  advisoryText?: string;
  isEmergencyCorridor?: boolean;
  onSelectSignal?: (sig: TrafficSignal) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const UnifiedSignalHUD: React.FC<UnifiedSignalHUDProps> = ({
  signals,
  title = 'Upcoming Signal Countdown On Your Route',
  advisoryText = 'Green Wave Advisory: 42–46 km/h',
  isEmergencyCorridor = false,
  onSelectSignal,
  className = '',
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  if (!signals || signals.length === 0) return null;

  return (
    <div className={`pointer-events-auto w-full max-w-4xl bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl p-3 sm:p-4 shadow-lg transition-all ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#DADCE0] pb-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 animate-ping ${
              isEmergencyCorridor ? 'bg-[#D93025]' : 'bg-[#1A73E8]'
            }`}
          />
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#202124] truncate">
            {title}
          </span>
          {isEmergencyCorridor && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-[#FCE8E6] text-[#D93025] border border-[#FAD2CF] font-bold px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" /> Priority V2X
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs flex-shrink-0">
          {advisoryText && (
            <span
              className={`text-[11px] sm:text-xs font-semibold flex items-center gap-1 ${
                isEmergencyCorridor ? 'text-[#D93025]' : 'text-[#188038]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden xs:inline truncate">{advisoryText}</span>
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#5F6368] hover:text-[#202124] p-1 rounded-lg hover:bg-[#F1F3F4] transition"
            aria-label={isExpanded ? 'Collapse Signal HUD' : 'Expand Signal HUD'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Signal Cards Grid */}
      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 overflow-x-auto">
          {signals.map((sig) => {
            const isEmergencyGreen = isEmergencyCorridor && (sig.emergencyOverridden || sig.currentStatus === 'GREEN');
            const isRed = !isEmergencyGreen && sig.currentStatus === 'RED';
            const isGreen = isEmergencyGreen || sig.currentStatus === 'GREEN';
            const isYellow = !isEmergencyGreen && sig.currentStatus === 'YELLOW';

            const colorTheme = isEmergencyGreen
              ? 'border-[#188038] bg-[#E6F4EA]/60 text-[#188038] ring-1 ring-[#188038]/40'
              : isGreen
              ? 'border-[#CEEAD6] bg-[#E6F4EA]/40 text-[#188038]'
              : isRed
              ? 'border-[#FAD2CF] bg-[#FCE8E6]/40 text-[#D93025]'
              : 'border-[#FEEFC3] bg-[#FEF7E0]/40 text-[#B06000]';

            return (
              <div
                key={sig.id}
                onClick={() => onSelectSignal?.(sig)}
                className={`p-2 sm:p-2.5 rounded-xl border ${colorTheme} cursor-pointer card-interactive hover:shadow-sm transition-all`}
              >
                {/* Top row: ID and distance or Emergency Priority Badge */}
                <div className="flex items-center justify-between text-[10px] text-[#5F6368] font-mono mb-1">
                  <span className="font-semibold text-[#202124]">{sig.id}</span>
                  {sig.emergencyOverridden ? (
                    <span className="text-[9px] bg-[#D93025] text-white font-bold px-1.5 py-0.2 rounded-full">
                      V2X
                    </span>
                  ) : (
                    <span>+{sig.distanceFromUserMeters}m</span>
                  )}
                </div>

                {/* Junction Name */}
                <div className="text-xs font-bold text-[#202124] truncate" title={sig.name}>
                  {sig.name.split('-')[0].trim()}
                </div>

                {/* 3-light indicator + Countdown */}
                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-[#DADCE0]/60">
                  {/* Traffic Light Dot Cluster */}
                  <div className="flex flex-col gap-0.5 items-center p-1 bg-white/80 rounded border border-[#DADCE0] shadow-2xs">
                    <span
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isRed ? 'bg-[#D93025] shadow-[0_0_6px_rgba(217,48,37,0.7)] scale-110' : 'bg-[#D93025]/25'
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isYellow ? 'bg-[#F9AB00] shadow-[0_0_6px_rgba(249,171,0,0.7)] scale-110' : 'bg-[#F9AB00]/25'
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isGreen ? 'bg-[#188038] shadow-[0_0_6px_rgba(24,128,56,0.7)] scale-110' : 'bg-[#188038]/25'
                      }`}
                    />
                  </div>

                  {/* Countdown Number & State Label */}
                  <div className="text-right pl-2">
                    <span className="block text-[9px] uppercase font-bold text-[#5F6368] leading-none">
                      {isEmergencyGreen
                        ? 'Corridor Green'
                        : isGreen
                        ? 'Green Left'
                        : isRed
                        ? 'To Green'
                        : 'Yellow'}
                    </span>
                    <div className="flex items-baseline justify-end gap-0.5 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black font-mono tracking-tight leading-none">
                        {sig.emergencyOverridden ? '⚡' : `${sig.timeRemaining}`}
                      </span>
                      {!sig.emergencyOverridden && (
                        <span className="text-[10px] font-mono text-[#5F6368]">s</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target speed hint */}
                <div className="mt-1 text-[9px] text-[#5F6368] flex items-center justify-between truncate">
                  <span className="truncate">Speed match:</span>
                  <span className="font-bold text-[#202124]">{sig.recommendedSpeedKmph} km/h</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

