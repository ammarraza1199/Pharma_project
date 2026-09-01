import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  closeAssignBillModal,
  assignBillToPharmacist
} from '../store/posSlice';
import {
  Users,
  X,
  Clock,
  CheckCircle2,
  UserCheck,
  ArrowRight,
  CheckSquare,
  Square,
  Layers
} from 'lucide-react';

export const AssignBillModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.assignBillModal);
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists);
  const activePharmacistId = useSelector((state: RootState) => state.pos.activePharmacistId);
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);

  const currentPharm = pharmacists.find(p => p.id === activePharmacistId);
  const mySessions = sessions.filter(s => s.assignedPharmacistId === activePharmacistId);

  // Multi-select: set of selected session IDs
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [handoverNote, setHandoverNote] = useState('');

  const heldBill = useSelector((state: RootState) => 
    modal.heldBillId ? state.pos.heldBills.find(h => h.id === modal.heldBillId || (h as any)._id === modal.heldBillId) : null
  );

  useEffect(() => {
    if (modal.isOpen) {
      const preselect = modal.sessionId || activeSessionId || mySessions[0]?.id;
      setSelectedSessionIds(preselect ? new Set([preselect]) : new Set());
      setSelectedTargetId(null);
      setHandoverNote('');
    }
  }, [modal.isOpen, modal.sessionId, activeSessionId]);

  if (!modal.isOpen) return null;

  // Toggle a session in/out of selection
  const toggleSession = (id: string) => {
    setSelectedSessionIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Select / deselect all
  const allSelected = mySessions.length > 0 && mySessions.every(s => selectedSessionIds.has(s.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelectedSessionIds(new Set());
    } else {
      setSelectedSessionIds(new Set(mySessions.map(s => s.id)));
    }
  };

  // Aggregate stats for selected sessions
  const selectedSessions = mySessions.filter(s => selectedSessionIds.has(s.id));
  const totalItems = selectedSessions.reduce((sum, s) => sum + s.items.reduce((a, i) => a + i.quantity, 0), 0);
  const totalAmount = selectedSessions.reduce((sum, s) => sum + s.items.reduce((a, i) => a + i.lineTotal, 0), 0);

  const destinationPharmacists = pharmacists.filter(p => p.id !== activePharmacistId);

  const handleExecuteAssign = (targetId: string) => {
    if (heldBill) {
      dispatch(assignBillToPharmacist({
        heldBillId: heldBill.id || (heldBill as any)._id,
        targetPharmacistId: targetId,
        note: handoverNote.trim() || undefined
      }));
    } else {
      if (selectedSessions.length === 0) return;
      selectedSessions.forEach(session => {
        dispatch(assignBillToPharmacist({
          sessionId: session.id,
          targetPharmacistId: targetId,
          note: handoverNote.trim() || undefined
        }));
      });
    }
    dispatch(closeAssignBillModal());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Delegate Customer Bill{selectedSessionIds.size > 1 ? 's' : ''}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Logged in as: <strong className="text-slate-800">{currentPharm?.name}</strong> (Counter {currentPharm?.counterNumber})
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(closeAssignBillModal())}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1 py-3 space-y-4">
          
          {/* ── STEP 1: Multi-select Customer Bills ── */}
          {/* ── STEP 1: Select Customer Bills ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">1</span>
                <span>Customer Bill to Delegate:</span>
              </label>
              {!heldBill && (
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400 font-medium lowercase">({mySessions.length} active in your queue)</span>
                  {mySessions.length > 1 && (
                    <button
                      onClick={toggleAll}
                      className="flex items-center space-x-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {allSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                      <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {heldBill ? (
              <div className="p-3 rounded-2xl border bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs flex flex-col select-none">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 truncate flex-1 mr-2">{heldBill.customerName}</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Parked Bill</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-1 border-t border-slate-200/60">
                  <span>{heldBill.billingSession.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                  <span className="font-bold text-emerald-700">₹{heldBill.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mySessions.map((session, idx) => {
                  const isSelected = selectedSessionIds.has(session.id);
                  const count = session.items.reduce((sum, item) => sum + item.quantity, 0);
                  const total = session.items.reduce((sum, item) => sum + item.lineTotal, 0);
                  const title = session.patientDetails.patientName || session.tabTitle || `Customer ${idx + 1}`;

                  return (
                    <div
                      key={session.id}
                      onClick={() => toggleSession(session.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isSelected
                          ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 truncate flex-1 mr-2">{title}</span>
                        {/* Checkbox indicator */}
                        <span className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-1 border-t border-slate-200/60">
                        <span>{count} item{count !== 1 ? 's' : ''}</span>
                        <span className="font-bold text-emerald-700">₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Selected Bills Summary Banner ── */}
          {(selectedSessions.length > 0 || heldBill) ? (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="bg-indigo-100 p-1.5 rounded-xl">
                  <Layers className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <span className="text-[10px] text-indigo-600 font-bold uppercase">Selected for Delegation:</span>
                  <div className="font-black text-slate-900 text-sm">
                    {heldBill ? heldBill.customerName :
                      (selectedSessions.length === 1
                        ? (selectedSessions[0].patientDetails.patientName || selectedSessions[0].tabTitle)
                        : `${selectedSessions.length} customers selected`
                      )
                    }
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {heldBill ? heldBill.billingSession.items.reduce((a, i) => a + i.quantity, 0) : totalItems} medication{totalItems !== 1 && !heldBill ? 's' : ''} • Grand Total:{' '}
                    <strong className="text-emerald-700">₹{(heldBill ? heldBill.totalAmount : totalAmount).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
              <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                {heldBill || selectedSessions.length === 1 ? 'Ready' : `${selectedSessions.length} Bills`}
              </span>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-700 font-semibold text-center">
              ☝️ Select at least one customer bill above to delegate
            </div>
          )}

          {/* ── STEP 2: Select Which Counter / Pharmacist to Delegate To ── */}
          <div>
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-black">2</span>
                <span>Delegate To Counter / Pharmacist:</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Click Assign</span>
            </label>

            <div className="space-y-2">
              {destinationPharmacists.map((pharm) => {
                const activeCount = sessions.filter(s => s.assignedPharmacistId === pharm.id).length;
                const isSelected = selectedTargetId === pharm.id;
                const isFree = activeCount === 0;
                const isChief = pharm.id === 'pharm-emergency';

                return (
                  <div
                    key={pharm.id}
                    onClick={() => setSelectedTargetId(pharm.id)}
                    className={`border rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                        : isFree
                          ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${
                        isChief
                          ? 'bg-rose-100 text-rose-700'
                          : pharm.colorTheme === 'blue'
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
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-black uppercase ${
                            isChief ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isChief ? 'SOS Desk' : `Counter ${pharm.counterNumber}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{pharm.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        {isFree ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>FREE (0 queued)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{activeCount} active bill{activeCount !== 1 ? 's' : ''}</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={selectedSessions.length === 0 && !heldBill}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteAssign(pharm.id);
                        }}
                        className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black px-3.5 py-2 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <span>Assign{selectedSessions.length > 1 && !heldBill ? ` (${selectedSessions.length})` : ''}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Handover Note (Optional) */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Handover Remarks (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Verified Rx, patient is waiting near counter..."
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Actions Footer */}
        {/* Actions Footer */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={() => dispatch(closeAssignBillModal())}
            className="text-xs px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {selectedTargetId && (selectedSessions.length > 0 || heldBill) && (
            <button
              type="button"
              onClick={() => handleExecuteAssign(selectedTargetId)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>
                {selectedSessions.length > 1 && !heldBill
                  ? `Transfer ${selectedSessions.length} Bills to Counter`
                  : 'Confirm Transfer to Counter'
                }
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
