import { Router, Response, NextFunction } from 'express';
import { Patient } from '../models/Patient';
import { Invoice } from '../models/Invoice';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/patients
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [patients, total] = await Promise.all([
      Patient.find(query).sort({ lastVisit: -1 }).skip(skip).limit(Number(limit)),
      Patient.countDocuments(query),
    ]);
    res.json({ success: true, data: patients, total });
  } catch (err) { next(err); }
});

// GET /api/patients/phone/:phone
router.get('/phone/:phone', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findOne({ phone: req.params.phone });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
});

// GET /api/patients/:id
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
});

// GET /api/patients/:id/invoices
router.get('/:id/invoices', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    const invoices = await Invoice.find({ 'billingSession.patientDetails.phone': patient.phone }).sort({ invoiceDate: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) { next(err); }
});

// POST /api/patients
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json({ success: true, data: patient });
  } catch (err) { next(err); }
});

// PUT /api/patients/:id
router.put('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    res.json({ success: true, data: patient });
  } catch (err) { next(err); }
});

// DELETE /api/patients/:id (soft delete — preserves invoice history)
router.delete('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    res.json({ success: true, message: 'Patient deactivated.' });
  } catch (err) { next(err); }
});

export default router;
