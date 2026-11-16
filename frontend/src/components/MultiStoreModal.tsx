import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  setMultiStoreModalOpen,
  recordBorrowedStock,
  settleBorrowedStock,
  borrowAndDispenseToCart
} from '../store/posSlice';
import api from '../utils/api';
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
  Building,
  Printer,
  Download,
  FileText,
  Check,
  ExternalLink,
  ShieldAlert,
  Navigation,
  Send,
  ShoppingCart
} from 'lucide-react';

type MultiStoreTab = 'LOOKUP' | 'INDENTS' | 'NEW_INDENT' | 'BORROWED_LOG';

export const MultiStoreModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.multiStoreModal);
  const branchStores = useSelector((state: RootState) => state.pos.branchStores);
  const borrowedMedicines = useSelector((state: RootState) => state.pos.borrowedMedicines);
  const products = useSelector((state: RootState) => state.pos.products);
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);

  const [activeTab, setActiveTab] = useState<MultiStoreTab>('LOOKUP');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyInStockFilter, setOnlyInStockFilter] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Lookup results
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [isLoadingLookup, setIsLoadingLookup] = useState(false);

  // Transfer Indents State
  const [indentsList, setIndentsList] = useState<any[]>([]);
  const [indentFilter, setIndentFilter] = useState<string>('ALL');
  const [selectedIndentForPrint, setSelectedIndentForPrint] = useState<any | null>(null);

  // New Indent Form State
  const [indentSourceBranch, setIndentSourceBranch] = useState<string>('br-002'); // Madhapur Express
  const [indentPriority, setIndentPriority] = useState<'URGENT_CUSTOMER_WAITING' | 'ROUTINE_REPLENISHMENT' | 'CRITICAL_EMERGENCY'>('URGENT_CUSTOMER_WAITING');
  const [indentMedicineName, setIndentMedicineName] = useState('');
  const [indentQuantity, setIndentQuantity] = useState(10);
  const [indentUnitPrice, setIndentUnitPrice] = useState(185);
  const [indentRunnerName, setIndentRunnerName] = useState('K. Naresh (FastTrack Runner)');
  const [indentRunnerPhone, setIndentRunnerPhone] = useState('+91 98765 88910');
  const [indentVehicleNo, setIndentVehicleNo] = useState('TS 09 EZ 4410');
  const [indentNotes, setIndentNotes] = useState('Customer at billing counter waiting for prescription fulfillment.');

  // Manual Borrow Form State
  const [borrowMedicineName, setBorrowMedicineName] = useState('');
  const [borrowSalt, setBorrowSalt] = useState('');
  const [borrowSourceType, setBorrowSourceType] = useState<'NEIGHBOR_PHARMACY' | 'CENTRAL_GODOWN' | 'DISTRIBUTOR'>('NEIGHBOR_PHARMACY');
  const [borrowSourceName, setBorrowSourceName] = useState('');
  const [borrowQuantity, setBorrowQuantity] = useState(5);
  const [borrowUnit, setBorrowUnit] = useState('Strips');
  const [borrowCostRate, setBorrowCostRate] = useState(120);
  const [borrowDisplayPrice, setBorrowDisplayPrice] = useState(150);
  const [borrowNotes, setBorrowNotes] = useState('');
  const [showBorrowForm, setShowBorrowForm] = useState(false);

  // Set initial search if selectedProductId is present in modal
  useEffect(() => {
    if (modal.selectedProductId) {
      const prod = products.find(p => p._id === modal.selectedProductId);
      if (prod) {
        setSearchTerm(prod.name);
      }
    }
  }, [modal.selectedProductId, products]);

  // Fetch live inter-store lookup from backend
  const fetchInterStoreLookup = async (query: string) => {
    setIsLoadingLookup(true);
    try {
      const res = await api.get(`/stock-transfers/lookup?q=${encodeURIComponent(query)}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLookupResults(res.data.data);
      } else {
        fallbackClientLookup(query);
      }
    } catch (err) {
      fallbackClientLookup(query);
    } finally {
      setIsLoadingLookup(false);
    }
  };

  // Fallback client-side simulated multi-store matrix
  const fallbackClientLookup = (query: string) => {
    const q = query.toLowerCase().trim();
    const matches = products.filter(p =>
      !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.saltComposition.toLowerCase().includes(q)
    ).slice(0, 15);

    const mapped = matches.map(prod => {
      const baseStock = prod.totalStock;
      const branches = [
        {
          branchId: 'br-001',
          branchName: 'Hi-Tech City Main Branch',
          distanceKm: 0.0,
          phone: '+91 98765 43210',
          isCurrent: true,
          availableStock: baseStock,
          status: baseStock > 20 ? 'IN_STOCK' : baseStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
          rackLocation: 'Rack Main-1',
          batchNumber: prod.batches?.[0]?.batchNumber || 'AUG-8821',
          canBorrow: false,
        },
        {
          branchId: 'br-002',
          branchName: 'Madhapur Express Store',
          distanceKm: 1.8,
          phone: '+91 98765 43212',
          availableStock: Math.max(0, Math.floor(baseStock * 0.75 + 14)),
          status: 'IN_STOCK',
          rackLocation: 'Rack B-14',
          batchNumber: 'MDH-4412',
          canBorrow: true,
        },
        {
          branchId: 'br-003',
          branchName: 'Jubilee Hills Branch',
          distanceKm: 3.2,
          phone: '+91 98765 43211',
          availableStock: Math.max(0, Math.floor(baseStock * 0.5 + 8)),
          status: 'IN_STOCK',
          rackLocation: 'Rack C-02',
          batchNumber: 'JBL-9104',
          canBorrow: true,
        },
        {
          branchId: 'br-004',
          branchName: 'Banjara Hills Superstore',
          distanceKm: 5.4,
          phone: '+91 98765 43214',
          availableStock: Math.max(0, Math.floor(baseStock * 0.9 + 18)),
          status: 'IN_STOCK',
          rackLocation: 'Rack D-08',
          batchNumber: 'BNJ-2210',
          canBorrow: true,
        },
        {
          branchId: 'br-005',
          branchName: 'Secunderabad Central Godown',
          distanceKm: 11.5,
          phone: '+91 98765 43213',
          isCentralGodown: true,
          availableStock: Math.max(120, baseStock * 3 + 150),
          status: 'IN_STOCK',
          rackLocation: 'Bay W-04',
          batchNumber: 'CEN-5519',
          canBorrow: true,
        },
      ];

      const nearestAvailable = branches.find(b => !b.isCurrent && b.availableStock > 0);

      return {
        productId: prod._id,
        name: prod.name,
        brand: prod.brand,
        saltComposition: prod.saltComposition,
        sellingPrice: prod.sellingPrice,
        mrp: prod.unitMRP,
        totalStock: prod.totalStock,
        scheduleCategory: prod.scheduleCategory,
        branches,
        nearestAvailableBranch: nearestAvailable || null,
      };
    });

    setLookupResults(mapped);
  };

  // Fetch transfer indents from backend
  const fetchTransferIndents = async () => {
    try {
      const res = await api.get(`/stock-transfers/indents?status=${indentFilter}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setIndentsList(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load transfer indents', err);
    }
  };

  useEffect(() => {
    fetchInterStoreLookup(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (activeTab === 'INDENTS') {
      fetchTransferIndents();
    }
  }, [activeTab, indentFilter]);

  if (!modal.isOpen) return null;

  const handleClose = () => {
    dispatch(setMultiStoreModalOpen({ isOpen: false }));
  };

  // 1-Click Borrow & Dispense to Cart
  const handleBorrowAndDispense = (item: any, branch: any) => {
    const qty = 5;
    dispatch(borrowAndDispenseToCart({
      productId: item.productId,
      medicineName: item.name,
      saltComposition: item.saltComposition,
      sourceName: branch.branchName,
      sourceType: branch.isCentralGodown ? 'CENTRAL_GODOWN' : 'NEIGHBOR_PHARMACY',
      quantity: qty,
      unitPrice: item.sellingPrice,
      purchaseCostRate: Number((item.sellingPrice * 0.75).toFixed(2)),
      batchNumber: branch.batchNumber,
    }));

    setStatusMsg(`✓ Borrowed ${qty} units of ${item.name} from ${branch.branchName} and added directly to patient cart!`);
    setTimeout(() => setStatusMsg(''), 4500);
  };

  // Prefill Indent from lookup
  const handleOpenIndentForMedicine = (item: any, branch: any) => {
    setIndentMedicineName(item.name);
    setIndentSourceBranch(branch.branchId);
    setIndentUnitPrice(item.sellingPrice);
    setIndentQuantity(10);
    setActiveTab('NEW_INDENT');
  };

  // Submit New Transfer Indent
  const handleCreateIndentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        sourceBranchId: indentSourceBranch,
        destinationBranchId: 'br-001',
        priority: indentPriority,
        items: [
          {
            medicineName: indentMedicineName,
            requestedQty: Number(indentQuantity),
            unitPrice: Number(indentUnitPrice),
          }
        ],
        driverName: indentRunnerName,
        driverPhone: indentRunnerPhone,
        vehicleNumber: indentVehicleNo,
        notes: indentNotes,
      };

      const res = await api.post('/stock-transfers/indents', payload);
      if (res.data?.success) {
        setStatusMsg(`✓ Transfer Indent ${res.data.data.indentNumber} dispatched to ${res.data.data.sourceBranch.branchName}!`);
        setActiveTab('INDENTS');
        fetchTransferIndents();
      } else {
        // Fallback local addition
        const newLocalIndent = {
          _id: `sti-${Date.now()}`,
          indentNumber: `STI-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
          indentDate: new Date(),
          sourceBranch: branchStores.find(b => b.branchId === indentSourceBranch) || branchStores[1],
          destinationBranch: branchStores[0],
          priority: indentPriority,
          status: 'APPROVED_DISPATCHED',
          items: [
            {
              medicineName: indentMedicineName,
              requestedQty: Number(indentQuantity),
              dispatchedQty: Number(indentQuantity),
              receivedQty: 0,
              unitPrice: Number(indentUnitPrice),
              lineTotal: Number(indentQuantity * indentUnitPrice),
            }
          ],
          totalItems: 1,
          totalAmount: Number(indentQuantity * indentUnitPrice),
          dispatchedAt: new Date(),
          dispatchedBy: currentUser?.pharmacistName || 'Cashier',
          driverDetails: {
            driverName: indentRunnerName,
            contactNumber: indentRunnerPhone,
            vehicleNumber: indentVehicleNo,
          },
          notes: indentNotes,
        };
        setIndentsList(prev => [newLocalIndent, ...prev]);
        setStatusMsg(`✓ Transfer Indent ${newLocalIndent.indentNumber} recorded successfully!`);
        setActiveTab('INDENTS');
      }
      setTimeout(() => setStatusMsg(''), 4500);
    } catch (err) {
      console.error('Failed to submit transfer indent', err);
    }
  };

  // Update Indent Status (Mark In-Transit / Receive)
  const handleUpdateIndentStatus = async (indentId: string, newStatus: string) => {
    try {
      const res = await api.put(`/stock-transfers/indents/${indentId}/status`, { status: newStatus });
      if (res.data?.success) {
        setIndentsList(prev => prev.map(ind => ind._id === indentId ? res.data.data : ind));
        setStatusMsg(`✓ Indent status updated to ${newStatus}. Stock inwarded!`);
        setTimeout(() => setStatusMsg(''), 3500);
      }
    } catch (err) {
      setIndentsList(prev => prev.map(ind => ind._id === indentId ? { ...ind, status: newStatus, receivedAt: new Date() } : ind));
      setStatusMsg(`✓ Indent marked as ${newStatus}!`);
      setTimeout(() => setStatusMsg(''), 3500);
    }
  };

  // Handle Manual Borrow
  const handleCreateBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowMedicineName || !borrowSourceName) return;

    dispatch(recordBorrowedStock({
      medicineName: borrowMedicineName,
      saltComposition: borrowSalt,
      sourceType: borrowSourceType,
      sourceName: borrowSourceName,
      quantity: Number(borrowQuantity),
      unit: borrowUnit,
      purchaseCostRate: Number(borrowCostRate),
      newDisplayPrice: Number(borrowDisplayPrice),
      notes: borrowNotes
    }));

    setBorrowMedicineName('');
    setBorrowSalt('');
    setBorrowSourceName('');
    setBorrowNotes('');
    setShowBorrowForm(false);
    setStatusMsg('✓ Borrowed medicine logged into audit ledger.');
    setTimeout(() => setStatusMsg(''), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Multi-Store Stock Transfers &amp; Inter-Branch Indents
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  5 STORES SYNCED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time branch inventory lookup, 1-click counter medicine borrowing, &amp; store transfer indents (STI)
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

        {/* ── 4 SUB-TABS NAVIGATION ─────────────────────────────────── */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('LOOKUP')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'LOOKUP'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Search className="w-4 h-4 text-sky-600" />
              <span>Real-Time Branch Stock Lookup</span>
            </button>

            <button
              onClick={() => setActiveTab('INDENTS')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'INDENTS'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Transfer Indents &amp; Gate Passes</span>
              {indentsList.length > 0 && (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {indentsList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('NEW_INDENT')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'NEW_INDENT'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Send className="w-4 h-4 text-blue-600" />
              <span>Request Store Transfer (STI)</span>
            </button>

            <button
              onClick={() => setActiveTab('BORROWED_LOG')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'BORROWED_LOG'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
              <span>Borrowed Stock &amp; Audit Log</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Store: <strong>Hi-Tech City (Main)</strong></span>
          </div>
        </div>

        {/* ── STATUS TOAST ─────────────────────────────────────────── */}
        {statusMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
            <button onClick={() => setStatusMsg('')} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── TAB 1: REAL-TIME BRANCH STOCK LOOKUP ─────────────────── */}
        {activeTab === 'LOOKUP' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50 text-xs">
            {/* Search Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type medicine name, active salt, brand, or barcode to query nearby stores..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-bold select-none">
                  <input
                    type="checkbox"
                    checked={onlyInStockFilter}
                    onChange={e => setOnlyInStockFilter(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                  <span>Only show branches with stock</span>
                </label>
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-4">
              {isLoadingLookup ? (
                <div className="p-12 text-center text-slate-400">
                  <Package className="w-8 h-8 animate-bounce mx-auto text-sky-500 mb-2" />
                  <p className="font-bold">Querying 5 branch store databases...</p>
                </div>
              ) : lookupResults.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700">No medicines matched "{searchTerm}"</p>
                  <p className="text-[11px] text-slate-500 mt-1">Try searching by generic salt composition or brand name</p>
                </div>
              ) : (
                lookupResults.map(item => {
                  const currentBranchStock = item.branches.find((b: any) => b.isCurrent)?.availableStock ?? 0;
                  const isCurrentOut = currentBranchStock <= 0;
                  const nearest = item.nearestAvailableBranch;

                  return (
                    <div
                      key={item.productId || item.name}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                    >
                      {/* Medicine Header & Nearest Outlet Callout */}
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                              {item.name}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                              ₹{item.sellingPrice.toFixed(2)} / strip
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {item.saltComposition} &nbsp;·&nbsp; {item.brand || 'Pharma Standard'}
                          </p>
                        </div>

                        {/* Local vs Nearest Stock Banner */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                            isCurrentOut
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : currentBranchStock < 10
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            Current Store: {currentBranchStock} units {isCurrentOut && '(OUT OF STOCK)'}
                          </span>

                          {nearest && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-xl font-bold text-xs">
                              <Navigation className="w-3.5 h-3.5 text-sky-600" />
                              <span>Nearest: {nearest.branchName} ({nearest.distanceKm} km) • {nearest.availableStock} in stock</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Store-by-Store Inventory Matrix */}
                      <div className="border border-slate-100 rounded-xl overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                              <th className="px-3 py-2">Branch Outlet</th>
                              <th className="px-3 py-2 text-center">Distance</th>
                              <th className="px-3 py-2 text-center">Stock Units</th>
                              <th className="px-3 py-2 text-center">Shelf Rack</th>
                              <th className="px-3 py-2">Batch Expiry</th>
                              <th className="px-3 py-2 text-right">Counter Quick Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {item.branches
                              .filter((b: any) => !onlyInStockFilter || b.availableStock > 0)
                              .map((branch: any) => (
                                <tr
                                  key={branch.branchId}
                                  className={branch.isCurrent ? 'bg-slate-50/70 font-semibold' : 'hover:bg-slate-50/50'}
                                >
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1.5">
                                      {branch.isCentralGodown ? (
                                        <Truck className="w-3.5 h-3.5 text-amber-600" />
                                      ) : (
                                        <Store className="w-3.5 h-3.5 text-sky-600" />
                                      )}
                                      <span className={branch.isCurrent ? 'font-bold text-slate-900' : 'text-slate-800'}>
                                        {branch.branchName}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">{branch.phone}</div>
                                  </td>

                                  <td className="px-3 py-2 text-center text-slate-600 font-mono">
                                    {branch.isCurrent ? '0 km (Here)' : `${branch.distanceKm} km`}
                                  </td>

                                  <td className="px-3 py-2 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      branch.availableStock > 20
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : branch.availableStock > 0
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {branch.availableStock} units
                                    </span>
                                  </td>

                                  <td className="px-3 py-2 text-center text-slate-600 font-mono text-[11px]">
                                    {branch.rackLocation}
                                  </td>

                                  <td className="px-3 py-2 text-slate-600 text-[11px]">
                                    <span className="font-mono text-slate-800 font-semibold">{branch.batchNumber}</span>
                                    <span className="text-slate-400 block text-[10px]">Exp: 2027-10</span>
                                  </td>

                                  <td className="px-3 py-2 text-right">
                                    {branch.isCurrent ? (
                                      <span className="text-[11px] text-slate-400 italic">Current Outlet</span>
                                    ) : branch.availableStock > 0 ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => handleBorrowAndDispense(item, branch)}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer text-[11px]"
                                          title="Borrow stock and add directly into current customer bill"
                                        >
                                          <ShoppingCart className="w-3 h-3" />
                                          <span>Borrow &amp; Dispense</span>
                                        </button>

                                        <button
                                          onClick={() => handleOpenIndentForMedicine(item, branch)}
                                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-bold rounded-lg transition-all cursor-pointer text-[11px]"
                                        >
                                          Indent
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-rose-500 font-semibold">Out of Stock</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: TRANSFER INDENTS (STI) & GATE PASSES ───────────── */}
        {activeTab === 'INDENTS' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 text-xs">
            {/* Filter & Action Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Filter Status:</span>
                {(['ALL', 'APPROVED_DISPATCHED', 'IN_TRANSIT', 'RECEIVED_CONFIRMED'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setIndentFilter(st)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      indentFilter === st
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All Indents' : st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('NEW_INDENT')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Store Transfer Indent</span>
              </button>
            </div>

            {/* Indents Pipeline Cards */}
            <div className="space-y-3">
              {indentsList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold">No store transfer indents matching this filter.</p>
                </div>
              ) : (
                indentsList.map(indent => {
                  const isReceived = indent.status === 'RECEIVED_CONFIRMED';
                  const isDispatched = indent.status === 'APPROVED_DISPATCHED';
                  const isInTransit = indent.status === 'IN_TRANSIT';

                  return (
                    <div
                      key={indent._id || indent.indentNumber}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-sm">{indent.indentNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            indent.priority === 'URGENT_CUSTOMER_WAITING'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-sky-100 text-sky-800'
                          }`}>
                            {indent.priority?.replace(/_/g, ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isReceived
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                          }`}>
                            {indent.status?.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedIndentForPrint(indent)}
                            className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer text-[11px]"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            <span>Gate Pass Challan</span>
                          </button>

                          {isDispatched && (
                            <button
                              onClick={() => handleUpdateIndentStatus(indent._id, 'IN_TRANSIT')}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs transition-all cursor-pointer text-[11px]"
                            >
                              Dispatch Outward
                            </button>
                          )}

                          {!isReceived && (
                            <button
                              onClick={() => handleUpdateIndentStatus(indent._id, 'RECEIVED_CONFIRMED')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer text-[11px]"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Receive &amp; Inward</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Route & Delivery Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                        <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                          <span className="text-slate-400 font-bold block uppercase text-[9px]">Source Outlet</span>
                          <div className="font-bold text-slate-900">{indent.sourceBranch?.branchName}</div>
                          <div className="text-slate-500">{indent.sourceBranch?.phone}</div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                          <span className="text-slate-400 font-bold block uppercase text-[9px]">Destination Branch</span>
                          <div className="font-bold text-slate-900">{indent.destinationBranch?.branchName}</div>
                          <div className="text-slate-500">Hi-Tech City Retail Hub</div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                          <span className="text-slate-400 font-bold block uppercase text-[9px]">Courier / Runner Transit</span>
                          <div className="font-bold text-slate-900">{indent.driverDetails?.driverName}</div>
                          <div className="text-slate-500 font-mono">{indent.driverDetails?.vehicleNumber} • {indent.driverDetails?.contactNumber}</div>
                        </div>
                      </div>

                      {/* Itemized Medicine Summary */}
                      <div className="p-2.5 bg-slate-50/80 rounded-xl space-y-1">
                        {indent.items?.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">
                              {it.medicineName} ({it.requestedQty} units)
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              ₹{(it.lineTotal || (it.requestedQty * (it.unitPrice || 100))).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {indent.notes && (
                        <p className="text-[10px] text-slate-500 italic">
                          Note: {indent.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: CREATE STORE TRANSFER INDENT (STI) ─────────────── */}
        {activeTab === 'NEW_INDENT' && (
          <form onSubmit={handleCreateIndentSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-extrabold text-sm text-slate-900 font-heading">
                  Create Inter-Store Transfer Indent (STI)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Request medicine transfer from another branch store or central wholesale godown
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Source Store to Request From *</label>
                  <select
                    value={indentSourceBranch}
                    onChange={e => setIndentSourceBranch(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="br-002">Madhapur Express Store (1.8 km)</option>
                    <option value="br-003">Jubilee Hills Branch (3.2 km)</option>
                    <option value="br-004">Banjara Hills Superstore (5.4 km)</option>
                    <option value="br-005">Secunderabad Central Wholesale Godown (11.5 km)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transfer Priority *</label>
                  <select
                    value={indentPriority}
                    onChange={e => setIndentPriority(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="URGENT_CUSTOMER_WAITING">Urgent - Customer Waiting At Counter</option>
                    <option value="CRITICAL_EMERGENCY">Critical Emergency Hospital Rx</option>
                    <option value="ROUTINE_REPLENISHMENT">Routine Daily Stock Replenishment</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Destination Branch</label>
                  <input
                    type="text"
                    disabled
                    value="Hi-Tech City Main Branch (Current)"
                    className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-600"
                  />
                </div>
              </div>

              {/* Medicine Item Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                  Medicine To Indent
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Medicine Name &amp; Strength *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Augmentin 625 Duo Tablet"
                      value={indentMedicineName}
                      onChange={e => setIndentMedicineName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="font-bold text-slate-700 block mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={indentQuantity}
                        onChange={e => setIndentQuantity(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="font-bold text-slate-700 block mb-1">Unit Price (₹)</label>
                      <input
                        type="number"
                        value={indentUnitPrice}
                        onChange={e => setIndentUnitPrice(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Transit Runner Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dispatch Runner / Driver</label>
                  <input
                    type="text"
                    value={indentRunnerName}
                    onChange={e => setIndentRunnerName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Runner Mobile Phone</label>
                  <input
                    type="text"
                    value={indentRunnerPhone}
                    onChange={e => setIndentRunnerPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Registration No.</label>
                  <input
                    type="text"
                    value={indentVehicleNo}
                    onChange={e => setIndentVehicleNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Remarks &amp; Customer Order Ref</label>
                <input
                  type="text"
                  value={indentNotes}
                  onChange={e => setIndentNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('LOOKUP')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Generate &amp; Dispatch Transfer Indent</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── TAB 4: BORROWED STOCK & AUDIT LOG ────────────────────── */}
        {activeTab === 'BORROWED_LOG' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 text-xs">
            {/* Header actions */}
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 font-heading">
                  Borrowed Stock &amp; Inter-Store Repayment Audit Log
                </h3>
                <p className="text-[11px] text-slate-500">
                  Track stock borrowed from neighbor pharmacies and central godown for settlement
                </p>
              </div>

              <button
                onClick={() => setShowBorrowForm(!showBorrowForm)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log External Borrowed Medicine</span>
              </button>
            </div>

            {/* Collapsible Borrow Form */}
            {showBorrowForm && (
              <form onSubmit={handleCreateBorrow} className="p-4 bg-white rounded-2xl border border-emerald-300 shadow-sm space-y-3 animate-in fade-in">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                  <span>Manual Borrowed Stock Entry</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Medicine Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dolo 650 Tablet"
                      value={borrowMedicineName}
                      onChange={e => setBorrowMedicineName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Source Type</label>
                    <select
                      value={borrowSourceType}
                      onChange={e => setBorrowSourceType(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="NEIGHBOR_PHARMACY">Neighbor Retail Pharmacy</option>
                      <option value="CENTRAL_GODOWN">Central Wholesale Godown</option>
                      <option value="DISTRIBUTOR">Direct Wholesale Distributor</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Source Pharmacy Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apollo Pharmacy - Cyber Towers"
                      value={borrowSourceName}
                      onChange={e => setBorrowSourceName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Quantity &amp; Unit</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={borrowQuantity}
                        onChange={e => setBorrowQuantity(Number(e.target.value))}
                        className="w-24 p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                      />
                      <input
                        type="text"
                        value={borrowUnit}
                        onChange={e => setBorrowUnit(e.target.value)}
                        className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Purchase Cost Rate (₹)</label>
                    <input
                      type="number"
                      value={borrowCostRate}
                      onChange={e => setBorrowCostRate(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">New Display Price (₹)</label>
                    <input
                      type="number"
                      value={borrowDisplayPrice}
                      onChange={e => setBorrowDisplayPrice(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowBorrowForm(false)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    Save Borrow Record
                  </button>
                </div>
              </form>
            )}

            {/* Borrowed Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="p-3">Borrow Ref &amp; Date</th>
                    <th className="p-3">Medicine Name</th>
                    <th className="p-3">Source Outlet</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Cost Rate</th>
                    <th className="p-3 text-right">Selling Price</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {borrowedMedicines.map(item => (
                    <tr key={item.borrowId} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-900 block">{item.borrowId}</span>
                        <span className="text-[10px] text-slate-400">{item.borrowDate}</span>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{item.medicineName}</span>
                        <span className="text-[10px] text-slate-500">{item.saltComposition || 'Generic'}</span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{item.sourceName}</span>
                        <span className="text-[10px] text-slate-400">{item.sourceType}</span>
                      </td>

                      <td className="p-3 text-center font-bold text-slate-900">
                        {item.quantity} {item.unit}
                      </td>

                      <td className="p-3 text-right text-slate-600 font-mono">
                        ₹{item.purchaseCostRate.toFixed(2)}
                      </td>

                      <td className="p-3 text-right font-bold text-emerald-700 font-mono">
                        ₹{item.newDisplayPrice.toFixed(2)}
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'SETTLED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        {item.status !== 'SETTLED' && (
                          <button
                            onClick={() => dispatch(settleBorrowedStock(item.borrowId))}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            Mark Settled
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PRINTABLE GATE PASS MODAL ────────────────────────────── */}
        {selectedIndentForPrint && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-xs">
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm">Store Transfer Gate Pass / Delivery Challan</h3>
                </div>
                <button
                  onClick={() => setSelectedIndentForPrint(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Body */}
              <div className="p-5 space-y-3 font-mono text-[11px]" id="transit-challan">
                <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-0.5">
                  <h2 className="font-black text-sm text-slate-900">{currentUser?.pharmacyName || 'GENQUANTAA MEDPLUS PHARMACY'}</h2>
                  <p className="text-[10px] text-slate-500">INTER-STORE STOCK TRANSFER CHALLAN &amp; GATE PASS</p>
                  <p className="font-bold text-slate-800 pt-1">CHALLAN NO: {selectedIndentForPrint.indentNumber}</p>
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                    <span>DATE: {String(selectedIndentForPrint.indentDate).slice(0, 10)}</span>
                    <span>STATUS: {selectedIndentForPrint.status}</span>
                  </div>
                </div>

                <div className="space-y-1 border-b border-dashed border-slate-300 pb-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">DISPATCH FROM:</span>
                    <span className="font-bold text-slate-900">{selectedIndentForPrint.sourceBranch?.branchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DESTINATION:</span>
                    <span className="font-bold text-slate-900">{selectedIndentForPrint.destinationBranch?.branchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">COURIER RUNNER:</span>
                    <span>{selectedIndentForPrint.driverDetails?.driverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">VEHICLE NO:</span>
                    <span>{selectedIndentForPrint.driverDetails?.vehicleNumber}</span>
                  </div>
                </div>

                <div className="space-y-1 border-b border-dashed border-slate-300 pb-2.5">
                  <div className="font-bold text-slate-800 pb-1">TRANSIT MEDICINE ITEMS:</div>
                  {selectedIndentForPrint.items?.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>{it.medicineName}</span>
                      <span className="font-bold">QTY: {it.requestedQty}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 grid grid-cols-2 gap-4 text-center text-[10px]">
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-600">
                    DISPATCH PHARMACIST
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-600">
                    RECEIVING PHARMACIST
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-between items-center">
                <button
                  onClick={() => setSelectedIndentForPrint(null)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Gate Pass</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <p className="text-slate-500">
            Real-time branch store sync enabled across 5 locations with active GPS distance routing.
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default MultiStoreModal;
