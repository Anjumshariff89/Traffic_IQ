import React, { useState } from 'react';
import {
  UserRole,
  ROLE_DEFINITIONS,
  TrafficSignal,
  RoadblockPrediction,
  EmergencyVehicle,
  TrafficControllerAlert,
  IncidentReport
} from '../types/traffic';
import {
  User,
  Activity,
  ShieldAlert,
  SlidersHorizontal,
  X,
  AlertTriangle,
  Clock,
  Car,
  TrendingDown,
  Navigation,
  Siren,
  Gauge,
  Eye,
  Map as MapIcon,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  FileText,
  ThumbsUp,
  Info,
  Layers,
  Radio,
  Check,
  Ban
} from 'lucide-react';

interface RoleDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  signals: TrafficSignal[];
  roadblocks: RoadblockPrediction[];
  emergencies: EmergencyVehicle[];
  alerts: TrafficControllerAlert[];
  incidentReports: IncidentReport[];
  onOpenReportModal: () => void;
  onNavigateTab: (tab: 'CIVILIAN_NAV' | 'EMERGENCY' | 'MAP' | 'SIGNALS' | 'ROADBLOCKS' | 'PEDESTRIANS') => void;
  onVerifyRoadblock: (id: string) => void;
  onClearCorridor: (id: string) => void;
  onUpdateVehicleStatus: (vehicleId: string, status: 'DISPATCHED' | 'EN_ROUTE' | 'CLEARED') => void;
}

