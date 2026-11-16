import type {
  Product,
  SupplierRecord,
  PurchaseOrder,
  FinalizedInvoice,
  ReorderSuggestionItem,
  SupplierReorderGroup
} from '../types/pos';

/**
 * Matches a medicine product to its optimal wholesale supplier by checking
 * supplied brands, supplier name affinity, and fastest delivery lead time.
 */
export const matchBestSupplierForProduct = (
  product: Pick<Product, 'name' | 'brand'>,
  suppliers: SupplierRecord[]
): SupplierRecord => {
  if (!suppliers || suppliers.length === 0) {
    return {
      supplierId: 'sup-default',
      name: 'MedLife Distributors Pvt Ltd',
      contactPerson: 'Rajesh Verma',
      phone: '+91 98490 12345',
      email: 'rajesh@medlifedist.com',
      gstin: '36AAACM8890A1Z2',
      dlNumber: 'DL-1002/HYD',
      address: 'Pharma City, Hyderabad',
      pendingBalance: 0,
      deliveryLeadTimeHours: 24,
      creditPeriodDays: 15
    };
  }

  const brandLower = (product.brand || '').toLowerCase();
  const nameLower = (product.name || '').toLowerCase();

  // 1. Direct match against topBrandsSupplied
  const brandMatch = suppliers.find(
    (sup) =>
      Array.isArray(sup.topBrandsSupplied) &&
      sup.topBrandsSupplied.some((b) => {
        const bLower = b.toLowerCase();
        return (
          brandLower.includes(bLower) ||
          bLower.includes(brandLower) ||
          nameLower.includes(bLower) ||
          (bLower === 'gsk' && brandLower.includes('glaxo'))
        );
      })
  );
  if (brandMatch) return brandMatch;

  // 2. Match supplier name against first token of product brand
  const firstToken = brandLower.split(' ')[0];
  if (firstToken.length >= 3) {
    const nameMatch = suppliers.find((sup) =>
      sup.name.toLowerCase().includes(firstToken)
    );
    if (nameMatch) return nameMatch;
  }

  // 3. Fallback to fastest lead-time / highest-scoring distributor
  return [...suppliers].sort(
    (a, b) => (a.deliveryLeadTimeHours || 24) - (b.deliveryLeadTimeHours || 24)
  )[0];
};

/**
 * Groups flat reorder suggestion items into per-supplier Purchase Order bundles.
 */
export const groupSuggestionsBySupplier = (
  suggestions: ReorderSuggestionItem[]
): SupplierReorderGroup[] => {
  const map: Record<string, SupplierReorderGroup> = {};

  suggestions.forEach((item) => {
    const sid = item.supplierId || item.supplierName;
    if (!map[sid]) {
      map[sid] = {
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        supplierGstin: item.supplierGstin,
        supplierPhone: item.supplierPhone,
        leadTimeDays: item.leadTimeDays,
        creditPeriodDays: item.creditPeriodDays,
        items: [],
        totalEstimatedAmount: 0
      };
    }
    map[sid].items.push(item);
    map[sid].totalEstimatedAmount = Number(
      (map[sid].totalEstimatedAmount + item.estimatedLineTotal).toFixed(2)
    );
  });

  return Object.values(map).sort(
    (a, b) => b.totalEstimatedAmount - a.totalEstimatedAmount
  );
};

interface ComputeOptions {
  products: Product[];
  suppliers: SupplierRecord[];
  purchaseOrders: PurchaseOrder[];
  invoices: FinalizedInvoice[];
  lookbackDays: number;
  targetCoverDays: number;
  safetyBufferDays: number;
}

/**
 * Computes automated stock replenishment suggestions using real sales velocity
 * from finalized invoices when available, paired with pending PO on-order stock.
 */
