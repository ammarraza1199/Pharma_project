import { Router, Response, NextFunction } from 'express';
import { Invoice } from '../models/Invoice';
import { Product } from '../models/Product';
import { protect, AuthRequest } from '../middleware/auth';

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
router.get('/sales-summary', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.get('/hsn-tax', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.get('/top-medicines', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.get('/payment-split', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
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
router.get('/daily-revenue', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
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

export default router;