export const RoleDashboardModal: React.FC<RoleDashboardModalProps> = ({
  isOpen,
  onClose,
  userRole,
  onRoleChange,
  signals,
  roadblocks,
  emergencies,
  alerts,
  incidentReports,
  onOpenReportModal,
  onNavigateTab,
  onVerifyRoadblock,
  onClearCorridor,
  onUpdateVehicleStatus
}) => {
  const [adminTab, setAdminTab] = useState<'OVERVIEW' | 'ANALYTICS' | 'PERMISSIONS' | 'AUDIT'>('OVERVIEW');

  if (!isOpen) return null;

  const roleDef = ROLE_DEFINITIONS[userRole];
  const activeEmergencies = emergencies.filter(e => e.status !== 'CLEARED');
  const criticalRoadblocks = roadblocks.filter(r => r.severity === 'CRITICAL');
  const activeAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="px-5 py-4 border-b border-[#DADCE0] bg-[#FFFFFF] flex-shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border border-[#DADCE0] ${roleDef.badgeBg} ${roleDef.badgeText} shadow-xs`}>
                {userRole === 'CITIZEN' && <User className="w-5 h-5" />}
                {userRole === 'OPERATOR' && <Activity className="w-5 h-5" />}
                {userRole === 'RESPONDER' && <ShieldAlert className="w-5 h-5" />}
                {userRole === 'ADMIN' && <SlidersHorizontal className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#202124] tracking-tight">
                    {roleDef.label} Dashboard
                  </h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#DADCE0] ${roleDef.badgeBg} ${roleDef.badgeText}`}>
                    {roleDef.badge}
                  </span>
                  <span className="text-[10px] bg-[#F1F3F4] text-[#5F6368] font-mono px-2 py-0.5 rounded border border-[#DADCE0]">
                    Simulated Demo Role
                  </span>
                </div>
                <p className="text-xs text-[#5F6368] mt-0.5">{roleDef.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Role Switcher Pill */}
              <div className="hidden sm:flex items-center gap-1 bg-[#F1F3F4] p-1 rounded-xl border border-[#DADCE0]">
                {(['CITIZEN', 'OPERATOR', 'RESPONDER', 'ADMIN'] as UserRole[]).map((r) => {
                  const def = ROLE_DEFINITIONS[r];
                  const isActive = userRole === r;
                  return (
                    <button
                      key={r}
                      onClick={() => onRoleChange(r)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        isActive
                          ? 'bg-[#FFFFFF] text-[#202124] shadow-xs border border-[#DADCE0]'
                          : 'text-[#5F6368] hover:text-[#202124]'
                      }`}
                    >
                      {def.shortName}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] transition border border-[#DADCE0]"
                title="Close Dashboard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8F9FA] space-y-6">
          {/* Top Universal KPI Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
              <div className="text-[11px] font-semibold uppercase text-[#5F6368] flex items-center justify-between">
                <span>Active Incidents</span>
                <AlertTriangle className="w-3.5 h-3.5 text-[#D93025]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#202124] mt-1">
                {roadblocks.length + incidentReports.filter(r => r.status === 'PENDING_VERIFICATION').length}
              </div>
              <div className="text-[11px] text-[#5F6368] mt-1 flex items-center gap-1">
                <span className="text-[#D93025] font-semibold">{criticalRoadblocks.length} Critical</span>
                <span>• {roadblocks.length} AI Detected</span>
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
              <div className="text-[11px] font-semibold uppercase text-[#5F6368] flex items-center justify-between">
                <span>Congestion Level</span>
                <Car className="w-3.5 h-3.5 text-[#1A73E8]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#1A73E8] mt-1">
                42% <span className="text-xs font-normal text-[#5F6368]">Moderate</span>
              </div>
              <div className="text-[11px] text-[#5F6368] mt-1">
                Avg speed: <strong className="text-[#202124]">44 km/h</strong> across Sector 62
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
              <div className="text-[11px] font-semibold uppercase text-[#5F6368] flex items-center justify-between">
                <span>Emergency Fleet</span>
                <Siren className="w-3.5 h-3.5 text-[#D93025]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#D93025] mt-1">
                {activeEmergencies.length} <span className="text-xs font-normal text-[#5F6368]">Active</span>
              </div>
              <div className="text-[11px] text-[#5F6368] mt-1">
                Avg Corridor ETA: <strong className="text-[#188038]">3.2 mins</strong>
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
              <div className="text-[11px] font-semibold uppercase text-[#5F6368] flex items-center justify-between">
                <span>Detour Delay Savings</span>
                <TrendingDown className="w-3.5 h-3.5 text-[#188038]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[#188038] mt-1">
                -38m <span className="text-xs font-normal text-[#5F6368]">via Canal Link</span>
              </div>
              <div className="text-[11px] text-[#5F6368] mt-1">
                Alternative corridors clear
              </div>
            </div>
          </div>

          {/* =====================================================================
              1. CITIZEN DASHBOARD
              ===================================================================== */}
          {userRole === 'CITIZEN' && (
            <div className="space-y-5 animate-card-enter">
              {/* Quick actions for citizen */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-[#202124] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#1A73E8]" /> Citizen Navigation & Safety Overview
                  </h3>
                  <p className="text-xs text-[#5F6368]">
                    Personalised commuter route recommendations, live congestion alerts, and incident reporting.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onOpenReportModal}
                    className="btn-interactive px-3.5 py-1.5 rounded-xl bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] border border-[#DADCE0] text-xs font-semibold flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Report Road Hazard
                  </button>
                  <button
                    onClick={() => {
                      onNavigateTab('CIVILIAN_NAV');
                      onClose();
                    }}
                    className="btn-interactive px-3.5 py-1.5 rounded-xl bg-[#1A73E8] hover:bg-[#1558B0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Open Turn-by-Turn GPS
                  </button>
                </div>
              </div>

              {/* Two Column Layout: Route Recommendations & Active Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left 7 cols: Alternative Route Recommendations & Estimated Travel Times */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-[#DADCE0] pb-2">
                      <h4 className="font-bold text-xs uppercase text-[#5F6368] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#188038]" /> Recommended Complimentary Routes
                      </h4>
                      <span className="text-[11px] text-[#188038] font-semibold">Live Traffic Synchronised</span>
                    </div>

                    <div className="space-y-3">
                      {roadblocks.flatMap(rb => rb.alternativeRoutes).slice(0, 2).map((route) => (
                        <div key={route.id} className="p-3.5 rounded-xl border border-[#CEEAD6] bg-[#E6F4EA]/30 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-xs text-[#202124]">{route.name}</div>
                              <div className="text-[11px] text-[#5F6368]">
                                Distance: {route.distanceKm} km • Traffic Level: <span className="font-semibold text-[#188038]">{route.trafficLevel}</span>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#188038] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#CEEAD6]">
                              Save {route.savingsMinutes} mins
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {route.routeHighlights.map((hl, i) => (
                              <span key={i} className="text-[10px] bg-[#FFFFFF] text-[#5F6368] px-2 py-0.5 rounded-full border border-[#DADCE0]">
                                ✓ {hl}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Travel Time Cards */}
                  <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                    <h4 className="font-bold text-xs uppercase text-[#5F6368] mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#1A73E8]" /> Estimated Travel Times to City Hubs
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0]">
                        <div className="text-xs font-bold text-[#202124]">Cyber City Tech Park</div>
                        <div className="text-[11px] text-[#D93025] line-through mt-0.5">Primary: 42 mins</div>
                        <div className="text-base font-bold font-mono text-[#188038]">
                          16 mins <span className="text-[10px] font-normal text-[#5F6368]">via Canal</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0]">
                        <div className="text-xs font-bold text-[#202124]">Apollo Medical Center</div>
                        <div className="text-[11px] text-[#D93025] line-through mt-0.5">Primary: 55 mins</div>
                        <div className="text-base font-bold font-mono text-[#188038]">
                          18 mins <span className="text-[10px] font-normal text-[#5F6368]">via Flyover</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0]">
                        <div className="text-xs font-bold text-[#202124]">Central Secretariat</div>
                        <div className="text-[11px] text-[#D93025] line-through mt-0.5">Primary: 28 mins</div>
                        <div className="text-base font-bold font-mono text-[#188038]">
                          12 mins <span className="text-[10px] font-normal text-[#5F6368]">via Ring Link</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 cols: Accident & Road Closure Alerts + Citizen Reports */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-[#DADCE0] pb-2">
                      <h4 className="font-bold text-xs uppercase text-[#5F6368] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D93025]" /> Accidents & Road Closures
                      </h4>
                      <span className="text-[11px] text-[#D93025] font-semibold">{roadblocks.length} Active</span>
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {roadblocks.map((rb) => (
                        <div key={rb.id} className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#202124]">{rb.roadName}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FCE8E6] text-[#D93025] border border-[#FAD2CF]">
                              {rb.severity}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-[#D93025]">
                            Cause: {rb.primaryCause}
                          </div>
                          <p className="text-[11px] text-[#5F6368] line-clamp-2">{rb.causeDetails}</p>
                          <div className="text-[10px] text-[#5F6368] pt-1 flex items-center justify-between">
                            <span>Delay: +{rb.delayedTravelTimeMinutes - rb.normalTravelTimeMinutes} mins</span>
                            <span className="text-[#188038] font-medium">Detour available</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Citizen Incident Reports Feed */}
                  <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xs uppercase text-[#5F6368] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#1A73E8]" /> Crowdsourced Commuter Reports
                      </h4>
                      <button
                        onClick={onOpenReportModal}
                        className="text-[11px] text-[#1A73E8] font-semibold hover:underline"
                      >
                        + Report New
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {incidentReports.map((rpt) => (
                        <div key={rpt.id} className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#DADCE0] text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#202124]">{rpt.title}</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              rpt.status === 'VERIFIED'
                                ? 'bg-[#E6F4EA] text-[#188038]'
                                : 'bg-[#FEF7E0] text-[#B06000]'
                            }`}>
                              {rpt.status === 'VERIFIED' ? 'Verified by Traffic IQ' : 'Pending Verification'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#5F6368] mt-0.5">{rpt.location}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              2. TRAFFIC OPERATOR DASHBOARD
              ===================================================================== */}
          {userRole === 'OPERATOR' && (
            <div className="space-y-5 animate-card-enter">
              {/* Operator Command Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-[#202124] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#B06000]" /> Traffic Control & Incident Desk
                  </h3>
                  <p className="text-xs text-[#5F6368]">
                    Real-time incident verification, AI bottleneck diagnostics, traffic diversions, and green corridor management.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onNavigateTab('SIGNALS');
                      onClose();
                    }}
                    className="btn-interactive px-3 py-1.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#202124] border border-[#DADCE0] text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Gauge className="w-3.5 h-3.5 text-[#1A73E8]" />
                    Signal Timers HUD
                  </button>
                  <button
                    onClick={() => {
                      onNavigateTab('ROADBLOCKS');
                      onClose();
                    }}
                    className="btn-interactive px-3.5 py-1.5 rounded-xl bg-[#1A73E8] hover:bg-[#1558B0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Bottleneck Predictor
                  </button>
                </div>
              </div>

              {/* Incidents Verification & AI Bottleneck Diagnostic Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left 7 cols: Active Incidents & Verification */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-[#DADCE0] pb-2">
                      <h4 className="font-bold text-xs uppercase text-[#5F6368] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1A73E8]" /> Incident Verification & Status Updates
                      </h4>
                      <span className="text-[11px] text-[#5F6368]">Authorised Operator Action</span>
                    </div>

                    <div className="space-y-3">
                      {roadblocks.map((rb) => {
                        const isVerified = rb.isVerified ?? true;
                        return (
                          <div key={rb.id} className="p-4 rounded-xl border border-[#DADCE0] bg-[#FFFFFF] shadow-xs space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-[#202124]">{rb.roadName}</span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F1F3F4] text-[#5F6368]">
                                    {rb.id}
                                  </span>
                                </div>
                                <div className="text-xs text-[#5F6368] mt-0.5">{rb.startPoint} → {rb.endPoint}</div>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                isVerified
                                  ? 'bg-[#E6F4EA] text-[#188038] border-[#CEEAD6]'
                                  : 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]'
                              }`}>
                                {isVerified ? '✓ Verified by Operator' : 'Pending Verification'}
                              </span>
                            </div>

                            {/* Cause & AI details */}
                            <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#DADCE0] text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[#D93025]">Primary Cause: {rb.primaryCause}</span>
                                <span className="font-mono text-[#188038] font-bold">{rb.confidenceScore}% AI Confidence</span>
                              </div>
                              <p className="text-[11px] text-[#5F6368]">{rb.causeDetails}</p>
                            </div>

                            {/* Operator controls */}
                            <div className="flex items-center justify-between pt-1 border-t border-[#DADCE0] text-xs">
                              <span className="text-[11px] text-[#5F6368]">
                                Est. Clearance: <strong>~{rb.predictedCongestionTimeMinutes}m</strong>
                              </span>
                              <div className="flex items-center gap-2">
                                {!isVerified ? (
                                  <button
                                    onClick={() => onVerifyRoadblock(rb.id)}
                                    className="px-3 py-1 bg-[#188038] hover:bg-[#137333] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                                  >
                                    <Check className="w-3 h-3" /> Verify Incident
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-[#188038] font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Logged & Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right 5 cols: AI Bottlenecks, Diversions & Emergency Corridors */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Emergency Corridor Monitoring */}
                  <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-[#DADCE0] pb-2">
                      <h4 className="font-bold text-xs uppercase text-[#5F6368] flex items-center gap-1.5">
                        <Siren className="w-3.5 h-3.5 text-[#D93025]" /> Emergency Corridor Monitoring
                      </h4>
                      <span className="text-[11px] font-mono text-[#D93025] font-bold">{activeEmergencies.length} Priority Runs</span>
                    </div>

                    <div className="space-y-2.5">
                      {emergencies.map((ev) => (
                        <div key={ev.id} className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#202124]">{ev.plateNumber} ({ev.type})</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              ev.status === 'EN_ROUTE'
                                ? 'bg-[#FCE8E6] text-[#D93025]'
                                : 'bg-[#E6F4EA] text-[#188038]'
                            }`}>
                              {ev.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#5F6368]">Dest: {ev.destinationHospital}</div>
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#DADCE0]">
                            <span>Corridor: {ev.overrideWaypoints.length} Signals Green</span>
                            <span className="font-mono font-bold text-[#188038]">ETA {ev.etaMinutes}m</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Traffic Diversions */}
                  <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                    <h4 className="font-bold text-xs uppercase text-[#5F6368] mb-3 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-[#1A73E8]" /> Recommended Traffic Diversions
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#E6F4EA]/40 border border-[#CEEAD6]">
                        <div className="font-semibold text-[#188038]">Diversion Alpha: Sector 58 Canal Link</div>
                        <div className="text-[11px] text-[#5F6368] mt-0.5">Discharges 450 vehicles/hr away from GT Expressway bottleneck.</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F8F9FA] border border-[#DADCE0]">
                        <div className="font-semibold text-[#202124]">Diversion Beta: Ring Arterial Underpass</div>
                        <div className="text-[11px] text-[#5F6368] mt-0.5">Heavy goods vehicle ban enforced until 21:00.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              3. EMERGENCY RESPONDER DASHBOARD
              ===================================================================== */}
          {userRole === 'RESPONDER' && (
            <div className="space-y-5 animate-card-enter">
              {/* Responder Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-[#202124] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#D93025]" /> Emergency Responder Fleet Dispatch
                  </h3>
                  <p className="text-xs text-[#5F6368]">
                    Assigned medical & fire incidents, dedicated green wave navigation, and live corridor status updates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onNavigateTab('EMERGENCY');
                      onClose();
                    }}
                    className="btn-interactive px-3.5 py-1.5 rounded-xl bg-[#D93025] hover:bg-[#C5221F] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Siren className="w-3.5 h-3.5" />
                    Open Dedicated Fleet Map
                  </button>
                </div>
              </div>

              {/* Responder Mission Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left 7 cols: Assigned Emergency Incidents */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-[#DADCE0] pb-2">
                      <h4 className="font-bold text-xs uppercase text-[#5F6368] flex items-center gap-1.5">
                        <Siren className="w-3.5 h-3.5 text-[#D93025]" /> Assigned Emergency Incidents
                      </h4>
                      <span className="text-[11px] bg-[#FCE8E6] text-[#D93025] font-semibold px-2 py-0.5 rounded-full border border-[#FAD2CF]">
                        Priority 1 Critical
                      </span>
                    </div>

                    <div className="space-y-3">
                      {emergencies.map((ev) => (
                        <div key={ev.id} className="p-4 rounded-xl border border-[#DADCE0] bg-[#FFFFFF] shadow-xs space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#202124]">{ev.plateNumber}</span>
                                <span className="text-xs bg-[#E8F0FE] text-[#1A73E8] font-semibold px-2 py-0.5 rounded">
                                  {ev.type}
                                </span>
                              </div>
                              <div className="text-xs text-[#5F6368] mt-1">Station: {ev.stationName}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold font-mono text-[#D93025]">
                                ETA {ev.etaMinutes} mins
                              </div>
                              <span className="text-[10px] text-[#5F6368]">to Destination</span>
                            </div>
                          </div>

                          {/* Destination & Corridor telemetry */}
                          <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#DADCE0] text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[#5F6368]">Destination:</span>
                              <strong className="text-[#202124]">{ev.destinationHospital}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#5F6368]">Assigned Corridor:</span>
                              <strong className="text-[#1A73E8]">{ev.assignedZone}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#5F6368]">Green Wave Intersections:</span>
                              <span className="font-mono font-bold text-[#188038]">{ev.overrideWaypoints.join(', ')}</span>
                            </div>
                          </div>

                          {/* Responder Action Controls */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DADCE0]">
                            <div className="text-[11px] text-[#5F6368]">
                              Status: <strong className="text-[#202124]">{ev.status}</strong>
                            </div>
                            <div className="flex items-center gap-2">
                              {ev.status !== 'CLEARED' ? (
                                <>
                                  <button
                                    onClick={() => onUpdateVehicleStatus(ev.id, 'EN_ROUTE')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                                      ev.status === 'EN_ROUTE'
                                        ? 'bg-[#E8F0FE] text-[#1A73E8] border-[#DADCE0]'
                                        : 'bg-[#FFFFFF] text-[#5F6368] hover:bg-[#F1F3F4] border-[#DADCE0]'
                                    }`}
                                  >
                                    En Route
                                  </button>
                                  <button
                                    onClick={() => onClearCorridor(ev.id)}
                                    className="px-3 py-1 bg-[#188038] hover:bg-[#137333] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                                  >
                                    <Check className="w-3 h-3" /> Arrived / Release Corridor
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs font-semibold text-[#188038] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Mission Cleared
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right 5 cols: Corridor Coordination Status */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                    <h4 className="font-bold text-xs uppercase text-[#5F6368] mb-3 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#188038]" /> Green Wave Corridor Telemetry
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#E6F4EA]/40 border border-[#CEEAD6] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#188038]">V2X Signal Pre-emption</span>
                          <span className="text-[10px] font-mono bg-[#188038] text-white px-1.5 py-0.5 rounded">LOCKED</span>
                        </div>
                        <p className="text-[11px] text-[#5F6368]">
                          Intersections SIG-101 and SIG-102 currently held at continuous GREEN wave. Civilian cross traffic held at RED.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] space-y-1">
                        <div className="font-semibold text-[#202124]">Traffic Police Control Desk</div>
                        <p className="text-[11px] text-[#5F6368]">
                          Officer D. Sharma stationed at Sector 62 Interchange confirmed civilian lanes held.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] space-y-1">
                        <div className="font-semibold text-[#202124]">Trauma Unit Preparedness</div>
                        <p className="text-[11px] text-[#5F6368]">
                          Apollo Hospital Trauma Bay #2 alerted. Emergency gantry door unlocked.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              4. CITY ADMINISTRATOR DASHBOARD
              ===================================================================== */}
          {userRole === 'ADMIN' && (
            <div className="space-y-5 animate-card-enter">
              {/* Admin Sub-navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] p-4 rounded-xl border border-[#DADCE0] shadow-xs">
                <div>
                  <h3 className="font-bold text-sm text-[#202124] flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#188038]" /> Municipal Traffic Administration & Governance
                  </h3>
                  <p className="text-xs text-[#5F6368]">
                    City-wide operational oversight, incident audit logs, traffic mobility analytics, and RBAC permissions.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#F1F3F4] p-1 rounded-xl border border-[#DADCE0]">
                  {(['OVERVIEW', 'ANALYTICS', 'PERMISSIONS', 'AUDIT'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setAdminTab(tab)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                        adminTab === tab
                          ? 'bg-[#FFFFFF] text-[#202124] shadow-xs border border-[#DADCE0]'
                          : 'text-[#5F6368] hover:text-[#202124]'
                      }`}
                    >
                      {tab === 'OVERVIEW' ? 'City Overview' : tab === 'ANALYTICS' ? 'Analytics' : tab === 'PERMISSIONS' ? 'Role Permissions' : 'Incident History'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab 1: City Overview */}
              {adminTab === 'OVERVIEW' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#DADCE0] shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-[#DADCE0] pb-3">
                        <h4 className="font-bold text-xs uppercase text-[#5F6368]">
                          Municipal Mobility Health Index
                        </h4>
                        <span className="text-sm font-bold font-mono text-[#188038] bg-[#E6F4EA] px-2.5 py-0.5 rounded-full border border-[#CEEAD6]">
                          91 / 100 • Optimal
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0]">
                          <div className="text-[11px] text-[#5F6368]">Total City Vehicles Tracked</div>
                          <div className="text-xl font-bold font-mono text-[#202124] mt-1">14,280 veh/hr</div>
                          <div className="text-[10px] text-[#188038] mt-0.5">+4.2% vs last hour</div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0]">
                          <div className="text-[11px] text-[#5F6368]">Signal Pre-emption Rate</div>
                          <div className="text-xl font-bold font-mono text-[#188038] mt-1">99.4%</div>
                          <div className="text-[10px] text-[#5F6368] mt-0.5">Zero green corridor faults</div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0]">
                          <div className="text-[11px] text-[#5F6368]">Pedestrian Safety Index</div>
                          <div className="text-xl font-bold font-mono text-[#1A73E8] mt-1">94.8%</div>
                          <div className="text-[10px] text-[#188038] mt-0.5">3 warnings averted</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] text-xs space-y-2">
                        <div className="font-bold text-[#202124]">Municipal Action Summary</div>
                        <ul className="space-y-1.5 text-[11px] text-[#5F6368]">
                          <li>• <strong>Sector 62 Interchange:</strong> 3-car collision bottleneck managed via Canal detour bypass.</li>
                          <li>• <strong>Riverbank Causeway:</strong> Stormwater pumps activated; drainage crew on site.</li>
                          <li>• <strong>Emergency Runs:</strong> 2 critical medical runs completed with average 3.2m transit time.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right 4 cols: Quick shortcuts to all 6 modules */}
                  <div className="lg:col-span-4 bg-[#FFFFFF] p-5 rounded-xl border border-[#DADCE0] shadow-xs space-y-3">
                    <h4 className="font-bold text-xs uppercase text-[#5F6368] border-b border-[#DADCE0] pb-2">
                      Access All 6 Municipal Modules
                    </h4>
                    <div className="space-y-2 text-xs">
                      <button
                        onClick={() => { onNavigateTab('CIVILIAN_NAV'); onClose(); }}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#202124] border border-[#DADCE0] flex items-center justify-between font-semibold transition"
                      >
                        <span className="flex items-center gap-2"><Navigation className="w-4 h-4 text-[#1A73E8]" /> 1. Directions & Detours</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" />
                      </button>

                      <button
                        onClick={() => { onNavigateTab('EMERGENCY'); onClose(); }}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#202124] border border-[#DADCE0] flex items-center justify-between font-semibold transition"
                      >
                        <span className="flex items-center gap-2"><Siren className="w-4 h-4 text-[#D93025]" /> 2. Emergency Fleet Map</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" />
                      </button>

                      <button
                        onClick={() => { onNavigateTab('MAP'); onClose(); }}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#202124] border border-[#DADCE0] flex items-center justify-between font-semibold transition"
                      >
                        <span className="flex items-center gap-2"><MapIcon className="w-4 h-4 text-[#1A73E8]" /> 3. Full City Map</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" />
                      </button>

                      <button
                        onClick={() => { onNavigateTab('SIGNALS'); onClose(); }}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#202124] border border-[#DADCE0] flex items-center justify-between font-semibold transition"
                      >
                        <span className="flex items-center gap-2"><Gauge className="w-4 h-4 text-[#1A73E8]" /> 4. Signal Timers HUD</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" />
                      </button>

                      <button
                        onClick={() => { onNavigateTab('ROADBLOCKS'); onClose(); }}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#202124] border border-[#DADCE0] flex items-center justify-between font-semibold transition"
                      >
                        <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[#F9AB00]" /> 5. Bottlenecks & Causes</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" />
                      </button>

                      <button
                        onClick={() => { onNavigateTab('PEDESTRIANS'); onClose(); }}
                        className="w-full p-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#202124] border border-[#DADCE0] flex items-center justify-between font-semibold transition"
                      >
                        <span className="flex items-center gap-2"><Eye className="w-4 h-4 text-[#1A73E8]" /> 6. AI Pedestrian Radar</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Analytics */}
              {adminTab === 'ANALYTICS' && (
                <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#DADCE0] shadow-xs space-y-4">
                  <h4 className="font-bold text-xs uppercase text-[#5F6368]">
                    City-Wide Congestion & Delay Statistics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] space-y-1">
                      <div className="text-[#5F6368]">Peak Delay Corridor</div>
                      <div className="text-lg font-bold text-[#D93025]">Grand Trunk Expressway</div>
                      <div className="text-[11px] text-[#5F6368]">+38 mins delay (Multi-Vehicle Collision)</div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] space-y-1">
                      <div className="text-[#5F6368]">Average Commute Slowdown</div>
                      <div className="text-lg font-bold text-[#B06000]">+11.4 mins</div>
                      <div className="text-[11px] text-[#5F6368]">Reduced to +2.8m for detour adopters</div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] space-y-1">
                      <div className="text-[#5F6368]">AI Root-Cause Accuracy</div>
                      <div className="text-lg font-bold text-[#188038]">96.2%</div>
                      <div className="text-[11px] text-[#5F6368]">Cross-verified with video neural sensors</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Permissions Matrix */}
              {adminTab === 'PERMISSIONS' && (
                <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#DADCE0] shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#DADCE0] pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#202124]">
                        Role-Based Access Control (RBAC) Governance Matrix
                      </h4>
                      <p className="text-xs text-[#5F6368]">
                        Authorized operational permissions across municipal traffic governance stakeholders.
                      </p>
                    </div>
                    <span className="text-xs bg-[#E8F0FE] text-[#1A73E8] px-2.5 py-1 rounded-full font-semibold border border-[#DADCE0]">
                      Enforced by TrafficIQ
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F8F9FA] border-b border-[#DADCE0] text-[#5F6368]">
                          <th className="p-3 font-bold">System Capability</th>
                          <th className="p-3 font-bold text-center">Citizen</th>
                          <th className="p-3 font-bold text-center">Traffic Operator</th>
                          <th className="p-3 font-bold text-center">Emergency Responder</th>
                          <th className="p-3 font-bold text-center">City Administrator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DADCE0]">
                        <tr>
                          <td className="p-3 font-semibold text-[#202124]">View All 6 Modules & Maps</td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[#202124]">Report Incident & Hazard</td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[#202124]">Verify & Classify Incidents</td>
                          <td className="p-3 text-center"><Ban className="w-4 h-4 text-[#D93025] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Ban className="w-4 h-4 text-[#D93025] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[#202124]">Manual Signal Phase Override</td>
                          <td className="p-3 text-center"><Ban className="w-4 h-4 text-[#D93025] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Ban className="w-4 h-4 text-[#D93025] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[#202124]">Dispatch Emergency Vehicles</td>
                          <td className="p-3 text-center"><Ban className="w-4 h-4 text-[#D93025] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[#202124]">Update Assigned Mission Status</td>
                          <td className="p-3 text-center"><Ban className="w-4 h-4 text-[#D93025] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[#202124]">Manage System Permissions & Audit</td>
                          <td className="p-3 text-center"><Ban className="w-4 h-4 text-[#D93025] mx-auto" /></td>
                          <td className="p-3 text-center"><Ban className="w-4 h-4 text-[#D93025] mx-auto" /></td>
                          <td className="p-3 text-center"><Ban className="w-4 h-4 text-[#D93025] mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-[#188038] mx-auto" /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Audit & Incident History */}
              {adminTab === 'AUDIT' && (
                <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#DADCE0] shadow-xs space-y-4">
                  <h4 className="font-bold text-xs uppercase text-[#5F6368]">
                    24-Hour Municipal Incident Audit History Log
                  </h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#202124]">Emergency Green Wave Dispatched (MED-4920)</div>
                        <div className="text-[11px] text-[#5F6368]">Corridor Sector 62 engaged • 3 signals synchronized to GREEN</div>
                      </div>
                      <span className="text-[11px] font-mono text-[#5F6368]">18:44:12</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#202124]">Citizen Incident Verified: Waterlogging Sector 64</div>
                        <div className="text-[11px] text-[#5F6368]">Verified by Officer D. Sharma • Detour broadcasted</div>
                      </div>
                      <span className="text-[11px] font-mono text-[#5F6368]">18:32:05</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#202124]">AI Jaywalker Safety Acoustic Horn Activated</div>
                        <div className="text-[11px] text-[#5F6368]">Zebra Crossing Cam 2 • Approaching vehicle slowed safely</div>
                      </div>
                      <span className="text-[11px] font-mono text-[#5F6368]">18:15:40</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

