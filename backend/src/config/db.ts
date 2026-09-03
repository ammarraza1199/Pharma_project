import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Initialize store settings if none exist
    const { StoreSettings } = await import('../models/StoreSettings');
    const existing = await StoreSettings.findOne();
    if (!existing) {
      await StoreSettings.create({
        storeName: 'GENQUANTAA MedPlus Pharmacy',
        dlNo: 'DL-2024/HYD/889201',
        gstin: '36AAACG1234F1Z8',
        phone: '+91 98765 43210',
        address: 'Tech City Store, Plot 44, Hi-Tech City, Hyderabad - 500081',
        defaultPrintFormat: 'THERMAL',
        autoPrintReceipt: true,
        soundEffects: true,
        autoAddOnScan: true,
        nearExpiryDaysThreshold: 30,
        termsAndConditions: '1. Goods once sold will not be taken back without original tax receipt. 2. Please check expiry before leaving counter.',
        defaultTaxType: 'CGST_SGST',
        managerPin: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMlJbekRBw4NqACDfeHh8d9E6a', // "1234"
        managerName: 'Rajesh Verma',
        managerEmail: 'rajesh.verma@genquantaa.com',
        ownerName: 'Dr. K. V. Rao',
        ownerEmail: 'kvrao@genquantaa.com',
        ownerPin: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMlJbekRBw4NqACDfeHh8d9E6a', // "1234"
      });
      console.log('✅ Default store settings initialized');
    }

    // Initialize drug interactions if none exist
    const { DrugInteraction } = await import('../models/DrugInteraction');
    const interactionCount = await DrugInteraction.countDocuments();
    if (interactionCount === 0) {
      await DrugInteraction.insertMany([
        {
          severity: 'CONTRAINDICATED',
          drug1: 'Sildenafil',
          drug2: 'Isosorbide',
          description: 'Severe hypotension hazard! Nitrates and Sildenafil combination causes a life-threatening drop in blood pressure.',
          clinicalImpact: 'Severe Refractory Hypotension / Myocardial Infarction hazard.',
          management: 'Requires Store Owner PIN authorization.',
        },
        {
          severity: 'MAJOR',
          drug1: 'Warfarin',
          drug2: 'Aspirin',
          description: 'Concurrent use significantly increases gastrointestinal bleeding risk.',
          clinicalImpact: 'High bleeding risk (INR elevation).',
          management: 'Requires Pharmacist Signature Acknowledgment before cart finalization.',
        },
        {
          severity: 'MINOR',
          drug1: 'Paracetamol',
          drug2: 'Amoxicillin',
          description: 'Minor interaction: Mild gastric distress when taken simultaneously on empty stomach.',
          clinicalImpact: 'Mild discomfort.',
          management: 'Advise patient to take after meal.',
        },
      ]);
      console.log('✅ Default drug interactions seeded');
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};
