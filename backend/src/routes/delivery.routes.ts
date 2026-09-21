import { Router, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { DeliveryOrder } from '../models/DeliveryOrder';
import { getNextSequence } from '../models/Counter';
import { protect, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/delivery-orders — Create Delivery Order
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      customerName,
      customerPhone,
      deliveryMode,
      deliveryAddress,
      pickupCounter,
      items,
      totalAmount,
      deliveryType,
      timeSlot,
      estimatedDeliveryTime,
      prescriptionRequired,
      notes,
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least 1 item.' });
    }

    const seq = await getNextSequence('deliveryOrder');
    const orderNumber = req.body.orderNumber || `ODR-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

    const now = new Date();
    const estTime = estimatedDeliveryTime
      ? new Date(estimatedDeliveryTime)
      : new Date(now.getTime() + (deliveryType === 'EXPRESS' ? 30 : 90) * 60000);

    const deadline = new Date(now.getTime() + 24 * 3600000); // 24-hour SLA

    const [order] = await DeliveryOrder.create([
      {
        orderNumber,
        customerName,
        customerPhone,
        deliveryMode: deliveryMode || 'HOME_DELIVERY',
        deliveryAddress: deliveryAddress || '',
        pickupCounter: pickupCounter || '',
        items,
        totalAmount: Number(totalAmount || 0),
        status: req.body.status || 'PENDING',
        deliveryType: deliveryType || 'STANDARD',
        timeSlot: timeSlot || '',
        estimatedDeliveryTime: estTime,
        prescriptionRequired: !!prescriptionRequired,
        prescriptionVerified: !!req.body.prescriptionVerified,
        verificationDeadline: req.body.verificationDeadline ? new Date(req.body.verificationDeadline) : deadline,
        isDiscreetPackaging: !!req.body.isDiscreetPackaging,
        notes: notes || '',
        createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      },
    ]);

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// GET /api/delivery-orders — List Orders
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, deliveryMode, search, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (deliveryMode && deliveryMode !== 'ALL') {
      query.deliveryMode = deliveryMode;
    }
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      DeliveryOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      DeliveryOrder.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/delivery-orders/:id — Single Order
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let order = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      order = await DeliveryOrder.findById(req.params.id);
    }
    if (!order) {
      order = await DeliveryOrder.findOne({ orderNumber: req.params.id });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Delivery order not found.' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// PUT /api/delivery-orders/:id/status — Update Stage/Status
router.put('/:id/status', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, actualDeliveryTime } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'DISPATCHED', 'ON_TIME', 'DELAYED', 'DELIVERED', 'CANCELLED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const update: any = { status };
    if (status === 'DELIVERED') {
      update.actualDeliveryTime = actualDeliveryTime ? new Date(actualDeliveryTime) : new Date();
    }
    if (req.body.invoiceNumber) {
      update.invoiceNumber = req.body.invoiceNumber;
    }

    let order = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      order = await DeliveryOrder.findByIdAndUpdate(req.params.id, update, { new: true });
    }
    if (!order) {
      order = await DeliveryOrder.findOneAndUpdate({ orderNumber: req.params.id }, update, { new: true });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Delivery order not found.' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// PUT /api/delivery-orders/:id/prescription — Toggle / Update Rx Verification
router.put('/:id/prescription', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let order = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      order = await DeliveryOrder.findById(req.params.id);
    }
    if (!order) {
      order = await DeliveryOrder.findOne({ orderNumber: req.params.id });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Delivery order not found.' });
    }

    const isVerified = typeof req.body.prescriptionVerified === 'boolean'
      ? req.body.prescriptionVerified
      : !order.prescriptionVerified;

    order.prescriptionVerified = isVerified;
    if (isVerified) {
      order.pharmacistName = req.user?.email || 'Duty Pharmacist';
    }
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/delivery-orders/:id — Delete Delivery Order (Manager/Owner)
router.delete('/:id', protect, requireRole('MANAGER', 'OWNER'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let deleted = null;
    if (mongoose.isValidObjectId(req.params.id)) {
      deleted = await DeliveryOrder.findByIdAndDelete(req.params.id);
    }
    if (!deleted) {
      deleted = await DeliveryOrder.findOneAndDelete({ orderNumber: req.params.id });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Delivery order not found.' });
    }

    res.json({ success: true, message: 'Delivery order deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
