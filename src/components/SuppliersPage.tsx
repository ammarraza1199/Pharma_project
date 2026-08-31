import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  addSupplier,
  navigateTo,
  recordSupplierPayment,
  addSupplierBill
} from '../store/posSlice';
import type { SupplierRecord, SupplierBill, SupplierPaymentLog } from '../types/pos';
import {
  Building, Search, Plus, Truck, DollarSign, X, ShieldCheck,
  TrendingUp, Sparkles, Award, Zap, Percent, Clock, Phone,
  Mail, MapPin, CheckCircle2, ChevronRight, Info, Filter, ArrowUpDown,
  CreditCard, FileText, Calendar, AlertTriangle, CheckCircle, Receipt,
  Send, History, Landmark, QrCode
} from 'lucide-react';

type PageTab = 'PROCUREMENT_INTELLIGENCE' | 'DIRECTORY' | 'BILLS_LEDGER' | 'PAYMENT_LOGS';
type FilterCategory = 'ALL' | 'RECOMMENDED' | 'HIGH_MARGIN' | 'HIGH_REBATE' | 'FAST_DELIVERY' | 'ZERO_DUES';
type BillFilter = 'ALL' | 'CREDIT_PENDING' | 'CASH_PAID' | 'DUE_SOON' | 'OVERDUE';
type SortOption = 'margin_desc' | 'discount_desc' | 'rebate_desc' | 'speed_asc' | 'score_desc' | 'dues_desc';
type SchemeCategoryFilter = 'ALL' | 'BUY_X_GET_Y' | 'COMBO_OFFER' | 'SUBSTITUTE_SAVER' | 'HIGH_MARGIN';

