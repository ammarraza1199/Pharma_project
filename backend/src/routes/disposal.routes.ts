import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { DisposalRecord } from '../models/DisposalRecord';
import { StoreSettings } from '../models/StoreSettings';
import { disposeStock } from '../services/stockService';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/disposal
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, productName, batchNumber, quantityDisposed, disposalDate, reason, disposedBy, managerPin } = req.body;

    // Verify manager PIN server-side
    const settings = await StoreSettings.findOne().session(session);
    if (!settings) throw new Error('Store settings not found.');
    const pinValid = await bcrypt.compare(managerPin, settings.managerPin);
    if (!pinValid) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: 'Invalid Manager PIN. Disposal rejected.' });
    }

    await disposeStock(productId, batchNumber, quantityDisposed, session);

    const [record] = await DisposalRecord.create(
      [{ productId, productName, batchNumber, quantityDisposed, disposalDate: disposalDate ? new Date(disposalDate) : new Date(), reason, disposedBy: disposedBy || 'Pharmacist', authorizedBy: settings.managerName || 'Manager' }],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

// GET /api/disposal
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const records = await DisposalRecord.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
});

export default router;
