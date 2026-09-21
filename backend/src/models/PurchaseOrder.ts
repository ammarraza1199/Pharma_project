import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseOrderItem {
  productId: string;
  productName: string;
  packType: string;
  quantity: number;
  estimatedRate: number;
  gstRate: number;
  totalAmount: number;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierGstin?: string;
  supplierPhone?: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  paymentTerms: 'COD' | 'CREDIT_10_DAYS' | 'CREDIT_15_DAYS' | 'CREDIT_30_DAYS';
  status: 'DRAFT' | 'PLACED' | 'CONVERTED_TO_GRN' | 'CANCELLED';
  items: IPurchaseOrderItem[];
  totalAmount: number;
  schemeNotes?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    packType: { type: String, default: 'Strip of 10 Tablets' },
    quantity: { type: Number, required: true, min: 1 },
    estimatedRate: { type: Number, required: true },
    gstRate: { type: Number, default: 12 },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true },
    supplierId: { type: String, required: true },
    supplierName: { type: String, required: true },
    supplierGstin: { type: String, default: '' },
    supplierPhone: { type: String, default: '' },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date, required: true },
    paymentTerms: {
      type: String,
      enum: ['COD', 'CREDIT_10_DAYS', 'CREDIT_15_DAYS', 'CREDIT_30_DAYS'],
      default: 'CREDIT_15_DAYS',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PLACED', 'CONVERTED_TO_GRN', 'CANCELLED'],
      default: 'DRAFT',
    },
    items: [PurchaseOrderItemSchema],
    totalAmount: { type: Number, required: true },
    schemeNotes: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PurchaseOrderSchema.virtual('poId').get(function () {
  return this._id.toString();
});
PurchaseOrderSchema.set('toJSON', { virtuals: true });
PurchaseOrderSchema.set('toObject', { virtuals: true });

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
