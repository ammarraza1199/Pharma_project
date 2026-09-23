import mongoose, { Schema, Document } from 'mongoose';

export type DeliveryStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'ON_TIME' | 'DELAYED' | 'DELIVERED' | 'CANCELLED';
export type DeliveryType = 'STANDARD' | 'EXPRESS' | 'SCHEDULED';
export type DeliveryMode = 'HOME_DELIVERY' | 'STORE_PICKUP';

export interface IDeliveryOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IDeliveryOrder extends Document {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryMode: DeliveryMode;
  deliveryAddress?: string;
  pickupCounter?: string;
  items: IDeliveryOrderItem[];
  totalAmount: number;
  status: DeliveryStatus;
  deliveryType: DeliveryType;
  timeSlot?: string;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  assignedRider?: string;
  riderPhone?: string;
  prescriptionRequired: boolean;
  prescriptionVerified: boolean;
  verificationDeadline?: Date;
  pharmacistName?: string;
  invoiceNumber?: string;
  isDiscreetPackaging?: boolean;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryOrderItemSchema = new Schema<IDeliveryOrderItem>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const DeliveryOrderSchema = new Schema<IDeliveryOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryMode: {
      type: String,
      enum: ['HOME_DELIVERY', 'STORE_PICKUP'],
      default: 'HOME_DELIVERY',
    },
    deliveryAddress: { type: String, default: '' },
    pickupCounter: { type: String, default: '' },
    items: [DeliveryOrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'DISPATCHED', 'ON_TIME', 'DELAYED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    deliveryType: {
      type: String,
      enum: ['STANDARD', 'EXPRESS', 'SCHEDULED'],
      default: 'STANDARD',
    },
    timeSlot: { type: String, default: '' },
    estimatedDeliveryTime: { type: Date, required: true },
    actualDeliveryTime: { type: Date },
    assignedRider: { type: String, default: '' },
    riderPhone: { type: String, default: '' },
    prescriptionRequired: { type: Boolean, default: false },
    prescriptionVerified: { type: Boolean, default: false },
    verificationDeadline: { type: Date },
    pharmacistName: { type: String, default: '' },
    invoiceNumber: { type: String, default: '' },
    isDiscreetPackaging: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

DeliveryOrderSchema.virtual('orderId').get(function () {
  return this._id.toString();
});
DeliveryOrderSchema.set('toJSON', { virtuals: true });
DeliveryOrderSchema.set('toObject', { virtuals: true });

export const DeliveryOrder = mongoose.model<IDeliveryOrder>('DeliveryOrder', DeliveryOrderSchema);
