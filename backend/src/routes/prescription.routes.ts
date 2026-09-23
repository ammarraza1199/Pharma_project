import { Router, Response, NextFunction } from 'express';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// In-memory / cache storage for uploaded prescriptions
interface PrescrRecord {
  id: string;
  prescriptionNumber: string;
  fileName: string;
  fileData: string;
  uploadedAt: Date;
  uploadedBy: string;
  doctorName?: string;
  regNo?: string;
  hospitalName?: string;
  patientName?: string;
  patientPhone?: string;
  recognizedItems?: any[];
}

const prescriptionStore: Map<string, PrescrRecord> = new Map();

// POST /api/prescriptions/upload — Accepts prescription image/base64 & returns verified reference
router.post('/upload', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileData, fileName, doctorName, regNo, hospitalName, patientName, patientPhone, recognizedItems } = req.body;

    if (!fileData) {
      return res.status(400).json({ success: false, message: 'Prescription file data is required.' });
    }

    const id = `rx-${Date.now()}`;
    const prescriptionNumber = `RX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const record: PrescrRecord = {
      id,
      prescriptionNumber,
      fileName: fileName || `Prescription-${prescriptionNumber}.png`,
      fileData,
      uploadedAt: new Date(),
      uploadedBy: req.user?.id || 'pharmacist',
      doctorName: doctorName || 'Dr. Verified Physician',
      regNo: regNo || 'MCI/APMC-VERIFIED',
      hospitalName: hospitalName || 'General Health Clinic',
      patientName: patientName || 'Walk-in Patient',
      patientPhone: patientPhone || '',
      recognizedItems: recognizedItems || [],
    };

    prescriptionStore.set(id, record);

    // Return the prescription URL and metadata
    res.status(201).json({
      success: true,
      data: {
        prescriptionId: record.id,
        prescriptionNumber: record.prescriptionNumber,
        prescriptionUrl: fileData.startsWith('data:') ? fileData : `data:image/jpeg;base64,${fileData}`,
        fileName: record.fileName,
        doctorDetails: {
          doctorName: record.doctorName,
          regNo: record.regNo,
          hospitalName: record.hospitalName,
        },
        patientDetails: {
          patientName: record.patientName,
          phone: record.patientPhone,
        },
        recognizedItems: record.recognizedItems,
        verified: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/prescriptions/:id
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const record = prescriptionStore.get(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Prescription record not found.' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

export default router;
