import React, { useState } from 'react';
import { TrafficSignal, UserRole } from '../types/traffic';
import {
  ShieldAlert,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  Zap,
  Lock
} from 'lucide-react';

interface SafetyConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  signal: TrafficSignal | null;
  userRole: UserRole;
}

export const SafetyConfirmModal: React.FC<SafetyConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  signal,
  userRole
}) => {
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [check3, setCheck3] = useState(false);

  if (!isOpen || !signal) return null;

  const isCitizen = userRole === 'CITIZEN';
  const isResponder = userRole === 'RESPONDER';
  const isAuthorized = userRole === 'OPERATOR' || userRole === 'ADMIN';

  const allChecked = check1 && check2 && check3;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#DADCE0] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border ${
              isAuthorized
                ? 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]'
                : 'bg-[#FCE8E6] text-[#D93025] border-[#FAD2CF]'
            }`}>
              {isAuthorized ? <ShieldAlert className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#202124]">
                {isAuthorized ? 'Operator Signal Safety Protocol' : 'Permission Restricted'}
              </h3>
              <p className="text-[11px] text-[#5F6368]">
                Municipal V2X Traffic Safety Protocol • Junction {signal.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Signal Detail card */}
          <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#DADCE0] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#202124]">{signal.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DADCE0] text-[#5F6368]">
                {signal.id}
              </span>
            </div>
            <p className="text-[11px] text-[#5F6368]">{signal.junction}</p>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#DADCE0]">
              <span className="text-[#5F6368]">Current Light State:</span>
              <span className={`font-mono font-bold ${
                signal.currentStatus === 'GREEN'
                  ? 'text-[#188038]'
                  : signal.currentStatus === 'YELLOW'
                  ? 'text-[#B06000]'
                  : 'text-[#D93025]'
              }`}>
                {signal.currentStatus} ({signal.timeRemaining}s left)
              </span>
            </div>
          </div>

          {/* Access check message if NOT authorized */}
          {!isAuthorized ? (
            <div className="bg-[#FCE8E6] p-4 rounded-xl border border-[#FAD2CF] space-y-2 text-xs text-[#D93025]">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-[#D93025]" />
                <span>Access Denied: Unauthorised Role ({userRole})</span>
              </div>
              <p className="text-[11px] text-[#5F6368] leading-relaxed">
                {isCitizen
                  ? 'Citizens cannot execute manual signal overrides. Traffic light phases are synchronized to protect pedestrians and prevent vehicular cross-collisions.'
                  : 'Emergency responders coordinate green wave corridors through dispatch. Direct manual signal override is restricted to Control Room Operators and City Administrators.'}
              </p>
              <div className="pt-2 text-[10px] text-[#5F6368]">
                Switch your demo role to <strong>Traffic Operator</strong> or <strong>City Administrator</strong> in the top navigation bar to test authorized signal controls.
              </div>
            </div>
          ) : (
            /* Mandatory safety check items for Operators & Admins */
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#B06000]" />
                <span>Mandatory Safety Checklist Before Green Wave Lock</span>
              </div>

              <div className="space-y-2 text-xs text-[#202124]">
                <button
                  type="button"
                  onClick={() => setCheck1(!check1)}
                  className="w-full p-2.5 rounded-xl border border-[#DADCE0] hover:bg-[#F8F9FA] flex items-start gap-2.5 text-left transition"
                >
                  {check1 ? (
                    <CheckSquare className="w-4 h-4 text-[#188038] mt-0.5 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-[#5F6368] mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-[11px] leading-snug">
                    Confirm intersecting civilian cross-approaches have active yellow clearance and will be held at RED.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCheck2(!check2)}
                  className="w-full p-2.5 rounded-xl border border-[#DADCE0] hover:bg-[#F8F9FA] flex items-start gap-2.5 text-left transition"
                >
                  {check2 ? (
                    <CheckSquare className="w-4 h-4 text-[#188038] mt-0.5 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-[#5F6368] mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-[11px] leading-snug">
                    Verify via AI Pedestrian Radar that zebra crosswalks are clear of trapped pedestrians.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCheck3(!check3)}
                  className="w-full p-2.5 rounded-xl border border-[#DADCE0] hover:bg-[#F8F9FA] flex items-start gap-2.5 text-left transition"
                >
                  {check3 ? (
                    <CheckSquare className="w-4 h-4 text-[#188038] mt-0.5 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-[#5F6368] mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-[11px] leading-snug">
                    Operator authorization logged under municipal traffic incident safety protocol.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#DADCE0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4] rounded-xl transition"
            >
              Cancel
            </button>
            {isAuthorized && (
              <button
                type="button"
                disabled={!allChecked}
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-5 py-2 text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 ${
                  allChecked
                    ? 'bg-[#188038] hover:bg-[#137333] text-white cursor-pointer'
                    : 'bg-[#F1F3F4] text-[#5F6368] cursor-not-allowed'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Confirm & Override Signal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

