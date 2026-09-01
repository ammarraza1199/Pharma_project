import { Router, Response, NextFunction } from 'express';
import { Supplier } from '../models/Supplier';
import { GRNEntry } from '../models/GRNEntry';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/suppliers
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (err) { next(err); }
});

// GET /api/suppliers/:id
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    const grnHistory = await GRNEntry.find({ supplierId: req.params.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: { supplier, grnHistory } });
  } catch (err) { next(err); }
});

// POST /api/suppliers
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) { next(err); }
});

// PUT /api/suppliers/:id
router.put('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    res.json({ success: true, data: supplier });
  } catch (err) { next(err); }
});

// PUT /api/suppliers/:id/balance
router.put('/:id/balance', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    supplier.pendingBalance = Math.max(0, (supplier.pendingBalance || 0) - Number(amount));
    await supplier.save();
    res.json({ success: true, data: supplier });
  } catch (err) { next(err); }
});

export default router;
