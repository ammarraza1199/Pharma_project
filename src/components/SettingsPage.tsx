import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { updateStoreSettings, navigateTo, logoutUser } from '../store/posSlice';
import {
  Settings, Store, Printer, Lock, ShieldCheck, Crown, Users,
  UserCheck, LogOut, CheckCircle2, Save, KeyRound, Monitor, Cpu, Laptop
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

  // 2. Security PINs of Manager & Owner Info
  const [managerPin, setManagerPin] = useState<string>(settings.managerPin || '1234');
  const [ownerPin, setOwnerPin] = useState<string>('1234');
  const [ownerName, setOwnerName] = useState<string>('Navya Sri (Store Owner)');
  const [ownerEmail, setOwnerEmail] = useState<string>('navyasri@genquantaa.com');

  // 3. Thermal Printer & Hardware Details
  const [defaultPrintFormat, setDefaultPrintFormat] = useState<'THERMAL' | 'A4'>(settings.defaultPrintFormat || 'THERMAL');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(settings.autoPrintReceipt ?? true);
  const [soundEffects, setSoundEffects] = useState<boolean>(settings.soundEffects ?? true);

  const [savedBanner, setSavedBanner] = useState<boolean>(false);

  const activeEmail = currentUser?.email || 'navyasri@genquantaa.com';
  const activePharmacistName = currentUser?.pharmacistName || 'Navya Sri';
  const activePharmacyName = currentUser?.pharmacyName || storeName;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch(updateStoreSettings({
      storeName,
      dlNo,
      gstin,
      phone,
      address,
      defaultPrintFormat,
      autoPrintReceipt,
      soundEffects,
      managerPin
    }));

    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
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
                1. Pharmacy Store Related Details &amp; Legal Licenses
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

            <div className="md:col-span-2">
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
          </div>
        </div>

        {/* ── SECTION 2: SECURITY PINS OF MANAGER & OWNER INFO ────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-200">
            <Lock className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
                2. Security PINs of Manager &amp; Store Owner Info
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Security PIN interlocks for controlled Schedule X narcotics and contraindicated drug overrides</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            {/* Store Manager PIN Box */}
            <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-rose-800">
                <KeyRound className="w-4 h-4 text-rose-600" />
                <span className="font-extrabold uppercase text-xs">Store Manager Security PIN</span>
              </div>
              <p className="text-[11px] text-rose-900 font-medium">
                Mandatory 4-digit PIN required <strong>every time</strong> a <strong>Schedule X or Narcotic drug</strong> is added to cart.
              </p>
              <div>
                <label className="block text-slate-700 mb-1 text-[11px]">4-Digit Manager PIN *</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={managerPin}
                  onChange={e => setManagerPin(e.target.value)}
                  className="w-full text-center text-lg font-black tracking-widest p-2 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-rose-950"
                />
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 text-[11px]">Owner Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 text-[11px]">4-Digit Owner PIN *</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={ownerPin}
                    onChange={e => setOwnerPin(e.target.value)}
                    className="w-full text-center text-lg font-black tracking-widest p-1.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-amber-950"
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
                  <p className="font-bold text-slate-900">Rajesh Verma</p>
                  <p className="text-[10px] text-slate-500">rajesh.verma@genquantaa.com</p>
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

        {/* ── SECTION 5: THERMAL PRINTER HARDWARE DETAILS ─────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-200">
            <Printer className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
                5. Thermal Printer Hardware &amp; Invoice Printing Details
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">ESC/POS thermal roll print settings, A4 GST tax invoice options, and audio chimes</p>
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

            <div className="flex flex-col justify-center space-y-2.5 pt-1">
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
            </div>
          </div>
        </div>

        {/* ── SAVE ACTION BUTTON ─────────────────────────────────────── */}
        <div className="flex justify-end pt-3">
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
