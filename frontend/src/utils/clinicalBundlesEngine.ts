import type { CartItem, Product, BatchInfo } from '../types/pos';

export interface BundleItem {
  productId: string;
  name: string;
  brand: string;
  packSize: string;
  individualPrice: number;
  bundlePrice: number;
  iconEmoji: string;
  roleInKit: string;
  sampleBatch: BatchInfo;
}

export interface ClinicalBundle {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  category: string;
  iconEmoji: string;
  badgeText: string;
  clinicalRationale: string;
  triggerKeywords: string[];
  items: BundleItem[];
  individualTotal: number;
  bundlePrice: number;
  totalSavings: number;
  savingsPercent: number;
}

export interface BundleDetectionResult {
  bundle: ClinicalBundle;
  matchScore: number;
  isHighAffinity: boolean;
  matchedCartItemNames: string[];
  alreadyInCartItemIds: string[];
  missingItems: BundleItem[];
  allIncluded: boolean;
  isComplete: boolean;
  completionPrice: number;
  completionSavings: number;
}

// ── PRE-CONFIGURED CLINICAL CARE KITS ─────────────────────────────────────────
export const CLINICAL_CARE_BUNDLES: ClinicalBundle[] = [
  {
    id: 'bundle-fever-flu',
    title: 'Fever & Flu Complete Care Kit',
    shortTitle: 'Fever & Flu Kit',
    subtitle: 'Triple Action: Antipyretic + Electrolyte Hydration + Temperature Sensor',
    category: 'Fever & Viral Care',
    iconEmoji: '🌡️',
    badgeText: 'Complete Fever Recovery',
    clinicalRationale: 'Paracetamol rapidly reduces elevated core body temperature while WHO-formula ORS restores critical lost fluid-electrolytes to prevent weakness. Clinical digital thermometer avoids dosage guesswork.',
    triggerKeywords: ['paracetamol', 'dolo', 'calpol', 'crocin', 'fever', 'flu', 'cough', 'cold', 'infection'],
    items: [
      {
        productId: '64f1a2b3c4d5e6f7a8b9c003',
        name: 'Dolo 650 Tablet (15 Tablets)',
        brand: 'Micro Labs Ltd',
        packSize: '15 Tablets / Strip',
        individualPrice: 31.00,
        bundlePrice: 26.00,
        iconEmoji: '💊',
        roleInKit: 'Rapid antipyretic & body pain relief',
        sampleBatch: {
          batchNumber: 'DOL-650-88',
          expiryDate: '2027-03-31',
          stockQuantity: 350,
          location: 'Rack B-12',
          mrp: 34.00,
          purchaseRate: 20.00
        }
      },
      {
        productId: '64f1a2b3c4d5e6f7a8b9c024',
        name: 'Electral WHO-Formula ORS (21.8g)',
        brand: 'FDC Limited',
        packSize: '21.8g / Sachet',
        individualPrice: 22.00,
        bundlePrice: 19.00,
        iconEmoji: '⚡',
        roleInKit: 'Essential electrolyte & fluid rehydration',
        sampleBatch: {
          batchNumber: 'ELC-21-99',
          expiryDate: '2027-11-30',
          stockQuantity: 250,
          location: 'Rack OTC-05',
          mrp: 24.00,
          purchaseRate: 14.30
        }
      },
      {
        productId: '64f1a2b3c4d5e6f7a8b9c025',
        name: 'Dr. Morepen Digital Rapid Thermometer',
        brand: 'Dr. Morepen Health',
        packSize: '1 Unit / Box',
        individualPrice: 150.00,
        bundlePrice: 130.00,
        iconEmoji: '🌡️',
        roleInKit: 'Accurate 10-second clinical temperature check',
        sampleBatch: {
          batchNumber: 'THM-DG-01',
          expiryDate: '2030-12-31',
          stockQuantity: 45,
          location: 'Rack OTC-06',
          mrp: 175.00,
          purchaseRate: 87.00
        }
      }
    ],
    individualTotal: 203.00,
    bundlePrice: 175.00,
    totalSavings: 28.00,
    savingsPercent: 14
  },
  {
    id: 'bundle-wound-care',
    title: 'Advanced Clinical Wound Care Kit',
    shortTitle: 'Wound Care Kit',
    subtitle: 'Aseptic Dressing: Broad-Spectrum Iodine + Sterile Gauze + Micropore Tape',
    category: 'First Aid & Trauma Care',
    iconEmoji: '🩹',
    badgeText: 'Complete Aseptic First Aid',
    clinicalRationale: 'Broad-spectrum 5% povidone iodine neutralizes bacteria and fungi without stinging. Non-adherent sterile gauze protects tissue, anchored securely with hypoallergenic breathable surgical tape.',
    triggerKeywords: ['wound', 'bandage', 'cotton', 'dettol', 'antiseptic', 'cut', 'burn', 'injury', 'dressing', 'pain'],
    items: [
      {
        productId: '64f1a2b3c4d5e6f7a8b9c030',
        name: 'Betadine 5% Antiseptic Ointment (20g)',
        brand: 'Win-Medicare',
        packSize: '20g / Tube',
        individualPrice: 68.00,
        bundlePrice: 57.00,
        iconEmoji: '🧴',
        roleInKit: 'Broad-spectrum microbicidal wound disinfection',
        sampleBatch: {
          batchNumber: 'BET-5-2025',
          expiryDate: '2027-09-30',
          stockQuantity: 110,
          location: 'Rack OTC-07',
          mrp: 75.00,
          purchaseRate: 42.00
        }
      },
      {
        productId: '64f1a2b3c4d5e6f7a8b9c031',
        name: 'Sterile Surgical Gauze Swab Pads (10s)',
        brand: 'Medicare Surgical Ltd',
        packSize: '10 Pads / Pack',
        individualPrice: 35.00,
        bundlePrice: 30.00,
        iconEmoji: '🩺',
        roleInKit: 'High-absorbency sterile wound cushion',
        sampleBatch: {
          batchNumber: 'GZ-10-88',
          expiryDate: '2028-05-31',
          stockQuantity: 140,
          location: 'Rack OTC-08',
          mrp: 40.00,
          purchaseRate: 18.00
        }
      },
      {
        productId: '64f1a2b3c4d5e6f7a8b9c032',
        name: '3M Micropore Surgical Paper Tape (1 inch)',
        brand: '3M Healthcare',
        packSize: '1 Roll (1 in x 9.1m)',
        individualPrice: 45.00,
        bundlePrice: 38.00,
        iconEmoji: '🩹',
        roleInKit: 'Hypoallergenic breathable skin-safe tape',
        sampleBatch: {
          batchNumber: 'MIC-3M-25',
          expiryDate: '2029-01-31',
          stockQuantity: 95,
          location: 'Rack OTC-09',
          mrp: 50.00,
          purchaseRate: 24.00
        }
      }
    ],
    individualTotal: 148.00,
    bundlePrice: 125.00,
    totalSavings: 23.00,
    savingsPercent: 16
  },
  {
    id: 'bundle-gastric-comfort',
    title: 'Gastric Comfort & Acid Recovery Bundle',
    shortTitle: 'Gastric Comfort Kit',
    subtitle: 'Triple Action: PPI Acid Suppression + Barrier Coating Gel + Digestive Enzymes',
    category: 'Gastrointestinal Relief',
    iconEmoji: '🛡️',
    badgeText: 'Complete Digestive Protection',
    clinicalRationale: 'Pantoprazole suppresses gastric acid secretion at the proton pump level; Gelusil coats mucosal walls for instant reflux relief; digestive enzymes assist pancreatic nutrient breakdown.',
    triggerKeywords: ['pantoprazole', 'pan 40', 'antacid', 'gastric', 'reflux', 'heartburn', 'acidity', 'gerd', 'stomach', 'ulcer'],
    items: [
      {
        productId: '64f1a2b3c4d5e6f7a8b9c011',
        name: 'Pan 40 Gastro Tablet (15 Tablets)',
        brand: 'Alkem Laboratories',
        packSize: '15 Tablets / Strip',
        individualPrice: 140.00,
        bundlePrice: 118.00,
        iconEmoji: '💊',
        roleInKit: 'Long-lasting proton-pump acid suppression',
        sampleBatch: {
          batchNumber: 'PAN-40-SAFE',
          expiryDate: '2027-08-31',
          stockQuantity: 80,
          location: 'Rack E-01',
          mrp: 155.00,
          purchaseRate: 95.00
        }
      },
      {
        productId: '64f1a2b3c4d5e6f7a8b9c033',
        name: 'Gelusil MPS Antacid Mint Oral Gel (170ml)',
        brand: 'Pfizer Ltd',
        packSize: '170ml / Bottle',
        individualPrice: 98.00,
        bundlePrice: 83.00,
        iconEmoji: '🌿',
        roleInKit: 'Instant heartburn cooling & mucosal acid barrier',
        sampleBatch: {
          batchNumber: 'GEL-170-25',
          expiryDate: '2027-10-31',
          stockQuantity: 90,
          location: 'Rack OTC-10',
          mrp: 110.00,
          purchaseRate: 58.00
        }
      },
      {
        productId: '64f1a2b3c4d5e6f7a8b9c034',
        name: 'Aristozyme Liquid Digestive Enzyme Syrup (200ml)',
        brand: 'Aristo Pharmaceuticals',
        packSize: '200ml / Bottle',
        individualPrice: 115.00,
        bundlePrice: 98.00,
        iconEmoji: '🧪',
        roleInKit: 'Aids digestive breakdown & relieves bloating',
        sampleBatch: {
          batchNumber: 'ARZ-200-25',
          expiryDate: '2027-12-31',
          stockQuantity: 75,
          location: 'Rack OTC-11',
          mrp: 130.00,
          purchaseRate: 68.00
        }
      }
    ],
    individualTotal: 353.00,
    bundlePrice: 299.00,
    totalSavings: 54.00,
    savingsPercent: 15
  },
  {
    id: 'bundle-post-antibiotic',
    title: 'Post-Antibiotic Gut & Immunity Recovery Kit',
    shortTitle: 'Post-Antibiotic Kit',
    subtitle: 'Restorative Therapy: B-Complex Vitamin Replenishment + Electrolytes + Mild Relief',
    category: 'Post-Infection Recovery',
    iconEmoji: '✨',
    badgeText: 'Therapy Course Companion',
    clinicalRationale: 'Strong broad-spectrum antibiotic courses disrupt intestinal flora and deplete vital B-vitamins. High-potency Becosules Z with zinc and WHO electrolytes restore mucosal health and stamina.',
    triggerKeywords: ['amoxicillin', 'augmentin', 'azithromycin', 'antibiotic', 'infection', 'bacterial'],
    items: [
      {
        productId: '64f1a2b3c4d5e6f7a8b9c023',
        name: 'Becosules Z Multivitamin Capsules (15s)',
        brand: 'Pfizer Ltd',
        packSize: '15 Capsules / Strip',
        individualPrice: 110.00,
        bundlePrice: 92.00,
        iconEmoji: '💊',
        roleInKit: 'Replenishes gut vitamins & zinc depleted by antibiotics',
        sampleBatch: {
          batchNumber: 'BCZ-15-2025',
          expiryDate: '2027-08-31',
          stockQuantity: 140,
          location: 'Rack OTC-04',
          mrp: 125.00,
          purchaseRate: 70.40
        }
      },
      {
        productId: '64f1a2b3c4d5e6f7a8b9c024',
        name: 'Electral WHO-Formula ORS (21.8g)',
        brand: 'FDC Limited',
        packSize: '21.8g / Sachet',
        individualPrice: 22.00,
        bundlePrice: 19.00,
        iconEmoji: '⚡',
        roleInKit: 'Maintains optimum hydration & cellular balance',
        sampleBatch: {
          batchNumber: 'ELC-21-99',
          expiryDate: '2027-11-30',
          stockQuantity: 250,
          location: 'Rack OTC-05',
          mrp: 24.00,
          purchaseRate: 14.30
        }
      },
      {
        productId: '64f1a2b3c4d5e6f7a8b9c003',
        name: 'Dolo 650 Tablet (15 Tablets)',
        brand: 'Micro Labs Ltd',
        packSize: '15 Tablets / Strip',
        individualPrice: 31.00,
        bundlePrice: 28.00,
        iconEmoji: '💊',
        roleInKit: 'Mild pain and secondary headache management',
        sampleBatch: {
          batchNumber: 'DOL-650-88',
          expiryDate: '2027-03-31',
          stockQuantity: 350,
          location: 'Rack B-12',
          mrp: 34.00,
          purchaseRate: 20.00
        }
      }
    ],
    individualTotal: 163.00,
    bundlePrice: 139.00,
    totalSavings: 24.00,
    savingsPercent: 15
  }
];

