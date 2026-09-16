import React, { useState } from 'react';
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
  ArrowRight, ShieldCheck, Printer, Search
} from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.pos.products);
  const returnNotes = useSelector((state: RootState) => state.pos.returnNotes);
  const putAwayTasks = useSelector((state: RootState) => state.pos.putAwayTasks || []);
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);

  // Tab State
  const [activeTab, setActiveTab] = useState<'RETURN_FORM' | 'PUTAWAY_QUEUE'>('RETURN_FORM');

  // Form State
  const [invoiceNo, setInvoiceNo] = useState<string>('INV-2026-841201');
  const [patientName, setPatientName] = useState<string>('Ramesh Kumar');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'UPI' | 'STORE_CREDIT'>('CASH');
  const [invoiceLookupLoading, setInvoiceLookupLoading] = useState<boolean>(false);

  // Task #22: 15% Restocking Fee State
  const [applyRestockingFee, setApplyRestockingFee] = useState<boolean>(true);
  const [restockingFeePercent, setRestockingFeePercent] = useState<number>(15);

  // Task #23: Put-Away Search & Filter
  const [putAwaySearch, setPutAwaySearch] = useState<string>('');
  const [putAwayFilter, setPutAwayFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

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

    dispatch(processReturnCreditNote(creditNote));
    setGeneratedNote(creditNote);
    setReturnItems([]);
  };

  // Put-Away Tasks Filtering
  const pendingPutAwayCount = putAwayTasks.filter(t => t.status === 'PENDING').length;
  const completedPutAwayCount = putAwayTasks.filter(t => t.status === 'COMPLETED').length;

  const filteredPutAwayTasks = putAwayTasks.filter(t => {
    if (putAwayFilter !== 'ALL' && t.status !== putAwayFilter) return false;
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
          <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-start space-x-2.5">
                <Percent className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-black text-amber-950 font-heading">
                      Statutory 15% Restocking / Depreciation Fee
                    </h4>
                    <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      Pharma Retail Policy
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5 max-w-2xl leading-relaxed">
                    Applies a standard 15% handling deduction on customer-returned unsealed strips, late returns, or opened packages to compensate storage and verification inspection.
                  </p>
                </div>
              </div>

              <label className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyRestockingFee}
                  onChange={e => setApplyRestockingFee(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-800">
                  Deduct {restockingFeePercent}% Restocking Fee
                </span>
              </label>
            </div>

            {/* Financial Breakdown Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-amber-200/80">
              <div className="bg-white rounded-xl p-2.5 border border-amber-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Gross Return Value</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  ₹{grossRefundAmount.toFixed(2)}
                </div>
              </div>

              <div className="bg-white rounded-xl p-2.5 border border-amber-200">
                <div className="text-[10px] font-bold text-amber-700 uppercase flex items-center justify-between">
                  <span>15% Handling Deduction</span>
                  {applyRestockingFee && <span className="text-[9px] bg-amber-100 px-1.5 py-0.2 rounded font-mono">-15%</span>}
                </div>
                <div className="text-sm font-black text-rose-600 mt-0.5">
                  {applyRestockingFee ? `-₹${restockingFeeDeducted.toFixed(2)}` : '₹0.00 (Waived)'}
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-300">
                <div className="text-[10px] font-bold text-emerald-800 uppercase">Net Payable Refund</div>
                <div className="text-sm font-black text-emerald-900 mt-0.5">
                  ₹{netRefundAmount.toFixed(2)}
                </div>
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
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '700px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-2.5">Medicine Name</th>
                    <th className="px-3 py-2.5 text-center">Batch No</th>
                    <th className="px-3 py-2.5 text-center">Target Shelf</th>
                    <th className="px-3 py-2.5 text-center">Returned Qty</th>
                    <th className="px-3 py-2.5 text-right">Unit Rate</th>
                    <th className="px-3 py-2.5 text-center">Reason</th>
                    <th className="px-3 py-2.5 text-center">Restocked</th>
                    <th className="px-4 py-2.5 text-right">Line Total</th>
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
                    returnItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{item.productName}</td>
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
                        <td className="px-4 py-2.5 text-right font-black text-slate-900">₹{item.refundAmount.toFixed(2)}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <div className="text-xs text-slate-500 max-w-lg">
                💡 Issuing this credit note records the refund voucher, logs the 15% restocking fee deduction, and automatically queues restockable items into the <strong>Physical Shelf Put-Away Queue</strong>.
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-extrabold text-sm font-heading">
                    Credit Note Issued: {generatedNote.creditNoteNo}
                  </span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    {generatedNote.refundMethod} Refund Completed
                  </span>
                </div>
                <button
                  onClick={() => setGeneratedNote(null)}
                  className="text-xs bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-800 cursor-pointer"
                >
                  Dismiss Preview
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white/80 p-3 rounded-xl border border-emerald-200 text-[11px]">
                <div>Original Invoice: <strong className="font-mono text-slate-800">{generatedNote.originalInvoiceNo}</strong></div>
                <div>Patient Name: <strong className="text-slate-800">{generatedNote.patientName}</strong></div>
                <div>Gross Value: <strong className="text-slate-800">₹{(generatedNote.grossRefundAmount || generatedNote.totalRefundAmount).toFixed(2)}</strong></div>
                <div>
                  Restocking Fee: <strong className="text-amber-800">
                    {generatedNote.restockingFeeDeducted ? `-₹${generatedNote.restockingFeeDeducted.toFixed(2)} (15%)` : 'Waived'}
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
          {returnNotes.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 font-heading">
                Processed Return Credit Notes ({returnNotes.length})
              </h3>
              <div className="space-y-2">
                {returnNotes.map((note) => (
                  <div
                    key={note.creditNoteNo}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs flex-wrap gap-2"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800">{note.creditNoteNo}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="font-semibold text-slate-700">Orig: {note.originalInvoiceNo}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-600">Patient: {note.patientName}</span>
                      {note.restockingFeeDeducted && note.restockingFeeDeducted > 0 && (
                        <span className="ml-2 text-[9.5px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                          15% Fee: -₹{note.restockingFeeDeducted.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-black text-rose-700">
                        ₹{note.totalRefundAmount.toFixed(2)} ({note.refundMethod})
                      </span>
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
                Returned medicines waiting on counter to be placed on storage racks
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

          {/* Search and Status Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={putAwaySearch}
                onChange={e => setPutAwaySearch(e.target.value)}
                placeholder="Search by medicine, batch, rack (e.g. Rack B-14)..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-bold">
              {[
                { key: 'ALL',       label: `All Items (${putAwayTasks.length})` },
                { key: 'PENDING',   label: `⏳ Pending (${pendingPutAwayCount})` },
                { key: 'COMPLETED', label: `✓ Completed (${completedPutAwayCount})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setPutAwayFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    putAwayFilter === tab.key
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
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
                Returned items waiting for staff shelf placement
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '750px' }}>
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
                        No put-away tasks found for the current search filter.
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
                            {task.quantity} Units
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
                                restockedBy: currentUser?.pharmacistName || 'Staff Restocker'
                              }))}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 inline-flex items-center space-x-1"
                              title="Confirm physical medicine put-away on shelf"
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

    </div>
  );
};
