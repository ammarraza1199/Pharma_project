import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreSettings extends Document {
  storeName: string;
  dlNo: string;
  gstin: string;
  phone: string;
  address: string;
  defaultPrintFormat: 'THERMAL' | 'A4';
  autoPrintReceipt: boolean;
  soundEffects: boolean;
  autoAddOnScan: boolean;
  nearExpiryDaysThreshold: number;
  termsAndConditions: string;
  defaultTaxType: 'CGST_SGST' | 'IGST';
  managerPin: string;
  managerName: string;
  managerEmail: string;
  ownerName: string;
  ownerEmail: string;
  ownerPin: string;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName: { type: String, required: true },
    dlNo: { type: String, default: '' },
    gstin: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    defaultPrintFormat: { type: String, enum: ['THERMAL', 'A4'], default: 'THERMAL' },
    autoPrintReceipt: { type: Boolean, default: true },
    soundEffects: { type: Boolean, default: true },
    autoAddOnScan: { type: Boolean, default: true },
    nearExpiryDaysThreshold: { type: Number, default: 30 },
    termsAndConditions: { type: String, default: '' },
    defaultTaxType: { type: String, enum: ['CGST_SGST', 'IGST'], default: 'CGST_SGST' },
    managerPin: { type: String, required: true }, // bcrypt hashed
    managerName: { type: String, default: '' },
    managerEmail: { type: String, default: '' },
    ownerName: { type: String, default: '' },
    ownerEmail: { type: String, default: '' },
    ownerPin: { type: String, required: true }, // bcrypt hashed
  },
  { timestamps: true }
);

export const StoreSettings = mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema);
