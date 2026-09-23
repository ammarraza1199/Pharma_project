import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import api from '../utils/api';
import { updateStoreSettings, navigateTo, logoutUser, setPharmacists } from '../store/posSlice';
import {
  Settings, Store, Printer, Lock, ShieldCheck, Crown, Users,
  UserCheck, LogOut, CheckCircle2, Save, KeyRound, Monitor, Cpu, Laptop,
  Eye, EyeOff, RotateCcw, FileText, AlertTriangle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.pos.settings);
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);

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
  const [nearExpiryDaysThreshold, setNearExpiryDaysThreshold] = useState<number>(settings.nearExpiryDaysThreshold || 30);

  const [savedBanner, setSavedBanner] = useState<boolean>(false);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);

  // 4. Staff Management & RBAC States
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
      setTimeout(() => setSavedBanner(false), 3000);
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
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none pb-12">

      {/* ── TOP PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xs">
            <Settings className="w-6 h-6 text-emerald-400 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 font-heading tracking-tight">
              Pharmacy Store Settings &amp; Hardware Configuration
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage Store details, Manager/Owner PINs, Staff access roles, Login session info &amp; Thermal printers
            </p>
          </div>
        </div>

        <button
          onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
        >
          <Store className="w-4 h-4" />
          <span>Go to Billing Terminal</span>
        </button>
      </div>

      {/* ── SUCCESS NOTIFICATION BANNER ────────────────────────────── */}
      {savedBanner && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center space-x-2.5 text-xs font-bold animate-fadeIn border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>All Pharmacy Store Details, Manager &amp; Owner PINs, and Hardware Configurations Saved Successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-4">

        {/* ── SECTION 1: PHARMACY STORE RELATED DETAILS ──────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-200">
            <Store className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
                1. Pharmacy Store Related Details, Legal Licenses &amp; Tax Rules
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Printed on all customer tax receipts, invoices, and government GST compliance reports</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">Pharmacy / Store Legal Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="e.g. GENQUANTAA MEDPLUS PHARMACY"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-slate-900"
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
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">GSTIN Number (15-Digit Tax ID) *</label>
              <input
                type="text"
                required
                value={gstin}
                onChange={e => setGstin(e.target.value)}
                placeholder="e.g. 36AAACG1234F1Z8"
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Store Contact / Helpline Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Default Store GST Computation Mode *</label>
              <select
                value={defaultTaxType}
                onChange={e => setDefaultTaxType(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="CGST_SGST">Intra-State GST (CGST 50% + SGST 50%) - Default</option>
                <option value="IGST">Inter-State GST (IGST 100%)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Full Store Address (Prints on Top of Receipt) *</label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Plot 42, Innovation Corridor, Tech City, Hyderabad - 500081"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 mb-1">Tax Invoice Footer Terms &amp; Return Policy Text</label>
              <textarea
                rows={2}
                value={termsAndConditions}
                onChange={e => setTermsAndConditions(e.target.value)}
                placeholder="Terms printed at the bottom of customer receipts..."
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs text-slate-900 font-medium"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: SECURITY PINS OF MANAGER & OWNER INFO ────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
                  2. Security PINs of Manager &amp; Store Owner Info
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Security PIN interlocks for controlled Schedule X narcotics and contraindicated drug overrides</p>
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
            <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-rose-800">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span className="font-extrabold uppercase text-xs">Store Manager PIN &amp; Credentials</span>
              </div>
              <p className="text-[11px] text-rose-900 font-medium">
                Mandatory 4-digit PIN required <strong>every time</strong> a <strong>Schedule X or Narcotic drug</strong> is added to cart.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
                <div>
                  <label className="block text-slate-700 mb-1 text-[11px]">Current PIN</label>
                  <input
                    type={showPins ? 'text' : 'password'}
                    maxLength={4}
                    value={currentManagerPin}
                    onChange={e => setCurrentManagerPin(e.target.value)}
                    placeholder="Required to change"
                    className="w-full text-center text-sm font-black tracking-widest p-1.5 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-rose-950"
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
                    className="w-full text-center text-sm font-black tracking-widest p-1.5 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-rose-950"
                  />
                </div>
              </div>
            </div>

            {/* Store Owner PIN & Info Box */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-amber-900">
                <Crown className="w-4 h-4 text-amber-600" />
                <span className="font-extrabold uppercase text-xs">Store Owner PIN &amp; Credentials</span>
              </div>
              <p className="text-[11px] text-amber-900 font-medium">
                High-priority PIN required to override <strong>Contraindicated Drug Pair Interlocks</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
                <div>
                  <label className="block text-slate-700 mb-1 text-[11px]">Current PIN</label>
                  <input
                    type={showPins ? 'text' : 'password'}
                    maxLength={4}
                    value={currentOwnerPin}
                    onChange={e => setCurrentOwnerPin(e.target.value)}
                    placeholder="Required to change"
                    className="w-full text-center text-sm font-black tracking-widest p-1.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-amber-950"
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
                    className="w-full text-center text-sm font-black tracking-widest p-1.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-amber-950"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: STAFF ACCOUNTS & ACCESS ROLES ───────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-200">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
                3. Staff Accounts &amp; Access Roles
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Configured pharmacy personnel and their authorization access levels</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* Owner Role */}
            <div className="py-2.5 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{ownerName}</p>
                  <p className="text-[10px] text-slate-500">{ownerEmail}</p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                Store Owner (Full Control &amp; Contraindicated PIN)
              </span>
            </div>

            {/* Chief Pharmacist Role */}
            <div className="py-2.5 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{activePharmacistName}</p>
                  <p className="text-[10px] text-slate-500">{activeEmail}</p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                Chief Pharmacist (Admin &amp; Rx Signatures)
              </span>
            </div>

            {/* Store Manager Role */}
            <div className="py-2.5 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{managerName}</p>
                  <p className="text-[10px] text-slate-500">{managerEmail}</p>
                </div>
              </div>
              <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                Store Manager (Schedule X PIN Approver)
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: LOGIN INFO & ACTIVE SESSION DETAILS ─────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-200">
            <Laptop className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
                4. Login Info &amp; Active User Session Details
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Active logged-in pharmacist user account credentials and terminal session info</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Signed-In Account</span>
              <p className="font-extrabold text-slate-900 mt-0.5 truncate">{activeEmail}</p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">Status: Authenticated Active</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Pharmacy</span>
              <p className="font-extrabold text-slate-900 mt-0.5 truncate">{activePharmacyName}</p>
              <p className="text-[11px] text-slate-500 mt-1">License: {dlNo}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Account Action</span>
                <p className="text-[11px] text-slate-500 mt-0.5">End active billing session and lock terminal</p>
              </div>
              <button
                type="button"
                onClick={() => dispatch(logoutUser())}
                className="mt-2 w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── SECTION 5: PRINTER, BARCODE & EXPIRY THRESHOLD SETTINGS ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-200">
            <Printer className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
                5. Hardware, Barcode Scan &amp; Expiry Alarm Thresholds
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">ESC/POS thermal roll print options, HID scanner auto-add behavior, and inventory alert windows</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">Default Receipt Print Layout</label>
              <select
                value={defaultPrintFormat}
                onChange={e => setDefaultPrintFormat(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
              >
                <option value="THERMAL">🖨️ 80mm ESC/POS Thermal Receipt Roll (High-Speed POS Roll)</option>
                <option value="A4">📄 A4 Full-Size GST Tax Invoice Layout</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Near Expiry Warning Alert Window (Days)</label>
              <select
                value={nearExpiryDaysThreshold}
                onChange={e => setNearExpiryDaysThreshold(parseInt(e.target.value) || 30)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
              >
                <option value={30}>⚠️ 30 Days Before Expiry (Recommended Standard)</option>
                <option value={60}>⚠️ 60 Days Before Expiry (Early Warning)</option>
                <option value={90}>⚠️ 90 Days Before Expiry (Quarterly Warning)</option>
              </select>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-4 pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={e => setAutoPrintReceipt(e.target.checked)}
                  className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Auto-open print dialog upon confirming customer payment</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEffects}
                  onChange={e => setSoundEffects(e.target.checked)}
                  className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Play audio chime on successful HID barcode scan</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAddOnScan}
                  onChange={e => setAutoAddOnScan(e.target.checked)}
                  className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Auto-add scanned barcode item directly to active cart</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── SECTION 6: STAFF ROSTER & ROLE-BASED ACCESS CONTROL (RBAC) ── */}
        {isManager && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
                    6. Staff Roster &amp; Role-Based Access Control (RBAC)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isOwner ? 'Assign permissions and activate/deactivate pharmacy staff accounts' : 'Authorized pharmacy staff roster and assigned terminal roles'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                {staffList.length} Registered Staff
              </span>
            </div>

            {staffSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{staffSuccess}</span>
              </div>
            )}

            {staffError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            {staffLoading ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">Loading staff roster...</div>
            ) : staffList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No staff members registered in database yet.</div>
            ) : (
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
            )}
          </div>
        )}

        {/* ── SAVE & RESET ACTION BUTTONS ─────────────────────────────── */}
        <div className="flex items-center justify-between pt-3 flex-wrap gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-3 rounded-xl transition-all cursor-pointer"
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
