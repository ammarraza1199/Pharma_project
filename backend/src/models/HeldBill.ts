import mongoose, { Schema, Document } from 'mongoose';

export interface IHeldBill extends Document {
  customerName: string;
  customerPhone: string;
  heldAt: Date;
  billingSession: any;
  totalAmount: number;
  assignedPharmacistId?: string;
  assignedCounter?: number;
  note?: string;
  createdBy: mongoose.Types.ObjectId;
}

const HeldBillSchema = new Schema<IHeldBill>(
  {
    customerName: { type: String, default: 'Walk-in Customer' },
    customerPhone: { type: String, default: '' },
    heldAt: { type: Date, default: Date.now },
    billingSession: { type: Schema.Types.Mixed, required: true },
    totalAmount: { type: Number, required: true },
    assignedPharmacistId: { type: String, default: '' },
    assignedCounter: { type: Number },
    note: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const HeldBill = mongoose.model<IHeldBill>('HeldBill', HeldBillSchema);
