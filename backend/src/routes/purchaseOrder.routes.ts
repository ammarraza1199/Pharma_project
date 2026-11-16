import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Product } from '../models/Product';
import { Invoice } from '../models/Invoice';
import { Supplier } from '../models/Supplier';
import { getNextSequence } from '../models/Counter';
import { protect, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/purchase-orders — Create Purchase Order (Manager/Owner)
router.post('/', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      supplierId,
      supplierName,
      supplierGstin,
      supplierPhone,
      orderDate,
      expectedDeliveryDate,
      paymentTerms,
      items,
      totalAmount,
      schemeNotes,
      notes,
    } = req.body;

    if (!supplierName || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier name and items are required.' });
    }

    const seq = await getNextSequence('purchaseOrder');
    const poNumber = req.body.poNumber || `PO-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

    const [po] = await PurchaseOrder.create(
      [
        {
          poNumber,
          supplierId: supplierId || 'sup-custom',
          supplierName,
          supplierGstin: supplierGstin || '',
          supplierPhone: supplierPhone || '',
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date(Date.now() + 3 * 86400000),
          paymentTerms: paymentTerms || 'CREDIT_15_DAYS',
          status: req.body.status || 'DRAFT',
          items,
          totalAmount,
          schemeNotes: schemeNotes || '',
          notes: notes || '',
          createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
        },
      ]
    );

    res.status(201).json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
});

// GET /api/purchase-orders — List Purchase Orders
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, supplierId, search, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (supplierId && supplierId !== 'ALL') {
      query.supplierId = supplierId;
    }
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      PurchaseOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PurchaseOrder.countDocuments(query),
    ]);

    res.json({ success: true, data: orders, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// Helper: Match best supplier to a product by brand / topBrandsSupplied / fastest lead time
const matchBestSupplier = (product: any, suppliers: any[]) => {
  if (!suppliers || suppliers.length === 0) {
    return {
      supplierId: 'sup-default',
      name: 'MedLife Distributors Pvt Ltd',
      gstin: '36AAACM8890A1Z2',
      phone: '+91 98490 12345',
      deliveryLeadTimeHours: 24,
      creditPeriodDays: 15,
    };
  }

  const brandLower = (product.brand || '').toLowerCase();
  const nameLower = (product.name || '').toLowerCase();

  // 1. Direct match against topBrandsSupplied
  const brandMatch = suppliers.find((sup) =>
    Array.isArray(sup.topBrandsSupplied) &&
    sup.topBrandsSupplied.some((b: string) => {
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

  // 2. Match supplier name substring
  const nameMatch = suppliers.find(
    (sup) =>
      brandLower.length >= 3 &&
      sup.name.toLowerCase().includes(brandLower.split(' ')[0])
  );
  if (nameMatch) return nameMatch;

  // 3. Fallback to fastest delivery lead time supplier
  return [...suppliers].sort(
    (a, b) => (a.deliveryLeadTimeHours || 24) - (b.deliveryLeadTimeHours || 24)
  )[0];
};

// GET /api/purchase-orders/reorder-suggestions — Real Sales Run-Rate & Automated Replenishment Triggers
router.get('/reorder-suggestions', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lookbackDays = Math.max(7, Math.min(90, Number(req.query.lookbackDays) || 30));
    const targetCoverDays = Math.max(7, Math.min(60, Number(req.query.targetCoverDays) || 21));
    const safetyBufferDays = Math.max(1, Math.min(21, Number(req.query.safetyBufferDays) || 5));

    const cutoffDate = new Date(Date.now() - lookbackDays * 86400000);

    const [products, suppliers, recentInvoices, pendingPOs] = await Promise.all([
      Product.find({ isActive: true }),
      Supplier.find({}),
      Invoice.find({ invoiceDate: { $gte: cutoffDate } }).select('billingSession.items invoiceDate'),
      PurchaseOrder.find({ status: { $in: ['DRAFT', 'PLACED'] } }).select('items poNumber status'),
    ]);

    // Aggregate actual units sold per product from Invoices
    const salesByProductId: Record<string, number> = {};
    const salesByProductName: Record<string, number> = {};
    recentInvoices.forEach((inv: any) => {
      const items = inv.billingSession?.items || [];
      items.forEach((it: any) => {
        const qty = Number(it.quantity) || 0;
        const pid = it.productId?.toString();
        const pname = (it.product?.name || it.productSnapshot?.name || '').toLowerCase();
        if (pid) {
          salesByProductId[pid] = (salesByProductId[pid] || 0) + qty;
        }
        if (pname) {
          salesByProductName[pname] = (salesByProductName[pname] || 0) + qty;
        }
      });
    });

    // Track units already ordered in DRAFT / PLACED POs
    const onOrderByProductId: Record<string, { qty: number; poNumbers: string[] }> = {};
    pendingPOs.forEach((po: any) => {
      (po.items || []).forEach((it: any) => {
        const pid = it.productId?.toString();
        if (!pid) return;
        if (!onOrderByProductId[pid]) {
          onOrderByProductId[pid] = { qty: 0, poNumbers: [] };
        }
        onOrderByProductId[pid].qty += Number(it.quantity) || 0;
        if (!onOrderByProductId[pid].poNumbers.includes(po.poNumber)) {
          onOrderByProductId[pid].poNumbers.push(po.poNumber);
        }
      });
    });

    const suggestions: any[] = [];

    products.forEach((prod: any) => {
      const pid = prod._id.toString();
      const invoiceSold =
        salesByProductId[pid] || salesByProductName[(prod.name || '').toLowerCase()] || 0;

      const runRateSource = invoiceSold > 0 ? 'INVOICE_SALES' : 'VELOCITY_ESTIMATE';
      const dailyRunRate =
        invoiceSold > 0
          ? Number(Math.max(0.5, invoiceSold / lookbackDays).toFixed(2))
          : Number(Math.max(1.5, Math.min(16, 250 / (prod.sellingPrice || 40))).toFixed(1));

      const matchedSupplier = matchBestSupplier(prod, suppliers);
      const leadTimeHours = matchedSupplier.deliveryLeadTimeHours || 24;
      const leadTimeDays = Math.max(1, Math.ceil(leadTimeHours / 24));

      const currentStock = Number(prod.totalStock) || 0;
      const pendingPoInfo = onOrderByProductId[pid] || { qty: 0, poNumbers: [] };
      const effectiveStock = currentStock + pendingPoInfo.qty;

      const daysOfCoverRemaining =
        dailyRunRate > 0 ? Number((currentStock / dailyRunRate).toFixed(1)) : 999;

      const reorderPoint = Math.ceil(dailyRunRate * (leadTimeDays + safetyBufferDays));

      let urgency: 'CRITICAL_OUT' | 'TRIGGER_REORDER' | 'WATCHLIST' | 'OPTIMAL' = 'OPTIMAL';
      if (currentStock === 0 || prod.stockStatus === 'OUT_OF_STOCK' || daysOfCoverRemaining <= leadTimeDays) {
        urgency = 'CRITICAL_OUT';
      } else if (effectiveStock <= reorderPoint || prod.stockStatus === 'LOW_STOCK') {
        urgency = 'TRIGGER_REORDER';
      } else if (currentStock <= reorderPoint + Math.ceil(dailyRunRate * 5)) {
        urgency = 'WATCHLIST';
      }

      if (urgency === 'OPTIMAL') return;

      const rawTargetQty = Math.ceil(dailyRunRate * targetCoverDays) - effectiveStock;
      const suggestedOrderQty = Math.max(10, rawTargetQty);

      const batchWithRate = (prod.batches || []).find((b: any) => b.purchaseRate && b.purchaseRate > 0);
      const estimatedRate = Number(
        (batchWithRate?.purchaseRate || prod.unitMRP * 0.72 || prod.sellingPrice * 0.75).toFixed(2)
      );
      const gstRate = prod.gstRate ?? 12;
      const estimatedLineTotal = Number(
        (suggestedOrderQty * estimatedRate * (1 + gstRate / 100)).toFixed(2)
      );

      suggestions.push({
        productId: pid,
        productName: prod.name,
        brand: prod.brand,
        saltComposition: prod.saltComposition,
        packType: prod.packType || 'Strip of 10 Tablets',
        currentStock,
        onOrderQty: pendingPoInfo.qty,
        pendingPoNumbers: pendingPoInfo.poNumbers,
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
        supplierId: matchedSupplier._id?.toString() || matchedSupplier.supplierId || 'sup-default',
        supplierName: matchedSupplier.name,
        supplierGstin: matchedSupplier.gstin || '',
        supplierPhone: matchedSupplier.phone || '',
        creditPeriodDays: matchedSupplier.creditPeriodDays || 15,
      });
    });

    const urgencyRank: Record<string, number> = {
      CRITICAL_OUT: 0,
      TRIGGER_REORDER: 1,
      WATCHLIST: 2,
    };
    suggestions.sort((a, b) => {
      if (urgencyRank[a.urgency] !== urgencyRank[b.urgency]) {
        return urgencyRank[a.urgency] - urgencyRank[b.urgency];
      }
      return a.daysOfCoverRemaining - b.daysOfCoverRemaining;
    });

    // Group actionable items (CRITICAL_OUT + TRIGGER_REORDER) by matched supplier
    const groupMap: Record<string, any> = {};
    suggestions.forEach((item) => {
      const sid = item.supplierId;
      if (!groupMap[sid]) {
        groupMap[sid] = {
          supplierId: sid,
          supplierName: item.supplierName,
          supplierGstin: item.supplierGstin,
          supplierPhone: item.supplierPhone,
          leadTimeDays: item.leadTimeDays,
          creditPeriodDays: item.creditPeriodDays,
          items: [],
          totalEstimatedAmount: 0,
        };
      }
      groupMap[sid].items.push(item);
      groupMap[sid].totalEstimatedAmount = Number(
        (groupMap[sid].totalEstimatedAmount + item.estimatedLineTotal).toFixed(2)
      );
    });

    const groupedBySupplier = Object.values(groupMap);
    const criticalCount = suggestions.filter((s) => s.urgency === 'CRITICAL_OUT').length;
    const triggerCount = suggestions.filter((s) => s.urgency === 'TRIGGER_REORDER').length;
    const totalSuggestedSpend = Number(
      suggestions.reduce((sum, s) => sum + s.estimatedLineTotal, 0).toFixed(2)
    );

    res.json({
      success: true,
      data: {
        suggestions,
        groupedBySupplier,
        summary: {
          lookbackDays,
          targetCoverDays,
          safetyBufferDays,
          criticalCount,
          triggerCount,
          watchlistCount: suggestions.filter((s) => s.urgency === 'WATCHLIST').length,
          suppliersCount: groupedBySupplier.length,
          totalSuggestedSpend,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/purchase-orders/auto-generate — Bulk Generate 1-Click Supplier POs from Replenishment Triggers
router.post('/auto-generate', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { supplierGroups, autoPlace = false } = req.body;
    if (!Array.isArray(supplierGroups) || supplierGroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'supplierGroups array with at least one supplier order is required.',
      });
    }

    const createdOrders: any[] = [];

    for (const grp of supplierGroups) {
      if (!grp.supplierName || !Array.isArray(grp.items) || grp.items.length === 0) continue;

      const seq = await getNextSequence('purchaseOrder');
      const poNumber = `PO-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

      const formattedItems = grp.items.map((it: any) => {
        const qty = Math.max(1, Number(it.quantity) || 10);
        const rate = Number(it.estimatedRate) || 50;
        const gst = Number(it.gstRate) ?? 12;
        const total = Number((qty * rate * (1 + gst / 100)).toFixed(2));
        return {
          productId: it.productId,
          productName: it.productName,
          packType: it.packType || 'Strip of 10 Tablets',
          quantity: qty,
          estimatedRate: rate,
          gstRate: gst,
          totalAmount: total,
        };
      });

      const poTotal = Number(
        formattedItems.reduce((sum: number, it: any) => sum + it.totalAmount, 0).toFixed(2)
      );

      const leadDays = Math.max(1, Number(grp.leadTimeDays) || 2);
      const expectedDeliveryDate = new Date(Date.now() + leadDays * 86400000);

      const po = await PurchaseOrder.create({
        poNumber,
        supplierId: grp.supplierId || 'sup-auto',
        supplierName: grp.supplierName,
        supplierGstin: grp.supplierGstin || '',
        supplierPhone: grp.supplierPhone || '',
        orderDate: new Date(),
        expectedDeliveryDate,
        paymentTerms: grp.creditPeriodDays === 30 ? 'CREDIT_30_DAYS' : grp.creditPeriodDays === 10 ? 'CREDIT_10_DAYS' : 'CREDIT_15_DAYS',
        status: autoPlace ? 'PLACED' : 'DRAFT',
        items: formattedItems,
        totalAmount: poTotal,
        schemeNotes: grp.schemeNotes || 'Auto-Generated via Smart Run-Rate Replenishment Engine',
        notes: grp.notes || `Run-rate triggered order (${formattedItems.length} SKUs).`,
        createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      });

      createdOrders.push(po);
    }

    res.status(201).json({
      success: true,
      count: createdOrders.length,
      data: createdOrders,
      message: `Generated ${createdOrders.length} Supplier Purchase Order(s) successfully.`,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/purchase-orders/:id — Get Single Purchase Order
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let order: any = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      order = await PurchaseOrder.findById(req.params.id);
    }
    if (!order) {
      order = await PurchaseOrder.findOne({ poNumber: req.params.id });
    }
    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// PUT /api/purchase-orders/:id/status — Update PO Status (Manager/Owner)
router.put('/:id/status', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'PLACED', 'CONVERTED_TO_GRN', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    let order = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      order = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
    }
    if (!order) {
      order = await PurchaseOrder.findOneAndUpdate({ poNumber: req.params.id }, { status }, { new: true });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/purchase-orders/:id — Delete Purchase Order (Owner Only)
router.delete('/:id', protect, requireRole('OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let deleted = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      deleted = await PurchaseOrder.findByIdAndDelete(req.params.id);
    }
    if (!deleted) {
      deleted = await PurchaseOrder.findOneAndDelete({ poNumber: req.params.id });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    res.json({ success: true, message: 'Purchase order deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
