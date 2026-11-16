import mongoose, { Schema, Document } from 'mongoose';

export interface IPrescriptionItem {
  productId?: string;
  name: string;
  dosage: string;
  frequency?: string;
  durationDays?: number;
  qty: number;
  matchedStock?: boolean;
}

export interface IPrescription extends Document {
  prescriptionNumber: string;
  fileName: string;
  fileData: string;
  uploadedAt: Date;
  uploadedBy: string;
  doctorName: string;
  regNo?: string;
  hospitalName?: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: string;
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
  diagnosis?: string;
  recognizedItems: IPrescriptionItem[];
  status: 'ACTIVE' | 'DISPENSED' | 'ARCHIVED';
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    prescriptionNumber: { type: String, required: true, unique: true },
    fileName: { type: String, default: 'Prescription.png' },
    fileData: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String, default: 'pharmacist' },
    doctorName: { type: String, default: 'Dr. Physician' },
    regNo: { type: String, default: '' },
    hospitalName: { type: String, default: '' },
    patientName: { type: String, default: 'Walk-in Patient' },
    patientPhone: { type: String, default: '' },
    patientAge: { type: String, default: '' },
    patientGender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'MALE' },
    diagnosis: { type: String, default: '' },
    recognizedItems: [
      {
        productId: { type: String },
        name: { type: String, required: true },
        dosage: { type: String, default: '' },
        frequency: { type: String, default: '' },
        durationDays: { type: Number, default: 30 },
        qty: { type: Number, default: 1 },
        matchedStock: { type: Boolean, default: true }
      }
    ],
    status: { type: String, enum: ['ACTIVE', 'DISPENSED', 'ARCHIVED'], default: 'ACTIVE' }
  },
  { timestamps: true }
);

export const Prescription = mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