export const computeLocalReorderSuggestions = ({
  products,
  suppliers,
  purchaseOrders,
  invoices,
  lookbackDays,
  targetCoverDays,
  safetyBufferDays
}: ComputeOptions) => {
  const cutoffMs = Date.now() - lookbackDays * 86400000;

  // Aggregate sales quantities from local finalized invoices in lookback window
  const salesByProductId: Record<string, number> = {};
  invoices.forEach((inv) => {
    const invTime = new Date(inv.invoiceDate).getTime();
    if (!Number.isNaN(invTime) && invTime < cutoffMs) return;
    (inv.billingSession?.items || []).forEach((it) => {
      const pid = it.productId || it.product?._id;
      if (pid) {
        salesByProductId[pid] = (salesByProductId[pid] || 0) + (Number(it.quantity) || 0);
      }
    });
  });

  // Track already-ordered quantities in DRAFT / PLACED POs
  const onOrderByProductId: Record<string, { qty: number; poNumbers: string[] }> = {};
  purchaseOrders
    .filter((po) => po.status === 'DRAFT' || po.status === 'PLACED')
    .forEach((po) => {
      (po.items || []).forEach((it) => {
        if (!it.productId) return;
        if (!onOrderByProductId[it.productId]) {
          onOrderByProductId[it.productId] = { qty: 0, poNumbers: [] };
        }
        onOrderByProductId[it.productId].qty += Number(it.quantity) || 0;
        if (!onOrderByProductId[it.productId].poNumbers.includes(po.poNumber)) {
          onOrderByProductId[it.productId].poNumbers.push(po.poNumber);
        }
      });
    });

  const suggestions: ReorderSuggestionItem[] = [];

  products.forEach((prod) => {
    const invoiceSold = salesByProductId[prod._id] || 0;
    const runRateSource: 'INVOICE_SALES' | 'VELOCITY_ESTIMATE' =
      invoiceSold > 0 ? 'INVOICE_SALES' : 'VELOCITY_ESTIMATE';

    const dailyRunRate =
      invoiceSold > 0
        ? Number(Math.max(0.5, invoiceSold / lookbackDays).toFixed(2))
        : Number(Math.max(2, Math.min(18, 250 / (prod.sellingPrice || 40))).toFixed(1));

    const matchedSupplier = matchBestSupplierForProduct(prod, suppliers);
    const leadTimeDays = Math.max(1, Math.ceil((matchedSupplier.deliveryLeadTimeHours || 24) / 24));

    const currentStock = Number(prod.totalStock) || 0;
    const pendingInfo = onOrderByProductId[prod._id] || { qty: 0, poNumbers: [] };
    const effectiveStock = currentStock + pendingInfo.qty;

    const daysOfCoverRemaining =
      dailyRunRate > 0 ? Number((currentStock / dailyRunRate).toFixed(1)) : 999;

    const reorderPoint = Math.ceil(dailyRunRate * (leadTimeDays + safetyBufferDays));

    let urgency: ReorderSuggestionItem['urgency'] | 'OPTIMAL' = 'OPTIMAL';
    if (currentStock === 0 || prod.stockStatus === 'OUT_OF_STOCK' || daysOfCoverRemaining <= leadTimeDays) {
      urgency = 'CRITICAL_OUT';
    } else if (effectiveStock <= reorderPoint || prod.stockStatus === 'LOW_STOCK') {
      urgency = 'TRIGGER_REORDER';
    } else if (currentStock <= reorderPoint + Math.ceil(dailyRunRate * 5)) {
      urgency = 'WATCHLIST';
    }

    if (urgency === 'OPTIMAL') return;

    const suggestedOrderQty = Math.max(
      10,
      Math.ceil(dailyRunRate * targetCoverDays) - effectiveStock
    );
    const batchWithRate = (prod.batches || []).find((b) => b.purchaseRate && b.purchaseRate > 0);
    const estimatedRate = Number(
      (batchWithRate?.purchaseRate || prod.unitMRP * 0.72 || prod.sellingPrice * 0.75).toFixed(2)
    );
    const gstRate = prod.gstRate ?? 12;
    const estimatedLineTotal = Number(
      (suggestedOrderQty * estimatedRate * (1 + gstRate / 100)).toFixed(2)
    );

    suggestions.push({
      productId: prod._id,
      productName: prod.name,
      brand: prod.brand,
      saltComposition: prod.saltComposition,
      packType: prod.packType || 'Strip of 10 Tablets',
      currentStock,
      onOrderQty: pendingInfo.qty,
      pendingPoNumbers: pendingInfo.poNumbers,
      soldInLookback: invoiceSold,
      dailyRunRate,
      runRateSource,
      daysOfCoverRemaining,
      leadTimeDays,
      safetyBufferDays,
      reorderPoint,
      suggestedOrderQty,
      estimatedRate,
      gstRate,
      estimatedLineTotal,
      urgency,
      supplierId: matchedSupplier.supplierId,
      supplierName: matchedSupplier.name,
      supplierGstin: matchedSupplier.gstin,
      supplierPhone: matchedSupplier.phone,
      creditPeriodDays: matchedSupplier.creditPeriodDays || 15
    });
  });

  const rank: Record<ReorderSuggestionItem['urgency'], number> = {
    CRITICAL_OUT: 0,
    TRIGGER_REORDER: 1,
    WATCHLIST: 2
  };
  suggestions.sort((a, b) =>
    rank[a.urgency] !== rank[b.urgency]
      ? rank[a.urgency] - rank[b.urgency]
      : a.daysOfCoverRemaining - b.daysOfCoverRemaining
  );

  return {
    suggestions,
    groupedBySupplier: groupSuggestionsBySupplier(suggestions),
    summary: {
      lookbackDays,
      targetCoverDays,
      safetyBufferDays,
      criticalCount: suggestions.filter((s) => s.urgency === 'CRITICAL_OUT').length,
      triggerCount: suggestions.filter((s) => s.urgency === 'TRIGGER_REORDER').length,
      watchlistCount: suggestions.filter((s) => s.urgency === 'WATCHLIST').length,
      suppliersCount: groupSuggestionsBySupplier(suggestions).length,
      totalSuggestedSpend: Number(
        suggestions.reduce((sum, s) => sum + s.estimatedLineTotal, 0).toFixed(2)
      )
    }
  };
};

