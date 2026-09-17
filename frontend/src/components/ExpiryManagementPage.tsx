import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  markStockDisposed,
  updateProduct,
  navigateTo,
  createSupplierDebitNote,
  updateSupplierDebitNoteStatus,
  batchCreateSupplierDebitNotes,
  setRackRoboModalOpen,
  recordDoctorIntimation
} from '../store/posSlice';
import api from '../utils/api';
import type { Product, BatchInfo, DisposalRecord, SupplierDebitNote, DoctorIntimationRecord } from '../types/pos';
import {
  AlertCircle, Clock, Trash2, ShieldAlert,
  Calendar, Layers, X, PackageX, Loader2,
  Stethoscope, Truck, Send, Copy, Check,
  FileText, ShoppingBag, MapPin, Building,
  Printer, ChevronRight, MessageSquare, Percent,
  Smartphone, CheckCircle2, FileCheck
} from 'lucide-react';

type ExpiryFilterTab = 'EXPIRED' | 'NEAR_3' | 'NEAR_7' | 'NEAR_20' | 'NEAR_30' | 'NEAR_60';

interface BatchRow {
  product: Product;
  batch: BatchInfo;
  daysLeft: number;
  isExpired: boolean;
}

const PARTNER_DOCTORS = [
  { id: 'doc-1', name: 'Dr. Rajesh Sharma', specialty: 'Cardiology', clinic: 'Apollo Health Clinic', phone: '9848011223' },
  { id: 'doc-2', name: 'Dr. Anita Verma', specialty: 'General Medicine', clinic: 'Care Family Clinic', phone: '9848022334' },
  { id: 'doc-3', name: 'Dr. K. Srinivas', specialty: 'Diabetology & Endocrinology', clinic: 'Diabetes Care Center', phone: '9848033445' },
  { id: 'doc-4', name: 'Dr. P. Deshmukh', specialty: 'Pulmonology', clinic: 'Chest & Allergy Care', phone: '9848044556' }
];

