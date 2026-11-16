import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  navigateTo,
  logoutUser,
  setInvoiceHistoryModalOpen,
  switchActivePharmacist,
  setWellnessBrochureModalOpen,
  setMultiStoreModalOpen,
  setInterStoreChatbotModalOpen,
  setVoiceConsultationModalOpen,
  setPatientInstructionModalOpen,
  dismissReorderPushAlert,
  clearAllReorderPushAlerts,
  convertReorderAlertToPO,
  setRackRoboModalOpen,
  setOfflineBackupModalOpen
} from '../store/posSlice';
import type { AppView } from '../types/pos';
import api from '../utils/api';
import { isBrowserOnline, getOfflineInvoices } from '../utils/offlineStorage';
import {
  Clock, Store, LogOut, LayoutDashboard, ShoppingCart, Package, Truck, BarChart3,
  RotateCcw, Users, Building, Settings, History, FileText, Siren, ChevronDown,
  Check, Bike, AlertTriangle, Sparkles, Building2, Bot, Mic, Volume2,
  Bell, BellRing, X, AlertCircle, Compass, Zap, Wrench, Shield,
  Wifi, WifiOff, CloudUpload, HardDrive
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);
  const currentView = useSelector((state: RootState) => state.pos.currentView);
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists);
  const activePharmacistId = useSelector((state: RootState) => state.pos.activePharmacistId);
  const reorderPushAlerts = useSelector((state: RootState) => state.pos.reorderPushAlerts || []);
  const products = useSelector((state: RootState) => state.pos.products || []);
  const deliveryOrders = useSelector((state: RootState) => state.pos.deliveryOrders || []);

  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [showCounterDropdown, setShowCounterDropdown] = useState<boolean>(false);
  const [showReorderAlertsDropdown, setShowReorderAlertsDropdown] = useState<boolean>(false);

  // Live badge counts from API/Redux
  const [liveLowStockCount, setLiveLowStockCount] = useState<number>(0);
  const [livePendingDeliveryCount, setLivePendingDeliveryCount] = useState<number>(0);

  // Day 12: Offline Resilience & Sync Tracking
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(isBrowserOnline());
      const queue = getOfflineInvoices();
      setPendingOfflineCount(queue.filter(i => i.syncStatus === 'PENDING_SYNC').length);
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    const interval = setInterval(updateStatus, 8000);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      clearInterval(interval);
    };
  }, []);

  const activePharmacist = pharmacists.find(p => p.id === activePharmacistId) || pharmacists[0];

  // Store account name & initials
  const accountEmail = currentUser?.email || 'navyasri@genquantaa.com';
  const emailPrefixName = accountEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const accountName = currentUser?.pharmacistName || emailPrefixName || 'User';
  const accountInitial = emailPrefixName.trim().charAt(0).toUpperCase() || 'N';

  // Role permissions
  const userRole = (currentUser?.role || 'PHARMACIST').toUpperCase();
  const isOwner = userRole === 'OWNER';
  const isManager = userRole === 'MANAGER' || isOwner;
  const isCashier = userRole === 'CASHIER';
  const isEmergencyDesk = userRole === 'EMERGENCY_DESK' || (currentView === 'EMERGENCY_DELIVERY' && accountName.includes('Dr. S. Reddy'));

  // Calculate Low Stock from Redux Products
  const reduxLowStockCount = products.filter(p =>
    p.stockStatus === 'LOW_STOCK' ||
    p.stockStatus === 'OUT_OF_STOCK' ||
    (typeof p.totalStock === 'number' && p.totalStock <= 20)
  ).length;

  // Calculate Pending Delivery Orders from Redux
  const reduxPendingDeliveryCount = deliveryOrders.filter(o =>
    o.status === 'PENDING' || o.status === 'CONFIRMED'
  ).length;

  // Sync live counts with backend
  useEffect(() => {
    // 1. Fetch real-time low stock count from backend
    api.get('/products/stock/low')
      .then(res => {
        if (res.data?.success && typeof res.data.count === 'number') {
          setLiveLowStockCount(res.data.count);
        } else {
          setLiveLowStockCount(reduxLowStockCount);
        }
      })
      .catch(() => setLiveLowStockCount(reduxLowStockCount));

    // 2. Fetch pending online orders count from backend
    api.get('/delivery')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const count = res.data.data.filter((o: any) =>
            o.status === 'PENDING' || o.status === 'CONFIRMED'
          ).length;
          setLivePendingDeliveryCount(count);
        } else {
          setLivePendingDeliveryCount(reduxPendingDeliveryCount);
        }
      })
      .catch(() => setLivePendingDeliveryCount(reduxPendingDeliveryCount));
  }, [products.length, deliveryOrders.length]);

  const displayLowStock = Math.max(liveLowStockCount, reduxLowStockCount);
  const displayPendingDelivery = Math.max(livePendingDeliveryCount, reduxPendingDeliveryCount);

  // ─────────────────────────────────────────────────────────────────────────
  // Role-Based Navigation Tabs Definition
  // ─────────────────────────────────────────────────────────────────────────
  interface NavTabItem {
    id: AppView;
    label: string;
    icon: React.FC<{ className?: string }>;
    badgeCount?: number;
    badgeColor?: string;
    badgePulse?: boolean;
    roleGuard?: 'ALL' | 'PHARMACIST_AND_ABOVE' | 'MANAGER_ONLY';
  }

  // Center Navigation Tabs: Core Pharmacy Counter & Dashboard
  const navTabs: NavTabItem[] = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'POS_TERMINAL',
      label: 'Billing',
      icon: ShoppingCart
    }
  ];

  // Visible to all users
  const visibleTabs = navTabs;

  return (
    <header className="bg-white border-b border-slate-200 shadow-2xs px-3.5 py-1.5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. Left: Brand & Store Logo                                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2.5 shrink-0">
        <button
          onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
          className="flex items-center space-x-2.5 text-left group cursor-pointer"
        >
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-2 rounded-xl shadow-xs group-hover:scale-105 transition-transform flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-black text-slate-900 tracking-tight font-heading leading-tight group-hover:text-emerald-700 transition-colors">
                GENQUANTAA
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                POS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-none">
              Pharmacy System
            </p>
          </div>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. Center: Modern Segmented Navigation Tabs                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {isEmergencyDesk ? (
        // Emergency Desk Mode Specialized Tabs
        <div className="flex items-center space-x-1.5 bg-rose-50/80 border border-rose-200 p-1 rounded-xl">
          <button
            onClick={() => dispatch(navigateTo('EMERGENCY_DELIVERY'))}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'EMERGENCY_DELIVERY'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Siren className="w-3.5 h-3.5 animate-pulse" />
            <span>Emergency Fast Delivery</span>
          </button>

          <button
            onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'POS_TERMINAL'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>POS Counter</span>
          </button>

          <button
            onClick={() => dispatch(navigateTo('INVOICES'))}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'INVOICES'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-white/80'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Invoices</span>
          </button>
        </div>
      ) : (
        // Standard Modern Navigation Tabs Strip (Dashboard & Billing)
        <nav className="flex items-center space-x-1.5 bg-slate-100/80 border border-slate-200/80 p-1 rounded-xl shadow-2xs">
          {visibleTabs.map(tab => {
            const isActive = currentView === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => dispatch(navigateTo(tab.id))}
                className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
                title={`Go to ${tab.label}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. Right: Alerts, Counter Shift & Account Profile                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Safety Reorder Push Alert Bell */}
        <div className="relative">
          <button
            onClick={() => setShowReorderAlertsDropdown(!showReorderAlertsDropdown)}
            className={`p-1.5 rounded-xl transition-all cursor-pointer shadow-xs shrink-0 relative flex items-center justify-center border ${
              reorderPushAlerts.length > 0
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-300'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
            }`}
            title="Real-Time Safety Threshold Reorder Alerts"
          >
            {reorderPushAlerts.length > 0 ? (
              <BellRing className="w-4 h-4 text-rose-600 animate-pulse" />
            ) : (
              <Bell className="w-4 h-4" />
            )}

            {reorderPushAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                {reorderPushAlerts.length}
              </span>
            )}
          </button>

          {showReorderAlertsDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowReorderAlertsDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-black text-slate-900 font-heading">
                      Safety Reorder Alerts ({reorderPushAlerts.length})
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {reorderPushAlerts.some(a => a.status !== 'ADDED_TO_PO') && (
                      <button
                        onClick={() => {
                          reorderPushAlerts.forEach(a => {
                            if (a.status !== 'ADDED_TO_PO') {
                              dispatch(convertReorderAlertToPO({ alertId: a.id, reorderQty: a.suggestedReorderQty || 50 }));
                            }
                          });
                        }}
                        className="text-[9.5px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                        title="Add all pending depleted items to draft Purchase Order"
                      >
                        + All to PO
                      </button>
                    )}
                    {reorderPushAlerts.length > 0 && (
                      <button
                        onClick={() => dispatch(clearAllReorderPushAlerts())}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {reorderPushAlerts.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <p className="font-bold text-slate-600">No Reorder Alerts</p>
                    <p className="text-[10px] mt-0.5">All batch safety thresholds are satisfied.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {reorderPushAlerts.map((alert) => {
                      const isQueued = alert.status === 'ADDED_TO_PO';
                      return (
                        <div
                          key={alert.id}
                          className={`rounded-xl p-2.5 relative border transition-all ${
                            isQueued
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-rose-50/70 border-rose-200'
                          }`}
                        >
                          <div className="flex items-start justify-between pr-4">
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-tight">
                                {alert.productName}
                              </p>
                              {alert.saltComposition && (
                                <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                  {alert.saltComposition}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-1 text-[10px]">
                                <span className={`font-black px-1.5 py-0.2 rounded ${
                                  isQueued ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100/80 text-rose-700'
                                }`}>
                                  Stock: {alert.currentStock} units
                                </span>
                                <span className="text-slate-500 font-medium">
                                  Threshold: {alert.safetyThreshold || alert.minThreshold}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => dispatch(dismissReorderPushAlert(alert.id))}
                              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer absolute top-2 right-2 p-1"
                              title="Dismiss Alert"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                            <span className="text-[9px] text-slate-400 font-mono">
                              {alert.timestamp}
                            </span>
                            
                            <div className="flex items-center space-x-1.5">
                              {/* 1-Click PO Action Button */}
                              {isQueued ? (
                                <button
                                  onClick={() => {
                                    setShowReorderAlertsDropdown(false);
                                    dispatch(navigateTo('PURCHASE_GRN'));
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-2xs flex items-center space-x-1 cursor-pointer active:scale-95"
                                  title="View in Purchase Orders Draft"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>In Draft PO →</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    dispatch(convertReorderAlertToPO({ alertId: alert.id, reorderQty: alert.suggestedReorderQty || 50 }));
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg shadow-2xs flex items-center space-x-1 cursor-pointer active:scale-95"
                                  title="Add to Draft Purchase Order"
                                >
                                  <Zap className="w-3 h-3 text-amber-200" />
                                  <span>+ Add to PO</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Active Shift Counter Badge */}
        <div className="relative">
          {isEmergencyDesk ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-rose-50 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold shadow-2xs">
              <Siren className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span className="font-black">Emergency:</span>
              <span className="font-semibold text-rose-900">Dr. S. Reddy</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowCounterDropdown(!showCounterDropdown)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Active Shift Counter - Click to switch"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-black hidden sm:inline">Counter {activePharmacist.counterNumber}:</span>
                <span className="font-semibold text-emerald-900">{activePharmacist.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {showCounterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCounterDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 animate-fadeIn">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                      Switch Shift Counter
                    </div>
                    <div className="space-y-1">
                      {pharmacists.map((pharm) => {
                        const isSelected = activePharmacistId === pharm.id;
                        return (
                          <button
                            key={pharm.id}
                            onClick={() => {
                              dispatch(switchActivePharmacist(pharm.id));
                              setShowCounterDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${isSelected
                              ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300'
                              : 'text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <div>
                                <div className="font-bold leading-tight">Counter {pharm.counterNumber}: {pharm.name}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{pharm.role}</div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Day 12: Offline Resilience & Data Backup Pill */}
        <button
          onClick={() => dispatch(setOfflineBackupModalOpen(true))}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
            !isOnline
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
              : pendingOfflineCount > 0
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}
          title={!isOnline ? `Offline Resilience Mode Active (${pendingOfflineCount} queued)` : pendingOfflineCount > 0 ? `${pendingOfflineCount} offline bills ready to sync` : 'Connected to Cloud MongoDB. 1-Click Backup ready.'}
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline font-mono">Offline ({pendingOfflineCount})</span>
            </>
          ) : pendingOfflineCount > 0 ? (
            <>
              <CloudUpload className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              <span className="hidden sm:inline font-mono">Sync ({pendingOfflineCount})</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline font-mono text-[11px]">Online</span>
            </>
          )}
        </button>

        {/* User Account Avatar with Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center shadow-xs uppercase select-none cursor-pointer transition-all active:scale-95 ring-2 ring-emerald-100"
            title={`Signed in as ${accountName} (${userRole})`}
          >
            {accountInitial}
          </button>

          {showProfileDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileDropdown(false)}
              />

              <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-fadeIn">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white text-sm font-black flex items-center justify-center shadow-xs uppercase flex-shrink-0">
                    {accountInitial}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-900 truncate" title={accountName}>
                      {accountName}
                    </h4>
                    <span className={`inline-block mt-0.5 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      userRole === 'OWNER' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      userRole === 'MANAGER' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                      userRole === 'EMERGENCY_DESK' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {userRole}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-xs font-bold text-slate-800 truncate" title={accountEmail}>
                      {accountEmail}
                    </p>
                  </div>

                  {isManager && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        dispatch(navigateTo('SETTINGS'));
                      }}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-600" />
                      <span>Store Settings &amp; Hardware</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      dispatch(logoutUser());
                    }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out Account</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
