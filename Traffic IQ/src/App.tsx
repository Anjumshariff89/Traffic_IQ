import React, { useState, useEffect } from 'react';
import {
  initialSignals,
  initialRoadblocks,
  initialEmergencies,
  initialPedestrianDetections,
  initialControllerAlerts,
  initialIncidentReports
} from './data/mockTrafficData';
import {
  TrafficSignal,
  RoadblockPrediction,
  ComplimentaryRoute,
  EmergencyVehicle,
  TrafficControllerAlert,
  UserRole,
  ROLE_DEFINITIONS,
  IncidentReport
} from './types/traffic';
import { SignalTimerHUD } from './components/SignalTimerHUD';
import { RoadblockPredictor } from './components/RoadblockPredictor';
import { EmergencyCorridorMap } from './components/EmergencyCorridorMap';
import { PedestrianRadar } from './components/PedestrianRadar';
import { RealTimeLiveMap } from './components/RealTimeLiveMap';
import { CivilianNavigator } from './components/CivilianNavigator';
import { RoleDashboardModal } from './components/RoleDashboardModal';
import { ReportIncidentModal } from './components/ReportIncidentModal';
import { SafetyConfirmModal } from './components/SafetyConfirmModal';
import {
  Car,
  Siren,
  Eye,
  AlertTriangle,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  Map as MapIcon,
  Navigation as NavigationIcon,
  Menu,
  X,
  ChevronDown,
  User,
  Activity,
  ShieldAlert,
  SlidersHorizontal,
  LayoutDashboard,
  Check
} from 'lucide-react';

