import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Consultation } from '../models/Consultation';
import { protect, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/consultations — Save clinical voice consultation
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      id,
      patientName,
      phone,
      age,
      gender,
      date,
      time,
      durationSeconds,
      audioUrl,
      audioBlobBase64,
      category,
      chiefDiscussion,
      pharmacistAdvice,
      tags,
      pharmacistName,
      counterNumber,
      sessionId,
      sentimentResult,
      linkedValueAddedServices,
    } = req.body;

    if (!patientName || !chiefDiscussion || !pharmacistAdvice) {
      return res.status(400).json({ success: false, message: 'Patient name, discussion summary, and advice are required.' });
    }

    const consultationId = id || `VC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const [consultation] = await Consultation.create(
      [
        {
          consultationId,
          patientName,
          phone: phone || 'N/A',
          age: age || '',
          gender: gender || 'MALE',
          date: date || new Date().toISOString().split('T')[0],
          time: time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          durationSeconds: durationSeconds || 0,
          audioUrl: audioUrl || '',
          audioBlobBase64: audioBlobBase64 || undefined,
          category: category || 'GENERAL_ADVICE',
          chiefDiscussion,
          pharmacistAdvice,
          tags: tags || [],
          pharmacistName: pharmacistName || 'Staff Pharmacist',
          counterNumber: counterNumber || 1,
          sessionId: sessionId || '',
          sentimentResult,
          linkedValueAddedServices,
          createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
        },
      ]
    );

    res.status(201).json({ success: true, data: consultation });
  } catch (err) {
    next(err);
  }
});

// GET /api/consultations — List clinical consultations
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, phone, category, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (phone) {
      query.phone = phone;
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { chiefDiscussion: { $regex: search, $options: 'i' } },
        { pharmacistAdvice: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [consultations, total] = await Promise.all([
      Consultation.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Consultation.countDocuments(query),
    ]);

    // Map consultationId to id for frontend compatibility
    const mapped = consultations.map((c) => ({
      ...c.toObject(),
      id: c.consultationId,
    }));

    res.json({ success: true, data: mapped, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/consultations/:id — Get Single Consultation
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let consultation: any = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      consultation = await Consultation.findById(req.params.id);
    }
    if (!consultation) {
      consultation = await Consultation.findOne({ consultationId: req.params.id });
    }

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation record not found.' });
    }

    res.json({ success: true, data: { ...consultation.toObject(), id: consultation.consultationId } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/consultations/:id — Delete Consultation (Manager/Owner)
router.delete('/:id', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let deleted = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      deleted = await Consultation.findByIdAndDelete(req.params.id);
    }
    if (!deleted) {
      deleted = await Consultation.findOneAndDelete({ consultationId: req.params.id });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Consultation record not found.' });
    }

    res.json({ success: true, message: 'Consultation record deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
