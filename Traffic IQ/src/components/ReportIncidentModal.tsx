import React, { useState } from 'react';
import { IncidentReport, UserRole } from '../types/traffic';
import {
  AlertTriangle,
  MapPin,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  Car,
  CloudRain,
  Construction
} from 'lucide-react';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: Omit<IncidentReport, 'id' | 'timestamp' | 'status' | 'upvotes'>) => void;
  userRole: UserRole;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userRole
}) => {
  const [category, setCategory] = useState<'ACCIDENT' | 'WATERLOGGING' | 'ROADWORK' | 'HAZARD'>('ACCIDENT');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Sector 62 Interchange / Expressway Link');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'>('HIGH');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;

    onSubmit({
      reportedByRole: userRole,
      reporterName: userRole === 'CITIZEN' ? 'Citizen Commuter (Live App)' : 'Traffic Field Unit',
      category,
      title,
      location,
      severity,
      description: description || 'Reported via TrafficIQ Citizen Portal.'
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#DADCE0] rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#DADCE0] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#FCE8E6] text-[#D93025] border border-[#FAD2CF]">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-[#202124]">Report Traffic Incident</h3>
              <p className="text-[11px] text-[#5F6368]">
                Citizen crowdsource channel • Simulated automated operator verification
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] uppercase mb-1.5">
              Incident Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCategory('ACCIDENT')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  category === 'ACCIDENT'
                    ? 'bg-[#FCE8E6] text-[#D93025] border-[#FAD2CF]'
                    : 'bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-[#FFFFFF]'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Collision</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('WATERLOGGING')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  category === 'WATERLOGGING'
                    ? 'bg-[#E8F0FE] text-[#1A73E8] border-[#DADCE0]'
                    : 'bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-[#FFFFFF]'
                }`}
              >
                <CloudRain className="w-4 h-4" />
                <span>Waterlogging</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('ROADWORK')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  category === 'ROADWORK'
                    ? 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]'
                    : 'bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-[#FFFFFF]'
                }`}
              >
                <Construction className="w-4 h-4" />
                <span>Roadwork</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('HAZARD')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  category === 'HAZARD'
                    ? 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3]'
                    : 'bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-[#FFFFFF]'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Hazard</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] uppercase mb-1">
              Short Description / Headline
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken down truck blocking center lane"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DADCE0] focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] bg-[#FFFFFF] text-[#202124]"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] uppercase mb-1">
              Location / Junction
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#5F6368] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#DADCE0] focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] bg-[#FFFFFF] text-[#202124]"
              />
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] uppercase mb-1.5">
              Estimated Severity
            </label>
            <div className="flex items-center gap-2">
              {(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    severity === sev
                      ? sev === 'CRITICAL'
                        ? 'bg-[#D93025] text-white border-[#D93025]'
                        : sev === 'HIGH'
                        ? 'bg-[#B06000] text-white border-[#B06000]'
                        : sev === 'MODERATE'
                        ? 'bg-[#F9AB00] text-[#202124] border-[#F9AB00]'
                        : 'bg-[#188038] text-white border-[#188038]'
                      : 'bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#5F6368] uppercase mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mention lane obstructions, expected delays, or emergency presence..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DADCE0] focus:outline-hidden focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] bg-[#FFFFFF] text-[#202124]"
            />
          </div>

          {/* Informational notice */}
          <div className="bg-[#E8F0FE] p-3 rounded-xl border border-[#DADCE0] text-[11px] text-[#1A73E8] flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>
              Your report will be automatically transmitted to the Traffic Command Operator desk for verification.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#DADCE0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4] rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-[#1A73E8] hover:bg-[#1558B0] text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

