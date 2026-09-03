import mongoose, { Schema, Document } from 'mongoose';

export interface IDisposalRecord extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  batchNumber: string;
  quantityDisposed: number;
  disposalDate: Date;
  reason: 'EXPIRED' | 'DAMAGED_PACKAGING' | 'RECALLED_BY_GOVT';
  disposedBy: string;
  authorizedBy: string;
  createdAt: Date;
}

const DisposalSchema = new Schema<IDisposalRecord>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    batchNumber: { type: String, required: true },
    quantityDisposed: { type: Number, required: true, min: 1 },
    disposalDate: { type: Date, default: Date.now },
    reason: {
      type: String,
      enum: ['EXPIRED', 'DAMAGED_PACKAGING', 'RECALLED_BY_GOVT'],
      required: true,
    },
    disposedBy: { type: String, required: true },
    authorizedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const DisposalRecord = mongoose.model<IDisposalRecord>('DisposalRecord', DisposalSchema);
