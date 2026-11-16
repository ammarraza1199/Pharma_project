import mongoose, { Schema, Document } from 'mongoose';

export interface ITransferIndentItem {
  productId?: mongoose.Types.ObjectId;
  medicineName: string;
  saltComposition?: string;
  batchNumber?: string;
  expiryDate?: Date;
  requestedQty: number;
  dispatchedQty?: number;
  receivedQty?: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IStockTransferIndent extends Document {
  indentNumber: string;
  indentDate: Date;
  sourceBranch: {
    branchId: string;
    branchName: string;
    location: string;
    phone: string;
  };
  destinationBranch: {
    branchId: string;
    branchName: string;
    location: string;
    phone: string;
  };
  priority: 'URGENT_CUSTOMER_WAITING' | 'ROUTINE_REPLENISHMENT' | 'CRITICAL_EMERGENCY';
  status: 'PENDING_APPROVAL' | 'APPROVED_DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED_CONFIRMED' | 'REJECTED';
  items: ITransferIndentItem[];
  totalItems: number;
  totalAmount: number;
  dispatchedAt?: Date;
  receivedAt?: Date;
  dispatchedBy?: string;
  receivedBy?: string;
  driverDetails?: {
    driverName: string;
    contactNumber: string;
    vehicleNumber: string;
  };
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StockTransferIndentSchema = new Schema<IStockTransferIndent>(
  {
    indentNumber: { type: String, required: true, unique: true, index: true },
    indentDate: { type: Date, default: Date.now, index: true },
    sourceBranch: {
      branchId: { type: String, required: true },
      branchName: { type: String, required: true },
      location: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    destinationBranch: {
      branchId: { type: String, required: true },
      branchName: { type: String, required: true },
      location: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    priority: {
      type: String,
      enum: ['URGENT_CUSTOMER_WAITING', 'ROUTINE_REPLENISHMENT', 'CRITICAL_EMERGENCY'],
      default: 'URGENT_CUSTOMER_WAITING',
    },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED_DISPATCHED', 'IN_TRANSIT', 'RECEIVED_CONFIRMED', 'REJECTED'],
      default: 'APPROVED_DISPATCHED',
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        medicineName: { type: String, required: true },
        saltComposition: { type: String, default: '' },
        batchNumber: { type: String, default: 'BATCH-GEN' },
        expiryDate: { type: Date },
        requestedQty: { type: Number, required: true, min: 1 },
        dispatchedQty: { type: Number, default: 0 },
        receivedQty: { type: Number, default: 0 },
        unitPrice: { type: Number, required: true },
        lineTotal: { type: Number, required: true },
      },
    ],
    totalItems: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    dispatchedAt: { type: Date },
    receivedAt: { type: Date },
    dispatchedBy: { type: String, default: 'Warehouse Manager' },
    receivedBy: { type: String, default: '' },
    driverDetails: {
      driverName: { type: String, default: 'FastTrack Delivery' },
      contactNumber: { type: String, default: '+91 98765 11223' },
      vehicleNumber: { type: String, default: 'TS 09 EA 4412' },
    },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const StockTransferIndent = mongoose.model<IStockTransferIndent>(
  'StockTransferIndent',
  StockTransferIndentSchema
);

