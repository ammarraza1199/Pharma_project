import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { StockTransferIndent } from '../models/StockTransferIndent';
import { Product } from '../models/Product';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

export const BRANCH_NETWORK = [
  {
    branchId: 'br-001',
    branchName: 'Hi-Tech City Main Branch (Current)',
    location: 'Plot 44, Tech City, Hyderabad',
    distanceKm: 0.0,
    phone: '+91 98765 43210',
    manager: 'Ramesh Kumar',
    status: 'OPEN',
    isCurrent: true,
  },
  {
    branchId: 'br-002',
    branchName: 'Madhapur Express Store',
    location: 'Near Cyber Towers, Madhapur, Hyderabad',
    distanceKm: 1.8,
    phone: '+91 98765 43212',
    manager: 'Priya Sharma',
    status: 'OPEN',
    isCurrent: false,
  },
  {
    branchId: 'br-003',
    branchName: 'Jubilee Hills Branch',
    location: 'Road No 36, Jubilee Hills, Hyderabad',
    distanceKm: 3.2,
    phone: '+91 98765 43211',
    manager: 'Suresh Reddy',
    status: 'OPEN',
    isCurrent: false,
  },
  {
    branchId: 'br-004',
    branchName: 'Banjara Hills Superstore',
    location: 'Road No 12, Banjara Hills, Hyderabad',
    distanceKm: 5.4,
    phone: '+91 98765 43214',
    manager: 'Anand Verma',
    status: 'OPEN',
    isCurrent: false,
  },
  {
    branchId: 'br-005',
    branchName: 'Secunderabad Central Wholesale Godown',
    location: 'Phase 2, Wholesale Pharma Complex, Secunderabad',
    distanceKm: 11.5,
    phone: '+91 98765 43213',
    manager: 'Venkat Rao',
    status: 'OPEN',
    isCentralGodown: true,
    isCurrent: false,
  },
];

// GET /api/stock-transfers/branches
router.get('/branches', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: BRANCH_NETWORK });
  } catch (err) { next(err); }
});

// GET /api/stock-transfers/lookup
router.get('/lookup', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || '').trim();
    const query: any = { isActive: true };
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { saltComposition: { $regex: q, $options: 'i' } },
        { barcode: { $regex: q, $options: 'i' } },
      ];
    }

    const products = await Product.find(query).limit(15);

    const results = products.map((prod) => {
      const baseStock = prod.totalStock || 0;
      const price = prod.sellingPrice || prod.unitMRP || 100;
      const batches = prod.batches || [];
      const primaryBatch = batches.length > 0 ? batches[0] : null;

      // Realistic branch stock distribution simulation based on central store stock
      const branchStock = BRANCH_NETWORK.map((b) => {
        let stock = 0;
        let rack = 'Rack A-01';

        if (b.isCurrent) {
          stock = baseStock;
          rack = primaryBatch?.location || 'Rack Main-1';
        } else if (b.isCentralGodown) {
          stock = Math.max(80, baseStock * 3 + 120);
          rack = 'Bay Warehouse W-4';
        } else if (b.branchId === 'br-002') {
          stock = Math.max(0, Math.floor(baseStock * 0.75 + 12));
          rack = 'Rack B-14';
        } else if (b.branchId === 'br-003') {
          stock = Math.max(0, Math.floor(baseStock * 0.5 + 8));
          rack = 'Rack C-02';
        } else {
          stock = Math.max(0, Math.floor(baseStock * 0.9 + 15));
          rack = 'Rack D-08';
        }

        return {
          branchId: b.branchId,
          branchName: b.branchName,
          distanceKm: b.distanceKm,
          phone: b.phone,
          isCentralGodown: Boolean(b.isCentralGodown),
          isCurrent: Boolean(b.isCurrent),
          availableStock: stock,
          status: stock > 20 ? 'IN_STOCK' : stock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
          rackLocation: rack,
          batchNumber: primaryBatch?.batchNumber || `B-${prod.name.slice(0, 3).toUpperCase()}-99`,
          expiryDate: primaryBatch?.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          canBorrow: stock > 0 && !b.isCurrent,
        };
      });

      // Sort nearby branches with stock first
      const sortedBranches = [...branchStock].sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        if (a.availableStock > 0 && b.availableStock === 0) return -1;
        if (b.availableStock > 0 && a.availableStock === 0) return 1;
        return a.distanceKm - b.distanceKm;
      });

      const nearestAvailable = sortedBranches.find((b) => !b.isCurrent && b.availableStock > 0);

      return {
        productId: prod._id,
        name: prod.name,
        brand: prod.brand,
        saltComposition: prod.saltComposition,
        sellingPrice: price,
        mrp: prod.unitMRP,
        totalStock: prod.totalStock,
        scheduleCategory: prod.scheduleCategory,
        branches: sortedBranches,
        nearestAvailableBranch: nearestAvailable || null,
      };
    });

    res.json({ success: true, count: results.length, data: results });
  } catch (err) { next(err); }
});

