import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { processReturnCreditNote, navigateTo } from '../store/posSlice';
import type { ReturnItem, ReturnCreditNote } from '../types/pos';
import api from '../utils/api';
import {
  RotateCcw, CheckCircle2, FileText,
  ShoppingBag, Plus, Trash2
} from 'lucide-react';

export const ReturnsPage: React.FC = () => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.pos.products);
  const returnNotes = useSelector((state: RootState) => state.pos.returnNotes);

  // Form State
  const [invoiceNo, setInvoiceNo] = useState<string>('INV-2026-841201');
  const [patientName, setPatientName] = useState<string>('Ramesh Kumar');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'UPI' | 'STORE_CREDIT'>('CASH');

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
    const refundAmt = Number((selectedProduct.sellingPrice * returnQty).toFixed(2));

    const newItem: ReturnItem = {
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      batchNumber: batch,
      quantityReturned: returnQty,
      unitPrice: selectedProduct.sellingPrice,
      refundAmount: refundAmt,
      reason: returnReason,
      restocked: autoRestock
    };

    setReturnItems(prev => [...prev, newItem]);
    setReturnQty(1);
  };

  const handleRemoveReturnItem = (idx: number) => {
    setReturnItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalRefundAmount = returnItems.reduce((sum, item) => sum + item.refundAmount, 0);

  const handleProcessReturn = async () => {
    if (returnItems.length === 0) {
      alert('Please add at least one medicine item to process the return!');
      return;
    }

    const payload = {
      originalInvoiceNo: invoiceNo,
      patientName: patientName || 'Walk-in Customer',
      items: returnItems,
      totalRefundAmount: Number(totalRefundAmount.toFixed(2)),
      refundMethod
    };

    try {
      const res = await api.post('/returns', payload);
      const creditNote = res.data.data;
      dispatch(processReturnCreditNote(creditNote));
      setGeneratedNote(creditNote);
      setReturnItems([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to process return');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <RotateCcw className="w-6 h-6 text-rose-600" />
            <span>Medicine Returns &amp; Refund Credit Notes</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Process customer medicine returns, calculate refunds, update stock &amp; issue Credit Notes
          </p>
        </div>

        <button
          onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Back to POS Terminal</span>
        </button>
      </div>

      {/* ── INVOICE LOOKUP & PATIENT HEADER ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">
          Original Bill / Invoice Lookup
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
                placeholder="INV-2026-841201"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
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
              className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
            >
              <option value="CASH">Cash Refund</option>
              <option value="UPI">Instant UPI Refund</option>
              <option value="STORE_CREDIT">Store Credit Voucher</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── SELECT MEDICINES TO RETURN FORM ───────────────────────────── */}
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
              className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
            >
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₹{p.sellingPrice.toFixed(2)}
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
              className="w-full p-2 border border-slate-300 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Reason for Return</label>
            <select
              value={returnReason}
              onChange={e => setReturnReason(e.target.value as any)}
              className="w-full p-2 border border-slate-300 rounded-xl bg-white font-medium"
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
              <option value="YES">Yes (Add to Stock)</option>
              <option value="NO">No (Mark Damaged)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddReturnItem}
              className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Return</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── RETURN ITEMS TABLE & CREDIT NOTE SUMMARY ─────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
          <span>Return Line Items ({returnItems.length})</span>
          <span className="text-rose-700 font-extrabold text-sm">
            Total Refund Amount: ₹{totalRefundAmount.toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '650px' }}>
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-2.5">Medicine Name</th>
                <th className="px-3 py-2.5 text-center">Batch No</th>
                <th className="px-3 py-2.5 text-center">Returned Qty</th>
                <th className="px-3 py-2.5 text-right">Unit Rate</th>
                <th className="px-3 py-2.5 text-center">Reason</th>
                <th className="px-3 py-2.5 text-center">Restocked</th>
                <th className="px-4 py-2.5 text-right">Refund Line Total</th>
                <th className="px-3 py-2.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returnItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No items selected for return. Select a medicine above and click "Add to Return".
                  </td>
                </tr>
              ) : (
                returnItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{item.productName}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-700">{item.batchNumber}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-900">{item.quantityReturned}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {item.reason.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {item.restocked ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Yes (+Stock)</span>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">No (Disposed)</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-rose-700">₹{item.refundAmount.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => handleRemoveReturnItem(idx)} className="text-slate-400 hover:text-rose-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Issuing credit note records refund transaction and updates inventory stock instantly.
          </span>
          <button
            onClick={handleProcessReturn}
            disabled={returnItems.length === 0}
            className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer ${
              returnItems.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Issue Credit Note &amp; Process Refund (₹{totalRefundAmount.toFixed(2)})</span>
          </button>
        </div>
      </div>

      {/* ── GENERATED CREDIT NOTE MODAL PREVIEW ───────────────────────── */}
      {generatedNote && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-sm flex justify-between items-center text-xs text-emerald-900">
          <div>
            <div className="font-extrabold text-sm font-heading flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Credit Note Issued: {generatedNote.creditNoteNo}</span>
            </div>
            <p className="mt-1">
              Original Inv: <strong>{generatedNote.originalInvoiceNo}</strong> · Patient: <strong>{generatedNote.patientName}</strong> · Total Refund: <strong className="text-emerald-800 font-bold">₹{generatedNote.totalRefundAmount.toFixed(2)}</strong> via {generatedNote.refundMethod}
            </p>
          </div>
          <button
            onClick={() => setGeneratedNote(null)}
            className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── RECENT CREDIT NOTES LOG TABLE ───────────────────────────── */}
      {returnNotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 font-heading">
            Processed Return Credit Notes ({returnNotes.length})
          </h3>
          <div className="space-y-2">
            {returnNotes.map((note) => (
              <div key={note.creditNoteNo} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-800">{note.creditNoteNo}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="font-semibold text-slate-700">Orig Inv: {note.originalInvoiceNo}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-slate-600">Patient: {note.patientName}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-700">₹{note.totalRefundAmount.toFixed(2)} ({note.refundMethod})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
