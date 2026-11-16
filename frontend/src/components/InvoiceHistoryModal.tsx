import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  setInvoiceHistoryModalOpen,
  reprintInvoice,
  setLatestFinalizedInvoice,
  deleteSavedInvoice,
  clearAllSavedInvoices,
  restoreHeldBill,
  navigateTo
} from '../store/posSlice';
import {
  X, Search, FileText, Printer, Download, Trash2,
  Calendar, CreditCard, DollarSign, Filter, RefreshCw, CheckCircle2, History,
  Loader2, PauseCircle, RotateCcw, ArrowRight, Clock, ShieldCheck, QrCode, Banknote, Wallet
} from 'lucide-react';
import type { FinalizedInvoice, HeldBill, ReturnCreditNote } from '../types/pos';
import api from '../utils/api';

export type InvoiceModalSegmentTab = 'TODAYS_BILLS' | 'PAYMENT_METHODS' | 'HELD_CARTS' | 'RETURNS';

export const InvoiceHistoryModal: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.pos.invoiceHistoryModal?.isOpen);
  const invoices = useSelector((state: RootState) => state.pos.invoices || []);
  const heldBills = useSelector((state: RootState) => state.pos.heldBills || []);
  const returnNotes = useSelector((state: RootState) => state.pos.returnNotes || []);
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'OWNER';

  const [segmentTab, setSegmentTab] = useState<InvoiceModalSegmentTab>('TODAYS_BILLS');
  const [apiInvoices, setApiInvoices] = useState<FinalizedInvoice[]>([]);
  const [apiHeldBills, setApiHeldBills] = useState<HeldBill[]>([]);
  const [apiReturns, setApiReturns] = useState<ReturnCreditNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('ALL');

  // Fetch invoices, held bills, and returns on open
  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [invRes, heldRes, retRes] = await Promise.allSettled([
          api.get('/invoices?limit=50&sortBy=date_desc'),
          api.get('/billing/held-bills'),
          api.get('/returns?limit=50')
        ]);

        if (invRes.status === 'fulfilled' && invRes.value.data.success && Array.isArray(invRes.value.data.data)) {
          setApiInvoices(invRes.value.data.data);
        }
        if (heldRes.status === 'fulfilled' && heldRes.value.data.success && Array.isArray(heldRes.value.data.data)) {
          setApiHeldBills(heldRes.value.data.data);
        }
        if (retRes.status === 'fulfilled' && retRes.value.data.success && Array.isArray(retRes.value.data.data)) {
          setApiReturns(retRes.value.data.data);
        }
      } catch (err) {
        console.error('[InvoiceHistoryModal] Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isOpen]);

  // Combine API invoices with Redux store invoices (avoid duplicates by invoiceNumber)
  const combinedInvoices = useMemo(() => {
    const map = new Map<string, FinalizedInvoice>();
    apiInvoices.forEach(inv => {
      if (inv.invoiceNumber) map.set(inv.invoiceNumber, inv);
    });
    invoices.forEach(inv => {
      if (inv.invoiceNumber) map.set(inv.invoiceNumber, inv);
    });
    return Array.from(map.values());
  }, [apiInvoices, invoices]);

  // Combined Held Bills
  const combinedHeldBills = useMemo(() => {
    const map = new Map<string, HeldBill>();
    apiHeldBills.forEach(h => map.set(h.id, h));
    heldBills.forEach(h => map.set(h.id, h));
    return Array.from(map.values());
  }, [apiHeldBills, heldBills]);

  // Combined Returns
  const combinedReturnNotes = useMemo(() => {
    const map = new Map<string, ReturnCreditNote>();
    apiReturns.forEach(r => map.set(r.creditNoteNo, r));
    returnNotes.forEach(r => map.set(r.creditNoteNo, r));
    return Array.from(map.values());
  }, [apiReturns, returnNotes]);

  if (!isOpen) return null;

  // Today's date string representation
  const todayDateStr = new Date().toISOString().slice(0, 10);

  // Filter invoices based on active segmented tab
  const filteredInvoices = combinedInvoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.billingSession?.patientDetails?.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.billingSession?.patientDetails?.phone || '').includes(searchQuery) ||
      (inv.billingSession?.doctorDetails?.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.billingSession?.items || []).some(item => (item.product?.name || (item as any).productSnapshot?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPayment = paymentFilter === 'ALL' || inv.payment?.method === paymentFilter;

    const matchesToday =
      segmentTab !== 'TODAYS_BILLS' ||
      (inv.invoiceDate && (inv.invoiceDate.includes(todayDateStr) || inv.invoiceDate.toLowerCase().includes('today') || true));

    return matchesSearch && matchesPayment && matchesToday;
  });

  // Filter held bills by search
  const filteredHeldBills = combinedHeldBills.filter(h =>
    h.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.customerPhone.includes(searchQuery) ||
    h.billingSession.items.some(i => i.product.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter returns by search
  const filteredReturns = combinedReturnNotes.filter(r =>
    r.creditNoteNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.originalInvoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.patientName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Summary metrics
  const totalInvoicesCount = combinedInvoices.length;
  const totalRevenue = combinedInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const upiRevenue = combinedInvoices.filter(inv => inv.payment?.method === 'UPI').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const cashRevenue = combinedInvoices.filter(inv => inv.payment?.method === 'CASH').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalHeldAmount = combinedHeldBills.reduce((sum, h) => sum + h.totalAmount, 0);
  const totalReturnAmount = combinedReturnNotes.reduce((sum, r) => sum + (r.totalRefundAmount || r.netRefundAmount || 0), 0);

  const handleReprint = async (invoiceNumber: string) => {
    try {
      const res = await api.get(`/invoices/${invoiceNumber}`);
      if (res.data.success && res.data.data) {
        dispatch(setLatestFinalizedInvoice(res.data.data));
      } else {
        dispatch(reprintInvoice(invoiceNumber));
      }
    } catch {
      dispatch(reprintInvoice(invoiceNumber));
    }
    dispatch(setInvoiceHistoryModalOpen(false));
  };

  const handleResumeHeldBill = (held: HeldBill) => {
    const heldId = held.id || (held as any)._id;
    dispatch(restoreHeldBill(heldId));
    api.delete(`/billing/held-bills/${heldId}`).catch(console.error);
    dispatch(setInvoiceHistoryModalOpen(false));
    dispatch(navigateTo('POS_TERMINAL'));
  };

  const handleDiscardHeldBill = async (id: string, name: string) => {
    if (window.confirm(`Discard held bill for ${name}?`)) {
      try {
        await api.delete(`/billing/held-bills/${id}`);
      } catch (err) {
        console.warn('Delete held bill fallback:', err);
      }
      setApiHeldBills(prev => prev.filter(h => h.id !== id));
    }
  };

  const handleDownloadSingleCSV = (inv: FinalizedInvoice) => {
    let csv = 'Invoice Number,Date,Patient Name,Patient Phone,Doctor Name,Item Name,Batch,Exp,Qty,Unit Price,Discount %,GST %,Line Total\n';
    inv.billingSession.items.forEach(item => {
      csv += `"${inv.invoiceNumber}","${inv.invoiceDate}","${inv.billingSession.patientDetails?.patientName || 'Walk-in'}","${inv.billingSession.patientDetails?.phone || ''}","${inv.billingSession.doctorDetails?.doctorName || ''}","${item.product.name}","${item.selectedBatch.batchNumber}","${item.selectedBatch.expiryDate}",${item.quantity},${item.unitPrice},${item.discountPercent}%,${item.product.gstRate}%,${item.lineTotal}\n`;
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
    if (combinedInvoices.length === 0) return;
    let csv = 'Invoice Number,Date,Patient Name,Phone,Doctor,Items Count,Subtotal,Discount,CGST,SGST,Grand Total,Payment Method\n';
    combinedInvoices.forEach(inv => {
      csv += `"${inv.invoiceNumber}","${inv.invoiceDate}","${inv.billingSession.patientDetails?.patientName || 'Walk-in'}","${inv.billingSession.patientDetails?.phone || ''}","${inv.billingSession.doctorDetails?.doctorName || ''}",${inv.billingSession.items.length},${inv.subtotal},${inv.totalDiscount},${inv.totalCGST},${inv.totalSGST},${inv.grandTotal},${inv.payment.method}\n`;
    });

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `All_Saved_Invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MODAL_TABS = [
    { id: 'TODAYS_BILLS' as const, label: "Today's Bills", icon: Calendar, count: `${combinedInvoices.length}` },
    { id: 'PAYMENT_METHODS' as const, label: 'Payment Methods', icon: CreditCard, count: 'Channels' },
    { id: 'HELD_CARTS' as const, label: 'Held Carts', icon: PauseCircle, count: `${combinedHeldBills.length}` },
    { id: 'RETURNS' as const, label: 'Returns', icon: RotateCcw, count: `${combinedReturnNotes.length}` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-modal rounded-2xl max-w-5xl w-full p-5 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">

        {/* Top Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-2 flex-shrink-0">
          <div className="flex items-center space-x-2 text-emerald-800">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <History className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-heading text-slate-900 leading-tight">
                Saved Invoices &amp; Billing History
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Segmented audit ledger: Today's bills, Payment modes, Parked carts &amp; Returns
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {combinedInvoices.length > 0 && (
              <button
                onClick={handleExportAllCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Export all invoices to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}

            <button
              onClick={() => dispatch(setInvoiceHistoryModalOpen(false))}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Segmented Filter Tabs Bar (Day 5 Feature in Modal) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl space-x-1 mb-3 shrink-0">
          {MODAL_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = segmentTab === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSegmentTab(t.id)}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-emerald-950 shadow-xs border border-emerald-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span>{t.label}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary Metric Cards */}
        {segmentTab === 'TODAYS_BILLS' && (
          <div className="grid grid-cols-4 gap-2.5 mb-3 flex-shrink-0">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total Saved Invoices</div>
              <div className="text-base font-black text-slate-900 mt-0.5">{totalInvoicesCount} Bills</div>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Total Sales Value</div>
              <div className="text-base font-black text-emerald-900 mt-0.5">₹{totalRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
              <div className="text-[10px] font-bold text-indigo-700 uppercase">UPI / Online Sales</div>
              <div className="text-base font-black text-indigo-900 mt-0.5">₹{upiRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <div className="text-[10px] font-bold text-amber-700 uppercase">Cash in Register</div>
              <div className="text-base font-black text-amber-900 mt-0.5">₹{cashRevenue.toFixed(2)}</div>
            </div>
          </div>
        )}

        {segmentTab === 'PAYMENT_METHODS' && (
          <div className="grid grid-cols-4 gap-2.5 mb-3 flex-shrink-0">
            <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
              <div className="text-[10px] font-bold text-indigo-700 uppercase">UPI Settlements</div>
              <div className="text-base font-black text-indigo-900 mt-0.5">₹{upiRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <div className="text-[10px] font-bold text-amber-700 uppercase">Cash Collected</div>
              <div className="text-base font-black text-amber-900 mt-0.5">₹{cashRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
              <div className="text-[10px] font-bold text-blue-700 uppercase">Card Swipes</div>
              <div className="text-base font-black text-blue-900 mt-0.5">
                ₹{combinedInvoices.filter(i => ['CARD', 'CREDIT_CARD', 'DEBIT_CARD'].includes(i.payment.method)).reduce((s, i) => s + i.grandTotal, 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
              <div className="text-[10px] font-bold text-purple-700 uppercase">Split Payments</div>
              <div className="text-base font-black text-purple-900 mt-0.5">
                ₹{combinedInvoices.filter(i => i.payment.method === 'SPLIT').reduce((s, i) => s + i.grandTotal, 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {segmentTab === 'HELD_CARTS' && (
          <div className="grid grid-cols-2 gap-2.5 mb-3 flex-shrink-0">
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <div className="text-[10px] font-bold text-amber-700 uppercase">Active Parked Carts</div>
              <div className="text-base font-black text-amber-900 mt-0.5">{combinedHeldBills.length} Held Bills</div>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Total Parked Value</div>
              <div className="text-base font-black text-emerald-900 mt-0.5">₹{totalHeldAmount.toFixed(2)}</div>
            </div>
          </div>
        )}

        {segmentTab === 'RETURNS' && (
          <div className="grid grid-cols-2 gap-2.5 mb-3 flex-shrink-0">
            <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <div className="text-[10px] font-bold text-rose-700 uppercase">Total Sales Returns</div>
              <div className="text-base font-black text-rose-900 mt-0.5">{combinedReturnNotes.length} Returns</div>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <div className="text-[10px] font-bold text-amber-700 uppercase">Total Refunded Value</div>
              <div className="text-base font-black text-amber-900 mt-0.5">₹{totalReturnAmount.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Invoice #, Patient Name, Phone, Doctor, or Medicine..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Payment Method Filter Pills (only when on payment tab) */}
          {segmentTab === 'PAYMENT_METHODS' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl space-x-1 border border-slate-200 text-xs font-semibold overflow-x-auto">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'UPI', label: 'UPI' },
                { id: 'CASH', label: 'Cash' },
                { id: 'CARD', label: 'Card' },
                { id: 'SPLIT', label: 'Split' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setPaymentFilter(mode.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    paymentFilter === mode.id
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body: Invoices, Held Bills, or Returns */}
        <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200">
          {/* TAB 1 & 2: INVOICES */}
          {(segmentTab === 'TODAYS_BILLS' || segmentTab === 'PAYMENT_METHODS') && (
            filteredInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <FileText className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                <p className="text-sm font-bold text-slate-600">No matching invoices found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Completed bills will automatically be saved here after final checkout.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0">
                    <th className="p-3">Invoice # &amp; Date</th>
                    <th className="p-3">Patient Details</th>
                    <th className="p-3">Doctor Name</th>
                    <th className="p-3 text-center">Items</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3 text-right">Grand Total</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const patientName = inv.billingSession.patientDetails?.patientName || 'Walk-in Customer';
                    const patientPhone = inv.billingSession.patientDetails?.phone;
                    const doctorName = inv.billingSession.doctorDetails?.doctorName || 'Direct Purchase';

                    return (
                      <tr key={inv.invoiceNumber} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium">
                          <div className="font-bold text-slate-900 font-mono">{inv.invoiceNumber}</div>
                          <div className="text-[10px] text-slate-500">{inv.invoiceDate}</div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-800">{patientName}</div>
                          {patientPhone && <div className="text-[10px] text-slate-500">Ph: {patientPhone}</div>}
                        </td>

                        <td className="p-3">
                          <div className="text-slate-700 font-medium">{doctorName}</div>
                        </td>

                        <td className="p-3 text-center">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                            {inv.billingSession.items.length} Meds
                          </span>
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            inv.payment.method === 'UPI'
                              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                              : inv.payment.method === 'CASH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {inv.payment.method.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="p-3 text-right font-black text-slate-900 text-sm font-mono">
                          ₹{inv.grandTotal.toFixed(2)}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleReprint(inv.invoiceNumber)}
                              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                              title="View & Print Official Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print</span>
                            </button>

                            <button
                              onClick={() => handleDownloadSingleCSV(inv)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Download CSV breakdown"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}

          {/* TAB 3: HELD CARTS */}
          {segmentTab === 'HELD_CARTS' && (
            filteredHeldBills.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <PauseCircle className="w-12 h-12 mx-auto text-amber-400 stroke-1" />
                <p className="text-sm font-bold text-slate-600">No Parked Customer Carts</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click &quot;Hold Bill&quot; on the billing terminal to park carts when customers step away.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredHeldBills.map((held) => (
                  <div key={held.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs text-slate-900">{held.customerName}</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          Parked: {held.heldAt}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Phone: {held.customerPhone || 'N/A'} • {held.billingSession.items.length} Medicines in cart
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-black text-slate-900 font-mono">
                        ₹{held.totalAmount.toFixed(2)}
                      </span>

                      <button
                        onClick={() => handleDiscardHeldBill(held.id, held.customerName)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Discard held cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleResumeHeldBill(held)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        <span>Resume</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 4: RETURNS */}
          {segmentTab === 'RETURNS' && (
            filteredReturns.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RotateCcw className="w-12 h-12 mx-auto text-rose-400 stroke-1" />
                <p className="text-sm font-bold text-slate-600">No Sales Returns Logged</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Sales returns and credit notes issued will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredReturns.map((note) => (
                  <div key={note.creditNoteNo} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs text-rose-800 font-mono">{note.creditNoteNo}</span>
                        <span className="text-[10px] text-slate-500">Orig Inv: {note.originalInvoiceNo}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          Restocked
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Customer: <strong className="text-slate-800">{note.patientName || 'Walk-in'}</strong> • {note.items.length} Items returned ({note.refundMethod || 'CASH'})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-rose-700 font-mono">
                        ₹{(note.totalRefundAmount || note.netRefundAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer info & close */}
        <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between mt-2.5 flex-shrink-0">
          <span className="text-[11px] text-slate-500">
            {segmentTab === 'TODAYS_BILLS' && `Showing ${filteredInvoices.length} of ${totalInvoicesCount} invoices`}
            {segmentTab === 'PAYMENT_METHODS' && `Showing ${filteredInvoices.length} filtered transactions`}
            {segmentTab === 'HELD_CARTS' && `Showing ${filteredHeldBills.length} active parked carts`}
            {segmentTab === 'RETURNS' && `Showing ${filteredReturns.length} returned credit notes`}
          </span>
          <button
            onClick={() => dispatch(setInvoiceHistoryModalOpen(false))}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};

export default InvoiceHistoryModal;
