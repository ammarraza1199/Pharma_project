import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  setHeldBillsModalOpen,
  restoreHeldBill,
  openAssignBillModal,
  setHeldBills
} from '../store/posSlice';
import api from '../utils/api';
import type { HeldBill } from '../types/pos';
import { ShoppingBag, Play, X, User, Phone, Clock, Trash2, ChevronDown, ChevronUp, Tag, UserCheck, ArrowRightCircle, Loader2 } from 'lucide-react';

export const HeldBillsModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.heldBillsModal);
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists);
  const heldBills = useSelector((state: RootState) => state.pos.heldBills);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modal.isOpen) {
      fetchHeldBills();
    }
  }, [modal.isOpen]);

  const fetchHeldBills = async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/held-bills');
      if (res.data.success) {
        dispatch(setHeldBills(res.data.data));
      }
    } catch (error) {
      console.error('Failed to fetch held bills', error);
    } finally {
      setLoading(false);
    }
  };

  if (!modal.isOpen) return null;

  const totalHeldAmount = heldBills.reduce((sum, h) => sum + h.totalAmount, 0);

  const handleDiscard = async (id: string, name: string) => {
    if (window.confirm(`Discard held bill for ${name}? This action cannot be undone.`)) {
      try {
        await api.delete(`/billing/held-bills/${id}`);
        fetchHeldBills(); // Refresh list
      } catch (error) {
        console.error('Failed to delete', error);
      }
    }
  };

  const handleRestore = (held: HeldBill) => {
    // Ideally we would delete it from server here or after checkout, but for now we dispatch to redux and maybe delete it from server.
    const heldId = held.id || (held as any)._id;
    dispatch(restoreHeldBill(heldId));
    api.delete(`/billing/held-bills/${heldId}`).catch(console.error);
    dispatch(setHeldBillsModalOpen(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-modal rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[85vh] flex flex-col">

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading leading-tight">
                Store Parked Customer Bills ({heldBills.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Total Held Value: <strong className="text-amber-800 font-bold">₹{totalHeldAmount.toFixed(2)}</strong> across all store counters
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(setHeldBillsModalOpen(false))}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parked Bills List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          )}
          
          {heldBills.length === 0 && !loading ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 font-heading">No Parked Bills</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Click 'Hold Bill' in the top bar to park an active customer session temporarily
              </p>
            </div>
          ) : (
            heldBills.map((held) => {
              const isExpanded = expandedId === held.id;
              const assignedPharm = pharmacists.find(p => p.id === held.assignedPharmacistId) || pharmacists[0];

              return (
                <div
                  key={held.id || (held as any)._id}
                  className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5 text-xs font-bold text-slate-900 font-heading">
                        <span className="flex items-center space-x-1">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{held.customerName}</span>
                        </span>
                        {held.customerPhone && held.customerPhone !== 'N/A' && (
                          <span className="flex items-center space-x-1 text-slate-500 font-normal">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{held.customerPhone}</span>
                          </span>
                        )}
                        <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Counter {assignedPharm.counterNumber} ({assignedPharm.name.split(' ')[0]})
                        </span>
                        {held.transferredFromName && (
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                            From {held.transferredFromName.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Parked at {held.heldAt}</span>
                        </span>
                        <span>• {held.billingSession.items.length} Medicines</span>
                      </div>
                    </div>

                    <div className="text-right flex items-center space-x-2">
                      <div className="text-sm font-black text-amber-800 font-heading mr-1">
                        ₹{held.totalAmount.toFixed(2)}
                      </div>

                      {/* Expand Details Trigger */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : held.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="View itemized medicines"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* Delegate to other counter action */}
                      <button
                        onClick={() => {
                          dispatch(setHeldBillsModalOpen(false));
                          dispatch(openAssignBillModal({ heldBillId: held.id }));
                        }}
                        className="flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-indigo-200"
                        title="Delegate this held bill to another counter"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Delegate</span>
                      </button>

                      {/* Discard Action */}
                      <button
                        onClick={() => handleDiscard(held.id, held.customerName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Discard held bill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Resume Action */}
                      <button
                        onClick={() => handleRestore(held)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Itemized Drawer */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center space-x-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>Parked Medicines ({held.billingSession.items.length})</span>
                      </p>
                      <div className="divide-y divide-slate-200">
                        {held.billingSession.items.map((item) => (
                          <div key={item.cartItemId} className="py-1 flex justify-between text-[11px]">
                            <span className="font-medium text-slate-800">
                              {item.product.name} <span className="text-slate-400 font-normal">×{item.quantity}</span>
                            </span>
                            <span className="font-bold text-slate-700">₹{item.lineTotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
