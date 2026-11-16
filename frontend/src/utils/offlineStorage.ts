import api from './api';
import type { FinalizedInvoice, Product } from '../types/pos';

const OFFLINE_QUEUE_KEY = 'genquantaa_offline_invoices_queue';
const PRODUCTS_CACHE_KEY = 'genquantaa_offline_products_cache';
const LAST_BACKUP_TIME_KEY = 'genquantaa_last_backup_time';

export interface OfflineInvoiceRecord {
  offlineId: string;
  invoiceNumber: string;
  invoiceDate: string;
  subtotal: number;
  totalDiscount: number;
  totalCGST: number;
  totalSGST: number;
  grandTotal: number;
  payment: any;
  billingSession: any;
  storeInfo: any;
  syncStatus: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  syncedAt?: string;
  isOfflineGenerated: boolean;
}

// Check network status
export const isBrowserOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

// Retrieve all offline invoices from local storage
export const getOfflineInvoices = (): OfflineInvoiceRecord[] => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[offlineStorage] Failed to read offline queue', e);
    return [];
  }
};

// Save a newly generated offline bill to local queue
export const saveOfflineInvoice = (payload: {
  billingSession: any;
  payment: any;
  subtotal: number;
  totalDiscount: number;
  totalCGST: number;
  totalSGST: number;
  grandTotal: number;
  storeInfo?: any;
}): FinalizedInvoice => {
  const existingQueue = getOfflineInvoices();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seqSuffix = String(existingQueue.length + 1).padStart(4, '0');
  const invoiceNumber = `INV-OFFLINE-${dateStr}-${seqSuffix}`;

  const storeInfo = payload.storeInfo || {
    name: 'GENQUANTAA MedPlus Pharmacy',
    dlNo: 'DL-2024/HYD/889201',
    gstin: '36AAACA1234F1Z5',
    address: 'Plot 44, Tech City, Hi-Tech City, Hyderabad, Telangana',
    phone: '+91 98765 43210',
  };

  const offlineRecord: OfflineInvoiceRecord = {
    offlineId: `off-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    invoiceNumber,
    invoiceDate: new Date().toISOString(),
    subtotal: payload.subtotal,
    totalDiscount: payload.totalDiscount,
    totalCGST: payload.totalCGST,
    totalSGST: payload.totalSGST,
    grandTotal: payload.grandTotal,
    payment: payload.payment,
    billingSession: payload.billingSession,
    storeInfo,
    syncStatus: 'PENDING_SYNC',
    isOfflineGenerated: true,
  };

  existingQueue.unshift(offlineRecord);
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(existingQueue));
  } catch (err) {
    console.error('[offlineStorage] LocalStorage write error', err);
  }

  // Return formatted FinalizedInvoice so cashiers can immediately print receipt
  const finalized: FinalizedInvoice = {
    _id: offlineRecord.offlineId,
    invoiceNumber,
    invoiceDate: offlineRecord.invoiceDate,
    storeInfo,
    billingSession: payload.billingSession,
    subtotal: payload.subtotal,
    totalDiscount: payload.totalDiscount,
    totalCGST: payload.totalCGST,
    totalSGST: payload.totalSGST,
    grandTotal: payload.grandTotal,
    payment: payload.payment,
    invoiceType: 'REGULAR',
    createdAt: offlineRecord.invoiceDate,
  } as any;

  return finalized;
};

// Auto-sync pending offline invoices to backend
export const syncOfflineInvoicesWithBackend = async (): Promise<{
  synced: number;
  failed: number;
  totalPending: number;
}> => {
  const queue = getOfflineInvoices();
  const pending = queue.filter((i) => i.syncStatus === 'PENDING_SYNC');

  if (pending.length === 0) {
    return { synced: 0, failed: 0, totalPending: 0 };
  }

  try {
    const res = await api.post('/invoices/offline-sync', { invoices: pending });
    if (res.data?.success) {
      const now = new Date().toISOString();
      const updatedQueue = queue.map((item) => {
        if (item.syncStatus === 'PENDING_SYNC') {
          return { ...item, syncStatus: 'SYNCED' as const, syncedAt: now };
        }
        return item;
      });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
      return { synced: pending.length, failed: 0, totalPending: 0 };
    }
  } catch (err) {
    console.warn('[offlineStorage] Sync attempt failed, will retry when network restores', err);
  }

  return { synced: 0, failed: pending.length, totalPending: pending.length };
};

// Clear already-synced archive records
export const clearSyncedOfflineArchive = (): void => {
  const queue = getOfflineInvoices();
  const remaining = queue.filter((i) => i.syncStatus === 'PENDING_SYNC');
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
};

// Cache inventory catalog locally for offline product search and scanning
export const cacheProductsLocally = (products: Product[]): void => {
  try {
    if (Array.isArray(products) && products.length > 0) {
      localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products.slice(0, 1000)));
    }
  } catch (e) {
    console.warn('[offlineStorage] Could not cache products locally:', e);
  }
};

// Get cached products when offline
export const getLocallyCachedProducts = (): Product[] => {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

// 1-Click Complete Pharmacy Database Backup Export
export const downloadPharmacyBackupJSON = async (currentUser?: any): Promise<void> => {
  try {
    // 1. Try downloading full MongoDB dump from backend
    const res = await api.get('/backup/export');
    if (res.data?.success && res.data?.backup) {
      const blob = new Blob([JSON.stringify(res.data.backup, null, 2)], { type: 'application/json' });
      triggerFileDownload(blob, `GENQUANTAA_PHARMACY_BACKUP_${new Date().toISOString().slice(0, 10)}.json`);
      localStorage.setItem(LAST_BACKUP_TIME_KEY, new Date().toISOString());
      return;
    }
  } catch (err) {
    console.warn('[offlineStorage] Backend export failed or offline, creating comprehensive browser-cache backup:', err);
  }

  // 2. Fallback offline local backup
  const offlineInvoices = getOfflineInvoices();
  const cachedProducts = getLocallyCachedProducts();
  const backup = {
    version: '2.0.0-OFFLINE',
    timestamp: new Date().toISOString(),
    storeMetadata: {
      storeName: currentUser?.pharmacyName || 'GENQUANTAA MedPlus Pharmacy',
      dlNo: currentUser?.licenseNo || 'DL-2024/HYD/889201',
      gstin: currentUser?.gstin || '36AAACA1234F1Z5',
      pharmacistName: currentUser?.pharmacistName || 'Store Pharmacist',
    },
    localCache: {
      offlineInvoices,
      cachedProductsCount: cachedProducts.length,
      cachedProducts,
    },
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  triggerFileDownload(blob, `GENQUANTAA_LOCAL_CACHE_BACKUP_${new Date().toISOString().slice(0, 10)}.json`);
  localStorage.setItem(LAST_BACKUP_TIME_KEY, new Date().toISOString());
};

const triggerFileDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

