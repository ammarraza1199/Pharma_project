import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  navigateTo,
  addNewBatchToProduct,
  updateBatchDetails,
  quickUpdateProductPriceAndShelf,
  applyDumpClearanceDiscount
} from '../store/posSlice';
import type { Product, BatchInfo, ScheduleCategory } from '../types/pos';
import {
  Package, Search, Plus, Filter, AlertTriangle, ArrowUpDown,
  TrendingUp, Edit3, X, Truck, Layers, Percent, Clock, MapPin,
  CheckCircle2, DollarSign, Calendar, Download, Sparkles, RefreshCw,
  Tag, ShieldAlert, BarChart3, ChevronRight, Eye
} from 'lucide-react';

interface BatchRowItem {
  product: Product;
  batch: BatchInfo;
  daysLeft: number;
  expiryCategory: 'EXPIRED' | 'DUMP_30' | 'WARNING_90' | 'MEDIUM_180' | 'FRESH';
  batchValue: number;
  estimatedCost: number;
  marginPercent: number;
}

type ExpiryFilterType = 'ALL' | 'DUMP_30' | 'WARNING_90' | 'MEDIUM_180' | 'FRESH' | 'EXPIRED';
type SortOption = 'expiry_fefo' | 'margin_desc' | 'stock_desc' | 'value_desc' | 'rack_asc' | 'name_asc';