export function App() {
  // Navigation / Tab state: Landing on Civilian Navigator or Emergency Corridors
  const [activeTab, setActiveTab] = useState<'CIVILIAN_NAV' | 'EMERGENCY' | 'MAP' | 'SIGNALS' | 'ROADBLOCKS' | 'PEDESTRIANS'>('CIVILIAN_NAV');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Application Data States
  const [signals, setSignals] = useState<TrafficSignal[]>(initialSignals);
  const [roadblocks, setRoadblocks] = useState<RoadblockPrediction[]>(initialRoadblocks);
  const [selectedRoadblock, setSelectedRoadblock] = useState<RoadblockPrediction | null>(initialRoadblocks[0]);
  const [selectedRoute, setSelectedRoute] = useState<ComplimentaryRoute | null>(initialRoadblocks[0].alternativeRoutes[0]);
  const [emergencies, setEmergencies] = useState<EmergencyVehicle[]>(initialEmergencies);
  const [pedestrianDetections, setPedestrianDetections] = useState(initialPedestrianDetections);
  const [alerts, setAlerts] = useState<TrafficControllerAlert[]>(initialControllerAlerts);

  // Driver Simulation State
  const [driverSpeed, setDriverSpeed] = useState<number>(44);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Role-Based Access Control (RBAC) States
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('traffic_iq_demo_role') as UserRole;
    return saved && ROLE_DEFINITIONS[saved] ? saved : 'CITIZEN';
  });
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<boolean>(false);
  const [roleDashboardOpen, setRoleDashboardOpen] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [safetyModalOpen, setSafetyModalOpen] = useState<boolean>(false);
  const [targetSafetySignal, setTargetSafetySignal] = useState<TrafficSignal | null>(null);
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>(initialIncidentReports);

  // Audio Beep
  const triggerAudioBeep = (freq = 880, type: OscillatorType = 'sine', duration = 0.2) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Real-time Countdown Timer Loop for Traffic Signals
  useEffect(() => {
    const timer = setInterval(() => {
      setSignals((prevSignals) =>
        prevSignals.map((sig) => {
          if (sig.emergencyOverridden) {
            return {
              ...sig,
              currentStatus: 'GREEN',
              timeRemaining: 99
            };
          }

          let newTime = sig.timeRemaining - 1;

          if (newTime <= 0) {
            if (sig.currentStatus === 'GREEN') {
              return {
                ...sig,
                currentStatus: 'YELLOW',
                timeRemaining: sig.yellowDuration,
              };
            } else if (sig.currentStatus === 'YELLOW') {
              return {
                ...sig,
                currentStatus: 'RED',
                timeRemaining: sig.redDuration,
              };
            } else {
              return {
                ...sig,
                currentStatus: 'GREEN',
                timeRemaining: sig.greenDuration,
              };
            }
          }

          return {
            ...sig,
            timeRemaining: newTime,
          };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Role Switching Handler
  const handleRoleChange = (newRole: UserRole) => {
    setActiveRole(newRole);
    localStorage.setItem('traffic_iq_demo_role', newRole);
    setRoleDropdownOpen(false);
    triggerAudioBeep(650, 'sine', 0.15);
    showToast(`Switched Demo Role: ${ROLE_DEFINITIONS[newRole].label} (${ROLE_DEFINITIONS[newRole].badge})`);
  };

  const handlePermissionDenied = (msg: string) => {
    triggerAudioBeep(440, 'sawtooth', 0.3);
    showToast(msg);
  };

  // Signal Override with Safety Protocol
  const handleSignalOverrideAttempt = (signalId: string) => {
    const sig = signals.find(s => s.id === signalId);
    if (!sig) return;
    setTargetSafetySignal(sig);
    setSafetyModalOpen(true);
  };

  const handleConfirmSignalOverride = () => {
    if (!targetSafetySignal) return;
    const signalId = targetSafetySignal.id;
    handleManualOverride(signalId);
  };

  // Handler: Manual Signal Override
  const handleManualOverride = (signalId: string) => {
    setSignals(prev => prev.map(s => {
      if (s.id === signalId) {
        const nextState = !s.emergencyOverridden;
        if (nextState) {
          triggerAudioBeep(920, 'triangle', 0.3);
          showToast(`Signal ${s.id} locked to GREEN CORRIDOR for priority transit.`);
        }
        return {
          ...s,
          emergencyOverridden: nextState,
          currentStatus: nextState ? 'GREEN' : s.currentStatus,
          timeRemaining: nextState ? 99 : 30
        };
      }
      return s;
    }));
  };

  // Handler: Dispatch New Emergency Vehicle (with RBAC)
  const handleDispatchVehicle = (type: 'AMBULANCE' | 'FIRE_ENGINE', destination: string) => {
    if (activeRole === 'CITIZEN') {
      handlePermissionDenied('⚠️ Access Denied: Fleet dispatch is restricted to Emergency Responders and Traffic Operators.');
      return;
    }

    const id = `EMG-${Date.now().toString().slice(-4)}`;
    const plate = type === 'AMBULANCE' ? `MED-${Math.floor(1000 + Math.random() * 9000)}` : `FIRE-${Math.floor(100 + Math.random() * 900)}`;
    const newVehicle: EmergencyVehicle = {
      id,
      type,
      plateNumber: plate,
      stationName: type === 'AMBULANCE' ? 'Emergency Trauma Unit #4' : 'Rapid Response Fire Brigade Unit 2',
      destinationHospital: destination,
      priority: 'LEVEL_1_CRITICAL',
      status: 'EN_ROUTE',
      currentCoordinates: [28.6250, 77.3600],
      destinationCoordinates: [28.6510, 77.3950],
      etaMinutes: 3.2,
      assignedZone: 'Expressway Sector 62 Corridor',
      assignedController: 'Officer D. Sharma (Station 6 Control Desk)',
      controllerNotified: true,
      notifiedAt: 'Just Now',
      overrideWaypoints: ['SIG-101', 'SIG-102', 'SIG-104'],
      activeSignalCount: 3,
      clearedSignalCount: 0
    };

    setSignals(prev => prev.map(s => {
      if (['SIG-101', 'SIG-102', 'SIG-104'].includes(s.id)) {
        return { ...s, emergencyOverridden: true, currentStatus: 'GREEN', timeRemaining: 99 };
      }
      return s;
    }));

    const newAlert: TrafficControllerAlert = {
      id: `ALR-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'EMERGENCY_ARRIVAL',
      title: `PRIORITY 1: ${type} APPROACHING INTERSECTION`,
      message: `${plate} en-route to ${destination}. Green corridor activated across Sector 62.`,
      junctionId: 'SIG-101',
      junctionName: 'Sector 62 Crossway - North Post',
      actionRequired: 'Ensure oncoming civilian traffic remains held at RED until beacon clears.',
      acknowledged: false,
      urgency: 'EXTREME'
    };

    setEmergencies([newVehicle, ...emergencies]);
    setAlerts([newAlert, ...alerts]);

    triggerAudioBeep(520, 'sawtooth', 0.5);
    setTimeout(() => triggerAudioBeep(680, 'sawtooth', 0.5), 300);

    showToast(`🚨 ${type} DISPATCHED! Traffic controller desk notified & Green Corridor locked.`);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    if (activeRole === 'CITIZEN') {
      handlePermissionDenied('⚠️ Access Denied: Alert acknowledgment is restricted to Traffic Operators and Admins.');
      return;
    }
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    triggerAudioBeep(1000, 'sine', 0.15);
    showToast('Controller desk acknowledged arrival. Green wave priority confirmed.');
  };

  const handleClearCorridor = (vehicleId: string) => {
    if (activeRole === 'CITIZEN') {
      handlePermissionDenied('⚠️ Access Denied: Corridor release is restricted to assigned Responders and Operators.');
      return;
    }
    setEmergencies(prev => prev.map(e => e.id === vehicleId ? { ...e, status: 'CLEARED' } : e));
    setSignals(prev => prev.map(s => ({ ...s, emergencyOverridden: false })));
    showToast('Emergency mission completed. Route released back to civilian signal timing.');
  };

  // Handler: Incident Verification
  const handleVerifyRoadblock = (roadblockId: string) => {
    if (activeRole === 'CITIZEN') {
      handlePermissionDenied('⚠️ Permission Denied: Citizens cannot verify incidents. Verification restricted to Traffic Operators.');
      return;
    }
    setRoadblocks(prev => prev.map(rb => {
      if (rb.id === roadblockId) {
        return {
          ...rb,
          isVerified: true,
          verifiedBy: `${ROLE_DEFINITIONS[activeRole].label} Desk`
        };
      }
      return rb;
    }));
    triggerAudioBeep(880, 'sine', 0.2);
    showToast(`Incident ${roadblockId} verified and logged under ${ROLE_DEFINITIONS[activeRole].label} authorization.`);
  };

  // Handler: Citizen & Commuter Incident Reporting
  const handleReportIncident = (newReport: Omit<IncidentReport, 'id' | 'timestamp' | 'status' | 'upvotes'>) => {
    const report: IncidentReport = {
      ...newReport,
      id: `RPT-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PENDING_VERIFICATION',
      upvotes: 1
    };
    setIncidentReports([report, ...incidentReports]);

    const newAlert: TrafficControllerAlert = {
      id: `ALR-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'ROADBLOCK_SPIKE',
      title: `CITIZEN REPORT: ${report.title.toUpperCase()}`,
      message: `${report.description} Location: ${report.location}. Severity: ${report.severity}.`,
      junctionId: 'SIG-101',
      junctionName: report.location,
      actionRequired: 'Verify field sensors and corroborate before activating detour.',
      acknowledged: false,
      urgency: report.severity === 'CRITICAL' ? 'EXTREME' : 'HIGH'
    };
    setAlerts([newAlert, ...alerts]);

    triggerAudioBeep(750, 'sine', 0.2);
    showToast('✅ Incident report submitted! Forwarded to Traffic Control desk for verification.');
  };

  // Handler: Emergency Vehicle Status Update
  const handleUpdateVehicleStatus = (vehicleId: string, status: 'DISPATCHED' | 'EN_ROUTE' | 'CLEARED') => {
    setEmergencies(prev => prev.map(e => e.id === vehicleId ? { ...e, status } : e));
    if (status === 'CLEARED') {
      setSignals(prev => prev.map(s => ({ ...s, emergencyOverridden: false })));
    }
    showToast(`Vehicle ${vehicleId} status updated to ${status}.`);
  };

  const handleTriggerSafetyHorn = () => {
    triggerAudioBeep(1200, 'square', 0.4);
    setTimeout(() => triggerAudioBeep(1200, 'square', 0.4), 200);
    showToast('🔊 Acoustic Pedestrian Warning Horn & Strobe Flasher Triggered!');
  };

  return (
    <div className="h-screen w-screen bg-[#F8F9FA] text-[#202124] flex flex-col font-sans overflow-hidden selection:bg-[#1A73E8] selection:text-white">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-[999999] bg-[#1A73E8] text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-[#1558B0] animate-bounce">
          <Sparkles className="w-4 h-4 text-[#E8F0FE]" />
          {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-16 flex-shrink-0 z-40 bg-[#FFFFFF] border-b border-[#DADCE0] shadow-sm relative">
        <div className="h-full px-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E8F0FE] rounded-xl border border-[#DADCE0] text-[#1A73E8] shadow-sm">
              <Car className="w-5 h-5 text-[#1A73E8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-[#202124]">Traffic<span className="text-[#1A73E8]">IQ</span></span>
                <span className="hidden sm:inline bg-[#E8F0FE] text-[#1A73E8] text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-[#DADCE0] font-semibold">
                  REAL-TIME TRAFFIC & CORRIDORS
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1.5 bg-[#F1F3F4] p-1.5 rounded-xl border border-[#DADCE0]">
            {/* 1. Normal Vehicle Directions & Detours */}
            <button
              onClick={() => setActiveTab('CIVILIAN_NAV')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === 'CIVILIAN_NAV'
                ? 'bg-[#1A73E8] text-white shadow-sm'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#FFFFFF]'
                }`}
            >
              <NavigationIcon className={`w-3.5 h-3.5 ${activeTab === 'CIVILIAN_NAV' ? 'text-white' : 'text-[#1A73E8]'}`} />
              Normal Vehicle Directions & Detours
            </button>

            {/* 2. DEDICATED EMERGENCY CORRIDOR MAP */}
            <button
              onClick={() => setActiveTab('EMERGENCY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === 'EMERGENCY'
                ? 'bg-[#D93025] text-white shadow-sm'
                : 'text-[#5F6368] hover:text-[#D93025] hover:bg-[#FFFFFF]'
                }`}
            >
              <Siren className={`w-3.5 h-3.5 ${activeTab === 'EMERGENCY' ? 'text-white' : 'text-[#D93025]'}`} />
              Emergency Corridor Fleet Map
            </button>

            {/* 3. Full City Map */}
            <button
              onClick={() => setActiveTab('MAP')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === 'MAP'
                ? 'bg-[#1A73E8] text-white shadow-sm'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#FFFFFF]'
                }`}
            >
              <MapIcon className={`w-3.5 h-3.5 ${activeTab === 'MAP' ? 'text-white' : 'text-[#5F6368]'}`} />
              Full City Map
            </button>

            {/* 4. Signal Timers HUD */}
            <button
              onClick={() => setActiveTab('SIGNALS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === 'SIGNALS'
                ? 'bg-[#1A73E8] text-white shadow-sm'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#FFFFFF]'
                }`}
            >
              <Gauge className={`w-3.5 h-3.5 ${activeTab === 'SIGNALS' ? 'text-white' : 'text-[#5F6368]'}`} />
              Signal Timers HUD
            </button>

            {/* 5. Roadblocks & Detours */}
            <button
              onClick={() => setActiveTab('ROADBLOCKS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === 'ROADBLOCKS'
                ? 'bg-[#1A73E8] text-white shadow-sm'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#FFFFFF]'
                }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${activeTab === 'ROADBLOCKS' ? 'text-white' : 'text-[#F9AB00]'}`} />
              Bottlenecks & Causes
            </button>

            {/* 6. AI Pedestrian Radar */}
            <button
              onClick={() => setActiveTab('PEDESTRIANS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${activeTab === 'PEDESTRIANS'
                ? 'bg-[#1A73E8] text-white shadow-sm'
                : 'text-[#5F6368] hover:text-[#202124] hover:bg-[#FFFFFF]'
                }`}
            >
              <Eye className={`w-3.5 h-3.5 ${activeTab === 'PEDESTRIANS' ? 'text-white' : 'text-[#1A73E8]'}`} />
              AI Pedestrian Radar
            </button>
          </nav>

          {/* Right Controls: Role Selector + Role Dashboard + Audio + Responsive Menu Button */}
          <div className="flex items-center gap-2">
            {/* Demo Role Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#202124] border border-[#DADCE0] text-xs font-semibold transition"
                title="Select Demo Stakeholder Role"
              >
                {activeRole === 'CITIZEN' && <User className="w-3.5 h-3.5 text-[#1A73E8]" />}
                {activeRole === 'OPERATOR' && <Activity className="w-3.5 h-3.5 text-[#B06000]" />}
                {activeRole === 'RESPONDER' && <ShieldAlert className="w-3.5 h-3.5 text-[#D93025]" />}
                {activeRole === 'ADMIN' && <SlidersHorizontal className="w-3.5 h-3.5 text-[#188038]" />}
                <span className="font-bold">{ROLE_DEFINITIONS[activeRole].shortName}</span>
                <span className="text-[10px] text-[#5F6368] font-normal hidden md:inline">(Demo)</span>
                <ChevronDown className="w-3 h-3 text-[#5F6368]" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 border-b border-[#DADCE0] mb-1">
                    <div className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider">
                      Switch Demo Role
                    </div>
                    <div className="text-[10px] text-[#5F6368]">
                      Simulates multi-stakeholder municipal traffic governance.
                    </div>
                  </div>
                  {(['CITIZEN', 'OPERATOR', 'RESPONDER', 'ADMIN'] as UserRole[]).map((r) => {
                    const def = ROLE_DEFINITIONS[r];
                    const isSelected = activeRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-[#F8F9FA] transition ${isSelected ? 'bg-[#E8F0FE]/50' : ''
                          }`}
                      >
                        <span className={`p-1 rounded-lg border mt-0.5 ${def.badgeBg} ${def.badgeText} border-[#DADCE0]`}>
                          {r === 'CITIZEN' && <User className="w-3.5 h-3.5" />}
                          {r === 'OPERATOR' && <Activity className="w-3.5 h-3.5" />}
                          {r === 'RESPONDER' && <ShieldAlert className="w-3.5 h-3.5" />}
                          {r === 'ADMIN' && <SlidersHorizontal className="w-3.5 h-3.5" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#202124]">{def.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#1A73E8]" />}
                          </div>
                          <p className="text-[10px] text-[#5F6368] truncate">{def.badge}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dedicated Role Dashboard Trigger */}
            <button
              onClick={() => setRoleDashboardOpen(true)}
              title={`Open ${ROLE_DEFINITIONS[activeRole].label} Dashboard`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1A73E8] hover:bg-[#1558B0] text-white border border-[#1558B0] text-xs font-semibold shadow-xs transition"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{ROLE_DEFINITIONS[activeRole].shortName} Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Alert Audio' : 'Enable Alert Audio'}
              className={`p-2 rounded-xl border transition ${soundEnabled
                ? 'bg-[#E8F0FE] text-[#1A73E8] border-[#DADCE0]'
                : 'bg-[#F1F3F4] text-[#5F6368] border-[#DADCE0]'
                }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Responsive Menu Dropdown Toggle for Mobile & Tablet */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F1F3F4] text-[#202124] border border-[#DADCE0] text-xs font-semibold"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {activeTab === 'CIVILIAN_NAV' ? 'Directions' : activeTab === 'EMERGENCY' ? 'Emergency' : activeTab === 'MAP' ? 'Full Map' : activeTab === 'SIGNALS' ? 'Signals' : activeTab === 'ROADBLOCKS' ? 'Bottlenecks' : 'Pedestrians'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Expandable Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="xl:hidden absolute top-16 left-0 right-0 bg-[#FFFFFF] border-b border-[#DADCE0] shadow-xl p-3 z-50 animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Role Switcher */}
            <div className="mb-3 p-2 bg-[#F8F9FA] rounded-xl border border-[#DADCE0]">
              <div className="text-[10px] font-bold uppercase text-[#5F6368] mb-1.5">
                Current Role (Demo): <span className="text-[#1A73E8]">{ROLE_DEFINITIONS[activeRole].label}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['CITIZEN', 'OPERATOR', 'RESPONDER', 'ADMIN'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      handleRoleChange(r);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1 px-2 rounded-lg text-xs font-semibold border text-center transition ${activeRole === r
                        ? 'bg-[#1A73E8] text-white border-[#1558B0]'
                        : 'bg-[#FFFFFF] text-[#5F6368] border-[#DADCE0]'
                      }`}
                  >
                    {ROLE_DEFINITIONS[r].shortName}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => { setActiveTab('CIVILIAN_NAV'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center gap-2 border ${activeTab === 'CIVILIAN_NAV' ? 'bg-[#1A73E8] text-white border-[#1558B0]' : 'bg-[#F8F9FA] text-[#202124] border-[#DADCE0]'
                  }`}
              >
                <NavigationIcon className="w-4 h-4" />
                <span>Normal Directions</span>
              </button>

              <button
                onClick={() => { setActiveTab('EMERGENCY'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center gap-2 border ${activeTab === 'EMERGENCY' ? 'bg-[#D93025] text-white border-[#C5221F]' : 'bg-[#F8F9FA] text-[#202124] border-[#DADCE0]'
                  }`}
              >
                <Siren className="w-4 h-4" />
                <span>Emergency Fleet</span>
              </button>

              <button
                onClick={() => { setActiveTab('MAP'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center gap-2 border ${activeTab === 'MAP' ? 'bg-[#1A73E8] text-white border-[#1558B0]' : 'bg-[#F8F9FA] text-[#202124] border-[#DADCE0]'
                  }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Full City Map</span>
              </button>

              <button
                onClick={() => { setActiveTab('SIGNALS'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center gap-2 border ${activeTab === 'SIGNALS' ? 'bg-[#1A73E8] text-white border-[#1558B0]' : 'bg-[#F8F9FA] text-[#202124] border-[#DADCE0]'
                  }`}
              >
                <Gauge className="w-4 h-4" />
                <span>Signal Timers HUD</span>
              </button>

              <button
                onClick={() => { setActiveTab('ROADBLOCKS'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center gap-2 border ${activeTab === 'ROADBLOCKS' ? 'bg-[#1A73E8] text-white border-[#1558B0]' : 'bg-[#F8F9FA] text-[#202124] border-[#DADCE0]'
                  }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Bottlenecks & Detours</span>
              </button>

              <button
                onClick={() => { setActiveTab('PEDESTRIANS'); setMobileMenuOpen(false); }}
                className={`p-2.5 rounded-xl text-xs font-semibold text-left transition flex items-center gap-2 border ${activeTab === 'PEDESTRIANS' ? 'bg-[#1A73E8] text-white border-[#1558B0]' : 'bg-[#F8F9FA] text-[#202124] border-[#DADCE0]'
                  }`}
              >
                <Eye className="w-4 h-4" />
                <span>AI Pedestrian Radar</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area with Smooth Page Transition */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* 1. SEPARATE MAP FOR NORMAL VEHICLES */}
        {activeTab === 'CIVILIAN_NAV' && (
          <div key="CIVILIAN_NAV" className="w-full h-full animate-page-enter">
            <CivilianNavigator
              signals={signals}
              roadblocks={roadblocks}
              onReportIncident={() => setReportModalOpen(true)}
            />
          </div>
        )}

        {/* 2. DEDICATED EMERGENCY CORRIDOR FLEET MAP (Ambulances & Fire Engines Only) */}
        {activeTab === 'EMERGENCY' && (
          <div key="EMERGENCY" className="w-full h-full animate-page-enter">
            <EmergencyCorridorMap
              emergencies={emergencies}
              alerts={alerts}
              signals={signals}
              onDispatchVehicle={handleDispatchVehicle}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onClearCorridor={handleClearCorridor}
              userRole={activeRole}
              onPermissionDenied={handlePermissionDenied}
            />
          </div>
        )}

        {/* 3. Full-Screen City Map */}
        {activeTab === 'MAP' && (
          <div key="MAP" className="w-full h-full animate-page-enter">
            <RealTimeLiveMap
              signals={signals}
              roadblocks={roadblocks}
              selectedRoadblock={selectedRoadblock}
              selectedRoute={selectedRoute}
              emergencies={emergencies}
              onSelectRoadblock={(rb) => {
                setSelectedRoadblock(rb);
                if (rb.alternativeRoutes.length > 0) setSelectedRoute(rb.alternativeRoutes[0]);
              }}
              driverSpeedKmph={driverSpeed}
            />
          </div>
        )}

        {/* Signal Timers HUD Tab */}
        {activeTab === 'SIGNALS' && (
          <div key="SIGNALS" className="h-full overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-page-enter">
            <SignalTimerHUD
              signals={signals}
              onManualOverride={handleSignalOverrideAttempt}
              userSpeedKmph={driverSpeed}
              userRole={activeRole}
            />
          </div>
        )}

        {/* Roadblocks & Detours Tab */}
        {activeTab === 'ROADBLOCKS' && (
          <div key="ROADBLOCKS" className="h-full overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-page-enter">
            <RoadblockPredictor
              roadblocks={roadblocks}
              selectedRoadblock={selectedRoadblock}
              onSelectRoadblock={setSelectedRoadblock}
              selectedRoute={selectedRoute}
              onSelectRoute={setSelectedRoute}
              userRole={activeRole}
              onVerifyIncident={handleVerifyRoadblock}
              onReportIncident={() => setReportModalOpen(true)}
            />
          </div>
        )}

        {/* AI Pedestrian Radar Tab */}
        {activeTab === 'PEDESTRIANS' && (
          <div key="PEDESTRIANS" className="h-full overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-page-enter">
            <PedestrianRadar
              detections={pedestrianDetections}
              onTriggerSafetyHorn={handleTriggerSafetyHorn}
            />
          </div>
        )}
      </main>

      {/* Role-Specific Full Dashboard Overlay Modal */}
      <RoleDashboardModal
        isOpen={roleDashboardOpen}
        onClose={() => setRoleDashboardOpen(false)}
        userRole={activeRole}
        onRoleChange={handleRoleChange}
        signals={signals}
        roadblocks={roadblocks}
        emergencies={emergencies}
        alerts={alerts}
        incidentReports={incidentReports}
        onOpenReportModal={() => {
          setRoleDashboardOpen(false);
          setReportModalOpen(true);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setRoleDashboardOpen(false);
        }}
        onVerifyRoadblock={handleVerifyRoadblock}
        onClearCorridor={handleClearCorridor}
        onUpdateVehicleStatus={handleUpdateVehicleStatus}
      />

      {/* Citizen / Commuter Incident Reporting Modal */}
      <ReportIncidentModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportIncident}
        userRole={activeRole}
      />

      {/* Operator & Admin Signal Override Safety Protocol Modal */}
      <SafetyConfirmModal
        isOpen={safetyModalOpen}
        onClose={() => {
          setSafetyModalOpen(false);
          setTargetSafetySignal(null);
        }}
        onConfirm={handleConfirmSignalOverride}
        signal={targetSafetySignal}
        userRole={activeRole}
      />
    </div>
  );
}

export default App;
