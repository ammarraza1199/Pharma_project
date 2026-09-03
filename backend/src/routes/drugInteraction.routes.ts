import { Router, Response, NextFunction } from 'express';
import { DrugInteraction } from '../models/DrugInteraction';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/drug-interactions
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const interactions = await DrugInteraction.find().sort({ severity: 1 });
    res.json({ success: true, data: interactions });
  } catch (err) { next(err); }
});

// POST /api/drug-interactions
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const interaction = await DrugInteraction.create(req.body);
    res.status(201).json({ success: true, data: interaction });
  } catch (err) { next(err); }
});

// PUT /api/drug-interactions/:id
router.put('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const interaction = await DrugInteraction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!interaction) return res.status(404).json({ success: false, message: 'Interaction not found.' });
    res.json({ success: true, data: interaction });
  } catch (err) { next(err); }
});

// DELETE /api/drug-interactions/:id
router.delete('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await DrugInteraction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Interaction rule deleted.' });
  } catch (err) { next(err); }
});

export default router;
