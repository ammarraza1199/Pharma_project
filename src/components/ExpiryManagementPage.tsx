import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { markStockDisposed, navigateTo } from '../store/posSlice';
import type { Product, BatchInfo, DisposalRecord } from '../types/pos';
import {
  AlertCircle, Clock, Trash2, ShieldAlert,
  Calendar, Layers, X, PackageX
} from 'lucide-react';

type ExpiryFilterTab = 'EXPIRED' | 'NEAR_3' | 'NEAR_7' | 'NEAR_20' | 'NEAR_30' | 'NEAR_60';

interface BatchRow {
  product: Product;
  batch: BatchInfo;
  daysLeft: number;
  isExpired: boolean;
}

export const ExpiryManagementPage: React.FC = () => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.pos.products);
  const disposalRecords = useSelector((state: RootState) => state.pos.disposalRecords);

  const [activeTab, setActiveTab] = useState<ExpiryFilterTab>('NEAR_30');

  // Disposal Modal State
  const [targetBatchRow, setTargetBatchRow] = useState<BatchRow | null>(null);
  const [disposalReason, setDisposalReason] = useState<'EXPIRED' | 'DAMAGED_PACKAGING' | 'RECALLED_BY_GOVT'>('EXPIRED');
  const [managerPin, setManagerPin] = useState<string>('');
  const [disposalQty, setDisposalQty] = useState<number>(1);

  // Compute all batch rows across products with days left
  const now = new Date();
  const allBatchRows: BatchRow[] = [];

  products.forEach(p => {
    p.batches.forEach(b => {
      const expDate = new Date(b.expiryDate);
      const diffTime = expDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      allBatchRows.push({
        product: p,
        batch: b,
        daysLeft,
        isExpired: daysLeft <= 0
      });
    });
  });

  // Filter batch rows
  const expiredBatches = allBatchRows.filter(r => r.isExpired);
  const near3Batches   = allBatchRows.filter(r => r.daysLeft > 0 && r.daysLeft <= 3);
  const near7Batches   = allBatchRows.filter(r => r.daysLeft > 3 && r.daysLeft <= 7);
  const near20Batches  = allBatchRows.filter(r => r.daysLeft > 7 && r.daysLeft <= 20);
  const near30Batches  = allBatchRows.filter(r => r.daysLeft > 0 && r.daysLeft <= 30);
  const near60Batches  = allBatchRows.filter(r => r.daysLeft > 30 && r.daysLeft <= 60);

  const displayedRows =
    activeTab === 'EXPIRED'  ? expiredBatches :
    activeTab === 'NEAR_3'   ? near3Batches :
    activeTab === 'NEAR_7'   ? near7Batches :
    activeTab === 'NEAR_20'  ? near20Batches :
    activeTab === 'NEAR_30'  ? near30Batches :
    near60Batches;

  // Total loss calculation
  const totalExpiredLoss = expiredBatches.reduce((sum, r) => sum + (r.batch.stockQuantity * r.product.sellingPrice), 0);
  const totalNear30Loss  = near30Batches.reduce((sum, r) => sum + (r.batch.stockQuantity * r.product.sellingPrice), 0);

  const handleOpenDisposal = (row: BatchRow) => {
    setTargetBatchRow(row);
    setDisposalQty(row.batch.stockQuantity);
    setManagerPin('');
    setDisposalReason(row.isExpired ? 'EXPIRED' : 'DAMAGED_PACKAGING');
  };

  const handleConfirmDisposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBatchRow) return;

    if (managerPin !== '1234') {
      alert('INVALID MANAGER PIN! Authorized Store Manager PIN required for stock disposal.');
      return;
    }

    const record: DisposalRecord = {
      disposalId: `disp-${Date.now()}`,
      productId: targetBatchRow.product._id,
      productName: targetBatchRow.product.name,
      batchNumber: targetBatchRow.batch.batchNumber,
      quantityDisposed: disposalQty,
      disposalDate: new Date().toLocaleDateString('en-IN'),
      reason: disposalReason,
      disposedBy: 'Pharmacist (Chief Pharmacist)',
      approvalManagerPin: managerPin
    };

    dispatch(markStockDisposed(record));
    setTargetBatchRow(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Clock className="w-6 h-6 text-amber-600" />
            <span>Expiry &amp; Stock Disposal Management</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor batch expiry timelines, manage clearance discounts &amp; authorize safe pharmacy disposals
          </p>
        </div>

        <button
          onClick={() => dispatch(navigateTo('INVENTORY'))}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>View Full Inventory</span>
        </button>
      </div>

      {/* ── KPI METRICS CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Expired Batches */}
        <div className="bg-white rounded-2xl border border-rose-200 p-3.5 shadow-xs flex items-center space-x-3 bg-rose-50/30">
          <div className="bg-rose-100 p-2.5 rounded-xl text-rose-700">
            <PackageX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expired Batches</p>
            <h3 className="text-xl font-black text-rose-700 font-heading">{expiredBatches.length} Batches</h3>
            <p className="text-[10px] text-rose-600 font-bold">₹{totalExpiredLoss.toFixed(2)} value</p>
          </div>
        </div>

        {/* Near Expiry (< 30 Days) */}
        <div className="bg-white rounded-2xl border border-amber-200 p-3.5 shadow-xs flex items-center space-x-3 bg-amber-50/30">
          <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Near Expiry (&lt;30 Days)</p>
            <h3 className="text-xl font-black text-amber-700 font-heading">{near30Batches.length} Batches</h3>
            <p className="text-[10px] text-amber-600 font-bold">₹{totalNear30Loss.toFixed(2)} value</p>
          </div>
        </div>

        {/* Expiring (< 60 Days) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiring (&lt;60 Days)</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{near60Batches.length} Batches</h3>
          </div>
        </div>

        {/* Disposed Count */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-violet-100 p-2.5 rounded-xl text-violet-700">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disposed Batches Log</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{disposalRecords.length} Records</h3>
          </div>
        </div>
      </div>

      {/* ── FILTER TABS (SINGLE ROW) ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* 1. Expired */}
          <button
            onClick={() => setActiveTab('EXPIRED')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'EXPIRED'
                ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                : 'bg-rose-50/70 border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="text-xs leading-none">🚨</span>
              <span>Expired</span>
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              activeTab === 'EXPIRED' ? 'bg-white/25 text-white' : 'bg-rose-600 text-white'
            }`}>
              {expiredBatches.length}
            </span>
          </button>

          {/* 2. < 3 Days */}
          <button
            onClick={() => setActiveTab('NEAR_3')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'NEAR_3'
                ? 'bg-red-600 border-red-600 text-white shadow-xs'
                : 'bg-red-50/70 border-red-200 text-red-700 hover:bg-red-100'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
              <span>&lt; 3 Days</span>
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              activeTab === 'NEAR_3' ? 'bg-white/25 text-white' : near3Batches.length > 0 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {near3Batches.length}
            </span>
          </button>

          {/* 3. < 7 Days */}
          <button
            onClick={() => setActiveTab('NEAR_7')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'NEAR_7'
                ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                : 'bg-orange-50/70 border-orange-200 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
              <span>&lt; 7 Days</span>
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              activeTab === 'NEAR_7' ? 'bg-white/25 text-white' : near7Batches.length > 0 ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {near7Batches.length}
            </span>
          </button>

          {/* 4. < 20 Days */}
          <button
            onClick={() => setActiveTab('NEAR_20')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'NEAR_20'
                ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                : 'bg-amber-50/70 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
              <span>&lt; 20 Days</span>
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              activeTab === 'NEAR_20' ? 'bg-white/25 text-white' : near20Batches.length > 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {near20Batches.length}
            </span>
          </button>

          {/* 5. < 30 Days */}
          <button
            onClick={() => setActiveTab('NEAR_30')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'NEAR_30'
                ? 'bg-yellow-500 border-yellow-500 text-white shadow-xs'
                : 'bg-yellow-50/70 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
              <span>&lt; 30 Days</span>
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              activeTab === 'NEAR_30' ? 'bg-white/25 text-white' : near3Batches.length > 0 ? 'bg-yellow-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {near3Batches.length}
            </span>
          </button>

          {/* 6. < 60 Days (Green / Emerald) */}
          <button
            onClick={() => setActiveTab('NEAR_60')}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'NEAR_60'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>&lt; 60 Days</span>
            </span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              activeTab === 'NEAR_60' ? 'bg-white/25 text-white' : near60Batches.length > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {near60Batches.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── BATCH EXPIRY TIMELINE TABLE ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
          <span>Batches in category ({displayedRows.length})</span>
          <span className="text-slate-400">Manage expiry discounts or authorize safe disposal</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '800px' }}>
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">Medicine &amp; Salt</th>
                <th className="px-3 py-3 text-center">Batch No</th>
                <th className="px-3 py-3 text-center">Expiry Date</th>
                <th className="px-3 py-3 text-center">Timeline</th>
                <th className="px-3 py-3 text-center">Stock Qty</th>
                <th className="px-3 py-3 text-right">Selling Price</th>
                <th className="px-3 py-3 text-right">Total Loss Value</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No medicine batches found in this expiry category.
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, idx) => {
                  const lossVal = row.batch.stockQuantity * row.product.sellingPrice;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{row.product.name}</div>
                        <div className="text-[10px] text-slate-500">{row.product.saltComposition}</div>
                      </td>

                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-800">
                        {row.batch.batchNumber}
                      </td>

                      <td className="px-3 py-3 text-center font-bold">
                        {row.batch.expiryDate}
                      </td>

                      <td className="px-3 py-3 text-center">
                        {row.isExpired ? (
                          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                            EXPIRED ({Math.abs(row.daysLeft)} days ago)
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            row.daysLeft <= 30 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {row.daysLeft} days left
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center font-black text-slate-900 text-sm">
                        {row.batch.stockQuantity}
                      </td>

                      <td className="px-3 py-3 text-right font-bold text-slate-800">
                        ₹{row.product.sellingPrice.toFixed(2)}
                      </td>

                      <td className="px-3 py-3 text-right font-black text-rose-700">
                        ₹{lossVal.toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenDisposal(row)}
                          className="flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all mx-auto cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Dispose Stock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AUTHORIZE DISPOSAL MODAL ───────────────────────────────────── */}
      {targetBatchRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-modal rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-rose-700">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-extrabold font-heading text-slate-900">
                  Authorize Pharmacy Stock Disposal
                </h3>
              </div>
              <button onClick={() => setTargetBatchRow(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDisposal} className="space-y-4 text-xs font-semibold">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 space-y-1">
                <p className="font-bold">{targetBatchRow.product.name}</p>
                <p className="text-[11px]">
                  Batch: <strong className="font-mono">{targetBatchRow.batch.batchNumber}</strong> · Exp: {targetBatchRow.batch.expiryDate}
                </p>
                <p className="text-[11px]">
                  Available Batch Stock: <strong>{targetBatchRow.batch.stockQuantity} units</strong>
                </p>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Quantity to Dispose *</label>
                <input
                  type="number"
                  min="1"
                  max={targetBatchRow.batch.stockQuantity}
                  value={disposalQty}
                  onChange={e => setDisposalQty(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Disposal Reason *</label>
                <select
                  value={disposalReason}
                  onChange={e => setDisposalReason(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold"
                >
                  <option value="EXPIRED">Expired Medicine (Passed Expiry Date)</option>
                  <option value="DAMAGED_PACKAGING">Damaged Packaging / Contaminated</option>
                  <option value="RECALLED_BY_GOVT">Recalled by Drug Authority</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Enter 4-Digit Manager PIN (Default: 1234) *</label>
                <input
                  type="password"
                  maxLength={4}
                  value={managerPin}
                  onChange={e => setManagerPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center text-lg font-black tracking-widest p-2 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTargetBatchRow(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Authorize &amp; Remove Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DISPOSAL AUDIT LOG TABLE ──────────────────────────────────── */}
      {disposalRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 font-heading">
            Pharmacy Stock Disposal Audit Log ({disposalRecords.length})
          </h3>
          <div className="space-y-2">
            {disposalRecords.map(rec => (
              <div key={rec.disposalId} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900">{rec.productName}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="font-mono text-slate-700">Batch: {rec.batchNumber}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-rose-700 font-bold">{rec.quantityDisposed} units disposed</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-slate-500">Reason: {rec.reason}</span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>Disposed on {rec.disposalDate} by {rec.disposedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
