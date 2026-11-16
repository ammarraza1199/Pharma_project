import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../utils/api';
import type { RootState } from '../store';
import { createMultiplePurchaseOrders, navigateTo } from '../store/posSlice';
import type {
  PurchaseOrder,
  ReorderSuggestionItem,
  SupplierReorderGroup
} from '../types/pos';
import {
  computeLocalReorderSuggestions,
  groupSuggestionsBySupplier
} from '../utils/replenishmentEngine';
import {
  Zap, TrendingDown, AlertTriangle, Building, ShoppingCart,
  RefreshCw, CheckCircle2, SlidersHorizontal, ArrowRight, Package,
  Layers, Clock, DollarSign, Sparkles, Check
} from 'lucide-react';

interface Props {
  onGoToPOs?: () => void;
}

export const SmartReplenishmentPanel: React.FC<Props> = ({ onGoToPOs }) => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.pos.products);
  const suppliers = useSelector((state: RootState) => state.pos.suppliers);
  const purchaseOrders = useSelector((state: RootState) => state.pos.purchaseOrders);
  const invoices = useSelector((state: RootState) => state.pos.invoices);

  // Configurable Replenishment Rules
  const [lookbackDays, setLookbackDays] = useState<number>(30);
  const [targetCoverDays, setTargetCoverDays] = useState<number>(21);
  const [safetyBufferDays, setSafetyBufferDays] = useState<number>(5);

  // View & Filter State
  const [viewMode, setViewMode] = useState<'BY_SUPPLIER' | 'SKU_MATRIX'>('BY_SUPPLIER');
  const [includeWatchlist, setIncludeWatchlist] = useState<boolean>(false);
  const [autoPlacePo, setAutoPlacePo] = useState<boolean>(false);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [apiSalesMap, setApiSalesMap] = useState<Record<string, { soldInLookback: number; dailyRunRate: number }>>({});

  // Per-item overrides (custom quantity, custom supplier, selection)
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});
  const [supplierOverrides, setSupplierOverrides] = useState<Record<string, string>>({});
  const [excludedIds, setExcludedIds] = useState<Record<string, boolean>>({});

  // Toast feedback
  const [generatedToast, setGeneratedToast] = useState<{ count: number; poNumbers: string[] } | null>(null);

  // Sync real backend Invoice sales velocity whenever rules change
  const fetchBackendRunRates = async () => {
    setIsLoadingApi(true);
    try {
      const res = await api.get(
        `/purchase-orders/reorder-suggestions?lookbackDays=${lookbackDays}&targetCoverDays=${targetCoverDays}&safetyBufferDays=${safetyBufferDays}`
      );
      if (res.data?.success && Array.isArray(res.data.data?.suggestions)) {
        const salesLookup: Record<string, { soldInLookback: number; dailyRunRate: number }> = {};
        res.data.data.suggestions.forEach((s: ReorderSuggestionItem) => {
          if (s.runRateSource === 'INVOICE_SALES') {
            salesLookup[s.productId] = {
              soldInLookback: s.soldInLookback,
              dailyRunRate: s.dailyRunRate
            };
          }
        });
        setApiSalesMap(salesLookup);
      }
    } catch {
      // Gracefully operate with local Redux invoices & stock catalog
    } finally {
      setIsLoadingApi(false);
    }
  };

  useEffect(() => {
    fetchBackendRunRates();
  }, [lookbackDays, targetCoverDays, safetyBufferDays]);

  // Compute live replenishment suggestions (blending backend sales velocity + live Redux stock/POs)
  const rawEngineResult = useMemo(() => {
    const base = computeLocalReorderSuggestions({
      products,
      suppliers,
      purchaseOrders,
      invoices,
      lookbackDays,
      targetCoverDays,
      safetyBufferDays
    });

    // Apply any backend invoice sales velocity overrides + user quantity/supplier edits
    const enrichedSuggestions: ReorderSuggestionItem[] = base.suggestions
      .filter((s) => includeWatchlist || s.urgency !== 'WATCHLIST')
      .map((s) => {
        const apiSales = apiSalesMap[s.productId];
        const effectiveRunRate = apiSales ? apiSales.dailyRunRate : s.dailyRunRate;
        const effectiveSold = apiSales ? apiSales.soldInLookback : s.soldInLookback;
        const effectiveSource = apiSales ? 'INVOICE_SALES' : s.runRateSource;

        const overriddenSupplierId = supplierOverrides[s.productId];
        const sup = overriddenSupplierId
          ? suppliers.find((x) => x.supplierId === overriddenSupplierId)
          : null;

        const qty = qtyOverrides[s.productId] ?? s.suggestedOrderQty;
        const lineTotal = Number(
          (qty * s.estimatedRate * (1 + s.gstRate / 100)).toFixed(2)
        );

        return {
          ...s,
          soldInLookback: effectiveSold,
          dailyRunRate: effectiveRunRate,
          runRateSource: effectiveSource,
          suggestedOrderQty: qty,
          estimatedLineTotal: lineTotal,
          supplierId: sup ? sup.supplierId : s.supplierId,
          supplierName: sup ? sup.name : s.supplierName,
          supplierGstin: sup ? sup.gstin : s.supplierGstin,
          supplierPhone: sup ? sup.phone : s.supplierPhone,
          creditPeriodDays: sup ? sup.creditPeriodDays || 15 : s.creditPeriodDays
        };
      });

    const activeSuggestions = enrichedSuggestions.filter((s) => !excludedIds[s.productId]);
    const grouped = groupSuggestionsBySupplier(activeSuggestions);

    return {
      allSuggestions: enrichedSuggestions,
      activeSuggestions,
      groupedBySupplier: grouped,
      criticalCount: enrichedSuggestions.filter((s) => s.urgency === 'CRITICAL_OUT').length,
      triggerCount: enrichedSuggestions.filter((s) => s.urgency === 'TRIGGER_REORDER').length,
      totalSpend: Number(
        activeSuggestions.reduce((sum, s) => sum + s.estimatedLineTotal, 0).toFixed(2)
      )
    };
  }, [
    products,
    suppliers,
    purchaseOrders,
    invoices,
    lookbackDays,
    targetCoverDays,
    safetyBufferDays,
    includeWatchlist,
    apiSalesMap,
    qtyOverrides,
    supplierOverrides,
    excludedIds
  ]);

  // Generate POs for one or all supplier groups
  const handleGeneratePurchaseOrders = async (groupsToCreate: SupplierReorderGroup[]) => {
    const validGroups = groupsToCreate.filter((g) => g.items.length > 0);
    if (validGroups.length === 0) return;

    setIsGenerating(true);
    const now = new Date();

    const payloadGroups = validGroups.map((g) => ({
      supplierId: g.supplierId,
      supplierName: g.supplierName,
      supplierGstin: g.supplierGstin,
      supplierPhone: g.supplierPhone,
      leadTimeDays: g.leadTimeDays,
      creditPeriodDays: g.creditPeriodDays,
      schemeNotes: `Auto-Generated via Smart Run-Rate Trigger (${lookbackDays}d lookback, ${targetCoverDays}d cover)`,
      notes: `Auto-replenishment order covering ${g.items.length} low-stock SKU(s).`,
      items: g.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        packType: it.packType,
        quantity: it.suggestedOrderQty,
        estimatedRate: it.estimatedRate,
        gstRate: it.gstRate,
        totalAmount: it.estimatedLineTotal
      }))
    }));

    let createdPOs: PurchaseOrder[] = [];

    try {
      const res = await api.post('/purchase-orders/auto-generate', {
        supplierGroups: payloadGroups,
        autoPlace: autoPlacePo
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        createdPOs = res.data.data.map((po: any) => ({
          poId: po.poId || po._id?.toString() || `po-${Date.now()}-${Math.random()}`,
          poNumber: po.poNumber,
          supplierId: po.supplierId || '',
          supplierName: po.supplierName,
          supplierGstin: po.supplierGstin || '',
          supplierPhone: po.supplierPhone || '',
          orderDate:
            typeof po.orderDate === 'string'
              ? po.orderDate.split('T')[0]
              : now.toISOString().split('T')[0],
          expectedDeliveryDate:
            typeof po.expectedDeliveryDate === 'string'
              ? po.expectedDeliveryDate.split('T')[0]
              : new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0],
          paymentTerms: po.paymentTerms || 'CREDIT_15_DAYS',
          status: po.status || (autoPlacePo ? 'PLACED' : 'DRAFT'),
          items: po.items || [],
          totalAmount: po.totalAmount || 0,
          schemeNotes: po.schemeNotes || '',
          notes: po.notes || '',
          createdAt: now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        }));
      }
    } catch {
      // Offline / No-DB graceful fallback
      createdPOs = payloadGroups.map((grp, idx) => ({
        poId: `po-auto-${Date.now()}-${idx}`,
        poNumber: `PO-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplierId: grp.supplierId,
        supplierName: grp.supplierName,
        supplierGstin: grp.supplierGstin,
        supplierPhone: grp.supplierPhone,
        orderDate: now.toISOString().split('T')[0],
        expectedDeliveryDate: new Date(now.getTime() + grp.leadTimeDays * 86400000)
          .toISOString()
          .split('T')[0],
        paymentTerms:
          grp.creditPeriodDays === 30
            ? 'CREDIT_30_DAYS'
            : grp.creditPeriodDays === 10
            ? 'CREDIT_10_DAYS'
            : 'CREDIT_15_DAYS',
        status: autoPlacePo ? 'PLACED' : 'DRAFT',
        items: grp.items,
        totalAmount: Number(
          grp.items.reduce((sum, it) => sum + it.totalAmount, 0).toFixed(2)
        ),
        schemeNotes: grp.schemeNotes,
        notes: grp.notes,
        createdAt: now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      }));
    } finally {
      setIsGenerating(false);
    }

    if (createdPOs.length > 0) {
      dispatch(createMultiplePurchaseOrders(createdPOs));
      setGeneratedToast({
        count: createdPOs.length,
        poNumbers: createdPOs.map((p) => p.poNumber)
      });
      setTimeout(() => setGeneratedToast(null), 7000);
    }
  };

  const handleGoToPOsScreen = () => {
    if (onGoToPOs) {
      onGoToPOs();
    } else {
      dispatch(navigateTo('SUPPLIERS'));
    }
  };

  return (
    <div className="space-y-4">
      {/* ── GENERATED PO CONFIRMATION BANNER ────────────────────────── */}
      {generatedToast && (
        <div className="bg-emerald-900 text-white rounded-2xl p-3.5 shadow-lg border border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/40">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs font-black">
                Generated {generatedToast.count} Supplier Purchase Order(s):{' '}
                <span className="font-mono text-emerald-300">
                  {generatedToast.poNumbers.join(', ')}
                </span>
              </div>
              <div className="text-[11px] text-emerald-100">
                All SKUs are now marked as On-Order. Print, WhatsApp vendors, or convert to GRN on delivery.
              </div>
            </div>
          </div>

          <button
            onClick={handleGoToPOsScreen}
            className="px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-black rounded-xl cursor-pointer flex items-center space-x-1.5 shrink-0"
          >
            <span>Open Advance POs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── TOP HEADER & RULE CONFIGURATION BAR ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 font-heading flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Automated Run-Rate &amp; Smart Reorder Triggers</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Reorder Point = (Daily Sales Run-Rate × (Vendor Lead Time + Safety Buffer)). Generates separate POs grouped by best vendor.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={fetchBackendRunRates}
              disabled={isLoadingApi}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApi ? 'animate-spin' : ''}`} />
              <span>Recalculate</span>
            </button>

            <button
              disabled={isGenerating || rawEngineResult.groupedBySupplier.length === 0}
              onClick={() => handleGeneratePurchaseOrders(rawEngineResult.groupedBySupplier)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                {isGenerating
                  ? 'Generating POs...'
                  : `⚡ Auto-Generate All ${rawEngineResult.groupedBySupplier.length} Supplier PO(s)`}
              </span>
            </button>
          </div>
        </div>

        {/* Formula Parameters Strip */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-bold text-slate-600">Sales Window:</span>
              <select
                value={lookbackDays}
                onChange={(e) => setLookbackDays(Number(e.target.value))}
                className="bg-transparent font-extrabold text-slate-900 text-[11px] focus:outline-hidden cursor-pointer"
              >
                <option value={7}>Last 7 Days</option>
                <option value={14}>Last 14 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-bold text-slate-600">Target Stock Cover:</span>
              <select
                value={targetCoverDays}
                onChange={(e) => setTargetCoverDays(Number(e.target.value))}
                className="bg-transparent font-extrabold text-slate-900 text-[11px] focus:outline-hidden cursor-pointer"
              >
                <option value={15}>15 Days</option>
                <option value={21}>21 Days (Recommended)</option>
                <option value={30}>30 Days</option>
                <option value={45}>45 Days</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-bold text-slate-600">Safety Buffer:</span>
              <select
                value={safetyBufferDays}
                onChange={(e) => setSafetyBufferDays(Number(e.target.value))}
                className="bg-transparent font-extrabold text-slate-900 text-[11px] focus:outline-hidden cursor-pointer"
              >
                <option value={3}>+3 Days</option>
                <option value={5}>+5 Days</option>
                <option value={7}>+7 Days</option>
              </select>
            </div>

            <label className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeWatchlist}
                onChange={(e) => setIncludeWatchlist(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Include Watchlist SKUs</span>
            </label>

            <label className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoPlacePo}
                onChange={(e) => setAutoPlacePo(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Mark PO as Placed Immediately</span>
            </label>
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('BY_SUPPLIER')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                viewMode === 'BY_SUPPLIER'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grouped by Supplier ({rawEngineResult.groupedBySupplier.length})
            </button>
            <button
              onClick={() => setViewMode('SKU_MATRIX')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                viewMode === 'SKU_MATRIX'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SKU Run-Rate Matrix ({rawEngineResult.allSuggestions.length})
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI METRICS STRIP ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-rose-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-rose-100 p-2.5 rounded-xl text-rose-700">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Critical / Stockout Risk</p>
            <h3 className="text-xl font-black text-rose-800 font-heading">{rawEngineResult.criticalCount} SKUs</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Reorder Point Reached</p>
            <h3 className="text-xl font-black text-amber-900 font-heading">{rawEngineResult.triggerCount} SKUs</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matched Distributors</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{rawEngineResult.groupedBySupplier.length} Vendors</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Estimated PO Value (incl. GST)</p>
            <h3 className="text-xl font-black text-emerald-900 font-heading">
              ₹{rawEngineResult.totalSpend.toLocaleString('en-IN')}
            </h3>
          </div>
        </div>
      </div>

      {/* ── EMPTY STATE ─────────────────────────────────────────────── */}
      {rawEngineResult.allSuggestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-black text-slate-900">All Stock Levels Optimal!</h3>
          <p className="text-xs text-slate-500">
            No SKUs are below your configured Reorder Point ({safetyBufferDays}d buffer + vendor lead time). Toggle "Include Watchlist SKUs" to preview upcoming reorders.
          </p>
        </div>
      ) : viewMode === 'BY_SUPPLIER' ? (
        /* ── VIEW 1: GROUPED BY SUPPLIER (1-CLICK SUPPLIER PO CARDS) ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rawEngineResult.groupedBySupplier.map((group) => (
            <div
              key={group.supplierId}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
            >
              {/* Card Header */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-black text-slate-900">{group.supplierName}</h4>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center space-x-2">
                    <span>Lead Time: {group.leadTimeDays}d</span>
                    <span>•</span>
                    <span>Credit: {group.creditPeriodDays} Days</span>
                    <span>•</span>
                    <span>{group.items.length} SKU(s)</span>
                  </div>
                </div>

                <button
                  disabled={isGenerating}
                  onClick={() => handleGeneratePurchaseOrders([group])}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-2xs cursor-pointer flex items-center space-x-1 shrink-0 active:scale-95 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate PO</span>
                </button>
              </div>

              {/* Supplier Items */}
              <div className="divide-y divide-slate-100 flex-1 max-h-72 overflow-y-auto">
                {group.items.map((item) => (
                  <div key={item.productId} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/70">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 truncate">{item.productName}</span>
                        {item.urgency === 'CRITICAL_OUT' ? (
                          <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full border border-rose-200 shrink-0">
                            CRITICAL
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full border border-amber-200 shrink-0">
                            REORDER
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-2 flex-wrap">
                        <span>Stock: <strong className="text-slate-700">{item.currentStock}</strong></span>
                        <span>•</span>
                        <span>Run-Rate: <strong className="text-slate-700">{item.dailyRunRate}/day</strong></span>
                        <span>•</span>
                        <span className={item.daysOfCoverRemaining <= item.leadTimeDays ? 'text-rose-700 font-bold' : ''}>
                          Cover: {item.daysOfCoverRemaining}d left
                        </span>
                        {item.onOrderQty > 0 && (
                          <span className="text-blue-700 font-bold bg-blue-50 px-1.5 rounded">
                            +{item.onOrderQty} On Order
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Editable Qty + Cost */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="text-right">
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Order Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={item.suggestedOrderQty}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            setQtyOverrides((prev) => ({ ...prev, [item.productId]: val }));
                          }}
                          className="w-16 px-2 py-1 text-xs font-extrabold text-center border border-slate-300 rounded-lg bg-white"
                        />
                      </div>
                      <div className="text-right min-w-16">
                        <div className="text-[9px] text-slate-400">Est. Cost</div>
                        <div className="font-black text-emerald-800">₹{item.estimatedLineTotal.toFixed(0)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer */}
              <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Estimated PO Total (incl. GST):</span>
                <span className="text-sm font-black text-emerald-800">
                  ₹{group.totalEstimatedAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── VIEW 2: SKU RUN-RATE MATRIX TABLE ──────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Triggered SKUs Run-Rate Breakdown ({rawEngineResult.activeSuggestions.length} selected)</span>
            <button
              disabled={isGenerating || rawEngineResult.groupedBySupplier.length === 0}
              onClick={() => handleGeneratePurchaseOrders(rawEngineResult.groupedBySupplier)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg cursor-pointer"
            >
              ⚡ Draft POs for Selected ({rawEngineResult.activeSuggestions.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '880px' }}>
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-3 py-2.5 text-center w-10">Inc</th>
                  <th className="px-3 py-2.5">Medicine &amp; Salt</th>
                  <th className="px-3 py-2.5 text-center">Stock / Pending PO</th>
                  <th className="px-3 py-2.5 text-center">Daily Run-Rate</th>
                  <th className="px-3 py-2.5 text-center">Cover / ROP</th>
                  <th className="px-3 py-2.5">Matched Distributor</th>
                  <th className="px-3 py-2.5 text-center">Order Qty</th>
                  <th className="px-3 py-2.5 text-right">Est. Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawEngineResult.allSuggestions.map((item) => {
                  const isSelected = !excludedIds[item.productId];
                  return (
                    <tr key={item.productId} className={isSelected ? 'hover:bg-slate-50' : 'opacity-50 bg-slate-50'}>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            setExcludedIds((prev) => ({ ...prev, [item.productId]: !e.target.checked }))
                          }
                          className="rounded text-emerald-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{item.productName}</span>
                          {item.urgency === 'CRITICAL_OUT' && (
                            <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 rounded-full font-black">CRITICAL</span>
                          )}
                          {item.urgency === 'TRIGGER_REORDER' && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 rounded-full font-bold">TRIGGER</span>
                          )}
                          {item.urgency === 'WATCHLIST' && (
                            <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 rounded-full font-bold">WATCH</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{item.brand} · {item.saltComposition}</div>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <div className="font-black text-slate-900">{item.currentStock} units</div>
                        {item.onOrderQty > 0 && (
                          <div className="text-[10px] font-bold text-blue-700">+{item.onOrderQty} in PO</div>
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <div className="font-bold text-slate-900">{item.dailyRunRate}/day</div>
                        <span
                          className={`text-[9px] px-1.5 rounded font-semibold ${
                            item.runRateSource === 'INVOICE_SALES'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.runRateSource === 'INVOICE_SALES' ? `${item.soldInLookback} sold (${lookbackDays}d)` : 'Est. velocity'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <div className={`font-black ${item.daysOfCoverRemaining <= item.leadTimeDays ? 'text-rose-700' : 'text-amber-800'}`}>
                          {item.daysOfCoverRemaining}d left
                        </div>
                        <div className="text-[10px] text-slate-500">ROP: {item.reorderPoint}u</div>
                      </td>

                      <td className="px-3 py-2.5">
                        <select
                          value={item.supplierId}
                          onChange={(e) =>
                            setSupplierOverrides((prev) => ({ ...prev, [item.productId]: e.target.value }))
                          }
                          className="w-full max-w-[180px] p-1.5 text-[11px] font-bold border border-slate-300 rounded-lg bg-white text-slate-800"
                        >
                          {suppliers.map((sup) => (
                            <option key={sup.supplierId} value={sup.supplierId}>
                              {sup.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.suggestedOrderQty}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            setQtyOverrides((prev) => ({ ...prev, [item.productId]: val }));
                          }}
                          className="w-16 px-2 py-1 text-xs font-extrabold text-center border border-slate-300 rounded-lg bg-white"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-right font-black text-emerald-800">
                        ₹{item.estimatedLineTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

