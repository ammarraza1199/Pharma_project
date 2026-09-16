import React, { useState } from 'react';
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
  setRackRoboModalOpen
} from '../store/posSlice';
import {
  Clock, Store, LogOut, LayoutDashboard, ShoppingCart, Package, Truck, BarChart3,
  RotateCcw, Users, Building, Settings, History, FileText, Siren, ChevronDown,
  Check, Bike, AlertTriangle, Sparkles, Building2, Bot, Mic, Volume2,
  Bell, BellRing, X, AlertCircle, Compass, Zap
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);
  const currentView = useSelector((state: RootState) => state.pos.currentView);
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists);
  const activePharmacistId = useSelector((state: RootState) => state.pos.activePharmacistId);
  const reorderPushAlerts = useSelector((state: RootState) => state.pos.reorderPushAlerts || []);
  const [showProfileDropdown, setShowProfileDropdown] = useState<boolean>(false);
  const [showCounterDropdown, setShowCounterDropdown] = useState<boolean>(false);
  const [showReorderAlertsDropdown, setShowReorderAlertsDropdown] = useState<boolean>(false);

  const activePharmacist = pharmacists.find(p => p.id === activePharmacistId) || pharmacists[0];

  // Store account initial — always from the STORE LOGIN email, never from the pharmacist name
  const accountEmail = currentUser?.email || 'navyasri@genquantaa.com';
  const emailPrefixName = accountEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const accountName = currentUser?.pharmacistName || emailPrefixName || 'User';
  // Always show first letter of the EMAIL prefix (store account), not the pharmacist/role name
  const accountInitial = emailPrefixName.trim().charAt(0).toUpperCase() || 'N';

  // Emergency desk mode: signed in with Emergency Desk option
  const isEmergencyDesk = currentView === 'EMERGENCY_DELIVERY' && accountName.includes('Dr. S. Reddy');

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs px-4 py-2 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Store Information */}
      <div className="flex items-center space-x-3">
        <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-sm flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight font-heading">
              GENQUANTAA POS
            </h1>
          </div>
        </div>
      </div>

      {/* Right Controls: Manager Lock & Pharmacist Profile & Exit */}
      <div className="flex items-center space-x-1.5">
        {/* Dashboard Nav */}
        <button
          onClick={() => dispatch(navigateTo('DASHBOARD'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'DASHBOARD'
            ? 'bg-violet-100 text-violet-800 font-bold'
            : 'text-slate-500 hover:text-violet-700 hover:bg-violet-50'
            }`}
          title="Dashboard"
        >
          <LayoutDashboard className="w-4 h-4" />
        </button>

        {/* POS Terminal Nav */}
        <button
          onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'POS_TERMINAL'
            ? 'bg-emerald-100 text-emerald-800 font-bold'
            : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          title="POS Billing Terminal"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>

        {/* Saved Invoices History Nav */}
        <button
          onClick={() => dispatch(navigateTo('INVOICES'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'INVOICES'
            ? 'bg-emerald-100 text-emerald-800 font-bold'
            : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          title="Invoices & Sales History"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Inventory Catalog Nav */}
        <button
          onClick={() => dispatch(navigateTo('INVENTORY'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'INVENTORY'
            ? 'bg-emerald-100 text-emerald-800 font-bold'
            : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          title="Inventory Catalog"
        >
          <Package className="w-4 h-4" />
        </button>

        {/* Inventory Shelf & Price Dashboard Nav */}
        <button
          onClick={() => dispatch(navigateTo('INVENTORY_DASHBOARD'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'INVENTORY_DASHBOARD'
            ? 'bg-teal-100 text-teal-800 font-bold shadow-2xs'
            : 'text-slate-500 hover:text-teal-700 hover:bg-teal-50'
            }`}
          title="Inventory Shelf, Expiry & Pricing Dashboard"
        >
          <BarChart3 className="w-4 h-4 text-teal-600" />
        </button>

        {/* Stock Purchase GRN Nav */}
        <button
          onClick={() => dispatch(navigateTo('PURCHASE_GRN'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'PURCHASE_GRN'
            ? 'bg-amber-100 text-amber-800 font-bold'
            : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
            }`}
          title="Stock Purchase (GRN)"
        >
          <Truck className="w-4 h-4" />
        </button>

        {/* Reports Nav */}
        <button
          onClick={() => dispatch(navigateTo('REPORTS'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'REPORTS'
            ? 'bg-blue-100 text-blue-800 font-bold'
            : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50'
            }`}
          title="Sales Reports & GST Analytics"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        {/* Returns & Refunds Nav */}
        <button
          onClick={() => dispatch(navigateTo('RETURNS'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'RETURNS'
            ? 'bg-rose-100 text-rose-800 font-bold'
            : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
            }`}
          title="Returns & Refund Credit Notes"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Expiry Management Nav */}
        <button
          onClick={() => dispatch(navigateTo('EXPIRY_MANAGEMENT'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'EXPIRY_MANAGEMENT'
            ? 'bg-amber-100 text-amber-800 font-bold'
            : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'
            }`}
          title="Expiry & Stock Disposal Management"
        >
          <Clock className="w-4 h-4 text-amber-600" />
        </button>

        {/* Patients Directory Nav */}
        <button
          onClick={() => dispatch(navigateTo('PATIENTS'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'PATIENTS'
            ? 'bg-orange-100 text-orange-800 font-bold'
            : 'text-slate-500 hover:text-orange-700 hover:bg-orange-50'
            }`}
          title="Patients History Directory"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* Suppliers Directory Nav */}
        <button
          onClick={() => dispatch(navigateTo('SUPPLIERS'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'SUPPLIERS'
            ? 'bg-emerald-100 text-emerald-800 font-bold'
            : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          title="Suppliers & Vendors Directory"
        >
          <Building className="w-4 h-4" />
        </button>

        {/* Store Settings & Hardware Nav */}
        <button
          onClick={() => dispatch(navigateTo('SETTINGS'))}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentView === 'SETTINGS'
            ? 'bg-slate-800 text-white font-bold shadow-xs'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          title="Store Settings & Hardware Config"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Emergency Delivery Nav - Icon Only */}
        <button
          onClick={() => dispatch(navigateTo('EMERGENCY_DELIVERY'))}
          className={`p-1.5 rounded-lg transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center ${currentView === 'EMERGENCY_DELIVERY'
            ? 'bg-red-600 text-white ring-2 ring-red-300 shadow-sm shadow-red-600/40'
            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          title="Emergency Fast Delivery"
        >
          <Siren className="w-4 h-4 text-red-600 animate-pulse" />
        </button>

        {/* Online Delivery Dashboard Nav - Icon Only */}
        <button
          onClick={() => dispatch(navigateTo('ONLINE_DELIVERY'))}
          className={`p-1.5 rounded-lg transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center ${currentView === 'ONLINE_DELIVERY'
            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-sm'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          title="Online Home Delivery Dashboard"
        >
          <Bike className="w-4 h-4" />
        </button>

        {/* Health & Wellness Plan Brochure Nav - Icon Only */}
        <button
          onClick={() => dispatch(setWellnessBrochureModalOpen({ isOpen: true }))}
          className="p-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-xs transition-all cursor-pointer border border-emerald-400/30 shrink-0 flex items-center justify-center"
          title="Health & Wellness Plan Brochure"
        >
          <Sparkles className="w-4 h-4 text-emerald-100" />
        </button>

        {/* Multi-Store & Borrowed Stock Hub - Icon Only */}
        <button
          onClick={() => dispatch(setMultiStoreModalOpen({ isOpen: true }))}
          className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer border border-sky-400/30 shrink-0 flex items-center justify-center"
          title="Multi-Store & Inter-Branch Stock Lookup"
        >
          <Building2 className="w-4 h-4 text-sky-100" />
        </button>

        {/* Inter-Store AI Chatbot Widget - Icon Only */}
        <button
          onClick={() => dispatch(setInterStoreChatbotModalOpen(true))}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 shadow-xs transition-all cursor-pointer border border-slate-700 shrink-0 flex items-center justify-center"
          title="PharmaConnect AI Chatbot"
        >
          <Bot className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Customer Voice Record & Notes Nav - Icon Only */}
        <button
          onClick={() => dispatch(setVoiceConsultationModalOpen({ isOpen: true }))}
          className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer border border-rose-400/30 shrink-0 flex items-center justify-center"
          title="Customer Voice Record & Discussion Notes"
        >
          <Mic className="w-4 h-4 text-rose-100 animate-pulse" />
        </button>

        {/* Patient Instruction Leaflet (PIL) & Voice Clips - Icon Only */}
        <button
          onClick={() => dispatch(setPatientInstructionModalOpen({ isOpen: true }))}
          className="p-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition-all cursor-pointer border border-teal-500/30 shrink-0 flex items-center justify-center"
          title="Patient Instruction Leaflets (PIL) & Multi-Language Voice Clips"
        >
          <Volume2 className="w-4 h-4 text-teal-100" />
        </button>

        {/* Rack Selection Robo (Task #44) - Icon Only */}
        <button
          onClick={() => dispatch(setRackRoboModalOpen({ isOpen: true }))}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 shadow-xs transition-all cursor-pointer border border-cyan-400/40 shrink-0 flex items-center justify-center"
          title="Rack Selection Robo (Interactive 2D Pharmacy Shelf Map)"
        >
          <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
        </button>

        {/* Safety Reorder Push Alert Bell (Task #41) */}
        <div className="relative">
          <button
            onClick={() => setShowReorderAlertsDropdown(!showReorderAlertsDropdown)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer shadow-xs shrink-0 relative flex items-center justify-center ${
              reorderPushAlerts.length > 0
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-300'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
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
                              {alert.runoutDays !== undefined && (
                                <p className="text-[9.5px] font-bold text-amber-800 mt-0.5">
                                  ⏳ Runout: ~{alert.runoutDays} {alert.runoutDays === 1 ? 'day' : 'days'} left
                                </p>
                              )}
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
                              {/* Quick Supplier WhatsApp Intimation */}
                              <a
                                href={`https://wa.me/919849012345?text=${encodeURIComponent(`Urgent Reorder Intimation: ${alert.productName} has dropped to ${alert.currentStock} units (Batch: ${alert.batchNumber}). Please prepare supply dispatch.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-1.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-300 transition-colors inline-flex items-center"
                                title="Send Reorder Alert via WhatsApp to Supplier"
                              >
                                💬 WhatsApp
                              </a>

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
                                  title="1-Click: Add 50 units to Draft Purchase Order"
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

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowReorderAlertsDropdown(false);
                      dispatch(navigateTo('INVENTORY_DASHBOARD'));
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Open Stock Health Dashboard →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 🏪 Active Shift Counter Badge — or Emergency Desk Badge */}
        <div className="relative">
          {isEmergencyDesk ? (
            // Emergency Desk identity badge — no dropdown, fixed to Dr. S. Reddy
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold shadow-2xs">
              <Siren className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span className="font-black">Emergency Desk:</span>
              <span className="font-semibold text-rose-900">Dr. S. Reddy</span>
            </div>
          ) : (
            // Normal billing counter badge with switcher dropdown
            <>
              <button
                onClick={() => setShowCounterDropdown(!showCounterDropdown)}
                className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Active Shift Counter - Click to switch"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-black">Counter {activePharmacist.counterNumber}:</span>
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

        {/* User Profile Initial Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center shadow-xs uppercase select-none cursor-pointer transition-all active:scale-95 ring-2 ring-emerald-100"
            title={`Signed in as ${accountName}`}
          >
            {accountInitial}
          </button>

          {showProfileDropdown && (
            <>
              {/* Backdrop listener to close popup on outside click */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileDropdown(false)}
              ></div>

              {/* Profile Email Card Dropdown */}
              <div className="absolute right-0 mt-2.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-fadeIn">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-sm uppercase flex-shrink-0">
                    {accountInitial}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-900 truncate" title={accountName}>
                      {accountName}
                    </h4>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-xs font-bold text-slate-800 truncate" title={accountEmail}>
                      {accountEmail}
                    </p>
                  </div>

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

