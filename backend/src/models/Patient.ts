import mongoose, { Schema, Document } from 'mongoose';

export interface IChronicMedication {
  productId: string;
  productName: string;
  dosage: string;
  quantity: number;
  conditionCategory: string;
  defaultDaysSupply?: number;
  lastRefillDate?: Date;
  nextRefillDue?: Date;
  doctorName?: string;
}

export interface IPatientVitals {
  bp?: string;
  fbs?: string;
  ppbs?: string;
  hba1c?: string;
  tsh?: string;
  weightKg?: number;
  recordedDate?: Date;
}

export interface IPatient extends Document {
  name: string;
  phone: string;
  age: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  totalBills: number;
  totalSpent: number;
  lastVisit?: Date;
  chronicConditions: string[];
  chronicMedications: IChronicMedication[];
  vitals?: IPatientVitals;
  allergies?: string[];
  nextRefillDate?: Date;
  lastReminderSent?: Date;
  refillStatus?: 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, unique: true, trim: true },
    age: { type: String, default: '' },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'MALE' },
    totalBills: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastVisit: { type: Date },
    chronicConditions: [{ type: String }],
    chronicMedications: [
      {
        productId: String,
        productName: String,
        dosage: String,
        quantity: Number,
        conditionCategory: String,
        defaultDaysSupply: { type: Number, default: 30 },
        lastRefillDate: Date,
        nextRefillDue: Date,
        doctorName: String,
        _id: false,
      },
    ],
    vitals: {
      bp: { type: String, default: '' },
      fbs: { type: String, default: '' },
      ppbs: { type: String, default: '' },
      hba1c: { type: String, default: '' },
      tsh: { type: String, default: '' },
      weightKg: { type: Number },
      recordedDate: { type: Date },
    },
    allergies: [{ type: String }],
    nextRefillDate: { type: Date },
    lastReminderSent: { type: Date },
    refillStatus: { type: String, enum: ['ON_TRACK', 'DUE_SOON', 'OVERDUE'], default: 'ON_TRACK' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
