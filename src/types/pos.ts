export type AppView = 'LANDING' | 'AUTH' | 'POS_TERMINAL' | 'DASHBOARD' | 'INVENTORY' | 'INVENTORY_DASHBOARD' | 'PURCHASE_GRN' | 'REPORTS' | 'RETURNS' | 'EXPIRY_MANAGEMENT' | 'PATIENTS' | 'SUPPLIERS' | 'SETTINGS' | 'EMERGENCY_DELIVERY' | 'INVOICES' | 'ONLINE_DELIVERY';
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
  purchaseRate?: number; // Cost price paid to distributor
  clearanceDiscountPercent?: number; // e.g. 25%, 30%, 50% for 30-day dump clearance
  isDumpStock?: boolean;
}

export type MedicineType = 'Oral' | 'Injectable' | 'Topical' | 'Inhalation' | 'Ophthalmic' | 'Nasal' | 'Rectal';

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
  packSize?: string; // e.g. "10 Tablets in a Strip", "15 Tablets / Strip", "100ml / Bottle"
  unitsPerPack?: number; // e.g. 10, 15, 1
  packType?: string; // e.g. "Strip", "Bottle", "Vial", "Box", "Tube"
  medicineType?: MedicineType; // e.g. "Oral", "Injectable", "Topical"
  dosageForm?: string; // e.g. "Tablet", "Capsule", "Syrup", "Injection"
}

export type SellingUnitMode = 'PACK' | 'LOOSE';

export interface CartItem {
  cartItemId: string;
  productId: string;
  product: Product;
  selectedBatch: BatchInfo;
  quantity: number;
  unitMode?: SellingUnitMode; // 'PACK' (full strip/bottle) or 'LOOSE' (individual loose tablets/units)
  unitPrice: number;
  discountPercent: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
  lineTotal: number;
  isSubstitute?: boolean;
  substitutedFor?: string;
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

export interface PharmacistCounter {
  id: string;
  name: string;
  role: string;
  counterNumber: number;
  colorTheme: string;
  avatarInitials: string;
}

export interface BillingSession {
  id: string;
  tabTitle: string;
  assignedPharmacistId: string;
  transferredFromPharmacistId?: string;
  transferredFromName?: string;
  transferNote?: string;
  items: CartItem[];
  doctorDetails: DoctorDetails;
  patientDetails: PatientDetails;
  scheduleXVerified: boolean;
  scheduleXManagerPin?: string;
  pharmacistSignatureAcknowledged: boolean;
  uploadedPrescriptionUrl?: string;
  uploadedPrescriptionName?: string;
  createdAt: string;
}

export interface HeldBill {
  id: string;
  customerName: string;
  customerPhone: string;
  heldAt: string;
  assignedPharmacistId: string;
  transferredFromPharmacistId?: string;
  transferredFromName?: string;
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

export type PaymentMethodType = 'CASH' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'AUTO_PAY' | 'CARD' | 'SPLIT';

export interface PaymentDetails {
  method: PaymentMethodType;
  cashAmount: number;
  upiAmount: number;
  cardAmount: number;
  creditCardAmount?: number;
  debitCardAmount?: number;
  autoPayAmount?: number;
  totalPaid: number;
  changeDue: number;
  cardLast4?: string;
  cardNetwork?: string;
  cardType?: 'CREDIT' | 'DEBIT';
  autoPayDetails?: {
    mandateId: string;
    authMode: 'UPI_AUTOPAY' | 'E_NACH' | 'STANDING_INSTRUCTION';
    frequency: 'MONTHLY_REFILL' | 'BI_WEEKLY' | 'ON_DEMAND';
    customerVpaOrAcc?: string;
  };
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
  pharmacistName?: string;
  counterNumber?: number;
  isEmergencyInvoice?: boolean;
  emergencyCondition?: string;
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

export interface ChronicMedication {
  productId: string;
  productName: string;
  dosage: string; // e.g. "1-0-0 After Breakfast"
  frequencyDays: number; // e.g. 30 days refill
  quantity: number; // e.g. 30 tablets
  conditionCategory: 'DIABETES' | 'HYPERTENSION' | 'THYROID' | 'CARDIAC' | 'GENERAL';
  lastRefilledDate?: string;
  doctorName?: string;
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
  chronicMedications?: ChronicMedication[];
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
  tradeDiscountPercent?: number;     // e.g. 20% standard trade discount off MRP
  rebatePercent?: number;            // e.g. 3% prompt cash discount / quarterly turnover rebate
  liquidMarginPercent?: number;      // e.g. 24.5% net profit margin after costs & rebates
  creditPeriodDays?: number;         // e.g. 21 days credit window
  deliveryLeadTimeHours?: number;    // e.g. 4 hours / 24 hours turnaround
  topBrandsSupplied?: string[];      // e.g. ['Cipla', 'Sun Pharma', 'Dr. Reddy']
  recommendationTag?: 'BEST_MARGIN' | 'TOP_REBATE' | 'FAST_FULFILLMENT' | 'OVERALL_VALUE';
  performanceScore?: number;         // e.g. 96 (out of 100)
  returnAcceptanceRate?: number;     // e.g. 100% credit on expired items
}

export interface SupplierBill {
  billId: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  billDate: string; // YYYY-MM-DD
  billType: 'CASH' | 'CREDIT';
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  creditDays: number; // e.g. 10, 15, 21, 30 days
  dueDate: string; // YYYY-MM-DD
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
  notes?: string;
}

export interface SupplierPaymentLog {
  paymentId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD HH:MM
  paymentMode: 'UPI' | 'NEFT_RTGS' | 'CASH' | 'CHEQUE';
  referenceNo: string;
  billInvoiceNo?: string;
  notes?: string;
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

export type DeliveryStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'ON_TIME' | 'DELAYED' | 'DELIVERED' | 'CANCELLED';
export type DeliveryType = 'STANDARD' | 'EXPRESS' | 'SCHEDULED';
export type DeliveryMode = 'HOME_DELIVERY' | 'STORE_PICKUP';

export interface DeliveryOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DeliveryOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryMode: DeliveryMode; // 🛵 Home Delivery vs 🏬 Store Pickup
  deliveryAddress?: string;
  pickupCounter?: string; // Counter number for Store Pickup
  items: DeliveryOrderItem[];
  totalAmount: number;
  status: DeliveryStatus;
  deliveryType: DeliveryType;
  timeSlot?: string; // e.g. "Today 4:00 PM - 5:00 PM", "Within 30 min"
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  assignedRider?: string;
  riderPhone?: string;
  prescriptionRequired: boolean;
  prescriptionVerified: boolean;
  verificationDeadline?: string; // 24 Hours SLA countdown window
  pharmacistName?: string;
  invoiceNumber?: string; // Generated tax invoice number
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

