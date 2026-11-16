import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  navigateTo,
  reprintInvoice,
  setLatestFinalizedInvoice,
  deleteSavedInvoice,
  restoreHeldBill,
  setHeldBills
} from '../store/posSlice';
import api from '../utils/api';
import type { FinalizedInvoice, HeldBill, ReturnCreditNote } from '../types/pos';
import { getMedicineDetails } from '../utils/medicineDetails';
import {
  History, Search, Download, Printer, Trash2, ChevronDown, ChevronUp,
  CreditCard, DollarSign, Calendar, Filter, ShoppingCart, Eye,
  CheckCircle2, ArrowUpDown, FileSpreadsheet, Plus, AlertCircle, Sparkles, Loader2,
  Clock, PauseCircle, RotateCcw, ArrowRight, ShieldCheck, QrCode, Banknote,
  Receipt, Wallet, Layers, Check, X, RefreshCw
} from 'lucide-react';

export type InvoiceSegmentTab = 'TODAYS_BILLS' | 'PAYMENT_METHODS' | 'HELD_CARTS' | 'RETURNS';

export const InvoicesPage: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);
  const heldBillsFromRedux = useSelector((state: RootState) => state.pos.heldBills || []);
  const returnNotesFromRedux = useSelector((state: RootState) => state.pos.returnNotes || []);
  const pharmacists = useSelector((state: RootState) => state.pos.pharmacists || []);
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'OWNER';

  // ── Segment Tab State (Day 5 Core Feature) ───────────────────────────
  const [segmentTab, setSegmentTab] = useState<InvoiceSegmentTab>('TODAYS_BILLS');

  // Invoices & Query States
  const [invoices, setInvoices] = useState<FinalizedInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 25;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('TODAY');
  const [sortKey, setSortKey] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [expandedInvoiceNum, setExpandedInvoiceNum] = useState<string | null>(null);

  // Held Carts & Returns States
  const [apiHeldBills, setApiHeldBills] = useState<HeldBill[]>([]);
  const [heldLoading, setHeldLoading] = useState<boolean>(false);
  const [apiReturnNotes, setApiReturnNotes] = useState<ReturnCreditNote[]>([]);
  const [returnsLoading, setReturnsLoading] = useState<boolean>(false);
  const [expandedHeldId, setExpandedHeldId] = useState<string | null>(null);
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);

  // Sync date filter when switching tabs
  const handleTabChange = (tab: InvoiceSegmentTab) => {
    setSegmentTab(tab);
    setSearchQuery('');
    setPage(1);
    if (tab === 'TODAYS_BILLS') {
      setDateFilter('TODAY');
      setPaymentFilter('ALL');
    } else if (tab === 'PAYMENT_METHODS') {
      setDateFilter('ALL');
      setPaymentFilter('ALL');
    }
  };

  // ── 1. Fetch Invoices from Backend ──────────────────────────────────
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let dateFrom = undefined;
      const now = new Date();
      if (segmentTab === 'TODAYS_BILLS' || dateFilter === 'TODAY') {
        dateFrom = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      } else if (dateFilter === 'WEEK') {
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateFilter === 'MONTH') {
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const params = {
        search: searchQuery,
        paymentMethod: paymentFilter,
        dateFrom,
        sortBy: sortKey,
        page,
        limit
      };

      const res = await api.get('/invoices', { params });
      if (res.data.success) {
        setInvoices(res.data.data);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch invoices', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (segmentTab === 'TODAYS_BILLS' || segmentTab === 'PAYMENT_METHODS') {
      const debounceTimer = setTimeout(fetchInvoices, 250);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, paymentFilter, dateFilter, sortKey, page, segmentTab]);

  // ── 2. Fetch Held Bills from Backend ────────────────────────────────
  const fetchHeldBills = async () => {
    setHeldLoading(true);
    try {
      const res = await api.get('/billing/held-bills');
      if (res.data.success && Array.isArray(res.data.data)) {
        setApiHeldBills(res.data.data);
        dispatch(setHeldBills(res.data.data));
      }
    } catch (err) {
      console.warn('[InvoicesPage] Using local held bills fallback:', err);
    } finally {
      setHeldLoading(false);
    }
  };

  useEffect(() => {
    if (segmentTab === 'HELD_CARTS') {
      fetchHeldBills();
    }
  }, [segmentTab]);

  // Combined Held Bills (API + Redux)
  const combinedHeldBills = useMemo(() => {
    const map = new Map<string, HeldBill>();
    apiHeldBills.forEach(h => map.set(h.id, h));
    heldBillsFromRedux.forEach(h => map.set(h.id, h));
    const list = Array.from(map.values());
    if (!searchQuery) return list;
    return list.filter(h =>
      h.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.customerPhone.includes(searchQuery) ||
      h.billingSession.items.some(i => i.product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [apiHeldBills, heldBillsFromRedux, searchQuery]);

  // ── 3. Fetch Returns & Credit Notes from Backend ───────────────────
  const fetchReturns = async () => {
    setReturnsLoading(true);
    try {
      const res = await api.get('/returns?limit=50');
      if (res.data.success && Array.isArray(res.data.data)) {
        setApiReturnNotes(res.data.data);
      }
    } catch (err) {
      console.warn('[InvoicesPage] Using local returns fallback:', err);
    } finally {
      setReturnsLoading(false);
    }
  };

  useEffect(() => {
    if (segmentTab === 'RETURNS') {
      fetchReturns();
    }
  }, [segmentTab]);

  // Combined Returns (API + Redux)
  const combinedReturnNotes = useMemo(() => {
    const map = new Map<string, ReturnCreditNote>();
    apiReturnNotes.forEach(r => map.set(r.creditNoteNo, r));
    returnNotesFromRedux.forEach(r => map.set(r.creditNoteNo, r));
    const list = Array.from(map.values());
    if (!searchQuery) return list;
    return list.filter(r =>
      r.creditNoteNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.originalInvoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [apiReturnNotes, returnNotesFromRedux, searchQuery]);

  // ── Calculated Metrics ──────────────────────────────────────────────
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const upiRevenue = invoices.filter(inv => inv.payment.method === 'UPI').reduce((sum, inv) => sum + inv.grandTotal, 0);
  const upiCount = invoices.filter(inv => inv.payment.method === 'UPI').length;
  const cashRevenue = invoices.filter(inv => inv.payment.method === 'CASH').reduce((sum, inv) => sum + inv.grandTotal, 0);
  const cashCount = invoices.filter(inv => inv.payment.method === 'CASH').length;
  const cardRevenue = invoices.filter(inv => ['CARD', 'CREDIT_CARD', 'DEBIT_CARD'].includes(inv.payment.method)).reduce((sum, inv) => sum + inv.grandTotal, 0);
  const cardCount = invoices.filter(inv => ['CARD', 'CREDIT_CARD', 'DEBIT_CARD'].includes(inv.payment.method)).length;
  const splitRevenue = invoices.filter(inv => inv.payment.method === 'SPLIT').reduce((sum, inv) => sum + inv.grandTotal, 0);
  const splitCount = invoices.filter(inv => inv.payment.method === 'SPLIT').length;
  const avgOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;
  const totalGstCollected = invoices.reduce((sum, inv) => sum + (inv.totalCGST || 0) + (inv.totalSGST || 0), 0);

  const totalHeldAmount = combinedHeldBills.reduce((sum, h) => sum + h.totalAmount, 0);
  const totalReturnAmount = combinedReturnNotes.reduce((sum, r) => sum + (r.totalRefundAmount || r.netRefundAmount || 0), 0);

  // ── Actions ─────────────────────────────────────────────────────────
  const handleReprint = async (invoiceNumber: string) => {
    try {
      const res = await api.get(`/invoices/${invoiceNumber}`);
      if (res.data.success && res.data.data) {
        dispatch(setLatestFinalizedInvoice(res.data.data));
        return;
      }
    } catch (err) {
      console.warn('[InvoicesPage] Live invoice fetch fallback to local:', err);
    }
    dispatch(reprintInvoice(invoiceNumber));
  };

  const handleResumeHeldBill = (held: HeldBill) => {
    const heldId = held.id || (held as any)._id;
    dispatch(restoreHeldBill(heldId));
    api.delete(`/billing/held-bills/${heldId}`).catch(console.error);
    dispatch(navigateTo('POS_TERMINAL'));
  };

  const handleDiscardHeldBill = async (id: string, customerName: string) => {
    if (window.confirm(`Discard held bill for ${customerName}? This will cancel the parked cart.`)) {
      try {
        await api.delete(`/billing/held-bills/${id}`);
      } catch (err) {
        console.warn('Backend delete held bill fallback:', err);
      }
      setApiHeldBills(prev => prev.filter(h => h.id !== id));
      dispatch(setHeldBills(combinedHeldBills.filter(h => h.id !== id)));
    }
  };

  const handleDownloadSingleCSV = (inv: FinalizedInvoice) => {
    let csv = 'Invoice Number,Date,Patient Name,Patient Phone,Doctor Name,Item Name,Type,Pack Size,Selling Unit,Batch,Exp,Qty,Unit Price,Discount %,GST %,Line Total\n';
    inv.billingSession.items.forEach(item => {
      const productData = (item as any).productSnapshot || item.product || {};
      const details = getMedicineDetails(productData as any);
      const isLoose = item.unitMode === 'LOOSE';
      csv += `"${inv.invoiceNumber}","${inv.invoiceDate}","${inv.billingSession.patientDetails?.patientName || 'Walk-in'}","${inv.billingSession.patientDetails?.phone || ''}","${inv.billingSession.doctorDetails?.doctorName || 'Direct'}","${productData.name}","${details.medicineType}","${details.packSize}","${isLoose ? 'Loose' : 'Pack'}","${item.selectedBatch.batchNumber}","${item.selectedBatch.expiryDate}",${item.quantity},${item.unitPrice.toFixed(2)},${item.discountPercent}%,${productData.gstRate}%,${item.lineTotal.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Invoice_${inv.invoiceNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllCSV = () => {
    if (invoices.length === 0) return;
    let csv = 'Invoice Number,Date,Patient Name,Phone,Doctor,Items Count,Subtotal,Discount,CGST,SGST,Grand Total,Payment Method,Pharmacist\n';
    invoices.forEach(inv => {
      csv += `"${inv.invoiceNumber}","${inv.invoiceDate}","${inv.billingSession.patientDetails?.patientName || 'Walk-in'}","${inv.billingSession.patientDetails?.phone || ''}","${inv.billingSession.doctorDetails?.doctorName || 'Direct'}",${inv.billingSession.items.length},${inv.subtotal.toFixed(2)},${inv.totalDiscount.toFixed(2)},${inv.totalCGST.toFixed(2)},${inv.totalSGST.toFixed(2)},${inv.grandTotal.toFixed(2)},"${inv.payment.method}","${inv.pharmacistName || 'Ramesh Kumar'}"\n`;
    });
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `All_Invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteInvoice = async (invoiceNumber: string) => {
    if (!window.confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return;
    try {
      await api.delete(`/invoices/${invoiceNumber}`);
      setInvoices(prev => prev.filter(inv => inv.invoiceNumber !== invoiceNumber));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete invoice.');
    }
  };

  // ── Segment Tab Definitions ─────────────────────────────────────────
  const SEGMENT_TABS = [
    {
      id: 'TODAYS_BILLS' as const,
      label: "Today's Bills",
      icon: Calendar,
      countBadge: `${invoices.length} Bills`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Real-time billing, hourly transactions & receipts'
    },
    {
      id: 'PAYMENT_METHODS' as const,
      label: 'Payment Methods',
      icon: CreditCard,
      countBadge: 'UPI • Cash • Card',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      description: 'Channel collection breakdown & reconciliation'
    },
    {
      id: 'HELD_CARTS' as const,
      label: 'Held Carts',
      icon: PauseCircle,
      countBadge: `${combinedHeldBills.length} Parked`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Suspended customer bills & 1-click resume'
    },
    {
      id: 'RETURNS' as const,
      label: 'Returns & Credit Notes',
      icon: RotateCcw,
      countBadge: `${combinedReturnNotes.length} Returns`,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      description: 'Sales returns, restocked batches & refund notes'
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4 font-sans select-none pb-16">

      {/* ── TOP PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
            <History className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
              <span>Invoice History &amp; Sales Audit Journal</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Segmented invoice journal: Today's bills, Payment reconciliation, Parked carts, and Sales returns
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {invoices.length > 0 && (
            <button
              onClick={handleExportAllCSV}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
              title="Export current view to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Create New Bill</span>
          </button>
        </div>
      </div>

      {/* ── SEGMENTED FILTER TABS BAR (Day 5 Core Feature) ──────────── */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
          {SEGMENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = segmentTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-left transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-extrabold truncate ${isActive ? 'text-emerald-950 font-heading' : 'text-slate-800'}`}>
                      {tab.label}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${tab.badgeColor} shrink-0`}>
                      {tab.countBadge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {tab.description}
                  </p>
                </div>
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: TODAY'S BILLS ──────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {segmentTab === 'TODAYS_BILLS' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Today's KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Today's Invoices</span>
              <p className="text-xl font-black text-slate-900 font-heading mt-1">{invoices.length} Bills</p>
              <span className="text-[10px] text-slate-400">Total Billed Today</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs bg-gradient-to-br from-white to-emerald-50/50">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Today's Revenue</span>
              <p className="text-xl font-black text-emerald-800 font-heading mt-1">₹{totalRevenue.toFixed(2)}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Gross Collections</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-2xs bg-gradient-to-br from-white to-indigo-50/50">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">UPI &amp; QR Today</span>
              <p className="text-xl font-black text-indigo-900 font-heading mt-1">₹{upiRevenue.toFixed(2)}</p>
              <span className="text-[10px] text-indigo-600 font-semibold">{upiCount} Payments</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/50">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Cash in Register</span>
              <p className="text-xl font-black text-amber-900 font-heading mt-1">₹{cashRevenue.toFixed(2)}</p>
              <span className="text-[10px] text-amber-600 font-semibold">{cashCount} Cash Sales</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs bg-gradient-to-br from-white to-blue-50/50">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">GST Collected</span>
              <p className="text-xl font-black text-blue-900 font-heading mt-1">₹{totalGstCollected.toFixed(2)}</p>
              <span className="text-[10px] text-blue-600 font-semibold">CGST + SGST</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Basket</span>
              <p className="text-xl font-black text-slate-800 font-heading mt-1">₹{avgOrderValue.toFixed(2)}</p>
              <span className="text-[10px] text-slate-400">Per Customer Bill</span>
            </div>
          </div>

          {/* Today's Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search today's bills by Invoice #, Patient Name, Phone, Doctor, or Medicine..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={sortKey}
                onChange={(e) => { setSortKey(e.target.value as any); setPage(1); }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs focus:outline-hidden"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: PAYMENT METHODS ────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {segmentTab === 'PAYMENT_METHODS' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Payment Channels Reconciliation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              onClick={() => setPaymentFilter('UPI')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentFilter === 'UPI'
                  ? 'bg-indigo-50 border-2 border-indigo-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-indigo-950 font-heading">UPI / QR Code</h4>
                    <p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {upiCount} Bills
                </span>
              </div>
              <p className="text-xl font-black text-indigo-900 font-mono mt-3">₹{upiRevenue.toFixed(2)}</p>
              <span className="text-[10px] text-indigo-700 font-semibold">100% Instant Bank Settlement</span>
            </div>

            <div
              onClick={() => setPaymentFilter('CASH')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentFilter === 'CASH'
                  ? 'bg-amber-50 border-2 border-amber-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-amber-950 font-heading">Counter Cash</h4>
                    <p className="text-[10px] text-slate-500">Physical Cash in Drawer</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {cashCount} Bills
                </span>
              </div>
              <p className="text-xl font-black text-amber-900 font-mono mt-3">₹{cashRevenue.toFixed(2)}</p>
              <span className="text-[10px] text-amber-700 font-semibold">Ready for EOD Bank Deposit</span>
            </div>

            <div
              onClick={() => setPaymentFilter('CARD')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentFilter === 'CARD'
                  ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-blue-950 font-heading">Credit / Debit Cards</h4>
                    <p className="text-[10px] text-slate-500">POS EDC Terminal Swipes</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {cardCount} Bills
                </span>
              </div>
              <p className="text-xl font-black text-blue-900 font-mono mt-3">₹{cardRevenue.toFixed(2)}</p>
              <span className="text-[10px] text-blue-700 font-semibold">T+1 Card Batch Settlement</span>
            </div>

            <div
              onClick={() => setPaymentFilter('SPLIT')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentFilter === 'SPLIT'
                  ? 'bg-purple-50 border-2 border-purple-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-purple-950 font-heading">Split Payments</h4>
                    <p className="text-[10px] text-slate-500">Multi-Mode (Cash + UPI/Card)</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {splitCount} Bills
                </span>
              </div>
              <p className="text-xl font-black text-purple-900 font-mono mt-3">₹{splitRevenue.toFixed(2)}</p>
              <span className="text-[10px] text-purple-700 font-semibold">Multi-Channel Split Ledger</span>
            </div>
          </div>

          {/* Payment Method Filter Pills Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {[
                { id: 'ALL', label: 'All Modes' },
                { id: 'UPI', label: 'UPI / QR' },
                { id: 'CASH', label: 'Cash in Register' },
                { id: 'CARD', label: 'Credit/Debit Card' },
                { id: 'SPLIT', label: 'Split Payments' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setPaymentFilter(mode.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    paymentFilter === mode.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Filtered: <strong>{invoices.length} transactions</strong>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ── SHARED INVOICES TABLE (For Today's Bills & Payment Modes) ── */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {(segmentTab === 'TODAYS_BILLS' || segmentTab === 'PAYMENT_METHODS') && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            </div>
          )}

          <div className="overflow-y-auto flex-1">
            {invoices.length === 0 && !loading ? (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Receipt className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-700">No matching invoices found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {segmentTab === 'TODAYS_BILLS'
                    ? "No invoices have been finalized today yet. Complete a checkout from the billing terminal to see today's bills."
                    : 'No invoices found matching the selected payment filter.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Invoice # &amp; Date</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Doctor &amp; Counter</th>
                    <th className="p-3.5 text-center">Items</th>
                    <th className="p-3.5">Payment Method</th>
                    <th className="p-3.5 text-right">Taxable</th>
                    <th className="p-3.5 text-right">GST</th>
                    <th className="p-3.5 text-right">Grand Total</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoices.map((inv) => {
                    const isExpanded = expandedInvoiceNum === inv.invoiceNumber;
                    const patientName = inv.billingSession.patientDetails?.patientName || 'Walk-in Customer';
                    const patientPhone = inv.billingSession.patientDetails?.phone;
                    const doctorName = inv.billingSession.doctorDetails?.doctorName || 'Self / Direct Purchase';

                    return (
                      <React.Fragment key={inv.invoiceNumber}>
                        <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-emerald-50/30' : ''}`}>
                          {/* Invoice # & Date */}
                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-900 font-mono text-[12px]">
                              {inv.invoiceNumber}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{inv.invoiceDate}</span>
                            </div>
                          </td>

                          {/* Patient Details */}
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{patientName}</div>
                            {patientPhone ? (
                              <div className="text-[10px] text-slate-500 font-mono">Ph: {patientPhone}</div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Walk-in</span>
                            )}
                          </td>

                          {/* Doctor & Counter */}
                          <td className="p-3.5">
                            <div className="text-slate-700 font-semibold">{doctorName}</div>
                            <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                              Counter {inv.counterNumber || 1} • {inv.pharmacistName || 'Ramesh Kumar'}
                            </div>
                          </td>

                          {/* Items Count & Expand */}
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => setExpandedInvoiceNum(isExpanded ? null : inv.invoiceNumber)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              title="Click to view medicines list"
                            >
                              <span>{inv.billingSession.items.length} Meds</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>

                          {/* Payment Method Badge */}
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide ${
                              inv.payment.method === 'UPI'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : inv.payment.method === 'CASH'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : inv.payment.method === 'CREDIT_CARD' || inv.payment.method === 'CARD'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : inv.payment.method === 'DEBIT_CARD'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}>
                              {inv.payment.method.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Taxable Amount */}
                          <td className="p-3.5 text-right font-mono text-slate-600">
                            ₹{inv.subtotal.toFixed(2)}
                          </td>

                          {/* GST Amount */}
                          <td className="p-3.5 text-right font-mono text-slate-600">
                            ₹{(inv.totalCGST + inv.totalSGST).toFixed(2)}
                          </td>

                          {/* Grand Total */}
                          <td className="p-3.5 text-right">
                            <span className="text-sm font-black text-emerald-700 font-mono">
                              ₹{inv.grandTotal.toFixed(2)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleReprint(inv.invoiceNumber)}
                                className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                                title="Preview and Print Official Tax Invoice"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print</span>
                              </button>

                              <button
                                onClick={() => handleDownloadSingleCSV(inv)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Download CSV"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {isManager && (
                                <button
                                  onClick={() => handleDeleteInvoice(inv.invoiceNumber)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete invoice record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Items Breakdown */}
                        {isExpanded && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={9} className="p-3.5">
                              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
                                <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                                  <span>Medicines Billed ({inv.billingSession.items.length} items)</span>
                                  <span className="text-slate-500 font-normal">Invoice: {inv.invoiceNumber}</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {inv.billingSession.items.map((item, idx) => (
                                    <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                                      <div>
                                        <span className="font-bold text-slate-900">{item.product.name}</span>
                                        <span className="text-[10px] text-slate-500 ml-2">
                                          Batch: {item.selectedBatch.batchNumber} • Exp: {item.selectedBatch.expiryDate}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <span className="text-slate-600 font-medium">Qty: {item.quantity}</span>
                                        <span className="font-mono font-bold text-slate-900">₹{item.lineTotal.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: HELD CARTS (PARKED BILLS) ──────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {segmentTab === 'HELD_CARTS' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Held Carts Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/50">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Total Parked Carts</span>
              <p className="text-2xl font-black text-amber-900 font-heading mt-1">{combinedHeldBills.length} Held</p>
              <span className="text-[10px] text-amber-700">Awaiting customer return to counter</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-gradient-to-br from-white to-emerald-50/50">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Total Held Value</span>
              <p className="text-2xl font-black text-emerald-800 font-heading mt-1">₹{totalHeldAmount.toFixed(2)}</p>
              <span className="text-[10px] text-emerald-600">Pending checkout transactions</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quick Action</span>
              <p className="text-xs text-slate-600 mt-1">Click &quot;Resume&quot; on any held bill to load medicines directly into billing cart</p>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">0ms Latency Cart Restore</span>
            </div>
          </div>

          {/* Held Bills List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {heldLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold">Loading parked customer carts...</p>
              </div>
            ) : combinedHeldBills.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                  <PauseCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-700">No Parked Customer Carts</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  When a customer steps away (e.g. to get cash or doctor prescription), click &quot;Hold Bill&quot; on the billing terminal to park their cart here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {combinedHeldBills.map((held) => {
                  const isExpanded = expandedHeldId === held.id;
                  const assignedPharm = pharmacists.find(p => p.id === held.assignedPharmacistId) || pharmacists[0];

                  return (
                    <div key={held.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                            <Clock className="w-5 h-5 text-amber-700" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-sm text-slate-900">{held.customerName}</span>
                              <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                                Parked: {held.heldAt}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Phone: <strong className="text-slate-700">{held.customerPhone || 'N/A'}</strong> • Assigned: {assignedPharm?.name || 'Ramesh Kumar'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-base font-black text-slate-900 font-mono">
                              ₹{held.totalAmount.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold">
                              {held.billingSession.items.length} Medicines in Cart
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedHeldId(isExpanded ? null : held.id)}
                            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Inspect items in held cart"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDiscardHeldBill(held.id, held.customerName)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer"
                            title="Discard held cart"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResumeHeldBill(held)}
                            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            <span>Resume to Cart</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded items list */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                            Held Cart Contents:
                          </span>
                          {held.billingSession.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-b-0">
                              <div>
                                <span className="font-bold text-slate-900">{item.product.name}</span>
                                <span className="text-[10px] text-slate-500 ml-2">Qty: {item.quantity} ({item.unitMode || 'PACK'})</span>
                              </div>
                              <span className="font-mono font-bold text-slate-800">₹{item.lineTotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: RETURNS & CREDIT NOTES ─────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {segmentTab === 'RETURNS' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Returns Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs bg-gradient-to-br from-white to-rose-50/50">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Total Credit Notes</span>
              <p className="text-2xl font-black text-rose-900 font-heading mt-1">{combinedReturnNotes.length} Returns</p>
              <span className="text-[10px] text-rose-700">Processed sales returns</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/50">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Total Refund Value</span>
              <p className="text-2xl font-black text-amber-900 font-heading mt-1">₹{totalReturnAmount.toFixed(2)}</p>
              <span className="text-[10px] text-amber-700">Refunded via Cash, Credit &amp; UPI</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Inventory Restock</span>
              <p className="text-xs text-slate-600 mt-1">Returned unopened medicines are automatically restored to shelf rack inventory</p>
              <span className="text-[10px] text-emerald-700 font-bold mt-1 block">Automatic Batch Quantity Restock</span>
            </div>
          </div>

          {/* Returns Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {returnsLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold">Loading sales returns &amp; credit notes...</p>
              </div>
            ) : combinedReturnNotes.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                  <RotateCcw className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-700">No Sales Returns Logged</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  When a customer returns an item, use the &quot;Returns&quot; page to issue a GST credit note and refund the customer.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Credit Note #</th>
                    <th className="p-3.5">Original Invoice #</th>
                    <th className="p-3.5">Return Date</th>
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Items Returned</th>
                    <th className="p-3.5">Refund Mode</th>
                    <th className="p-3.5 text-right">Refund Amount</th>
                    <th className="p-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {combinedReturnNotes.map((note) => {
                    const isExpanded = expandedReturnId === note.creditNoteNo;
                    const refundAmt = note.totalRefundAmount || note.netRefundAmount || 0;

                    return (
                      <React.Fragment key={note.creditNoteNo}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-bold font-mono text-rose-800">
                            {note.creditNoteNo}
                          </td>
                          <td className="p-3.5 font-mono text-slate-700">
                            {note.originalInvoiceNo}
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {note.returnDate ? new Date(note.returnDate).toLocaleDateString() : 'Today'}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800">
                            {note.patientName || 'Walk-in Customer'}
                          </td>
                          <td className="p-3.5">
                            <button
                              type="button"
                              onClick={() => setExpandedReturnId(isExpanded ? null : note.creditNoteNo)}
                              className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center space-x-1 cursor-pointer"
                            >
                              <span>{note.items.length} Returned Item{note.items.length > 1 ? 's' : ''}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                              {note.refundMethod || 'CASH'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-black font-mono text-rose-700 text-sm">
                            ₹{refundAmt.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                              Restocked
                            </span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-rose-50/30">
                            <td colSpan={8} className="p-3">
                              <div className="bg-white border border-rose-200 rounded-xl p-3 space-y-2">
                                <span className="text-[10px] font-black uppercase text-rose-900 block">
                                  Items in Credit Note {note.creditNoteNo}:
                                </span>
                                <div className="divide-y divide-slate-100">
                                  {note.items.map((item, idx) => (
                                    <div key={idx} className="py-1 flex items-center justify-between text-xs">
                                      <div>
                                        <span className="font-bold text-slate-900">{item.productName}</span>
                                        <span className="text-[10px] text-slate-500 ml-2">Batch: {item.batchNumber}</span>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <span className="text-slate-600">Qty Returned: <strong>{item.quantityReturned}</strong></span>
                                        <span className="font-mono font-bold text-rose-700">₹{item.refundAmount.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default InvoicesPage;
