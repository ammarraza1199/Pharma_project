import mongoose, { Schema, Document } from 'mongoose';

export interface IDenominationBreakdown {
  n2000?: number;
  n500?: number;
  n200?: number;
  n100?: number;
  n50?: number;
  n20?: number;
  n10?: number;
  coins?: number;
}

export interface ICashRegister extends Document {
  registerDate: Date;
  shift: 'MORNING' | 'EVENING' | 'NIGHT' | 'FULL_DAY';
  status: 'OPEN' | 'CLOSED';
  cashierName: string;
  openedAt: Date;
  closedAt?: Date;
  openingFloat: number;
  totalSalesCash: number;
  totalSalesUpi: number;
  totalSalesCard: number;
  totalSalesSplitCash: number;
  grossSales: number;
  totalBills: number;
  totalRefundsCash: number;
  refundsCount: number;
  pettyCashOutflow: number;
  pettyCashInflow: number;
  expectedCash: number;
  actualCashCounted: number;
  denominationBreakdown: IDenominationBreakdown;
  cashVariance: number;
  notes: string;
  verifiedBy?: string;
  createdAt: Date;
}

const CashRegisterSchema = new Schema<ICashRegister>(
  {
    registerDate: { type: Date, default: Date.now, index: true },
    shift: { type: String, enum: ['MORNING', 'EVENING', 'NIGHT', 'FULL_DAY'], default: 'FULL_DAY' },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'CLOSED' },
    cashierName: { type: String, required: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    openingFloat: { type: Number, default: 0 },
    totalSalesCash: { type: Number, default: 0 },
    totalSalesUpi: { type: Number, default: 0 },
    totalSalesCard: { type: Number, default: 0 },
    totalSalesSplitCash: { type: Number, default: 0 },
    grossSales: { type: Number, default: 0 },
    totalBills: { type: Number, default: 0 },
    totalRefundsCash: { type: Number, default: 0 },
    refundsCount: { type: Number, default: 0 },
    pettyCashOutflow: { type: Number, default: 0 },
    pettyCashInflow: { type: Number, default: 0 },
    expectedCash: { type: Number, default: 0 },
    actualCashCounted: { type: Number, default: 0 },
    denominationBreakdown: {
      n2000: { type: Number, default: 0 },
      n500: { type: Number, default: 0 },
      n200: { type: Number, default: 0 },
      n100: { type: Number, default: 0 },
      n50: { type: Number, default: 0 },
      n20: { type: Number, default: 0 },
      n10: { type: Number, default: 0 },
      coins: { type: Number, default: 0 },
    },
    cashVariance: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    verifiedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export const CashRegister = mongoose.model<ICashRegister>('CashRegister', CashRegisterSchema);