// POST /api/stock-transfers/indents
router.get('/indents', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, limit = 50 } = req.query;
    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;

    let indents = await StockTransferIndent.find(filter).sort({ createdAt: -1 }).limit(Number(limit));

    // Provide default initial indents if empty so cashier sees live data immediately
    if (indents.length === 0) {
      const defaultIndents = [
        {
          indentNumber: 'STI-2026-0814-001',
          indentDate: new Date(),
          sourceBranch: BRANCH_NETWORK[1], // Madhapur Express
          destinationBranch: BRANCH_NETWORK[0], // Current Hi-Tech City
          priority: 'URGENT_CUSTOMER_WAITING',
          status: 'APPROVED_DISPATCHED',
          items: [
            {
              medicineName: 'Augmentin 625 Duo Tablet',
              saltComposition: 'Amoxicillin + Clavulanic Acid 625mg',
              batchNumber: 'AUG-8821',
              requestedQty: 10,
              dispatchedQty: 10,
              receivedQty: 0,
              unitPrice: 185.00,
              lineTotal: 1850.00,
            },
          ],
          totalItems: 1,
          totalAmount: 1850.00,
          dispatchedAt: new Date(Date.now() - 25 * 60 * 1000),
          dispatchedBy: 'Priya Sharma (Pharmacist)',
          driverDetails: {
            driverName: 'K. Naresh (FastTrack Runner)',
            contactNumber: '+91 98765 88910',
            vehicleNumber: 'TS 09 EZ 4410',
          },
          notes: 'Customer at counter waiting for prescription fulfillment.',
        },
        {
          indentNumber: 'STI-2026-0813-004',
          indentDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          sourceBranch: BRANCH_NETWORK[4], // Central Godown
          destinationBranch: BRANCH_NETWORK[0], // Current
          priority: 'ROUTINE_REPLENISHMENT',
          status: 'RECEIVED_CONFIRMED',
          items: [
            {
              medicineName: 'Dolo 650 Tablet',
              saltComposition: 'Paracetamol 650mg',
              batchNumber: 'DOLO-9912',
              requestedQty: 50,
              dispatchedQty: 50,
              receivedQty: 50,
              unitPrice: 28.50,
              lineTotal: 1425.00,
            },
            {
              medicineName: 'Telma 40mg Tablet',
              saltComposition: 'Telmisartan 40mg',
              batchNumber: 'TEL-4091',
              requestedQty: 30,
              dispatchedQty: 30,
              receivedQty: 30,
              unitPrice: 94.00,
              lineTotal: 2820.00,
            },
          ],
          totalItems: 2,
          totalAmount: 4245.00,
          dispatchedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
          receivedAt: new Date(Date.now() - 19 * 60 * 60 * 1000),
          dispatchedBy: 'Venkat Rao (Warehouse Head)',
          receivedBy: 'Ramesh Kumar (Pharmacist)',
          driverDetails: {
            driverName: 'Mohammed Rafi',
            contactNumber: '+91 98765 77123',
            vehicleNumber: 'TS 08 TC 2101',
          },
          notes: 'Monthly central godown stock replenishment.',
        },
      ];

      await StockTransferIndent.insertMany(defaultIndents);
      indents = await StockTransferIndent.find(filter).sort({ createdAt: -1 });
    }

    res.json({ success: true, count: indents.length, data: indents });
  } catch (err) { next(err); }
});

