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
  },
  { timestamps: true }
);

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
