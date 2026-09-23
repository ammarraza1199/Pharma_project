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
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c020',
    name: 'Dettol Antiseptic Liquid (100ml)',
    brand: 'Reckitt Benckiser',
    saltComposition: 'Chloroxylenol 4.8% w/v',
    barcode: '8901234567820',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 95.00,
    sellingPrice: 88.00,
    grossMarginPercent: 38.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 85,
    packSize: '100ml / Bottle',
    packType: 'Bottle',
    medicineType: 'Topical',
    dosageForm: 'Liquid',
    batches: [
      {
        batchNumber: 'DET-2025-X',
        expiryDate: '2027-10-31',
        stockQuantity: 85,
        location: 'Rack OTC-01',
        mrp: 95.00,
        purchaseRate: 54.56
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c021',
    name: 'Hansaplast Medicated Bandages (Pack of 20)',
    brand: 'Beiersdorf India',
    saltComposition: 'Medicated Adhesive Dressing with Silver',
    barcode: '8901234567821',
    hsnCode: '30051090',
    gstRate: 12,
    unitMRP: 50.00,
    sellingPrice: 45.00,
    grossMarginPercent: 44.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 120,
    packSize: '20 Strips / Box',
    packType: 'Box',
    medicineType: 'Topical',
    dosageForm: 'Bandage',
    batches: [
      {
        batchNumber: 'HAN-20-88',
        expiryDate: '2028-02-28',
        stockQuantity: 120,
        location: 'Rack OTC-02',
        mrp: 50.00,
        purchaseRate: 25.20
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c022',
    name: 'Sterile Surgical Cotton Roll (100g)',
    brand: 'Medicare Surgical Ltd',
    saltComposition: 'Pure Absorbent Surgical Cotton',
    barcode: '8901234567822',
    hsnCode: '30059010',
    gstRate: 12,
    unitMRP: 55.00,
    sellingPrice: 48.00,
    grossMarginPercent: 46.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 90,
    packSize: '100g / Roll',
    packType: 'Roll',
    medicineType: 'Topical',
    dosageForm: 'Dressing',
    batches: [
      {
        batchNumber: 'COT-100-25',
        expiryDate: '2028-06-30',
        stockQuantity: 90,
        location: 'Rack OTC-03',
        mrp: 55.00,
        purchaseRate: 25.92
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c023',
    name: 'Becosules Z Multivitamin Capsules (15s)',
    brand: 'Pfizer Ltd',
    saltComposition: 'B-Complex Vitamins + Vitamin C + Zinc',
    barcode: '8901234567823',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 125.00,
    sellingPrice: 110.00,
    grossMarginPercent: 36.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 140,
    packSize: '15 Capsules / Strip',
    packType: 'Strip',
    medicineType: 'Oral',
    dosageForm: 'Capsule',
    batches: [
      {
        batchNumber: 'BCZ-15-2025',
        expiryDate: '2027-08-31',
        stockQuantity: 140,
        location: 'Rack OTC-04',
        mrp: 125.00,
        purchaseRate: 70.40
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c024',
    name: 'Electral WHO-Formula ORS (21.8g)',
    brand: 'FDC Limited',
    saltComposition: 'Sodium Chloride + Potassium Chloride + Sodium Citrate + Dextrose',
    barcode: '8901234567824',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 24.00,
    sellingPrice: 22.00,
    grossMarginPercent: 35.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 250,
    packSize: '21.8g / Sachet',
    packType: 'Sachet',
    medicineType: 'Oral',
    dosageForm: 'Powder',
    batches: [
      {
        batchNumber: 'ELC-21-99',
        expiryDate: '2027-11-30',
        stockQuantity: 250,
        location: 'Rack OTC-05',
        mrp: 24.00,
        purchaseRate: 14.30
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c025',
    name: 'Dr. Morepen Digital Rapid Thermometer',
    brand: 'Dr. Morepen Health',
    saltComposition: 'Digital Fever Diagnostic Sensor',
    barcode: '8901234567825',
    hsnCode: '90251910',
    gstRate: 18,
    unitMRP: 175.00,
    sellingPrice: 150.00,
    grossMarginPercent: 42.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 45,
    packSize: '1 Unit / Box',
    packType: 'Box',
    medicineType: 'Topical',
    dosageForm: 'Device',
    batches: [
      {
        batchNumber: 'THM-DG-01',
        expiryDate: '2030-12-31',
        stockQuantity: 45,
        location: 'Rack OTC-06',
        mrp: 175.00,
        purchaseRate: 87.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c030',
    name: 'Betadine 5% Antiseptic Ointment (20g)',
    brand: 'Win-Medicare',
    saltComposition: 'Povidone Iodine 5% w/w',
    barcode: '8901234567830',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 75.00,
    sellingPrice: 68.00,
    grossMarginPercent: 38.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 110,
    packSize: '20g / Tube',
    packType: 'Tube',
    medicineType: 'Topical',
    dosageForm: 'Ointment',
    batches: [
      {
        batchNumber: 'BET-5-2025',
        expiryDate: '2027-09-30',
        stockQuantity: 110,
        location: 'Rack OTC-07',
        mrp: 75.00,
        purchaseRate: 42.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c031',
    name: 'Sterile Surgical Gauze Swab Pads (10s)',
    brand: 'Medicare Surgical Ltd',
    saltComposition: 'Sterile 100% Cotton Absorbent Gauze',
    barcode: '8901234567831',
    hsnCode: '30059010',
    gstRate: 12,
    unitMRP: 40.00,
    sellingPrice: 35.00,
    grossMarginPercent: 48.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 140,
    packSize: '10 Pads / Pack',
    packType: 'Pack',
    medicineType: 'Topical',
    dosageForm: 'Dressing',
    batches: [
      {
        batchNumber: 'GZ-10-88',
        expiryDate: '2028-05-31',
        stockQuantity: 140,
        location: 'Rack OTC-08',
        mrp: 40.00,
        purchaseRate: 18.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c032',
    name: '3M Micropore Surgical Paper Tape (1 inch)',
    brand: '3M Healthcare',
    saltComposition: 'Hypoallergenic Surgical Paper Tape',
    barcode: '8901234567832',
    hsnCode: '30051090',
    gstRate: 12,
    unitMRP: 50.00,
    sellingPrice: 45.00,
    grossMarginPercent: 45.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 95,
    packSize: '1 Roll (1 in x 9.1m)',
    packType: 'Roll',
    medicineType: 'Topical',
    dosageForm: 'Tape',
    batches: [
      {
        batchNumber: 'MIC-3M-25',
        expiryDate: '2029-01-31',
        stockQuantity: 95,
        location: 'Rack OTC-09',
        mrp: 50.00,
        purchaseRate: 24.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c033',
    name: 'Gelusil MPS Antacid Mint Oral Gel (170ml)',
    brand: 'Pfizer Ltd',
    saltComposition: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone',
    barcode: '8901234567833',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 110.00,
    sellingPrice: 98.00,
    grossMarginPercent: 40.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 90,
    packSize: '170ml / Bottle',
    packType: 'Bottle',
    medicineType: 'Oral',
    dosageForm: 'Liquid',
    batches: [
      {
        batchNumber: 'GEL-170-25',
        expiryDate: '2027-10-31',
        stockQuantity: 90,
        location: 'Rack OTC-10',
        mrp: 110.00,
        purchaseRate: 58.00
      }
    ]
  },
  {
    _id: '64f1a2b3c4d5e6f7a8b9c034',
    name: 'Aristozyme Liquid Digestive Enzyme Syrup (200ml)',
    brand: 'Aristo Pharmaceuticals',
    saltComposition: 'Diastase (1:50) + Pepsin (1:3000)',
    barcode: '8901234567834',
    hsnCode: '30049099',
    gstRate: 12,
    unitMRP: 130.00,
    sellingPrice: 115.00,
    grossMarginPercent: 42.0,
    scheduleCategory: 'REGULAR',
    stockStatus: 'IN_STOCK',
    totalStock: 75,
    packSize: '200ml / Bottle',
    packType: 'Bottle',
    medicineType: 'Oral',
    dosageForm: 'Liquid',
    batches: [
      {
        batchNumber: 'ARZ-200-25',
        expiryDate: '2027-12-31',
        stockQuantity: 75,
        location: 'Rack OTC-11',
        mrp: 130.00,
        purchaseRate: 68.00
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
