import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  closeAssignBillModal,
  assignBillToPharmacist
} from '../store/posSlice';
import {
  Users,
  X,
  ArrowRightCircle,
  Clock,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

export const AssignBillModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.assignBillModal);
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists);
  const activePharmacistId = useSelector((state: RootState) => state.pos.activePharmacistId);
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const heldBills = useSelector((state: RootState) => state.pos.heldBills);

  const [handoverNote, setHandoverNote] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  if (!modal.isOpen) return null;

  // Find target session or held bill
  const targetSession = modal.sessionId
    ? sessions.find(s => s.id === modal.sessionId)
    : null;
  const targetHeldBill = modal.heldBillId
    ? heldBills.find(h => h.id === modal.heldBillId)
    : null;

  const currentPharm = pharmacists.find(p => p.id === (targetSession?.assignedPharmacistId || activePharmacistId));

  // Determine other pharmacists
  const otherPharmacists = pharmacists.filter(p => p.id !== (targetSession?.assignedPharmacistId || activePharmacistId));

  // Bill stats
  const itemsCount = targetSession
    ? targetSession.items.reduce((sum, item) => sum + item.quantity, 0)
    : targetHeldBill
    ? targetHeldBill.billingSession.items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  const totalAmount = targetSession
    ? targetSession.items.reduce((sum, item) => sum + item.lineTotal, 0)
    : targetHeldBill
    ? targetHeldBill.totalAmount
    : 0;

  const customerTitle = targetSession
    ? (targetSession.patientDetails.patientName || targetSession.tabTitle || 'Active Customer')
    : targetHeldBill
    ? targetHeldBill.customerName
    : 'Customer Bill';

  const handleAssign = (targetId: string) => {
    dispatch(assignBillToPharmacist({
      sessionId: modal.sessionId,
      heldBillId: modal.heldBillId,
      targetPharmacistId: targetId,
      note: handoverNote.trim() || undefined
    }));
    setHandoverNote('');
    setSelectedTargetId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-100 text-indigo-700 p-2 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Delegate Customer Bill
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Transfer bill from <strong className="text-slate-700">{currentPharm?.name}</strong> (Counter {currentPharm?.counterNumber}) to a free pharmacist
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(closeAssignBillModal())}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Summary Card */}
        <div className="my-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800">{customerTitle}</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {itemsCount} item{itemsCount !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {targetSession?.patientDetails.phone ? `Phone: ${targetSession.patientDetails.phone} • ` : ''}
              Total Value: <strong className="text-emerald-700 font-bold">₹{totalAmount.toFixed(2)}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 block">Queue Transfer</span>
            <span className="text-xs font-black text-indigo-700">Ready to Delegate</span>
          </div>
        </div>

        {/* Select Target Pharmacist */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Select Available Pharmacist / Counter:
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {otherPharmacists.map((pharm) => {
              const activeCount = sessions.filter(s => s.assignedPharmacistId === pharm.id).length;
              const isSelected = selectedTargetId === pharm.id;
              const isFree = activeCount === 0;

              return (
                <div
                  key={pharm.id}
                  onClick={() => setSelectedTargetId(pharm.id)}
                  className={`border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : isFree
                      ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                      pharm.colorTheme === 'blue'
                        ? 'bg-blue-100 text-blue-700'
                        : pharm.colorTheme === 'purple'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {pharm.avatarInitials}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-900">{pharm.name}</h4>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                          Counter {pharm.counterNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{pharm.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      {isFree ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>FREE (0 queued)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{activeCount} active bill{activeCount !== 1 ? 's' : ''}</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssign(pharm.id);
                      }}
                      className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Assign</span>
                      <ArrowRightCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Handover Note (Optional) */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
            Handover Note / Prescription Remarks (Optional):
          </label>
          <input
            type="text"
            placeholder="e.g. Verified Doctor Rx, patient is waiting at Counter 2"
            value={handoverNote}
            onChange={(e) => setHandoverNote(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => dispatch(closeAssignBillModal())}
            className="text-xs px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
          >
            Cancel
          </button>
          {selectedTargetId && (
            <button
              type="button"
              onClick={() => handleAssign(selectedTargetId)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-2xs transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirm Transfer to Counter</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
