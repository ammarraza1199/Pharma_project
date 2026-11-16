import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import api from '../utils/api';
import { updateStoreSettings, navigateTo, logoutUser, setPharmacists } from '../store/posSlice';
import {
  Settings, Store, Printer, Lock, ShieldCheck, Crown, Users,
  UserCheck, LogOut, CheckCircle2, Save, KeyRound, Monitor, Cpu, Laptop,
  Eye, EyeOff, RotateCcw, FileText, AlertTriangle, Check, ArrowRight,
  Clock, ShieldAlert, Sparkles, SlidersHorizontal, RefreshCw, Layers,
  Receipt, Volume2, Barcode, Calendar, AlertOctagon, HelpCircle
} from 'lucide-react';

export type SettingsSubTab = 'STORE_PROFILE' | 'THERMAL_PRINTER' | 'STAFF_ROLES' | 'SECURITY_PINS' | 'EXPIRY_RULES';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.pos.settings);
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<SettingsSubTab>('STORE_PROFILE');

  // 1. Store Related Details
  const [storeName, setStoreName] = useState<string>(settings.storeName || 'GENQUANTAA MEDPLUS PHARMACY');
  const [dlNo, setDlNo] = useState<string>(settings.dlNo || 'DL-2024/HYD/889201');
  const [gstin, setGstin] = useState<string>(settings.gstin || '36AAACG1234F1Z8');
  const [phone, setPhone] = useState<string>(settings.phone || '+91 98765 43210');
  const [address, setAddress] = useState<string>(settings.address || 'Plot 42, Innovation Corridor, Tech City, Hyderabad - 500081');
  const [defaultTaxType, setDefaultTaxType] = useState<'CGST_SGST' | 'IGST'>(settings.defaultTaxType || 'CGST_SGST');
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    settings.termsAndConditions || '1. Goods once sold will not be taken back without original tax receipt. 2. Please check expiry before leaving counter.'
  );

  // 2. Security PINs of Manager & Owner Info
  const [managerPin, setManagerPin] = useState<string>('');
  const [currentManagerPin, setCurrentManagerPin] = useState<string>('');
  const [managerName, setManagerName] = useState<string>(settings.managerName || 'Rajesh Verma');
  const [managerEmail, setManagerEmail] = useState<string>(settings.managerEmail || 'rajesh.verma@genquantaa.com');
  const [ownerPin, setOwnerPin] = useState<string>('');
  const [currentOwnerPin, setCurrentOwnerPin] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>(settings.ownerName || 'Dr. K. V. Rao');
  const [ownerEmail, setOwnerEmail] = useState<string>(settings.ownerEmail || 'kvrao@genquantaa.com');
  const [showPins, setShowPins] = useState<boolean>(false);
  const [settingsError, setSettingsError] = useState<string>('');

  // 3. Thermal Printer, Expiry & Hardware Details
  const [defaultPrintFormat, setDefaultPrintFormat] = useState<'THERMAL' | 'A4'>(settings.defaultPrintFormat || 'THERMAL');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(settings.autoPrintReceipt ?? true);
  const [soundEffects, setSoundEffects] = useState<boolean>(settings.soundEffects ?? true);
  const [autoAddOnScan, setAutoAddOnScan] = useState<boolean>(settings.autoAddOnScan ?? true);
  const [cashDrawerKick, setCashDrawerKick] = useState<boolean>(true);

  // 4. Expiry & Inventory Rules
  const [nearExpiryDaysThreshold, setNearExpiryDaysThreshold] = useState<number>(settings.nearExpiryDaysThreshold || 30);
  const [dumpStockDaysThreshold, setDumpStockDaysThreshold] = useState<number>(60);
  const [strictFefoEnforcement, setStrictFefoEnforcement] = useState<boolean>(true);
  const [allowClearanceDiscounts, setAllowClearanceDiscounts] = useState<boolean>(true);
  const [autoReorderDaysThreshold, setAutoReorderDaysThreshold] = useState<number>(14);

  const [savedBanner, setSavedBanner] = useState<boolean>(false);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);

  // 5. Staff Management & RBAC States
  interface StaffUser {
    id?: string;
    _id?: string;
    pharmacistName: string;
    pharmacyName?: string;
    licenseNo?: string;
    email: string;
    role: 'PHARMACIST' | 'MANAGER' | 'OWNER' | 'EMERGENCY_DESK';
    isActive: boolean;
  }

  const userRole = (currentUser?.role || 'PHARMACIST').toUpperCase();
  const isOwner = userRole === 'OWNER';
  const isManager = userRole === 'MANAGER' || isOwner;

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);
  const [staffError, setStaffError] = useState<string>('');
  const [staffSuccess, setStaffSuccess] = useState<string>('');

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await api.get('/auth/users');
      if (res.data.success && Array.isArray(res.data.data)) {
        setStaffList(res.data.data);
        const activeStaff = res.data.data.filter((u: StaffUser) => u.isActive);
        if (activeStaff.length > 0) {
          const colors = ['emerald', 'blue', 'purple', 'amber', 'teal', 'rose'];
          const mappedPharmacists = activeStaff.map((u: StaffUser, idx: number) => {
            const initials = u.pharmacistName
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'PH';
            return {
              id: u.id || u._id || `pharm-${idx + 1}`,
              name: u.pharmacistName,
              role: u.role === 'OWNER' ? 'Owner / Chief' : u.role === 'MANAGER' ? 'Pharmacy Manager' : u.role === 'EMERGENCY_DESK' ? 'Emergency Desk' : 'Staff Pharmacist',
              counterNumber: idx + 1,
              colorTheme: colors[idx % colors.length],
              avatarInitials: initials,
            };
          });
          dispatch(setPharmacists(mappedPharmacists));
        }
      }
    } catch (err: any) {
      console.warn('[SettingsPage] Could not load staff list:', err.response?.data?.message || err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setStaffError('');
    setStaffSuccess('');
    try {
      const res = await api.put(`/auth/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        setStaffSuccess(`Role successfully updated to ${newRole}`);
        setStaffList(prev => prev.map(u => (u.id === userId || u._id === userId ? { ...u, role: newRole as any } : u)));
        setTimeout(() => setStaffSuccess(''), 4000);
      }
    } catch (err: any) {
      setStaffError(err.response?.data?.message || 'Failed to update user role.');
      setTimeout(() => setStaffError(''), 5000);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setStaffError('');
    setStaffSuccess('');
    try {
      const newStatus = !currentStatus;
      const res = await api.put(`/auth/users/${userId}/status`, { isActive: newStatus });
      if (res.data.success) {
        setStaffSuccess(`User account ${newStatus ? 'activated' : 'deactivated'} successfully.`);
        setStaffList(prev => prev.map(u => (u.id === userId || u._id === userId ? { ...u, isActive: newStatus } : u)));
        setTimeout(() => setStaffSuccess(''), 4000);
      }
    } catch (err: any) {
      setStaffError(err.response?.data?.message || 'Failed to update account status.');
      setTimeout(() => setStaffError(''), 5000);
    }
  };

  // ── Load settings & staff from DB on mount ──────────────────────────────────────
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success && res.data.data) {
          const s = res.data.data;
          if (s.storeName)              setStoreName(s.storeName);
          if (s.dlNo)                   setDlNo(s.dlNo);
          if (s.gstin)                  setGstin(s.gstin);
          if (s.phone)                  setPhone(s.phone);
          if (s.address)                setAddress(s.address);
          if (s.defaultTaxType)         setDefaultTaxType(s.defaultTaxType);
          if (s.termsAndConditions)     setTermsAndConditions(s.termsAndConditions);
          if (s.managerName)            setManagerName(s.managerName);
          if (s.managerEmail)           setManagerEmail(s.managerEmail);
          if (s.ownerName)              setOwnerName(s.ownerName);
          if (s.ownerEmail)             setOwnerEmail(s.ownerEmail);
          if (s.defaultPrintFormat)     setDefaultPrintFormat(s.defaultPrintFormat);
          if (s.autoPrintReceipt !== undefined) setAutoPrintReceipt(s.autoPrintReceipt);
          if (s.soundEffects !== undefined)     setSoundEffects(s.soundEffects);
          if (s.autoAddOnScan !== undefined)    setAutoAddOnScan(s.autoAddOnScan);
          if (s.nearExpiryDaysThreshold)        setNearExpiryDaysThreshold(s.nearExpiryDaysThreshold);
        }
      } catch (err) {
        console.error('[SettingsPage] Failed to load settings from DB:', err);
      } finally {
        setSettingsLoading(false);
      }
    };
    loadSettings();
    if (isManager) {
      fetchStaff();
    }
  }, []);

  const activeEmail = currentUser?.email || 'navyasri@genquantaa.com';
  const activePharmacistName = currentUser?.pharmacistName || 'Navya Sri';
  const activePharmacyName = currentUser?.pharmacyName || storeName;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');

    try {
      // 1. Update general settings
      const settingsPayload = {
        storeName, dlNo, gstin, phone, address, defaultTaxType, termsAndConditions,
        defaultPrintFormat, autoPrintReceipt, soundEffects, autoAddOnScan, nearExpiryDaysThreshold,
        managerName, managerEmail, ownerName, ownerEmail
      };
      
      const res = await api.put('/settings', settingsPayload);
      
      if (res.data.success) {
        dispatch(updateStoreSettings(settingsPayload));
      }

      // 2. Update PINs if provided
      if (managerPin || ownerPin) {
        const pinPayload: any = {};
        if (managerPin) {
          pinPayload.currentManagerPin = currentManagerPin;
          pinPayload.newManagerPin = managerPin;
        }
        if (ownerPin) {
          pinPayload.currentOwnerPin = currentOwnerPin;
          pinPayload.newOwnerPin = ownerPin;
        }
        
        await api.put('/settings/pins', pinPayload);
        setManagerPin('');
        setCurrentManagerPin('');
        setOwnerPin('');
        setCurrentOwnerPin('');
      }

      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3500);
    } catch (err: any) {
      console.error(err);
      setSettingsError(err.response?.data?.message || 'Failed to save settings.');
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to restore default pharmacy settings?')) {
      setStoreName('GENQUANTAA MEDPLUS PHARMACY');
      setDlNo('DL-2024/HYD/889201');
      setGstin('36AAACG1234F1Z8');
      setPhone('+91 98765 43210');
      setAddress('Plot 42, Innovation Corridor, Tech City, Hyderabad - 500081');
      setDefaultTaxType('CGST_SGST');
      setTermsAndConditions('1. Goods once sold will not be taken back without original tax receipt. 2. Please check expiry before leaving counter.');
      setManagerPin('1234');
      setManagerName('Rajesh Verma');
      setManagerEmail('rajesh.verma@genquantaa.com');
      setOwnerPin('1234');
      setOwnerName('Dr. K. V. Rao');
      setOwnerEmail('kvrao@genquantaa.com');
      setDefaultPrintFormat('THERMAL');
      setAutoPrintReceipt(true);
      setSoundEffects(true);
      setAutoAddOnScan(true);
      setNearExpiryDaysThreshold(30);
      setDumpStockDaysThreshold(60);
      setStrictFefoEnforcement(true);
      setAllowClearanceDiscounts(true);
    }
  };

  const handleTestPrint = () => {
    window.print();
  };

  const SUB_TABS = [
    {
      id: 'STORE_PROFILE' as const,
      label: 'Store Profile',
      icon: Store,
      badge: 'Core',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Store Name, DL No, GSTIN & Tax Mode'
    },
    {
      id: 'THERMAL_PRINTER' as const,
      label: 'Thermal Printer & Hardware',
      icon: Printer,
      badge: defaultPrintFormat,
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      description: '80mm Roll, Barcode HID & Sounds'
    },
    {
      id: 'STAFF_ROLES' as const,
      label: 'Staff Roles & Pharmacists',
      icon: Users,
      badge: `${staffList.length || 3} Staff`,
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      description: 'RBAC Access Levels & Active Sessions'
    },
    {
      id: 'SECURITY_PINS' as const,
      label: 'Security PINs',
      icon: Lock,
      badge: 'Protected',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      description: 'Manager (Schedule X) & Owner Interlocks'
    },
    {
      id: 'EXPIRY_RULES' as const,
      label: 'Expiry & Inventory Rules',
      icon: AlertTriangle,
      badge: `${nearExpiryDaysThreshold}d Window`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'FEFO Thresholds & Dump Stock Rules'
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4 font-sans select-none pb-16">

      {/* ── TOP PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
            <Settings className="w-6 h-6 text-emerald-200 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
              <span>Pharmacy Store Settings &amp; Hardware Configuration</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Organized configuration center: Store profile, Thermal printers, Staff RBAC, Security PINs &amp; Expiry rules
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
        >
          <Store className="w-4 h-4" />
          <span>Go to Billing Terminal</span>
        </button>
      </div>

      {/* ── SUB-TAB NAVIGATION SEGMENTED BAR (Day 4 Core Feature) ───── */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-left transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-extrabold truncate ${isActive ? 'text-emerald-950 font-heading' : 'text-slate-800'}`}>
                      {tab.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {tab.description}
                  </p>
                </div>
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SUCCESS NOTIFICATION BANNER ────────────────────────────── */}
      {savedBanner && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center space-x-2.5 text-xs font-bold animate-fadeIn border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>Pharmacy Store Profile, Thermal Printer, Staff Roles, PINs &amp; Expiry Configurations Saved Successfully!</span>
        </div>
      )}

      {/* ── ERROR NOTIFICATION BANNER ──────────────────────────────── */}
      {settingsError && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-3.5 rounded-2xl shadow-sm flex items-center space-x-2.5 text-xs font-bold animate-fadeIn">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{settingsError}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-4">

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── SUB-TAB 1: STORE PROFILE ──────────────────────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'STORE_PROFILE' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    1. Pharmacy Legal Identity, Drug Licenses &amp; Government Tax Setup
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Details printed on all customer tax receipts, retail bills, and official GST compliance journals
                  </p>
                </div>
              </div>

              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                Official Bill Header
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Pharmacy / Store Legal Trading Name *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  placeholder="e.g. GENQUANTAA MEDPLUS PHARMACY"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Drug License Number (DL No) *</label>
                <input
                  type="text"
                  required
                  value={dlNo}
                  onChange={e => setDlNo(e.target.value)}
                  placeholder="e.g. DL-2024/HYD/889201"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">GSTIN Number (15-Digit State Tax ID) *</label>
                <input
                  type="text"
                  required
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  placeholder="e.g. 36AAACG1234F1Z8"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Store Helpline / Customer Care Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Default Store GST Computation Mode *</label>
                <select
                  value={defaultTaxType}
                  onChange={e => setDefaultTaxType(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CGST_SGST">Intra-State GST (CGST 50% + SGST 50%) — Recommended Standard</option>
                  <option value="IGST">Inter-State GST (IGST 100% Integrated Tax)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Full Physical Store Address (Prints on Receipt Header) *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Plot 42, Innovation Corridor, Tech City, Hyderabad - 500081"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900 bg-slate-50/50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 mb-1">Tax Invoice Footer Terms &amp; Medicine Return Policy</label>
                <textarea
                  rows={2}
                  value={termsAndConditions}
                  onChange={e => setTermsAndConditions(e.target.value)}
                  placeholder="Terms printed at the bottom of customer receipts..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 font-medium bg-slate-50/50"
                />
              </div>
            </div>

            {/* Live Receipt Header Preview Strip */}
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                Receipt Header Live Preview:
              </span>
              <div className="text-center font-mono text-xs text-slate-700 space-y-0.5">
                <p className="font-extrabold text-slate-900 text-sm">{storeName}</p>
                <p className="text-[11px] text-slate-600">{address}</p>
                <p className="text-[10px] text-slate-500">DL: {dlNo} • GSTIN: {gstin} • Ph: {phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── SUB-TAB 2: THERMAL PRINTER & HARDWARE ─────────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'THERMAL_PRINTER' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    2. Thermal POS Printer, Barcode Scanners &amp; Hardware Peripherals
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Configure 80mm ESC/POS roll printing, HID USB/Bluetooth barcode readers, and checkout audio alerts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestPrint}
                className="flex items-center space-x-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Trigger browser print dialog to test physical printer roll"
              >
                <Receipt className="w-4 h-4 text-teal-700" />
                <span>Test Printer Roll</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-slate-900">
                  <Printer className="w-4 h-4 text-teal-600" />
                  <span className="font-extrabold text-xs">Default Receipt Paper Format</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Choose format automatically loaded when pressing Print or finalizing checkout:
                </p>
                <select
                  value={defaultPrintFormat}
                  onChange={e => setDefaultPrintFormat(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                >
                  <option value="THERMAL">🖨️ 80mm ESC/POS Thermal Receipt Roll (Standard High-Speed POS)</option>
                  <option value="A4">📄 A4 Full-Size Laser / Inkjet GST Tax Invoice</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-slate-900">
                  <Barcode className="w-4 h-4 text-teal-600" />
                  <span className="font-extrabold text-xs">HID Barcode Scanner Behavior</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  USB / Bluetooth handheld barcode scanner (F2 / HID wedge) automation rules:
                </p>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAddOnScan}
                      onChange={e => setAutoAddOnScan(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">Auto-add scanned medicine directly to active cart</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundEffects}
                      onChange={e => setSoundEffects(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">Play audio chime on successful barcode scan</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-slate-900">
                  <Receipt className="w-4 h-4 text-teal-600" />
                  <span className="font-extrabold text-xs">Print Dialog Automation</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Automatically show thermal printer dialog when customer payment is verified:
                </p>
                <label className="flex items-center space-x-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={autoPrintReceipt}
                    onChange={e => setAutoPrintReceipt(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">Auto-open print dialog upon confirming customer payment</span>
                </label>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-slate-900">
                  <Cpu className="w-4 h-4 text-teal-600" />
                  <span className="font-extrabold text-xs">Cash Drawer &amp; Peripherals</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  RJ11 cash drawer trigger pulse on cash payment finalization:
                </p>
                <label className="flex items-center space-x-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={cashDrawerKick}
                    onChange={e => setCashDrawerKick(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">Send RJ11 cash drawer kick pulse on CASH payment</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── SUB-TAB 3: STAFF ROLES & PHARMACISTS ──────────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'STAFF_ROLES' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    3. Staff Roster, Terminal Counters &amp; Role-Based Access Control (RBAC)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Authorized pharmacy personnel, multi-counter assignments, and permission tiers
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
                {staffList.length || 3} Registered Pharmacists
              </span>
            </div>

            {staffSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{staffSuccess}</span>
              </div>
            )}

            {staffError && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            {/* Role Hierarchy Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-900 font-extrabold">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>Store Owner</span>
                </div>
                <p className="text-[10px] text-amber-800 leading-snug">
                  Full store authority, financial reports, user role reassignments, and Contraindicated PIN bypass.
                </p>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-rose-900 font-extrabold">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span>Pharmacy Manager</span>
                </div>
                <p className="text-[10px] text-rose-800 leading-snug">
                  Inventory editing, purchase orders, returns approval, and Schedule X narcotic PIN authority.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-900 font-extrabold">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Staff Pharmacist</span>
                </div>
                <p className="text-[10px] text-emerald-800 leading-snug">
                  Multi-customer billing, drug dispensing, substitute suggestions, and customer register.
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-blue-900 font-extrabold">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Emergency Desk</span>
                </div>
                <p className="text-[10px] text-blue-800 leading-snug">
                  Fast emergency drug protocols, 108 ambulance coordination, and life-critical dispatch.
                </p>
              </div>
            </div>

            {/* Interactive Staff Roster Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Staff Pharmacist</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Account Status</th>
                    {isOwner && <th className="p-3 text-right">Owner Control</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((user) => {
                    const uId = user.id || user._id || '';
                    const isSelf = currentUser?.email?.toLowerCase() === user.email?.toLowerCase();
                    return (
                      <tr key={uId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{user.pharmacistName}</div>
                          {user.licenseNo && <div className="text-[10px] text-slate-400">DL: {user.licenseNo}</div>}
                        </td>
                        <td className="p-3 font-mono text-slate-600">{user.email}</td>
                        <td className="p-3">
                          {isOwner && !isSelf ? (
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateRole(uId, e.target.value)}
                              className="p-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 cursor-pointer shadow-2xs"
                            >
                              <option value="PHARMACIST">Staff Pharmacist</option>
                              <option value="MANAGER">Pharmacy Manager</option>
                              <option value="OWNER">Store Owner</option>
                              <option value="EMERGENCY_DESK">Emergency Desk</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              user.role === 'OWNER' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                              user.role === 'EMERGENCY_DESK' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            <span>{user.isActive ? 'Active' : 'Suspended'}</span>
                          </span>
                        </td>
                        {isOwner && (
                          <td className="p-3 text-right">
                            {isSelf ? (
                              <span className="text-[10px] font-semibold text-slate-400 italic">Current Session</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(uId, user.isActive)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border ${
                                  user.isActive
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Active User Session Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {activePharmacistName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs text-slate-900">{activePharmacistName}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-300">
                      Logged In
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{activeEmail} • Store: {activePharmacyName}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dispatch(logoutUser())}
                className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── SUB-TAB 4: SECURITY PINS ──────────────────────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'SECURITY_PINS' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    4. Security PINs, Regulatory Narcotic Overrides &amp; Owner Authorizations
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Strict 4-digit PIN verification for controlled Schedule X narcotics and contraindicated drug overrides
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPins(!showPins)}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPins ? 'Hide Security PINs' : 'Show Security PINs'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              {/* Store Manager PIN & Credentials Box */}
              <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-rose-800">
                  <ShieldCheck className="w-4 h-4 text-rose-600" />
                  <span className="font-extrabold uppercase text-xs">Store Manager PIN &amp; Credentials</span>
                </div>
                <p className="text-[11px] text-rose-900 font-medium leading-relaxed">
                  Mandatory 4-digit PIN required <strong>every time</strong> a <strong>Schedule X or Narcotic drug</strong> is dispensed to comply with statutory CDSCO rules.
                </p>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-slate-700 mb-1 text-[11px]">Manager Name *</label>
                    <input
                      type="text"
                      required
                      value={managerName}
                      onChange={e => setManagerName(e.target.value)}
                      placeholder="e.g. Rajesh Verma"
                      className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 text-[11px]">Manager Email *</label>
                    <input
                      type="email"
                      required
                      value={managerEmail}
                      onChange={e => setManagerEmail(e.target.value)}
                      placeholder="e.g. rajesh.verma@genquantaa.com"
                      className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-slate-700 mb-1 text-[11px]">Current PIN</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        maxLength={4}
                        value={currentManagerPin}
                        onChange={e => setCurrentManagerPin(e.target.value)}
                        placeholder="Required to change"
                        className="w-full text-center text-sm font-black tracking-widest p-2 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-rose-950"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 text-[11px]">New PIN</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        maxLength={4}
                        value={managerPin}
                        onChange={e => setManagerPin(e.target.value)}
                        placeholder="Leave blank to keep"
                        className="w-full text-center text-sm font-black tracking-widest p-2 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-rose-950"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Owner PIN & Info Box */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-amber-900">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span className="font-extrabold uppercase text-xs">Store Owner PIN &amp; Credentials</span>
                </div>
                <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                  High-priority PIN required to override <strong>Contraindicated Drug Pair Interlocks</strong> (e.g. critical AI drug interaction alerts).
                </p>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-slate-700 mb-1 text-[11px]">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      placeholder="e.g. Dr. K. V. Rao"
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 text-[11px]">Owner Email *</label>
                    <input
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={e => setOwnerEmail(e.target.value)}
                      placeholder="e.g. kvrao@genquantaa.com"
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-slate-700 mb-1 text-[11px]">Current PIN</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        maxLength={4}
                        value={currentOwnerPin}
                        onChange={e => setCurrentOwnerPin(e.target.value)}
                        placeholder="Required to change"
                        className="w-full text-center text-sm font-black tracking-widest p-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-amber-950"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 text-[11px]">New PIN</label>
                      <input
                        type={showPins ? 'text' : 'password'}
                        maxLength={4}
                        value={ownerPin}
                        onChange={e => setOwnerPin(e.target.value)}
                        placeholder="Leave blank to keep"
                        className="w-full text-center text-sm font-black tracking-widest p-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-amber-950"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── SUB-TAB 5: EXPIRY & INVENTORY RULES ───────────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {activeTab === 'EXPIRY_RULES' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    5. Expiry Window, FEFO Auto-Selection &amp; Dump Stock Safeguards
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Automated FEFO (First-Expiry-First-Out) dispensing rules and near-expiry clearance alarms
                  </p>
                </div>
              </div>

              <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                FEFO Compliance Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-slate-900">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="font-extrabold text-xs">Near-Expiry Warning Window</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Medicines reaching this window are highlighted in yellow on search and billing:
                </p>
                <select
                  value={nearExpiryDaysThreshold}
                  onChange={e => setNearExpiryDaysThreshold(parseInt(e.target.value) || 30)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                >
                  <option value={30}>⚠️ 30 Days Before Expiry (Recommended Standard)</option>
                  <option value={60}>⚠️ 60 Days Before Expiry (Early Warning Window)</option>
                  <option value={90}>⚠️ 90 Days Before Expiry (Quarterly Audit Window)</option>
                </select>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-slate-900">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span className="font-extrabold text-xs">Dump Stock Liquidation Threshold</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Batches with fewer days than this are flagged as high-risk dump stock candidates:
                </p>
                <select
                  value={dumpStockDaysThreshold}
                  onChange={e => setDumpStockDaysThreshold(parseInt(e.target.value) || 60)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                >
                  <option value={45}>🔴 &lt; 45 Days (Aggressive liquidation)</option>
                  <option value={60}>🔴 &lt; 60 Days (Standard pharmacy safety band)</option>
                  <option value={90}>🔴 &lt; 90 Days (Conservative distributor return)</option>
                </select>
              </div>

              <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-xs">Automated Dispensing Safeguards &amp; Clearance Policies</span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strictFefoEnforcement}
                      onChange={e => setStrictFefoEnforcement(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">Strict FEFO (First-Expiry-First-Out) Auto-Selection</span>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Always automatically default to dispensing the earliest-expiring active batch first to prevent inventory write-offs.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowClearanceDiscounts}
                      onChange={e => setAllowClearanceDiscounts(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800">Allow 1-Click Near-Expiry Clearance Markdowns</span>
                      <p className="text-[10px] text-slate-500 font-normal">
                        Show clearance prompt on cart items with &lt;60 days shelf life allowing cashiers to apply promotional discount and move stock.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Visual Expiry Band Indicator */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-amber-50 to-rose-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block mb-2">
                Pharmacy Expiry Health Slabs:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-emerald-100/80 rounded-xl border border-emerald-300">
                  <div className="font-black text-emerald-950">&gt; 180 Days</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Fresh Stock (Full Runway)</div>
                </div>
                <div className="p-2 bg-blue-100/80 rounded-xl border border-blue-300">
                  <div className="font-black text-blue-950">90–180 Days</div>
                  <div className="text-[10px] text-blue-700 font-medium">Normal Active Rotation</div>
                </div>
                <div className="p-2 bg-amber-100/80 rounded-xl border border-amber-300">
                  <div className="font-black text-amber-950">30–90 Days</div>
                  <div className="text-[10px] text-amber-800 font-medium">Near-Expiry Warning</div>
                </div>
                <div className="p-2 bg-rose-100/80 rounded-xl border border-rose-300">
                  <div className="font-black text-rose-950">&lt; 30 Days</div>
                  <div className="text-[10px] text-rose-800 font-medium">Dump / Immediate Return</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* ── UNIVERSAL SAVE & RESET FOOTER BAR ─────────────────────── */}
        {/* ═════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between pt-3 flex-wrap gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Factory Defaults</span>
          </button>

          <button
            type="submit"
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-8 py-3.5 rounded-xl shadow-lg cursor-pointer active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save All Store &amp; Hardware Configurations</span>
          </button>
        </div>

      </form>

    </div>
  );
};

export default SettingsPage;
