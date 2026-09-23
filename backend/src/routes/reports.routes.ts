import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice';
import { Product } from '../models/Product';
import { GRNEntry } from '../models/GRNEntry';
import { DisposalRecord } from '../models/DisposalRecord';
import { ReturnNote } from '../models/ReturnNote';
import { Supplier } from '../models/Supplier';
import { protect, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

const getTodayRange = () => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getYesterdayRange = () => {
  const start = new Date(); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setDate(end.getDate() - 1); end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET /api/reports/dashboard-stats
router.get('/dashboard-stats', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = getTodayRange();
    const yesterday = getYesterdayRange();

    const [todayInvoices, yesterdayInvoices, recentBills, lowStockProducts] = await Promise.all([
      Invoice.find({ invoiceDate: { $gte: today.start, $lte: today.end } }),
      Invoice.find({ invoiceDate: { $gte: yesterday.start, $lte: yesterday.end } }),
      Invoice.find().sort({ invoiceDate: -1 }).limit(6),
      Product.find({ isActive: true, stockStatus: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] } }).limit(10),
    ]);

    const todayRevenue = todayInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const todayBills = todayInvoices.length;
    const yesterdayRevenue = yesterdayInvoices.reduce((s, i) => s + i.grandTotal, 0);
    const itemsSold = todayInvoices.reduce((s, i) => s + (i.billingSession?.items?.reduce((ss: number, it: any) => ss + it.quantity, 0) || 0), 0);
    const cashCollected = todayInvoices.reduce((s, i) => s + (i.payment?.cashAmount || 0), 0);
    const upiCollected = todayInvoices.reduce((s, i) => s + (i.payment?.upiAmount || 0), 0);
    const cardCollected = todayInvoices.reduce((s, i) => s + (i.payment?.cardAmount || 0), 0);

    // Top medicines from today's invoices
    const medMap: Record<string, { name: string; sold: number; revenue: number }> = {};
    todayInvoices.forEach((inv) => {
      (inv.billingSession?.items || []).forEach((item: any) => {
        const name = item.productSnapshot?.name || 'Unknown';
        if (!medMap[name]) medMap[name] = { name, sold: 0, revenue: 0 };
        medMap[name].sold += item.quantity;
        medMap[name].revenue += item.lineTotal;
      });
    });
    const topMedicines = Object.values(medMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    res.json({
      success: true,
      data: {
        todayRevenue: Number(todayRevenue.toFixed(2)),
        todayBills,
        itemsSold,
        avgBillValue: todayBills > 0 ? Number((todayRevenue / todayBills).toFixed(2)) : 0,
        revenueGrowth: yesterdayRevenue > 0 ? Number(((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)) : 0,
        cashCollected: Number(cashCollected.toFixed(2)),
        upiCollected: Number(upiCollected.toFixed(2)),
        cardCollected: Number(cardCollected.toFixed(2)),
        recentBills: recentBills.map((i) => ({
          inv: i.invoiceNumber,
          patient: i.billingSession?.patientDetails?.patientName || 'Walk-in',
          items: i.billingSession?.items?.length || 0,
          amount: i.grandTotal,
          method: i.payment?.method,
          time: new Date(i.invoiceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          status: 'PAID',
        })),
        topMedicines,
        lowStockCount: lowStockProducts.length,
        lowStockAlerts: lowStockProducts.map((p) => ({ name: p.name, stock: p.totalStock, schedule: p.scheduleCategory })),
      },
    });
  } catch (err) { next(err); }
});

// GET /api/reports/sales-summary
router.get('/sales-summary', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;
    const dateQuery: any = {};
    if (from) dateQuery.$gte = new Date(String(from));
    if (to) { const t = new Date(String(to)); t.setHours(23, 59, 59, 999); dateQuery.$lte = t; }

    const invoices = await Invoice.find(Object.keys(dateQuery).length > 0 ? { invoiceDate: dateQuery } : {});

    const grossSales = invoices.reduce((s, i) => s + i.subtotal, 0);
    const discountsGiven = invoices.reduce((s, i) => s + i.totalDiscount, 0);
    const totalCGST = invoices.reduce((s, i) => s + i.totalCGST, 0);
    const totalSGST = invoices.reduce((s, i) => s + i.totalSGST, 0);
    const netRevenue = invoices.reduce((s, i) => s + i.grandTotal, 0);
    const itemsSold = invoices.reduce((s, i) => s + (i.billingSession?.items?.reduce((ss: number, it: any) => ss + it.quantity, 0) || 0), 0);

    res.json({
      success: true,
      data: {
        grossSales: Number(grossSales.toFixed(2)),
        discountsGiven: Number(discountsGiven.toFixed(2)),
        taxableAmount: Number((netRevenue - totalCGST - totalSGST).toFixed(2)),
        totalCGST: Number(totalCGST.toFixed(2)),
        totalSGST: Number(totalSGST.toFixed(2)),
        totalTax: Number((totalCGST + totalSGST).toFixed(2)),
        netRevenue: Number(netRevenue.toFixed(2)),
        totalBills: invoices.length,
        avgBillValue: invoices.length > 0 ? Number((netRevenue / invoices.length).toFixed(2)) : 0,
        itemsSold,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/reports/hsn-tax
router.get('/hsn-tax', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;
    const dateQuery: any = {};
    if (from) dateQuery.$gte = new Date(String(from));
    if (to) { const t = new Date(String(to)); t.setHours(23, 59, 59, 999); dateQuery.$lte = t; }

    const invoices = await Invoice.find(Object.keys(dateQuery).length > 0 ? { invoiceDate: dateQuery } : {});

    const hsnMap: Record<string, any> = {};
    invoices.forEach((inv) => {
      (inv.billingSession?.items || []).forEach((item: any) => {
        const hsn = item.productSnapshot?.hsnCode || 'UNKNOWN';
        const desc = item.productSnapshot?.name || '';
        if (!hsnMap[hsn]) hsnMap[hsn] = { hsnCode: hsn, description: desc, taxableValue: 0, gstRate: item.productSnapshot?.gstRate || 12, cgst: 0, sgst: 0, totalTax: 0, lineTotal: 0 };
        hsnMap[hsn].taxableValue += item.taxableAmount || 0;
        hsnMap[hsn].cgst += item.cgstAmount || 0;
        hsnMap[hsn].sgst += item.sgstAmount || 0;
        hsnMap[hsn].totalTax += item.totalGst || 0;
        hsnMap[hsn].lineTotal += item.lineTotal || 0;
      });
    });

    const result = Object.values(hsnMap).map((r: any) => ({
      ...r, taxableValue: Number(r.taxableValue.toFixed(2)), cgst: Number(r.cgst.toFixed(2)), sgst: Number(r.sgst.toFixed(2)), totalTax: Number(r.totalTax.toFixed(2)), lineTotal: Number(r.lineTotal.toFixed(2)),
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/reports/top-medicines
router.get('/top-medicines', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;
    const dateQuery: any = {};
    if (from) dateQuery.$gte = new Date(String(from));
    if (to) { const t = new Date(String(to)); t.setHours(23, 59, 59, 999); dateQuery.$lte = t; }

    const invoices = await Invoice.find(Object.keys(dateQuery).length > 0 ? { invoiceDate: dateQuery } : {});
    const map: Record<string, any> = {};
    invoices.forEach((inv) => {
      (inv.billingSession?.items || []).forEach((item: any) => {
        const name = item.productSnapshot?.name || 'Unknown';
        const salt = item.productSnapshot?.saltComposition || '';
        if (!map[name]) map[name] = { name, salt, qtySold: 0, revenue: 0, margin: item.productSnapshot?.grossMarginPercent || 0 };
        map[name].qtySold += item.quantity;
        map[name].revenue += item.lineTotal;
      });
    });

    const result = Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 20).map((r: any) => ({ ...r, revenue: Number(r.revenue.toFixed(2)) }));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/reports/payment-split
router.get('/payment-split', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query;
    const dateQuery: any = {};
    if (from) dateQuery.$gte = new Date(String(from));
    if (to) { const t = new Date(String(to)); t.setHours(23, 59, 59, 999); dateQuery.$lte = t; }

    const invoices = await Invoice.find(Object.keys(dateQuery).length > 0 ? { invoiceDate: dateQuery } : {});
    const modes: Record<string, { mode: string; amount: number; count: number }> = {
      UPI: { mode: 'UPI / QR Code', amount: 0, count: 0 },
      CASH: { mode: 'Cash Payment', amount: 0, count: 0 },
      CARD: { mode: 'Card / POS EDC', amount: 0, count: 0 },
      SPLIT: { mode: 'Split Payment', amount: 0, count: 0 },
    };
    const total = invoices.reduce((s, i) => s + i.grandTotal, 0);
    invoices.forEach((inv) => {
      const m = inv.payment?.method as string;
      if (modes[m]) { modes[m].amount += inv.grandTotal; modes[m].count += 1; }
    });

    const result = Object.values(modes).map((m) => ({ ...m, amount: Number(m.amount.toFixed(2)), percent: total > 0 ? Math.round((m.amount / total) * 100) : 0 }));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/reports/daily-revenue
router.get('/daily-revenue', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = Number(req.query.days || 7);
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      const inv = await Invoice.find({ invoiceDate: { $gte: start, $lte: end } });
      const value = inv.reduce((s, x) => s + x.grandTotal, 0);
      result.push({ day: d.toLocaleDateString('en-IN', { weekday: 'short' }), date: d.toISOString().split('T')[0], value: Number(value.toFixed(2)) });
    }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/reports/inventory-dashboard
router.get('/inventory-dashboard', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({ isActive: true });
    const now = new Date();
    const batchRows: any[] = [];

    products.forEach((product) => {
      if (product.batches && product.batches.length > 0) {
        product.batches.forEach((b) => {
          const exp = new Date(b.expiryDate);
          const diffTime = exp.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let expiryCategory = 'FRESH';
          if (daysLeft <= 0) expiryCategory = 'EXPIRED';
          else if (daysLeft <= 30) expiryCategory = 'DUMP_30';
          else if (daysLeft <= 90) expiryCategory = 'WARNING_90';
          else if (daysLeft <= 180) expiryCategory = 'MEDIUM_180';

          const cost = b.purchaseRate || Number((b.mrp * 0.70).toFixed(2));
          const margin = product.sellingPrice > 0 ? Number((((product.sellingPrice - cost) / product.sellingPrice) * 100).toFixed(1)) : product.grossMarginPercent;
          const dailyVelocity = Math.max(2, Math.min(18, Math.round(250 / (product.sellingPrice || 40))));
          const daysOfStock = Math.round(b.stockQuantity / dailyVelocity);

          let stockTier = 'OPTIMAL';
          if (daysOfStock > 60 || b.stockQuantity > 150) stockTier = 'HEAVY';
          else if (daysOfStock >= 15 && b.stockQuantity >= 30) stockTier = 'OPTIMAL';
          else if (daysOfStock >= 5 && b.stockQuantity >= 10) stockTier = 'TRIGGER_ORDER';
          else stockTier = 'CRITICAL_LOW';

          batchRows.push({
            productId: product._id,
            productName: product.name,
            brand: product.brand,
            saltComposition: product.saltComposition,
            barcode: product.barcode,
            scheduleCategory: product.scheduleCategory,
            sellingPrice: product.sellingPrice,
            batchNumber: b.batchNumber,
            expiryDate: b.expiryDate,
            stockQuantity: b.stockQuantity,
            location: b.location || 'Rack Main',
            mrp: b.mrp || product.unitMRP,
            daysLeft,
            expiryCategory,
            batchValue: b.stockQuantity * product.sellingPrice,
            estimatedCost: b.stockQuantity * cost,
            marginPercent: margin,
            dailyVelocity,
            daysOfStock,
            stockTier,
          });
        });
      }
    });

    const totalStockUnits = products.reduce((sum, p) => sum + p.totalStock, 0);
    const totalInventoryValuation = batchRows.reduce((sum, b) => sum + b.batchValue, 0);
    const totalCostValuation = batchRows.reduce((sum, b) => sum + b.estimatedCost, 0);

    const heavyBatches = batchRows.filter((b) => b.stockTier === 'HEAVY');
    const optimalBatches = batchRows.filter((b) => b.stockTier === 'OPTIMAL');
    const triggerBatches = batchRows.filter((b) => b.stockTier === 'TRIGGER_ORDER');
    const criticalBatches = batchRows.filter((b) => b.stockTier === 'CRITICAL_LOW');

    res.json({
      success: true,
      data: {
        summary: {
          totalProducts: products.length,
          totalBatches: batchRows.length,
          totalStockUnits,
          totalInventoryValuation: Number(totalInventoryValuation.toFixed(2)),
          totalCostValuation: Number(totalCostValuation.toFixed(2)),
          dump30Count: batchRows.filter((b) => b.expiryCategory === 'DUMP_30').length,
          warning90Count: batchRows.filter((b) => b.expiryCategory === 'WARNING_90').length,
          expiredCount: batchRows.filter((b) => b.expiryCategory === 'EXPIRED').length,
        },
        tiers: {
          heavyCount: heavyBatches.length,
          heavyValuation: Number(heavyBatches.reduce((s, b) => s + b.batchValue, 0).toFixed(2)),
          optimalCount: optimalBatches.length,
          optimalValuation: Number(optimalBatches.reduce((s, b) => s + b.batchValue, 0).toFixed(2)),
          triggerCount: triggerBatches.length,
          triggerValuation: Number(triggerBatches.reduce((s, b) => s + b.batchValue, 0).toFixed(2)),
          criticalLowCount: criticalBatches.length,
          criticalValuation: Number(criticalBatches.reduce((s, b) => s + b.batchValue, 0).toFixed(2)),
        },
        batchRows,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/reports/fast-moving
router.get('/fast-moving', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const invoices = await Invoice.find({ invoiceDate: { $gte: ninetyDaysAgo } });

    const salesMap: Record<string, { productId: string; name: string; brand: string; qtySold: number; totalRevenue: number; orderCount: number }> = {};
    invoices.forEach((inv) => {
      (inv.billingSession?.items || []).forEach((item: any) => {
        const id = String(item.productId || item.productSnapshot?._id || item.cartItemId);
        const name = item.productSnapshot?.name || 'Medicine';
        const brand = item.productSnapshot?.brand || '';
        if (!salesMap[id]) salesMap[id] = { productId: id, name, brand, qtySold: 0, totalRevenue: 0, orderCount: 0 };
        salesMap[id].qtySold += item.quantity || 1;
        salesMap[id].totalRevenue += item.lineTotal || 0;
        salesMap[id].orderCount += 1;
      });
    });

    const fastMoving = Object.values(salesMap)
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 20)
      .map((item) => ({ ...item, totalRevenue: Number(item.totalRevenue.toFixed(2)) }));

    res.json({ success: true, data: fastMoving });
  } catch (err) { next(err); }
});

// GET /api/reports/slow-moving
router.get('/slow-moving', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const [products, invoices] = await Promise.all([
      Product.find({ isActive: true, totalStock: { $gt: 0 } }),
      Invoice.find({ invoiceDate: { $gte: ninetyDaysAgo } }),
    ]);

    const soldMap: Record<string, number> = {};
    invoices.forEach((inv) => {
      (inv.billingSession?.items || []).forEach((item: any) => {
        const id = String(item.productId || item.productSnapshot?._id);
        soldMap[id] = (soldMap[id] || 0) + (item.quantity || 1);
      });
    });

    const slowMoving = products
      .map((p) => ({
        productId: p._id,
        name: p.name,
        brand: p.brand,
        totalStock: p.totalStock,
        sellingPrice: p.sellingPrice,
        qtySoldIn90Days: soldMap[p._id.toString()] || 0,
        stockValuation: Number((p.totalStock * p.sellingPrice).toFixed(2)),
      }))
      .sort((a, b) => a.qtySoldIn90Days - b.qtySoldIn90Days)
      .slice(0, 25);

    res.json({ success: true, data: slowMoving });
  } catch (err) { next(err); }
});

// GET /api/reports/dead-stock
router.get('/dead-stock', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const [products, invoices] = await Promise.all([
      Product.find({ isActive: true, totalStock: { $gt: 10 } }),
      Invoice.find({ invoiceDate: { $gte: ninetyDaysAgo } }),
    ]);

    const activeProductIds = new Set<string>();
    invoices.forEach((inv) => {
      (inv.billingSession?.items || []).forEach((item: any) => {
        if (item.productId) activeProductIds.add(String(item.productId));
      });
    });

    const deadStock = products
      .filter((p) => !activeProductIds.has(p._id.toString()))
      .map((p) => ({
        productId: p._id,
        name: p.name,
        brand: p.brand,
        totalStock: p.totalStock,
        mrp: p.unitMRP,
        sellingPrice: p.sellingPrice,
        deadCapitalLocked: Number((p.totalStock * p.sellingPrice).toFixed(2)),
        batches: p.batches,
      }))
      .sort((a, b) => b.deadCapitalLocked - a.deadCapitalLocked);

    res.json({ success: true, data: deadStock, totalDeadCapital: Number(deadStock.reduce((s, i) => s + i.deadCapitalLocked, 0).toFixed(2)) });
  } catch (err) { next(err); }
});

// GET /api/reports/procurement — Smart Procurement Intelligence & Spend Analysis
router.get('/procurement', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [grnList, suppliers] = await Promise.all([
      GRNEntry.find().sort({ receivedDate: -1 }),
      Supplier.find({ isActive: true }),
    ]);

    const supplierSpendMap: Record<string, { supplierId: string; name: string; totalSpend: number; shipmentsCount: number; itemsReceived: number }> = {};
    suppliers.forEach((s) => {
      supplierSpendMap[s._id.toString()] = { supplierId: s._id.toString(), name: s.name, totalSpend: 0, shipmentsCount: 0, itemsReceived: 0 };
    });

    let overallSpend = 0;
    grnList.forEach((grn) => {
      const sId = grn.supplierId?.toString();
      const target = (sId && supplierSpendMap[sId]) ? supplierSpendMap[sId] : null;
      overallSpend += grn.totalAmount || 0;

      if (target) {
        target.totalSpend += grn.totalAmount || 0;
        target.shipmentsCount += 1;
        target.itemsReceived += grn.items.reduce((s, it) => s + it.quantity, 0);
      }
    });

    const supplierRankings = Object.values(supplierSpendMap)
      .map((s) => ({ ...s, totalSpend: Number(s.totalSpend.toFixed(2)) }))
      .sort((a, b) => b.totalSpend - a.totalSpend);

    res.json({
      success: true,
      data: {
        totalProcurementSpend: Number(overallSpend.toFixed(2)),
        totalShipmentsReceived: grnList.length,
        supplierRankings,
        recentShipments: grnList.slice(0, 10).map((g) => ({
          grnNumber: g.grnNumber,
          supplierName: g.supplierName,
          supplierInvoiceNo: g.supplierInvoiceNo,
          date: g.receivedDate,
          amount: g.totalAmount,
          itemCount: g.items.length,
        })),
      },
    });
  } catch (err) { next(err); }
});

// GET /api/reports/expiry-loss
router.get('/expiry-loss', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({ isActive: true });
    const now = new Date();
    let expiredValue = 0;
    let near30Value = 0;
    let near60Value = 0;
    let near90Value = 0;
    const expiredList: any[] = [];
    const atRiskList: any[] = [];

    products.forEach((p) => {
      p.batches.forEach((b) => {
        const exp = new Date(b.expiryDate);
        const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const val = b.stockQuantity * p.sellingPrice;

        if (days <= 0) {
          expiredValue += val;
          expiredList.push({ productName: p.name, batch: b.batchNumber, qty: b.stockQuantity, loss: val, expiryDate: b.expiryDate });
        } else if (days <= 30) {
          near30Value += val;
          atRiskList.push({ productName: p.name, batch: b.batchNumber, qty: b.stockQuantity, daysLeft: days, value: val, category: 'DUMP_30' });
        } else if (days <= 60) {
          near60Value += val;
          atRiskList.push({ productName: p.name, batch: b.batchNumber, qty: b.stockQuantity, daysLeft: days, value: val, category: 'WARNING_60' });
        } else if (days <= 90) {
          near90Value += val;
          atRiskList.push({ productName: p.name, batch: b.batchNumber, qty: b.stockQuantity, daysLeft: days, value: val, category: 'WARNING_90' });
        }
      });
    });

    res.json({
      success: true,
      data: {
        expiredLoss: Number(expiredValue.toFixed(2)),
        near30Risk: Number(near30Value.toFixed(2)),
        near60Risk: Number(near60Value.toFixed(2)),
        near90Risk: Number(near90Value.toFixed(2)),
        totalAtRiskExposure: Number((expiredValue + near30Value + near60Value + near90Value).toFixed(2)),
        expiredList: expiredList.slice(0, 20),
        atRiskList: atRiskList.slice(0, 20),
      },
    });
  } catch (err) { next(err); }
});

// GET /api/reports/disposal-audit
router.get('/disposal-audit', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const records = await DisposalRecord.find().sort({ disposalDate: -1 });
    const totalUnits = records.reduce((s, r) => s + r.quantityDisposed, 0);

    res.json({
      success: true,
      data: {
        totalDisposalEvents: records.length,
        totalUnitsDisposed: totalUnits,
        records: records.slice(0, 50),
      },
    });
  } catch (err) { next(err); }
});

// GET /api/reports/return-summary
router.get('/return-summary', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const returns = await ReturnNote.find().sort({ returnDate: -1 });
    const totalRefunded = returns.reduce((s, r) => s + r.totalRefundAmount, 0);
    const restockingFeeEarned = Number((totalRefunded * 0.15).toFixed(2));
    const totalItemsRestocked = returns.reduce((s, r) => s + r.items.filter((it) => it.restocked).reduce((ss, it) => ss + it.quantityReturned, 0), 0);

    res.json({
      success: true,
      data: {
        totalReturnNotes: returns.length,
        totalRefundAmount: Number(totalRefunded.toFixed(2)),
        restockingFeeEarned,
        totalItemsRestocked,
        recentReturns: returns.slice(0, 20),
      },
    });
  } catch (err) { next(err); }
});

