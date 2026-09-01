import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  pharmacistName: string;
  pharmacyName: string;
  licenseNo: string;
  email: string;
  passwordHash: string;
  role: 'PHARMACIST' | 'MANAGER' | 'OWNER';
  isActive: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    pharmacistName: { type: String, required: true, trim: true },
    pharmacyName: { type: String, required: true, trim: true },
    licenseNo: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['PHARMACIST', 'MANAGER', 'OWNER'], default: 'PHARMACIST' },
    isActive: { type: Boolean, default: true },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
