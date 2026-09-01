import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { addItemToCart } from '../store/posSlice';
import { getMedicineDetails } from '../utils/medicineDetails';
import { getSortedBatchesFEFO, getEarliestExpiringBatch } from '../utils/fefoHelper';
import type { Product, BatchInfo, ScheduleCategory, SellingUnitMode } from '../types/pos';
import {
  Search, ScanBarcode, AlertCircle, Plus, Zap,
  X, ArrowUpDown, PackageX, TrendingUp, ChevronDown
} from 'lucide-react';

// ── Filter & Sort Types ──────────────────────────────────────────────────────
type FilterTab = 'ALL' | 'REGULAR' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X' | 'LOW_STOCK' | 'NEAR_EXPIRY' | 'OUT_OF_STOCK';
type SortKey   = 'name' | 'price_asc' | 'price_desc' | 'stock' | 'margin';

const FILTER_TABS: { key: FilterTab; label: string; color: string }[] = [
  { key: 'ALL',          label: 'All',         color: 'text-slate-700 bg-slate-100 border-slate-300'    },
  { key: 'REGULAR',      label: 'Regular',      color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  { key: 'SCHEDULE_H',   label: 'Sch-H',        color: 'text-amber-700 bg-amber-50 border-amber-300'    },
  { key: 'SCHEDULE_H1',  label: 'Sch-H1',       color: 'text-orange-700 bg-orange-50 border-orange-300' },
  { key: 'SCHEDULE_X',   label: 'Sch-X',        color: 'text-rose-700 bg-rose-50 border-rose-300'       },
  { key: 'LOW_STOCK',    label: 'Low Stock',    color: 'text-yellow-700 bg-yellow-50 border-yellow-300' },
  { key: 'NEAR_EXPIRY',  label: 'Near Expiry',  color: 'text-amber-900 bg-amber-100 border-amber-400 font-extrabold' },
  { key: 'OUT_OF_STOCK', label: 'Out of Stock', color: 'text-red-700 bg-red-50 border-red-300'          },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name',       label: 'Name A–Z'       },
  { key: 'price_asc',  label: 'Price: Low–High' },
  { key: 'price_desc', label: 'Price: High–Low' },
  { key: 'stock',      label: 'Stock: High'     },
  { key: 'margin',     label: 'Margin: High'    },
];

const SCHEDULE_BADGE: Record<ScheduleCategory, { label: string; cls: string } | null> = {
  REGULAR:     null,
  SCHEDULE_H:  { label: 'Sch-H',  cls: 'bg-amber-500 text-white'       },
  SCHEDULE_H1: { label: 'Sch-H1', cls: 'bg-orange-500 text-white'      },
  SCHEDULE_X:  { label: 'Sch-X ⚠', cls: 'bg-rose-600 text-white animate-pulse' },
};

// ────────────────────────────────────────────────────────────────────────────
export const ProductSearch: React.FC = () => {
  const dispatch    = useDispatch();
  const products    = useSelector((state: RootState) => state.pos.products);
  const user        = useSelector((state: RootState) => state.pos.currentUser);

  const [searchTerm,       setSearchTerm]       = useState<string>('');
  const [activeFilter,     setActiveFilter]     = useState<FilterTab>('ALL');
  const [sortKey,          setSortKey]          = useState<SortKey>('name');
  const [showSortMenu,     setShowSortMenu]     = useState<boolean>(false);
  const [selectedBatchMap, setSelectedBatchMap] = useState<Record<string, BatchInfo>>({});
  const [qtyMap,           setQtyMap]           = useState<Record<string, number>>({});
  const [unitModeMap,      setUnitModeMap]      = useState<Record<string, SellingUnitMode>>({});
  const [barcodeFlash,     setBarcodeFlash]     = useState<string | null>(null);  // product._id flashing

  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef    = useRef<HTMLDivElement>(null);

  // Auto-focus & keyboard shortcuts
  useEffect(() => {
    searchInputRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F2' || (e.key === '/' && document.activeElement !== searchInputRef.current)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') setSearchTerm('');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close sort menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    // Text search
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      const textMatch =
        p.name.toLowerCase().includes(t) ||
        p.saltComposition.toLowerCase().includes(t) ||
        p.barcode.includes(t) ||
        p.brand.toLowerCase().includes(t) ||
        p.hsnCode.includes(t);
      if (!textMatch) return false;
    }
    // Category filter
    if (activeFilter === 'LOW_STOCK')    return p.stockStatus === 'LOW_STOCK' || (p.totalStock > 0 && p.totalStock <= 20);
    if (activeFilter === 'OUT_OF_STOCK') return p.stockStatus === 'OUT_OF_STOCK' || p.totalStock === 0;
    if (activeFilter === 'NEAR_EXPIRY') {
      const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return p.batches.some(b => {
        const exp = new Date(b.expiryDate);
        return exp < thirtyDays && exp > new Date();
      });
    }
    if (activeFilter !== 'ALL')          return p.scheduleCategory === (activeFilter as ScheduleCategory);
    return true;
  });

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'price_asc':  return a.sellingPrice - b.sellingPrice;
      case 'price_desc': return b.sellingPrice - a.sellingPrice;
      case 'stock':      return b.totalStock - a.totalStock;
      case 'margin':     return b.grossMarginPercent - a.grossMarginPercent;
      default:           return a.name.localeCompare(b.name);
    }
  });

  // ── Barcode / Enter: exact match → add instantly ───────────────────────────
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const exact = products.find(
      p => p.barcode === searchTerm.trim() ||
           p.name.toLowerCase() === searchTerm.trim().toLowerCase()
    );
    const target = exact || (sorted.length === 1 ? sorted[0] : null);
    if (target) {
      flashAndAdd(target);
      setSearchTerm('');
    }
  };

  // Flash animation then add to cart
  const flashAndAdd = useCallback((product: Product) => {
    setBarcodeFlash(product._id);
    setTimeout(() => setBarcodeFlash(null), 600);
    const defaultBatch = getEarliestExpiringBatch(product.batches) || product.batches[0];
    const batch = selectedBatchMap[product._id] || defaultBatch;
    const qty   = qtyMap[product._id] || 1;
    const unitMode = unitModeMap[product._id] || 'PACK';
    const isAuthorizedByPin = user?.role === 'MANAGER' || user?.role === 'OWNER';
    dispatch(addItemToCart({ product, selectedBatch: batch, quantity: qty, unitMode, isAuthorizedByPin }));
  }, [selectedBatchMap, qtyMap, unitModeMap, dispatch]);

  const handleAddToCart = (product: Product) => flashAndAdd(product);

  const handleBatchChange = (productId: string, batchNumber: string, product: Product) => {
    const batch = product.batches.find(b => b.batchNumber === batchNumber);
    if (batch) setSelectedBatchMap(prev => ({ ...prev, [productId]: batch }));
  };

  const setQty = (productId: string, qty: number) =>
    setQtyMap(prev => ({ ...prev, [productId]: Math.max(1, qty) }));

  // ── Tab counts ─────────────────────────────────────────────────────────────
  const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const tabCounts: Record<FilterTab, number> = {
    ALL:          products.length,
    REGULAR:      products.filter(p => p.scheduleCategory === 'REGULAR').length,
    SCHEDULE_H:   products.filter(p => p.scheduleCategory === 'SCHEDULE_H').length,
    SCHEDULE_H1:  products.filter(p => p.scheduleCategory === 'SCHEDULE_H1').length,
    SCHEDULE_X:   products.filter(p => p.scheduleCategory === 'SCHEDULE_X').length,
    LOW_STOCK:    products.filter(p => p.stockStatus === 'LOW_STOCK' || (p.totalStock > 0 && p.totalStock <= 20)).length,
    NEAR_EXPIRY:  products.filter(p => p.batches.some(b => { const exp = new Date(b.expiryDate); return exp < thirtyDaysAhead && exp > new Date(); })).length,
    OUT_OF_STOCK: products.filter(p => p.stockStatus === 'OUT_OF_STOCK' || p.totalStock === 0).length,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col h-full overflow-hidden">

      {/* ── SEARCH BAR ──────────────────────────────────────────────── */}
      <div className="p-3 pb-0 flex-shrink-0">
        <form onSubmit={handleBarcodeSubmit} className="relative mb-2.5">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search Drug / Salt / Brand / Barcode  [F2 or /]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-28 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
          />
          {/* Right badges */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="flex items-center space-x-1 bg-slate-200/80 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-300">
              <ScanBarcode className="w-3 h-3 text-slate-500" />
              <span>HID</span>
            </span>
          </div>
        </form>

        {/* ── FILTER TABS ─────────────────────────────────────────────── */}
        <div className="flex items-center flex-wrap gap-1 pb-2">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-shrink-0 flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                activeFilter === tab.key
                  ? tab.color + ' shadow-xs font-extrabold'
                  : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[9px] px-1 rounded-full font-black ${
                activeFilter === tab.key ? 'bg-white/60' : 'bg-slate-100'
              }`}>
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* ── RESULTS COUNT + SORT ────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <p className="text-[11px] text-slate-500 font-medium">
            {sorted.length === products.length
              ? `${products.length} medicines`
              : <><span className="font-bold text-emerald-700">{sorted.length}</span> of {products.length} medicines</>
            }
            {searchTerm && <span className="ml-1 text-slate-400">for "<span className="italic">{searchTerm}</span>"</span>}
          </p>

          {/* Sort dropdown */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setShowSortMenu(v => !v)}
              className="flex items-center space-x-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg cursor-pointer hover:bg-slate-100 transition-all"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{SORT_OPTIONS.find(s => s.key === sortKey)?.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-7 z-30 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[140px]">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-colors ${
                      sortKey === opt.key
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PRODUCT CARDS LIST ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 pt-2 space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">No medicines found</p>
            <p className="text-[11px] text-slate-400 mt-1">Try a different name, salt, or barcode</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          sorted.map(product => {
            const isOut      = product.stockStatus === 'OUT_OF_STOCK' || product.totalStock === 0;
            const isLow      = !isOut && (product.stockStatus === 'LOW_STOCK' || product.totalStock <= 20);
            const hasNearExpiry = product.batches.some(b => {
              const exp = new Date(b.expiryDate);
              const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              return exp < thirtyDays && exp > new Date();
            });
            const badge      = SCHEDULE_BADGE[product.scheduleCategory];
            const sortedBatches = getSortedBatchesFEFO(product.batches);
            const fefoBatch  = getEarliestExpiringBatch(product.batches) || sortedBatches[0];
            const selBatch   = selectedBatchMap[product._id] || fefoBatch;
            const qty        = qtyMap[product._id] || 1;
            const isFlashing = barcodeFlash === product._id;

            return (
              <div
                key={product._id}
                className={`group border rounded-xl p-3 transition-all duration-150 relative ${
                  isFlashing
                    ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.01]'
                    : isOut
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                    : isLow || hasNearExpiry
                    ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400'
                    : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">

                    {/* Drug name + badges row */}
                    <div className="flex items-center flex-wrap gap-1.5 mb-1">
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors font-heading truncate">
                        {product.name}
                      </h3>

                      {/* Stock badge */}
                      {isOut ? (
                        <span className="flex items-center space-x-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          <PackageX className="w-2.5 h-2.5" />
                          <span>Out of Stock</span>
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Low ({product.totalStock})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ {product.totalStock}
                        </span>
                      )}

                      {/* Near Expiry Amber Warning Badge */}
                      {hasNearExpiry && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-white border border-amber-600 shadow-2xs animate-pulse">
                          ⚠ Near Expiry (&lt;30d)
                        </span>
                      )}

                      {/* Schedule badge */}
                      {badge && (
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>

                    {/* Salt composition */}
                    <p className="text-[11px] text-slate-600 mb-1 line-clamp-1">
                      <span className="text-slate-400">Salt: </span>{product.saltComposition}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                      <span>Brand: <strong className="text-slate-700">{product.brand}</strong></span>
                      <span>HSN: <strong className="text-slate-700">{product.hsnCode}</strong></span>
                      <span>GST: <strong className="text-slate-700">{product.gstRate}%</strong></span>
                      <span className="text-emerald-700 font-semibold flex items-center space-x-0.5">
                        <TrendingUp className="w-2.5 h-2.5" />
                        <span>Margin {product.grossMarginPercent}%</span>
                      </span>
                    </div>

                    {/* Medicine Pack Size, Type Badges & Loose Tablet Mode Toggle */}
                    {(() => {
                      const medDetails = getMedicineDetails(product);
                      const currentUnitMode = unitModeMap[product._id] || 'PACK';
                      const perTabletPrice = product.sellingPrice / medDetails.unitsPerPack;

                      return (
                        <div className="flex items-center space-x-1.5 mt-1.5 flex-wrap gap-y-1">
                          <span className="text-[9.5px] bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                            💊 Pack: {medDetails.packSize}
                          </span>
                          <span className="text-[9.5px] bg-blue-50 text-blue-800 font-extrabold px-1.5 py-0.5 rounded border border-blue-200">
                            Type: {medDetails.medicineType}
                          </span>

                          {/* Loose Tablet vs Full Strip Mode Selector */}
                          {medDetails.unitsPerPack > 1 && (
                            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                              <button
                                type="button"
                                onClick={() => setUnitModeMap(prev => ({ ...prev, [product._id]: 'PACK' }))}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  currentUnitMode === 'PACK'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                📦 Full Strip
                              </button>
                              <button
                                type="button"
                                onClick={() => setUnitModeMap(prev => ({ ...prev, [product._id]: 'LOOSE' }))}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                                  currentUnitMode === 'LOOSE'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title={`Sell loose tablets at ₹${perTabletPrice.toFixed(2)} per tablet`}
                              >
                                💊 Loose (₹{perTabletPrice.toFixed(2)}/tab)
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Batch selector (FEFO Sorted) */}
                    {!isOut && sortedBatches.length > 0 && (
                      <div className="mt-2 flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-[10px] text-slate-500 font-medium">Batch:</span>
                        <select
                          value={selBatch?.batchNumber || ''}
                          onChange={e => handleBatchChange(product._id, e.target.value, product)}
                          className="text-[11px] bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer font-medium"
                        >
                          {sortedBatches.map((b, idx) => {
                            const near = new Date(b.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                            const exp  = new Date(b.expiryDate) <= new Date();
                            const isFefo = b.batchNumber === fefoBatch?.batchNumber && sortedBatches.length > 1;
                            return (
                              <option key={b.batchNumber} value={b.batchNumber} disabled={exp}>
                                {b.batchNumber} · Exp: {b.expiryDate}{isFefo ? ' ⚡[Expiring First]' : ''}{exp ? ' [EXPIRED]' : near ? ' ⚠' : ''} · Qty: {b.stockQuantity}
                              </option>
                            );
                          })}
                        </select>
                        {/* Qty Stepper */}
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setQty(product._id, qty - 1)}
                            className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                          >−</button>
                          <span className="px-2 text-xs font-bold text-slate-800 min-w-[24px] text-center">
                            {qty} {(unitModeMap[product._id] || 'PACK') === 'LOOSE' ? 'Tab' : 'Pack'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(product._id, qty + 1)}
                            className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                          >+</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right side: Price + Action button */}
                  <div className="flex flex-col items-end justify-between self-stretch pl-2 border-l border-slate-100 min-w-[85px]">
                    {(() => {
                      const medDetails = getMedicineDetails(product);
                      const currentUnitMode = unitModeMap[product._id] || 'PACK';
                      const perTabletPrice = product.sellingPrice / medDetails.unitsPerPack;
                      const displayPrice = currentUnitMode === 'LOOSE' ? perTabletPrice : product.sellingPrice;

                      return (
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-700 font-heading leading-tight">
                            ₹{displayPrice.toFixed(2)}
                            <span className="text-[9px] font-bold text-slate-500 block">
                              {currentUnitMode === 'LOOSE' ? 'per tablet' : 'per strip'}
                            </span>
                          </div>
                          {currentUnitMode === 'PACK' && medDetails.unitsPerPack > 1 && (
                            <div className="text-[9px] text-slate-400">
                              (₹{perTabletPrice.toFixed(2)}/tab)
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`mt-2 flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer active:scale-95 ${
                        isOut
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isOut ? (
                        <>
                          <Zap className="w-3 h-3" />
                          <span>Substitute</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Add {qty > 1 ? `×${qty}` : ''} {(unitModeMap[product._id] || 'PACK') === 'LOOSE' ? 'Tab' : ''}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
