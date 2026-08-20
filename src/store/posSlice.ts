import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  BillingSession,
  CartItem,
  DoctorDetails,
  HeldBill,
  PatientDetails,
  Product,
  BatchInfo,
  FinalizedInvoice,
  PaymentDetails,
  DrugInteraction,
  AppView,
  AuthMode,
  UserAccount,
  GRNEntry,
  ReturnCreditNote,
  DisposalRecord,
  PatientRecord,
  SupplierRecord,
  StoreSettings
} from '../types/pos';
import { MOCK_PRODUCTS } from '../mock/products';
import { calculateItemGST } from '../utils/gstCalculator';
import { analyzeDrugInteractions } from '../utils/drugInteractionEngine';

interface PosState {
  currentView: AppView;
  authMode: AuthMode;
  currentUser: UserAccount | null;
  settings: StoreSettings;
  products: Product[];
  grnEntries: GRNEntry[];
  returnNotes: ReturnCreditNote[];
  disposalRecords: DisposalRecord[];
  patients: PatientRecord[];
  suppliers: SupplierRecord[];
  sessions: BillingSession[];
  activeSessionId: string;
  heldBills: HeldBill[];
  isManagerAuthenticated: boolean;
  
  // Modals & Overlays
  substitutionModal: {
    isOpen: boolean;
    originalProduct?: Product;
    alternatives: Product[];
  };
  complianceModal: {
    isOpen: boolean;
    type: 'SCHEDULE_H' | 'SCHEDULE_X' | null;
    targetProduct?: Product;
    pendingBatch?: BatchInfo;
    pendingQuantity?: number;
  };
  drugInteractionModal: {
    isOpen: boolean;
    interactions: DrugInteraction[];
  };
  paymentModal: {
    isOpen: boolean;
  };
  heldBillsModal: {
    isOpen: boolean;
  };
  customerDisplayModal: {
    isOpen: boolean;
  };
  invoiceHistoryModal: {
    isOpen: boolean;
  };
  
  // Printing & Finalization
  invoices: FinalizedInvoice[];
  latestFinalizedInvoice: FinalizedInvoice | null;
  isSubmittingBill: boolean;
}

const createInitialSession = (index: number): BillingSession => ({
  id: `session-${Date.now()}-${index}`,
  tabTitle: `Customer ${index}`,
  items: [],
  doctorDetails: { doctorName: '', regNo: '' },
  patientDetails: { patientName: '', phone: '', age: '', gender: 'MALE' },
  scheduleXVerified: false,
  pharmacistSignatureAcknowledged: false,
  createdAt: new Date().toISOString()
});

const LOCAL_STORAGE_INVOICES_KEY = 'genquantaa_pos_saved_invoices_v1';

const getInitialInvoices = (): FinalizedInvoice[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_INVOICES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to parse saved invoices:', err);
  }
  return [
    {
      invoiceNumber: 'INV-2026-532089',
      invoiceDate: '20 Aug 2026, 10:59 am',
      billingSession: {
        id: 'session-prev-1',
        tabTitle: 'Customer 1',
        items: [
          {
            cartItemId: 'item-001',
            productId: MOCK_PRODUCTS[0]._id,
            product: MOCK_PRODUCTS[0],
            selectedBatch: MOCK_PRODUCTS[0].batches[0],
            quantity: 1,
            unitPrice: 14.00,
            discountPercent: 0,
            taxableAmount: 12.50,
            cgstAmount: 0.75,
            sgstAmount: 0.75,
            totalGst: 1.50,
            lineTotal: 14.00
          }
        ],
        doctorDetails: { doctorName: 'DR. RAMESH', regNo: 'REG-88219' },
        patientDetails: { patientName: 'Walk-in Customer', phone: '9876543210', age: '35', gender: 'MALE' },
        scheduleXVerified: true,
        pharmacistSignatureAcknowledged: true,
        createdAt: '2026-08-20T10:59:00Z'
      },
      subtotal: 14.00,
      totalDiscount: 0.00,
      totalCGST: 0.75,
      totalSGST: 0.75,
      grandTotal: 14.00,
      payment: {
        method: 'UPI',
        cashAmount: 0,
        upiAmount: 14.00,
        cardAmount: 0,
        totalPaid: 14.00,
        changeDue: 0,
        paymentStatus: 'SUCCESS'
      },
      storeInfo: {
        name: 'GENQUANTAA MEDPLUS PHARMACY',
        dlNo: 'DL-2024/HYD/889201',
        gstin: '36AAACG1234F1Z8',
        address: 'Plot 42, Innovation Corridor, Tech City, Hyderabad - 500081',
        phone: '+91 98765 43210'
      }
    }
  ];
};

