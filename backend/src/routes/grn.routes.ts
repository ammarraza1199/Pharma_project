import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { GRNEntry } from '../models/GRNEntry';
import { getNextSequence } from '../models/Counter';
import { addStock } from '../services/stockService';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/grn
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { supplierName, supplierId, supplierInvoiceNo, receivedDate, items, totalAmount } = req.body;

    const seq = await getNextSequence('grn');
    const grnNumber = `GRN-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

    // Update stock for each item
    for (const item of items) {
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
router.put('/:id/status', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const grn = await GRNEntry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, data: grn });
  } catch (err) { next(err); }
});

export default router;