// GET /api/reports/stock-movement/:productId
router.get('/stock-movement/:productId', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const [grns, invoices, returns, disposals] = await Promise.all([
      GRNEntry.find({ 'items.productId': productId }).sort({ receivedDate: -1 }).limit(20),
      Invoice.find({ 'billingSession.items.productId': productId }).sort({ invoiceDate: -1 }).limit(30),
      ReturnNote.find({ 'items.productId': productId }).sort({ returnDate: -1 }).limit(10),
      DisposalRecord.find({ productId }).sort({ disposalDate: -1 }).limit(10),
    ]);

    const timeline: any[] = [];

    grns.forEach((g) => {
      const match = g.items.find((it) => it.productId.toString() === productId);
      if (match) {
        timeline.push({
          type: 'INWARD_GRN',
          reference: g.grnNumber,
          date: g.receivedDate,
          quantity: match.quantity,
          batch: match.batchNumber,
          rate: match.purchaseRate,
          source: g.supplierName,
        });
      }
    });

    invoices.forEach((inv) => {
      const match = inv.billingSession?.items?.find((it: any) => String(it.productId) === productId);
      if (match) {
        timeline.push({
          type: 'SALE_DEDUCTION',
          reference: inv.invoiceNumber,
          date: inv.invoiceDate,
          quantity: -match.quantity,
          batch: match.selectedBatch?.batchNumber || 'N/A',
          rate: match.unitPrice,
          source: inv.billingSession?.patientDetails?.patientName || 'Customer Sale',
        });
      }
    });

    returns.forEach((r) => {
      const match = r.items.find((it) => it.productId.toString() === productId);
      if (match) {
        timeline.push({
          type: 'CUSTOMER_RETURN',
          reference: r.creditNoteNo,
          date: r.returnDate,
          quantity: match.quantityReturned,
          batch: match.batchNumber,
          rate: match.unitPrice,
          source: r.patientName,
        });
      }
    });

    disposals.forEach((d) => {
      timeline.push({
        type: 'STOCK_DISPOSAL',
        reference: `DISPOSAL-${d._id.toString().slice(-6)}`,
        date: d.disposalDate,
        quantity: -d.quantityDisposed,
        batch: d.batchNumber,
        rate: 0,
        source: `${d.reason} (Auth by: ${d.authorizedBy})`,
      });
    });

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      success: true,
      data: {
        product: { id: product._id, name: product.name, brand: product.brand, currentStock: product.totalStock, batches: product.batches },
        timeline,
      },
    });
  } catch (err) { next(err); }
});

export default router;
