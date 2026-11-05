import React, { useState } from 'react';
import { RoadblockPrediction, ComplimentaryRoute, UserRole } from '../types/traffic';
import {
  AlertTriangle,
  CloudRain,
  Car,
  ShieldAlert,
  Clock,
  ArrowRight,
  CheckCircle2,
  MapPin,
  TrendingDown,
  Sparkles,
  Info,
  ShieldCheck,
  PlusCircle,
  Check
} from 'lucide-react';

interface RoadblockPredictorProps {
  roadblocks: RoadblockPrediction[];
  selectedRoadblock: RoadblockPrediction | null;
  onSelectRoadblock: (rb: RoadblockPrediction) => void;
  selectedRoute: ComplimentaryRoute | null;
  onSelectRoute: (route: ComplimentaryRoute) => void;
  userRole?: UserRole;
  onVerifyIncident?: (id: string) => void;
  onReportIncident?: () => void;
}

export const RoadblockPredictor: React.FC<RoadblockPredictorProps> = ({
  roadblocks,
  selectedRoadblock,
  onSelectRoadblock,
  selectedRoute,
  onSelectRoute,
  userRole = 'CITIZEN',
  onVerifyIncident,
  onReportIncident
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredRoadblocks = roadblocks.filter(rb =>
    filterSeverity === 'ALL' ? true : rb.severity === filterSeverity
  );

  const getCauseIcon = (cause: string) => {
    switch (cause) {
      case 'Waterlogging & Heavy Rain':
        return <CloudRain className="w-5 h-5 text-[#1A73E8]" />;
      case 'Multi-Vehicle Collision':
        return <Car className="w-5 h-5 text-[#D93025]" />;
      case 'VIP Motorcade Movement':
        return <ShieldAlert className="w-5 h-5 text-[#F9AB00]" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-[#F9AB00]" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-[#FCE8E6] text-[#D93025] border-[#FAD2CF]';
      case 'HIGH':
        return 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]';
      case 'MODERATE':
        return 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]';
      default:
        return 'bg-[#F1F3F4] text-[#5F6368] border-[#DADCE0]';
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl p-5 shadow-sm">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FCE8E6] text-[#D93025] border border-[#FAD2CF]">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-[#202124] tracking-tight">
              Roadblock AI Predictor & Cause Root-Analysis
            </h2>
            <span className="text-xs bg-[#E8F0FE] text-[#1A73E8] border border-[#DADCE0] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3" /> Predictive ML Engine
            </span>
          </div>
          <p className="text-xs text-[#5F6368] mt-1">
            Detects exact physical causes behind congestion and delivers guaranteed complimentary detour routes.
          </p>
        </div>

        {/* Right Controls: Report button + Severity Filters */}
        <div className="flex items-center gap-2">
          {onReportIncident && (
            <button
              onClick={onReportIncident}
              className="px-3 py-1.5 rounded-xl bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] border border-[#DADCE0] text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Road Hazard</span>
            </button>
          )}

          {/* Severity Filters */}
          <div className="flex items-center gap-1.5 bg-[#F1F3F4] p-1 rounded-xl border border-[#DADCE0]">
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold btn-interactive ${filterSeverity === sev
                    ? 'bg-[#1A73E8] text-white shadow-sm'
                    : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#FFFFFF]'
                  }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left List of Roadblocks */}
        <div className="lg:col-span-5 space-y-3 max-h-[580px] overflow-y-auto pr-1">
          {filteredRoadblocks.map((rb) => {
            const isSelected = selectedRoadblock?.id === rb.id;
            return (
              <div
                key={rb.id}
                onClick={() => {
                  onSelectRoadblock(rb);
                  if (rb.alternativeRoutes.length > 0) {
                    onSelectRoute(rb.alternativeRoutes[0]);
                  }
                }}
                className={`p-4 rounded-xl border cursor-pointer card-interactive ${isSelected
                    ? 'border-[#1A73E8] bg-[#E8F0FE]/40 ring-2 ring-[#1A73E8]/30 shadow-sm'
                    : 'border-[#DADCE0] bg-[#FFFFFF] hover:border-[#BDC1C6]'
                  }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#F8F9FA] border border-[#DADCE0]">
                      {getCauseIcon(rb.primaryCause)}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-[#202124]">{rb.roadName}</h4>
                      <div className="text-[11px] text-[#5F6368] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#5F6368]" />
                        {rb.startPoint} → {rb.endPoint}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(rb.severity)}`}>
                    {rb.severity}
                  </span>
                </div>

                {/* Primary Cause Chip */}
                <div className="bg-[#F8F9FA] rounded-lg p-2.5 border border-[#DADCE0] mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#D93025] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D93025]"></span>
                      Cause: {rb.primaryCause}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-[#188038]">
                      {rb.confidenceScore}% AI Confidence
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5F6368] line-clamp-2">
                    {rb.causeDetails}
                  </p>
                </div>

                {/* Delay Comparison */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FCE8E6]/40 p-2 rounded-lg border border-[#FAD2CF]">
                    <div className="text-[10px] text-[#5F6368] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#D93025]" /> Bottleneck Time
                    </div>
                    <div className="font-bold font-mono text-[#D93025] text-sm">
                      {rb.delayedTravelTimeMinutes} mins
                      <span className="text-[10px] font-normal text-[#5F6368] ml-1">(+{rb.delayedTravelTimeMinutes - rb.normalTravelTimeMinutes}m)</span>
                    </div>
                  </div>
                  <div className="bg-[#E6F4EA]/40 p-2 rounded-lg border border-[#CEEAD6]">
                    <div className="text-[10px] text-[#5F6368] flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-[#188038]" /> Detour Time
                    </div>
                    <div className="font-bold font-mono text-[#188038] text-sm">
                      {rb.alternativeRoutes[0]?.estimatedTimeMinutes || '--'} mins
                      <span className="text-[10px] font-normal text-[#137333] ml-1">
                        (-{rb.alternativeRoutes[0]?.savingsMinutes || '--'}m)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#1A73E8] font-medium">
                  <span>{rb.alternativeRoutes.length} Complimentary Detour Routes</span>
                  <span className="flex items-center gap-1">
                    View Details & Detours <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail Pane: Roadblock Cause Deep-Dive + Complimentary Routes */}
        <div className="lg:col-span-7 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl p-5 flex flex-col justify-between">
          {selectedRoadblock ? (
            <div className="space-y-4">
              {/* Top Banner */}
              <div className="flex items-center justify-between border-b border-[#DADCE0] pb-3">
                <div>
                  <span className="text-xs font-semibold text-[#1A73E8] tracking-wider uppercase">
                    Root Cause Diagnostic & Route Diverter
                  </span>
                  <h3 className="text-base font-bold text-[#202124] mt-0.5">{selectedRoadblock.roadName}</h3>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#5F6368] uppercase font-semibold">Estimated Clearance</div>
                  <div className="text-base font-bold font-mono text-[#B06000]">
                    ~{selectedRoadblock.predictedCongestionTimeMinutes} mins
                  </div>
                </div>
              </div>

              {/* Cause Explanation Box */}
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#DADCE0] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-10">
                  {getCauseIcon(selectedRoadblock.primaryCause)}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 rounded-md bg-[#FCE8E6] text-[#D93025]">
                    <Info className="w-4 h-4" />
                  </span>
                  <h4 className="font-bold text-[#202124] text-sm">
                    Identified Trigger: <span className="text-[#D93025]">{selectedRoadblock.primaryCause}</span>
                  </h4>
                </div>
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  {selectedRoadblock.causeDetails}
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#DADCE0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5F6368]">
                  <span>Sector Segment: <span className="text-[#202124] font-medium">{selectedRoadblock.startPoint}</span> to <span className="text-[#202124] font-medium">{selectedRoadblock.endPoint}</span></span>
                  
                  <div className="flex items-center gap-2">
                    {selectedRoadblock.isVerified ? (
                      <span className="text-[#188038] font-medium flex items-center gap-1 bg-[#E6F4EA] px-2 py-0.5 rounded border border-[#CEEAD6]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Traffic Control
                      </span>
                    ) : (userRole === 'OPERATOR' || userRole === 'ADMIN') && onVerifyIncident ? (
                      <button
                        onClick={() => onVerifyIncident(selectedRoadblock.id)}
                        className="px-3 py-1 bg-[#188038] hover:bg-[#137333] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                      >
                        <Check className="w-3 h-3" /> Verify & Authorize Diversion
                      </button>
                    ) : (
                      <span className="text-[#B06000] font-medium flex items-center gap-1 bg-[#FEF7E0] px-2 py-0.5 rounded border border-[#FEEFC3]">
                        Pending Operator Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Complimentary Routes Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-[#202124] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#188038]" />
                    Recommended Complimentary Detour Routes for Normal Vehicles
                  </h4>
                  <span className="text-xs text-[#5F6368]">Select to highlight route</span>
                </div>

                <div className="space-y-2.5">
                  {selectedRoadblock.alternativeRoutes.map((route) => {
                    const isRouteActive = selectedRoute?.id === route.id;
                    return (
                      <div
                        key={route.id}
                        onClick={() => onSelectRoute(route)}
                        className={`p-3.5 rounded-xl border cursor-pointer card-interactive ${isRouteActive
                            ? 'border-[#188038] bg-[#E6F4EA]/40 shadow-sm ring-2 ring-[#188038]/30'
                            : 'border-[#DADCE0] bg-[#FFFFFF] hover:border-[#BDC1C6]'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#202124]">{route.name}</span>
                            {route.isRecommended && (
                              <span className="text-[10px] bg-[#188038] text-white font-bold px-2 py-0.5 rounded-full">
                                BEST DETOUR
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#188038]">
                              {route.estimatedTimeMinutes} mins
                            </span>
                            <span className="text-[10px] text-[#5F6368]">({route.distanceKm} km)</span>
                          </div>
                        </div>

                        {/* Highlights list */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {route.routeHighlights.map((hl, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]"
                            >
                              ✓ {hl}
                            </span>
                          ))}
                        </div>

                        {/* Time Saved Alert */}
                        <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-[#DADCE0]">
                          <span className="text-[#5F6368]">Detour Efficiency:</span>
                          <span className="font-bold text-[#188038]">
                            Saves ~{route.savingsMinutes} mins vs bottleneck
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#5F6368] text-sm py-12">
              Select a bottleneck from the list to view cause telemetry and alternative routes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

