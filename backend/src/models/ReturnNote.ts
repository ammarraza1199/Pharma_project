import mongoose, { Schema, Document } from 'mongoose';

export interface IReturnNote extends Document {
  creditNoteNo: string;
  originalInvoiceNo: string;
  patientName: string;
  returnDate: Date;
  items: {
    productId: mongoose.Types.ObjectId;
    productName: string;
    batchNumber: string;
    quantityReturned: number;
    unitPrice: number;
    refundAmount: number;
    reason: 'EXPIRED' | 'DAMAGED' | 'CUSTOMER_CANCELLED' | 'WRONG_MEDICINE';
    restocked: boolean;
  }[];
  totalRefundAmount: number;
  refundMethod: 'CASH' | 'UPI' | 'STORE_CREDIT';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ReturnNoteSchema = new Schema<IReturnNote>(
  {
    creditNoteNo: { type: String, required: true, unique: true },
    originalInvoiceNo: { type: String, required: true },
    patientName: { type: String, required: true },
    returnDate: { type: Date, default: Date.now },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: String,
        batchNumber: { type: String, required: true },
        quantityReturned: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
        refundAmount: { type: Number, required: true },
        reason: {
          type: String,
          enum: ['EXPIRED', 'DAMAGED', 'CUSTOMER_CANCELLED', 'WRONG_MEDICINE'],
          required: true,
        },
        restocked: { type: Boolean, default: false },
        _id: false,
      },
    ],
    totalRefundAmount: { type: Number, required: true },
    refundMethod: { type: String, enum: ['CASH', 'UPI', 'STORE_CREDIT'], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const ReturnNote = mongoose.model<IReturnNote>('ReturnNote', ReturnNoteSchema);
