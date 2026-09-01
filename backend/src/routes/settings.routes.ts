import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { StoreSettings } from '../models/StoreSettings';
import { protect, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/settings
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await StoreSettings.findOne().select('-managerPin -ownerPin');
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

// PUT /api/settings
router.put('/', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Never allow PIN update through this endpoint
    delete req.body.managerPin;
    delete req.body.ownerPin;
    const settings = await StoreSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true }).select('-managerPin -ownerPin');
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

// PUT /api/settings/pins — Secure PIN update
router.put('/pins', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentManagerPin, newManagerPin, currentOwnerPin, newOwnerPin } = req.body;
    const settings = await StoreSettings.findOne();
    if (!settings) return res.status(404).json({ success: false, message: 'Settings not found.' });

    const updates: any = {};

    if (newManagerPin) {
      if (!currentManagerPin) return res.status(400).json({ success: false, message: 'Current manager PIN required.' });
      const valid = await bcrypt.compare(currentManagerPin, settings.managerPin);
      if (!valid) return res.status(403).json({ success: false, message: 'Current manager PIN is incorrect.' });
      updates.managerPin = await bcrypt.hash(newManagerPin, 12);
    }

    if (newOwnerPin) {
      if (!currentOwnerPin) return res.status(400).json({ success: false, message: 'Current owner PIN required.' });
      const valid = await bcrypt.compare(currentOwnerPin, settings.ownerPin);
      if (!valid) return res.status(403).json({ success: false, message: 'Current owner PIN is incorrect.' });
      updates.ownerPin = await bcrypt.hash(newOwnerPin, 12);
    }

    await StoreSettings.findOneAndUpdate({}, updates);
    res.json({ success: true, message: 'PIN(s) updated successfully.' });
  } catch (err) { next(err); }
});

export default router;
