import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ReturnNote } from '../models/ReturnNote';
import { getNextSequence } from '../models/Counter';
import { restockItem } from '../services/stockService';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/returns
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { originalInvoiceNo, patientName, returnDate, items, totalRefundAmount, refundMethod } = req.body;

    const seq = await getNextSequence('returns');
    const creditNoteNo = `CN-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

    for (const item of items) {
      if (item.restocked) {
        await restockItem(item.productId, item.batchNumber, item.quantityReturned, null as any);
      }
    }

    const [note] = await ReturnNote.create(
      [{ creditNoteNo, originalInvoiceNo, patientName, returnDate: returnDate ? new Date(returnDate) : new Date(), items, totalRefundAmount, refundMethod, createdBy: req.user!.id }]
    );

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

// GET /api/returns
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [notes, total] = await Promise.all([
      ReturnNote.find().sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ReturnNote.countDocuments(),
    ]);
    res.json({ success: true, data: notes, total });
  } catch (err) { next(err); }
});

// GET /api/returns/:creditNoteNo
router.get('/:creditNoteNo', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await ReturnNote.findOne({ creditNoteNo: req.params.creditNoteNo });
    if (!note) return res.status(404).json({ success: false, message: 'Credit note not found.' });
    res.json({ success: true, data: note });
  } catch (err) { next(err); }
});

export default router;
