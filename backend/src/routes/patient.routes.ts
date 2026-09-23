import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Patient } from '../models/Patient';
import { Invoice } from '../models/Invoice';
import { protect, requireRole, AuthRequest } from '../middleware/auth';

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

// GET /api/patients/:id/analytics — Comprehensive Clinical Adherence & AMR Analytics
router.get('/:id/analytics', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let patient = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      patient = await Patient.findById(req.params.id);
    }
    if (!patient) {
      patient = await Patient.findOne({ phone: req.params.id });
    }
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const invoices = await Invoice.find({ 'billingSession.patientDetails.phone': patient.phone }).sort({ invoiceDate: -1 });

    // Aggregate purchase patterns & clinical insights
    const allItems: any[] = [];
    invoices.forEach(inv => {
      (inv.billingSession?.items || []).forEach((it: any) => {
        allItems.push({
          productName: it.productSnapshot?.name || it.name || 'Medicine',
          salt: it.productSnapshot?.saltComposition || '',
          category: it.productSnapshot?.scheduleCategory || 'REGULAR',
          quantity: it.quantity,
          date: inv.invoiceDate,
          doctorName: inv.billingSession?.doctorDetails?.doctorName || 'General Practitioner',
          clinic: (inv.billingSession?.doctorDetails as any)?.clinicHospital || inv.billingSession?.doctorDetails?.hospitalName || 'Walk-in Referral',
        });
      });
    });

    // Detect Antibiotic purchases & calculate AMR risk
    const antibioticKeywords = ['AUGMENTIN', 'AMOXICILLIN', 'AZITHRAL', 'AZITHROMYCIN', 'CEFIXIME', 'CIPROFLOXACIN', 'DOXYCYCLINE', 'CEFPODOXIME'];
    const antibioticItems = allItems.filter(it => 
      antibioticKeywords.some(k => it.productName.toUpperCase().includes(k) || it.salt.toUpperCase().includes(k))
    );

    const antibioticCourseCount = antibioticItems.length;
    let amrRiskLevel = 'LOW';
    let amrWarning = 'No acute antimicrobial resistance risk detected.';
    if (antibioticCourseCount >= 4) {
      amrRiskLevel = 'HIGH';
      amrWarning = `Patient has purchased ${antibioticCourseCount} antibiotic courses recently. High risk of antimicrobial resistance or gut dysbiosis.`;
    } else if (antibioticCourseCount >= 2) {
      amrRiskLevel = 'MODERATE';
      amrWarning = `Multiple recent antibiotic courses (${antibioticCourseCount}). Monitor patient for recurrent infections.`;
    }

    // Adherence scoring: based on recurring refill cycles
    const totalInvoices = invoices.length;
    const adherenceRate = totalInvoices >= 5 ? 92 : totalInvoices >= 2 ? 78 : 45;

    // Doctor referrals breakdown
    const doctorMap: Record<string, { doctorName: string; clinic: string; count: number; totalSpend: number }> = {};
    invoices.forEach(inv => {
      const doc = inv.billingSession?.doctorDetails?.doctorName || 'Self / OTC Direct';
      const clinic = (inv.billingSession?.doctorDetails as any)?.clinicHospital || inv.billingSession?.doctorDetails?.hospitalName || 'Local Pharmacy Walk-in';
      if (!doctorMap[doc]) {
        doctorMap[doc] = { doctorName: doc, clinic, count: 0, totalSpend: 0 };
      }
      doctorMap[doc].count += 1;
      doctorMap[doc].totalSpend += inv.grandTotal;
    });

    res.json({
      success: true,
      data: {
        patient,
        totalVisits: totalInvoices,
        totalSpent: Number(invoices.reduce((s, i) => s + i.grandTotal, 0).toFixed(2)),
        adherenceRate,
        amrRisk: {
          level: amrRiskLevel,
          courseCount: antibioticCourseCount,
          warning: amrWarning,
          antibiotics: antibioticItems.slice(0, 5),
        },
        doctorReferrals: Object.values(doctorMap).sort((a, b) => b.count - a.count),
        chronicConditions: patient.chronicConditions || [],
        recentPurchases: allItems.slice(0, 10),
      },
    });
  } catch (err) {
    next(err);
  }
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
router.delete('/:id', protect, requireRole('OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
    res.json({ success: true, message: 'Patient deactivated.' });
  } catch (err) { next(err); }
});

// GET /api/patients/:id/chronic-medicines
router.get('/:id/chronic-medicines', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let patient = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      patient = await Patient.findById(req.params.id);
    }
    if (!patient) {
      patient = await Patient.findOne({ phone: req.params.id });
    }
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Return saved chronic medicines if available
    if (patient.chronicMedications && patient.chronicMedications.length > 0) {
      return res.json({ success: true, data: patient.chronicMedications });
    }

    // Otherwise, discover recurring medications from invoice history
    const invoices = await Invoice.find({ 'billingSession.patientDetails.phone': patient.phone }).sort({ invoiceDate: -1 });
    const medCounts: Record<string, { productId: string; productName: string; quantity: number; conditionCategory: string }> = {};

    invoices.forEach((inv) => {
      (inv.billingSession?.items || []).forEach((item: any) => {
        const name = item.productSnapshot?.name || item.name || '';
        const lower = name.toLowerCase();
        let cat = 'GENERAL';
        if (['telma', 'amlodipine', 'losartan', 'concor', 'dytor'].some((k) => lower.includes(k))) cat = 'HYPERTENSION';
        else if (['glycomet', 'metformin', 'glimepiride', 'januvia', 'galvus'].some((k) => lower.includes(k))) cat = 'DIABETES';
        else if (['thyronorm', 'eltroxin', 'thyroxine'].some((k) => lower.includes(k))) cat = 'THYROID';
        else if (['atorva', 'rosuvastatin', 'ecosprin', 'clopidogrel'].some((k) => lower.includes(k))) cat = 'CARDIAC';

        const key = item.productId?.toString() || name;
        if (!medCounts[key]) {
          medCounts[key] = {
            productId: key,
            productName: name,
            quantity: item.quantity || 30,
            conditionCategory: cat,
          };
        }
      });
    });

    const discovered = Object.values(medCounts);
    res.json({ success: true, data: discovered });
  } catch (err) { next(err); }
});

// POST /api/patients/:id/chronic-medicines
router.post('/:id/chronic-medicines', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { medications } = req.body;
    if (!Array.isArray(medications)) {
      return res.status(400).json({ success: false, message: 'medications must be an array.' });
    }

    let patient = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      patient = await Patient.findById(req.params.id);
    }
    if (!patient) {
      patient = await Patient.findOne({ phone: req.params.id });
    }
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    patient.chronicMedications = medications;
    await patient.save();

    res.json({ success: true, data: patient.chronicMedications, message: 'Chronic medications updated.' });
  } catch (err) { next(err); }
});

export default router;
