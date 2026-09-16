import type { CartItem, Product, BatchInfo } from '../types/pos';

export interface CompanionItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  category: string;
  packSize: string;
  mrp: number;
  sellingPrice: number;
  grossMarginPercent: number;
  netProfitAmount: number;
  iconEmoji: string;
  clinicalReason: string;
  verbalScript: string;
  relatedKeywords: string[];
  badgeText: string;
  sampleBatch: BatchInfo;
}

export interface MarginMaximizerAnalysis {
  currentCartGrossProfit: number;
  currentCartTotal: number;
  currentCartAvgMarginPercent: number;
  recommendations: (CompanionItem & {
    projectedProfitBumpPercent: number;
    isTopPick: boolean;
  })[];
  maxPotentialProfitBumpPercent: number;
}

// ── CURATED HIGH-MARGIN COMPANION CATALOG (35% – 48% GROSS MARGIN) ──────────
export const HIGH_MARGIN_COMPANIONS: CompanionItem[] = [
  {
    id: 'comp-dettol-100',
    productId: '64f1a2b3c4d5e6f7a8b9c020',
    name: 'Dettol Antiseptic Liquid (100ml)',
    brand: 'Reckitt Benckiser',
    category: 'Antiseptic & Wound Care',
    packSize: '100ml / Bottle',
    mrp: 95.00,
    sellingPrice: 88.00,
    grossMarginPercent: 38.0,
    netProfitAmount: 33.44,
    iconEmoji: '🧴',
    clinicalReason: 'Essential antiseptic cleansing for cuts, skin infections, and surgical hygiene.',
    verbalScript: 'Always keep an antiseptic at home for wound cleaning and daily hygiene.',
    relatedKeywords: ['amoxicillin', 'augmentin', 'antibiotic', 'wound', 'pain', 'paracetamol', 'aspirin', 'skin', 'cut'],
    badgeText: '💎 38% Margin',
    sampleBatch: {
      batchNumber: 'DET-2025-X',
      expiryDate: '2027-10-31',
      stockQuantity: 85,
      location: 'Rack OTC-01',
      mrp: 95.00,
      purchaseRate: 54.56
    }
  },
  {
    id: 'comp-hansaplast-20',
    productId: '64f1a2b3c4d5e6f7a8b9c021',
    name: 'Hansaplast Medicated Adhesive Bandages (Pack of 20)',
    brand: 'Beiersdorf India',
    category: 'First Aid & Wound Care',
    packSize: '20 Strips / Box',
    mrp: 50.00,
    sellingPrice: 45.00,
    grossMarginPercent: 44.0,
    netProfitAmount: 19.80,
    iconEmoji: '🩹',
    clinicalReason: 'Antiseptic wound protection with silver ions preventing secondary bacterial infection.',
    verbalScript: 'Recommend keeping waterproof bandages ready for daily cuts and minor scrapes.',
    relatedKeywords: ['paracetamol', 'pain', 'wound', 'aspirin', 'bandage', 'dressing', 'cut', 'ointment', 'betadine'],
    badgeText: '💎 44% Margin',
    sampleBatch: {
      batchNumber: 'HAN-20-88',
      expiryDate: '2028-02-28',
      stockQuantity: 120,
      location: 'Rack OTC-02',
      mrp: 50.00,
      purchaseRate: 25.20
    }
  },
  {
    id: 'comp-cotton-100',
    productId: '64f1a2b3c4d5e6f7a8b9c022',
    name: 'Sterile Absorbent Surgical Cotton Roll (100g)',
    brand: 'Medicare Surgical Ltd',
    category: 'Surgical & Dressings',
    packSize: '100g / Roll',
    mrp: 55.00,
    sellingPrice: 48.00,
    grossMarginPercent: 46.0,
    netProfitAmount: 22.08,
    iconEmoji: '🩺',
    clinicalReason: 'High-absorbency hospital-grade bleached cotton for clean antiseptic swabbing.',
    verbalScript: 'Pure sterile cotton for safe medication application and antiseptic cleansing.',
    relatedKeywords: ['wound', 'dressing', 'dettol', 'antiseptic', 'paracetamol', 'ointment', 'cut'],
    badgeText: '💎 46% Margin',
    sampleBatch: {
      batchNumber: 'COT-100-25',
      expiryDate: '2028-06-30',
      stockQuantity: 90,
      location: 'Rack OTC-03',
      mrp: 55.00,
      purchaseRate: 25.92
    }
  },
  {
    id: 'comp-becosules-15',
    productId: '64f1a2b3c4d5e6f7a8b9c023',
    name: 'Becosules Z Multivitamin & Zinc Capsules (15 Caps)',
    brand: 'Pfizer Ltd',
    category: 'Nutritional Supplement',
    packSize: '15 Capsules / Strip',
    mrp: 125.00,
    sellingPrice: 110.00,
    grossMarginPercent: 36.0,
    netProfitAmount: 39.60,
    iconEmoji: '💊',
    clinicalReason: 'Restores essential B-complex vitamins & zinc depleted during antibiotic courses.',
    verbalScript: 'Antibiotics can deplete healthy gut vitamins; Becosules Z speeds full recovery.',
    relatedKeywords: ['amoxicillin', 'augmentin', 'antibiotic', 'azithromycin', 'infection', 'fever', 'cough'],
    badgeText: '💎 36% Margin',
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
    id: 'comp-electral-ors',
    productId: '64f1a2b3c4d5e6f7a8b9c024',
    name: 'Electral WHO-Formula ORS Sachet (21.8g)',
    brand: 'FDC Limited',
    category: 'Electrolyte & Hydration',
    packSize: '21.8g / Sachet',
    mrp: 24.00,
    sellingPrice: 22.00,
    grossMarginPercent: 35.0,
    netProfitAmount: 7.70,
    iconEmoji: '⚡',
    clinicalReason: 'WHO-recommended osmolarity electrolyte replenishment for fever dehydration and gastric loss.',
    verbalScript: 'Replenishes vital salts and maintains electrolyte balance during fever and weakness.',
    relatedKeywords: ['paracetamol', 'dolo', 'calpol', 'fever', 'crocin', 'pantoprazole', 'pan 40', 'vomit', 'diarrhea', 'dehydration'],
    badgeText: '💎 35% Margin',
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
    id: 'comp-thermometer-digi',
    productId: '64f1a2b3c4d5e6f7a8b9c025',
    name: 'Dr. Morepen Digital Clinical Rapid Thermometer',
    brand: 'Dr. Morepen Health',
    category: 'Medical Devices & Diagnostics',
    packSize: '1 Unit / Box',
    mrp: 175.00,
    sellingPrice: 150.00,
    grossMarginPercent: 42.0,
    netProfitAmount: 63.00,
    iconEmoji: '🌡️',
    clinicalReason: 'Fast 10-second fever temperature monitoring with beeper and mercury-free safety.',
    verbalScript: 'Accurate clinical thermometer at home avoids guesswork when monitoring fevers.',
    relatedKeywords: ['paracetamol', 'dolo', 'calpol', 'crocin', 'fever', 'flu', 'cough', 'cold', 'infection'],
    badgeText: '💎 42% Margin',
    sampleBatch: {
      batchNumber: 'THM-DG-01',
      expiryDate: '2030-12-31',
      stockQuantity: 45,
      location: 'Rack OTC-06',
      mrp: 175.00,
      purchaseRate: 87.00
    }
  },
  {
    id: 'comp-vicks-vaporub',
    productId: '64f1a2b3c4d5e6f7a8b9c026',
    name: 'Vicks Vaporub Medicated Balm (25ml)',
    brand: 'Procter & Gamble',
    category: 'Cold & Respiratory Relief',
    packSize: '25ml / Jar',
    mrp: 70.00,
    sellingPrice: 65.00,
    grossMarginPercent: 37.0,
    netProfitAmount: 24.05,
    iconEmoji: '🌿',
    clinicalReason: 'Multi-symptom eucalyptus and camphor relief for nasal congestion and chest tightness.',
    verbalScript: 'Fast topical decongestant balm for soothing nighttime sleep during cough and cold.',
    relatedKeywords: ['cough', 'cold', 'fever', 'paracetamol', 'dolo', 'chest', 'breathing', 'flu'],
    badgeText: '💎 37% Margin',
    sampleBatch: {
      batchNumber: 'VCK-25-25',
      expiryDate: '2027-12-31',
      stockQuantity: 95,
      location: 'Rack OTC-07',
      mrp: 70.00,
      purchaseRate: 40.95
    }
  },
  {
    id: 'comp-nasal-inhaler',
    productId: '64f1a2b3c4d5e6f7a8b9c027',
    name: 'Otrivin Breathe Clean / Menthol Inhaler Stick',
    brand: 'Haleon Healthcare',
    category: 'Pocket Inhalers',
    packSize: '1 Inhaler Stick',
    mrp: 60.00,
    sellingPrice: 55.00,
    grossMarginPercent: 48.0,
    netProfitAmount: 26.40,
    iconEmoji: '👃',
    clinicalReason: 'Instant pocket nasal airway clearing with natural camphor, menthol & pine oil.',
    verbalScript: 'Convenient pocket inhaler for instant nasal unblocking on-the-go.',
    relatedKeywords: ['cold', 'nasal', 'congestion', 'flu', 'headache', 'sinus', 'paracetamol'],
    badgeText: '💎 48% Margin',
    sampleBatch: {
      batchNumber: 'INH-48-2025',
      expiryDate: '2028-01-31',
      stockQuantity: 110,
      location: 'Rack OTC-08',
      mrp: 60.00,
      purchaseRate: 28.60
    }
  }
];

