import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setCustomerDisplayModalOpen } from '../store/posSlice';
import { Monitor, X, ShoppingBag, QrCode, Sparkles } from 'lucide-react';

export const CustomerDisplayModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.customerDisplayModal);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  
  const currentSession = useSelector((state: RootState) => state.pos.sessions.find(s => s.id === activeSessionId));
  const items = currentSession?.items || [];
  const grandTotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative">
        {/* Dual Display Header */}
        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold font-heading">
                GENQUANTAA DUAL-DISPLAY (CUSTOMER FACING)
              </h3>
              <p className="text-[11px] text-emerald-300 font-medium">
                Live Customer Screen Preview • Standby Monitor Sync
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(setCustomerDisplayModalOpen(false))}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Customer Content View */}
        <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden bg-slate-50">
          {/* Cart Table Customer View */}
          <div className="col-span-8 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-full shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <span className="text-xs font-bold text-slate-700 font-heading flex items-center space-x-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Your Selected Medicines ({items.length})</span>
              </span>
              <span className="text-xs font-semibold text-slate-500">Welcome to MedPlus Pharmacy</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="text-center py-20 text-slate-400 space-y-2">
                  <Sparkles className="w-10 h-10 mx-auto text-emerald-400 animate-pulse" />
                  <p className="text-sm font-bold text-slate-700">Thank you for visiting Genquantaa Pharmacy!</p>
                  <p className="text-xs text-slate-400">Items added by pharmacist will appear here in real-time</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="py-2 px-2">Medicine Item</th>
                      <th className="py-2 px-1 text-center">Qty</th>
                      <th className="py-2 px-1 text-right">Unit Price</th>
                      <th className="py-2 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {items.map(item => (
                      <tr key={item.cartItemId}>
                        <td className="py-2.5 px-2 font-bold text-slate-900">{item.product.name}</td>
                        <td className="py-2.5 px-1 text-center font-bold text-slate-700">{item.quantity}</td>
                        <td className="py-2.5 px-1 text-right text-slate-600">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-right font-extrabold text-emerald-800">₹{item.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Summary & Dynamic UPI QR Customer Panel */}
          <div className="col-span-4 bg-gradient-to-b from-emerald-900 to-teal-950 text-white rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider">Total Payable</span>
              <h2 className="text-3xl font-black font-heading text-white mt-1 mb-4">₹{grandTotal.toFixed(2)}</h2>

              {/* Dynamic QR Display */}
              <div className="bg-white p-4 rounded-2xl text-center space-y-2 text-slate-900 shadow-md">
                <svg className="w-32 h-32 mx-auto text-slate-900" viewBox="0 0 100 100">
                  <path fill="currentColor" d="M0 0h30v30H0zM40 0h20v10H40zM70 0h30v30H70zM10 10h10v10H10zM80 10h10v10H80zM0 40h10v20H0zM20 40h20v10H20zM50 40h20v20H50zM80 40h20v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 70h20v30H40zM70 70h20v10H70zM90 80h10v20H90z"/>
                </svg>
                <div className="flex items-center justify-center space-x-1 text-xs font-bold text-emerald-800">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Scan & Pay via UPI</span>
                </div>
                <p className="text-[10px] text-slate-500">Supports GPay, PhonePe, Paytm & BHIM</p>
              </div>
            </div>

            <div className="text-[11px] text-emerald-200 text-center font-medium pt-3 border-t border-emerald-800/60">
              ⚡ Powered by Genquantaa POS Platform
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
