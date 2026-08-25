import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  addProduct,
  updateProduct,
  navigateTo,
  applyDumpClearanceDiscount,
  applyBulk30DayDumpClearance
} from '../store/posSlice';
import type { Product, ScheduleCategory, StockStatus, BatchInfo } from '../types/pos';
import {
  Package, Search, Plus, Filter, AlertTriangle, PackageX,
  TrendingUp, Edit3, X, Truck, Layers, Percent, Clock,
  Sparkles, CheckCircle2, RotateCcw, Share2, MessageCircle, BarChart3
} from 'lucide-react';

interface DumpBatchRow {
  product: Product;
  batch: BatchInfo;
  daysLeft: number;
  stockValue: number;
}

export const InventoryPage: React.FC = () => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.pos.products);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'DUMP_STOCK' | StockStatus>('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | ScheduleCategory>('ALL');

  // Modal State for Add/Edit Medicine
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Clearance Modal State
  const [showClearanceModal, setShowClearanceModal] = useState<boolean>(false);
  const [selectedDumpBatch, setSelectedDumpBatch] = useState<DumpBatchRow | null>(null);
  const [clearanceDiscountInput, setClearanceDiscountInput] = useState<number>(30);
  const [bulkDiscountInput, setBulkDiscountInput] = useState<number>(30);
  const [clearanceSuccessMessage, setClearanceSuccessMessage] = useState<string | null>(null);

  // Form State for Add/Edit
  const [formName, setFormName] = useState<string>('');
  const [formBrand, setFormBrand] = useState<string>('');
  const [formSalt, setFormSalt] = useState<string>('');
  const [formBarcode, setFormBarcode] = useState<string>('');
  const [formHsn, setFormHsn] = useState<string>('');
  const [formGst, setFormGst] = useState<number>(12);
  const [formMRP, setFormMRP] = useState<number>(100);
  const [formPrice, setFormPrice] = useState<number>(90);
  const [formMargin, setFormMargin] = useState<number>(20);
  const [formSchedule, setFormSchedule] = useState<ScheduleCategory>('REGULAR');
  const [formBatchNo, setFormBatchNo] = useState<string>('BT-2026-01');
  const [formExpiry, setFormExpiry] = useState<string>('2026-12-31');
  const [formInitialStock, setFormInitialStock] = useState<number>(50);
  const [formRack, setFormRack] = useState<string>('Rack A-01');

  // ── 30-Day Dump Stock Calculations ──────────────────────────────────────
  const now = new Date();
  const dumpBatches = useMemo(() => {
    const list: DumpBatchRow[] = [];
    products.forEach(p => {
      p.batches.forEach(b => {
        const exp = new Date(b.expiryDate);
        const diffTime = exp.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if ((daysLeft > 0 && daysLeft <= 30) || b.isDumpStock) {
          list.push({
            product: p,
            batch: b,
            daysLeft,
            stockValue: b.stockQuantity * p.sellingPrice
          });
        }
      });
    });
    return list;
  }, [products]);

  const totalDumpUnits = dumpBatches.reduce((sum, d) => sum + d.batch.stockQuantity, 0);
  const totalDumpValue = dumpBatches.reduce((sum, d) => sum + d.stockValue, 0);

  // KPI Calculations
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.totalStock, 0);
  const lowStockCount = products.filter(p => p.stockStatus === 'LOW_STOCK' || (p.totalStock > 0 && p.totalStock <= 20)).length;
  const outOfStockCount = products.filter(p => p.stockStatus === 'OUT_OF_STOCK' || p.totalStock === 0).length;

  // Filtered Products List
  const filteredProducts = products.filter(p => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const match =
        p.name.toLowerCase().includes(term) ||
        p.saltComposition.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.barcode.includes(term) ||
        p.hsnCode.includes(term) ||
        p.batches.some(b => b.batchNumber.toLowerCase().includes(term));
      if (!match) return false;
    }

    if (stockFilter === 'DUMP_STOCK') {
      const hasDumpBatch = p.batches.some(b => {
        const exp = new Date(b.expiryDate);
        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return (daysLeft > 0 && daysLeft <= 30) || b.isDumpStock;
      });
      if (!hasDumpBatch) return false;
    } else if (stockFilter !== 'ALL' && p.stockStatus !== stockFilter) {
      return false;
    }

    if (scheduleFilter !== 'ALL' && p.scheduleCategory !== scheduleFilter) return false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBrand('');
    setFormSalt('');
    setFormBarcode(`8901234${Math.floor(100000 + Math.random() * 900000)}`);
    setFormHsn('30049060');
    setFormGst(12);
    setFormMRP(100);
    setFormPrice(90);
    setFormMargin(20);
    setFormSchedule('REGULAR');
    setFormBatchNo(`BT-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormExpiry('2027-06-30');
    setFormInitialStock(50);
    setFormRack('Rack A-01');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBrand(p.brand);
    setFormSalt(p.saltComposition);
    setFormBarcode(p.barcode);
    setFormHsn(p.hsnCode);
    setFormGst(p.gstRate);
    setFormMRP(p.unitMRP);
    setFormPrice(p.sellingPrice);
    setFormMargin(p.grossMarginPercent);
    setFormSchedule(p.scheduleCategory);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      dispatch(updateProduct({
        ...editingProduct,
        name: formName,
        brand: formBrand,
        saltComposition: formSalt,
        barcode: formBarcode,
        hsnCode: formHsn,
        gstRate: formGst,
        unitMRP: formMRP,
        sellingPrice: formPrice,
        grossMarginPercent: formMargin,
        scheduleCategory: formSchedule
      }));
    } else {
      const newProduct: Product = {
        _id: `prod-${Date.now()}`,
        name: formName,
        brand: formBrand,
        saltComposition: formSalt,
        barcode: formBarcode,
        hsnCode: formHsn,
        gstRate: formGst,
        unitMRP: formMRP,
        sellingPrice: formPrice,
        grossMarginPercent: formMargin,
        scheduleCategory: formSchedule,
        stockStatus: formInitialStock > 20 ? 'IN_STOCK' : formInitialStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
        totalStock: formInitialStock,
        batches: formInitialStock > 0 ? [{
          batchNumber: formBatchNo,
          expiryDate: formExpiry,
          stockQuantity: formInitialStock,
          location: formRack,
          mrp: formMRP
        }] : []
      };
      dispatch(addProduct(newProduct));
    }

    setShowAddModal(false);
  };

  // Dump Clearance Handlers
  const handleApplyBatchClearance = (dumpRow: DumpBatchRow, discount: number) => {
    dispatch(applyDumpClearanceDiscount({
      productId: dumpRow.product._id,
      batchNumber: dumpRow.batch.batchNumber,
      discountPercent: discount
    }));
    setClearanceSuccessMessage(`Applied ${discount}% Clearance Discount to Batch ${dumpRow.batch.batchNumber}!`);
    setTimeout(() => setClearanceSuccessMessage(null), 4000);
  };

  const handleBulkClearance = () => {
    dispatch(applyBulk30DayDumpClearance({ discountPercent: bulkDiscountInput }));
    setClearanceSuccessMessage(`Bulk ${bulkDiscountInput}% Dump Clearance Discount applied to all ${dumpBatches.length} near-expiry batches!`);
    setTimeout(() => setClearanceSuccessMessage(null), 4000);
  };

  const handleSharePatientWhatsApp = (dumpRow: DumpBatchRow) => {
    const discPrice = (dumpRow.product.sellingPrice * (1 - (dumpRow.batch.clearanceDiscountPercent || 30) / 100)).toFixed(2);
    const message = `🏥 *GENQUANTAA MEDPLUS PHARMACY - REFILL CLEARANCE ALERT*\n\n` +
      `Dear Patient,\n` +
      `Special Stock Clearance Offer on *${dumpRow.product.name}*!\n\n` +
      `💊 *Medicine:* ${dumpRow.product.name} (${dumpRow.product.saltComposition})\n` +
      `🏷️ *MRP:* ₹${dumpRow.product.unitMRP}\n` +
      `🔥 *Clearance Price:* ₹${discPrice} (${dumpRow.batch.clearanceDiscountPercent || 30}% OFF)\n` +
      `📦 *Batch:* ${dumpRow.batch.batchNumber} (Exp: ${dumpRow.batch.expiryDate})\n\n` +
      `To reserve or get home delivery, reply to this message or call: +91 98765 43210.`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── HEADER & NAVIGATION ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Pharmacy Inventory &amp; Stock Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage medicine master database, batch stock, 30-day dump clearance &amp; schedule compliance
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Inventory Shelf & Price Dashboard Quick Link */}
          <button
            onClick={() => dispatch(navigateTo('INVENTORY_DASHBOARD'))}
            className="flex items-center space-x-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>Shelf &amp; Price Dashboard</span>
          </button>

          {/* Expiry / Dump Management Quick Link */}
          <button
            onClick={() => dispatch(navigateTo('EXPIRY_MANAGEMENT'))}
            className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Expiry &amp; Dump Center</span>
          </button>

          {/* GRN Purchase Entry Quick Link */}
          <button
            onClick={() => dispatch(navigateTo('PURCHASE_GRN'))}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>+ Stock Purchase (GRN)</span>
          </button>

          {/* Add New Medicine Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Medicine</span>
          </button>
        </div>
      </div>

      {/* ── 30-DAY DUMP STOCK CLEARANCE ALERT BANNER ──────────────────── */}
      {dumpBatches.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-rose-50/40 to-white rounded-2xl border border-amber-300 p-3.5 shadow-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500 text-white p-2.5 rounded-xl flex-shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-sm font-black text-slate-900 font-heading">
                  🚨 30-Day Dump Stock Clearance Alert
                </h3>
                <span className="text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                  {dumpBatches.length} Dump Batches At Expiry Risk
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                <strong>{totalDumpUnits} Units</strong> worth <strong>₹{totalDumpValue.toLocaleString('en-IN')}</strong> will expire within 30 days. Liquidate at clearance discount or initiate supplier return!
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setStockFilter('DUMP_STOCK')}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-all border ${
                stockFilter === 'DUMP_STOCK'
                  ? 'bg-amber-700 text-white border-amber-700 shadow-2xs'
                  : 'text-amber-900 bg-amber-100/80 hover:bg-amber-200 border-amber-300'
              }`}
            >
              {stockFilter === 'DUMP_STOCK' ? 'Showing Dump Stock' : 'Filter Dump Stock'}
            </button>

            <button
              onClick={() => setShowClearanceModal(true)}
              className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>⚡ 1-Click Clearance Accelerator</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {clearanceSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{clearanceSuccessMessage}</span>
          </div>
          <button onClick={() => setClearanceSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── KPI METRIC CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Medicines</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{totalProducts}</h3>
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stock Units</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{totalStockUnits.toLocaleString()}</h3>
          </div>
        </div>

        {/* 30-Day Dump Stock (New KPI) */}
        <div className="bg-white rounded-2xl border border-amber-300 bg-amber-50/40 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-amber-500 p-2.5 rounded-xl text-white">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">30d Dump Stock</p>
            <h3 className="text-xl font-black text-amber-800 font-heading">{dumpBatches.length} Batches</h3>
            <p className="text-[10px] text-slate-500 font-semibold">₹{totalDumpValue.toLocaleString('en-IN')} Value</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Items</p>
            <h3 className="text-xl font-black text-amber-700 font-heading">{lowStockCount}</h3>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-rose-100 p-2.5 rounded-xl text-rose-700">
            <PackageX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out of Stock</p>
            <h3 className="text-xl font-black text-rose-700 font-heading">{outOfStockCount}</h3>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS BAR ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Medicine Name, Salt, Brand, Barcode, HSN, Batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="text-slate-500 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Stock:</span>
          </span>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Stock</option>
            <option value="DUMP_STOCK">🚨 30-Day Dump Stock ({dumpBatches.length})</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          <span className="text-slate-500 ml-2">Schedule:</span>
          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="REGULAR">Regular OTC</option>
            <option value="SCHEDULE_H">Schedule H</option>
            <option value="SCHEDULE_H1">Schedule H1</option>
            <option value="SCHEDULE_X">Schedule X (Narcotic)</option>
          </select>
        </div>
      </div>

      {/* ── INVENTORY MEDICINES TABLE ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-600">
          <span>Showing {filteredProducts.length} of {products.length} Products</span>
          <span className="text-slate-400 text-[11px]">Click '⚡ Clearance' on near-expiry batches to discount or return</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: '950px' }}>
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">Medicine &amp; Salt Composition</th>
                <th className="px-3 py-3">Brand &amp; HSN</th>
                <th className="px-3 py-3 text-center">Schedule</th>
                <th className="px-3 py-3 text-center">Total Stock</th>
                <th className="px-3 py-3 text-right">Selling Price</th>
                <th className="px-3 py-3 text-right">Margin %</th>
                <th className="px-4 py-3">Active Batches &amp; Expiry Status</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No medicines match the selected search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOut = product.stockStatus === 'OUT_OF_STOCK' || product.totalStock === 0;
                  const isLow = product.stockStatus === 'LOW_STOCK' || (product.totalStock > 0 && product.totalStock <= 20);

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/80 transition-colors">

                      {/* Medicine Name & Salt */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-xs">{product.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{product.saltComposition}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">Barcode: {product.barcode}</div>
                      </td>

                      {/* Brand & HSN */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-800">{product.brand}</div>
                        <div className="text-[10px] text-slate-500">HSN: {product.hsnCode} (GST {product.gstRate}%)</div>
                      </td>

                      {/* Schedule Category */}
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          product.scheduleCategory === 'SCHEDULE_H'
                            ? 'bg-amber-100 text-amber-800'
                            : product.scheduleCategory === 'SCHEDULE_H1'
                            ? 'bg-orange-100 text-orange-800'
                            : product.scheduleCategory === 'SCHEDULE_X'
                            ? 'bg-rose-100 text-rose-800 font-black'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {product.scheduleCategory.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Total Stock Units */}
                      <td className="px-3 py-3 text-center">
                        <div className={`font-bold text-xs ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                          {product.totalStock}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isOut ? (
                            <span className="text-rose-600 font-bold">Out of Stock</span>
                          ) : isLow ? (
                            <span className="text-amber-600 font-bold">Low Stock</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">In Stock</span>
                          )}
                        </div>
                      </td>

                      {/* Selling Price & MRP */}
                      <td className="px-3 py-3 text-right font-mono">
                        <div className="font-extrabold text-slate-900">₹{product.sellingPrice.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 line-through">MRP ₹{product.unitMRP.toFixed(2)}</div>
                      </td>

                      {/* Gross Margin */}
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold text-slate-700 flex items-center justify-end space-x-0.5">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span>{product.grossMarginPercent}%</span>
                        </span>
                      </td>

                      {/* Batches Pill List with 30d Dump Badge */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {product.batches.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">No active batches</span>
                          ) : (
                            product.batches.map((b) => {
                              const exp = new Date(b.expiryDate);
                              const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              const isDump = (daysLeft > 0 && daysLeft <= 30) || b.isDumpStock;

                              return (
                                <div
                                  key={b.batchNumber}
                                  className={`flex items-center space-x-1 text-[10px] border px-2 py-0.5 rounded-lg font-mono ${
                                    isDump
                                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-2xs'
                                      : 'bg-slate-100 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <span>{b.batchNumber}</span>
                                  <span>(Exp: {b.expiryDate})</span>
                                  <span className="font-bold">· {b.stockQuantity}u</span>

                                  {isDump && (
                                    <button
                                      onClick={() => {
                                        setSelectedDumpBatch({
                                          product,
                                          batch: b,
                                          daysLeft,
                                          stockValue: b.stockQuantity * product.sellingPrice
                                        });
                                        setShowClearanceModal(true);
                                      }}
                                      className="ml-1 text-[9px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-1.5 py-0.2 rounded cursor-pointer active:scale-95"
                                      title="Open Dump Clearance Actions"
                                    >
                                      {b.clearanceDiscountPercent ? `${b.clearanceDiscountPercent}% Off` : '⚡ Clear'}
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </td>

                      {/* Edit Button */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Product Details"
                        >
                          <Edit3 className="w-4 h-4" />
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

      {/* ── DUMP STOCK CLEARANCE ACCELERATOR MODAL ───────────────────────── */}
      {showClearanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-modal rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-amber-200 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-heading">
                    30-Day Dump Stock Clearance Accelerator
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Liquidate near-expiry batches with flash discounts, supplier returns &amp; patient broadcasts
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowClearanceModal(false);
                  setSelectedDumpBatch(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If a single batch is selected */}
            {selectedDumpBatch ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded">
                        Expires in {selectedDumpBatch.daysLeft} Days ({selectedDumpBatch.batch.expiryDate})
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-1">{selectedDumpBatch.product.name}</h4>
                      <p className="text-[11px] text-slate-500">{selectedDumpBatch.product.saltComposition}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-amber-900">₹{selectedDumpBatch.stockValue.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">{selectedDumpBatch.batch.stockQuantity} Units at Risk</div>
                    </div>
                  </div>
                </div>

                {/* Clearance Actions */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Select Clearance Strategy</h4>

                  {/* Action 1: Clearance Discount */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <Percent className="w-4 h-4 text-emerald-600" />
                        <span>Apply POS Clearance Sale Discount</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">Auto-Applies at Billing Counter</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {[20, 30, 40, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setClearanceDiscountInput(pct)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            clearanceDiscountInput === pct
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {pct}% OFF
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleApplyBatchClearance(selectedDumpBatch, clearanceDiscountInput);
                        setShowClearanceModal(false);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm {clearanceDiscountInput}% Discount for Batch {selectedDumpBatch.batch.batchNumber}</span>
                    </button>
                  </div>

                  {/* Action 2: Return to Supplier */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <RotateCcw className="w-4 h-4 text-amber-600" />
                        <span>Return Batch to Supplier (Debit Note)</span>
                      </h5>
                      <p className="text-[11px] text-slate-500">Request 100% credit refund before expiry window</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowClearanceModal(false);
                        dispatch(navigateTo('RETURNS'));
                      }}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Initiate Return
                    </button>
                  </div>

                  {/* Action 3: WhatsApp Broadcast to Chronic Patients */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        <span>WhatsApp Clearance Refill Broadcast</span>
                      </h5>
                      <p className="text-[11px] text-slate-500">Notify regular patients on this medicine about clearance discount</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSharePatientWhatsApp(selectedDumpBatch)}
                      className="px-3.5 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center space-x-1"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Alert</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedDumpBatch(null)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-bold px-4 py-2 cursor-pointer"
                  >
                    ← Back to All Dump Batches
                  </button>
                </div>
              </div>
            ) : (
              /* All Dump Batches List */
              <div className="space-y-4">
                {/* Bulk Clearance Action Bar */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-black text-amber-900">Bulk 30-Day Clearance Accelerator</span>
                    <p className="text-[11px] text-amber-700">Apply clearance discount across all {dumpBatches.length} dump batches at once</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={bulkDiscountInput}
                      onChange={(e) => setBulkDiscountInput(parseInt(e.target.value) || 30)}
                      className="text-xs bg-white border border-amber-300 rounded-lg px-2 py-1.5 font-bold"
                    >
                      <option value={20}>20% Bulk Discount</option>
                      <option value={25}>25% Bulk Discount</option>
                      <option value={30}>30% Bulk Discount</option>
                      <option value={40}>40% Bulk Discount</option>
                      <option value={50}>50% Bulk Discount</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleBulkClearance}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      ⚡ Apply to All ({dumpBatches.length})
                    </button>
                  </div>
                </div>

                {/* Batches Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                        <th className="p-2.5">Medicine &amp; Batch</th>
                        <th className="p-2.5 text-center">Expiry &amp; Days Left</th>
                        <th className="p-2.5 text-center">Stock Units</th>
                        <th className="p-2.5 text-right">Value (₹)</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dumpBatches.map((d, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/40">
                          <td className="p-2.5 font-bold text-slate-900">
                            <div>{d.product.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Batch: {d.batch.batchNumber}</div>
                          </td>

                          <td className="p-2.5 text-center">
                            <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                              {d.daysLeft} Days Left ({d.batch.expiryDate})
                            </span>
                          </td>

                          <td className="p-2.5 text-center font-bold text-slate-800">
                            {d.batch.stockQuantity} Units
                          </td>

                          <td className="p-2.5 text-right font-black text-amber-900">
                            ₹{d.stockValue.toFixed(2)}
                          </td>

                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedDumpBatch(d)}
                              className="text-[11px] font-bold text-amber-700 hover:text-white hover:bg-amber-600 border border-amber-300 px-2.5 py-1 rounded-lg cursor-pointer transition-all active:scale-95"
                            >
                              Clearance Options →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MEDICINE MODAL ──────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-modal rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                {editingProduct ? `Edit Medicine: ${editingProduct.name}` : 'Add New Medicine to Master Catalog'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Augmentin 625 Duo"
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 mb-1">Manufacturer / Brand *</label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="GlaxoSmithKline"
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Salt / Molecule Composition *</label>
                <input
                  type="text"
                  required
                  value={formSalt}
                  onChange={(e) => setFormSalt(e.target.value)}
                  placeholder="Amoxicillin 500mg + Clavulanic Acid 125mg"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Barcode / EAN</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formHsn}
                    onChange={(e) => setFormHsn(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={formGst}
                    onChange={(e) => setFormGst(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl cursor-pointer"
                  >
                    <option value={0}>0% (Exempted)</option>
                    <option value={5}>5% (Life Saving)</option>
                    <option value={12}>12% (Standard Pharma)</option>
                    <option value={18}>18% (Supplements)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Unit MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formMRP}
                    onChange={(e) => setFormMRP(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Gross Margin (%)</label>
                  <input
                    type="number"
                    value={formMargin}
                    onChange={(e) => setFormMargin(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Schedule</label>
                  <select
                    value={formSchedule}
                    onChange={(e) => setFormSchedule(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-xl cursor-pointer"
                  >
                    <option value="REGULAR">Regular OTC</option>
                    <option value="SCHEDULE_H">Schedule H</option>
                    <option value="SCHEDULE_H1">Schedule H1</option>
                    <option value="SCHEDULE_X">Schedule X</option>
                  </select>
                </div>
              </div>

              {!editingProduct && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-[11px] font-bold text-slate-700">Initial Batch &amp; Stock Information</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500">Batch Number</label>
                      <input
                        type="text"
                        value={formBatchNo}
                        onChange={(e) => setFormBatchNo(e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Expiry Date</label>
                      <input
                        type="date"
                        value={formExpiry}
                        onChange={(e) => setFormExpiry(e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Units Qty</label>
                      <input
                        type="number"
                        value={formInitialStock}
                        onChange={(e) => setFormInitialStock(Number(e.target.value))}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Rack / Shelf</label>
                      <input
                        type="text"
                        value={formRack}
                        onChange={(e) => setFormRack(e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
