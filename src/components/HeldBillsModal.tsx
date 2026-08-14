import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setHeldBillsModalOpen, restoreHeldBill, discardHeldBill } from '../store/posSlice';
import { ShoppingBag, Play, X, User, Phone, Clock, Trash2, ChevronDown, ChevronUp, Tag } from 'lucide-react';

export const HeldBillsModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.heldBillsModal);
  const heldBills = useSelector((state: RootState) => state.pos.heldBills);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!modal.isOpen) return null;

  const totalHeldAmount = heldBills.reduce((sum, h) => sum + h.totalAmount, 0);

  const handleDiscard = (id: string, name: string) => {
    if (window.confirm(`Discard held bill for ${name}? This action cannot be undone.`)) {
      dispatch(discardHeldBill(id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-modal rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[85vh] flex flex-col">

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading leading-tight">
                Parked Customer Bills ({heldBills.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Total Held Value: <strong className="text-amber-800 font-bold">₹{totalHeldAmount.toFixed(2)}</strong>
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
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {heldBills.length === 0 ? (
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

              return (
                <div
                  key={held.id}
                  className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3 text-xs font-bold text-slate-900 font-heading">
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
                        onClick={() => dispatch(restoreHeldBill(held.id))}
                        className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-transform active:scale-95 cursor-pointer"
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
