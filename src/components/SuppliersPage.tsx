import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { addSupplier, navigateTo } from '../store/posSlice';
import {
  Building, Search, Plus, Truck,
  DollarSign, X, ShieldCheck
} from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const dispatch = useDispatch();
  const suppliers = useSelector((state: RootState) => state.pos.suppliers);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gstin, setGstin] = useState<string>('36AAACM8890A1Z2');
  const [dlNumber, setDlNumber] = useState<string>('DL-1005/HYD');
  const [address, setAddress] = useState<string>('Pharma City, Hyderabad');
  const [pendingBalance] = useState<number>(0);

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(t) || s.contactPerson.toLowerCase().includes(t) || s.gstin.toLowerCase().includes(t) || s.phone.includes(t);
  });

  const totalSuppliers = suppliers.length;
  const totalPendingDues = suppliers.reduce((sum, s) => sum + s.pendingBalance, 0);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();

    dispatch(addSupplier({
      name,
      contactPerson,
      phone,
      email,
      gstin,
      dlNumber,
      address,
      pendingBalance
    }));

    setShowAddModal(false);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Building className="w-6 h-6 text-emerald-700" />
            <span>Supplier &amp; Vendor Management Directory</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage authorized pharmaceutical distributors, Drug Licenses, GSTIN &amp; accounts payable
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Vendor</span>
        </button>
      </div>

      {/* ── KPI METRICS CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Vendors</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{totalSuppliers} Distributors</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pending Dues</p>
            <h3 className="text-xl font-black text-amber-800 font-heading">₹{totalPendingDues.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GSTIN &amp; DL Verified</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">100% Compliant</h3>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Supplier Name, Contact Person, GSTIN, or DL Number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* ── SUPPLIERS DIRECTORY TABLE ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
          <span>Supplier Directory ({filteredSuppliers.length})</span>
          <span className="text-slate-400">Click "+ Purchase" to enter stock GRN for a supplier</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '850px' }}>
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">Vendor Name &amp; DL</th>
                <th className="px-3 py-3">Contact Person &amp; Phone</th>
                <th className="px-3 py-3">Email &amp; Address</th>
                <th className="px-3 py-3 text-center">GSTIN</th>
                <th className="px-4 py-3 text-right">Pending Payable Dues</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No suppliers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(sup => (
                  <tr key={sup.supplierId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div>{sup.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">DL No: {sup.dlNumber}</div>
                    </td>

                    <td className="px-3 py-3 font-semibold text-slate-800">
                      <div>{sup.contactPerson}</div>
                      <div className="text-[10px] text-slate-500">{sup.phone}</div>
                    </td>

                    <td className="px-3 py-3 text-slate-600">
                      <div>{sup.email}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{sup.address}</div>
                    </td>

                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-700">
                      {sup.gstin}
                    </td>

                    <td className="px-4 py-3 text-right font-black text-amber-800 text-sm">
                      ₹{sup.pendingBalance.toLocaleString('en-IN')}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => dispatch(navigateTo('PURCHASE_GRN'))}
                        className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all mx-auto cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>+ GRN Purchase</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── REGISTER NEW SUPPLIER MODAL ───────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-modal rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading flex items-center space-x-2">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>Register New Pharmaceutical Supplier</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Sun Pharma Wholesale"
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="Suresh Nair"
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98490 12345"
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">GSTIN Number *</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                    placeholder="36AAACS5512B1Z5"
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Drug License No. *</label>
                  <input
                    type="text"
                    required
                    value={dlNumber}
                    onChange={e => setDlNumber(e.target.value)}
                    placeholder="DL-1003/HYD"
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="supplier@company.com"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Office / Depot Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Industrial Area, Hyderabad"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Register Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
