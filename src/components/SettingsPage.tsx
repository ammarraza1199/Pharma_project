import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { updateStoreSettings, navigateTo } from '../store/posSlice';
import {
  Settings, Store, Printer, Lock, Users, CheckCircle2,
  Save
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.pos.settings);

  // Form States
  const [storeName, setStoreName] = useState<string>(settings.storeName);
  const [dlNo, setDlNo] = useState<string>(settings.dlNo);
  const [gstin, setGstin] = useState<string>(settings.gstin);
  const [phone, setPhone] = useState<string>(settings.phone);
  const [address, setAddress] = useState<string>(settings.address);
  const [defaultPrintFormat, setDefaultPrintFormat] = useState<'THERMAL' | 'A4'>(settings.defaultPrintFormat);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(settings.autoPrintReceipt);
  const [soundEffects, setSoundEffects] = useState<boolean>(settings.soundEffects);
  const [managerPin, setManagerPin] = useState<string>(settings.managerPin);

  const [savedBanner, setSavedBanner] = useState<boolean>(false);

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
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Settings className="w-6 h-6 text-slate-700" />
            <span>Store Profile &amp; Hardware Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure Pharmacy credentials, Drug Licenses, Thermal Printer hardware &amp; Security PIN settings
          </p>
        </div>

        <button
          onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer"
        >
          <Store className="w-4 h-4" />
          <span>Go to POS Billing Terminal</span>
        </button>
      </div>

      {/* ── SUCCESS BANNER ─────────────────────────────────────────── */}
      {savedBanner && (
        <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md flex items-center space-x-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>Pharmacy Store Settings &amp; Manager PIN Updated Successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-4">

        {/* ── SECTION 1: PHARMACY PROFILE & LEGAL CREDENTIALS ────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Store className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
              1. Pharmacy Store Profile &amp; Drug Licenses
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">Pharmacy / Store Legal Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Drug License Number (DL No) *</label>
              <input
                type="text"
                required
                value={dlNo}
                onChange={e => setDlNo(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">GSTIN Number *</label>
              <input
                type="text"
                required
                value={gstin}
                onChange={e => setGstin(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1">Store Helpline Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 mb-1">Full Store Address (Prints on Tax Invoices) *</label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: HARDWARE & PRINTER CONFIGURATION ─────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
              2. Thermal Printer &amp; Invoice Hardware Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">Default Receipt Print Layout</label>
              <select
                value={defaultPrintFormat}
                onChange={e => setDefaultPrintFormat(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold"
              >
                <option value="THERMAL">80mm ESC/POS Thermal Receipt (Compact Roll)</option>
                <option value="A4">A4 Full-Size GST Tax Invoice</option>
              </select>
            </div>

            <div className="flex flex-col justify-center space-y-2 pt-2">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={e => setAutoPrintReceipt(e.target.checked)}
                  className="rounded text-emerald-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">Auto-open print dialog on payment completion</span>
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
        </div>

        {/* ── SECTION 3: SECURITY & MANAGER PIN SETTINGS ─────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Lock className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
              3. Security &amp; Store Manager Authorization PIN
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 mb-1">4-Digit Store Manager Security PIN *</label>
              <input
                type="text"
                maxLength={4}
                required
                value={managerPin}
                onChange={e => setManagerPin(e.target.value)}
                className="w-full text-center text-lg font-black tracking-widest p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1 font-normal">
                Used for Schedule X Narcotic unlocks, contraindication overrides, and stock disposal approval.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: STAFF ROLES & PERMISSIONS ────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
            <Users className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-extrabold text-slate-900 font-heading uppercase tracking-wider">
              4. Staff Accounts &amp; Access Roles
            </h3>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">{currentUser?.pharmacistName || 'Pharmacist'}</p>
                <p className="text-[10px] text-slate-500">navyasri@genquantaa.com</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Chief Pharmacist (Admin)
              </span>
            </div>

            <div className="py-2 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">Rajesh Verma</p>
                <p className="text-[10px] text-slate-500">rajesh@genquantaa.com</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Store Manager (PIN Approver)
              </span>
            </div>
          </div>
        </div>

        {/* ── SAVE ACTION BUTTON ─────────────────────────────────────── */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save All Store &amp; Hardware Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
};
