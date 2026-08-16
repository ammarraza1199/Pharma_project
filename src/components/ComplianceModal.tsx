import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  closeComplianceModal,
  saveScheduleHCompliance,
  verifyManagerPin
} from '../store/posSlice';
import { ShieldAlert, Lock, Stethoscope, X, CheckCircle } from 'lucide-react';

export const ComplianceModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.complianceModal);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const currentSession = useSelector((state: RootState) => state.pos.sessions.find(s => s.id === activeSessionId));

  const [docName, setDocName] = useState<string>(currentSession?.doctorDetails?.doctorName || '');
  const [docRegNo, setDocRegNo] = useState<string>(currentSession?.doctorDetails?.regNo || '');
  const [patientName, setPatientName] = useState<string>(currentSession?.patientDetails?.patientName || '');
  const [patientPhone, setPatientPhone] = useState<string>(currentSession?.patientDetails?.phone || '');
  const [patientAge, setPatientAge] = useState<string>(currentSession?.patientDetails?.age || '');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>(currentSession?.patientDetails?.gender || 'MALE');

  const [managerPinInput, setManagerPinInput] = useState<string>('');

  if (!modal.isOpen) return null;

  const handleScheduleHSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !patientName.trim()) {
      alert('Doctor Name and Patient Name are required.');
      return;
    }
    dispatch(saveScheduleHCompliance({
      doctorDetails: { doctorName: docName, regNo: docRegNo },
      patientDetails: { patientName, phone: patientPhone, age: patientAge, gender: patientGender }
    }));
  };

  const handleManagerPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(verifyManagerPin(managerPinInput));
    setManagerPinInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-modal rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            {modal.type === 'SCHEDULE_X' ? (
              <div className="bg-rose-100 p-2 rounded-xl text-rose-700">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
            ) : (
              <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
                <Stethoscope className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                {modal.type === 'SCHEDULE_X'
                  ? 'SCHEDULE X (NARCOTIC) SECURITY GUARDRAIL'
                  : 'SCHEDULE H / H1 COMPLIANCE DETAILS'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {modal.type === 'SCHEDULE_X'
                  ? 'Store Manager PIN authorization required by Drug Controller Authority'
                  : 'Prescribing doctor and patient details required before adding medicine'}
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closeComplianceModal())}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Schedule X Hard Lock PIN Prompt */}
        {modal.type === 'SCHEDULE_X' && (
          <form onSubmit={handleManagerPinSubmit} className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 space-y-1.5">
              <p className="font-extrabold flex items-center space-x-1.5 text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>RESTRICTED CONTROLLED SUBSTANCE (SCHEDULE X / NARCOTIC)</span>
              </p>
              <p className="text-xs">
                Medicine: <strong className="font-bold text-slate-900">{modal.targetProduct?.name || 'Controlled Narcotic Drug'}</strong>
                {modal.targetProduct?.saltComposition && (
                  <span className="block text-[11px] text-slate-600 font-medium">Composition: {modal.targetProduct.saltComposition}</span>
                )}
              </p>
              <p className="text-[11px] text-rose-800 font-semibold bg-rose-100/60 p-2 rounded-lg border border-rose-200">
                🔒 Manager PIN authorization is required <strong>every time</strong> a Schedule X or Narcotic drug is added to a bill.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter 4-Digit Manager PIN (Default: 1234)
              </label>
              <input
                type="password"
                maxLength={4}
                value={managerPinInput}
                onChange={(e) => setManagerPinInput(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-lg font-black tracking-widest py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                autoFocus
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => dispatch(closeComplianceModal())}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs cursor-pointer"
              >
                Authorize & Add to Cart
              </button>
            </div>
          </form>
        )}

        {/* Schedule H Doctor & Patient Form */}
        {modal.type === 'SCHEDULE_H' && (
          <form onSubmit={handleScheduleHSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name *</label>
                <input
                  type="text"
                  placeholder="Dr. Rajesh Sharma"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                  autoFocus
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Medical Reg No.</label>
                <input
                  type="text"
                  placeholder="MCI-88921"
                  value={docRegNo}
                  onChange={(e) => setDocRegNo(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  placeholder="Ramesh Kumar"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile No.</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  placeholder="35"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => dispatch(closeComplianceModal())}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Save Details & Add to Cart</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