export const InventoryDashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.pos.products);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRackFilter, setSelectedRackFilter] = useState<string>('ALL');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilterType>('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | ScheduleCategory>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('expiry_fefo');

  // Modals State
  const [showAddBatchModal, setShowAddBatchModal] = useState<boolean>(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState<boolean>(false);
  const [showClearanceModal, setShowClearanceModal] = useState<boolean>(false);

  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null);
  const [selectedBatchRow, setSelectedBatchRow] = useState<BatchRowItem | null>(null);

  // Add Batch Form State
  const [formProductId, setFormProductId] = useState<string>(products[0]?._id || '');
  const [formBatchNo, setFormBatchNo] = useState<string>(`BT-${Date.now().toString().slice(-4)}`);
  const [formExpiryDate, setFormExpiryDate] = useState<string>('2027-12-31');
  const [formQuantity, setFormQuantity] = useState<number>(50);
  const [formLocation, setFormLocation] = useState<string>('Rack A-01');
  const [formMrp, setFormMrp] = useState<number>(100);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(90);
  const [formPurchaseCost, setFormPurchaseCost] = useState<number>(70);

  // Quick Edit Form State
  const [editLocation, setEditLocation] = useState<string>('');
  const [editSellingPrice, setEditSellingPrice] = useState<number>(0);
  const [editMrp, setEditMrp] = useState<number>(0);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editExpiryDate, setEditExpiryDate] = useState<string>('');

  // Clearance Discount State
  const [clearanceDiscount, setClearanceDiscount] = useState<number>(30);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // ── Flattened Batch Rows & Real-Time Calculations ─────────────────────────
  const now = new Date();

  const allBatchRows: BatchRowItem[] = useMemo(() => {
    const list: BatchRowItem[] = [];

    products.forEach(product => {
      if (product.batches && product.batches.length > 0) {
        product.batches.forEach(b => {
          const exp = new Date(b.expiryDate);
          const diffTime = exp.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let expiryCategory: BatchRowItem['expiryCategory'] = 'FRESH';
          if (daysLeft <= 0) expiryCategory = 'EXPIRED';
          else if (daysLeft <= 30) expiryCategory = 'DUMP_30';
          else if (daysLeft <= 90) expiryCategory = 'WARNING_90';
          else if (daysLeft <= 180) expiryCategory = 'MEDIUM_180';
          else expiryCategory = 'FRESH';

          const cost = b.purchaseRate || Number((b.mrp * 0.70).toFixed(2));
          const margin = product.sellingPrice > 0 ? Number((((product.sellingPrice - cost) / product.sellingPrice) * 100).toFixed(1)) : product.grossMarginPercent;

          list.push({
            product,
            batch: b,
            daysLeft,
            expiryCategory,
            batchValue: b.stockQuantity * product.sellingPrice,
            estimatedCost: b.stockQuantity * cost,
            marginPercent: margin
          });
        });
      } else {
        // Product with 0 batches
        list.push({
          product,
          batch: {
            batchNumber: 'NO-ACTIVE-BATCH',
            expiryDate: '—',
            stockQuantity: 0,
            location: 'Unassigned',
            mrp: product.unitMRP
          },
          daysLeft: 999,
          expiryCategory: 'FRESH',
          batchValue: 0,
          estimatedCost: 0,
          marginPercent: product.grossMarginPercent
        });
      }
    });

    return list;
  }, [products]);

  // Unique Racks List
  const uniqueRacks = useMemo(() => {
    const set = new Set<string>();
    allBatchRows.forEach(r => {
      if (r.batch.location && r.batch.location !== 'Unassigned') {
        set.add(r.batch.location);
      }
    });
    return Array.from(set).sort();
  }, [allBatchRows]);

  // Summary Metrics
  const totalBatchesCount = allBatchRows.filter(b => b.batch.batchNumber !== 'NO-ACTIVE-BATCH').length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.totalStock, 0);
  const totalInventoryValuation = allBatchRows.reduce((sum, b) => sum + b.batchValue, 0);
  const totalCostValuation = allBatchRows.reduce((sum, b) => sum + b.estimatedCost, 0);

  const dump30Count = allBatchRows.filter(b => b.expiryCategory === 'DUMP_30').length;
  const warning90Count = allBatchRows.filter(b => b.expiryCategory === 'WARNING_90').length;
  const freshCount = allBatchRows.filter(b => b.expiryCategory === 'FRESH').length;

  // Filtered & Sorted Rows
  const filteredBatchRows = useMemo(() => {
    let result = allBatchRows.filter(row => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          row.product.name.toLowerCase().includes(q) ||
          row.product.saltComposition.toLowerCase().includes(q) ||
          row.product.brand.toLowerCase().includes(q) ||
          row.product.barcode.includes(q) ||
          row.batch.batchNumber.toLowerCase().includes(q) ||
          row.batch.location.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedRackFilter !== 'ALL' && row.batch.location !== selectedRackFilter) {
        return false;
      }

      if (expiryFilter !== 'ALL' && row.expiryCategory !== expiryFilter) {
        return false;
      }

      if (scheduleFilter !== 'ALL' && row.product.scheduleCategory !== scheduleFilter) {
        return false;
      }

      return true;
    });

    result.sort((a, b) => {
      switch (sortOption) {
        case 'expiry_fefo':
          return a.daysLeft - b.daysLeft;
        case 'margin_desc':
          return b.marginPercent - a.marginPercent;
        case 'stock_desc':
          return b.batch.stockQuantity - a.batch.stockQuantity;
        case 'value_desc':
          return b.batchValue - a.batchValue;
        case 'rack_asc':
          return a.batch.location.localeCompare(b.batch.location);
        case 'name_asc':
          return a.product.name.localeCompare(b.product.name);
        default:
          return 0;
      }
    });

    return result;
  }, [allBatchRows, searchTerm, selectedRackFilter, expiryFilter, scheduleFilter, sortOption]);

  // Handlers
  const handleOpenAddBatch = (prod?: Product) => {
    const targetProd = prod || products[0];
    setSelectedProductForBatch(targetProd);
    setFormProductId(targetProd?._id || '');
    setFormBatchNo(`BT-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormExpiryDate('2027-12-31');
    setFormQuantity(50);
    setFormLocation('Rack A-01');
    setFormMrp(targetProd?.unitMRP || 100);
    setFormSellingPrice(targetProd?.sellingPrice || 90);
    setFormPurchaseCost(Number(((targetProd?.sellingPrice || 90) * 0.75).toFixed(2)));
    setShowAddBatchModal(true);
  };

  const handleOpenQuickEdit = (row: BatchRowItem) => {
    setSelectedBatchRow(row);
    setEditLocation(row.batch.location);
    setEditSellingPrice(row.product.sellingPrice);
    setEditMrp(row.batch.mrp || row.product.unitMRP);
    setEditQuantity(row.batch.stockQuantity);
    setEditExpiryDate(row.batch.expiryDate);
    setShowQuickEditModal(true);
  };

  const handleOpenClearance = (row: BatchRowItem) => {
    setSelectedBatchRow(row);
    setClearanceDiscount(row.batch.clearanceDiscountPercent || 30);
    setShowClearanceModal(true);
  };

  const handleSaveNewBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p._id === formProductId);
    if (!prod) return;

    dispatch(addNewBatchToProduct({
      productId: prod._id,
      batchNumber: formBatchNo,
      expiryDate: formExpiryDate,
      stockQuantity: formQuantity,
      location: formLocation,
      mrp: formMrp,
      purchaseRate: formPurchaseCost,
      sellingPrice: formSellingPrice
    }));

    setShowAddBatchModal(false);
    setSuccessToast(`Added batch ${formBatchNo} (${formQuantity} units) to ${prod.name} at ${formLocation}!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchRow) return;

    dispatch(updateBatchDetails({
      productId: selectedBatchRow.product._id,
      batchNumber: selectedBatchRow.batch.batchNumber,
      location: editLocation,
      sellingPrice: editSellingPrice,
      mrp: editMrp,
      stockQuantity: editQuantity,
      expiryDate: editExpiryDate
    }));

    setShowQuickEditModal(false);
    setSuccessToast(`Updated shelf location & pricing for ${selectedBatchRow.product.name} (Batch: ${selectedBatchRow.batch.batchNumber})!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleConfirmClearanceDiscount = () => {
    if (!selectedBatchRow) return;

    dispatch(applyDumpClearanceDiscount({
      productId: selectedBatchRow.product._id,
      batchNumber: selectedBatchRow.batch.batchNumber,
      discountPercent: clearanceDiscount
    }));

    setShowClearanceModal(false);
    setSuccessToast(`Applied ${clearanceDiscount}% Clearance Discount to Batch ${selectedBatchRow.batch.batchNumber}!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleExportCSV = () => {
    let csv = 'Product Name,Brand,Salt Composition,Batch Number,Shelf Location,Expiry Date,Days Left,Stock Units,Purchase Cost (INR),MRP (INR),Selling Price (INR),Margin %,GST %\n';
    filteredBatchRows.forEach(r => {
      const cost = (r.batch.purchaseRate || (r.batch.mrp * 0.75)).toFixed(2);
      csv += `"${r.product.name}","${r.product.brand}","${r.product.saltComposition}","${r.batch.batchNumber}","${r.batch.location}","${r.batch.expiryDate}",${r.daysLeft},${r.batch.stockQuantity},${cost},${r.batch.mrp.toFixed(2)},${r.product.sellingPrice.toFixed(2)},${r.marginPercent}%,${r.product.gstRate}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Inventory_Shelf_Master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4 font-sans select-none">

      {/* ── TOP HEADER & ACTIONS ───────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Inventory Master, Shelf Location &amp; Expiry Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time shelf placement, FEFO expiry tracking, wholesale cost vs retail margins &amp; batch control
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Jump to Catalog View */}
          <button
            onClick={() => dispatch(navigateTo('INVENTORY'))}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Catalog Mode</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Export Shelf CSV</span>
          </button>

          {/* Add New Batch Button */}
          <button
            onClick={() => handleOpenAddBatch()}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Batch &amp; Shelf</span>
          </button>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ─────────────────────────────────────────── */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── TOP KPI SUMMARY CARDS (LIGHT PHARMACY THEME) ───────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Active Batches & Stock Units */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-2.5 rounded-xl flex-shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active Batches</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{totalBatchesCount} Batches</h3>
            <p className="text-[10px] text-emerald-700 font-bold">{totalStockUnits.toLocaleString()} Total Stock Units</p>
          </div>
        </div>

        {/* Total Shelf Valuation (Retail Selling Value) */}
        <div className="bg-white rounded-2xl border border-teal-200 bg-teal-50/20 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-teal-600 text-white p-2.5 rounded-xl flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">Total Shelf Valuation</p>
            <h3 className="text-xl font-black text-teal-800 font-heading">₹{totalInventoryValuation.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Cost: ₹{totalCostValuation.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Occupied Racks Count */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-amber-50 text-amber-700 border border-amber-200 p-2.5 rounded-xl flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupied Racks &amp; Shelves</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{uniqueRacks.length} Locations</h3>
            <p className="text-[10px] text-amber-800 font-bold">Organized Shelf Placements</p>
          </div>
        </div>

        {/* Shelf Expiry Health */}
        <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/20 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-rose-500 text-white p-2.5 rounded-xl flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-rose-900 uppercase tracking-wider">Shelf Expiry Health</p>
            <h3 className="text-xl font-black text-rose-700 font-heading">{dump30Count} Dump Batches</h3>
            <p className="text-[10px] text-slate-600 font-medium">{warning90Count} in 90d · {freshCount} Fresh</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH & MULTI-FILTER TOOLBAR ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Medicine, Brand, Molecule, Batch No, Shelf / Rack Location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Filter by Rack */}
          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            <span className="text-slate-500 whitespace-nowrap flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Shelf / Rack:</span>
            </span>
            <select
              value={selectedRackFilter}
              onChange={e => setSelectedRackFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Racks ({uniqueRacks.length})</option>
              {uniqueRacks.map(r => (
                <option key={r} value={r}>📍 {r}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            <span className="text-slate-500 whitespace-nowrap flex items-center space-x-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort:</span>
            </span>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="expiry_fefo">⏳ Earliest Expiry (FEFO First)</option>
              <option value="margin_desc">📈 Highest Margin (%)</option>
              <option value="stock_desc">📦 Highest Stock Units</option>
              <option value="value_desc">💰 Highest Stock Value (₹)</option>
              <option value="rack_asc">📍 Shelf / Rack (A → Z)</option>
              <option value="name_asc">🔤 Medicine Name (A → Z)</option>
            </select>
          </div>
        </div>

        {/* Expiry Slabs Quick Filter Bar */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Expiry Slabs:</span>
          </span>
          {[
            { key: 'ALL',         label: `All Batches (${allBatchRows.length})` },
            { key: 'DUMP_30',     label: `🚨 ≤30 Days Dump (${dump30Count})` },
            { key: 'WARNING_90',  label: `⏳ ≤90 Days (${warning90Count})` },
            { key: 'MEDIUM_180',  label: `📅 ≤180 Days` },
            { key: 'FRESH',       label: `✨ Fresh (>1 Year) (${freshCount})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setExpiryFilter(tab.key as ExpiryFilterType)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                expiryFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── COMPREHENSIVE BATCH, SHELF & PRICING TABLE ─────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
          <span>Inventory Batches, Shelf Placement &amp; Pricing Master ({filteredBatchRows.length})</span>
          <span className="text-slate-400 text-[11px]">Click '✏️ Edit Shelf &amp; Price' for instant modifications</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '1050px' }}>
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">Medicine &amp; Molecule</th>
                <th className="px-3 py-3">Batch &amp; Barcode</th>
                <th className="px-3 py-3">📍 Shelf / Rack Location</th>
                <th className="px-3 py-3">📅 Expiry Date &amp; Shelf Life</th>
                <th className="px-3 py-3 text-center">Batch Stock</th>
                <th className="px-3 py-3 text-right">Pricing Breakdown (Cost / MRP / Sell)</th>
                <th className="px-3 py-3 text-center">Margin %</th>
                <th className="px-3 py-3 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatchRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No medicine batches found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBatchRows.map((row, idx) => {
                  const isOut = row.batch.stockQuantity === 0;
                  const isLow = row.batch.stockQuantity > 0 && row.batch.stockQuantity <= 20;

                  return (
                    <tr key={`${row.product._id}-${row.batch.batchNumber}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Medicine Master */}
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900 text-xs">{row.product.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium truncate max-w-[220px]">{row.product.saltComposition}</div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[9.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {row.product.brand}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            row.product.scheduleCategory === 'SCHEDULE_H'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : row.product.scheduleCategory === 'SCHEDULE_H1'
                              ? 'bg-orange-50 text-orange-800 border border-orange-200'
                              : row.product.scheduleCategory === 'SCHEDULE_X'
                              ? 'bg-rose-50 text-rose-800 font-black border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {row.product.scheduleCategory.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Batch & Barcode */}
                      <td className="px-3 py-3 font-mono">
                        <div className="font-bold text-slate-900 text-xs">{row.batch.batchNumber}</div>
                        <div className="text-[9.5px] text-slate-400">Barcode: {row.product.barcode}</div>
                        {row.batch.clearanceDiscountPercent && (
                          <span className="inline-block mt-0.5 text-[9px] font-black bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded">
                            🏷️ {row.batch.clearanceDiscountPercent}% Clearance Tag
                          </span>
                        )}
                      </td>

                      {/* Shelf / Rack Location */}
                      <td className="px-3 py-3">
                        <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 font-bold text-xs">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span>{row.batch.location || 'Unassigned Rack'}</span>
                        </div>
                      </td>

                      {/* Expiry Date & Shelf Life */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-900 text-xs font-mono flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{row.batch.expiryDate}</span>
                        </div>
                        <div className="mt-0.5">
                          {row.expiryCategory === 'EXPIRED' ? (
                            <span className="text-[9.5px] font-black bg-rose-100 text-rose-900 border border-rose-300 px-1.5 py-0.2 rounded">
                              🚨 Expired ({Math.abs(row.daysLeft)}d ago)
                            </span>
                          ) : row.expiryCategory === 'DUMP_30' ? (
                            <span className="text-[9.5px] font-black bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded animate-pulse">
                              ⚠ {row.daysLeft} Days Left (Dump Risk)
                            </span>
                          ) : row.expiryCategory === 'WARNING_90' ? (
                            <span className="text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                              ⏳ {row.daysLeft} Days Left
                            </span>
                          ) : (
                            <span className="text-[9.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded">
                              ✨ {row.daysLeft} Days (Fresh Stock)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Batch Stock Quantity */}
                      <td className="px-3 py-3 text-center">
                        <div className={`font-black text-xs ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                          {row.batch.stockQuantity} Units
                        </div>
                        <div className="text-[9.5px] text-slate-400">
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Available'}
                        </div>
                      </td>

                      {/* Pricing Breakdown (Cost / MRP / Selling Price) */}
                      <td className="px-3 py-3 text-right font-mono">
                        <div className="font-black text-slate-900 text-xs">
                          Sell: ₹{row.product.sellingPrice.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          MRP: ₹{row.batch.mrp?.toFixed(2) || row.product.unitMRP.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-teal-700 font-semibold">
                          Cost: ₹{(row.batch.purchaseRate || (row.batch.mrp * 0.75)).toFixed(2)}
                        </div>
                      </td>

                      {/* Margin % */}
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span>{row.marginPercent}%</span>
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">GST {row.product.gstRate}%</div>
                      </td>

                      {/* Quick Actions */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Quick Edit Shelf & Price */}
                          <button
                            onClick={() => handleOpenQuickEdit(row)}
                            className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Quick Edit Shelf Location & Pricing"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Add New Batch for this product */}
                          <button
                            onClick={() => handleOpenAddBatch(row.product)}
                            className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="+ Add Another Batch to this Medicine"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Set Clearance Tag if <90 days */}
                          {row.daysLeft <= 90 && (
                            <button
                              onClick={() => handleOpenClearance(row)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Set Flash Clearance Discount"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: ADD NEW BATCH & SHELF STOCK ───────────────────────── */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    Add New Batch Stock &amp; Shelf Location
                  </h3>
                  <p className="text-[11px] text-slate-500">Assign incoming batch with expiry, shelf rack, cost &amp; selling price</p>
                </div>
              </div>
              <button onClick={() => setShowAddBatchModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewBatch} className="space-y-3.5 text-xs font-semibold">
              {/* Product Selector */}
              <div>
                <label className="block text-slate-700 mb-1">Target Medicine *</label>
                <select
                  value={formProductId}
                  onChange={e => {
                    const id = e.target.value;
                    setFormProductId(id);
                    const p = products.find(prod => prod._id === id);
                    if (p) {
                      setFormMrp(p.unitMRP);
                      setFormSellingPrice(p.sellingPrice);
                      setFormPurchaseCost(Number((p.sellingPrice * 0.75).toFixed(2)));
                    }
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.brand}) — Stock: {p.totalStock}u
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={formBatchNo}
                    onChange={e => setFormBatchNo(e.target.value)}
                    placeholder="AUG-2026-09"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formExpiryDate}
                    onChange={e => setFormExpiryDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Stock Quantity (Units) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formQuantity}
                    onChange={e => setFormQuantity(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">📍 Shelf / Rack Placement *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="e.g. Rack A-04, Shelf 2"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Pricing &amp; Margin Configuration
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formPurchaseCost}
                      onChange={e => setFormPurchaseCost(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500">Unit MRP (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formMrp}
                      onChange={e => setFormMrp(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-emerald-800 font-bold">Counter Sell (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formSellingPrice}
                      onChange={e => setFormSellingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Batch to Inventory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: QUICK EDIT SHELF LOCATION & PRICING ───────────────── */}
      {showQuickEditModal && selectedBatchRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    Quick Edit Shelf Location &amp; Price
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedBatchRow.product.name} (Batch: {selectedBatchRow.batch.batchNumber})</p>
                </div>
              </div>
              <button onClick={() => setShowQuickEditModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">📍 Physical Shelf / Rack Location *</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="Rack A-04, Shelf 2"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={editExpiryDate}
                    onChange={e => setEditExpiryDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Stock Units</label>
                  <input
                    type="number"
                    min={0}
                    value={editQuantity}
                    onChange={e => setEditQuantity(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Unit MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editMrp}
                    onChange={e => setEditMrp(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-emerald-800 font-bold mb-1">Counter Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editSellingPrice}
                    onChange={e => setEditSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border border-emerald-300 rounded-xl font-mono text-xs font-black text-emerald-800"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowQuickEditModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  Update Shelf &amp; Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: APPLY FLASH CLEARANCE DISCOUNT ────────────────────── */}
      {showClearanceModal && selectedBatchRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    Apply Flash Clearance Discount
                  </h3>
                  <p className="text-[11px] text-slate-500">{selectedBatchRow.product.name} ({selectedBatchRow.daysLeft}d left)</p>
                </div>
              </div>
              <button onClick={() => setShowClearanceModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <p className="text-slate-600">
                Select discount percentage to push this batch first at POS billing counter before expiration:
              </p>

              <div className="grid grid-cols-4 gap-2">
                {[20, 30, 40, 50].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setClearanceDiscount(pct)}
                    className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      clearanceDiscount === pct
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pct}% OFF
                  </button>
                ))}
              </div>

              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-center">
                <div className="text-[11px] text-slate-500">Discounted POS Billing Price</div>
                <div className="text-base font-black text-amber-900 font-mono mt-0.5">
                  ₹{(selectedBatchRow.product.sellingPrice * (1 - clearanceDiscount / 100)).toFixed(2)}
                  <span className="text-[11px] text-slate-400 line-through ml-2 font-normal">
                    ₹{selectedBatchRow.product.sellingPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowClearanceModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearanceDiscount}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  Confirm {clearanceDiscount}% Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
