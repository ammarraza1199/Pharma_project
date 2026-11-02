import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { GRNEntry } from '../models/GRNEntry';
import { Product } from '../models/Product';
import { getNextSequence } from '../models/Counter';
import { addStock } from '../services/stockService';
import { protect, requireRole, AuthRequest } from '../middleware/auth';
import { io } from '../index';

const router = Router();

// POST /api/grn
router.post('/', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { supplierName, supplierId, supplierInvoiceNo, receivedDate, items, totalAmount } = req.body;

    const seq = await getNextSequence('grn');
    const grnNumber = `GRN-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

    // Update stock for each item, auto-resolving or creating product in catalog if needed
    for (const item of items) {
      let resolvedProd = null;

      if (item.productId && mongoose.Types.ObjectId.isValid(item.productId) && String(item.productId).length === 24) {
        resolvedProd = await Product.findById(item.productId);
      }

      if (!resolvedProd && item.productName) {
        const cleanName = item.productName.trim();
        resolvedProd = await Product.findOne({
          name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
      }

      // If product doesn't exist yet (e.g. new medicine from supplier invoice), auto-create it
      if (!resolvedProd) {
        resolvedProd = await Product.create({
          name: item.productName ? item.productName.trim() : 'New Medicine',
          brand: supplierName || 'Generic Pharma',
          saltComposition: item.productName ? item.productName.trim() : 'Pharmaceutical Composition',
          hsnCode: '30049099',
          gstRate: item.gstRate || 12,
          unitMRP: item.mrp || 100,
          sellingPrice: item.sellingPrice || item.mrp || 100,
          grossMarginPercent: (item.mrp && item.purchaseRate && item.mrp > item.purchaseRate)
            ? Number((((item.mrp - item.purchaseRate) / item.mrp) * 100).toFixed(1))
            : 15,
          scheduleCategory: 'REGULAR',
          isNarcotic: false,
          stockStatus: 'IN_STOCK',
          totalStock: 0,
          batches: [],
          isActive: true
        });
      }

      item.productId = resolvedProd._id;

      await addStock(
        item.productId,
        item.batchNumber,
        new Date(item.expiryDate),
        item.quantity,
        item.mrp,
        item.sellingPrice,
        'Rack Main',
        null as any
      );
    }

    const [grn] = await GRNEntry.create(
      [{ grnNumber, supplierName, supplierId, supplierInvoiceNo, receivedDate: receivedDate ? new Date(receivedDate) : new Date(), items, totalAmount, status: 'COMPLETED', createdBy: req.user!.id }]
    );

    try {
      io.emit('stock:updated', { source: 'GRN', grnNumber: grn.grnNumber, itemsAdded: items.length });
    } catch (e) {}

    res.status(201).json({ success: true, data: grn });
  } catch (err) {
    next(err);
  }
});

// GET /api/grn
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [entries, total] = await Promise.all([
      GRNEntry.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      GRNEntry.countDocuments(),
    ]);
    res.json({ success: true, data: entries, total });
  } catch (err) { next(err); }
});

// GET /api/grn/:id
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const grn = await GRNEntry.findById(req.params.id);
    if (!grn) return res.status(404).json({ success: false, message: 'GRN not found.' });
    res.json({ success: true, data: grn });
  } catch (err) { next(err); }
});

// PUT /api/grn/:id/status
router.put('/:id/status', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const grn = await GRNEntry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, data: grn });
  } catch (err) { next(err); }
});

export default router;
