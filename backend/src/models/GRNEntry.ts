import mongoose, { Schema, Document } from 'mongoose';

export interface IGRNEntry extends Document {
  grnNumber: string;
  supplierName: string;
  supplierId?: mongoose.Types.ObjectId;
  supplierInvoiceNo: string;
  receivedDate: Date;
  items: {
    productId: mongoose.Types.ObjectId;
    productName: string;
    batchNumber: string;
    expiryDate: Date;
    quantity: number;
    purchaseRate: number;
    mrp: number;
    sellingPrice: number;
    gstRate: number;
    totalAmount: number;
  }[];
  totalAmount: number;
  status: 'COMPLETED' | 'DRAFT';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const GRNSchema = new Schema<IGRNEntry>(
  {
    grnNumber: { type: String, required: true, unique: true },
    supplierName: { type: String, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    supplierInvoiceNo: { type: String, default: '' },
    receivedDate: { type: Date, default: Date.now },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: String,
        batchNumber: { type: String, required: true },
        expiryDate: { type: Date, required: true },
        quantity: { type: Number, required: true, min: 1 },
        purchaseRate: { type: Number, required: true },
        mrp: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
        gstRate: { type: Number, default: 12 },
        totalAmount: { type: Number, required: true },
        _id: false,
      },
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['COMPLETED', 'DRAFT'], default: 'COMPLETED' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const GRNEntry = mongoose.model<IGRNEntry>('GRNEntry', GRNSchema);
