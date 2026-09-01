import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice';
import { StoreSettings } from '../models/StoreSettings';
import { Product } from '../models/Product';
import { getNextSequence } from '../models/Counter';
import { deductStock } from '../services/stockService';
import { upsertPatientOnBilling } from '../services/patientService';
import { protect, requireRole, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();

// POST /api/invoices — Finalize Bill (most critical endpoint)
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { billingSession, payment, subtotal, totalDiscount, totalCGST, totalSGST, grandTotal, managerPin } = req.body;
    const items: any[] = billingSession?.items || [];

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    // ── COMPLIANCE VALIDATION ──────────────────────────────────────────────
    const settings = await StoreSettings.findOne();

    // Check if any Schedule X item — verify manager PIN
    const hasScheduleX = items.some((item: any) =>
      item.productSnapshot?.scheduleCategory === 'SCHEDULE_X' || item.productSnapshot?.isNarcotic
    );
    if (hasScheduleX) {
      // If the logged-in user is already a MANAGER or OWNER, skip PIN check
      const isManagerOrOwner = req.user?.role === 'MANAGER' || req.user?.role === 'OWNER';
      
      if (!isManagerOrOwner) {
        if (!managerPin) {
          return res.status(403).json({ success: false, message: 'Manager PIN required for Schedule X drugs.' });
        }
        
        // Default hash for '1234' if store settings are not initialized
        const targetHash = settings?.managerPin || '$2a$10$wT8v/8t0jF5qV7N0yB7H0uT.e8QO2H0mG8Jq8Q.Yx9V5F1F5Q0qO'; 
        const pinValid = await bcrypt.compare(managerPin, targetHash);
        if (!pinValid) {
          return res.status(403).json({ success: false, message: 'Invalid Manager PIN. Sale rejected.' });
        }
      }
    }

    // Check if any Schedule H/H1 item — require doctor & patient details
    const hasScheduleH = items.some((item: any) =>
      ['SCHEDULE_H', 'SCHEDULE_H1'].includes(item.productSnapshot?.scheduleCategory)
    );
    if (hasScheduleH) {
      if (!billingSession?.doctorDetails?.doctorName || !billingSession?.patientDetails?.patientName) {
        return res.status(400).json({ success: false, message: 'Doctor and Patient details are mandatory for Schedule H drugs.' });
      }
    }

    // ── STOCK DEDUCTION (atomic, per batch) ────────────────────────────────
    for (const item of items) {
      await deductStock(
        item.productId,
        item.selectedBatch.batchNumber,
        item.quantity,
        null as any // Transactions removed for local standalone MongoDB
      );
    }

    // ── GENERATE SEQUENTIAL INVOICE NUMBER ────────────────────────────────
    const seq = await getNextSequence('invoices');
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(seq).padStart(6, '0')}`;

    // ── FETCH STORE INFO ──────────────────────────────────────────────────
    const storeInfo = {
      name: settings?.storeName || 'GENQUANTAA MedPlus Pharmacy',
      dlNo: settings?.dlNo || '',
      gstin: settings?.gstin || '',
      address: settings?.address || '',
      phone: settings?.phone || '',
    };

    // ── CREATE INVOICE ─────────────────────────────────────────────────────
    const [invoice] = await Invoice.create(
      [{ invoiceNumber, invoiceDate: new Date(), storeInfo, billingSession, subtotal, totalDiscount, totalCGST, totalSGST, grandTotal, payment, createdBy: req.user!.id }]
    );

    // ── AUTO-UPDATE PATIENT (outside transaction — non-critical) ──────────
    try {
      await upsertPatientOnBilling(billingSession.patientDetails, grandTotal);
    } catch (e) { console.warn('[PatientService] Failed to upsert patient:', e); }

    res.status(201).json({ success: true, data: invoice });
  } catch (err: any) {
    next(err);
  }
});

// GET /api/invoices
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, paymentMethod, dateFrom, dateTo, sortBy = 'date_desc', page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (search) {
      const s = String(search);
      query.$or = [
        { invoiceNumber: { $regex: s, $options: 'i' } },
        { 'billingSession.patientDetails.patientName': { $regex: s, $options: 'i' } },
        { 'billingSession.patientDetails.phone': { $regex: s, $options: 'i' } },
        { 'billingSession.doctorDetails.doctorName': { $regex: s, $options: 'i' } },
      ];
    }
    if (paymentMethod && paymentMethod !== 'ALL') query['payment.method'] = paymentMethod;
    if (dateFrom || dateTo) {
      query.invoiceDate = {};
      if (dateFrom) query.invoiceDate.$gte = new Date(String(dateFrom));
      if (dateTo) {
        const to = new Date(String(dateTo));
        to.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = to;
      }
    }

    let sortOpts: any = { invoiceDate: -1 };
    if (sortBy === 'date_asc') sortOpts = { invoiceDate: 1 };
    else if (sortBy === 'amount_desc') sortOpts = { grandTotal: -1 };
    else if (sortBy === 'amount_asc') sortOpts = { grandTotal: 1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort(sortOpts).skip(skip).limit(Number(limit)),
      Invoice.countDocuments(query),
    ]);

    res.json({ success: true, data: invoices, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// GET /api/invoices/:invoiceNumber
router.get('/:invoiceNumber', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber: req.params.invoiceNumber });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    res.json({ success: true, data: invoice });
  } catch (err) { next(err); }
});

// DELETE /api/invoices/:invoiceNumber
router.delete('/:invoiceNumber', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Invoice.findOneAndDelete({ invoiceNumber: req.params.invoiceNumber });
    res.json({ success: true, message: 'Invoice deleted.' });
  } catch (err) { next(err); }
});

// GET /api/invoices/export/csv
router.get('/export/csv', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invoices = await Invoice.find().sort({ invoiceDate: -1 }).limit(500);
    let csv = 'Invoice No,Date,Patient,Phone,Doctor,Items,Payment Method,Grand Total,CGST,SGST\n';
    for (const inv of invoices) {
      const p = inv.billingSession?.patientDetails;
      const d = inv.billingSession?.doctorDetails;
      csv += `${inv.invoiceNumber},${inv.invoiceDate.toISOString().split('T')[0]},"${p?.patientName || ''}","${p?.phone || ''}","${d?.doctorName || ''}",${inv.billingSession?.items?.length || 0},${inv.payment?.method},${inv.grandTotal},${inv.totalCGST},${inv.totalSGST}\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.csv');
    res.send(csv);
  } catch (err) { next(err); }
});

export default router;
