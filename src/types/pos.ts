export type AppView = 'LANDING' | 'AUTH' | 'POS_TERMINAL' | 'DASHBOARD' | 'INVENTORY' | 'PURCHASE_GRN' | 'REPORTS' | 'RETURNS' | 'EXPIRY_MANAGEMENT' | 'PATIENTS' | 'SUPPLIERS' | 'SETTINGS';
export type AuthMode = 'SIGN_IN' | 'SIGN_UP';

export interface UserAccount {
  pharmacistName: string;
  pharmacyName: string;
  licenseNo: string;
  email: string;
  isLoggedIn: boolean;
}

export type ScheduleCategory = 'REGULAR' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';


export interface BatchInfo {
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  stockQuantity: number;
  location: string;
  mrp: number;
}

export interface Product {
  _id: string; // MongoDB ObjectID format
  name: string;
  brand: string;
  saltComposition: string;
  barcode: string;
  hsnCode: string;
  gstRate: number; // e.g. 5, 12, 18
  unitMRP: number;
  sellingPrice: number;
  grossMarginPercent: number;
  scheduleCategory: ScheduleCategory;
  isNarcotic?: boolean;
  stockStatus: StockStatus;
  totalStock: number;
  batches: BatchInfo[];
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  product: Product;
  selectedBatch: BatchInfo;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
  lineTotal: number;
}

export interface DoctorDetails {
  doctorName: string;
  regNo: string;
  hospitalName?: string;
}

export interface PatientDetails {
  patientName: string;
  phone: string;
  age: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface BillingSession {
  id: string;
  tabTitle: string;
  items: CartItem[];
  doctorDetails: DoctorDetails;
  patientDetails: PatientDetails;
  scheduleXVerified: boolean;
  scheduleXManagerPin?: string;
  pharmacistSignatureAcknowledged: boolean;
  createdAt: string;
}

export interface HeldBill {
  id: string;
  customerName: string;
  customerPhone: string;
  heldAt: string;
  billingSession: BillingSession;
  totalAmount: number;
}

export interface DrugInteraction {
  severity: 'MINOR' | 'MAJOR' | 'CONTRAINDICATED';
  drug1: string;
  drug2: string;
  description: string;
  clinicalImpact: string;
  management: string;
}

export interface PaymentDetails {
  method: 'CASH' | 'UPI' | 'CARD' | 'SPLIT';
  cashAmount: number;
  upiAmount: number;
  cardAmount: number;
  totalPaid: number;
  changeDue: number;
  razorpayQrUrl?: string;
  paymentStatus: 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
}

export interface FinalizedInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  billingSession: BillingSession;
  subtotal: number;
  totalDiscount: number;
  totalCGST: number;
  totalSGST: number;
  grandTotal: number;
  payment: PaymentDetails;
  storeInfo: {
    name: string;
    dlNo: string;
    gstin: string;
    address: string;
    phone: string;
  };
}

export interface GRNItem {
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchaseRate: number;
  mrp: number;
  sellingPrice: number;
  gstRate: number;
  totalAmount: number;
}

export interface GRNEntry {
  grnId: string;
  grnNumber: string;
  supplierName: string;
  supplierInvoiceNo: string;
  receivedDate: string;
  items: GRNItem[];
  totalAmount: number;
  status: 'COMPLETED' | 'DRAFT';
}

export interface ReturnItem {
  productId: string;
  productName: string;
  batchNumber: string;
  quantityReturned: number;
  unitPrice: number;
  refundAmount: number;
  reason: 'EXPIRED' | 'DAMAGED' | 'CUSTOMER_CANCELLED' | 'WRONG_MEDICINE';
  restocked: boolean;
}

export interface ReturnCreditNote {
  creditNoteNo: string;
  originalInvoiceNo: string;
  patientName: string;
  returnDate: string;
  items: ReturnItem[];
  totalRefundAmount: number;
  refundMethod: 'CASH' | 'UPI' | 'STORE_CREDIT';
}

export interface DisposalRecord {
  disposalId: string;
  productId: string;
  productName: string;
  batchNumber: string;
  quantityDisposed: number;
  disposalDate: string;
  reason: 'EXPIRED' | 'DAMAGED_PACKAGING' | 'RECALLED_BY_GOVT';
  disposedBy: string;
  approvalManagerPin: string;
}

export interface PatientRecord {
  patientId: string;
  name: string;
  phone: string;
  age: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  totalBills: number;
  totalSpent: number;
  lastVisit: string;
  chronicConditions?: string[];
}

export interface SupplierRecord {
  supplierId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  dlNumber: string;
  address: string;
  pendingBalance: number;
}

export interface StoreSettings {
  storeName: string;
  dlNo: string;
  gstin: string;
  phone: string;
  address: string;
  defaultPrintFormat: 'THERMAL' | 'A4';
  autoPrintReceipt: boolean;
  soundEffects: boolean;
  autoAddOnScan?: boolean;
  nearExpiryDaysThreshold?: number;
  termsAndConditions?: string;
  defaultTaxType?: 'CGST_SGST' | 'IGST';
  managerPin: string;
  managerName?: string;
  managerEmail?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPin?: string;
}