const saveInvoicesToStorage = (invoices: FinalizedInvoice[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(invoices.slice(0, 200)));
  } catch (err) {
    console.error('Failed to save invoices to localStorage:', err);
  }
};

const initialSession = createInitialSession(1);

const initialState: PosState = {
  currentView: 'LANDING',
  authMode: 'SIGN_IN',
  currentUser: null,
  settings: {
    storeName: 'GENQUANTAA MedPlus Pharmacy',
    dlNo: 'DL-2024/HYD/889201',
    gstin: '36AAACG1234F1Z8',
    phone: '+91 98765 43210',
    address: 'Tech City Store, Plot 44, Hi-Tech City, Hyderabad - 500081',
    defaultPrintFormat: 'THERMAL',
    autoPrintReceipt: true,
    soundEffects: true,
    autoAddOnScan: true,
    nearExpiryDaysThreshold: 30,
    termsAndConditions: '1. Goods once sold will not be taken back without original tax receipt. 2. Please check expiry before leaving counter.',
    defaultTaxType: 'CGST_SGST',
    managerPin: '1234',
    managerName: 'Rajesh Verma',
    managerEmail: 'rajesh.verma@genquantaa.com',
    ownerName: 'Dr. K. V. Rao',
    ownerEmail: 'kvrao@genquantaa.com',
    ownerPin: '1234'
  },
  products: MOCK_PRODUCTS,
  grnEntries: [],
  returnNotes: [],
  disposalRecords: [],
  patients: [
    { patientId: 'pat-001', name: 'Ramesh Kumar', phone: '9876543210', age: '42', gender: 'MALE', totalBills: 14, totalSpent: 5420, lastVisit: '2026-08-14', chronicConditions: ['Hypertension'] },
    { patientId: 'pat-002', name: 'Priya Sharma', phone: '9876543211', age: '35', gender: 'FEMALE', totalBills: 8, totalSpent: 2850, lastVisit: '2026-08-12', chronicConditions: ['Asthma'] },
    { patientId: 'pat-003', name: 'Anjali Reddy', phone: '9876543212', age: '29', gender: 'FEMALE', totalBills: 5, totalSpent: 1920, lastVisit: '2026-08-10' },
    { patientId: 'pat-004', name: 'Mohammed Ali', phone: '9876543213', age: '56', gender: 'MALE', totalBills: 22, totalSpent: 12400, lastVisit: '2026-08-08', chronicConditions: ['Type 2 Diabetes', 'Hypertension'] }
  ],
  suppliers: [
    { supplierId: 'sup-001', name: 'MedLife Distributors Pvt Ltd', contactPerson: 'Rajesh Verma', phone: '+91 98490 12345', email: 'rajesh@medlifedist.com', gstin: '36AAACM8890A1Z2', dlNumber: 'DL-1002/HYD', address: 'Plot 12, Pharma City, Hyderabad', pendingBalance: 14500 },
    { supplierId: 'sup-002', name: 'Sun Pharma Wholesale', contactPerson: 'Suresh Nair', phone: '+91 98490 12346', email: 'suresh@sunpharma.com', gstin: '36AAACS5512B1Z5', dlNumber: 'DL-1003/HYD', address: 'Block B, Industrial Area, Hyderabad', pendingBalance: 0 },
    { supplierId: 'sup-003', name: 'Cipla Regional Depot', contactPerson: 'Venkat Rao', phone: '+91 98490 12347', email: 'venkat@cipladepot.com', gstin: '36AAACC4488C1Z9', dlNumber: 'DL-1004/HYD', address: 'Sector 4, Logistics Park, Hyderabad', pendingBalance: 8200 }
  ],
  sessions: [initialSession],
  activeSessionId: initialSession.id,
  heldBills: [],
  isManagerAuthenticated: false,
  
  substitutionModal: {
    isOpen: false,
    alternatives: []
  },
  complianceModal: {
    isOpen: false,
    type: null
  },
  drugInteractionModal: {
    isOpen: false,
    interactions: []
  },
  paymentModal: {
    isOpen: false
  },
  heldBillsModal: {
    isOpen: false
  },
  customerDisplayModal: {
    isOpen: false
  },
  invoiceHistoryModal: {
    isOpen: false
  },
  
  invoices: getInitialInvoices(),
  latestFinalizedInvoice: null,
  isSubmittingBill: false
};

