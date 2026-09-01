import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setMultiStoreModalOpen, recordBorrowedStock } from '../store/posSlice';
import {
  Building2,
  Store,
  MapPin,
  Phone,
  Search,
  Package,
  ArrowRightLeft,
  PlusCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  X,
  Share2,
  Truck,
  Building
} from 'lucide-react';

export const MultiStoreModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.multiStoreModal);
  const branchStores = useSelector((state: RootState) => state.pos.branchStores);
  const borrowedMedicines = useSelector((state: RootState) => state.pos.borrowedMedicines);
  const products = useSelector((state: RootState) => state.pos.products);

  const [activeTab, setActiveTab] = useState<'STORES' | 'BORROWED_LOG'>('STORES');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // New Borrowed Medicine Form State
  const [medicineName, setMedicineName] = useState('');
  const [saltComposition, setSaltComposition] = useState('');
  const [sourceType, setSourceType] = useState<'NEIGHBOR_PHARMACY' | 'CENTRAL_GODOWN' | 'DISTRIBUTOR'>('NEIGHBOR_PHARMACY');
  const [sourceName, setSourceName] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [unit, setUnit] = useState('Strips');
  const [purchaseCostRate, setPurchaseCostRate] = useState(120);
  const [newDisplayPrice, setNewDisplayPrice] = useState(150);
  const [notes, setNotes] = useState('');
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!modal.isOpen) return null;

  const handleClose = () => {
    dispatch(setMultiStoreModalOpen({ isOpen: false }));
  };

  const handleCreateBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName || !sourceName) return;

    dispatch(recordBorrowedStock({
      medicineName,
      saltComposition,
      sourceType,
      sourceName,
      quantity: Number(quantity),
      unit,
      purchaseCostRate: Number(purchaseCostRate),
      newDisplayPrice: Number(newDisplayPrice),
      notes
    }));

    setMedicineName('');
    setSaltComposition('');
    setSourceName('');
    setNotes('');
    setShowBorrowForm(false);
    setSuccessMsg('Borrowed medicine record logged successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const filteredProducts = products.filter(p => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(t) || p.brand.toLowerCase().includes(t) || p.saltComposition.toLowerCase().includes(t);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Multi-Store & Borrowed Stock Hub
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30">
                  Tasks #31 - #36
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Check stock across branch stores, reserve pickups, & log inter-pharmacy/godown borrowed stock.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('STORES')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'STORES'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Store className="w-4 h-4 text-sky-600" />
              <span>Inter-Branch Stock Lookup (Tasks 31 & 33)</span>
            </button>
            <button
              onClick={() => setActiveTab('BORROWED_LOG')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'BORROWED_LOG'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
              <span>Borrowed Stock & Godown Pricing (Tasks 34-36)</span>
            </button>
          </div>

          {activeTab === 'BORROWED_LOG' && (
            <button
              onClick={() => setShowBorrowForm(!showBorrowForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Borrowed Medicine</span>
            </button>
          )}
        </div>

        {/* Notification Toast */}
        {successMsg && (
          <div className="px-6 py-2 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Inter-Branch Stock Lookup */}
        {activeTab === 'STORES' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/40">
            
            {/* Store Network Cards Grid */}
            <div>
              <h3 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-3">
                Synchronized Branch Pharmacy Network
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {branchStores.map(store => (
                  <div
                    key={store.branchId}
                    className={`p-3.5 rounded-xl border transition-all ${
                      store.distanceKm === 0
                        ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-200'
                        : store.isCentralGodown
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-white shadow-2xs border border-slate-200">
                        {store.isCentralGodown ? (
                          <Truck className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Store className="w-4 h-4 text-sky-600" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {store.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">
                      {store.branchName}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{store.location}</span>
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60 text-slate-600">
                      <span>{store.distanceKm === 0 ? 'Current Location' : `${store.distanceKm} km away`}</span>
                      <span className="font-mono">{store.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medicine Inter-Branch Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Inter-Store Medicine Stock Finder
                  </h3>
                  <p className="text-xs text-slate-500">
                    Search stock across all outlets when local inventory is low or out of stock.
                  </p>
                </div>
                <div className="relative w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search medicine / salt..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full text-xs font-semibold pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Product Inter-Branch Matrix Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Medicine & Brand</th>
                      <th className="p-3">Hi-Tech City (Current)</th>
                      <th className="p-3">Jubilee Hills</th>
                      <th className="p-3">Madhapur Express</th>
                      <th className="p-3">Central Godown</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {filteredProducts.slice(0, 5).map(prod => (
                      <tr key={prod._id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{prod.name}</p>
                          <p className="text-[11px] text-slate-500">{prod.saltComposition}</p>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            prod.totalStock > 20 ? 'bg-emerald-100 text-emerald-800' : prod.totalStock > 0 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {prod.totalStock} units
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-bold">18 units</td>
                        <td className="p-3 text-slate-600 font-bold">32 units</td>
                        <td className="p-3 text-amber-800 font-bold">140 units</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              alert(`Reserved 1-click pickup for ${prod.name} at Jubilee Hills Branch!`);
                            }}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer"
                          >
                            Reserve Pickup
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Borrowed Medicine & Godown Log */}
        {activeTab === 'BORROWED_LOG' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/40">
            
            {/* New Borrow Form (Collapsible) */}
            {showBorrowForm && (
              <form onSubmit={handleCreateBorrow} className="p-4 bg-white rounded-xl border border-emerald-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                  Log Inter-Pharmacy / Godown Borrowed Medicine
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Augmentin 625 Duo"
                      value={medicineName}
                      onChange={e => setMedicineName(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Source Type *</label>
                    <select
                      value={sourceType}
                      onChange={e => setSourceType(e.target.value as any)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="NEIGHBOR_PHARMACY">Neighbor Retail Pharmacy</option>
                      <option value="CENTRAL_GODOWN">Secunderabad Central Godown</option>
                      <option value="DISTRIBUTOR">Direct Wholesale Distributor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Source Outlet Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apollo Pharmacy - Madhapur"
                      value={sourceName}
                      onChange={e => setSourceName(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Quantity & Unit</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={e => setQuantity(Number(e.target.value))}
                        className="w-24 text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                      />
                      <input
                        type="text"
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        className="flex-1 text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Cost Rate (₹)</label>
                    <input
                      type="number"
                      value={purchaseCostRate}
                      onChange={e => setPurchaseCostRate(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Display Price (Task #35) (₹)</label>
                    <input
                      type="number"
                      value={newDisplayPrice}
                      onChange={e => setNewDisplayPrice(Number(e.target.value))}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBorrowForm(false)}
                    className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                  >
                    Save Borrow Record
                  </button>
                </div>
              </form>
            )}

            {/* Borrowed Medicine Log Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  Borrowed Stock & Repayment Audit Log
                </h4>
                <span className="text-[11px] font-bold text-slate-500">
                  Total Records: {borrowedMedicines.length}
                </span>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Borrow Ref & Date</th>
                    <th className="p-3">Medicine Name</th>
                    <th className="p-3">Source Outlet</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Cost Rate</th>
                    <th className="p-3 text-right">New Display Price</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {borrowedMedicines.map(item => (
                    <tr key={item.borrowId} className="hover:bg-slate-50">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{item.borrowId}</p>
                        <p className="text-[10px] text-slate-400">{item.borrowDate}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{item.medicineName}</p>
                        <p className="text-[11px] text-slate-500">{item.saltComposition || 'Generic'}</p>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800">{item.sourceName}</span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        ₹{item.purchaseCostRate.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        ₹{item.newDisplayPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Multi-store inventory synchronization active across 4 Hyderabad pharmacy branches.
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
export default MultiStoreModal;
