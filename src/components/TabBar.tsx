import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  switchActivePharmacist,
  addNewTab,
  switchTab,
  closeTab,
  holdActiveBill,
  setHeldBillsModalOpen,
  setCustomerDisplayModalOpen,
  navigateTo,
  openAssignBillModal,
  assignBillToPharmacist,
  autoBalanceQueues,
  dismissTransferNotification
} from '../store/posSlice';
import {
  Plus,
  X,
  PauseCircle,
  Monitor,
  ShoppingBag,
  History,
  Users,
  UserCheck,
  Zap,
  ArrowRightCircle,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const TabBar: React.FC = () => {
  const dispatch = useDispatch();
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists);
  const activePharmacistId = useSelector((state: RootState) => state.pos.activePharmacistId);
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const heldBills = useSelector((state: RootState) => state.pos.heldBills);
  const transferNotification = useSelector((state: RootState) => state.pos.transferNotification);

  const [holdCustomerName, setHoldCustomerName] = useState<string>('');
  const [holdCustomerPhone, setHoldCustomerPhone] = useState<string>('');
  const [showHoldPrompt, setShowHoldPrompt] = useState<boolean>(false);

  const activePharmacist = pharmacists.find(p => p.id === activePharmacistId) || pharmacists[0];

  // Filter sessions assigned to current pharmacist
  const currentPharmacistSessions = sessions.filter(s => s.assignedPharmacistId === activePharmacistId);
  const currentSession = sessions.find(s => s.id === activeSessionId) || currentPharmacistSessions[0];
  const cartItemCount = currentSession ? currentSession.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

  // Workload analysis across all pharmacists
  const workloadData = pharmacists.map(pharm => {
    const count = sessions.filter(s => s.assignedPharmacistId === pharm.id).length;
    const isFree = count === 0;
    const isBusy = count >= 3;
    return { pharm, count, isFree, isBusy };
  });

  const busiest = [...workloadData].sort((a, b) => b.count - a.count)[0];
  const freest = [...workloadData].sort((a, b) => a.count - b.count)[0];
  const hasQueueDisbalance = busiest.count >= 3 && freest.count === 0;

  const handleConfirmHold = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(holdActiveBill({ customerName: holdCustomerName, customerPhone: holdCustomerPhone }));
    setHoldCustomerName('');
    setHoldCustomerPhone('');
    setShowHoldPrompt(false);
  };

  return (
    <div className="bg-slate-100 border-b border-slate-200 flex flex-col shadow-2xs">
      {/* 1. Multi-Pharmacist Counter Switcher & Live Workload Monitor */}
      <div className="bg-slate-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 pr-2 border-r border-slate-700">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Store Counters ({pharmacists.length}):</span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
            {workloadData.map(({ pharm, count, isFree, isBusy }) => {
              const isActiveCounter = pharm.id === activePharmacistId;

              return (
                <button
                  key={pharm.id}
                  onClick={() => {
                    if (!isActiveCounter) {
                      // Open Delegate Bill modal so user chooses which customer to delegate
                      dispatch(openAssignBillModal());
                    }
                  }}
                  title={
                    isActiveCounter
                      ? `Your active terminal: Counter ${pharm.counterNumber} (${pharm.name})`
                      : `Open delegation tool for Counter ${pharm.counterNumber} (${pharm.name})`
                  }
                  className={`group relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isActiveCounter
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm ring-2 ring-emerald-400/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-indigo-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    isFree ? 'bg-emerald-400' : isBusy ? 'bg-rose-400 animate-ping' : 'bg-amber-400'
                  }`} />
                  <span className="font-bold">
                    Counter {pharm.counterNumber}: {pharm.name.split(' ')[0]}
                    {isActiveCounter ? ' (You)' : ''}
                  </span>

                  {/* Workload badge */}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isFree
                      ? isActiveCounter ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                      : isBusy
                        ? 'bg-rose-900 text-rose-200 border border-rose-600 animate-pulse'
                        : isActiveCounter ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {count} {count === 1 ? 'bill' : 'bills'}
                    {isFree ? ' (Free)' : isBusy ? ' (Busy)' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Load balancing prompt & Quick Auto-Balance Button */}
        <div className="flex items-center space-x-2">
          {hasQueueDisbalance && (
            <div className="flex items-center space-x-2 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-lg animate-pulse">
              <span className="text-[11px] text-amber-300 font-medium hidden md:inline">
                ⚡ Counter {busiest.pharm.counterNumber} ({busiest.count} customers) is busy while Counter {freest.pharm.counterNumber} is free!
              </span>
              <button
                onClick={() => dispatch(autoBalanceQueues())}
                className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black px-2.5 py-0.5 rounded-md shadow-xs transition-all cursor-pointer active:scale-95"
                title="Automatically transfer surplus pending customers to the free pharmacist"
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>Auto-Balance Queues</span>
              </button>
            </div>
          )}

          <div className="text-[11px] text-slate-400 hidden lg:flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Active Terminal: <strong>{activePharmacist.name}</strong> ({activePharmacist.role})</span>
          </div>
        </div>
      </div>

      {/* Transfer Alert Toast Notification */}
      {transferNotification && (
        <div className="bg-indigo-600 text-white px-4 py-1.5 flex items-center justify-between text-xs font-semibold shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-200" />
            <span>{transferNotification.message}</span>
          </div>
          <button
            onClick={() => dispatch(dismissTransferNotification())}
            className="text-indigo-200 hover:text-white p-0.5 rounded hover:bg-indigo-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Pharmacist Customer Session Tabs & Counter Actions */}
      <div className="px-4 pt-2 pb-0 flex items-center justify-between">
        {/* Left: Active Pharmacist's Customer Tabs List */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
          {currentPharmacistSessions.map((session, index) => {
            const isActive = session.id === activeSessionId;
            const itemCount = session.items.reduce((sum, item) => sum + item.quantity, 0);
            const isTransferred = Boolean(session.transferredFromName);

            return (
              <div
                key={session.id}
                onClick={() => dispatch(switchTab(session.id))}
                className={`group relative flex items-center space-x-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold cursor-pointer border-t border-x transition-all duration-150 select-none ${isActive
                    ? 'bg-white text-emerald-800 border-slate-300 border-b-white -mb-[1px] shadow-2xs'
                    : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span>{session.tabTitle || `Customer ${index + 1}`}</span>
                </div>

                {isTransferred && (
                  <span
                    className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold"
                    title={`Delegated from ${session.transferredFromName}${session.transferNote ? `: ${session.transferNote}` : ''}`}
                  >
                    From {session.transferredFromName?.split(' ')[0]}
                  </span>
                )}

                {itemCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-300 text-slate-700'
                    }`}>
                    {itemCount}
                  </span>
                )}

                {/* Quick Delegate Icon on active tab */}
                {isActive && currentPharmacistSessions.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(openAssignBillModal({ sessionId: session.id }));
                    }}
                    className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-indigo-50 transition-colors ml-0.5"
                    title={`Delegate this bill to another pharmacist`}
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5 text-indigo-500" />
                  </button>
                )}

                {currentPharmacistSessions.length > 1 && (
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

          {/* Add New Session Tab Button for this Pharmacist */}
          <button
            onClick={() => dispatch(addNewTab(activePharmacistId))}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-t-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors border border-dashed border-emerald-300 cursor-pointer ml-1"
            title="Open New Customer Billing Tab (+)"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </button>
        </div>

        {/* Right: Delegation, Hold Bill & Customer Display Actions */}
        <div className="flex items-center space-x-2 pb-1.5">
          {/* Quick Delegate / Assign Button */}
          <button
            onClick={() => dispatch(openAssignBillModal({ sessionId: activeSessionId }))}
            className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-2xs cursor-pointer"
            title="Assign / Delegate current active customer bill to another pharmacist"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Delegate Bill</span>
          </button>

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
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs border ${cartItemCount > 0
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

          {/* View Saved Invoices History Button */}
          <button
            onClick={() => dispatch(navigateTo('INVOICES'))}
            className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="View All Saved Invoices History & Journal"
          >
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>Past Invoices</span>
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
    </div>
  );
};