// Helper: Convert CompanionItem into full Product structure for Redux Cart
export const companionItemToProduct = (item: CompanionItem): Product => {
  return {
    _id: item.productId,
    name: item.name,
    brand: item.brand,
    saltComposition: item.category,
    barcode: `890${item.productId.slice(-10)}`,
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: item.mrp,
    sellingPrice: item.sellingPrice,
    grossMarginPercent: item.grossMarginPercent,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: item.sampleBatch.stockQuantity,
    batches: [item.sampleBatch],
    packSize: item.packSize,
    packType: 'Unit',
    medicineType: 'Topical',
    dosageForm: 'Companion'
  };
};

// ── MARGIN MAXIMIZER REASONING & PROFIT BUMP CALCULATION ─────────────────────
export const analyzeMarginMaximizer = (
  cartItems: CartItem[] = []
): MarginMaximizerAnalysis => {
  // 1. Compute current cart gross profit & average margin
  let currentCartGrossProfit = 0;
  let currentCartTotal = 0;

  cartItems.forEach((item) => {
    const itemTotal = item.lineTotal || ((item.unitPrice || item.product?.sellingPrice || 0) * item.quantity);
    currentCartTotal += itemTotal;
    const marginPct = item.product?.grossMarginPercent ?? 20.0;
    currentCartGrossProfit += itemTotal * (marginPct / 100);
  });

  const currentCartAvgMarginPercent = currentCartTotal > 0
    ? Number(((currentCartGrossProfit / currentCartTotal) * 100).toFixed(1))
    : 0;

  // 2. Extract active cart search strings for clinical affinity matching
  const cartKeywords: string[] = [];
  const activeProductIds = new Set<string>();

  cartItems.forEach((item) => {
    activeProductIds.add(item.productId);
    if (item.product?._id) activeProductIds.add(item.product._id);
    const textBlob = `${item.product?.name || ''} ${item.product?.saltComposition || ''} ${item.product?.brand || ''}`.toLowerCase();
    cartKeywords.push(textBlob);
  });

  const fullCartText = cartKeywords.join(' ');

  // 3. Filter out items already in the cart and score relevance
  const candidateCompanions = HIGH_MARGIN_COMPANIONS.filter(
    (comp) => !activeProductIds.has(comp.productId)
  );

  const scoredCompanions = candidateCompanions.map((comp) => {
    let score = 0;
    let matchedKeywords: string[] = [];

    comp.relatedKeywords.forEach((kw) => {
      if (fullCartText.includes(kw)) {
        score += 2;
        matchedKeywords.push(kw);
      }
    });

    // Score booster for higher gross margin
    score += comp.grossMarginPercent / 10;

    // Projected Profit Bump %
    // If cart is empty, bump is 100%. Otherwise, (companionProfit / currentCartProfit) * 100
    const projectedProfitBumpPercent = currentCartGrossProfit > 0
      ? Number(((comp.netProfitAmount / currentCartGrossProfit) * 100).toFixed(1))
      : 100;

    return {
      ...comp,
      score,
      projectedProfitBumpPercent,
      isTopPick: score >= 4 || matchedKeywords.length > 0
    };
  });

  // Sort by score descending (affinity + margin)
  scoredCompanions.sort((a, b) => b.score - a.score);

  const recommendations = scoredCompanions.slice(0, 6);
  const maxPotentialProfitBumpPercent = recommendations.length > 0
    ? recommendations[0].projectedProfitBumpPercent
    : 0;

  return {
    currentCartGrossProfit: Number(currentCartGrossProfit.toFixed(2)),
    currentCartTotal: Number(currentCartTotal.toFixed(2)),
    currentCartAvgMarginPercent,
    recommendations,
    maxPotentialProfitBumpPercent
  };
};
