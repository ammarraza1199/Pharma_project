import { Router, Response, NextFunction } from 'express';
import { Invoice } from '../models/Invoice';
import { Product } from '../models/Product';
import { Patient } from '../models/Patient';
import { GRNEntry } from '../models/GRNEntry';
import { Supplier } from '../models/Supplier';
import { CashRegister } from '../models/CashRegister';
import { StockTransferIndent } from '../models/StockTransferIndent';
import { StoreSettings } from '../models/StoreSettings';
import { protect, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/backup/export — 1-Click Full System Backup
router.get('/export', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await StoreSettings.findOne();

    const [
      invoices,
      products,
      patients,
      grnList,
      suppliers,
      registers,
      indents,
    ] = await Promise.all([
      Invoice.find().sort({ invoiceDate: -1 }),
      Product.find(),
      Patient.find(),
      GRNEntry.find(),
      Supplier.find(),
      CashRegister.find(),
      StockTransferIndent.find(),
    ]);

    const backupPayload = {
      version: '2.0.0',
      system: 'Genquantaa MedPlus Pharmacy POS',
      timestamp: new Date().toISOString(),
      storeMetadata: {
        storeName: settings?.storeName || 'GENQUANTAA MedPlus Pharmacy',
        dlNo: settings?.dlNo || '',
        gstin: settings?.gstin || '',
        exportedBy: (req.user as any)?.name || req.user?.email || 'Store Manager',
      },
      counts: {
        invoices: invoices.length,
        products: products.length,
        patients: patients.length,
        grn: grnList.length,
        suppliers: suppliers.length,
        registers: registers.length,
        stockTransfers: indents.length,
      },
      data: {
        invoices,
        products,
        patients,
        grnList,
        suppliers,
        registers,
        stockTransfers: indents,
      },
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=GENQUANTAA_PHARMACY_BACKUP_${dateStr}.json`);
    res.json({
      success: true,
      message: 'Full pharmacy database exported successfully.',
      backup: backupPayload,
    });
  } catch (err) { next(err); }
});

// GET /api/backup/status
router.get('/status', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [invCount, prodCount, patCount, grnCount] = await Promise.all([
      Invoice.countDocuments(),
      Product.countDocuments(),
      Patient.countDocuments(),
      GRNEntry.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        serverTime: new Date().toISOString(),
        isDatabaseConnected: true,
        recordCounts: {
          invoices: invCount,
          products: prodCount,
          patients: patCount,
          grn: grnCount,
        },
      },
    });
  } catch (err) { next(err); }
});

// POST /api/backup/restore
router.post('/restore', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { backup } = req.body;
    if (!backup || !backup.data) {
      return res.status(400).json({ success: false, message: 'Invalid backup file format.' });
    }

    let restoredInvoices = 0;
    if (Array.isArray(backup.data.invoices)) {
      for (const inv of backup.data.invoices) {
        const exists = await Invoice.findOne({ invoiceNumber: inv.invoiceNumber });
        if (!exists) {
          await Invoice.create(inv);
          restoredInvoices++;
        }
      }
    }

    res.json({
      success: true,
      message: `Database restored successfully. Restored ${restoredInvoices} missing invoices.`,
    });
  } catch (err) { next(err); }
});

export default router;