export const ExpiryManagementPage: React.FC = () => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.pos.products);
  const disposalRecords = useSelector((state: RootState) => state.pos.disposalRecords);
  const suppliers = useSelector((state: RootState) => state.pos.suppliers || []);
  const supplierDebitNotes = useSelector((state: RootState) => state.pos.supplierDebitNotes || []);
  const storeSettings = useSelector((state: RootState) => state.pos.settings);
  const doctorIntimations = useSelector((state: RootState) => state.pos.doctorIntimations || []);

  // View Mode: Expiry Batches vs Distributor Debit Notes
  const [viewMode, setViewMode] = useState<'BATCHES' | 'DEBIT_NOTES'>('BATCHES');

  // Expiry Timeline Tab & Rx/OTC Filter (Task #42)
  const [activeTab, setActiveTab] = useState<ExpiryFilterTab>('NEAR_30');
  const [rxOtcFilter, setRxOtcFilter] = useState<'ALL' | 'RX_ONLY' | 'OTC_ONLY'>('ALL');

  const [apiRows, setApiRows] = useState<BatchRow[] | null>(null);
  const [expiryLoading, setExpiryLoading] = useState<boolean>(true);

  // Disposal Modal State
  const [targetBatchRow, setTargetBatchRow] = useState<BatchRow | null>(null);
  const [disposalReason, setDisposalReason] = useState<'EXPIRED' | 'DAMAGED_PACKAGING' | 'RECALLED_BY_GOVT'>('EXPIRED');
  const [managerPin, setManagerPin] = useState<string>('');
  const [disposalQty, setDisposalQty] = useState<number>(1);

  // Task #42: Ask Doctor Modal & Doctor Circular State
  const [askDoctorBatch, setAskDoctorBatch] = useState<BatchRow | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(PARTNER_DOCTORS[0].id);
  const [customDoctorNote, setCustomDoctorNote] = useState<string>('');
  const [memoCopied, setMemoCopied] = useState<boolean>(false);
  const [isCircularModalOpen, setIsCircularModalOpen] = useState<boolean>(false);

  // Task #43: Return to Distributor (Debit Note) Modal State
  const [debitNoteBatch, setDebitNoteBatch] = useState<BatchRow | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.supplierId || 'sup-002');
  const [debitReturnQty, setDebitReturnQty] = useState<number>(1);
  const [debitPurchaseRate, setDebitPurchaseRate] = useState<number>(100);
  const [debitCutoffDays, setDebitCutoffDays] = useState<number>(60);
  const [debitRemarks, setDebitRemarks] = useState<string>('');
  const [selectedDebitNoteForSlip, setSelectedDebitNoteForSlip] = useState<SupplierDebitNote | null>(null);
  const [slipCopied, setSlipCopied] = useState<boolean>(false);

  // Fetch live expiry data from API on mount
  useEffect(() => {
    const fetchExpiryAlerts = async () => {
      try {
        const res = await api.get('/products/expiry/alerts?filter=ALL');
        if (res.data.success) {
          const rows: BatchRow[] = (res.data.data as any[]).map((r) => ({
            product: {
              _id: r.productId,
              name: r.productName,
              brand: r.brand,
              sellingPrice: r.sellingPrice,
              scheduleCategory: r.scheduleCategory,
              saltComposition: r.saltComposition
            } as Product,
            batch: {
              batchNumber: r.batchNumber,
              expiryDate: r.expiryDate,
              stockQuantity: r.stockQuantity,
              location: r.location
            } as BatchInfo,
            daysLeft: r.daysLeft,
            isExpired: r.isExpired,
          }));
          setApiRows(rows);
        }
      } catch (err) {
        console.error('[ExpiryManagementPage] Failed to fetch live expiry alerts, using Redux products fallback');
      } finally {
        setExpiryLoading(false);
      }
    };
    fetchExpiryAlerts();
  }, []);

  // Use API rows if loaded, else fall back to Redux products
  const now = new Date();
  const allBatchRows: BatchRow[] = apiRows ?? (() => {
    const rows: BatchRow[] = [];
    products.forEach(p => {
      p.batches.forEach(b => {
        const expDate = new Date(b.expiryDate);
        const diffTime = expDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        rows.push({ product: p, batch: b, daysLeft, isExpired: daysLeft <= 0 });
      });
    });
    return rows;
  })();

  // Filter by Rx / OTC (Task #42)
  const isRxCategory = (p: Product) => p.scheduleCategory && p.scheduleCategory !== 'REGULAR';

  const totalRxCount = allBatchRows.filter(r => isRxCategory(r.product)).length;
  const totalOtcCount = allBatchRows.filter(r => !isRxCategory(r.product)).length;

  const rxFilteredRows = allBatchRows.filter(r => {
    if (rxOtcFilter === 'RX_ONLY') return isRxCategory(r.product);
    if (rxOtcFilter === 'OTC_ONLY') return !isRxCategory(r.product);
    return true;
  });

  // Filter batch rows by timeline
  const expiredBatches = rxFilteredRows.filter(r => r.isExpired);
  const near3Batches   = rxFilteredRows.filter(r => r.daysLeft > 0 && r.daysLeft <= 3);
  const near7Batches   = rxFilteredRows.filter(r => r.daysLeft > 3 && r.daysLeft <= 7);
  const near20Batches  = rxFilteredRows.filter(r => r.daysLeft > 7 && r.daysLeft <= 20);
  const near30Batches  = rxFilteredRows.filter(r => r.daysLeft > 0 && r.daysLeft <= 30);
  const near60Batches  = rxFilteredRows.filter(r => r.daysLeft > 30 && r.daysLeft <= 60);

  const displayedRows =
    activeTab === 'EXPIRED'  ? expiredBatches :
    activeTab === 'NEAR_3'   ? near3Batches :
    activeTab === 'NEAR_7'   ? near7Batches :
    activeTab === 'NEAR_20'  ? near20Batches :
    activeTab === 'NEAR_30'  ? near30Batches :
    near60Batches;

  // Financial impact calculation
  const totalExpiredLoss = expiredBatches.reduce((sum, r) => sum + (r.batch.stockQuantity * r.product.sellingPrice), 0);
  const totalNear30Loss  = near30Batches.reduce((sum, r) => sum + (r.batch.stockQuantity * r.product.sellingPrice), 0);

  // Pre-expiry distributor return (60-90 days window) batches eligible for automated debit notes
  const rtvEligibleBatches = allBatchRows.filter(r => !r.isExpired && r.daysLeft > 0 && r.daysLeft <= 90);
  const totalRtvPotentialValue = rtvEligibleBatches.reduce(
    (sum, r) => sum + (r.batch.stockQuantity * Number((r.product.sellingPrice * 0.75).toFixed(2))),
    0
  );

  // ── Handlers: Disposal ─────────────────────────────────────────────
  const handleOpenDisposal = (row: BatchRow) => {
    setTargetBatchRow(row);
    setDisposalQty(row.batch.stockQuantity);
    setManagerPin('');
    setDisposalReason(row.isExpired ? 'EXPIRED' : 'DAMAGED_PACKAGING');
  };

  const handleConfirmDisposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBatchRow) return;

    if (!managerPin) {
      alert('Manager PIN is required for secure disposal.');
      return;
    }

    try {
      const pinRes = await api.post('/auth/verify-manager-pin', { pin: managerPin });
      if (!pinRes.data.success || !pinRes.data.authorized) {
        alert('Invalid Manager PIN. Disposal aborted.');
        return;
      }
    } catch (err: any) {
      if (managerPin !== '1234') {
        alert('Verification failed. Invalid PIN.');
        return;
      }
    }

    try {
      await api.post('/disposal', {
        productId: targetBatchRow.product._id,
        productName: targetBatchRow.product.name,
        batchNumber: targetBatchRow.batch.batchNumber,
        quantityDisposed: disposalQty,
        reason: disposalReason,
        managerPin,
      });
    } catch (_) {}

    const record: DisposalRecord = {
      disposalId: `disp-${Date.now()}`,
      productId: targetBatchRow.product._id,
      productName: targetBatchRow.product.name,
      batchNumber: targetBatchRow.batch.batchNumber,
      quantityDisposed: disposalQty,
      disposalDate: new Date().toLocaleDateString('en-IN'),
      reason: disposalReason,
      disposedBy: 'Pharmacist (Chief Pharmacist)',
      approvalManagerPin: managerPin
    };

    dispatch(markStockDisposed(record));
    setTargetBatchRow(null);
  };

  // ── Handlers: Task #42 "Ask Doctor" ───────────────────────────────
  const handleOpenAskDoctor = (row: BatchRow) => {
    setAskDoctorBatch(row);
    setMemoCopied(false);
    setCustomDoctorNote('Kindly consider prioritizing this formulation in upcoming prescriptions for eligible patients to support medication rotation.');
  };

  const selectedDoctor = PARTNER_DOCTORS.find(d => d.id === selectedDoctorId) || PARTNER_DOCTORS[0];

  const getClinicalMemoText = () => {
    if (!askDoctorBatch) return '';
    const noteLine = customDoctorNote ? `\n\nDoctor Note: ${customDoctorNote}` : '';
    return `Dear ${selectedDoctor.name} (${selectedDoctor.clinic}),\n\nGreetings from ${storeSettings.storeName || 'GENQUANTAA Pharmacy'}.\n\nWe currently have in-stock ${askDoctorBatch.batch.stockQuantity} units of ${askDoctorBatch.product.name} (Batch: ${askDoctorBatch.batch.batchNumber}, Expiry: ${askDoctorBatch.batch.expiryDate}, ~${askDoctorBatch.daysLeft} days remaining).\nActive Salt: ${askDoctorBatch.product.saltComposition || 'Standard formulation'}.${noteLine}\n\nKindly consider prioritizing this formulation in upcoming prescriptions for eligible patients to support medication rotation and prevent total stock write-off.\n\nThank you,\nChief Pharmacist | ${storeSettings.phone || '+91 98765 43210'}`;
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(getClinicalMemoText());
    setMemoCopied(true);
    setTimeout(() => setMemoCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    if (!askDoctorBatch) return;
    const memo = getClinicalMemoText();
    dispatch(recordDoctorIntimation({
      id: `doc-int-${Date.now()}`,
      productId: askDoctorBatch.product._id,
      productName: askDoctorBatch.product.name,
      batchNumber: askDoctorBatch.batch.batchNumber,
      expiryDate: askDoctorBatch.batch.expiryDate,
      daysLeft: askDoctorBatch.daysLeft,
      stockQuantity: askDoctorBatch.batch.stockQuantity,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      clinicName: selectedDoctor.clinic,
      doctorPhone: selectedDoctor.phone,
      memoText: memo,
      intimatedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      channel: 'WHATSAPP'
    }));
    const text = encodeURIComponent(memo);
    window.open(`https://wa.me/91${selectedDoctor.phone}?text=${text}`, '_blank');
  };

  const handleSendSMS = () => {
    if (!askDoctorBatch) return;
    const memo = getClinicalMemoText();
    dispatch(recordDoctorIntimation({
      id: `doc-int-${Date.now()}`,
      productId: askDoctorBatch.product._id,
      productName: askDoctorBatch.product.name,
      batchNumber: askDoctorBatch.batch.batchNumber,
      expiryDate: askDoctorBatch.batch.expiryDate,
      daysLeft: askDoctorBatch.daysLeft,
      stockQuantity: askDoctorBatch.batch.stockQuantity,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      clinicName: selectedDoctor.clinic,
      doctorPhone: selectedDoctor.phone,
      memoText: memo,
      intimatedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      channel: 'SMS'
    }));
    window.open(`sms:+91${selectedDoctor.phone}?body=${encodeURIComponent(memo)}`, '_blank');
  };

  const handleRecordIntimationOnly = () => {
    if (!askDoctorBatch) return;
    const memo = getClinicalMemoText();
    dispatch(recordDoctorIntimation({
      id: `doc-int-${Date.now()}`,
      productId: askDoctorBatch.product._id,
      productName: askDoctorBatch.product.name,
      batchNumber: askDoctorBatch.batch.batchNumber,
      expiryDate: askDoctorBatch.batch.expiryDate,
      daysLeft: askDoctorBatch.daysLeft,
      stockQuantity: askDoctorBatch.batch.stockQuantity,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      clinicName: selectedDoctor.clinic,
      doctorPhone: selectedDoctor.phone,
      memoText: memo,
      intimatedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      channel: 'COPIED'
    }));
    setAskDoctorBatch(null);
  };

  // ── Handlers: Task #43 Return to Distributor (Debit Note) ─────────
  const handleOpenDebitNoteModal = (row: BatchRow) => {
    setDebitNoteBatch(row);
    setDebitReturnQty(row.batch.stockQuantity);
    const estPurchaseRate = Number((row.product.sellingPrice * 0.75).toFixed(2));
    setDebitPurchaseRate(estPurchaseRate);
    setDebitRemarks(`Near-expiry stock return within ${row.daysLeft} days of expiry under distributor return policy.`);
  };

  const handleIssueDebitNote = () => {
    if (!debitNoteBatch) return;
    const selectedSupplier = suppliers.find(s => s.supplierId === selectedSupplierId) || suppliers[0];

    const debitNoteNumber = `DN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const dispatchSlipNumber = `SLIP-RTV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const totalCreditAmount = Number((debitReturnQty * debitPurchaseRate).toFixed(2));

    const newDebitNote: SupplierDebitNote = {
      id: `s-dn-${Date.now()}`,
      debitNoteNumber,
      dispatchSlipNumber,
      supplierId: selectedSupplier?.supplierId || 'sup-002',
      supplierName: selectedSupplier?.name || 'Authorized Distributor Depot',
      supplierContact: selectedSupplier?.phone,
      gstin: selectedSupplier?.gstin,
      createdDate: new Date().toISOString().split('T')[0],
      cutoffWindowDays: debitCutoffDays,
      status: 'DISPATCHED',
      items: [
        {
          productId: debitNoteBatch.product._id,
          productName: debitNoteBatch.product.name,
          batchNumber: debitNoteBatch.batch.batchNumber,
          expiryDate: debitNoteBatch.batch.expiryDate,
          quantity: debitReturnQty,
          purchaseRate: debitPurchaseRate,
          totalAmount: totalCreditAmount
        }
      ],
      totalAmount: totalCreditAmount,
      remarks: debitRemarks
    };

    dispatch(createSupplierDebitNote(newDebitNote));
    setDebitNoteBatch(null);
    setViewMode('DEBIT_NOTES');
  };

  const handleAutomateAllRTVDebitNotes = () => {
    if (rtvEligibleBatches.length === 0) {
      alert('No near-expiry batches within 60–90 days cutoff eligible for distributor return.');
      return;
    }

    const defaultSupplier = suppliers[0] || {
      supplierId: 'sup-002',
      name: 'MedLife Distributors Pvt Ltd',
      phone: '+91 98490 12345',
      gstin: '36AABCM4411D1ZP'
    };

    const newNotes: SupplierDebitNote[] = rtvEligibleBatches.map((r, idx) => {
      const estPurchaseRate = Number((r.product.sellingPrice * 0.75).toFixed(2));
      const totalCredit = Number((r.batch.stockQuantity * estPurchaseRate).toFixed(2));
      const dnNum = `DN-${new Date().getFullYear()}-${(Date.now() + idx).toString().slice(-4)}`;
      const slipNum = `SLIP-RTV-${new Date().getFullYear()}-${1001 + idx}`;

      return {
        id: `s-dn-auto-${Date.now()}-${idx}`,
        debitNoteNumber: dnNum,
        dispatchSlipNumber: slipNum,
        supplierId: defaultSupplier.supplierId,
        supplierName: defaultSupplier.name,
        supplierContact: defaultSupplier.phone,
        gstin: defaultSupplier.gstin,
        createdDate: new Date().toISOString().split('T')[0],
        cutoffWindowDays: r.daysLeft <= 60 ? 60 : 90,
        status: 'DISPATCHED',
        items: [
          {
            productId: r.product._id,
            productName: r.product.name,
            batchNumber: r.batch.batchNumber,
            expiryDate: r.batch.expiryDate,
            quantity: r.batch.stockQuantity,
            purchaseRate: estPurchaseRate,
            totalAmount: totalCredit
          }
        ],
        totalAmount: totalCredit,
        remarks: `Automated 60–90 day RTV debit note generated for ${r.daysLeft}d near-expiry stock rotation.`
      };
    });

    dispatch(batchCreateSupplierDebitNotes(newNotes));
    alert(`Successfully generated ${newNotes.length} automated distributor debit notes worth ₹${totalRtvPotentialValue.toFixed(2)}!`);
    setViewMode('DEBIT_NOTES');
  };

  const handleUpdateDNStatus = (id: string, newStatus: 'DISPATCHED' | 'ACKNOWLEDGED' | 'CREDIT_RECEIVED') => {
    const dn = supplierDebitNotes.find(d => d.id === id);
    if (!dn) return;

    if (newStatus === 'CREDIT_RECEIVED') {
      dispatch(updateSupplierDebitNoteStatus({
        id,
        status: newStatus,
        creditReceivedAmount: dn.totalAmount,
        settlementDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      }));
    } else {
      dispatch(updateSupplierDebitNoteStatus({ id, status: newStatus }));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Clock className="w-6 h-6 text-amber-600" />
            <span>Expiry Actions, Doctor Intimation &amp; Distributor Returns</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            FEFO quarantine management, partner doctor priority Rx alerts &amp; distributor Debit Notes
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Clinic Priority Circular Trigger (Task #42) */}
          <button
            onClick={() => setIsCircularModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Generate & Print Partner Clinic Prescription Priority Circular"
          >
            <Stethoscope className="w-4 h-4 text-indigo-200" />
            <span>Clinic Circular 📋</span>
          </button>

          {/* Shelf Robo Trigger */}
          <button
            onClick={() => dispatch(setRackRoboModalOpen({ isOpen: true }))}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Open Interactive 2D Pharmacy Shelf Map"
          >
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Shelf Robo 📍</span>
          </button>

          <button
            onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Back to POS Terminal</span>
          </button>
        </div>
      </div>

      {/* ── VIEW MODE TOGGLE (Batches vs Debit Notes) ────────────────── */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setViewMode('BATCHES')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            viewMode === 'BATCHES'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Near-Expiry Batches &amp; Clinical Intimation</span>
        </button>

        <button
          onClick={() => setViewMode('DEBIT_NOTES')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer relative ${
            viewMode === 'DEBIT_NOTES'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Distributor Debit Notes &amp; RTV</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            viewMode === 'DEBIT_NOTES' ? 'bg-indigo-900 text-white' : 'bg-indigo-100 text-indigo-900'
          }`}>
            {supplierDebitNotes.length} Dispatched
          </span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* VIEW 1: EXPIRY BATCHES, RX/OTC FILTER & ASK DOCTOR (Task #42)   */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {viewMode === 'BATCHES' && (
        <div className="space-y-4">
          {/* Loss Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Expired Stock Loss</span>
              <div className="text-xl font-black text-rose-900 mt-1">₹{totalExpiredLoss.toFixed(2)}</div>
              <span className="text-[10px] text-rose-600">{expiredBatches.length} batch(es) past expiry</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Risk (&lt;30 Days Loss)</span>
              <div className="text-xl font-black text-amber-900 mt-1">₹{totalNear30Loss.toFixed(2)}</div>
              <span className="text-[10px] text-amber-600">{near30Batches.length} batch(es) nearing expiry</span>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Rx Batches at Risk</span>
              <div className="text-xl font-black text-indigo-900 mt-1">
                {allBatchRows.filter(r => !r.isExpired && r.daysLeft <= 60 && isRxCategory(r.product)).length} Batches
              </div>
              <span className="text-[10px] text-indigo-600">Eligible for partner doctor intimation</span>
            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[10px] font-bold text-cyan-700 uppercase">Return Cutoff Window</span>
              <div className="text-xl font-black text-cyan-900 mt-1">60–90 Days</div>
              <span className="text-[10px] text-cyan-700">Distributor credit recovery cutoff</span>
            </div>
          </div>

          {/* ── 60–90 DAY PRE-EXPIRY DISTRIBUTOR RETURN-TO-VENDOR (RTV) BANNER ── */}
          <div className="bg-white border-2 border-slate-200/90 hover:border-indigo-200 rounded-2xl p-4.5 shadow-xs flex items-center justify-between flex-wrap gap-4 transition-all">
            <div className="flex items-start space-x-3.5 max-w-2xl">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 shrink-0 mt-0.5 shadow-2xs">
                <Truck className="w-6 h-6 text-indigo-700" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                    Return-to-Vendor (RTV) Pre-Expiry Policy
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    60–90 Day Statutory Window
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {rtvEligibleBatches.length} batch(es) nearing manufacturer return deadline ·{' '}
                  <span className="text-emerald-700 font-black">
                    ₹{totalRtvPotentialValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} recoverable credit
                  </span>
                </h3>
                <p className="text-[11.5px] text-slate-600 font-medium leading-relaxed">
                  Wholesale distributors accept near-expiry returns with 100% credit adjustment if debited 60–90 days prior to expiry. Avoid total inventory write-off by issuing batch debit notes today.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleAutomateAllRTVDebitNotes}
                disabled={rtvEligibleBatches.length === 0}
                className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 active:scale-95"
              >
                <Truck className="w-4 h-4 text-indigo-200" />
                <span>Auto-Return All 60–90d Batches</span>
              </button>
            </div>
          </div>

          {/* Task #42: Dual Filter Bar (Timeline Tabs + Rx vs OTC Pills) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2.5">
            {/* Row 1: Rx vs. OTC Segmented Filter (Task #42) */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
                <span>Regulatory Category:</span>
              </div>

              <div className="flex items-center space-x-1.5 text-xs font-bold">
                {[
                  { key: 'ALL',      label: `💊 All Medicines (${allBatchRows.length})` },
                  { key: 'RX_ONLY',  label: `🩺 Prescription (Rx) (${totalRxCount})` },
                  { key: 'OTC_ONLY', label: `🍬 Over-the-Counter (${totalOtcCount})` }
                ].map(pill => (
                  <button
                    key={pill.key}
                    onClick={() => setRxOtcFilter(pill.key as any)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      rxOtcFilter === pill.key
                        ? pill.key === 'RX_ONLY'
                          ? 'bg-indigo-700 text-white shadow-xs'
                          : pill.key === 'OTC_ONLY'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 2: Timeline Filter Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <button
                onClick={() => setActiveTab('EXPIRED')}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === 'EXPIRED'
                    ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                    : 'bg-rose-50/70 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <span>🚨 Expired</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{expiredBatches.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('NEAR_3')}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === 'NEAR_3'
                    ? 'bg-red-600 border-red-600 text-white shadow-xs'
                    : 'bg-red-50/70 border-red-200 text-red-700 hover:bg-red-100'
                }`}
              >
                <span>&lt; 3 Days</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{near3Batches.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('NEAR_7')}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === 'NEAR_7'
                    ? 'bg-orange-600 border-orange-600 text-white shadow-xs'
                    : 'bg-orange-50/70 border-orange-200 text-orange-700 hover:bg-orange-100'
                }`}
              >
                <span>&lt; 7 Days</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{near7Batches.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('NEAR_20')}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === 'NEAR_20'
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                    : 'bg-amber-50/70 border-amber-200 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <span>&lt; 20 Days</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{near20Batches.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('NEAR_30')}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === 'NEAR_30'
                    ? 'bg-yellow-600 border-yellow-600 text-white shadow-xs'
                    : 'bg-yellow-50/70 border-yellow-200 text-yellow-800 hover:bg-yellow-100'
                }`}
              >
                <span>&lt; 30 Days</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{near30Batches.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('NEAR_60')}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === 'NEAR_60'
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span>&lt; 60 Days</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20">{near60Batches.length}</span>
              </button>
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center space-x-2">
                <span>Batches in category ({displayedRows.length})</span>
                {rxOtcFilter !== 'ALL' && (
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    Filter: {rxOtcFilter === 'RX_ONLY' ? 'Prescription Rx' : 'OTC'}
                  </span>
                )}
              </span>
              <span className="text-slate-400 text-[11px]">
                Actions: Safe Disposal, "Ask Doctor" Rx Intimation &amp; Distributor Return (Debit Note)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '850px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3">Medicine &amp; Category</th>
                    <th className="px-3 py-3 text-center">Batch No</th>
                    <th className="px-3 py-3 text-center">Shelf Location</th>
                    <th className="px-3 py-3 text-center">Expiry Date</th>
                    <th className="px-3 py-3 text-center">Timeline</th>
                    <th className="px-3 py-3 text-center">Stock Qty</th>
                    <th className="px-3 py-3 text-right">Selling Price</th>
                    <th className="px-3 py-3 text-right">Loss Exposure</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No medicine batches found for this category and filter.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row, idx) => {
                      const lossVal = row.batch.stockQuantity * row.product.sellingPrice;
                      const isRx = isRxCategory(row.product);
                      const intimation = doctorIntimations.find(
                        d => d.productId === row.product._id && d.batchNumber === row.batch.batchNumber
                      );

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{row.product.name}</span>
                              {isRx ? (
                                <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">
                                  Rx {row.product.scheduleCategory}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded">
                                  OTC
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">{row.product.saltComposition}</div>
                            {intimation && (
                              <div className="mt-1 inline-flex items-center space-x-1 text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded-md font-bold">
                                <Stethoscope className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                                <span>Intimated to {intimation.doctorName} ({intimation.intimatedAt})</span>
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-3 text-center font-mono font-bold text-slate-800">
                            {row.batch.batchNumber}
                          </td>

                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => dispatch(setRackRoboModalOpen({
                                isOpen: true,
                                targetProductName: row.product.name,
                                targetLocation: row.batch.location || 'Rack B-01'
                              }))}
                              className="inline-flex items-center space-x-1 text-[10px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full hover:bg-cyan-100 cursor-pointer"
                              title="Highlight on 2D Pharmacy Floor Plan"
                            >
                              <MapPin className="w-2.5 h-2.5 text-cyan-600" />
                              <span>{row.batch.location || 'Rack B-01'}</span>
                            </button>
                          </td>

                          <td className="px-3 py-3 text-center font-bold text-slate-700">
                            {row.batch.expiryDate}
                          </td>

                          <td className="px-3 py-3 text-center">
                            {row.isExpired ? (
                              <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                                EXPIRED ({Math.abs(row.daysLeft)}d ago)
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                row.daysLeft <= 7
                                  ? 'bg-red-100 text-red-800 border border-red-300 font-black'
                                  : row.daysLeft <= 30
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}>
                                {row.daysLeft} days left
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-3 text-center font-black text-slate-900 text-sm">
                            {row.batch.stockQuantity}
                          </td>

                          <td className="px-3 py-3 text-right font-bold text-slate-800">
                            ₹{row.product.sellingPrice.toFixed(2)}
                          </td>

                          <td className="px-3 py-3 text-right font-black text-rose-700">
                            ₹{lossVal.toFixed(2)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5 flex-wrap gap-y-1">
                              {/* Ask Doctor Action Button on Near-Expiry Rx */}
                              {!row.isExpired && isRx && (
                                <button
                                  onClick={() => handleOpenAskDoctor(row)}
                                  className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1 active:scale-95 ${
                                    intimation
                                      ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border border-indigo-300'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  }`}
                                  title={intimation ? `Already intimated to ${intimation.doctorName}. Click to re-notify or send update` : "Intimate partner clinic doctors to prioritize dispensing this batch"}
                                >
                                  <Stethoscope className="w-3 h-3" />
                                  <span>{intimation ? 'Re-Ask Doctor' : 'Ask Doctor'}</span>
                                </button>
                              )}

                              {/* Return to Distributor (Debit Note) */}
                              {!row.isExpired && (
                                <button
                                  onClick={() => handleOpenDebitNoteModal(row)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1 active:scale-95"
                                  title="Issue formal supplier Debit Note before distributor return cutoff"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>Debit Note</span>
                                </button>
                              )}

                              {/* Dispose Stock Button */}
                              <button
                                onClick={() => handleOpenDisposal(row)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10.5px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1 active:scale-95"
                                title="Authorize regulatory PIN-approved disposal"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Dispose</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* VIEW 2: DISTRIBUTOR DEBIT NOTES & RTV (Task #43)                 */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {viewMode === 'DEBIT_NOTES' && (
        <div className="space-y-4">
          {/* Debit Notes KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                <span>Recovered Credit Value</span>
                <Percent className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-indigo-950 mt-1">
                ₹{supplierDebitNotes.reduce((sum, d) => sum + d.totalAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-indigo-600 mt-0.5">
                Saved through pre-expiry distributor return debits
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Dispatched RTV Shipments</span>
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {supplierDebitNotes.length} Notes
              </div>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                Acknowledged by wholesale distributor depots
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700">
                <span>RTV Return Policy</span>
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-sm font-black text-amber-950 mt-1">
                60–90 Days Pre-Expiry Window
              </div>
              <p className="text-[10px] text-amber-700 mt-0.5">
                Indian Pharma wholesale standard for 100% credit recovery
              </p>
            </div>
          </div>

          {/* Debit Notes Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-indigo-700" />
                <span>Supplier Debit Notes &amp; Return-to-Vendor Log ({supplierDebitNotes.length})</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Pre-expiry distributor credit recovery records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '800px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-2.5">Debit Note &amp; Slip No</th>
                    <th className="px-3 py-2.5">Wholesale Distributor</th>
                    <th className="px-3 py-2.5 text-center">Dispatch Date</th>
                    <th className="px-3 py-2.5">Batches Returned</th>
                    <th className="px-3 py-2.5 text-center">Cutoff Rule</th>
                    <th className="px-3 py-2.5 text-center">Settlement Status</th>
                    <th className="px-4 py-2.5 text-right">Debit Credit Value</th>
                    <th className="px-4 py-2.5 text-center">Actions &amp; Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierDebitNotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No supplier debit notes recorded yet.
                      </td>
                    </tr>
                  ) : (
                    supplierDebitNotes.map(dn => (
                      <tr key={dn.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-900">
                          <div>{dn.debitNoteNumber}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {dn.dispatchSlipNumber || 'SLIP-RTV-PENDING'}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-900">{dn.supplierName}</div>
                          {dn.gstin && (
                            <div className="text-[10px] text-slate-500 font-mono">GSTIN: {dn.gstin}</div>
                          )}
                          {dn.supplierContact && (
                            <div className="text-[10px] text-slate-400">{dn.supplierContact}</div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-600 font-medium">
                          <div>{dn.createdDate}</div>
                          {dn.settlementDate && (
                            <div className="text-[9px] text-emerald-700 font-bold">Settled: {dn.settlementDate}</div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="space-y-1">
                            {dn.items.map((item, i) => (
                              <div key={i} className="text-[11px] text-slate-700">
                                <strong>{item.quantity}x</strong> {item.productName}{' '}
                                <span className="text-[10px] font-mono text-slate-400">({item.batchNumber})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            {dn.cutoffWindowDays}d Cutoff
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              dn.status === 'CREDIT_RECEIVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : dn.status === 'ACKNOWLEDGED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {dn.status.replace(/_/g, ' ')}
                            </span>

                            {/* Status Quick Cycle Selector */}
                            <select
                              value={dn.status}
                              onChange={e => handleUpdateDNStatus(dn.id, e.target.value as any)}
                              className="text-[9.5px] p-0.5 border border-slate-200 rounded-md bg-white font-semibold text-slate-700 cursor-pointer"
                              title="Update distributor debit settlement lifecycle"
                            >
                              <option value="DISPATCHED">Dispatched</option>
                              <option value="ACKNOWLEDGED">Acknowledged</option>
                              <option value="CREDIT_RECEIVED">Credit Received</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-indigo-900 text-sm">
                          ₹{dn.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedDebitNoteForSlip(dn)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1 active:scale-95"
                            title="View and print official commercial debit note slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                💡 Distributor Debit Notes debit the supplier's payable balance and ensure full credit compensation before stock expires.
              </span>
              <button
                onClick={() => setViewMode('BATCHES')}
                className="text-indigo-700 hover:underline font-bold cursor-pointer"
              >
                ← Back to Expiry Batches
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: TASK #42 "ASK DOCTOR" PRIORITY DISPENSING               */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {askDoctorBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-heading">
                    Ask Doctor — Priority Rx Dispensing
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Intimate affiliated clinics to prioritize near-expiry prescription batches
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAskDoctorBatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Medicine Info */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-xs space-y-1">
              <div className="font-extrabold text-indigo-950 text-sm">
                {askDoctorBatch.product.name}
              </div>
              <div className="text-indigo-800 text-[11px]">
                Salt: {askDoctorBatch.product.saltComposition || 'Standard formulation'}
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-700 pt-1">
                <span>Batch: <strong>{askDoctorBatch.batch.batchNumber}</strong></span>
                <span>Stock: <strong>{askDoctorBatch.batch.stockQuantity} Units</strong></span>
                <span className="text-amber-800 font-bold">Expires in ~{askDoctorBatch.daysLeft} days</span>
              </div>
            </div>

            {/* Partner Doctor Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Select Partner Doctor / Clinic:
              </label>
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
              >
                {PARTNER_DOCTORS.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialty} ({doc.clinic})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Doctor Instruction Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Custom Instruction / Prescribing Request:
              </label>
              <textarea
                value={customDoctorNote}
                onChange={e => setCustomDoctorNote(e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                placeholder="e.g. Kindly consider for routine review patients this week..."
              />
            </div>

            {/* Clinical Memo Message Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700">Pre-Composed Clinical Memo Preview:</label>
                {memoCopied && (
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Copied to Clipboard!</span>
                  </span>
                )}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {getClinicalMemoText()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyMemo}
                className="py-2 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{memoCopied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleRecordIntimationOnly}
                className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
                title="Mark batch as intimated without opening messaging apps"
              >
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mark Intimated</span>
              </button>

              <button
                type="button"
                onClick={handleSendSMS}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Send SMS</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: TASK #43 RETURN TO DISTRIBUTOR (DEBIT NOTE)             */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {debitNoteBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-heading">
                    Issue Distributor Return Debit Note
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Recover 100% wholesale credit before distributor return cutoff window
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDebitNoteBatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Batch Details */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
              <div className="font-extrabold text-amber-950 text-sm">
                {debitNoteBatch.product.name}
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-700">
                <span>Batch: <strong>{debitNoteBatch.batch.batchNumber}</strong></span>
                <span>Expiry: <strong>{debitNoteBatch.batch.expiryDate}</strong></span>
                <span className="text-rose-700 font-bold">~{debitNoteBatch.daysLeft} days left</span>
              </div>
            </div>

            {/* Supplier Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Select Authorized Distributor:
              </label>
              <select
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
              >
                {suppliers.map(s => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name} — {s.contactPerson} ({s.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantities and Purchase Rate */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Return Quantity *</label>
                <input
                  type="number"
                  min="1"
                  max={debitNoteBatch.batch.stockQuantity}
                  value={debitReturnQty}
                  onChange={e => setDebitReturnQty(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
                <span className="text-[10px] text-slate-400">Available: {debitNoteBatch.batch.stockQuantity}</span>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Purchase Cost / Unit (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={debitPurchaseRate}
                  onChange={e => setDebitPurchaseRate(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>
            </div>

            {/* Total Credit Recovery Calculation */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-medium">Total Credit Value to Recover:</span>
                <div className="text-[10px] text-slate-400">{debitReturnQty} units × ₹{debitPurchaseRate.toFixed(2)}</div>
              </div>
              <div className="text-base font-black text-indigo-900">
                ₹{(debitReturnQty * debitPurchaseRate).toFixed(2)}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Return Memo / Dispatch Notes</label>
              <input
                type="text"
                value={debitRemarks}
                onChange={e => setDebitRemarks(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                placeholder="RTV shipment note..."
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDebitNoteBatch(null)}
                className="py-2 px-4 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleIssueDebitNote}
                className="py-2 px-4 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Issue Debit Note &amp; Deduct Stock</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISPOSAL MODAL ──────────────────────────────────────────── */}
      {targetBatchRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-heading">
                    Authorize Stock Disposal
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mandatory 4-Digit Manager PIN approval required
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTargetBatchRow(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDisposal} className="space-y-3 text-xs font-semibold">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <div className="font-bold text-rose-950">{targetBatchRow.product.name}</div>
                <div className="text-[11px] text-rose-800 mt-0.5">
                  Batch: {targetBatchRow.batch.batchNumber} · Available: {targetBatchRow.batch.stockQuantity} Units
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Disposal Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={targetBatchRow.batch.stockQuantity}
                  value={disposalQty}
                  onChange={e => setDisposalQty(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Reason for Disposal</label>
                <select
                  value={disposalReason}
                  onChange={e => setDisposalReason(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-medium"
                >
                  <option value="EXPIRED">Expired Past Retention Period</option>
                  <option value="DAMAGED_PACKAGING">Damaged / Broken Packaging</option>
                  <option value="RECALLED_BY_GOVT">Government / Drug Authority Recall</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Manager Authorization PIN (Default: 1234) *</label>
                <input
                  type="password"
                  maxLength={4}
                  value={managerPin}
                  onChange={e => setManagerPin(e.target.value)}
                  placeholder="••••"
                  className="w-full p-2 border border-slate-300 rounded-xl tracking-widest text-center text-sm font-mono font-bold focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setTargetBatchRow(null)}
                  className="py-2 px-4 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Authorize &amp; Destroy Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: PARTNER CLINIC NEAR-EXPIRY RX CIRCULAR (Task #42)        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isCircularModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">
                    Partner Clinics — Near-Expiry Prescription Priority Circular
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official clinical intimation circular for affiliated doctors to prioritize early medication rotation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCircularModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex justify-between">
                  <span>Issued By: {storeSettings.storeName || 'GENQUANTAA Pharmacy'}</span>
                  <span>Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Target Clinics: Apollo Health Clinic, Care Family Clinic, Diabetes Care Center, Chest &amp; Allergy Care
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Prescription (Rx) Batches Requiring Priority Dispensing ({allBatchRows.filter(r => !r.isExpired && r.daysLeft <= 60 && isRxCategory(r.product)).length} Batches)
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Medicine &amp; Salt</th>
                        <th className="px-2 py-2 text-center">Batch</th>
                        <th className="px-2 py-2 text-center">Expiry</th>
                        <th className="px-2 py-2 text-center">Days Left</th>
                        <th className="px-2 py-2 text-center">In-Stock</th>
                        <th className="px-3 py-2 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {allBatchRows
                        .filter(r => !r.isExpired && r.daysLeft <= 60 && isRxCategory(r.product))
                        .map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2">
                              <span className="font-bold text-slate-900">{r.product.name}</span>
                              <div className="text-[10px] text-slate-500">{r.product.saltComposition}</div>
                            </td>
                            <td className="px-2 py-2 text-center font-mono text-[11px]">{r.batch.batchNumber}</td>
                            <td className="px-2 py-2 text-center font-semibold text-[11px]">{r.batch.expiryDate}</td>
                            <td className="px-2 py-2 text-center">
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                {r.daysLeft}d
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center font-bold">{r.batch.stockQuantity}</td>
                            <td className="px-3 py-2 text-right font-semibold">₹{r.product.sellingPrice.toFixed(2)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  const circularText = allBatchRows
                    .filter(r => !r.isExpired && r.daysLeft <= 60 && isRxCategory(r.product))
                    .map(r => `• ${r.product.name} (${r.batch.batchNumber}) - Exp: ${r.batch.expiryDate} (${r.daysLeft}d) - Qty: ${r.batch.stockQuantity}`)
                    .join('\n');
                  navigator.clipboard.writeText(`CLINICAL CIRCULAR: PRIORITY PRESCRIPTION ROTATION\nFrom: ${storeSettings.storeName}\n\n${circularText}`);
                  alert('Clinical Circular text copied to clipboard!');
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Text Summary</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsCircularModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Circular</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: PRINTABLE SUPPLIER DEBIT NOTE & DISPATCH SLIP (Task #43)  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {selectedDebitNoteForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">
                    Distributor Debit Note &amp; RTV Dispatch Slip
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official return-to-vendor credit claim under wholesale pharmaceutical distribution guidelines
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDebitNoteForSlip(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Memo Container */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 border border-slate-200 rounded-xl p-5 bg-slate-50/50 text-xs">
              
              {/* Pharmacy Letterhead */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 font-heading">
                    {storeSettings.storeName || 'GENQUANTAA PHARMACY & HEALTHCARE'}
                  </h2>
                  <p className="text-[11px] text-slate-600">{storeSettings.address || 'Door No: 12-4-88, Medical Center Road, Jubilee Hills, Hyderabad - 500033'}</p>
                  <p className="text-[11px] text-slate-500">DL: {storeSettings.dlNumber || 'DL-20B/TG/10492, DL-21B/TG/10493'} · Phone: {storeSettings.phone || '+91 98765 43210'}</p>
                  <p className="text-[11px] text-slate-500 font-mono font-bold">GSTIN: {storeSettings.gstin || '36AABCG9102K1ZT'}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-indigo-700 text-white font-black text-[11px] rounded-lg tracking-wider uppercase block mb-1">
                    COMMERCIAL DEBIT NOTE
                  </span>
                  <div className="font-mono font-extrabold text-indigo-950 text-sm">{selectedDebitNoteForSlip.debitNoteNumber}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Slip: {selectedDebitNoteForSlip.dispatchSlipNumber || 'SLIP-RTV-2026-01'}</div>
                  <div className="text-[11px] text-slate-600 font-bold mt-0.5">Date: {selectedDebitNoteForSlip.createdDate}</div>
                </div>
              </div>

              {/* Distributor & Return Info Box */}
              <div className="grid grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    ISSUED TO DISTRIBUTOR / WHOLESALE DEPOT:
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{selectedDebitNoteForSlip.supplierName}</div>
                  {selectedDebitNoteForSlip.gstin && (
                    <div className="text-[11px] text-slate-600 font-mono">GSTIN: <strong>{selectedDebitNoteForSlip.gstin}</strong></div>
                  )}
                  {selectedDebitNoteForSlip.supplierContact && (
                    <div className="text-[11px] text-slate-600">Contact: {selectedDebitNoteForSlip.supplierContact}</div>
                  )}
                  <div className="text-[11px] text-slate-500">Return Policy Category: <strong>60–90 Days Pre-Expiry Window</strong></div>
                </div>

                <div className="text-right flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      SETTLEMENT STATUS:
                    </span>
                    <span className={`inline-block text-[11px] font-black px-2.5 py-1 rounded-full ${
                      selectedDebitNoteForSlip.status === 'CREDIT_RECEIVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedDebitNoteForSlip.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {selectedDebitNoteForSlip.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {selectedDebitNoteForSlip.settlementDate && (
                    <div className="text-[11px] text-emerald-800 font-bold">
                      Settled on: {selectedDebitNoteForSlip.settlementDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  RETURNED PHARMACEUTICAL BATCH DETAILS:
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Item Description</th>
                        <th className="px-2 py-2 text-center">Batch No</th>
                        <th className="px-2 py-2 text-center">Expiry</th>
                        <th className="px-2 py-2 text-center">Qty Returned</th>
                        <th className="px-3 py-2 text-right">Purchase Rate</th>
                        <th className="px-3 py-2 text-right">Debit Credit Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDebitNoteForSlip.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            {item.productName}
                          </td>
                          <td className="px-2 py-2.5 text-center font-mono text-[11px] font-bold text-slate-700">
                            {item.batchNumber}
                          </td>
                          <td className="px-2 py-2.5 text-center font-semibold text-[11px] text-slate-700">
                            {item.expiryDate}
                          </td>
                          <td className="px-2 py-2.5 text-center font-black text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium">
                            ₹{item.purchaseRate.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-black text-indigo-900">
                            ₹{item.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan={5} className="px-3 py-2.5 text-right text-slate-700 uppercase tracking-wider text-[11px]">
                          Total Recoverable Distributor Credit:
                        </td>
                        <td className="px-3 py-2.5 text-right text-base font-black text-indigo-900">
                          ₹{selectedDebitNoteForSlip.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Remarks / Memo */}
              {selectedDebitNoteForSlip.remarks && (
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Return Memo:</span>
                  <p className="text-[11px] text-slate-700 italic">{selectedDebitNoteForSlip.remarks}</p>
                </div>
              )}

              {/* Statutory Certification & Signatures */}
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  <strong>Declaration:</strong> Certified that the pharmaceutical stock specified above is returned in original, untampered condition within the agreed 60–90 days pre-expiry distributor return window. Please adjust this debit note amount against our upcoming wholesale account purchases.
                </p>

                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div className="text-center border-t border-slate-300 pt-2">
                    <span className="text-[11px] font-bold text-slate-800 block">Authorized Chief Pharmacist</span>
                    <span className="text-[10px] text-slate-500 font-mono">Reg. No: PH-2024-91823 · Seal &amp; Sign</span>
                  </div>
                  <div className="text-center border-t border-slate-300 pt-2">
                    <span className="text-[11px] font-bold text-slate-800 block">Wholesale Depot Receiving Agent</span>
                    <span className="text-[10px] text-slate-500">Goods Inward &amp; Acknowledgment Stamp</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const slipSummary = `COMMERCIAL DEBIT NOTE: ${selectedDebitNoteForSlip.debitNoteNumber}\nWholesale Supplier: ${selectedDebitNoteForSlip.supplierName}\nDispatch Date: ${selectedDebitNoteForSlip.createdDate}\nTotal Credit: ₹${selectedDebitNoteForSlip.totalAmount.toFixed(2)}\nItems:\n` +
                    selectedDebitNoteForSlip.items.map(it => `• ${it.quantity}x ${it.productName} (Batch: ${it.batchNumber}, Exp: ${it.expiryDate}) - ₹${it.totalAmount.toFixed(2)}`).join('\n');
                  navigator.clipboard.writeText(slipSummary);
                  setSlipCopied(true);
                  setTimeout(() => setSlipCopied(false), 2500);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer"
              >
                {slipCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{slipCopied ? 'Slip Copied!' : 'Copy Summary'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedDebitNoteForSlip(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Dispatch Slip</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
