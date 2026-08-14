import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { verifyManagerPin, navigateTo, logoutUser } from '../store/posSlice';
import { ShieldCheck, Wifi, Clock, User, Lock, Store, LogOut, Home, LayoutDashboard, ShoppingCart, Package, Truck, BarChart3, RotateCcw, Users, Building, Settings } from 'lucide-react';



export const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const isManager = useSelector((state: RootState) => state.pos.isManagerAuthenticated);
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);
  const [timeStr, setTimeStr] = useState<string>('');
  const [showPinInput, setShowPinInput] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(verifyManagerPin(pin));
    setPin('');
    setShowPinInput(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs px-4 py-2 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Store Information */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => dispatch(navigateTo('LANDING'))}>
        <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-sm flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight font-heading">
              {currentUser?.pharmacyName || 'GENQUANTAA POS'}
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Tech City Store • DL: {currentUser?.licenseNo || 'DL-2024/HYD/889201'}
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center space-x-4 bg-slate-50 border border-slate-200 px-3.5 py-1 rounded-xl">
        {/* Offline Reliability Status */}
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>72h Offline Ready</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-300"></div>

        {/* Live Clock */}
        <div className="flex items-center space-x-1 text-xs font-semibold text-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{timeStr || '12:00:00 PM'}</span>
        </div>
      </div>

      {/* Right Controls: Manager Lock & Pharmacist Profile & Exit */}
      <div className="flex items-center space-x-2">
        {/* Manager Auth Button */}
        {isManager ? (
          <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manager Unlocked</span>
          </div>
        ) : (
          <div className="relative">
            {!showPinInput ? (
              <button
                onClick={() => setShowPinInput(true)}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>PIN Lock</span>
              </button>
            ) : (
              <form onSubmit={handlePinSubmit} className="flex items-center space-x-1 bg-white border border-slate-300 p-1 rounded-lg shadow-md">
                <input
                  type="password"
                  placeholder="PIN (1234)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-16 text-xs px-1.5 py-0.5 border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                <button type="submit" className="bg-emerald-600 text-white text-[11px] px-2 py-0.5 rounded hover:bg-emerald-700 font-medium">
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinInput(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              </form>
            )}
          </div>
        )}

        {/* Pharmacist Profile */}
        <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
          <div className="bg-slate-200 p-1 rounded-full text-slate-700">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {currentUser?.pharmacistName || 'Navya Sri'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Chief Pharmacist</p>
          </div>
        </div>

        {/* Dashboard Nav */}
        <button
          onClick={() => dispatch(navigateTo('DASHBOARD'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-violet-700 hover:bg-violet-50 transition-colors"
          title="Dashboard"
        >
          <LayoutDashboard className="w-4 h-4" />
        </button>

        {/* POS Terminal Nav */}
        <button
          onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          title="POS Billing Terminal"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>

        {/* Inventory Catalog Nav */}
        <button
          onClick={() => dispatch(navigateTo('INVENTORY'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          title="Inventory Catalog"
        >
          <Package className="w-4 h-4" />
        </button>

        {/* Stock Purchase GRN Nav */}
        <button
          onClick={() => dispatch(navigateTo('PURCHASE_GRN'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
          title="Stock Purchase (GRN)"
        >
          <Truck className="w-4 h-4" />
        </button>

        {/* Reports Nav */}
        <button
          onClick={() => dispatch(navigateTo('REPORTS'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          title="Sales Reports & GST Analytics"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        {/* Returns & Refunds Nav */}
        <button
          onClick={() => dispatch(navigateTo('RETURNS'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          title="Returns & Refund Credit Notes"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Expiry Management Nav */}
        <button
          onClick={() => dispatch(navigateTo('EXPIRY_MANAGEMENT'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
          title="Expiry & Stock Disposal Management"
        >
          <Clock className="w-4 h-4 text-amber-600" />
        </button>

        {/* Patients Directory Nav */}
        <button
          onClick={() => dispatch(navigateTo('PATIENTS'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-orange-700 hover:bg-orange-50 transition-colors"
          title="Patients History Directory"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* Suppliers Directory Nav */}
        <button
          onClick={() => dispatch(navigateTo('SUPPLIERS'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          title="Suppliers & Vendors Directory"
        >
          <Building className="w-4 h-4" />
        </button>

        {/* Store Settings & Hardware Nav */}
        <button
          onClick={() => dispatch(navigateTo('SETTINGS'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Store Settings & Hardware Config"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Home */}
        <button
          onClick={() => dispatch(navigateTo('LANDING'))}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Back to Landing Page"
        >
          <Home className="w-4 h-4" />
        </button>

        <button
          onClick={() => dispatch(logoutUser())}
          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>

      </div>
    </header>
  );
};

