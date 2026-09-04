import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { checkDrugInteractions } from '../services/drugInteractionService';
import { calculateItemGST } from '../services/gstService';
import { Product } from '../models/Product';
import { HeldBill } from '../models/HeldBill';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/billing/check-drug-interactions
router.post('/check-drug-interactions', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { saltCompositions } = req.body;
    if (!Array.isArray(saltCompositions)) {
      return res.status(400).json({ success: false, message: 'saltCompositions must be an array of strings.' });
    }
    const result = await checkDrugInteractions(saltCompositions);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/billing/check-substitutes
router.post('/check-substitutes', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, saltComposition } = req.body;
    if (!saltComposition) return res.status(400).json({ success: false, message: 'saltComposition required.' });

    const alternatives = await Product.find({
      _id: { $ne: productId },
      saltComposition: { $regex: saltComposition.split(' ')[0], $options: 'i' },
      totalStock: { $gt: 0 },
      isActive: true,
    })
      .sort({ grossMarginPercent: -1 })
      .limit(3);

    res.json({ success: true, data: alternatives });
  } catch (err) { next(err); }
});

// POST /api/billing/calculate-gst
router.post('/calculate-gst', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { unitPrice, quantity, discountPercent, gstRate } = req.body;
    const breakdown = calculateItemGST(Number(unitPrice), Number(quantity), Number(discountPercent || 0), Number(gstRate || 12));
    res.json({ success: true, data: breakdown });
  } catch (err) { next(err); }
});

const inMemoryHeldBills: any[] = [];

// POST /api/billing/hold-bill
router.post('/hold-bill', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { customerName, customerPhone, billingSession, totalAmount } = req.body;
    if (mongoose.connection.readyState !== 1) {
      const held = {
        id: `held-${Date.now()}`,
        _id: `held-${Date.now()}`,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || 'N/A',
        billingSession,
        totalAmount: totalAmount || 0,
        heldAt: new Date(),
        createdBy: req.user!.id
      };
      inMemoryHeldBills.unshift(held);
      return res.status(201).json({ success: true, data: held });
    }
    const held = await HeldBill.create({ customerName, customerPhone, billingSession, totalAmount, createdBy: req.user!.id });
    res.status(201).json({ success: true, data: held });
  } catch (err) { next(err); }
});

// GET /api/billing/held-bills
router.get('/held-bills', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const bills = inMemoryHeldBills.filter(b => b.createdBy === req.user!.id);
      return res.json({ success: true, data: bills });
    }
    const bills = await HeldBill.find({ createdBy: req.user!.id }).sort({ heldAt: -1 });
    res.json({ success: true, data: bills });
  } catch (err) { next(err); }
});

// GET /api/billing/held-bills/:id
router.get('/held-bills/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const bill = inMemoryHeldBills.find(b => b.id === req.params.id || b._id === req.params.id);
      if (!bill) return res.status(404).json({ success: false, message: 'Held bill not found.' });
      return res.json({ success: true, data: bill });
    }
    const bill = await HeldBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Held bill not found.' });
    res.json({ success: true, data: bill });
  } catch (err) { next(err); }
});

// DELETE /api/billing/held-bills/:id
router.delete('/held-bills/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const idx = inMemoryHeldBills.findIndex(b => b.id === req.params.id || b._id === req.params.id);
      if (idx !== -1) inMemoryHeldBills.splice(idx, 1);
      return res.json({ success: true, message: 'Held bill discarded.' });
    }
    await HeldBill.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Held bill discarded.' });
  } catch (err) { next(err); }
});

export default router;
