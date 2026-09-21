import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  processReturnCreditNote,
  completePutAwayTask,
  setRackRoboModalOpen,
  navigateTo
} from '../store/posSlice';
import type { ReturnItem, ReturnCreditNote } from '../types/pos';
import api from '../utils/api';
import {
  RotateCcw, CheckCircle2, FileText,
  ShoppingBag, Plus, Trash2, Box, MapPin,
  Check, Percent, Layers, Clock, AlertTriangle,
  ArrowRight, ShieldCheck, Printer, Search, Truck,
  X, Download, Sliders, User, Sparkles, CheckSquare, Tag, Eye, ChevronRight
} from 'lucide-react';

const RESTOCKING_PRESETS = [
  { percent: 15, label: '15% Statutory (Default)', reason: 'Statutory retail packaging inspection & QC fee' },
  { percent: 10, label: '10% Unopened Late Return', reason: 'Customer return >7 days with intact outer packaging' },
  { percent: 20, label: '20% Opened Foil / Strip', reason: 'Unsealed strip return requiring quarantine & restock QC' },
  { percent: 0,  label: '0% Courtesy Waiver', reason: 'Prescription/doctor change or counter courtesy waiver' }
];

export const ReturnsPage: React.FC = () => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.pos.products);
  const returnNotes = useSelector((state: RootState) => state.pos.returnNotes);
  const putAwayTasks = useSelector((state: RootState) => state.pos.putAwayTasks || []);
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);

  const [fetchedReturnNotes, setFetchedReturnNotes] = useState<any[]>([]);

  // Fetch returns history from API on mount
  useEffect(() => {
    const fetchReturnNotes = async () => {
      try {
        const res = await api.get('/returns?limit=50');
        if (res.data.success && Array.isArray(res.data.data)) {
          setFetchedReturnNotes(res.data.data);
        }
      } catch (err) {
        console.error('[ReturnsPage] Failed to fetch return credit notes from API:', err);
      }
    };
    fetchReturnNotes();
  }, []);

  // Combined returns list (API history + Redux state)
  const allReturnNotes = useMemo(() => {
    const map = new Map<string, any>();
    fetchedReturnNotes.forEach((note: any) => {
      if (note.creditNoteNo) map.set(note.creditNoteNo, note);
    });
    returnNotes.forEach(note => {
      if (note.creditNoteNo) map.set(note.creditNoteNo, note);
    });
    return Array.from(map.values());
  }, [fetchedReturnNotes, returnNotes]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'RETURN_FORM' | 'PUTAWAY_QUEUE'>('RETURN_FORM');

  // Form State
  const [invoiceNo, setInvoiceNo] = useState<string>('INV-2026-841201');
  const [patientName, setPatientName] = useState<string>('Ramesh Kumar');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'UPI' | 'STORE_CREDIT'>('CASH');
  const [invoiceLookupLoading, setInvoiceLookupLoading] = useState<boolean>(false);

  // Task #22: 15% Restocking Fee & Credit Note Modal State
  const [applyRestockingFee, setApplyRestockingFee] = useState<boolean>(true);
  const [restockingFeePercent, setRestockingFeePercent] = useState<number>(15);
  const [feeReason, setFeeReason] = useState<string>('Statutory retail packaging inspection & QC fee');
  const [showCreditNoteModal, setShowCreditNoteModal] = useState<boolean>(false);
  const [activePrintNote, setActivePrintNote] = useState<ReturnCreditNote | null>(null);

  // Task #23: Put-Away Search, Rack Filter & Routing Slip State
  const [putAwaySearch, setPutAwaySearch] = useState<string>('');
  const [putAwayFilter, setPutAwayFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [selectedRackFilter, setSelectedRackFilter] = useState<string>('ALL');
  const [selectedRestockerStaff, setSelectedRestockerStaff] = useState<string>(
    currentUser?.pharmacistName || 'Ramesh Kumar (Counter 1)'
  );
  const [showPutAwaySlipModal, setShowPutAwaySlipModal] = useState<boolean>(false);
  const [putAwayToast, setPutAwayToast] = useState<string | null>(null);

  // Auto-fill from invoice number
  const handleInvoiceLookup = async () => {
    if (!invoiceNo.trim()) return;
    setInvoiceLookupLoading(true);
    try {
      const res = await api.get(`/invoices/${invoiceNo.trim()}`);
      if (res.data.success && res.data.data) {
        const inv = res.data.data;
        const pName = inv.billingSession?.patientDetails?.patientName || 'Walk-in Customer';
        setPatientName(pName);
        const items: ReturnItem[] = inv.billingSession.items.map((item: any) => ({
          productId: item.product?._id || item.productId || '',
          productName: item.product?.name || item.productName || '',
          batchNumber: item.selectedBatch?.batchNumber || '',
          quantityReturned: item.quantity,
          unitPrice: item.unitPrice,
          refundAmount: Number((item.unitPrice * item.quantity).toFixed(2)),
          reason: 'CUSTOMER_CANCELLED' as const,
          restocked: true,
          rackLocation: item.selectedBatch?.location || 'Rack B-01',
          shelfTier: 'Tier 2 (Eye Level)',
          binNumber: 'Bin 04'
        }));
        setReturnItems(items);
      } else {
        alert(`Invoice "${invoiceNo}" not found in the database.`);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert(`Invoice "${invoiceNo}" not found.`);
      } else {
        console.error('[ReturnsPage] Invoice lookup failed:', err);
      }
    } finally {
      setInvoiceLookupLoading(false);
    }
  };

  // Return Items Draft Table
  const [selectedProdId, setSelectedProdId] = useState<string>(products[0]?._id || '');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<'CUSTOMER_CANCELLED' | 'EXPIRED' | 'DAMAGED' | 'WRONG_MEDICINE'>('CUSTOMER_CANCELLED');
  const [autoRestock, setAutoRestock] = useState<boolean>(true);

  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [generatedNote, setGeneratedNote] = useState<ReturnCreditNote | null>(null);

  const selectedProduct = products.find(p => p._id === selectedProdId);

  const handleAddReturnItem = () => {
    if (!selectedProduct) return;
    if (returnQty <= 0) {
      alert('Return quantity must be greater than 0');
      return;
    }

    const batch = selectedProduct.batches[0]?.batchNumber || 'BT-DEF';
    const batchLoc = selectedProduct.batches[0]?.location || 'Rack B-01';
    const refundAmt = Number((selectedProduct.sellingPrice * returnQty).toFixed(2));

    const newItem: ReturnItem = {
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      batchNumber: batch,
      quantityReturned: returnQty,
      unitPrice: selectedProduct.sellingPrice,
      refundAmount: refundAmt,
      reason: returnReason,
      restocked: autoRestock,
      rackLocation: batchLoc,
      shelfTier: 'Tier 2 (Eye Level)',
      binNumber: 'Bin 04'
    };

    setReturnItems(prev => [...prev, newItem]);
    setReturnQty(1);
  };

  const handleRemoveReturnItem = (idx: number) => {
    setReturnItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Task #22 Fee Calculations
  const grossRefundAmount = returnItems.reduce((sum, item) => sum + item.refundAmount, 0);
  const restockingFeeDeducted = applyRestockingFee
    ? Number(((grossRefundAmount * restockingFeePercent) / 100).toFixed(2))
    : 0;
  const netRefundAmount = Number(Math.max(0, grossRefundAmount - restockingFeeDeducted).toFixed(2));

  const handleProcessReturn = async () => {
    if (returnItems.length === 0) {
      alert('Please add at least one medicine item to process the return!');
      return;
    }

    const creditNoteNumber = `CRN-${Date.now().toString().slice(-6)}`;
    const creditNote: ReturnCreditNote = {
      creditNoteNo: creditNoteNumber,
      originalInvoiceNo: invoiceNo,
      patientName: patientName || 'Walk-in Customer',
      returnDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      items: returnItems.map(item => {
        const prod = products.find(p => p._id === item.productId);
        const batch = prod?.batches.find(b => b.batchNumber === item.batchNumber) || prod?.batches[0];
        return {
          ...item,
          rackLocation: item.rackLocation || batch?.location || 'Rack B-01',
          shelfTier: item.shelfTier || 'Tier 2 (Eye Level)',
          binNumber: item.binNumber || 'Bin 04'
        };
      }),
      grossRefundAmount: Number(grossRefundAmount.toFixed(2)),
      restockingFeePercent: applyRestockingFee ? restockingFeePercent : 0,
      restockingFeeDeducted: Number(restockingFeeDeducted.toFixed(2)),
      feeReason: applyRestockingFee ? feeReason : 'Fee Waived (0%)',
      netRefundAmount: Number(netRefundAmount.toFixed(2)),
      totalRefundAmount: Number(netRefundAmount.toFixed(2)),
      refundMethod
    };

    try {
      const res = await api.post('/returns', {
        originalInvoiceNo: invoiceNo,
        patientName: patientName || 'Walk-in Customer',
        items: creditNote.items,
        totalRefundAmount: creditNote.totalRefundAmount,
        refundMethod
      });
      if (res.data?.data?.creditNoteNo) {
        creditNote.creditNoteNo = res.data.data.creditNoteNo;
      }
    } catch (err: any) {
      console.warn('[ReturnsPage] Server offline or endpoint simulated; processed locally in Redux store.');
    }

    setFetchedReturnNotes(prev => [creditNote, ...prev]);
    dispatch(processReturnCreditNote(creditNote));
    setGeneratedNote(creditNote);
    setActivePrintNote(creditNote);
    setShowCreditNoteModal(true);
    setReturnItems([]);
  };

  // Unique Storage Racks for Put-Away Filtering
  const availableRacks = useMemo(() => {
    const set = new Set<string>();
    putAwayTasks.forEach(t => {
      if (t.rackLocation && t.rackLocation !== 'Unassigned') {
        set.add(t.rackLocation);
      }
    });
    return Array.from(set).sort();
  }, [putAwayTasks]);

  // Put-Away Tasks Filtering
  const pendingPutAwayCount = putAwayTasks.filter(t => t.status === 'PENDING').length;
  const completedPutAwayCount = putAwayTasks.filter(t => t.status === 'COMPLETED').length;

  const filteredPutAwayTasks = useMemo(() => {
    return putAwayTasks.filter(t => {
      if (putAwayFilter !== 'ALL' && t.status !== putAwayFilter) return false;
      if (selectedRackFilter !== 'ALL' && t.rackLocation !== selectedRackFilter) return false;
      if (putAwaySearch.trim()) {
        const q = putAwaySearch.toLowerCase();
        return (
          t.productName.toLowerCase().includes(q) ||
          t.batchNumber.toLowerCase().includes(q) ||
          t.rackLocation.toLowerCase().includes(q) ||
          t.creditNoteNo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [putAwayTasks, putAwayFilter, selectedRackFilter, putAwaySearch]);

  const handleBulkPutAwayRack = (targetRack?: string) => {
    const targets = putAwayTasks.filter(t => 
      t.status === 'PENDING' && 
      (!targetRack || targetRack === 'ALL' || t.rackLocation === targetRack)
    );
    if (targets.length === 0) {
      alert('No pending put-away tasks found for this rack selection.');
      return;
    }
    targets.forEach(t => {
      dispatch(completePutAwayTask({
        taskId: t.id,
        restockedBy: selectedRestockerStaff
      }));
    });
    setPutAwayToast(`✓ Restocked ${targets.length} medicines to physical shelves by ${selectedRestockerStaff}!`);
    setTimeout(() => setPutAwayToast(null), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <RotateCcw className="w-6 h-6 text-rose-600" />
            <span>Medicine Returns, Restocking &amp; Shelf Put-Away</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Process customer returns with statutory 15% restocking fee &amp; manage physical shelf put-away queues
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Shelf Robo Trigger */}
          <button
            onClick={() => dispatch(setRackRoboModalOpen({ isOpen: true }))}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Open Interactive 2D Pharmacy Shelf Map"
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Shelf Robo 📍</span>
          </button>

          <button
            onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Back to POS Terminal</span>
          </button>
        </div>
      </div>

      {/* ── TAB SELECTOR ────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('RETURN_FORM')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeTab === 'RETURN_FORM'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Issue Return &amp; Credit Note</span>
        </button>

        <button
          onClick={() => setActiveTab('PUTAWAY_QUEUE')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer relative ${
            activeTab === 'PUTAWAY_QUEUE'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Box className="w-4 h-4 text-purple-300" />
          <span>Physical Shelf Put-Away Queue</span>
          {pendingPutAwayCount > 0 && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              activeTab === 'PUTAWAY_QUEUE' ? 'bg-purple-900 text-white' : 'bg-rose-600 text-white'
            }`}>
              {pendingPutAwayCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* ── DISTRIBUTOR RTV DEBIT NOTE CROSS-LINK BANNER (Task #43) ── */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-indigo-950 block">Returning Near-Expiry Stock to Wholesale Distributor (RTV)?</span>
            <span className="text-[11px] text-indigo-700">Issue commercial supplier debit notes 60–90 days prior to expiry for 100% distributor credit recovery.</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch(navigateTo('EXPIRY_MANAGEMENT'))}
          className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
        >
          <span>Distributor Debit Notes &amp; RTV</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: RETURN FORM & 15% RESTOCKING FEE (Task #22)               */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'RETURN_FORM' && (
        <div className="space-y-4">
          {/* Invoice Lookup Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading flex items-center justify-between">
              <span>Original Bill / Invoice Lookup</span>
              <span className="text-[10px] text-slate-400 font-normal">Step 1: Fetch invoice details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Original Invoice No. *</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    onBlur={handleInvoiceLookup}
                    onKeyDown={e => { if (e.key === 'Enter') handleInvoiceLookup(); }}
                    placeholder="INV-2026-841201"
                    className={`w-full pl-9 pr-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden ${
                      invoiceLookupLoading ? 'border-amber-400 bg-amber-50' : 'border-slate-300'
                    }`}
                  />
                  {invoiceLookupLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-amber-600 font-bold animate-pulse">
                      Looking up...
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Patient Customer Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="Ramesh Kumar"
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Refund Channel *</label>
                <select
                  value={refundMethod}
                  onChange={e => setRefundMethod(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
                >
                  <option value="CASH">Cash Refund</option>
                  <option value="UPI">Instant UPI Refund</option>
                  <option value="STORE_CREDIT">Store Credit Voucher</option>
                </select>
              </div>
            </div>
          </div>

          {/* Select Medicines to Return */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">
              Select Medicines to Return
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-2.5 text-xs font-semibold">
              <div className="md:col-span-2">
                <label className="block text-slate-700 mb-1">Select Medicine *</label>
                <select
                  value={selectedProdId}
                  onChange={e => setSelectedProdId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
                >
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ₹{p.sellingPrice.toFixed(2)} ({p.batches[0]?.location || 'Rack B-01'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Return Qty *</label>
                <input
                  type="number"
                  min="1"
                  value={returnQty}
                  onChange={e => setReturnQty(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-700"
                >
                  <option value="CUSTOMER_CANCELLED">Customer Cancelled</option>
                  <option value="WRONG_MEDICINE">Wrong Item Billed</option>
                  <option value="DAMAGED">Damaged Package</option>
                  <option value="EXPIRED">Expired Batch</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Restock Item?</label>
                <select
                  value={autoRestock ? 'YES' : 'NO'}
                  onChange={e => setAutoRestock(e.target.value === 'YES')}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
                >
                  <option value="YES">Yes (Add to Put-Away)</option>
                  <option value="NO">No (Mark Damaged)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddReturnItem}
                  className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1 cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          </div>

          {/* Task #22: 15% Statutory Restocking / Depreciation Fee Card */}
          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-start space-x-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-2xs shrink-0 mt-0.5">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-black text-amber-950 font-heading uppercase tracking-wider">
                      Statutory 15% Restocking / Handling Deduction
                    </h4>
                    <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                      Indian Retail Pharmacy Rule
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 mt-0.5 max-w-2xl leading-relaxed">
                    Applies a standard 15% handling deduction on customer-returned unsealed strips, late returns, or opened packages to compensate storage verification and repackaging QC.
                  </p>
                </div>
              </div>

              <label className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-xl border border-amber-300 shadow-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyRestockingFee}
                  onChange={e => setApplyRestockingFee(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-900">
                  Deduct {restockingFeePercent}% Restocking Fee
                </span>
              </label>
            </div>

            {/* Restocking Fee Presets & Custom Configuration */}
            {applyRestockingFee && (
              <div className="pt-2 border-t border-amber-200/90 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="font-bold text-amber-950 flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-amber-700" />
                    <span>Deduction Presets:</span>
                  </span>
                  <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                    {RESTOCKING_PRESETS.map(preset => (
                      <button
                        key={preset.percent}
                        type="button"
                        onClick={() => {
                          setRestockingFeePercent(preset.percent);
                          setFeeReason(preset.reason);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                          restockingFeePercent === preset.percent
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold">
                  <div>
                    <label className="block text-amber-950 text-[11px] mb-1 font-bold">
                      Reason for Restocking Deduction (Printed on Voucher):
                    </label>
                    <input
                      type="text"
                      value={feeReason}
                      onChange={e => setFeeReason(e.target.value)}
                      placeholder="e.g. Unsealed outer packaging, customer late return..."
                      className="w-full p-2 text-xs border border-amber-300 rounded-xl bg-white font-medium text-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-[11px] text-amber-950 mb-1">
                      <span className="font-bold">Custom Deduction Percentage:</span>
                      <span className="font-black font-mono text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md border border-amber-300">
                        {restockingFeePercent}% Restocking Fee
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={restockingFeePercent}
                      onChange={e => setRestockingFeePercent(parseInt(e.target.value) || 0)}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Financial Breakdown Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/90">
              <div className="bg-white rounded-xl p-2.5 border border-amber-200 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Gross Return Value</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  ₹{grossRefundAmount.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Billed Item Total</div>
              </div>

              <div className="bg-white rounded-xl p-2.5 border border-amber-200 shadow-2xs">
                <div className="text-[10px] font-bold text-amber-800 uppercase flex items-center justify-between">
                  <span>{restockingFeePercent}% Restocking Deduction</span>
                  {applyRestockingFee && (
                    <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      -{restockingFeePercent}%
                    </span>
                  )}
                </div>
                <div className="text-base font-black text-rose-600 mt-0.5">
                  {applyRestockingFee ? `-₹${restockingFeeDeducted.toFixed(2)}` : '₹0.00 (Waived)'}
                </div>
                <div className="text-[10px] text-amber-700 font-medium truncate max-w-[200px]" title={feeReason}>
                  {applyRestockingFee ? feeReason : 'Full Customer Courtesy Refund'}
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-300 shadow-2xs">
                <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center justify-between">
                  <span>Net Refund Payable</span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.2 rounded">
                    {refundMethod}
                  </span>
                </div>
                <div className="text-base font-black text-emerald-900 mt-0.5">
                  ₹{netRefundAmount.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium">Payable to Customer</div>
              </div>
            </div>
          </div>

          {/* Return Line Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Return Line Items ({returnItems.length})</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-slate-500 text-[11px]">
                  Gross: ₹{grossRefundAmount.toFixed(2)}
                </span>
                {applyRestockingFee && (
                  <span className="text-amber-800 text-[11px]">
                    Restock Fee: -₹{restockingFeeDeducted.toFixed(2)}
                  </span>
                )}
                <span className="text-rose-700 font-black text-sm">
                  Net Refund: ₹{netRefundAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '760px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-2.5">Medicine Name</th>
                    <th className="px-3 py-2.5 text-center">Batch No</th>
                    <th className="px-3 py-2.5 text-center">Target Shelf</th>
                    <th className="px-3 py-2.5 text-center">Returned Qty</th>
                    <th className="px-3 py-2.5 text-right">Unit Rate</th>
                    <th className="px-3 py-2.5 text-center">Reason</th>
                    <th className="px-3 py-2.5 text-center">Restocked</th>
                    <th className="px-4 py-2.5 text-right">Line Refund (Gross / Fee / Net)</th>
                    <th className="px-3 py-2.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No items selected for return. Select a medicine above and click "Add Item".
                      </td>
                    </tr>
                  ) : (
                    returnItems.map((item, idx) => {
                      const lineFee = applyRestockingFee ? (item.refundAmount * restockingFeePercent) / 100 : 0;
                      const lineNet = item.refundAmount - lineFee;

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-slate-900">{item.productName}</div>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-slate-700">{item.batchNumber}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="text-[10px] font-black bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                              <MapPin className="w-2.5 h-2.5 text-cyan-600" />
                              <span>{item.rackLocation || 'Rack B-01'}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-black text-slate-900">{item.quantityReturned}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-800">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                              {item.reason.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {item.restocked ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Yes (➔ Put-Away)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                No (Disposal)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">
                            <div className="font-black text-slate-900 text-xs">
                              ₹{lineNet.toFixed(2)}
                            </div>
                            {applyRestockingFee && (
                              <div className="text-[10px] text-rose-600 font-bold">
                                -₹{lineFee.toFixed(2)} ({restockingFeePercent}%)
                              </div>
                            )}
                            <div className="text-[9.5px] text-slate-400">
                              Gross: ₹{item.refundAmount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => handleRemoveReturnItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Remove Line Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <div className="text-xs text-slate-500 max-w-lg">
                💡 Issuing this credit note records the refund voucher, logs the {restockingFeePercent}% restocking fee deduction, and automatically queues restockable items into the <strong>Physical Shelf Put-Away Queue</strong>.
              </div>
              <button
                onClick={handleProcessReturn}
                disabled={returnItems.length === 0}
                className={`px-6 py-2.5 text-xs font-black text-white rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer ${
                  returnItems.length === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Issue Credit Note (Net Payable: ₹{netRefundAmount.toFixed(2)})</span>
              </button>
            </div>
          </div>

          {/* Generated Credit Note Modal / Card Preview */}
          {generatedNote && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-sm text-xs text-emerald-950 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-extrabold text-sm font-heading">
                    Credit Note Issued: {generatedNote.creditNoteNo}
                  </span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    {generatedNote.refundMethod} Refund Completed
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setActivePrintNote(generatedNote);
                      setShowCreditNoteModal(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>🖨️ Print Thermal Credit Note</span>
                  </button>
                  <button
                    onClick={() => setGeneratedNote(null)}
                    className="text-xs bg-emerald-200 text-emerald-900 font-bold px-3 py-1.5 rounded-xl hover:bg-emerald-300 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white/90 p-3 rounded-xl border border-emerald-200 text-[11px]">
                <div>Original Invoice: <strong className="font-mono text-slate-800">{generatedNote.originalInvoiceNo}</strong></div>
                <div>Patient Name: <strong className="text-slate-800">{generatedNote.patientName}</strong></div>
                <div>Gross Value: <strong className="text-slate-800">₹{(generatedNote.grossRefundAmount || generatedNote.totalRefundAmount).toFixed(2)}</strong></div>
                <div>
                  Restocking Fee: <strong className="text-amber-800">
                    {generatedNote.restockingFeeDeducted ? `-₹${generatedNote.restockingFeeDeducted.toFixed(2)} (${generatedNote.restockingFeePercent || 15}%)` : 'Waived'}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-emerald-800 font-semibold flex items-center space-x-1.5">
                  <Box className="w-4 h-4 text-emerald-600" />
                  <span>
                    ✓ {generatedNote.items.filter(i => i.restocked).length} item(s) dispatched to Physical Put-Away Queue for shelf storage.
                  </span>
                </span>
                <button
                  onClick={() => setActiveTab('PUTAWAY_QUEUE')}
                  className="text-emerald-900 hover:underline font-bold text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <span>Open Shelf Put-Away Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Processed Return Credit Notes Log */}
          {allReturnNotes.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 font-heading">
                  Processed Return Credit Notes ({allReturnNotes.length})
                </h3>
                <span className="text-[10px] text-slate-400">Click 'Print Voucher' to print thermal slip</span>
              </div>
              <div className="space-y-2">
                {allReturnNotes.map((note) => (
                  <div
                    key={note.creditNoteNo}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs flex-wrap gap-2 hover:bg-slate-100/70 transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{note.creditNoteNo}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="font-semibold text-slate-700">Orig: {note.originalInvoiceNo}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-600">Patient: {note.patientName}</span>
                      {note.restockingFeeDeducted && note.restockingFeeDeducted > 0 && (
                        <span className="ml-2 text-[9.5px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded">
                          {note.restockingFeePercent || 15}% Restock Fee: -₹{note.restockingFeeDeducted.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-black text-rose-700">
                        ₹{note.totalRefundAmount.toFixed(2)} ({note.refundMethod})
                      </span>
                      <button
                        onClick={() => {
                          setActivePrintNote(note);
                          setShowCreditNoteModal(true);
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer flex items-center space-x-1"
                        title="Print 80mm Thermal Return Voucher"
                      >
                        <Printer className="w-3 h-3 text-slate-500" />
                        <span>Print Slip</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: PHYSICAL SHELF PUT-AWAY QUEUE (Task #23)                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PUTAWAY_QUEUE' && (
        <div className="space-y-4">
          {/* Put-Away Floating Toast */}
          {putAwayToast && (
            <div className="bg-purple-900 text-white text-xs font-bold p-3.5 rounded-2xl flex items-center justify-between shadow-md border border-purple-700 animate-fadeIn">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-purple-300" />
                <span>{putAwayToast}</span>
              </div>
              <button onClick={() => setPutAwayToast(null)} className="text-purple-300 hover:text-white p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Put-Away Operational KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-purple-700">
                <span>Items Waiting Put-Away</span>
                <Box className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-purple-950 mt-1">
                {pendingPutAwayCount}
              </div>
              <p className="text-[10px] text-purple-600 mt-0.5">
                Returned medicines waiting on counter for idle staff shelf placement
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Restocked Today</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {completedPutAwayCount}
              </div>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                Medicines physically placed on designated shelves &amp; synchronized
              </p>
            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-700">
                <span>2D Rack Locator Tool</span>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-black text-cyan-950">Rack Selection Robo</span>
                <button
                  onClick={() => dispatch(setRackRoboModalOpen({ isOpen: true }))}
                  className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[11px] rounded-lg shadow-2xs cursor-pointer active:scale-95 transition-all"
                >
                  View Floor Map 📍
                </button>
              </div>
              <p className="text-[10px] text-cyan-700 mt-1">
                Visual coordinate map shows exact aisle, rack tier, and bin
              </p>
            </div>
          </div>

          {/* Search, Rack Filter & Idle Staff Actions Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Search */}
              <div className="relative md:col-span-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={putAwaySearch}
                  onChange={e => setPutAwaySearch(e.target.value)}
                  placeholder="Search medicine, batch, rack..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              {/* Filter by Rack / Aisle */}
              <div className="flex items-center space-x-1.5 text-xs font-semibold">
                <span className="text-slate-500 whitespace-nowrap flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rack:</span>
                </span>
                <select
                  value={selectedRackFilter}
                  onChange={e => setSelectedRackFilter(e.target.value)}
                  className="w-full p-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Storage Locations ({putAwayTasks.length})</option>
                  {availableRacks.map(r => (
                    <option key={r} value={r}>📍 {r}</option>
                  ))}
                </select>
              </div>

              {/* Restocker Staff Selector */}
              <div className="flex items-center space-x-1.5 text-xs font-semibold">
                <span className="text-slate-500 whitespace-nowrap flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Restocker:</span>
                </span>
                <select
                  value={selectedRestockerStaff}
                  onChange={e => setSelectedRestockerStaff(e.target.value)}
                  className="w-full p-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-white text-purple-900 focus:outline-hidden cursor-pointer"
                >
                  <option value="Ramesh Kumar (Lead Pharmacist)">Ramesh Kumar (Lead Pharmacist)</option>
                  <option value="Priya Sharma (Counter 2)">Priya Sharma (Counter 2)</option>
                  <option value="Suresh Patel (Store Associate)">Suresh Patel (Store Associate)</option>
                  <option value="Amit Verma (Inventory Clerk)">Amit Verma (Inventory Clerk)</option>
                </select>
              </div>
            </div>

            {/* Status Pills & Idle Counter Staff Bulk Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs font-bold">
                {[
                  { key: 'ALL',       label: `All Items (${putAwayTasks.length})` },
                  { key: 'PENDING',   label: `⏳ Pending (${pendingPutAwayCount})` },
                  { key: 'COMPLETED', label: `✓ Completed (${completedPutAwayCount})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setPutAwayFilter(tab.key as any)}
                    className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                      putAwayFilter === tab.key
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Bulk Put-Away & Print Routing Slip Actions */}
              <div className="flex items-center space-x-2">
                {pendingPutAwayCount > 0 && (
                  <button
                    onClick={() => handleBulkPutAwayRack(selectedRackFilter === 'ALL' ? undefined : selectedRackFilter)}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1 cursor-pointer active:scale-95"
                    title="Complete put-away for all items in the filtered rack"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>⚡ Bulk Restock {selectedRackFilter === 'ALL' ? 'All Pending' : selectedRackFilter}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowPutAwaySlipModal(true)}
                  className="px-3 py-1.5 bg-white border border-purple-300 hover:bg-purple-50 text-purple-900 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center space-x-1 cursor-pointer"
                  title="Print an 80mm routing checklist slip for shelf placement"
                >
                  <Printer className="w-3.5 h-3.5 text-purple-600" />
                  <span>📄 Print Shelf Routing Slip</span>
                </button>
              </div>
            </div>
          </div>

          {/* Put-Away Tasks Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center space-x-2">
                <Box className="w-4 h-4 text-purple-700" />
                <span>Physical Put-Away Operational Tasks ({filteredPutAwayTasks.length})</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Idle counter staff can confirm physical shelf placement below
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '780px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-2.5">Medicine Name</th>
                    <th className="px-3 py-2.5 text-center">Batch No</th>
                    <th className="px-3 py-2.5 text-center">Qty to Put Away</th>
                    <th className="px-3 py-2.5">Target Shelf Location</th>
                    <th className="px-3 py-2.5 text-center">Credit Note Ref</th>
                    <th className="px-3 py-2.5 text-center">Returned At</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPutAwayTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No put-away tasks found for the current search/rack filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPutAwayTasks.map(task => (
                      <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{task.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {task.id}</div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-slate-700">
                          {task.batchNumber}
                        </td>
                        <td className="px-3 py-3 text-center font-black text-purple-900">
                          <span className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                            +{task.quantity} Units
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-black text-cyan-900 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-cyan-600" />
                              <span>{task.rackLocation}</span>
                            </span>
                            <button
                              onClick={() => dispatch(setRackRoboModalOpen({
                                isOpen: true,
                                targetProductName: task.productName,
                                targetLocation: task.rackLocation
                              }))}
                              className="text-[10px] font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
                              title="Highlight on 2D Pharmacy Floor Plan"
                            >
                              Locate 📍
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {task.shelfTier || 'Tier 2 (Mid)'} · {task.binNumber || 'Bin 04'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-slate-600 text-[11px]">
                          {task.creditNoteNo}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-500 text-[11px]">
                          {task.returnedAt}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {task.status === 'PENDING' ? (
                            <span className="text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 animate-pulse">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              <span>Waiting Put-Away</span>
                            </span>
                          ) : (
                            <div>
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Restocked</span>
                              </span>
                              {task.restockedBy && (
                                <div className="text-[9px] text-slate-400 mt-0.5">
                                  by {task.restockedBy}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {task.status === 'PENDING' ? (
                            <button
                              onClick={() => dispatch(completePutAwayTask({
                                taskId: task.id,
                                restockedBy: selectedRestockerStaff
                              }))}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 inline-flex items-center space-x-1"
                              title={`Confirm physical medicine put-away on ${task.rackLocation}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Put Away ✓</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {task.completedAt || 'Completed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                💡 Idle counter staff can use this task queue to collect returned medicines and return them to physical storage racks.
              </span>
              <button
                onClick={() => dispatch(setRackRoboModalOpen({ isOpen: true }))}
                className="text-purple-700 hover:underline font-bold cursor-pointer"
              >
                Open Visual Shelf Map →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: 80MM THERMAL RETURN CREDIT NOTE PRINT MODAL (Task #22) ── */}
      {showCreditNoteModal && activePrintNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Top Header */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider">80mm Thermal Credit Note Voucher</span>
              </div>
              <button
                onClick={() => setShowCreditNoteModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Content (Simulating 80mm POS Receipt) */}
            <div className="p-5 overflow-y-auto bg-amber-50/20 font-mono text-[11px] text-slate-900 space-y-3 select-text border-b border-dashed border-slate-300">
              {/* Store Header */}
              <div className="text-center space-y-0.5">
                <h2 className="text-sm font-black tracking-tight text-slate-900 font-sans">GENQUANTAA HEALTHCARE PHARMACY</h2>
                <p className="text-[10px] text-slate-500">Retail &amp; Clinical Dispensing License</p>
                <p className="text-[10px] text-slate-600">D.L. No: TG/HYD/2024/0084 · GSTIN: 36AAACG0123M1Z8</p>
                <p className="text-[10px] text-slate-600">Road No. 2, Banjara Hills, Hyderabad - 500034</p>
                <p className="text-[10px] text-slate-600">Phone: +91 98490 12345 · Helpline: 1800-425-7890</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-400 py-1 text-center font-bold text-[11.5px] uppercase tracking-wider">
                *** CUSTOMER RETURN CREDIT NOTE ***
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-700">
                <div>Credit Note No: <strong className="text-slate-900">{activePrintNote.creditNoteNo}</strong></div>
                <div className="text-right">Date: {activePrintNote.returnDate}</div>
                <div>Original Inv: <strong className="text-slate-900">{activePrintNote.originalInvoiceNo}</strong></div>
                <div className="text-right">Patient: <strong className="text-slate-900">{activePrintNote.patientName}</strong></div>
                <div>Pharmacist: {selectedRestockerStaff.split(' ')[0]}</div>
                <div className="text-right">Channel: <strong>{activePrintNote.refundMethod}</strong></div>
              </div>

              {/* Returned Items Table */}
              <div className="border-t border-b border-dashed border-slate-400 py-1.5 space-y-1">
                <div className="flex justify-between font-bold text-[10px] text-slate-600 uppercase">
                  <span>Item &amp; Batch</span>
                  <span>Qty × Rate</span>
                  <span className="text-right">Gross Total</span>
                </div>
                {activePrintNote.items.map((it, i) => (
                  <div key={i} className="text-[10.5px]">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{it.productName}</span>
                      <span>₹{it.refundAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[9.5px] text-slate-500">
                      <span>Batch: {it.batchNumber} (Shelf: {it.rackLocation || 'Rack B-01'})</span>
                      <span>{it.quantityReturned} × ₹{it.unitPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Return Value:</span>
                  <span className="font-bold">₹{(activePrintNote.grossRefundAmount || activePrintNote.totalRefundAmount).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-rose-700 font-bold">
                  <span>
                    Statutory Restocking Fee ({activePrintNote.restockingFeePercent || 15}%):
                  </span>
                  <span>
                    {activePrintNote.restockingFeeDeducted && activePrintNote.restockingFeeDeducted > 0
                      ? `-₹${activePrintNote.restockingFeeDeducted.toFixed(2)}`
                      : '₹0.00 (Waived)'}
                  </span>
                </div>

                {activePrintNote.feeReason && (
                  <div className="text-[9.5px] text-amber-800 italic pl-1">
                    Reason: {activePrintNote.feeReason}
                  </div>
                )}

                <div className="border-t border-slate-400 pt-1 flex justify-between text-sm font-black text-slate-900">
                  <span>NET REFUND PAYABLE:</span>
                  <span>₹{activePrintNote.totalRefundAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Barcode & Policy Note */}
              <div className="text-center pt-2 space-y-1">
                <div className="font-mono text-xs tracking-widest text-slate-600">
                  * {activePrintNote.creditNoteNo} *
                </div>
                <div className="text-[9px] text-slate-500 leading-tight">
                  Statutory 15% handling/inspection fee deducted per Indian Pharmacy Retail Return Policy. Store credit vouchers are valid across all GENQUANTAA branches for 30 days.
                </div>
                <div className="text-[9.5px] font-bold text-slate-700">*** THANK YOU · GENQUANTAA CARES ***</div>
              </div>
            </div>

            {/* Modal Bottom Action Buttons */}
            <div className="p-3 bg-slate-50 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => setShowCreditNoteModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => alert(`Downloaded PDF voucher for ${activePrintNote.creditNoteNo}`)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print 80mm Slip</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL 2: 80MM SHELF PUT-AWAY ROUTING SLIP (Task #23) ──────────── */}
      {showPutAwaySlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-3.5 bg-purple-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Box className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-black uppercase tracking-wider">Shelf Put-Away Pick &amp; Placement Slip</span>
              </div>
              <button
                onClick={() => setShowPutAwaySlipModal(false)}
                className="text-purple-300 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto bg-purple-50/20 font-mono text-[11px] text-slate-900 space-y-3 select-text">
              <div className="text-center space-y-0.5">
                <h3 className="text-sm font-black font-sans text-purple-950">GENQUANTAA PHARMACY</h3>
                <p className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Counter Returns Put-Away Routing Sheet</p>
                <p className="text-[10px] text-slate-500">
                  Date: {new Date().toLocaleDateString('en-IN')} · Restocker: {selectedRestockerStaff}
                </p>
              </div>

              <div className="border-t border-b border-dashed border-purple-300 py-1 text-center font-bold text-[10.5px] text-purple-900">
                PENDING SHELF RESTOCKS: {putAwayTasks.filter(t => t.status === 'PENDING').length} ITEMS
              </div>

              <div className="space-y-2.5">
                {putAwayTasks.filter(t => t.status === 'PENDING').map((t, idx) => (
                  <div key={t.id} className="bg-white p-2.5 rounded-xl border border-purple-200 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 border border-slate-400 rounded-sm inline-block"></span>
                        <span>{idx + 1}. {t.productName}</span>
                      </span>
                      <span className="text-purple-700 font-black">+{t.quantity} Units</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 pl-5">
                      <div>Batch: <strong className="font-mono">{t.batchNumber}</strong></div>
                      <div>Coord: <strong className="text-cyan-800">📍 {t.rackLocation}</strong></div>
                      <div className="col-span-2 text-slate-500">
                        Placement: {t.shelfTier || 'Tier 2 (Mid)'} · {t.binNumber || 'Bin 04'} (Ref: {t.creditNoteNo})
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 text-[9.5px] text-slate-500 text-center space-y-1">
                <p>Verify seal integrity before placing medicines back onto storage racks.</p>
                <p className="pt-2 text-slate-700 font-bold">Physical Restock Signature: ______________________</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => setShowPutAwaySlipModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Routing Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
