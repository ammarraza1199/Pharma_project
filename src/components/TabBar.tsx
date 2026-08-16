import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  addNewTab,
  switchTab,
  closeTab,
  holdActiveBill,
  setHeldBillsModalOpen,
  setCustomerDisplayModalOpen
} from '../store/posSlice';
import { Plus, X, PauseCircle, Monitor, ShoppingBag } from 'lucide-react';

export const TabBar: React.FC = () => {
  const dispatch = useDispatch();
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const heldBills = useSelector((state: RootState) => state.pos.heldBills);
  
  const currentSession = sessions.find(s => s.id === activeSessionId);
  const cartItemCount = currentSession ? currentSession.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  const [holdCustomerName, setHoldCustomerName] = useState<string>('');
  const [holdCustomerPhone, setHoldCustomerPhone] = useState<string>('');
  const [showHoldPrompt, setShowHoldPrompt] = useState<boolean>(false);

  const handleConfirmHold = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(holdActiveBill({ customerName: holdCustomerName, customerPhone: holdCustomerPhone }));
    setHoldCustomerName('');
    setHoldCustomerPhone('');
    setShowHoldPrompt(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(verifyManagerPin(pin));
    setPin('');
    setShowPinInput(false);
  };

  return (
    <div className="bg-slate-100 border-b border-slate-200 px-4 pt-2 pb-0 flex items-center justify-between shadow-2xs">
      {/* Left: Tab Sessions List */}
      <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
        {sessions.map((session, index) => {
          const isActive = session.id === activeSessionId;
          const itemCount = session.items.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <div
              key={session.id}
              onClick={() => dispatch(switchTab(session.id))}
              className={`group relative flex items-center space-x-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold cursor-pointer border-t border-x transition-all duration-150 select-none ${
                isActive
                  ? 'bg-white text-emerald-800 border-slate-300 border-b-white -mb-[1px] shadow-2xs'
                  : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span>{session.tabTitle || `Customer ${index + 1}`}</span>
              </div>

              {itemCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-300 text-slate-700'
                }`}>
                  {itemCount}
                </span>
              )}

              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(closeTab(session.id));
                  }}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-slate-200/50 transition-colors"
                  title="Close Tab"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add New Session Tab Button */}
        <button
          onClick={() => dispatch(addNewTab())}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-t-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors border border-dashed border-emerald-300 cursor-pointer ml-1"
          title="Open New Billing Tab (+)"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Right: Park / Hold Bill & Customer Display Actions */}
      <div className="flex items-center space-x-2 pb-1.5">
        {/* Hold Active Bill Button */}
        <div className="relative">
          {!showHoldPrompt ? (
            <button
              onClick={() => {
                if (cartItemCount === 0) {
                  alert('Cart is empty! Add items before parking a bill.');
                  return;
                }
                setShowHoldPrompt(true);
              }}
              disabled={cartItemCount === 0}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs border ${
                cartItemCount > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Hold Bill</span>
            </button>
          ) : (
            <form onSubmit={handleConfirmHold} className="flex items-center space-x-1 bg-white border border-amber-300 p-1 rounded-lg shadow-lg z-20">
              <input
                type="text"
                placeholder="Customer Name"
                value={holdCustomerName}
                onChange={(e) => setHoldCustomerName(e.target.value)}
                className="w-24 text-xs px-2 py-1 border border-slate-300 rounded focus:outline-hidden"
                required
                autoFocus
              />
              <input
                type="tel"
                placeholder="Mobile No."
                value={holdCustomerPhone}
                onChange={(e) => setHoldCustomerPhone(e.target.value)}
                className="w-24 text-xs px-2 py-1 border border-slate-300 rounded focus:outline-hidden"
              />
              <button type="submit" className="bg-amber-600 text-white text-xs px-2.5 py-1 rounded hover:bg-amber-700 font-bold">
                Park
              </button>
              <button
                type="button"
                onClick={() => setShowHoldPrompt(false)}
                className="text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            </form>
          )}
        </div>

        {/* View Held Bills List Drawer Button */}
        <button
          onClick={() => dispatch(setHeldBillsModalOpen(true))}
          className="relative flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
          <span>Held Bills</span>
          {heldBills.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {heldBills.length}
            </span>
          )}
        </button>

        {/* Dual Monitor Customer Display Toggle */}
        <button
          onClick={() => dispatch(setCustomerDisplayModalOpen(true))}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          title="Customer Facing Display Screen"
        >
          <Monitor className="w-3.5 h-3.5 text-emerald-400" />
          <span>Customer Display</span>
        </button>
      </div>
    </div>
  );
};