export const checkIsScheduleXOrNarcotic = (product: Product): boolean => {
  if (!product) return false;
  if (product.scheduleCategory === 'SCHEDULE_X') return true;
  if (product.isNarcotic) return true;
  const catUpper = String(product.scheduleCategory || '').toUpperCase();
  if (catUpper.includes('SCH-X') || catUpper.includes('SCHEDULE_X') || catUpper.includes('NARCOTIC')) return true;
  const nameLower = (product.name || '').toLowerCase();
  const saltLower = (product.saltComposition || '').toLowerCase();
  if (
    nameLower.includes('narcotic') || saltLower.includes('narcotic') ||
    nameLower.includes('alprazolam') || nameLower.includes('restyl') ||
    nameLower.includes('morphine') || nameLower.includes('fentanyl') ||
    nameLower.includes('pethidine') || nameLower.includes('ketamine') ||
    nameLower.includes('codeine') || nameLower.includes('methadone')
  ) return true;
  return false;
};

const addProductToCartInternal = (
  state: PosState,
  product: Product,
  selectedBatch?: BatchInfo,
  quantity: number = 1
) => {
  const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
  if (!currentSession) return;

  const batchToUse = selectedBatch || product.batches.find(b => {
    const expDate = new Date(b.expiryDate);
    return expDate > new Date() && b.stockQuantity > 0;
  }) || product.batches[0];

  if (batchToUse) {
    const expDate = new Date(batchToUse.expiryDate);
    if (expDate <= new Date()) {
      alert(`HARD BLOCK: Batch ${batchToUse.batchNumber} has EXPIRED (${batchToUse.expiryDate}). Cannot add to cart.`);
      return;
    }
  }

  const existingItem = currentSession.items.find(item => item.productId === product._id && item.selectedBatch.batchNumber === batchToUse?.batchNumber);

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    const gst = calculateItemGST(product.sellingPrice, newQty, existingItem.discountPercent, product.gstRate);
    existingItem.quantity = newQty;
    existingItem.taxableAmount = gst.taxableAmount;
    existingItem.cgstAmount = gst.cgstAmount;
    existingItem.sgstAmount = gst.sgstAmount;
    existingItem.totalGst = gst.totalGst;
    existingItem.lineTotal = gst.lineTotal;
  } else {
    const gst = calculateItemGST(product.sellingPrice, quantity, 0, product.gstRate);
    const newItem: CartItem = {
      cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: product._id,
      product,
      selectedBatch: batchToUse,
      quantity,
      unitPrice: product.sellingPrice,
      discountPercent: 0,
      taxableAmount: gst.taxableAmount,
      cgstAmount: gst.cgstAmount,
      sgstAmount: gst.sgstAmount,
      totalGst: gst.totalGst,
      lineTotal: gst.lineTotal
    };
    currentSession.items.push(newItem);
  }

  const interactionResult = analyzeDrugInteractions(
    currentSession.items,
    product.saltComposition || product.name
  );
  if (interactionResult.hasMajor || interactionResult.hasContraindicated) {
    state.drugInteractionModal = {
      isOpen: true,
      interactions: interactionResult.interactions
    };
  }
};