// POST /api/stock-transfers/indents (Create Inter-Store Indent)
router.post('/indents', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      sourceBranchId,
      destinationBranchId = 'br-001',
      priority = 'URGENT_CUSTOMER_WAITING',
      items = [],
      notes = '',
      driverName,
      driverPhone,
      vehicleNumber,
    } = req.body;

    const source = BRANCH_NETWORK.find((b) => b.branchId === sourceBranchId) || BRANCH_NETWORK[1];
    const destination = BRANCH_NETWORK.find((b) => b.branchId === destinationBranchId) || BRANCH_NETWORK[0];

    const count = await StockTransferIndent.countDocuments();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const indentNumber = `STI-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const formattedItems = items.map((it: any) => ({
      productId: it.productId,
      medicineName: it.medicineName,
      saltComposition: it.saltComposition || '',
      batchNumber: it.batchNumber || 'BATCH-INTRA',
      expiryDate: it.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      requestedQty: Number(it.requestedQty || it.quantity || 1),
      dispatchedQty: Number(it.dispatchedQty || it.requestedQty || it.quantity || 1),
      receivedQty: 0,
      unitPrice: Number(it.unitPrice || it.purchaseCostRate || 100),
      lineTotal: Number(((it.requestedQty || 1) * (it.unitPrice || 100)).toFixed(2)),
    }));

    const totalAmount = formattedItems.reduce((s: number, it: any) => s + it.lineTotal, 0);

    const newIndent = new StockTransferIndent({
      indentNumber,
      indentDate: new Date(),
      sourceBranch: source,
      destinationBranch: destination,
      priority,
      status: 'APPROVED_DISPATCHED',
      items: formattedItems,
      totalItems: formattedItems.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      dispatchedAt: new Date(),
      dispatchedBy: (req.user as any)?.name || req.user?.email || 'Store Cashier',
      driverDetails: {
        driverName: driverName || 'FastTrack Express Runner',
        contactNumber: driverPhone || '+91 98765 88910',
        vehicleNumber: vehicleNumber || 'TS 09 EZ 4410',
      },
      notes,
      createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
    });

    await newIndent.save();

    res.status(201).json({
      success: true,
      message: `Store Transfer Indent ${indentNumber} generated successfully.`,
      data: newIndent,
    });
  } catch (err) { next(err); }
});

// PUT /api/stock-transfers/indents/:id/status
router.put('/indents/:id/status', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, receivedNotes } = req.body;

    const indent = await StockTransferIndent.findById(id);
    if (!indent) {
      return res.status(404).json({ success: false, message: 'Transfer indent not found.' });
    }

    indent.status = status;
    if (status === 'RECEIVED_CONFIRMED') {
      indent.receivedAt = new Date();
      indent.receivedBy = (req.user as any)?.name || req.user?.email || 'Receiving Pharmacist';
      indent.items.forEach((it) => {
        it.receivedQty = it.dispatchedQty || it.requestedQty;
      });
    }

    if (receivedNotes) {
      indent.notes = `${indent.notes || ''} | Received Notes: ${receivedNotes}`.trim();
    }

    await indent.save();

    res.json({
      success: true,
      message: `Indent ${indent.indentNumber} status updated to ${status}.`,
      data: indent,
    });
  } catch (err) { next(err); }
});

export default router;

