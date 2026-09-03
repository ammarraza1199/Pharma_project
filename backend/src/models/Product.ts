import mongoose, { Schema, Document } from 'mongoose';

export interface IBatchInfo {
  batchNumber: string;
  expiryDate: Date;
  stockQuantity: number;
  location: string;
  mrp: number;
}

export interface IProduct extends Document {
  name: string;
  brand: string;
  saltComposition: string;
  barcode: string;
  hsnCode: string;
  gstRate: number;
  unitMRP: number;
  sellingPrice: number;
  grossMarginPercent: number;
  scheduleCategory: 'REGULAR' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X';
  isNarcotic: boolean;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  totalStock: number;
  batches: IBatchInfo[];
  packSize?: string;
  unitsPerPack?: number;
  packType?: string;
  medicineType?: string;
  dosageForm?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatchInfo>(
  {
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    location: { type: String, default: 'Rack Main' },
    mrp: { type: Number, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    brand: { type: String, required: true, trim: true },
    saltComposition: { type: String, required: true, index: true },
    barcode: { type: String, unique: true, sparse: true },
    hsnCode: { type: String, required: true },
    gstRate: { type: Number, required: true, default: 12 },
    unitMRP: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    grossMarginPercent: { type: Number, default: 0 },
    scheduleCategory: {
      type: String,
      enum: ['REGULAR', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'],
      default: 'REGULAR',
    },
    isNarcotic: { type: Boolean, default: false },
    stockStatus: {
      type: String,
      enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'],
      default: 'OUT_OF_STOCK',
    },
    totalStock: { type: Number, default: 0 },
    batches: [BatchSchema],
    packSize: String,
    unitsPerPack: { type: Number, default: 10 },
    packType: String,
    medicineType: String,
    dosageForm: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index for full-text search
ProductSchema.index({ name: 'text', saltComposition: 'text', brand: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
