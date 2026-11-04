import React, { useState } from 'react';
import { EmergencyVehicle, TrafficControllerAlert } from '../types/traffic';
import { 
  Siren, 
  Flame, 
  Hospital, 
  BellRing, 
  CheckCheck, 
  Radio, 
  Zap, 
  Navigation, 
  PlusCircle,
  AlertTriangle,
  Volume2
} from 'lucide-react';

interface EmergencyCorridorProps {
  emergencies: EmergencyVehicle[];
  alerts: TrafficControllerAlert[];
  onDispatchNewVehicle: (type: 'AMBULANCE' | 'FIRE_ENGINE', destination: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onClearCorridor: (vehicleId: string) => void;
}

export const EmergencyCorridor: React.FC<EmergencyCorridorProps> = ({
  emergencies,
  alerts,
  onDispatchNewVehicle,
  onAcknowledgeAlert,
  onClearCorridor
}) => {
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [newType, setNewType] = useState<'AMBULANCE' | 'FIRE_ENGINE'>('AMBULANCE');
  const [newDestination, setNewDestination] = useState('Metro City Medical Center (Trauma)');

  const activeEmergencies = emergencies.filter(e => e.status !== 'CLEARED');
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    onDispatchNewVehicle(newType, newDestination);
    setShowDispatchModal(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse">
              <Siren className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Priority Emergency Corridor & Controller Dispatch Hub
            </h2>
            <span className="bg-red-950 text-red-300 text-xs px-2.5 py-0.5 rounded-full border border-red-800/80 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              {activeEmergencies.length} Active Corridors
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automatic green corridor creation: overrides upcoming signals and immediately notifies the area traffic controller of incoming emergency units.
          </p>
        </div>

        {/* Trigger Dispatch Button */}
        <button
          onClick={() => setShowDispatchModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition"
        >
          <PlusCircle className="w-4 h-4" />
          Dispatch Emergency Vehicle
        </button>
      </div>

      {/* Controller Urgent Attention Banner (If unacknowledged) */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="mb-5 bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-l-4 border-red-500 rounded-xl p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-xl text-white animate-bounce">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-red-400 tracking-wider">
                    CRITICAL CONTROLLER NOTIFICATION
                  </span>
                  <span className="text-[10px] bg-red-900/60 text-red-200 px-2 py-0.5 rounded font-mono">
                    {unacknowledgedAlerts[0].junctionName}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {unacknowledgedAlerts[0].title}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {unacknowledgedAlerts[0].message}
                </p>
              </div>
            </div>

            <button
              onClick={() => onAcknowledgeAlert(unacknowledgedAlerts[0].id)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition shadow"
            >
              <CheckCheck className="w-4 h-4" />
              Acknowledge & Confirm Green Wave
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Active Vehicles & Controller Desks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {activeEmergencies.map((ev) => {
          const isAmbulance = ev.type === 'AMBULANCE';
          return (
            <div
              key={ev.id}
              className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Emergency light streak indicator */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isAmbulance ? 'from-red-500 via-rose-400 to-red-500' : 'from-amber-500 via-orange-500 to-red-500'} animate-pulse`} />

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isAmbulance ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'} border border-slate-700`}>
                      {isAmbulance ? <Hospital className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{ev.stationName}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {ev.plateNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Target: <span className="text-slate-200 font-medium">{ev.destinationHospital}</span></p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-red-950 text-red-300 border border-red-800 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-red-400" /> GREEN CORRIDOR ACTIVE
                  </span>
                </div>

                {/* Controller Notification Status Card */}
                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 mb-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      Assigned Way Controller:
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" /> Notified & Synced
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">
                    {ev.assignedController}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>Corridor Path: {ev.assignedZone}</span>
                    <span className="text-cyan-300 font-mono">Status: {ev.notifiedAt}</span>
                  </div>
                </div>

                {/* Corridor Progression & ETA */}
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Time to Destination</div>
                    <div className="text-base font-mono font-bold text-emerald-400">{ev.etaMinutes} min</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Upcoming Signals</div>
                    <div className="text-base font-mono font-bold text-cyan-400">{ev.activeSignalCount} Pre-empted</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-400">Cleared Intersections</div>
                    <div className="text-base font-mono font-bold text-slate-300">{ev.clearedSignalCount}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-red-400" /> Siren Audio Beacon Transmitting
                </span>
                <button
                  onClick={() => onClearCorridor(ev.id)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  Mark Mission Complete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch Modal with maximum z-index so it never slips behind map */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative z-[100000] bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)]">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Siren className="w-5 h-5 text-red-500" />
              Dispatch Emergency Unit & Auto-Clear Corridor
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Instantly transmits arrival notification to the traffic controller desk and turns upcoming signals green along the transit corridor.
            </p>

            <form onSubmit={handleDispatch} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Emergency Unit Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('AMBULANCE')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition ${
                      newType === 'AMBULANCE'
                        ? 'border-red-500 bg-red-950/40 text-red-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Hospital className="w-5 h-5" />
                    Ambulance (Trauma)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('FIRE_ENGINE')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition ${
                      newType === 'FIRE_ENGINE'
                        ? 'border-orange-500 bg-orange-950/40 text-orange-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <Flame className="w-5 h-5" />
                    Fire Engine (Rescue)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Destination Point / Incident Site
                </label>
                <select
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                >
                  <option value="Metro City Medical Center (Trauma)">Metro City Medical Center (Trauma Hub)</option>
                  <option value="Apex Emergency Hospital - ICU Ward">Apex Emergency Hospital - ICU Ward</option>
                  <option value="Commercial Sector 63 - Structural Fire">Commercial Sector 63 - Structural Fire</option>
                  <option value="Expressway KM 18 Collision Extraction">Expressway KM 18 Collision Extraction</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg transition"
                >
                  Activate Corridor & Alert Controller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

