import { Router, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// Pre-configured Clinical Care Bundles
const CLINICAL_BUNDLES = [
  {
    id: 'bundle-amr-stewardship',
    title: 'AMR Stewardship & Gut Recovery Bundle',
    description: 'Antibiotic therapy accompanied with high-potency probiotics, zinc, and B-complex to prevent dysbiosis and antibiotic-associated diarrhea.',
    recommendedForCondition: 'Acute Bacterial Infections (Augmentin, Azithral, Cefixime regimens)',
    discountPercent: 15,
    items: [
      { productName: 'Augmentin 625 Duo Tablet', dosage: '1 Tab Twice Daily', qty: 10, category: 'Primary Antibiotic' },
      { productName: 'Sporlac DS Probiotic Capsule', dosage: '1 Cap Daily 2hr After Antibiotic', qty: 10, category: 'Gut Flora Restorer' },
      { productName: 'Becosules Z Multivitamin', dosage: '1 Cap Daily After Lunch', qty: 15, category: 'Nutritional Support' },
    ],
  },
  {
    id: 'bundle-diabetes-essentials',
    title: 'Diabetes Daily Care & Neuropathy Defense Pack',
    description: 'Anti-diabetic oral therapy combined with Alpha Lipoic Acid & Methylcobalamin to protect peripheral nerve fibers.',
    recommendedForCondition: 'Type 2 Diabetes Mellitus with borderline neuropathy risk',
    discountPercent: 14,
    items: [
      { productName: 'Glycomet-GP 1 Tablet', dosage: '1 Tab Morning Before Food', qty: 30, category: 'Glycemic Regulation' },
      { productName: 'Neurobion Forte Tablet', dosage: '1 Tab Night After Dinner', qty: 30, category: 'Nerve Health' },
      { productName: 'Accu-Chek Active Test Strips (10s)', dosage: 'As needed for blood glucose check', qty: 1, category: 'Monitoring' },
    ],
  },
  {
    id: 'bundle-cardiac-vitality',
    title: 'CardioVascular Vitality & Lipid Control Pack',
    description: 'Antihypertensive + Statin combo with Coenzyme Q10 to counter statin-induced muscle fatigue.',
    recommendedForCondition: 'Essential Hypertension & Hypercholesterolemia',
    discountPercent: 16,
    items: [
      { productName: 'Telma 40mg Tablet', dosage: '1 Tab Daily Morning', qty: 30, category: 'Blood Pressure Control' },
      { productName: 'Atorva 10mg Tablet', dosage: '1 Tab Daily Night', qty: 30, category: 'Cholesterol Regulation' },
      { productName: 'CoQ10 100mg Softgel Capsule', dosage: '1 Cap Daily After Breakfast', qty: 30, category: 'Mitochondrial Energy' },
    ],
  },
];

// Promotional Clearance Gifts
const CLEARANCE_GIFTS = [
  { id: 'gift-sanitizer', name: 'Dettol Instant Hand Sanitizer (50ml)', category: 'Hygiene & Sanitization', value: 30, icon: '🧴', stock: 48 },
  { id: 'gift-vitaminc', name: 'Limcee Vitamin C 500mg Chewable (Strip of 5)', category: 'Immunity & Wellness', value: 25, icon: '🍊', stock: 60 },
  { id: 'gift-bandages', name: 'Hansaplast Medicated Bandages (Pack of 5)', category: 'First-Aid & Wound Care', value: 20, icon: '🩹', stock: 120 },
  { id: 'gift-ors', name: 'Electral ORS Energy Sachet (21.8g)', category: 'Hydration & Electrolytes', value: 22, icon: '⚡', stock: 85 },
  { id: 'gift-coughdrops', name: 'Dabur Honitus Herbal Cough Drops (Pack of 10)', category: 'Throat Care & Relief', value: 25, icon: '🌿', stock: 40 },
];

// GET /api/clinical-bundles — List all clinical bundles
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: CLINICAL_BUNDLES });
  } catch (err) {
    next(err);
  }
});

// GET /api/clinical-bundles/clearance/list — Near-expiry clearance items & promotional gifts
router.get('/clearance/list', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const products = await Product.find({ isActive: true });
    const now = new Date();
    const clearanceBatches: any[] = [];

    products.forEach((p) => {
      p.batches.forEach((b) => {
        const exp = new Date(b.expiryDate);
        const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days > 0 && days <= 60 && b.stockQuantity > 0) {
          clearanceBatches.push({
            productId: p._id,
            productName: p.name,
            brand: p.brand,
            batchNumber: b.batchNumber,
            expiryDate: b.expiryDate,
            daysLeft: days,
            stockQuantity: b.stockQuantity,
            mrp: b.mrp || p.unitMRP,
            sellingPrice: p.sellingPrice,
            recommendedClearanceDiscount: days <= 30 ? 40 : 25,
          });
        }
      });
    });

    res.json({
      success: true,
      data: {
        clearanceBatches,
        promotionalGifts: CLEARANCE_GIFTS,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/clinical-bundles/products/:id/rack-location
router.get('/products/:id/rack-location', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const loc = product.batches[0]?.location || 'Rack A-01';
    res.json({
      success: true,
      data: {
        productId: product._id,
        productName: product.name,
        location: loc,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/clinical-bundles/products/:id/rack-location
router.put('/products/:id/rack-location', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { location } = req.body;
    if (!location) return res.status(400).json({ success: false, message: 'location string is required.' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    product.batches.forEach((b) => {
      b.location = location;
    });
    await product.save();

    res.json({ success: true, message: 'Rack location updated.', data: { location } });
  } catch (err) {
    next(err);
  }
});

export default router;
