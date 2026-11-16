import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  switchActivePharmacist,
  addNewTab,
  switchTab,
  closeTab,
  updateTabTitle,
  holdActiveBill,
  setHeldBillsModalOpen,
  setCustomerDisplayModalOpen,
  navigateTo,
  openAssignBillModal,
  assignBillToPharmacist,
  autoBalanceQueues,
  dismissTransferNotification,
  clearActiveSession,
  setHeldBills
} from '../store/posSlice';
import api from '../utils/api';
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
  Clock,
  Box,
  Edit2,
  Check,
  AlertTriangle,
  Keyboard,
  FileText
} from 'lucide-react';
import type { BillingSession } from '../types/pos';

export const TabBar: React.FC = () => {
  const dispatch = useDispatch();
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists);
  const activePharmacistId = useSelector((state: RootState) => state.pos.activePharmacistId);
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const heldBills = useSelector((state: RootState) => state.pos.heldBills);
  const transferNotification = useSelector((state: RootState) => state.pos.transferNotification);
  const putAwayTasks = useSelector((state: RootState) => state.pos.putAwayTasks || []);
  const pendingPutAwayCount = putAwayTasks.filter(t => t.status === 'PENDING').length;
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'OWNER';

  // Hold Bill Prompt states
  const [holdCustomerName, setHoldCustomerName] = useState<string>('');
  const [holdCustomerPhone, setHoldCustomerPhone] = useState<string>('');
  const [showHoldPrompt, setShowHoldPrompt] = useState<boolean>(false);

  // Tab Renaming state
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Safe Close Confirmation Dialog (guarantees zero accidental item loss)
  const [sessionToClose, setSessionToClose] = useState<BillingSession | null>(null);

  // Initial fetch for held bills
  useEffect(() => {
    api.get('/billing/held-bills').then(res => {
      if (res.data.success) {
        dispatch(setHeldBills(res.data.data));
      }
    }).catch(console.error);
  }, [dispatch]);

  const activePharmacist = pharmacists.find(p => p.id === activePharmacistId) || pharmacists[0];

  // Filter sessions assigned to current pharmacist
  const currentPharmacistSessions = sessions.filter(s => s.assignedPharmacistId === activePharmacistId);
  const currentSession = sessions.find(s => s.id === activeSessionId) || currentPharmacistSessions[0];
  const cartItemCount = currentSession ? currentSession.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
  const cartSubtotal = currentSession
    ? currentSession.items.reduce((sum, item) => sum + (item.lineTotal || (item.unitPrice * item.quantity)), 0)
    : 0;

  // Workload analysis across all pharmacists
  const workloadData = pharmacists.map(pharm => {
    const count = sessions.filter(s => s.assignedPharmacistId === pharm.id).length;
    const isFree = count === 0;
    const isBusy = count >= 3;
    return { pharm, count, isFree, isBusy };
  });

  const busiest = [...workloadData].sort((a, b) => b.count - a.count)[0];
  const freest = [...workloadData].sort((a, b) => a.count - b.count)[0];
  const hasQueueDisbalance = busiest && freest && busiest.count >= 3 && freest.count === 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // Keyboard Shortcuts for Rapid Multi-Customer Switching (Ctrl+T, Ctrl+W, Ctrl+1..8)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing inside an input/textarea (except Ctrl combinations)
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInputFocused = targetTag === 'input' || targetTag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

      // 1. New Tab: Ctrl + T or Alt + N
      if ((e.ctrlKey && (e.key === 't' || e.key === 'T')) || (e.altKey && (e.key === 'n' || e.key === 'N'))) {
        e.preventDefault();
        if (currentPharmacistSessions.length < 8) {
          dispatch(addNewTab(activePharmacistId));
        }
        return;
      }

      // 2. Close Active Tab: Ctrl + W or Alt + W
      if ((e.ctrlKey && (e.key === 'w' || e.key === 'W')) || (e.altKey && (e.key === 'w' || e.key === 'W'))) {
        e.preventDefault();
        if (currentSession && currentPharmacistSessions.length > 1) {
          handleRequestCloseTab(currentSession);
        }
        return;
      }

      // 3. Switch Tabs: Ctrl + 1..8 or Alt + 1..8
      if ((e.ctrlKey || e.altKey) && !isNaN(Number(e.key))) {
        const tabNum = parseInt(e.key, 10);
        if (tabNum >= 1 && tabNum <= currentPharmacistSessions.length) {
          e.preventDefault();
          const target = currentPharmacistSessions[tabNum - 1];
          if (target) {
            dispatch(switchTab(target.id));
          }
        }
        return;
      }

      // 4. Hold Bill: Ctrl + H or Alt + H
      if ((e.ctrlKey && (e.key === 'h' || e.key === 'H')) || (e.altKey && (e.key === 'h' || e.key === 'H'))) {
        if (!isInputFocused) {
          e.preventDefault();
          if (cartItemCount > 0) {
            setShowHoldPrompt(prev => !prev);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPharmacistSessions, activePharmacistId, currentSession, cartItemCount, dispatch]);

  // Handle Tab Renaming
  const handleStartRename = (session: BillingSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabId(session.id);
    setEditTitleInput(session.tabTitle || '');
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 50);
  };

  const handleSaveRename = (sessionId: string) => {
    if (editTitleInput.trim()) {
      dispatch(updateTabTitle({ sessionId, title: editTitleInput.trim() }));
    }
    setEditingTabId(null);
  };

  // Safe Close Request: check if cart has items before closing
  const handleRequestCloseTab = (session: BillingSession) => {
    const itemCount = session.items.reduce((sum, item) => sum + item.quantity, 0);
    if (itemCount > 0) {
      // Prompt user with safe choices to prevent item loss
      setSessionToClose(session);
    } else {
      dispatch(closeTab(session.id));
    }
  };

  // Safe Close: Hold bill instead then close tab
  const handleHoldAndClose = async (session: BillingSession) => {
    try {
      const totalAmount = session.items.reduce((sum, item) => sum + item.lineTotal, 0);
      const payload = {
        customerName: session.patientDetails?.patientName || session.tabTitle || 'Walk-in Customer',
        customerPhone: session.patientDetails?.phone || 'N/A',
        billingSession: session,
        totalAmount
      };
      const res = await api.post('/billing/hold-bill', payload);
      if (res.data.success) {
        const countRes = await api.get('/billing/held-bills');
        if (countRes.data.success) {
          dispatch(setHeldBills(countRes.data.data));
        }
      }
    } catch (err) {
      console.error('Failed to auto-hold bill before close:', err);
    } finally {
      dispatch(closeTab(session.id));
      setSessionToClose(null);
    }
  };

  // Hold Active Bill Handler
  const handleConfirmHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession || currentSession.items.length === 0) {
      alert("Cart is empty. Cannot hold an empty bill.");
      return;
    }

    try {
      const totalAmount = currentSession.items.reduce((sum, item) => sum + item.lineTotal, 0);
      const payload = {
        customerName: holdCustomerName || currentSession.patientDetails?.patientName || 'Walk-in Customer',
        customerPhone: holdCustomerPhone || currentSession.patientDetails?.phone || 'N/A',
        billingSession: currentSession,
        totalAmount
      };

      const res = await api.post('/billing/hold-bill', payload);
      if (res.data.success) {
        dispatch(clearActiveSession());
        const countRes = await api.get('/billing/held-bills');
        if (countRes.data.success) {
          dispatch(setHeldBills(countRes.data.data));
        }
        setHoldCustomerName('');
        setHoldCustomerPhone('');
        setShowHoldPrompt(false);
      }
    } catch (e) {
      console.error('Failed to hold bill', e);
      alert('Failed to hold bill to server');
    }
  };

  return (
    <div className="bg-slate-100 border-b border-slate-200 flex flex-col shadow-2xs select-none">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. Multi-Pharmacist Counter Switcher & Workload Monitor           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 pr-2 border-r border-slate-700">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Counters:</span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
            {workloadData.map(({ pharm, count, isFree, isBusy }) => {
              const isActiveCounter = pharm.id === activePharmacistId;

              return (
                <button
                  key={pharm.id}
                  onClick={() => {
                    if (!isActiveCounter) {
                      dispatch(openAssignBillModal(undefined));
                    }
                  }}
                  title={
                    isActiveCounter
                      ? `Your active counter: Counter ${pharm.counterNumber} (${pharm.name})`
                      : `Open delegation tool for Counter ${pharm.counterNumber} (${pharm.name})`
                  }
                  className={`group relative flex items-center space-x-2 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isActiveCounter
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm ring-2 ring-emerald-400/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    isFree ? 'bg-emerald-400' : isBusy ? 'bg-rose-400 animate-ping' : 'bg-amber-400'
                  }`} />
                  <span className="font-bold">
                    Counter {pharm.counterNumber}: {pharm.name.split(' ')[0]}
                    {isActiveCounter ? ' (You)' : ''}
                  </span>

                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isFree
                      ? isActiveCounter ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                      : isBusy
                        ? 'bg-rose-900 text-rose-200 border border-rose-600 animate-pulse'
                        : isActiveCounter ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {count} {count === 1 ? 'bill' : 'bills'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Load balancing alert & Quick Auto-Balance */}
        <div className="flex items-center space-x-2">
          {hasQueueDisbalance && (
            <div className="flex items-center space-x-2 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-lg">
              <span className="text-[11px] text-amber-300 font-medium hidden md:inline">
                ⚡ Counter {busiest.pharm.counterNumber} ({busiest.count} carts) busy
              </span>
              {isManager && (
                <button
                  onClick={() => dispatch(autoBalanceQueues())}
                  className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>Auto-Balance</span>
                </button>
              )}
            </div>
          )}

          {/* Keyboard Shortcuts Hint Pill */}
          <div className="hidden xl:flex items-center space-x-1.5 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
            <Keyboard className="w-3 h-3 text-emerald-400" />
            <span>Ctrl+T New Tab · Ctrl+1..8 Switch · Ctrl+W Close · Ctrl+H Hold</span>
          </div>

          <div className="text-[11px] text-slate-400 hidden lg:flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span><strong>{activePharmacist.name}</strong> ({activePharmacist.role})</span>
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

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. Multi-Customer Billing Tabs Strip & Action Center               */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-0 flex items-center justify-between gap-2 overflow-x-auto">
        {/* Left: Active Pharmacist's Customer Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none pb-[1px]">
          {currentPharmacistSessions.map((session, index) => {
            const isActive = session.id === activeSessionId;
            const itemCount = session.items.reduce((sum, item) => sum + item.quantity, 0);
            const totalAmount = session.items.reduce((sum, item) => sum + (item.lineTotal || (item.unitPrice * item.quantity)), 0);
            const isTransferred = Boolean(session.transferredFromName);
            const shortcutIndex = index + 1;
            const isEditing = editingTabId === session.id;

            // Display title: either custom title, patient name, or Customer X
            const displayTitle = session.patientDetails?.patientName?.trim() || session.tabTitle || `Customer ${shortcutIndex}`;

            return (
              <div
                key={session.id}
                onClick={() => dispatch(switchTab(session.id))}
                onDoubleClick={(e) => handleStartRename(session, e)}
                title={`Click to switch | Double-click to rename | Shortcut: Ctrl+${shortcutIndex}`}
                className={`group relative flex items-center space-x-2 px-3 py-1.5 rounded-t-xl text-xs font-semibold cursor-pointer border-t border-x transition-all select-none min-w-[130px] max-w-[240px] ${
                  isActive
                    ? 'bg-white text-emerald-900 border-slate-300 border-b-white -mb-[1px] shadow-sm z-10'
                    : 'bg-slate-200/80 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {/* Shortcut Index Pill */}
                <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-300 text-slate-600'
                }`}>
                  {shortcutIndex}
                </span>

                {/* Status Dot */}
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  isActive ? 'bg-emerald-500 ring-2 ring-emerald-300/50 animate-pulse' : 'bg-slate-400'
                }`} />

                {/* Title / Inline Rename Input */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editTitleInput}
                      onChange={(e) => setEditTitleInput(e.target.value)}
                      onBlur={() => handleSaveRename(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(session.id);
                        if (e.key === 'Escape') setEditingTabId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-xs font-bold px-1 py-0.5 bg-amber-50 border border-amber-400 rounded outline-hidden"
                    />
                  ) : (
                    <div className="flex items-center space-x-1 truncate">
                      <span className="truncate font-bold text-xs" title={displayTitle}>
                        {displayTitle}
                      </span>
                      {isActive && (
                        <button
                          onClick={(e) => handleStartRename(session, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-emerald-700 p-0.5 transition-opacity"
                          title="Rename Tab (Double-click)"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Financial & Item Badge */}
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium">
                    <span className={itemCount > 0 ? (isActive ? 'text-emerald-700 font-bold' : 'text-slate-700 font-bold') : ''}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                    {totalAmount > 0 && (
                      <span className="font-bold text-slate-900 font-mono">
                        ₹{totalAmount.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delegated from another pharmacist badge */}
                {isTransferred && (
                  <span
                    className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold shrink-0"
                    title={`Delegated from ${session.transferredFromName}`}
                  >
                    From {session.transferredFromName?.split(' ')[0]}
                  </span>
                )}

                {/* Quick Delegate Icon on active tab */}
                {isActive && currentPharmacistSessions.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(openAssignBillModal({ sessionId: session.id }));
                    }}
                    className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-indigo-50 transition-colors ml-0.5 shrink-0"
                    title="Delegate this customer bill to another counter"
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5 text-indigo-500" />
                  </button>
                )}

                {/* Safe Close Tab Button */}
                {currentPharmacistSessions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestCloseTab(session);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full hover:bg-rose-50 transition-colors shrink-0"
                    title="Close Customer Tab (Ctrl+W)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add New Customer Tab Button (Up to 8 tabs) */}
          {currentPharmacistSessions.length < 8 ? (
            <button
              onClick={() => dispatch(addNewTab(activePharmacistId))}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-t-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-dashed border-emerald-300 cursor-pointer shadow-2xs active:scale-95 shrink-0"
              title="Open New Customer Billing Tab (Ctrl + T)"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>New Customer</span>
              <span className="text-[10px] text-emerald-600 font-normal">[{currentPharmacistSessions.length}/8]</span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 font-semibold px-2" title="Max 8 active tabs per counter">
              Max 8 tabs
            </span>
          )}
        </div>

        {/* Right: Actions Bar (Put-Away, Delegate, Hold Bill, Held Bills Drawer, Past Invoices, Display) */}
        <div className="flex items-center space-x-2 pb-1.5 shrink-0">
          {/* Put-Away Shelf Return Pill */}
          {pendingPutAwayCount > 0 && (
            <button
              onClick={() => dispatch(navigateTo('RETURNS'))}
              className="flex items-center space-x-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 hover:border-purple-400 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Medicines waiting to be returned to shelves"
            >
              <Box className="w-3.5 h-3.5 text-purple-600" />
              <span>📦 {pendingPutAwayCount} Put-Away</span>
            </button>
          )}

          {/* Delegate Bill Button */}
          <button
            onClick={() => dispatch(openAssignBillModal({ sessionId: activeSessionId }))}
            className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all shadow-2xs cursor-pointer"
            title="Delegate current customer bill to another pharmacist"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Delegate</span>
          </button>

          {/* Hold Active Bill Dropdown/Prompt */}
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
                title="Park / Hold current bill (Ctrl + H)"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Hold Bill</span>
              </button>
            ) : (
              <form onSubmit={handleConfirmHold} className="flex items-center space-x-1 bg-white border border-amber-300 p-1 rounded-lg shadow-xl z-30">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={holdCustomerName}
                  onChange={(e) => setHoldCustomerName(e.target.value)}
                  className="w-28 text-xs px-2 py-1 border border-slate-300 rounded focus:outline-hidden"
                  required
                  autoFocus
                />
                <input
                  type="tel"
                  placeholder="Phone No."
                  value={holdCustomerPhone}
                  onChange={(e) => setHoldCustomerPhone(e.target.value)}
                  className="w-24 text-xs px-2 py-1 border border-slate-300 rounded focus:outline-hidden"
                />
                <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2.5 py-1 rounded font-bold">
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

          {/* View Held Bills List Drawer */}
          <button
            onClick={() => dispatch(setHeldBillsModalOpen(true))}
            className="relative flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="View Held Bills"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Held Bills</span>
            {heldBills.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {heldBills.length}
              </span>
            )}
          </button>

          {/* Past Invoices Shortcut */}
          <button
            onClick={() => dispatch(navigateTo('INVOICES'))}
            className="flex items-center space-x-1 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="View Past Invoices"
          >
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden lg:inline">Invoices</span>
          </button>

          {/* Customer Facing Display Screen */}
          <button
            onClick={() => dispatch(setCustomerDisplayModalOpen(true))}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Customer Display"
          >
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Display</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. Safe Close Confirmation Modal (Zero Item Loss Guarantee)        */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {sessionToClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Active Cart has Items!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>{sessionToClose.patientDetails?.patientName || sessionToClose.tabTitle || 'This customer tab'}</strong> contains{' '}
                  <span className="font-bold text-amber-700">
                    {sessionToClose.items.reduce((s, i) => s + i.quantity, 0)} items worth ₹
                    {sessionToClose.items.reduce((s, i) => s + (i.lineTotal || (i.unitPrice * i.quantity)), 0).toFixed(2)}
                  </span>
                  . What would you like to do?
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="font-semibold text-slate-700">Items in this cart:</div>
              <div className="max-h-24 overflow-y-auto space-y-1 scrollbar-thin">
                {sessionToClose.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600 text-[11px]">
                    <span className="truncate max-w-[200px]">{it.product.name} (x{it.quantity})</span>
                    <span className="font-mono font-semibold">₹{(it.lineTotal || (it.unitPrice * it.quantity)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSessionToClose(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleHoldAndClose(sessionToClose)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Hold Bill & Close</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  dispatch(closeTab(sessionToClose.id));
                  setSessionToClose(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
