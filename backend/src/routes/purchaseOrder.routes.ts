import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { getNextSequence } from '../models/Counter';
import { protect, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/purchase-orders — Create Purchase Order (Manager/Owner)
router.post('/', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      supplierId,
      supplierName,
      supplierGstin,
      supplierPhone,
      orderDate,
      expectedDeliveryDate,
      paymentTerms,
      items,
      totalAmount,
      schemeNotes,
      notes,
    } = req.body;

    if (!supplierName || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier name and items are required.' });
    }

    const seq = await getNextSequence('purchaseOrder');
    const poNumber = req.body.poNumber || `PO-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

    const [po] = await PurchaseOrder.create(
      [
        {
          poNumber,
          supplierId: supplierId || 'sup-custom',
          supplierName,
          supplierGstin: supplierGstin || '',
          supplierPhone: supplierPhone || '',
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date(Date.now() + 3 * 86400000),
          paymentTerms: paymentTerms || 'CREDIT_15_DAYS',
          status: req.body.status || 'DRAFT',
          items,
          totalAmount,
          schemeNotes: schemeNotes || '',
          notes: notes || '',
          createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
        },
      ]
    );

    res.status(201).json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
});

// GET /api/purchase-orders — List Purchase Orders
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, supplierId, search, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (supplierId && supplierId !== 'ALL') {
      query.supplierId = supplierId;
    }
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      PurchaseOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      PurchaseOrder.countDocuments(query),
    ]);

    res.json({ success: true, data: orders, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/purchase-orders/:id — Get Single Purchase Order
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let order: any = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      order = await PurchaseOrder.findById(req.params.id);
    }
    if (!order) {
      order = await PurchaseOrder.findOne({ poNumber: req.params.id });
    }
    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// PUT /api/purchase-orders/:id/status — Update PO Status (Manager/Owner)
router.put('/:id/status', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'PLACED', 'CONVERTED_TO_GRN', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    let order = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      order = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
    }
    if (!order) {
      order = await PurchaseOrder.findOneAndUpdate({ poNumber: req.params.id }, { status }, { new: true });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/purchase-orders/:id — Delete Purchase Order (Owner Only)
router.delete('/:id', protect, requireRole('OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let deleted = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      deleted = await PurchaseOrder.findByIdAndDelete(req.params.id);
    }
    if (!deleted) {
      deleted = await PurchaseOrder.findOneAndDelete({ poNumber: req.params.id });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Purchase order not found.' });
    }

    res.json({ success: true, message: 'Purchase order deleted.' });
  } catch (err) {
    next(err);
  }
});

export default router;
