import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './models/Product';
import { DrugInteraction } from './models/DrugInteraction';
import { Invoice } from './models/Invoice';
import { HeldBill } from './models/HeldBill';
import { Patient } from './models/Patient';
import { Supplier } from './models/Supplier';
import { GRNEntry } from './models/GRNEntry';
import { ReturnNote } from './models/ReturnNote';
import { MOCK_PRODUCTS, MOCK_DRUG_INTERACTIONS } from './productsMock';
import { connectDB } from './config/db';

dotenv.config();

const seedDB = async () => {
  try {
    await connectDB();
    console.log('Connected to DB, preparing to seed data...');

    // Clear existing
    await Product.deleteMany({});
    await DrugInteraction.deleteMany({});
    await Invoice.deleteMany({});
    await HeldBill.deleteMany({});
    await Patient.deleteMany({});
    await Supplier.deleteMany({});
    await GRNEntry.deleteMany({});
    await ReturnNote.deleteMany({});
    console.log('Cleared existing data.');

    // Convert MOCK_PRODUCTS to Mongoose models
    const productsToInsert = MOCK_PRODUCTS.map(p => {
      const { id, ...rest } = p as any; 
      return {
        ...rest,
        isActive: true
      };
    });

    const insertedProducts = await Product.insertMany(productsToInsert);
    console.log(`Inserted ${insertedProducts.length} mock products.`);

    const interactionsToInsert = MOCK_DRUG_INTERACTIONS.map(di => {
      const { id, ...rest } = di as any;
      return rest;
    });

    const insertedInteractions = await DrugInteraction.insertMany(interactionsToInsert);
    console.log(`Inserted ${insertedInteractions.length} mock drug interactions.`);

    // --- Generate Mock Invoices ---
    // Let's create some mock invoices so the dashboard has data
    const mockInvoices = [];
    const today = new Date();
    
    // Generate 5 invoices for today
    for (let i = 0; i < 5; i++) {
      const product = insertedProducts[i % insertedProducts.length];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unitPrice = product.sellingPrice;
      const taxableAmount = unitPrice * quantity;
      const gstRate = product.gstRate;
      const cgstAmount = (taxableAmount * (gstRate / 2)) / 100;
      const sgstAmount = cgstAmount;
      const totalGst = cgstAmount + sgstAmount;
      const lineTotal = taxableAmount + totalGst;

      const invoice = {
        invoiceNumber: `INV-${Date.now()}-${i}`,
        invoiceDate: new Date(today.getTime() - i * 3600000), // spread over today
        storeInfo: {
          name: 'Genquantaa Pharmacy',
          dlNo: 'DL-123456',
          gstin: '29ABCDE1234F1Z5',
          address: '123 Health Street, Medical District',
          phone: '+91 98765 43210'
        },
        billingSession: {
          items: [{
            cartItemId: `item-${i}`,
            productId: product._id,
            product: product,
            selectedBatch: product.batches[0],
            quantity,
            unitMode: 'PACK',
            unitPrice,
            discountPercent: 0,
            taxableAmount,
            cgstAmount,
            sgstAmount,
            totalGst,
            lineTotal,
            isSubstitute: false
          }],
          doctorDetails: { doctorName: 'Dr. Smith', regNo: 'MC1234' },
          patientDetails: { patientName: 'John Doe', phone: '9999999999', age: '30', gender: 'MALE' },
          scheduleXVerified: false,
          pharmacistSignatureAcknowledged: false
        },
        subtotal: taxableAmount,
        totalDiscount: 0,
        totalCGST: cgstAmount,
        totalSGST: sgstAmount,
        grandTotal: lineTotal,
        payment: {
          method: ['CASH', 'UPI', 'CARD'][i % 3],
          cashAmount: i % 3 === 0 ? lineTotal : 0,
          upiAmount: i % 3 === 1 ? lineTotal : 0,
          cardAmount: i % 3 === 2 ? lineTotal : 0,
          totalPaid: lineTotal,
          changeDue: 0,
          paymentStatus: 'SUCCESS'
        },
        invoiceType: 'REGULAR',
        // createdBy: null // optional
      };
      mockInvoices.push(invoice);
    }
    
    // Generate 3 invoices for yesterday
    const yesterday = new Date(today.getTime() - 86400000);
    for (let i = 0; i < 3; i++) {
       // same logic, just yesterday
       const product = insertedProducts[(i+5) % insertedProducts.length];
       const quantity = 2;
       const unitPrice = product.sellingPrice;
       const taxableAmount = unitPrice * quantity;
       const gstRate = product.gstRate;
       const cgstAmount = (taxableAmount * (gstRate / 2)) / 100;
       const sgstAmount = cgstAmount;
       const totalGst = cgstAmount + sgstAmount;
       const lineTotal = taxableAmount + totalGst;
       
       mockInvoices.push({
        invoiceNumber: `INV-${Date.now()}-y${i}`,
        invoiceDate: new Date(yesterday.getTime() - i * 3600000), 
        storeInfo: {
          name: 'Genquantaa Pharmacy',
          dlNo: 'DL-123456',
          gstin: '29ABCDE1234F1Z5',
          address: '123 Health Street',
          phone: '+91 98765 43210'
        },
        billingSession: {
          items: [{
            cartItemId: `item-y${i}`,
            productId: product._id,
            product: product,
            selectedBatch: product.batches[0],
            quantity,
            unitMode: 'PACK',
            unitPrice,
            discountPercent: 0,
            taxableAmount,
            cgstAmount,
            sgstAmount,
            totalGst,
            lineTotal,
            isSubstitute: false
          }],
          doctorDetails: { doctorName: 'Dr. Jane', regNo: 'MC5678' },
          patientDetails: { patientName: 'Jane Doe', phone: '8888888888', age: '28', gender: 'FEMALE' },
          scheduleXVerified: false,
          pharmacistSignatureAcknowledged: false
        },
        subtotal: taxableAmount,
        totalDiscount: 0,
        totalCGST: cgstAmount,
        totalSGST: sgstAmount,
        grandTotal: lineTotal,
        payment: {
          method: 'UPI',
          cashAmount: 0,
          upiAmount: lineTotal,
          cardAmount: 0,
          totalPaid: lineTotal,
          changeDue: 0,
          paymentStatus: 'SUCCESS'
        },
        invoiceType: 'REGULAR',
      });
    }

    const insertedInvoices = await Invoice.insertMany(mockInvoices);
    console.log(`Inserted ${insertedInvoices.length} mock invoices (5 for today, 3 for yesterday).`);

    // --- Mock Patients ---
    const mockPatients = [
      { name: 'Jane Doe', phone: '8888888888', age: '28', gender: 'FEMALE', totalBills: 5, totalSpent: 1200, chronicConditions: ['Asthma'] },
      { name: 'John Smith', phone: '9999999999', age: '45', gender: 'MALE', totalBills: 2, totalSpent: 450, chronicConditions: ['Diabetes'] },
    ];
    await Patient.insertMany(mockPatients);
    console.log(`Inserted mock patients.`);

    // --- Mock Suppliers ---
    const mockSuppliers = [
      { name: 'MedLife Distributors Pvt Ltd', contactPerson: 'Rajesh', phone: '9876543210', email: 'rajesh@medlife.com', gstin: '29ABCDE1234F1Z5', dlNumber: 'DL-KA-12345', address: 'Bangalore', pendingBalance: 5000 },
      { name: 'PharmaPlus Agency', contactPerson: 'Sunil', phone: '9876543211', email: 'contact@pharmaplus.com', gstin: '29ABCDE1234F1Z6', dlNumber: 'DL-KA-12346', address: 'Mysore', pendingBalance: 12000 },
    ];
    const insertedSuppliers = await Supplier.insertMany(mockSuppliers);
    console.log(`Inserted mock suppliers.`);

    // --- Mock GRN Entries ---
    const mockGrns = [
      {
        grnNumber: 'GRN-2026-1001',
        supplierName: insertedSuppliers[0].name,
        supplierId: insertedSuppliers[0]._id,
        supplierInvoiceNo: 'INV-SUP-123',
        receivedDate: new Date(),
        items: [
          {
            productId: insertedProducts[0]._id,
            productName: insertedProducts[0].name,
            batchNumber: 'BT-2026-001',
            expiryDate: new Date('2028-01-01'),
            quantity: 100,
            purchaseRate: 50,
            mrp: 75,
            sellingPrice: 70,
            gstRate: 12,
            totalAmount: 5600
          }
        ],
        totalAmount: 5600,
        status: 'COMPLETED'
      }
    ];
    await GRNEntry.insertMany(mockGrns);
    console.log(`Inserted mock GRNs.`);

    // --- Mock Return Notes ---
    const mockReturns = [
      {
        creditNoteNo: 'CN-2026-0001',
        originalInvoiceNo: insertedInvoices[0].invoiceNumber,
        patientName: 'Jane Doe',
        returnDate: new Date(),
        items: [
          {
            productId: insertedProducts[0]._id,
            productName: insertedProducts[0].name,
            batchNumber: 'BT-2026-001',
            quantityReturned: 1,
            unitPrice: 70,
            refundAmount: 70,
            reason: 'CUSTOMER_CANCELLED',
            restocked: true
          }
        ],
        totalRefundAmount: 70,
        refundMethod: 'CASH'
      }
    ];
    await ReturnNote.insertMany(mockReturns);
    console.log(`Inserted mock Return Notes.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedDB();
