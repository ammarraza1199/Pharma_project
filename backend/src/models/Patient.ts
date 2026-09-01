import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  phone: string;
  age: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  totalBills: number;
  totalSpent: number;
  lastVisit?: Date;
  chronicConditions: string[];
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
  },
  { timestamps: true }
);

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
