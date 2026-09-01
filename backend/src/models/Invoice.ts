import mongoose, { Schema, Document } from 'mongoose';

const CartItemSchema = new Schema(
  {
    cartItemId: String,
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    product: { type: Schema.Types.Mixed }, // full product at time of sale
    selectedBatch: {
      batchNumber: String,
      expiryDate: Date,
      stockQuantity: Number,
      location: String,
      mrp: Number,
    },
    quantity: { type: Number, required: true, min: 1 },
    unitMode: { type: String, enum: ['PACK', 'LOOSE'], default: 'PACK' },
    unitPrice: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    cgstAmount: { type: Number, required: true },
    sgstAmount: { type: Number, required: true },
    totalGst: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
    isSubstitute: { type: Boolean, default: false },
    substitutedFor: String,
  },
  { _id: false }
);

export interface IInvoice extends Document {
  invoiceNumber: string;
  invoiceDate: Date;
  storeInfo: {
    name: string;
    dlNo: string;
    gstin: string;
    address: string;
    phone: string;
  };
  billingSession: {
    items: any[];
    doctorDetails: {
      doctorName: string;
      regNo: string;
      hospitalName?: string;
    };
    patientDetails: {
      patientName: string;
      phone: string;
      age: string;
      gender: string;
    };
    scheduleXVerified: boolean;
    pharmacistSignatureAcknowledged: boolean;
  };
  subtotal: number;
  totalDiscount: number;
  totalCGST: number;
  totalSGST: number;
  grandTotal: number;
  payment: {
    method: string;
    cashAmount: number;
    upiAmount: number;
    cardAmount: number;
    totalPaid: number;
    changeDue: number;
    paymentStatus: string;
  };
  invoiceType: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    invoiceDate: { type: Date, default: Date.now, index: true },
    storeInfo: {
      name: String,
      dlNo: String,
      gstin: String,
      address: String,
      phone: String,
    },
    billingSession: {
      items: [CartItemSchema],
      doctorDetails: {
        doctorName: String,
        regNo: String,
        hospitalName: String,
      },
      patientDetails: {
        patientName: String,
        phone: String,
        age: String,
        gender: String,
      },
      scheduleXVerified: { type: Boolean, default: false },
      pharmacistSignatureAcknowledged: { type: Boolean, default: false },
    },
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    totalCGST: { type: Number, required: true },
    totalSGST: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    payment: {
      method: { type: String, enum: ['CASH', 'UPI', 'CARD', 'SPLIT'] },
      cashAmount: { type: Number, default: 0 },
      upiAmount: { type: Number, default: 0 },
      cardAmount: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
      changeDue: { type: Number, default: 0 },
      paymentStatus: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
    },
    invoiceType: { type: String, enum: ['REGULAR', 'EMERGENCY'], default: 'REGULAR' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