export const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    // Navigation & Auth
    navigateTo: (state, action: PayloadAction<AppView>) => {
      state.currentView = action.payload;
    },
    setAuthMode: (state, action: PayloadAction<AuthMode>) => {
      state.authMode = action.payload;
    },
    loginUser: (state, action: PayloadAction<{ email: string; password?: string; pharmacistName?: string; pharmacyName?: string; licenseNo?: string }>) => {
      const email = action.payload.email || '';
      const emailPrefixName = email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'User';
      state.currentUser = {
        pharmacistName: action.payload.pharmacistName || emailPrefixName,
        pharmacyName: action.payload.pharmacyName || 'GENQUANTAA POS Store',
        licenseNo: action.payload.licenseNo || 'DL-2024/HYD/889201',
        email: email || 'user@genquantaa.com',
        isLoggedIn: true
      };
      state.currentView = 'DASHBOARD';
    },
    registerUser: (state, action: PayloadAction<UserAccount>) => {
      state.currentUser = {
        ...action.payload,
        isLoggedIn: false
      };
      state.currentView = 'AUTH';
    },
    logoutUser: (state) => {
      state.currentUser = null;
      state.currentView = 'LANDING';
    },

    // Inventory & Stock Management
    addProduct: (state, action: PayloadAction<Omit<Product, '_id'> & { _id?: string }>) => {
      const newProduct: Product = {
        ...action.payload,
        _id: action.payload._id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        batches: action.payload.batches || [],
        totalStock: action.payload.totalStock || 0,
        stockStatus: action.payload.stockStatus || (action.payload.totalStock > 20 ? 'IN_STOCK' : action.payload.totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK')
      };
      state.products.unshift(newProduct);
    },

    updateProduct: (state, action: PayloadAction<Product>) => {
      const idx = state.products.findIndex(p => p._id === action.payload._id);
      if (idx !== -1) {
        state.products[idx] = action.payload;
      }
    },

    submitGRNEntry: (state, action: PayloadAction<GRNEntry>) => {
      const entry = action.payload;
      state.grnEntries.unshift(entry);

      // Auto-update stock levels and batches for each received item
      entry.items.forEach(grnItem => {
        const prod = state.products.find(p => p._id === grnItem.productId);
        if (prod) {
          const existingBatch = prod.batches.find(b => b.batchNumber === grnItem.batchNumber);
          if (existingBatch) {
            existingBatch.stockQuantity += grnItem.quantity;
            existingBatch.mrp = grnItem.mrp;
          } else {
            prod.batches.push({
              batchNumber: grnItem.batchNumber,
              expiryDate: grnItem.expiryDate,
              stockQuantity: grnItem.quantity,
              location: 'Rack Main',
              mrp: grnItem.mrp
            });
          }
          // Recalculate total stock and status
          prod.totalStock = prod.batches.reduce((sum, b) => sum + b.stockQuantity, 0);
          prod.sellingPrice = grnItem.sellingPrice;
          prod.unitMRP = grnItem.mrp;
          prod.stockStatus = prod.totalStock > 20 ? 'IN_STOCK' : prod.totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';
        }
      });
    },

    processReturnCreditNote: (state, action: PayloadAction<ReturnCreditNote>) => {
      const note = action.payload;
      state.returnNotes.unshift(note);

      // Re-stock valid items
      note.items.forEach(retItem => {
        if (retItem.restocked) {
          const prod = state.products.find(p => p._id === retItem.productId);
          if (prod) {
            const batch = prod.batches.find(b => b.batchNumber === retItem.batchNumber) || prod.batches[0];
            if (batch) {
              batch.stockQuantity += retItem.quantityReturned;
              prod.totalStock = prod.batches.reduce((sum, b) => sum + b.stockQuantity, 0);
              prod.stockStatus = prod.totalStock > 20 ? 'IN_STOCK' : prod.totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';
            }
          }
        }
      });
    },

    markStockDisposed: (state, action: PayloadAction<DisposalRecord>) => {
      const record = action.payload;
      state.disposalRecords.unshift(record);

      const prod = state.products.find(p => p._id === record.productId);
      if (prod) {
        const batch = prod.batches.find(b => b.batchNumber === record.batchNumber);
        if (batch) {
          batch.stockQuantity = Math.max(0, batch.stockQuantity - record.quantityDisposed);
          prod.totalStock = prod.batches.reduce((sum, b) => sum + b.stockQuantity, 0);
          prod.stockStatus = prod.totalStock > 20 ? 'IN_STOCK' : prod.totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';
        }
      }
    },

    addPatient: (state, action: PayloadAction<Omit<PatientRecord, 'patientId'> & { patientId?: string }>) => {
      const newPatient: PatientRecord = {
        ...action.payload,
        patientId: action.payload.patientId || `pat-${Date.now()}`
      };
      state.patients.unshift(newPatient);
    },

    addSupplier: (state, action: PayloadAction<Omit<SupplierRecord, 'supplierId'> & { supplierId?: string }>) => {
      const newSupplier: SupplierRecord = {
        ...action.payload,
        supplierId: action.payload.supplierId || `sup-${Date.now()}`
      };
      state.suppliers.unshift(newSupplier);
    },

    updateStoreSettings: (state, action: PayloadAction<Partial<StoreSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
      if (action.payload.storeName && state.currentUser) {
        state.currentUser.pharmacyName = action.payload.storeName;
      }
    },

    // Tab Management
    addNewTab: (state) => {
      const nextIndex = state.sessions.length + 1;
      const newSession = createInitialSession(nextIndex);
      state.sessions.push(newSession);
      state.activeSessionId = newSession.id;
    },
    switchTab: (state, action: PayloadAction<string>) => {
      state.activeSessionId = action.payload;
    },
    closeTab: (state, action: PayloadAction<string>) => {
      if (state.sessions.length <= 1) return;
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
      if (state.activeSessionId === action.payload) {
        state.activeSessionId = state.sessions[0].id;
      }
    },

    // Cart Management
    addItemToCart: (state, action: PayloadAction<{ product: Product; selectedBatch?: BatchInfo; quantity?: number; isAuthorizedByPin?: boolean; skipSchHPrompt?: boolean }>) => {
      const { product, selectedBatch, quantity = 1, isAuthorizedByPin = false } = action.payload;
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (!currentSession) return;

      // 1. Out of Stock check -> Smart Substitution
      if (product.stockStatus === 'OUT_OF_STOCK' || product.totalStock === 0) {
        const alternatives = state.products
          .filter(p => p._id !== product._id && p.saltComposition.toLowerCase() === product.saltComposition.toLowerCase() && p.totalStock > 0)
          .sort((a, b) => b.grossMarginPercent - a.grossMarginPercent)
          .slice(0, 3);
        
        state.substitutionModal = {
          isOpen: true,
          originalProduct: product,
          alternatives
        };
        return;
      }

      // 2. Schedule X / Narcotic requirement -> Mandatory Manager PIN Modal EVERY TIME
      const isNarcoticOrSchX = checkIsScheduleXOrNarcotic(product);
      if (isNarcoticOrSchX && !isAuthorizedByPin) {
        state.complianceModal = {
          isOpen: true,
          type: 'SCHEDULE_X',
          targetProduct: product,
          pendingBatch: selectedBatch,
          pendingQuantity: quantity
        };
        return;
      }

      // 3. Schedule H / H1 requirement -> Ask for Doctor & Patient details if missing BEFORE adding to cart
      const isSchH = product.scheduleCategory === 'SCHEDULE_H' || (product.scheduleCategory && String(product.scheduleCategory).includes('H'));
      const hasDocAndPatient = Boolean(currentSession.doctorDetails?.doctorName && currentSession.patientDetails?.patientName);

      if (isSchH && !hasDocAndPatient) {
        state.complianceModal = {
          isOpen: true,
          type: 'SCHEDULE_H',
          targetProduct: product,
          pendingBatch: selectedBatch,
          pendingQuantity: quantity
        };
        return; // Do NOT add to cart yet! Require saving doctor & patient details first!
      }

      // 4. Batch Selection & Cart addition
      addProductToCartInternal(state, product, selectedBatch, quantity);
    },

    updateCartItemQuantity: (state, action: PayloadAction<{ cartItemId: string; quantity: number }>) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (!currentSession) return;

      const item = currentSession.items.find(i => i.cartItemId === action.payload.cartItemId);
      if (item) {
        if (action.payload.quantity <= 0) {
          currentSession.items = currentSession.items.filter(i => i.cartItemId !== action.payload.cartItemId);
        } else {
          item.quantity = action.payload.quantity;
          const gst = calculateItemGST(item.unitPrice, item.quantity, item.discountPercent, item.product.gstRate);
          item.taxableAmount = gst.taxableAmount;
          item.cgstAmount = gst.cgstAmount;
          item.sgstAmount = gst.sgstAmount;
          item.totalGst = gst.totalGst;
          item.lineTotal = gst.lineTotal;
        }
      }
    },

    updateCartItemDiscount: (state, action: PayloadAction<{ cartItemId: string; discountPercent: number }>) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (!currentSession) return;

      const item = currentSession.items.find(i => i.cartItemId === action.payload.cartItemId);
      if (item) {
        item.discountPercent = action.payload.discountPercent;
        const gst = calculateItemGST(item.unitPrice, item.quantity, item.discountPercent, item.product.gstRate);
        item.taxableAmount = gst.taxableAmount;
        item.cgstAmount = gst.cgstAmount;
        item.sgstAmount = gst.sgstAmount;
        item.totalGst = gst.totalGst;
        item.lineTotal = gst.lineTotal;
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (currentSession) {
        currentSession.items = currentSession.items.filter(i => i.cartItemId !== action.payload);
      }
    },

    clearActiveCart: (state) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (currentSession) {
        currentSession.items = [];
      }
    },

    applyBulkDiscount: (state, action: PayloadAction<number>) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (currentSession) {
        const discountPct = action.payload;
        currentSession.items.forEach(item => {
          item.discountPercent = discountPct;
          const gst = calculateItemGST(item.unitPrice, item.quantity, discountPct, item.product.gstRate);
          item.taxableAmount = gst.taxableAmount;
          item.cgstAmount = gst.cgstAmount;
          item.sgstAmount = gst.sgstAmount;
          item.totalGst = gst.totalGst;
          item.lineTotal = gst.lineTotal;
        });
      }
    },

    // Compliance & Patient Details
    setDoctorDetails: (state, action: PayloadAction<DoctorDetails>) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (currentSession) {
        currentSession.doctorDetails = action.payload;
      }
    },
    setPatientDetails: (state, action: PayloadAction<PatientDetails>) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (currentSession) {
        currentSession.patientDetails = action.payload;
      }
    },
    saveScheduleHCompliance: (state, action: PayloadAction<{ doctorDetails: DoctorDetails; patientDetails: PatientDetails }>) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (currentSession) {
        currentSession.doctorDetails = action.payload.doctorDetails;
        currentSession.patientDetails = action.payload.patientDetails;
      }

      if (state.complianceModal.isOpen && state.complianceModal.type === 'SCHEDULE_H' && state.complianceModal.targetProduct) {
        const targetProd = state.complianceModal.targetProduct;
        const pendingBatch = state.complianceModal.pendingBatch;
        const pendingQty = state.complianceModal.pendingQuantity || 1;

        state.complianceModal.isOpen = false;
        state.complianceModal.targetProduct = undefined;
        state.complianceModal.pendingBatch = undefined;
        state.complianceModal.pendingQuantity = undefined;

        // Add medicine to cart AFTER doctor & patient details are saved!
        addProductToCartInternal(state, targetProd, pendingBatch, pendingQty);
      } else {
        state.complianceModal.isOpen = false;
      }
    },
    verifyManagerPin: (state, action: PayloadAction<string>) => {
      const validPin = state.settings.managerPin || '1234';
      if (action.payload === validPin) {
        state.isManagerAuthenticated = true;
        
        // Handle authorized pending Schedule X / Narcotic drug addition
        if (state.complianceModal.isOpen && state.complianceModal.type === 'SCHEDULE_X' && state.complianceModal.targetProduct) {
          const targetProd = state.complianceModal.targetProduct;
          const pendingBatch = state.complianceModal.pendingBatch;
          const pendingQty = state.complianceModal.pendingQuantity || 1;

          state.complianceModal.isOpen = false;
          state.complianceModal.targetProduct = undefined;
          state.complianceModal.pendingBatch = undefined;
          state.complianceModal.pendingQuantity = undefined;

          addProductToCartInternal(state, targetProd, pendingBatch, pendingQty);
        } else {
          state.complianceModal.isOpen = false;
        }

        state.drugInteractionModal.isOpen = false;
      } else {
        alert('INVALID MANAGER PIN! Access Denied.');
      }
    },

    verifyOwnerPin: (state, action: PayloadAction<string>) => {
      const validPin = state.settings.ownerPin || '1234';
      if (action.payload === validPin) {
        state.drugInteractionModal.isOpen = false;
      } else {
        alert('INVALID STORE OWNER PIN! Access Denied.');
      }
    },
    acknowledgePharmacistSignature: (state) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (currentSession) {
        currentSession.pharmacistSignatureAcknowledged = true;
      }
      state.drugInteractionModal.isOpen = false;
    },

    // Bill Holding
    holdActiveBill: (state, action: PayloadAction<{ customerName: string; customerPhone: string }>) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (!currentSession || currentSession.items.length === 0) return;

      const total = currentSession.items.reduce((sum, item) => sum + item.lineTotal, 0);

      const heldBill: HeldBill = {
        id: `held-${Date.now()}`,
        customerName: action.payload.customerName || 'Walk-in Customer',
        customerPhone: action.payload.customerPhone || 'N/A',
        heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        billingSession: JSON.parse(JSON.stringify(currentSession)),
        totalAmount: total
      };

      state.heldBills.push(heldBill);
      
      // Reset active tab items
      currentSession.items = [];
      currentSession.doctorDetails = { doctorName: '', regNo: '' };
      currentSession.patientDetails = { patientName: '', phone: '', age: '', gender: 'MALE' };
    },

    restoreHeldBill: (state, action: PayloadAction<string>) => {
      const heldIndex = state.heldBills.findIndex(h => h.id === action.payload);
      if (heldIndex !== -1) {
        const held = state.heldBills[heldIndex];
        const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
        if (currentSession) {
          currentSession.items = held.billingSession.items;
          currentSession.doctorDetails = held.billingSession.doctorDetails;
          currentSession.patientDetails = held.billingSession.patientDetails;
        }
        state.heldBills.splice(heldIndex, 1);
        state.heldBillsModal.isOpen = false;
      }
    },

    discardHeldBill: (state, action: PayloadAction<string>) => {
      state.heldBills = state.heldBills.filter(h => h.id !== action.payload);
    },

    // UI Modals Control
    closeSubstitutionModal: (state) => {
      state.substitutionModal.isOpen = false;
    },
    closeComplianceModal: (state) => {
      state.complianceModal.isOpen = false;
    },
    closeDrugInteractionModal: (state) => {
      const hasContraindicated = state.drugInteractionModal.interactions.some(i => i.severity === 'CONTRAINDICATED');
      if (hasContraindicated) {
        const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
        if (currentSession && currentSession.items.length > 0) {
          currentSession.items.pop();
        }
      }
      state.drugInteractionModal.isOpen = false;
    },
    setPaymentModalOpen: (state, action: PayloadAction<boolean>) => {
      state.paymentModal.isOpen = action.payload;
    },
    setHeldBillsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.heldBillsModal.isOpen = action.payload;
    },
    setCustomerDisplayModalOpen: (state, action: PayloadAction<boolean>) => {
      state.customerDisplayModal.isOpen = action.payload;
    },
    openScheduleHDetailsPrompt: (state) => {
      state.complianceModal = {
        isOpen: true,
        type: 'SCHEDULE_H'
      };
    },

    // Bill Finalization & Printing
    startSubmittingBill: (state) => {
      state.isSubmittingBill = true;
    },
    finalizeBillSuccess: (state, action: PayloadAction<PaymentDetails>) => {
      const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
      if (!currentSession) return;

      const subtotal = currentSession.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const totalDiscount = currentSession.items.reduce((sum, item) => sum + ((item.unitPrice * item.quantity * item.discountPercent) / 100), 0);
      const totalCGST = currentSession.items.reduce((sum, item) => sum + item.cgstAmount, 0);
      const totalSGST = currentSession.items.reduce((sum, item) => sum + item.sgstAmount, 0);
      const grandTotal = currentSession.items.reduce((sum, item) => sum + item.lineTotal, 0);

      const invoice: FinalizedInvoice = {
        invoiceNumber: `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        invoiceDate: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        billingSession: JSON.parse(JSON.stringify(currentSession)),
        subtotal: Number(subtotal.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        totalCGST: Number(totalCGST.toFixed(2)),
        totalSGST: Number(totalSGST.toFixed(2)),
        grandTotal: Number(grandTotal.toFixed(2)),
        payment: action.payload,
        storeInfo: {
          name: 'GENQUANTAA MEDPLUS PHARMACY',
          dlNo: 'DL-2024/HYD/889201',
          gstin: '36AAACG1234F1Z8',
          address: 'Plot 42, Innovation Corridor, Tech City, Hyderabad - 500081',
          phone: '+91 98765 43210'
        }
      };

      state.invoices.unshift(invoice);
      saveInvoicesToStorage(state.invoices);

      state.latestFinalizedInvoice = invoice;
      state.isSubmittingBill = false;
      state.paymentModal.isOpen = false;

      // Clear current tab cart items after payment confirmation
      currentSession.items = [];
      currentSession.doctorDetails = { doctorName: '', regNo: '' };
      currentSession.patientDetails = { patientName: '', phone: '', age: '', gender: 'MALE' };
    },
    clearFinalizedInvoice: (state) => {
      state.latestFinalizedInvoice = null;
    },
    setInvoiceHistoryModalOpen: (state, action: PayloadAction<boolean>) => {
      state.invoiceHistoryModal.isOpen = action.payload;
    },
    reprintInvoice: (state, action: PayloadAction<string>) => {
      const inv = state.invoices.find(i => i.invoiceNumber === action.payload);
      if (inv) {
        state.latestFinalizedInvoice = inv;
      }
    },
    deleteSavedInvoice: (state, action: PayloadAction<string>) => {
      state.invoices = state.invoices.filter(i => i.invoiceNumber !== action.payload);
      saveInvoicesToStorage(state.invoices);
    },
    clearAllSavedInvoices: (state) => {
      state.invoices = [];
      saveInvoicesToStorage([]);
    }
  }
});

export const {
  navigateTo,
  setAuthMode,
  loginUser,
  registerUser,
  logoutUser,
  addProduct,
  updateProduct,
  submitGRNEntry,
  processReturnCreditNote,
  markStockDisposed,
  addPatient,
  addSupplier,
  updateStoreSettings,
  addNewTab,
  switchTab,
  closeTab,
  addItemToCart,
  updateCartItemQuantity,
  updateCartItemDiscount,
  removeFromCart,
  clearActiveCart,
  applyBulkDiscount,
  setDoctorDetails,
  setPatientDetails,
  saveScheduleHCompliance,
  verifyManagerPin,
  verifyOwnerPin,
  acknowledgePharmacistSignature,
  holdActiveBill,
  restoreHeldBill,
  discardHeldBill,
  closeSubstitutionModal,
  closeComplianceModal,
  closeDrugInteractionModal,
  setPaymentModalOpen,
  setHeldBillsModalOpen,
  setCustomerDisplayModalOpen,
  openScheduleHDetailsPrompt,
  startSubmittingBill,
  finalizeBillSuccess,
  clearFinalizedInvoice,
  setInvoiceHistoryModalOpen,
  reprintInvoice,
  deleteSavedInvoice,
  clearAllSavedInvoices
} = posSlice.actions;

export default posSlice.reducer;
