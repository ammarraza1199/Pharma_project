import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  dlNumber: string;
  address: string;
  pendingBalance: number;
  deliveryLeadTimeHours?: number;
  creditPeriodDays?: number;
  topBrandsSupplied?: string[];
  tradeDiscountPercent?: number;
  recommendationTag?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    gstin: { type: String, default: '' },
    dlNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    pendingBalance: { type: Number, default: 0 },
    deliveryLeadTimeHours: { type: Number, default: 24 },
    creditPeriodDays: { type: Number, default: 15 },
    topBrandsSupplied: [{ type: String }],
    tradeDiscountPercent: { type: Number, default: 20 },
    recommendationTag: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