export const SuppliersPage: React.FC = () => {
  const dispatch = useDispatch();
  const suppliers = useSelector((state: RootState) => state.pos.suppliers);
  const supplierBills = useSelector((state: RootState) => state.pos.supplierBills || []);
  const supplierPaymentLogs = useSelector((state: RootState) => state.pos.supplierPaymentLogs || []);
  const distributorSchemes = useSelector((state: RootState) => state.pos.distributorSchemes || []);

  const [activePageTab, setActivePageTab] = useState<PageTab>('PROCUREMENT_INTELLIGENCE');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [schemeCategoryFilter, setSchemeCategoryFilter] = useState<SchemeCategoryFilter>('ALL');
  const [billFilter, setBillFilter] = useState<BillFilter>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('margin_desc');

  // Modals State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showNewBillModal, setShowNewBillModal] = useState<boolean>(false);
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState<SupplierRecord | null>(null);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<SupplierRecord | null>(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<SupplierBill | null>(null);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'NEFT_RTGS' | 'CASH' | 'CHEQUE'>('NEFT_RTGS');
  const [paymentRef, setPaymentRef] = useState<string>(`NEFT${Date.now().toString().slice(-8)}`);
  const [paymentNotes, setPaymentNotes] = useState<string>('Repayment settlement');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Bill Form State
  const [billSupplierId, setBillSupplierId] = useState<string>(suppliers[0]?.supplierId || '');
  const [billInvoiceNo, setBillInvoiceNo] = useState<string>(`INV-SUP-${Math.floor(10000 + Math.random() * 90000)}`);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [billType, setBillType] = useState<'CASH' | 'CREDIT'>('CREDIT');
  const [billTotalAmount, setBillTotalAmount] = useState<number>(12500);
  const [billCreditDays, setBillCreditDays] = useState<number>(15);
  const [billNotes, setBillNotes] = useState<string>('Stock shipment invoice');

  // Register Supplier Form State
  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gstin, setGstin] = useState<string>('36AAACM8890A1Z2');
  const [dlNumber, setDlNumber] = useState<string>('DL-1005/HYD');
  const [address, setAddress] = useState<string>('Pharma City, Hyderabad');
  const [tradeDiscountPercent, setTradeDiscountPercent] = useState<number>(22);
  const [rebatePercent, setRebatePercent] = useState<number>(3.0);
  const [liquidMarginPercent, setLiquidMarginPercent] = useState<number>(25.0);
  const [creditPeriodDays, setCreditPeriodDays] = useState<number>(15);
  const [deliveryLeadTimeHours, setDeliveryLeadTimeHours] = useState<number>(6);
  const [topBrandsInput, setTopBrandsInput] = useState<string>('Abbott, Cipla, Sun Pharma');

  // ── Metrics Calculation ──────────────────────────────────────────────────
  const now = new Date();
  const totalSuppliers = suppliers.length;
  const totalPendingDues = suppliers.reduce((sum, s) => sum + s.pendingBalance, 0);

  const bestMarginSupplier = [...suppliers].sort((a, b) => (b.liquidMarginPercent || 0) - (a.liquidMarginPercent || 0))[0];
  const bestRebateSupplier = [...suppliers].sort((a, b) => (b.rebatePercent || 0) - (a.rebatePercent || 0))[0];
  const fastestSupplier = [...suppliers].sort((a, b) => (a.deliveryLeadTimeHours || 24) - (b.deliveryLeadTimeHours || 24))[0];

  // Bills Breakdown Calculations
  const creditBills = supplierBills.filter(b => b.billType === 'CREDIT');
  const cashBills = supplierBills.filter(b => b.billType === 'CASH');
  const pendingCreditBills = creditBills.filter(b => b.status === 'PENDING' || b.status === 'PARTIAL');

  // Repayment due urgency (<3 days, 10 days, 15 days)
  const dueWithin3Days = pendingCreditBills.filter(b => {
    const due = new Date(b.dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 3 && diff >= 0;
  });

  const dueWithin15Days = pendingCreditBills.filter(b => {
    const due = new Date(b.dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 3 && diff <= 15;
  });

  const overdueBills = pendingCreditBills.filter(b => {
    const due = new Date(b.dueDate);
    return due.getTime() < now.getTime();
  });

  // Filtered Suppliers List
  const processedSuppliers = useMemo(() => {
    let result = suppliers.filter(s => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesBasic = s.name.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.gstin.toLowerCase().includes(q) ||
          s.dlNumber.toLowerCase().includes(q) ||
          s.phone.includes(q);
        const matchesBrands = (s.topBrandsSupplied || []).some(b => b.toLowerCase().includes(q));
        if (!matchesBasic && !matchesBrands) return false;
      }

      if (filterCategory === 'RECOMMENDED') return !!s.recommendationTag;
      if (filterCategory === 'HIGH_MARGIN') return (s.liquidMarginPercent || 0) >= 25;
      if (filterCategory === 'HIGH_REBATE') return (s.rebatePercent || 0) >= 3.5;
      if (filterCategory === 'FAST_DELIVERY') return (s.deliveryLeadTimeHours || 24) <= 6;
      if (filterCategory === 'ZERO_DUES') return s.pendingBalance === 0;

      return true;
    });

    result.sort((a, b) => {
      switch (sortOption) {
        case 'margin_desc':
          return (b.liquidMarginPercent || 0) - (a.liquidMarginPercent || 0);
        case 'discount_desc':
          return (b.tradeDiscountPercent || 0) - (a.tradeDiscountPercent || 0);
        case 'rebate_desc':
          return (b.rebatePercent || 0) - (a.rebatePercent || 0);
        case 'speed_asc':
          return (a.deliveryLeadTimeHours || 24) - (b.deliveryLeadTimeHours || 24);
        case 'score_desc':
          return (b.performanceScore || 0) - (a.performanceScore || 0);
        case 'dues_desc':
          return b.pendingBalance - a.pendingBalance;
        default:
          return 0;
      }
    });

    return result;
  }, [suppliers, searchTerm, filterCategory, sortOption]);

  // Filtered Bills List
  const processedBills = useMemo(() => {
    return supplierBills.filter(b => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = b.invoiceNumber.toLowerCase().includes(q) ||
          b.supplierName.toLowerCase().includes(q) ||
          (b.notes || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (billFilter === 'CREDIT_PENDING') return b.billType === 'CREDIT' && b.pendingAmount > 0;
      if (billFilter === 'CASH_PAID') return b.billType === 'CASH' || b.status === 'PAID';
      if (billFilter === 'DUE_SOON') {
        const due = new Date(b.dueDate);
        const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return b.pendingAmount > 0 && diff <= 15 && diff >= 0;
      }
      if (billFilter === 'OVERDUE') {
        const due = new Date(b.dueDate);
        return b.pendingAmount > 0 && due.getTime() < now.getTime();
      }

      return true;
    });
  }, [supplierBills, searchTerm, billFilter]);

  // Filtered Payment Logs
  const processedPaymentLogs = useMemo(() => {
    return supplierPaymentLogs.filter(p => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return p.supplierName.toLowerCase().includes(q) ||
          p.referenceNo.toLowerCase().includes(q) ||
          (p.billInvoiceNo || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [supplierPaymentLogs, searchTerm]);

  // Filtered Distributor Schemes for Procurement Intelligence
  const processedSchemes = useMemo(() => {
    return distributorSchemes.filter(s => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = s.title.toLowerCase().includes(q) ||
          s.primaryProduct.toLowerCase().includes(q) ||
          s.saltComposition.toLowerCase().includes(q) ||
          s.supplierName.toLowerCase().includes(q) ||
          (s.substituteOption?.brandName || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (schemeCategoryFilter === 'BUY_X_GET_Y') return s.dealType === 'BUY_X_GET_Y';
      if (schemeCategoryFilter === 'COMBO_OFFER') return s.dealType === 'COMBO_OFFER';
      if (schemeCategoryFilter === 'SUBSTITUTE_SAVER') return s.dealType === 'SUBSTITUTE_COST_SAVER' || !!s.substituteOption;
      if (schemeCategoryFilter === 'HIGH_MARGIN') return s.effectiveMarginPercent >= 30;
      return true;
    });
  }, [distributorSchemes, searchTerm, schemeCategoryFilter]);

  // Handlers
  const handleOpenPaymentForSupplier = (sup: SupplierRecord) => {
    setSelectedSupplierForPayment(sup);
    setSelectedBillForPayment(null);
    setPaymentAmount(sup.pendingBalance);
    setPaymentRef(`NEFT${Date.now().toString().slice(-8)}`);
    setPaymentNotes(`Payment settlement to ${sup.name}`);
    setShowPaymentModal(true);
  };

  const handleOpenPaymentForBill = (bill: SupplierBill) => {
    const sup = suppliers.find(s => s.supplierId === bill.supplierId) || null;
    setSelectedSupplierForPayment(sup);
    setSelectedBillForPayment(bill);
    setPaymentAmount(bill.pendingAmount);
    setPaymentRef(`NEFT${Date.now().toString().slice(-8)}`);
    setPaymentNotes(`Settlement against Invoice ${bill.invoiceNumber}`);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPayment || paymentAmount <= 0) return;

    dispatch(recordSupplierPayment({
      supplierId: selectedSupplierForPayment.supplierId,
      amount: paymentAmount,
      paymentMode,
      referenceNo: paymentRef,
      billInvoiceNo: selectedBillForPayment?.invoiceNumber,
      notes: paymentNotes
    }));

    setShowPaymentModal(false);
    setSuccessToast(`Recorded payment of ₹${paymentAmount.toLocaleString('en-IN')} via ${paymentMode} to ${selectedSupplierForPayment.name}!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.supplierId === billSupplierId);
    if (!sup) return;

    const bDate = new Date(billDate);
    const dueDate = new Date(bDate.getTime() + (billType === 'CREDIT' ? billCreditDays : 0) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const isPaid = billType === 'CASH';

    dispatch(addSupplierBill({
      supplierId: sup.supplierId,
      supplierName: sup.name,
      invoiceNumber: billInvoiceNo,
      billDate,
      billType,
      totalAmount: billTotalAmount,
      paidAmount: isPaid ? billTotalAmount : 0,
      pendingAmount: isPaid ? 0 : billTotalAmount,
      creditDays: billType === 'CREDIT' ? billCreditDays : 0,
      dueDate,
      status: isPaid ? 'PAID' : 'PENDING',
      notes: billNotes
    }));

    setShowNewBillModal(false);
    setSuccessToast(`Logged ${billType === 'CASH' ? 'Cash Bill' : `Credit Bill (${billCreditDays} Days Repayment)`} for ${sup.name}!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const brandsArray = topBrandsInput
      .split(',')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    dispatch(addSupplier({
      name,
      contactPerson,
      phone,
      email,
      gstin,
      dlNumber,
      address,
      pendingBalance: 0,
      tradeDiscountPercent,
      rebatePercent,
      liquidMarginPercent,
      creditPeriodDays,
      deliveryLeadTimeHours,
      topBrandsSupplied: brandsArray.length > 0 ? brandsArray : ['Generic Pharma'],
      recommendationTag: liquidMarginPercent >= 26 ? 'BEST_MARGIN' : rebatePercent >= 3.5 ? 'TOP_REBATE' : undefined,
      performanceScore: 95,
      returnAcceptanceRate: 100
    }));

    setShowAddModal(false);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setSuccessToast(`Registered distributor ${name} successfully!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const getTagBadge = (tag?: SupplierRecord['recommendationTag']) => {
    switch (tag) {
      case 'BEST_MARGIN':
        return { label: '⭐ Top Liquid Margin', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'TOP_REBATE':
        return { label: '💰 Highest Cash Rebate', bg: 'bg-teal-50 text-teal-800 border-teal-300' };
      case 'FAST_FULFILLMENT':
        return { label: '⚡ Express SLA (3h)', bg: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'OVERALL_VALUE':
        return { label: '🏆 Best Overall Value', bg: 'bg-violet-50 text-violet-800 border-violet-300' };
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4 font-sans select-none">

      {/* ── TOP HEADER & ACTIONS (LIGHT TEAL & EMERALD ACCENTS) ───────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Building className="w-6 h-6 text-emerald-600" />
            <span>Supplier &amp; Vendor Management Directory</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage authorized distributors, Cash/Credit Invoices, 10/15-day repayment schedules &amp; payment logs
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Record Payment Button (Light Teal Theme) */}
          <button
            onClick={() => {
              setSelectedSupplierForPayment(suppliers[0] || null);
              setSelectedBillForPayment(null);
              setPaymentAmount(suppliers[0]?.pendingBalance || 0);
              setShowPaymentModal(true);
            }}
            className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>Record Payment</span>
          </button>

          {/* Log Supplier Bill Button */}
          <button
            onClick={() => setShowNewBillModal(true)}
            className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>+ Log Supplier Bill</span>
          </button>

          {/* Register New Vendor Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Vendor</span>
          </button>
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ─────────────────────────────────────────── */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── REPAYMENT DUE DATE TRACKER & KPI CARDS (LIGHT TEAL/EMERALD/AMBER) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Outstanding Dues */}
        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-amber-500 p-2.5 rounded-xl text-white flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Total Accounts Payable</p>
            <h3 className="text-xl font-black text-amber-900 font-heading">₹{totalPendingDues.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-slate-500 font-semibold">{pendingCreditBills.length} Pending Invoices</p>
          </div>
        </div>

        {/* Due in <=3 Days / Overdue (Repayment Alert) */}
        <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/30 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-rose-500 p-2.5 rounded-xl text-white flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-rose-900 uppercase tracking-wider">Due in ≤3 Days / Overdue</p>
            <h3 className="text-xl font-black text-rose-700 font-heading">
              {dueWithin3Days.length + overdueBills.length} Invoices
            </h3>
            <p className="text-[10px] text-rose-800 font-bold">
              ₹{(dueWithin3Days.concat(overdueBills).reduce((s, b) => s + b.pendingAmount, 0)).toLocaleString('en-IN')} Immediate Repay
            </p>
          </div>
        </div>

        {/* Due in 10-15 Days (Soft Teal) */}
        <div className="bg-white rounded-2xl border border-teal-200 bg-teal-50/20 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-teal-600 p-2.5 rounded-xl text-white flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">Due in 10–15 Days</p>
            <h3 className="text-xl font-black text-teal-700 font-heading">
              {dueWithin15Days.length} Invoices
            </h3>
            <p className="text-[10px] text-teal-700 font-semibold">
              ₹{(dueWithin15Days.reduce((s, b) => s + b.pendingAmount, 0)).toLocaleString('en-IN')} Upcoming
            </p>
          </div>
        </div>

        {/* Cash Bills Settled */}
        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Settled Bills &amp; Logs</p>
            <h3 className="text-xl font-black text-emerald-700 font-heading">
              {cashBills.length + supplierPaymentLogs.length} Records
            </h3>
            <p className="text-[10px] text-emerald-700 font-bold">100% Cleared History</p>
          </div>
        </div>
      </div>

      {/* ── FOUR MAIN PAGE TABS ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex items-center space-x-1.5 overflow-x-auto">
        <button
          onClick={() => setActivePageTab('PROCUREMENT_INTELLIGENCE')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activePageTab === 'PROCUREMENT_INTELLIGENCE'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Procurement Intelligence ({distributorSchemes.length} Deals)</span>
        </button>

        <button
          onClick={() => setActivePageTab('DIRECTORY')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activePageTab === 'DIRECTORY'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Suppliers &amp; Margins ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActivePageTab('BILLS_LEDGER')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activePageTab === 'BILLS_LEDGER'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices Ledger ({supplierBills.length})</span>
        </button>

        <button
          onClick={() => setActivePageTab('PAYMENT_LOGS')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
            activePageTab === 'PAYMENT_LOGS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Payment Logs ({supplierPaymentLogs.length})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 0: PROCUREMENT INTELLIGENCE & DISTRIBUTOR SCHEMES              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activePageTab === 'PROCUREMENT_INTELLIGENCE' && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="inline-flex items-center space-x-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-emerald-300 text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Procurement Intelligence Engine</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Distributor Schemes, Combo Deals &amp; Wholesale Substitutes
                </h2>
                <p className="text-xs text-emerald-200/80 mt-1 max-w-2xl">
                  Compare live distributor discount schemes (10+2 Free, Combo packs) and wholesale generic substitute picks with high margins to lower purchasing costs.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[110px]">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold">Active Deals</p>
                  <p className="text-xl font-black text-white">{distributorSchemes.length}</p>
                </div>
                <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-3 border border-emerald-400/30 text-center min-w-[110px]">
                  <p className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">Max Margin</p>
                  <p className="text-xl font-black text-amber-300">69.2%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by medicine, salt composition, distributor, or generic substitute..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Scheme Category Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => setSchemeCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  schemeCategoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Schemes ({distributorSchemes.length})
              </button>
              <button
                onClick={() => setSchemeCategoryFilter('BUY_X_GET_Y')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  schemeCategoryFilter === 'BUY_X_GET_Y'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🎁 10+2 Free Schemes
              </button>
              <button
                onClick={() => setSchemeCategoryFilter('COMBO_OFFER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  schemeCategoryFilter === 'COMBO_OFFER'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📦 Combo Deals
              </button>
              <button
                onClick={() => setSchemeCategoryFilter('SUBSTITUTE_SAVER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  schemeCategoryFilter === 'SUBSTITUTE_SAVER'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🔄 Substitute Pick
              </button>
              <button
                onClick={() => setSchemeCategoryFilter('HIGH_MARGIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  schemeCategoryFilter === 'HIGH_MARGIN'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🔥 High Margin (&gt;30%)
              </button>
            </div>
          </div>

          {/* Schemes Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {processedSchemes.map((scheme) => (
              <div
                key={scheme.schemeId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Supplier & Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{scheme.supplierName}</h4>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Valid till: {scheme.validTill}</span>
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full border border-emerald-200 tracking-wide">
                      {scheme.badgeTag}
                    </span>
                  </div>

                  {/* Title & Salt */}
                  <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900">{scheme.title}</h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Salt Composition: <span className="font-semibold text-slate-800">{scheme.saltComposition}</span>
                    </p>
                  </div>

                  {/* Deal Details & Combos */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Buy Qty</p>
                      <p className="text-sm font-black text-emerald-800">{scheme.buyQuantity} Boxes</p>
                    </div>
                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                      <p className="text-[10px] text-amber-700 font-bold uppercase">Free Bonus</p>
                      <p className="text-sm font-black text-amber-800">+{scheme.freeQuantity} Free</p>
                    </div>
                    <div className="bg-teal-50/60 p-2.5 rounded-xl border border-teal-100">
                      <p className="text-[10px] text-teal-700 font-bold uppercase">Trade Margin</p>
                      <p className="text-sm font-black text-teal-800">{scheme.effectiveMarginPercent}%</p>
                    </div>
                  </div>

                  {/* Combo Items if present */}
                  {scheme.comboItems && scheme.comboItems.length > 0 && (
                    <div className="mb-4 bg-amber-50/40 rounded-xl p-3 border border-amber-200/60">
                      <p className="text-[11px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>Included Combo Bundles:</span>
                      </p>
                      <ul className="text-xs text-amber-900/80 space-y-0.5 pl-4 list-disc font-medium">
                        {scheme.comboItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Wholesale Substitute Pick Feature (Requirement #20 / #21) */}
                  {scheme.substituteOption && (
                    <div className="mb-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-3 border border-teal-200/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-black text-teal-900 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          Wholesale Generic Substitute Pick
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-teal-600 text-white rounded-full">
                          {scheme.substituteOption.marginPercent}% MARGIN
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-800">
                        <div>
                          <p className="font-bold text-slate-900">{scheme.substituteOption.brandName}</p>
                          <p className="text-[10px] text-slate-500">By {scheme.substituteOption.manufacturer}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 line-through">MRP: ₹{scheme.substituteOption.mrp}</p>
                          <p className="font-black text-emerald-700">Rate: ₹{scheme.substituteOption.purchaseRate}/strip</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action: Order in Advance to Selected Distributor */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    <span>Min Order: </span>
                    <span className="font-bold text-slate-700">₹{scheme.minOrderValue || 2000}</span>
                  </div>

                  <button
                    onClick={() => {
                      setSuccessToast(`Advance Purchase Order initiated with ${scheme.supplierName} for ${scheme.title}!`);
                      setTimeout(() => {
                        dispatch(navigateTo('PURCHASE_GRN'));
                      }, 1200);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Place Advance PO ({scheme.supplierName.split(' ')[0]})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {processedSchemes.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold">No distributor deals match your search criteria.</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for other brand names or clearing category filters.</p>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: SUPPLIERS & COMMERCIAL MARGINS DIRECTORY                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activePageTab === 'DIRECTORY' && (
        <div className="space-y-4">
          {/* Smart AI Procurement Recommendations Banner (Light Teal/Emerald Theme) */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-white rounded-2xl p-4 text-slate-900 shadow-xs border border-emerald-200 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-emerald-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold font-heading text-slate-900 tracking-wide">
                    Smart Vendor Procurement &amp; Margin Recommendations
                  </h2>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Automated commercial ranking based on trade discounts, cash rebates, credit terms &amp; supply turnaround
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                AI Procurement Active
              </span>
            </div>

            {/* 3 Featured Recommendation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {bestMarginSupplier && (
                <div
                  onClick={() => setSelectedSupplierForDetail(bestMarginSupplier)}
                  className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      <span>BEST PROFIT MARGIN</span>
                    </span>
                    <span className="text-xs font-black text-emerald-700 font-mono">Score {bestMarginSupplier.performanceScore || 98}/100</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm mt-1.5 truncate group-hover:text-emerald-700 transition-colors">
                    {bestMarginSupplier.name}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 truncate">{bestMarginSupplier.topBrandsSupplied?.join(', ') || 'Major Pharma Brands'}</p>
                  
                  <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-center text-[10px]">
                    <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                      <div className="text-[9px] text-slate-500">Trade Disc</div>
                      <div className="font-black text-slate-900">{bestMarginSupplier.tradeDiscountPercent}%</div>
                    </div>
                    <div className="bg-amber-50/60 border border-amber-200 p-1.5 rounded-lg">
                      <div className="text-[9px] text-amber-800">Rebate (CD)</div>
                      <div className="font-black text-amber-800">+{bestMarginSupplier.rebatePercent}%</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg">
                      <div className="text-[9px] text-emerald-800 font-bold">Net Margin</div>
                      <div className="font-black text-emerald-700 text-xs">{bestMarginSupplier.liquidMarginPercent}%</div>
                    </div>
                  </div>
                </div>
              )}

              {bestRebateSupplier && (
                <div
                  onClick={() => setSelectedSupplierForDetail(bestRebateSupplier)}
                  className="bg-white rounded-xl p-3.5 border border-teal-200 shadow-2xs hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center space-x-1">
                      <Award className="w-3 h-3 text-teal-600" />
                      <span>MAX CASH REBATE</span>
                    </span>
                    <span className="text-xs font-black text-teal-700 font-mono">Score {bestRebateSupplier.performanceScore || 96}/100</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm mt-1.5 truncate group-hover:text-teal-700 transition-colors">
                    {bestRebateSupplier.name}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 truncate">{bestRebateSupplier.topBrandsSupplied?.join(', ') || 'Respiratory & Critical Care'}</p>
                  
                  <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-center text-[10px]">
                    <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                      <div className="text-[9px] text-slate-500">Trade Disc</div>
                      <div className="font-black text-slate-900">{bestRebateSupplier.tradeDiscountPercent}%</div>
                    </div>
                    <div className="bg-teal-50/60 border border-teal-200 p-1.5 rounded-lg">
                      <div className="text-[9px] text-teal-800 font-bold">Cash Rebate</div>
                      <div className="font-black text-teal-700 text-xs">+{bestRebateSupplier.rebatePercent}% CD</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg">
                      <div className="text-[9px] text-emerald-800 font-bold">Net Margin</div>
                      <div className="font-black text-emerald-700">{bestRebateSupplier.liquidMarginPercent}%</div>
                    </div>
                  </div>
                </div>
              )}

              {fastestSupplier && (
                <div
                  onClick={() => setSelectedSupplierForDetail(fastestSupplier)}
                  className="bg-white rounded-xl p-3.5 border border-amber-200 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-600" />
                      <span>FASTEST TURNAROUND</span>
                    </span>
                    <span className="text-xs font-black text-amber-700 font-mono">{fastestSupplier.deliveryLeadTimeHours}h SLA</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm mt-1.5 truncate group-hover:text-amber-700 transition-colors">
                    {fastestSupplier.name}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 truncate">{fastestSupplier.topBrandsSupplied?.join(', ') || 'General OTC & Antibiotics'}</p>
                  
                  <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-center text-[10px]">
                    <div className="bg-amber-50/60 border border-amber-200 p-1.5 rounded-lg">
                      <div className="text-[9px] text-amber-800 font-bold">Lead Time</div>
                      <div className="font-black text-amber-700">{fastestSupplier.deliveryLeadTimeHours} Hours</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                      <div className="text-[9px] text-slate-500">Credit Days</div>
                      <div className="font-black text-slate-900">{fastestSupplier.creditPeriodDays} Days</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg">
                      <div className="text-[9px] text-emerald-800 font-bold">Net Margin</div>
                      <div className="font-black text-emerald-700">{fastestSupplier.liquidMarginPercent}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search, Filter Pills & Sort */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by Supplier Name, Brand (Cipla, Sun Pharma), Contact, GSTIN, or DL..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-colors"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold">
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center space-x-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sort by:</span>
                </span>
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as SortOption)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="margin_desc">Highest Liquid Margin (%)</option>
                  <option value="rebate_desc">Highest Cash Rebate / CD (%)</option>
                  <option value="discount_desc">Highest Trade Discount (%)</option>
                  <option value="speed_asc">Fastest Supply Turnaround (Hours)</option>
                  <option value="score_desc">Best Performance Score</option>
                  <option value="dues_desc">Highest Pending Dues</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 pt-1 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span>Filter:</span>
              </span>
              {[
                { key: 'ALL',           label: `All Vendors (${suppliers.length})` },
                { key: 'RECOMMENDED',   label: `⭐ AI Recommended (${suppliers.filter(s => s.recommendationTag).length})` },
                { key: 'HIGH_MARGIN',   label: `📈 High Margin (≥25%)` },
                { key: 'HIGH_REBATE',   label: `💸 High Rebate (≥3.5% CD)` },
                { key: 'FAST_DELIVERY', label: `⚡ Fast Supply (≤6h)` },
                { key: 'ZERO_DUES',     label: `✅ Zero Dues (${suppliers.filter(s => s.pendingBalance === 0).length})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterCategory(tab.key as FilterCategory)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    filterCategory === tab.key
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Supplier Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Supplier Commercial Directory ({processedSuppliers.length})</span>
              <span className="text-slate-400 text-[11px]">Click 'Record Payment' or '+ GRN' for any distributor</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '950px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3">Vendor &amp; DL Compliance</th>
                    <th className="px-3 py-3 text-center">Trade Disc %</th>
                    <th className="px-3 py-3 text-center">Cash Rebate %</th>
                    <th className="px-3 py-3 text-center">Net Liquid Margin</th>
                    <th className="px-3 py-3">Credit Terms &amp; SLA</th>
                    <th className="px-3 py-3">Top Brands Supplied</th>
                    <th className="px-3 py-3 text-right">Outstanding Dues</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedSuppliers.map(sup => {
                    const tagBadge = getTagBadge(sup.recommendationTag);
                    const isHighMargin = (sup.liquidMarginPercent || 0) >= 25;

                    return (
                      <tr
                        key={sup.supplierId}
                        onClick={() => setSelectedSupplierForDetail(sup)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-extrabold text-sm text-slate-900">{sup.name}</span>
                            {tagBadge && (
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${tagBadge.bg}`}>
                                {tagBadge.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-[10.5px] text-slate-500 font-normal mt-0.5">
                            <span className="font-mono">DL: {sup.dlNumber}</span>
                            <span>·</span>
                            <span className="font-mono">GSTIN: {sup.gstin}</span>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <div className="font-black text-slate-800 text-xs">
                            {sup.tradeDiscountPercent ? `${sup.tradeDiscountPercent}%` : '20.0%'}
                          </div>
                          <div className="text-[9.5px] text-slate-400">Off MRP</div>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <div className="font-black text-teal-700 text-xs">
                            {sup.rebatePercent ? `+${sup.rebatePercent}%` : '+2.0%'}
                          </div>
                          <div className="text-[9.5px] text-teal-600 font-semibold">Prompt CD</div>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-black border ${
                            isHighMargin
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            <span>{sup.liquidMarginPercent ? `${sup.liquidMarginPercent}%` : '22.0%'}</span>
                          </span>
                          <div className="text-[9px] text-emerald-700 font-bold mt-0.5">Net Margin</div>
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          <div className="flex items-center space-x-1 font-semibold text-xs text-slate-800">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{sup.creditPeriodDays || 15} Days Credit</span>
                          </div>
                          <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                            ⚡ {sup.deliveryLeadTimeHours || 6}h Delivery SLA
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {(sup.topBrandsSupplied || ['Cipla', 'Sun Pharma']).map((b, i) => (
                              <span key={i} className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                {b}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-right">
                          <div className={`font-black text-sm ${sup.pendingBalance > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                            ₹{sup.pendingBalance.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[9.5px] text-slate-400">
                            {sup.pendingBalance === 0 ? 'Cleared' : 'Pending'}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-1.5">
                            {sup.pendingBalance > 0 && (
                              <button
                                onClick={() => handleOpenPaymentForSupplier(sup)}
                                className="flex items-center space-x-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold px-2 py-1.5 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                                title="Record payment settlement"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Pay Due</span>
                              </button>
                            )}

                            <button
                              onClick={() => dispatch(navigateTo('PURCHASE_GRN'))}
                              className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2 py-1.5 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer"
                              title="Create GRN Purchase Order"
                            >
                              <Truck className="w-3 h-3" />
                              <span>+ GRN</span>
                            </button>

                            <button
                              onClick={() => setSelectedSupplierForDetail(sup)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View Ledger & Commercial Details"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: CASH & CREDIT INVOICES LEDGER                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activePageTab === 'BILLS_LEDGER' && (
        <div className="space-y-4">
          {/* Filter Pills for Bills */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 text-xs font-semibold">
              <span className="text-slate-500 font-bold mr-1 flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span>Filter Bills:</span>
              </span>
              {[
                { key: 'ALL',            label: `All Invoices (${supplierBills.length})` },
                { key: 'CREDIT_PENDING', label: `💳 Credit Pending (${pendingCreditBills.length})` },
                { key: 'DUE_SOON',       label: `⏳ Due in ≤15 Days (${dueWithin15Days.length + dueWithin3Days.length})` },
                { key: 'OVERDUE',        label: `🚨 Overdue (${overdueBills.length})` },
                { key: 'CASH_PAID',      label: `💵 Cash / Settled (${cashBills.length})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setBillFilter(tab.key as BillFilter)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    billFilter === tab.key
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowNewBillModal(true)}
              className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Log New Invoice</span>
            </button>
          </div>

          {/* Bills Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Distributor Purchase Invoices Ledger ({processedBills.length})</span>
              <span className="text-slate-400 text-[11px]">Track 10-day &amp; 15-day credit maturities</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '950px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3">Invoice # &amp; Bill Date</th>
                    <th className="px-3 py-3">Distributor Name</th>
                    <th className="px-3 py-3 text-center">Bill Type</th>
                    <th className="px-3 py-3">Repayment Due Schedule</th>
                    <th className="px-3 py-3 text-right">Total Invoice (₹)</th>
                    <th className="px-3 py-3 text-right">Pending Balance (₹)</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedBills.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No purchase invoices found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    processedBills.map(bill => {
                      const dueDateObj = new Date(bill.dueDate);
                      const daysUntilDue = Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const isOverdue = bill.pendingAmount > 0 && daysUntilDue < 0;
                      const isDueSoon = bill.pendingAmount > 0 && daysUntilDue <= 3 && daysUntilDue >= 0;

                      return (
                        <tr key={bill.billId} className="hover:bg-slate-50/80 transition-colors">
                          {/* Invoice # & Bill Date */}
                          <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                            <div className="text-xs">{bill.invoiceNumber}</div>
                            <div className="text-[10px] text-slate-500 font-sans flex items-center space-x-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Bill Date: {bill.billDate}</span>
                            </div>
                          </td>

                          {/* Supplier Name */}
                          <td className="px-3 py-3 font-bold text-slate-800">
                            <div>{bill.supplierName}</div>
                            {bill.notes && <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{bill.notes}</div>}
                          </td>

                          {/* Bill Type Badge */}
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              bill.billType === 'CASH'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-teal-50 text-teal-800 border border-teal-200'
                            }`}>
                              {bill.billType === 'CASH' ? '💵 Cash Bill' : '💳 Credit Bill'}
                            </span>
                          </td>

                          {/* Due Date Schedule */}
                          <td className="px-3 py-3">
                            {bill.billType === 'CASH' ? (
                              <span className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Immediate Spot Payment</span>
                              </span>
                            ) : (
                              <div>
                                <div className="font-bold text-slate-800 text-xs flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>Due: {bill.dueDate} ({bill.creditDays}d Credit)</span>
                                </div>
                                <div className="mt-0.5">
                                  {bill.pendingAmount === 0 ? (
                                    <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                      ✓ Repayment Complete
                                    </span>
                                  ) : isOverdue ? (
                                    <span className="text-[9.5px] font-black text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                                      🚨 Overdue by {Math.abs(daysUntilDue)} Days
                                    </span>
                                  ) : isDueSoon ? (
                                    <span className="text-[9.5px] font-black text-amber-900 bg-amber-50 border border-amber-300 px-1.5 py-0.2 rounded animate-pulse">
                                      ⚠ Due in {daysUntilDue} Days
                                    </span>
                                  ) : (
                                    <span className="text-[9.5px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded">
                                      ⏳ Due in {daysUntilDue} Days
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Total Amount */}
                          <td className="px-3 py-3 text-right font-black text-slate-900 font-mono text-xs">
                            ₹{bill.totalAmount.toLocaleString('en-IN')}
                          </td>

                          {/* Pending Amount */}
                          <td className="px-3 py-3 text-right font-mono">
                            <div className={`font-black text-xs ${bill.pendingAmount > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                              ₹{bill.pendingAmount.toLocaleString('en-IN')}
                            </div>
                            {bill.paidAmount > 0 && bill.pendingAmount > 0 && (
                              <div className="text-[9px] text-slate-400">Paid: ₹{bill.paidAmount.toLocaleString('en-IN')}</div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                              bill.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isOverdue
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {bill.status === 'PAID' ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="px-3 py-3 text-center">
                            {bill.pendingAmount > 0 ? (
                              <button
                                onClick={() => handleOpenPaymentForBill(bill)}
                                className="flex items-center space-x-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer mx-auto"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Pay Now</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-center space-x-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Settled</span>
                              </span>
                            )}
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: PAYMENT SETTLEMENT LOGS                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activePageTab === 'PAYMENT_LOGS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Supplier Repayment &amp; Settlement Audit Logs ({processedPaymentLogs.length})</span>
              <span className="text-slate-400 text-[11px]">Official record of bank transfers, UPI &amp; cheque payments</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '850px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3">Payment Date &amp; Time</th>
                    <th className="px-3 py-3">Distributor Name</th>
                    <th className="px-3 py-3 text-right">Amount Paid (₹)</th>
                    <th className="px-3 py-3 text-center">Payment Mode</th>
                    <th className="px-3 py-3 font-mono">Reference / UTR No</th>
                    <th className="px-3 py-3">Invoice Settled</th>
                    <th className="px-3 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedPaymentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No payment settlement logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    processedPaymentLogs.map(log => (
                      <tr key={log.paymentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-800 text-xs">
                          {log.paymentDate}
                        </td>
                        <td className="px-3 py-3 font-extrabold text-slate-900">
                          {log.supplierName}
                        </td>
                        <td className="px-3 py-3 text-right font-black text-emerald-700 font-mono text-sm">
                          ₹{log.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-teal-50 text-teal-800 border border-teal-200">
                            {log.paymentMode.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-600 font-bold text-xs">
                          {log.referenceNo}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-700 text-xs">
                          {log.billInvoiceNo || 'General Balance Settlement'}
                        </td>
                        <td className="px-3 py-3 text-slate-500 text-[11px]">
                          {log.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: RECORD SUPPLIER PAYMENT (SOFT TEAL & WHITE DESIGN) ─── */}
      {showPaymentModal && selectedSupplierForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-200">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    Record Distributor Repayment
                  </h3>
                  <p className="text-[11px] text-slate-500">Pay outstanding credit invoice or ledger balance</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3.5 text-xs font-semibold">
              {/* Supplier Info Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">{selectedSupplierForPayment.name}</div>
                  <div className="text-[11px] text-slate-500">GSTIN: {selectedSupplierForPayment.gstin}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Dues</div>
                  <div className="text-base font-black text-amber-800">
                    ₹{selectedSupplierForPayment.pendingBalance.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {selectedBillForPayment && (
                <div className="p-2.5 bg-teal-50/60 rounded-lg border border-teal-200 flex items-center justify-between text-[11px]">
                  <span className="text-teal-900 font-bold">Settling Invoice: {selectedBillForPayment.invoiceNumber}</span>
                  <span className="font-mono text-teal-800">Due: ₹{selectedBillForPayment.pendingAmount}</span>
                </div>
              )}

              {/* Amount to Pay */}
              <div>
                <label className="block text-slate-700 mb-1">Repayment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-slate-700 mb-1.5">Payment Method *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'NEFT_RTGS', label: 'NEFT/RTGS', icon: Landmark },
                    { id: 'UPI',       label: 'UPI App',   icon: QrCode },
                    { id: 'CHEQUE',    label: 'Cheque',    icon: FileText },
                    { id: 'CASH',      label: 'Cash',      icon: DollarSign },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMode(m.id as any)}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                        paymentMode === m.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <m.icon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ref Number */}
              <div>
                <label className="block text-slate-700 mb-1">Transaction Ref / UTR / Cheque Number *</label>
                <input
                  type="text"
                  required
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  placeholder="e.g. UTR202688192"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 mb-1">Remarks / Settlement Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Settlement for monthly supply"
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Repayment (₹{paymentAmount.toLocaleString('en-IN')})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: LOG SUPPLIER INVOICE (CASH / CREDIT) ──────────────── */}
      {showNewBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    Log Distributor Purchase Invoice
                  </h3>
                  <p className="text-[11px] text-slate-500">Record Cash Bill or Credit Bill with 10/15-day due dates</p>
                </div>
              </div>
              <button onClick={() => setShowNewBillModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-3.5 text-xs font-semibold">
              {/* Select Supplier */}
              <div>
                <label className="block text-slate-700 mb-1">Distributor / Supplier *</label>
                <select
                  value={billSupplierId}
                  onChange={e => setBillSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  {suppliers.map(s => (
                    <option key={s.supplierId} value={s.supplierId}>
                      {s.name} (DL: {s.dlNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cash vs Credit Mode */}
              <div>
                <label className="block text-slate-700 mb-1.5">Bill Payment Terms *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillType('CREDIT')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                      billType === 'CREDIT'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>💳 Credit Bill (Deferred)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillType('CASH')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                      billType === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>💵 Cash Bill (Spot Paid)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Supplier Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={billInvoiceNo}
                    onChange={e => setBillInvoiceNo(e.target.value)}
                    placeholder="INV-SUP-88192"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={e => setBillDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* If Credit Bill: Repayment Slabs (10 Days, 15 Days, 30 Days) */}
              {billType === 'CREDIT' && (
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 space-y-2">
                  <label className="block text-[11px] font-black text-teal-900 uppercase tracking-wider">
                    Select Repayment Period
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 15, 21, 30].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setBillCreditDays(days)}
                        className={`p-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          billCreditDays === days
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        {days} Days Due
                      </button>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-teal-700 font-medium">
                    Maturity Due Date: <strong>{new Date(new Date(billDate).getTime() + billCreditDays * 24 * 3600000).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong>
                  </p>
                </div>
              )}

              {/* Total Invoice Amount */}
              <div>
                <label className="block text-slate-700 mb-1">Total Bill Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={billTotalAmount}
                  onChange={e => setBillTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base font-black text-slate-900 font-mono"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-700 mb-1">Items / Delivery Remarks</label>
                <input
                  type="text"
                  value={billNotes}
                  onChange={e => setBillNotes(e.target.value)}
                  placeholder="e.g. Antibiotics & IV fluid restock"
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewBillModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Save Invoice &amp; Schedule Repayment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: SUPPLIER COMMERCIAL DETAILS & STATEMENT DRAWER ───── */}
      {selectedSupplierForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-extrabold text-slate-900 font-heading">
                    {selectedSupplierForDetail.name}
                  </h3>
                  {getTagBadge(selectedSupplierForDetail.recommendationTag) && (
                    <span className={`text-[9.5px] font-black px-2 py-0.5 rounded border ${getTagBadge(selectedSupplierForDetail.recommendationTag)?.bg}`}>
                      {getTagBadge(selectedSupplierForDetail.recommendationTag)?.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized Pharmaceutical Distributor Agreement, Net Margins &amp; Ledger
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplierForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Commercial Highlights Matrix */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Trade Discount</p>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">
                  {selectedSupplierForDetail.tradeDiscountPercent || 20}%
                </h4>
                <p className="text-[9px] text-slate-500">Off MRP Invoice</p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-teal-200 shadow-2xs">
                <p className="text-[10px] font-bold text-teal-700 uppercase">Cash Rebate (CD)</p>
                <h4 className="text-lg font-black text-teal-700 mt-0.5">
                  +{selectedSupplierForDetail.rebatePercent || 2.5}%
                </h4>
                <p className="text-[9px] text-teal-600 font-medium">Prompt Payment</p>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 shadow-2xs">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">Net Liquid Margin</p>
                <h4 className="text-lg font-black text-emerald-700 mt-0.5">
                  {selectedSupplierForDetail.liquidMarginPercent || 22.5}%
                </h4>
                <p className="text-[9px] text-emerald-600 font-bold">Pharmacy Net Profit</p>
              </div>
            </div>

            {/* Invoices for this supplier */}
            <div className="space-y-2 mb-4">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Recent Invoices &amp; Repayment Schedules</span>
                <span className="text-slate-400 font-normal">
                  {supplierBills.filter(b => b.supplierId === selectedSupplierForDetail.supplierId).length} Bills
                </span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Type &amp; Due Date</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-right">Pending</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierBills.filter(b => b.supplierId === selectedSupplierForDetail.supplierId).map(b => (
                      <tr key={b.billId}>
                        <td className="p-2 font-bold font-mono">{b.invoiceNumber}</td>
                        <td className="p-2">
                          <span className="font-bold">{b.billType}</span> · Due {b.dueDate}
                        </td>
                        <td className="p-2 text-right font-mono font-bold">₹{b.totalAmount.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono font-bold text-amber-800">₹{b.pendingAmount.toLocaleString()}</td>
                        <td className="p-2 text-center">
                          <span className={`px-1.5 py-0.2 text-[9px] font-black rounded ${
                            b.status === 'PAID' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-xs font-black text-amber-800">
                Outstanding Balance: ₹{selectedSupplierForDetail.pendingBalance.toLocaleString('en-IN')}
              </div>
              <div className="flex space-x-2">
                {selectedSupplierForDetail.pendingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const sup = selectedSupplierForDetail;
                      setSelectedSupplierForDetail(null);
                      handleOpenPaymentForSupplier(sup);
                    }}
                    className="flex items-center space-x-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSupplierForDetail(null);
                    dispatch(navigateTo('PURCHASE_GRN'));
                  }}
                  className="flex items-center space-x-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>+ GRN Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: REGISTER NEW SUPPLIER MODAL (LIGHT THEME) ─────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading flex items-center space-x-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>Register New Pharmaceutical Distributor</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Distributor / Company Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Mankind Pharma Wholesale Depot"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98490 12345"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">GSTIN Number *</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                    placeholder="36AAACS5512B1Z5"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Drug License No. *</label>
                  <input
                    type="text"
                    required
                    value={dlNumber}
                    onChange={e => setDlNumber(e.target.value)}
                    placeholder="DL-1003/HYD"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              {/* Commercial Terms Section */}
              <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200 space-y-2.5">
                <h4 className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center space-x-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Commercial Discounts &amp; Margin Agreement</span>
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Trade Discount (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={tradeDiscountPercent}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setTradeDiscountPercent(val);
                        setLiquidMarginPercent(val + rebatePercent);
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Cash Rebate / CD (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={rebatePercent}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setRebatePercent(val);
                        setLiquidMarginPercent(tradeDiscountPercent + val);
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-center font-bold text-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Net Liquid Margin (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={liquidMarginPercent}
                      onChange={e => setLiquidMarginPercent(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-center font-black text-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Credit Period (Days)</label>
                    <input
                      type="number"
                      value={creditPeriodDays}
                      onChange={e => setCreditPeriodDays(parseInt(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Delivery Turnaround (Hours)</label>
                    <input
                      type="number"
                      value={deliveryLeadTimeHours}
                      onChange={e => setDeliveryLeadTimeHours(parseInt(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Top Brands Supplied</label>
                <input
                  type="text"
                  value={topBrandsInput}
                  onChange={e => setTopBrandsInput(e.target.value)}
                  placeholder="Mankind, Alkem, Glenmark, Pfizer"
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="distributor@pharma.com"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Depot / Warehouse Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Logistics Park, Hyderabad"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
