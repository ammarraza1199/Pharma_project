import { Router, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/products
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, schedule, stockStatus, page = 1, limit = 50 } = req.query;
    const query: any = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { saltComposition: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { hsnCode: { $regex: search, $options: 'i' } },
      ];
    }
    if (schedule && schedule !== 'ALL') query.scheduleCategory = schedule;
    if (stockStatus && stockStatus !== 'ALL') query.stockStatus = stockStatus;

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({ success: true, data: products, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// GET /api/products/expiry/alerts
router.get('/expiry/alerts', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const products = await Product.find({ isActive: true, 'batches.0': { $exists: true } });
    const rows: any[] = [];

    products.forEach((p) => {
      p.batches.forEach((b) => {
        const diffMs = new Date(b.expiryDate).getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        rows.push({
          productId: p._id, productName: p.name, brand: p.brand,
          batchNumber: b.batchNumber, expiryDate: b.expiryDate,
          stockQuantity: b.stockQuantity, location: b.location,
          daysLeft, isExpired: daysLeft <= 0,
          sellingPrice: p.sellingPrice,
          estimatedLoss: b.stockQuantity * p.sellingPrice,
        });
      });
    });

    const filter = (req.query.filter as string) || 'NEAR_30';
    let filtered = rows;
    if (filter === 'EXPIRED') filtered = rows.filter((r) => r.isExpired);
    else if (filter === 'NEAR_30') filtered = rows.filter((r) => !r.isExpired && r.daysLeft <= 30);
    else if (filter === 'NEAR_60') filtered = rows.filter((r) => !r.isExpired && r.daysLeft > 30 && r.daysLeft <= 60);
    else if (filter === 'NEAR_90') filtered = rows.filter((r) => !r.isExpired && r.daysLeft > 60 && r.daysLeft <= 90);

    res.json({ success: true, data: filtered, count: filtered.length });
  } catch (err) { next(err); }
});

// GET /api/products/stock/low
router.get('/stock/low', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({
      isActive: true,
      stockStatus: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] },
    }).sort({ totalStock: 1 });
    res.json({ success: true, data: products, count: products.length });
  } catch (err) { next(err); }
});

// GET /api/products/barcode/:barcode
router.get('/barcode/:barcode', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode, isActive: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found for this barcode.' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// POST /api/products
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
});

// PUT /api/products/:id
router.put('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// DELETE /api/products/:id (soft delete)
router.delete('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deactivated.' });
  } catch (err) { next(err); }
});

// POST /api/products/:id/batch
router.post('/:id/batch', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    product.batches.push(req.body);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
});

// PUT /api/products/:id/batch/:batchNumber
router.put('/:id/batch/:batchNumber', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const batch = product.batches.find((b) => b.batchNumber === req.params.batchNumber);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    Object.assign(batch, req.body);
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

export default router;
