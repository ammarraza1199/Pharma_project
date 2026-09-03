import type { Product, DrugInteraction } from '../types/pos';

// Mock MongoDB standard Document format with _id (24 hex characters)
export const MOCK_PRODUCTS: Product[] = [
  {
    _id: '64f1a2b3c4d5e6f7a8b9c001',
    name: 'Augmentin 625 Duo Tablet',
    brand: 'GlaxoSmithKline',
    saltComposition: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    barcode: '8901234567890',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 201.50,
    sellingPrice: 185.00,
    grossMarginPercent: 24.5,
    scheduleCategory: 'SCHEDULE_H',
    stockStatus: 'IN_STOCK',
    totalStock: 140,
    batches: [
      {
        batchNumber: 'AUG-2025-01',
        expiryDate: '2026-11-30', // Valid
        stockQuantity: 100,
        location: 'Rack A-04',
        mrp: 201.50
      },
      {
        batchNumber: 'AUG-2025-02',
        expiryDate: '2026-08-30', // Near expiry (<30 days)
        stockQuantity: 40,
        location: 'Rack A-04',
        mrp: 201.50
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c002',
    name: 'Crocin 650 Advance Tablet',
    brand: 'Haleon Healthcare',
    saltComposition: 'Paracetamol 650mg',
    barcode: '8901234567891',
    hsnCode: '30049060',
    gstRate: 12,
    unitMRP: 32.00,
    sellingPrice: 30.00,
    grossMarginPercent: 18.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'OUT_OF_STOCK',
    totalStock: 0,
    batches: []
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c003',
    name: 'Dolo 650 Tablet',
    brand: 'Micro Labs Ltd',
    saltComposition: 'Paracetamol 650mg',
    barcode: '8901234567892',
    hsnCode: '30049060',
    gstRate: 12,
    unitMRP: 34.00,
    sellingPrice: 31.00,
    grossMarginPercent: 28.5, // High margin substitution
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 350,
    batches: [
      {
        batchNumber: 'DOL-650-88',
        expiryDate: '2027-03-31',
        stockQuantity: 350,
        location: 'Rack B-12',
        mrp: 34.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c004',
    name: 'Calpol 650mg Tablet',
    brand: 'GlaxoSmithKline',
    saltComposition: 'Paracetamol 650mg',
    barcode: '8901234567893',
    hsnCode: '30049060',
    gstRate: 12,
    unitMRP: 31.00,
    sellingPrice: 29.00,
    grossMarginPercent: 22.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 210,
    batches: [
      {
        batchNumber: 'CAL-NEAR-EXP',
        expiryDate: '2026-09-02', // NEAR EXPIRY (< 30 days)
        stockQuantity: 45,
        location: 'Rack B-14 (Front)',
        mrp: 31.00
      },
      {
        batchNumber: 'CAL-2025-A',
        expiryDate: '2026-12-31',
        stockQuantity: 165,
        location: 'Rack B-14',
        mrp: 31.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c005',
    name: 'Paracip 650 Tablet',
    brand: 'Cipla Ltd',
    saltComposition: 'Paracetamol 650mg',
    barcode: '8901234567894',
    hsnCode: '30049060',
    gstRate: 12,
    unitMRP: 28.00,
    sellingPrice: 25.00,
    grossMarginPercent: 26.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 180,
    batches: [
      {
        batchNumber: 'PCP-65-11',
        expiryDate: '2027-01-15',
        stockQuantity: 180,
        location: 'Rack B-15',
        mrp: 28.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c006',
    name: 'Alprazolam 0.5mg (Restyl)',
    brand: 'Cipla Ltd',
    saltComposition: 'Alprazolam 0.5mg',
    barcode: '8901234567895',
    hsnCode: '30049080',
    gstRate: 12,
    unitMRP: 65.00,
    sellingPrice: 60.00,
    grossMarginPercent: 32.0,
    scheduleCategory: 'SCHEDULE_X', // Requires Manager PIN!
    stockStatus: 'IN_STOCK',
    totalStock: 50,
    batches: [
      {
        batchNumber: 'NAR-ALP-001',
        expiryDate: '2027-05-30',
        stockQuantity: 50,
        location: 'Safe Vault Locker-1',
        mrp: 65.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c007',
    name: 'Warfarin 5mg Tablet (Warf)',
    brand: 'Sun Pharma',
    saltComposition: 'Warfarin Sodium 5mg',
    barcode: '8901234567896',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 85.00,
    sellingPrice: 78.00,
    grossMarginPercent: 20.0,
    scheduleCategory: 'SCHEDULE_H',
    stockStatus: 'IN_STOCK',
    totalStock: 90,
    batches: [
      {
        batchNumber: 'WRF-5-2025',
        expiryDate: '2026-10-30',
        stockQuantity: 90,
        location: 'Rack C-02',
        mrp: 85.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c008',
    name: 'Aspirin 75mg (Ecosprin 75)',
    brand: 'USV Pvt Ltd',
    saltComposition: 'Aspirin 75mg',
    barcode: '8901234567897',
    hsnCode: '30049060',
    gstRate: 12,
    unitMRP: 15.00,
    sellingPrice: 14.00,
    grossMarginPercent: 25.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 400,
    batches: [
      {
        batchNumber: 'ECO-75-99',
        expiryDate: '2027-08-31',
        stockQuantity: 400,
        location: 'Rack C-05',
        mrp: 15.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c009',
    name: 'Nitroglycerin 2.6mg (Sorbitrate)',
    brand: 'Abbott Healthcare',
    saltComposition: 'Isosorbide Dinitrate 10mg',
    barcode: '8901234567898',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 45.00,
    sellingPrice: 42.00,
    grossMarginPercent: 19.0,
    scheduleCategory: 'SCHEDULE_H',
    stockStatus: 'IN_STOCK',
    totalStock: 65,
    batches: [
      {
        batchNumber: 'NIT-2025-X',
        expiryDate: '2026-11-15',
        stockQuantity: 65,
        location: 'Rack C-08',
        mrp: 45.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c010',
    name: 'Sildenafil 50mg (Manforce)',
    brand: 'Mankind Pharma',
    saltComposition: 'Sildenafil Citrate 50mg',
    barcode: '8901234567899',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 120.00,
    sellingPrice: 110.00,
    grossMarginPercent: 35.0,
    scheduleCategory: 'SCHEDULE_H',
    stockStatus: 'IN_STOCK',
    totalStock: 120,
    batches: [
      {
        batchNumber: 'SIL-50-2025',
        expiryDate: '2027-02-28',
        stockQuantity: 120,
        location: 'Rack D-01',
        mrp: 120.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c011',
    name: 'Pan 40 Gastro Tablet',
    brand: 'Alkem Laboratories',
    saltComposition: 'Pantoprazole 40mg',
    barcode: '8901234567800',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 155.00,
    sellingPrice: 140.00,
    grossMarginPercent: 27.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 15, // Low Stock trigger (<20)
    batches: [
      {
        batchNumber: 'PAN-40-EXP',
        expiryDate: '2026-05-10', // EXPIRED!
        stockQuantity: 15,
        location: 'Rack E-01',
        mrp: 155.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c012',
    name: 'Morphine Sulphate 10mg (Narcotic)',
    brand: 'Troikaa Pharmaceuticals',
    saltComposition: 'Morphine Sulphate 10mg',
    barcode: '8901234567801',
    hsnCode: '30049080',
    gstRate: 12,
    unitMRP: 180.00,
    sellingPrice: 165.00,
    grossMarginPercent: 30.0,
    scheduleCategory: 'SCHEDULE_X',
    isNarcotic: true,
    stockStatus: 'IN_STOCK',
    totalStock: 40,
    batches: [
      {
        batchNumber: 'MOR-10-VAULT',
        expiryDate: '2027-09-30',
        stockQuantity: 40,
        location: 'Narcotics Vault L-2',
        mrp: 180.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c013',
    name: 'Tramadol 50mg Capsule (Tramazac)',
    brand: 'Zydus Healthcare',
    saltComposition: 'Tramadol Hydrochloride 50mg',
    barcode: '8901234567802',
    hsnCode: '30049080',
    gstRate: 12,
    unitMRP: 78.00,
    sellingPrice: 70.00,
    grossMarginPercent: 26.0,
    scheduleCategory: 'SCHEDULE_H1',
    stockStatus: 'IN_STOCK',
    totalStock: 120,
    batches: [
      {
        batchNumber: 'TRM-50-2025',
        expiryDate: '2027-04-30',
        stockQuantity: 120,
        location: 'Rack H1-01',
        mrp: 78.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c014',
    name: 'Zolpidem 10mg Tablet (Nitrest)',
    brand: 'Sun Pharma',
    saltComposition: 'Zolpidem Tartrate 10mg',
    barcode: '8901234567803',
    hsnCode: '30049080',
    gstRate: 12,
    unitMRP: 115.00,
    sellingPrice: 102.00,
    grossMarginPercent: 28.5,
    scheduleCategory: 'SCHEDULE_H1',
    stockStatus: 'IN_STOCK',
    totalStock: 75,
    batches: [
      {
        batchNumber: 'ZOL-10-2025',
        expiryDate: '2027-06-30',
        stockQuantity: 75,
        location: 'Rack H1-02',
        mrp: 115.00
      }
    ]
  }
];

export const MOCK_DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    severity: 'CONTRAINDICATED',
    drug1: 'Sildenafil Citrate 50mg',
    drug2: 'Isosorbide Dinitrate 10mg',
    description: 'Severe hypotension hazard! Nitrates (Sorbitrate) and Sildenafil combination causes a life-threatening drop in blood pressure.',
    clinicalImpact: 'Severe Refractory Hypotension / Myocardial Infarction hazard.',
    management: 'Full-screen red security interlock! Requires Store Owner PIN (1234) authorization.'
  },
  {
    severity: 'MAJOR',
    drug1: 'Warfarin Sodium 5mg',
    drug2: 'Aspirin 75mg',
    description: 'Concurrent use of Warfarin and Aspirin significantly increases gastrointestinal bleeding risk.',
    clinicalImpact: 'High bleeding risk (INR elevation).',
    management: 'Requires Pharmacist Signature Acknowledgment before cart finalization.'
  },
  {
    severity: 'MINOR',
    drug1: 'Paracetamol 650mg',
    drug2: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    description: 'Minor interaction: Mild gastric distress when taken simultaneously on empty stomach.',
    clinicalImpact: 'Mild discomfort.',
    management: 'Advise patient to take after meal. Informational banner displayed.'
  }
];