// ── BUNDLE DETECTION & AFFINITY MATCHING ──────────────────────────────────────
export const detectRelevantClinicalBundles = (
  cartItems: CartItem[] = []
): BundleDetectionResult[] => {
  // Aggregate text from active cart
  const cartKeywords: string[] = [];
  const cartProductIds = new Set<string>();

  cartItems.forEach((item) => {
    cartProductIds.add(item.productId);
    if (item.product?._id) cartProductIds.add(item.product._id);
    const text = `${item.product?.name || ''} ${item.product?.saltComposition || ''} ${item.product?.brand || ''}`.toLowerCase();
    cartKeywords.push(text);
  });

  const cartTextBlob = cartKeywords.join(' ');

  const results: BundleDetectionResult[] = CLINICAL_CARE_BUNDLES.map((bundle) => {
    let matchScore = 0;
    const matchedCartItemNames: string[] = [];
    const alreadyInCartItemIds: string[] = [];
    const missingItems: BundleItem[] = [];

    // Keyword affinity check
    bundle.triggerKeywords.forEach((kw) => {
      if (cartTextBlob.includes(kw)) {
        matchScore += 3;
      }
    });

    // Item presence check
    bundle.items.forEach((kitItem) => {
      if (cartProductIds.has(kitItem.productId)) {
        alreadyInCartItemIds.push(kitItem.productId);
        matchScore += 1;
      } else {
        missingItems.push(kitItem);
      }
    });

    // Record matched item names for display
    cartItems.forEach((ci) => {
      const pName = ci.product?.name || '';
      bundle.triggerKeywords.forEach((kw) => {
        if (pName.toLowerCase().includes(kw) && !matchedCartItemNames.includes(pName)) {
          matchedCartItemNames.push(pName);
        }
      });
    });

    const allIncluded = missingItems.length === 0;
    const completionIndividual = missingItems.reduce((s, i) => s + i.individualPrice, 0);
    const completionPrice = missingItems.reduce((s, i) => s + i.bundlePrice, 0);
    const completionSavings = completionIndividual - completionPrice;

    return {
      bundle,
      matchScore,
      isHighAffinity: matchScore >= 3,
      matchedCartItemNames,
      alreadyInCartItemIds,
      missingItems,
      allIncluded,
      isComplete: allIncluded,
      completionPrice: Number(completionPrice.toFixed(2)),
      completionSavings: Number(completionSavings.toFixed(2))
    };
  });

  // Sort by match score descending, then by savings percentage
  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return b.bundle.totalSavings - a.bundle.totalSavings;
  });

  return results;
};

// Helper to convert a BundleItem into a Product instance for Redux cart addition
export const bundleItemToProduct = (item: BundleItem, bundleTitle: string): Product => {
  return {
    _id: item.productId,
    name: item.name,
    brand: item.brand,
    saltComposition: `Clinical Kit: ${bundleTitle}`,
    barcode: `890${item.productId.slice(-10)}`,
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: item.individualPrice,
    sellingPrice: item.bundlePrice,
    grossMarginPercent: 32.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: item.sampleBatch.stockQuantity,
    batches: [item.sampleBatch],
    packSize: item.packSize,
    packType: 'Kit Component',
    medicineType: 'Oral',
    dosageForm: 'Kit'
  };
};
