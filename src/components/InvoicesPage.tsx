import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  navigateTo,
  reprintInvoice,
  deleteSavedInvoice,
  clearAllSavedInvoices
} from '../store/posSlice';
import type { FinalizedInvoice } from '../types/pos';
import { getMedicineDetails } from '../utils/medicineDetails';
import {
  History, Search, Download, Printer, Trash2, ChevronDown, ChevronUp,
  CreditCard, DollarSign, Calendar, Filter, ShoppingCart, Eye,
  CheckCircle2, ArrowUpDown, FileSpreadsheet, Plus, AlertCircle, Sparkles
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const dispatch = useDispatch();
  const invoices = useSelector((state: RootState) => state.pos.invoices || []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [sortKey, setSortKey] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [expandedInvoiceNum, setExpandedInvoiceNum] = useState<string | null>(null);

  // ── Metrics Calculation ──────────────────────────────────────────────────
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const upiRevenue = invoices.filter(inv => inv.payment.method === 'UPI').reduce((sum, inv) => sum + inv.grandTotal, 0);
  const cashRevenue = invoices.filter(inv => inv.payment.method === 'CASH').reduce((sum, inv) => sum + inv.grandTotal, 0);
  const cardRevenue = invoices.filter(inv => ['CARD', 'CREDIT_CARD', 'DEBIT_CARD'].includes(inv.payment.method)).reduce((sum, inv) => sum + inv.grandTotal, 0);
  const avgOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
  const totalGstCollected = invoices.reduce((sum, inv) => sum + inv.totalCGST + inv.totalSGST, 0);

  // ── Filtering Logic ───────────────────────────────────────────────────────
  const filteredInvoices = invoices.filter(inv => {
    // 1. Text Search
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchesInvNo = inv.invoiceNumber.toLowerCase().includes(q);
      const matchesPatient = (inv.billingSession.patientDetails?.patientName || '').toLowerCase().includes(q);
      const matchesPhone = (inv.billingSession.patientDetails?.phone || '').includes(q);
      const matchesDoctor = (inv.billingSession.doctorDetails?.doctorName || '').toLowerCase().includes(q);
      const matchesItem = inv.billingSession.items.some(
        item => item.product.name.toLowerCase().includes(q) || item.product.saltComposition.toLowerCase().includes(q)
      );
      if (!matchesInvNo && !matchesPatient && !matchesPhone && !matchesDoctor && !matchesItem) return false;
    }

    // 2. Payment Method Filter
    if (paymentFilter !== 'ALL' && inv.payment.method !== paymentFilter) return false;

    // 3. Date Filter
    if (dateFilter !== 'ALL') {
      const invDate = new Date(inv.invoiceDate);
      const now = new Date();
      if (dateFilter === 'TODAY') {
        const todayStr = now.toDateString();
        if (invDate.toDateString() !== todayStr) return false;
      } else if (dateFilter === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (invDate < weekAgo) return false;
      } else if (dateFilter === 'MONTH') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (invDate < monthAgo) return false;
      }
    }

    return true;
  });

  // ── Sorting Logic ─────────────────────────────────────────────────────────
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortKey) {
      case 'date_asc':
        return new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
      case 'amount_desc':
        return b.grandTotal - a.grandTotal;
      case 'amount_asc':
        return a.grandTotal - b.grandTotal;
      case 'date_desc':
      default:
        return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
    }
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleReprint = (invoiceNumber: string) => {
    dispatch(reprintInvoice(invoiceNumber));
  };

  const handleDownloadSingleCSV = (inv: FinalizedInvoice) => {
    let csv = 'Invoice Number,Date,Patient Name,Patient Phone,Doctor Name,Item Name,Type,Pack Size,Selling Unit,Batch,Exp,Qty,Unit Price,Discount %,GST %,Line Total\n';
    inv.billingSession.items.forEach(item => {
      const details = getMedicineDetails(item.product);
      const isLoose = item.unitMode === 'LOOSE';
      csv += `"${inv.invoiceNumber}","${inv.invoiceDate}","${inv.billingSession.patientDetails?.patientName || 'Walk-in'}","${inv.billingSession.patientDetails?.phone || ''}","${inv.billingSession.doctorDetails?.doctorName || 'Direct'}","${item.product.name}","${details.medicineType}","${details.packSize}","${isLoose ? 'Loose' : 'Pack'}","${item.selectedBatch.batchNumber}","${item.selectedBatch.expiryDate}",${item.quantity},${item.unitPrice.toFixed(2)},${item.discountPercent}%,${item.product.gstRate}%,${item.lineTotal.toFixed(2)}\n`;
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

  const toggleExpand = (invoiceNumber: string) => {
    setExpandedInvoiceNum(prev => (prev === invoiceNumber ? null : invoiceNumber));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-5 space-y-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight">
              Invoices &amp; Billing History
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Complete sales ledger, tax invoice records, re-printing, and customer audit trail
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {invoices.length > 0 && (
            <button
              onClick={handleExportAllCSV}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
              title="Export all invoices to Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export All CSV</span>
            </button>
          )}

          {invoices.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete ALL saved invoices? This action cannot be undone.')) {
                  dispatch(clearAllSavedInvoices());
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
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

      {/* ── KPI Metric Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Invoices */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Invoices</div>
          <div className="text-xl font-black text-slate-900 font-heading mt-1">{totalInvoices}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Completed bills</div>
        </div>

        {/* Gross Sales */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs bg-gradient-to-br from-white to-emerald-50/40">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Gross Revenue</div>
          <div className="text-xl font-black text-emerald-800 font-heading mt-1">₹{totalRevenue.toFixed(2)}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">All transactions</div>
        </div>

        {/* UPI / Digital Collections */}
        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-2xs bg-gradient-to-br from-white to-indigo-50/40">
          <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">UPI / QR Sales</div>
          <div className="text-xl font-black text-indigo-900 font-heading mt-1">₹{upiRevenue.toFixed(2)}</div>
          <div className="text-[10px] text-indigo-600 font-medium mt-0.5">Instant settlement</div>
        </div>

        {/* Cash Collections */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/40">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Cash Collected</div>
          <div className="text-xl font-black text-amber-900 font-heading mt-1">₹{cashRevenue.toFixed(2)}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">Counter cash</div>
        </div>

        {/* Total GST */}
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs bg-gradient-to-br from-white to-blue-50/40">
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">GST Collected</div>
          <div className="text-xl font-black text-blue-900 font-heading mt-1">₹{totalGstCollected.toFixed(2)}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-0.5">CGST + SGST</div>
        </div>

        {/* Avg Ticket Size */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Bill</div>
          <div className="text-xl font-black text-slate-800 font-heading mt-1">₹{avgOrderValue.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Per invoice average</div>
        </div>
      </div>

      {/* ── Search, Filters & Controls Toolbar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Invoice #, Patient Name, Phone, Doctor, or Medicine..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort by:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: Highest First</option>
              <option value="amount_asc">Amount: Lowest First</option>
            </select>
          </div>
        </div>

        {/* Filter Pills: Payment Method & Time Range */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Payment Method Pills */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Payment:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'UPI', label: 'UPI' },
              { id: 'CASH', label: 'Cash' },
              { id: 'CREDIT_CARD', label: 'Credit Card' },
              { id: 'DEBIT_CARD', label: 'Debit Card' },
              { id: 'AUTO_PAY', label: 'AutoPay' },
              { id: 'SPLIT', label: 'Split' },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setPaymentFilter(mode.id as any)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  paymentFilter === mode.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Time:</span>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: 'WEEK', label: 'Last 7 Days' },
              { id: 'MONTH', label: 'Last 30 Days' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setDateFilter(t.id as any)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  dateFilter === t.id
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Invoices List & Item Inspection Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {sortedInvoices.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <History className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-700">No matching invoices found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Completed sales receipts from the billing terminal will automatically be recorded here. Try changing your search keywords or filter settings.
            </p>
            <button
              onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Go to Billing Terminal</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Invoice # &amp; Date</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Doctor Name</th>
                  <th className="p-3.5 text-center">Items Ordered</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5 text-right">Taxable</th>
                  <th className="p-3.5 text-right">GST</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sortedInvoices.map((inv) => {
                  const isExpanded = expandedInvoiceNum === inv.invoiceNumber;
                  const patientName = inv.billingSession.patientDetails?.patientName || 'Walk-in Customer';
                  const patientPhone = inv.billingSession.patientDetails?.phone;
                  const doctorName = inv.billingSession.doctorDetails?.doctorName || 'Self / Direct Purchase';

                  // Calculate total tablets / units
                  const totalTablets = inv.billingSession.items.reduce((sum, item) => {
                    const details = getMedicineDetails(item.product);
                    const isLoose = item.unitMode === 'LOOSE';
                    return sum + (isLoose ? item.quantity : item.quantity * details.unitsPerPack);
                  }, 0);

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
                            <span className="text-[10px] text-slate-400 italic">No phone recorded</span>
                          )}
                        </td>

                        {/* Doctor & Pharmacist */}
                        <td className="p-3.5">
                          <div className="text-slate-700 font-semibold">{doctorName}</div>
                          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                            Pharmacist: {inv.pharmacistName || 'Ramesh Kumar'} (C-{inv.counterNumber || 1})
                          </div>
                        </td>

                        {/* Items Count & Total Units */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => toggleExpand(inv.invoiceNumber)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            title="Click to expand full medicine items list"
                          >
                            <span>{inv.billingSession.items.length} Meds ({totalTablets} Units)</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
                          </button>
                        </td>

                        {/* Payment Method Badge */}
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide ${
                            inv.payment.method === 'UPI'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : inv.payment.method === 'CASH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : inv.payment.method === 'CREDIT_CARD'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : inv.payment.method === 'DEBIT_CARD'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : inv.payment.method === 'AUTO_PAY'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : inv.payment.method === 'CARD'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
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
                            {/* View & Print Official Invoice */}
                            <button
                              onClick={() => handleReprint(inv.invoiceNumber)}
                              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                              title="Preview and Print Official Tax Invoice (A4 & Thermal)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View / Print</span>
                            </button>

                            {/* Download Single CSV */}
                            <button
                              onClick={() => handleDownloadSingleCSV(inv)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Download invoice CSV"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Delete Invoice Record */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove invoice ${inv.invoiceNumber} from history?`)) {
                                  dispatch(deleteSavedInvoice(inv.invoiceNumber));
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expandable Medicine Items Inspection Row ── */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={9} className="p-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Invoice Line Items Breakdown ({inv.billingSession.items.length} Medicines)</span>
                                </h4>
                                <span className="text-[11px] text-slate-500">
                                  Pharmacist: <strong className="text-slate-800">{inv.pharmacistName || 'Ramesh Kumar'} (Counter {inv.counterNumber || 1})</strong>
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9.5px]">
                                      <th className="p-2">#</th>
                                      <th className="p-2">Medicine &amp; Salt Composition</th>
                                      <th className="p-2">Type / Pack</th>
                                      <th className="p-2">Batch #</th>
                                      <th className="p-2">Expiry</th>
                                      <th className="p-2 text-center">Billed Qty</th>
                                      <th className="p-2 text-right">Unit Price</th>
                                      <th className="p-2 text-right">Disc %</th>
                                      <th className="p-2 text-right">Taxable</th>
                                      <th className="p-2 text-right">GST Rate</th>
                                      <th className="p-2 text-right">Line Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {inv.billingSession.items.map((item, idx) => {
                                      const details = getMedicineDetails(item.product);
                                      const isLoose = item.unitMode === 'LOOSE';
                                      const unitsLine = isLoose ? item.quantity : item.quantity * details.unitsPerPack;

                                      return (
                                        <tr key={idx} className="hover:bg-slate-50/60">
                                          <td className="p-2 text-slate-400 font-bold">{idx + 1}</td>
                                          <td className="p-2">
                                            <div className="font-bold text-slate-900">{item.product.name}</div>
                                            <div className="text-[10px] text-slate-500">{item.product.saltComposition}</div>
                                          </td>
                                          <td className="p-2">
                                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold">
                                              {details.medicineType} · {details.packSize}
                                            </span>
                                          </td>
                                          <td className="p-2 font-mono text-[11px] text-slate-800">{item.selectedBatch.batchNumber}</td>
                                          <td className="p-2 font-mono text-[11px] text-slate-500">{item.selectedBatch.expiryDate}</td>
                                          <td className="p-2 text-center font-bold">
                                            <span className={isLoose ? 'text-purple-700 font-extrabold' : 'text-slate-800'}>
                                              {item.quantity} {isLoose ? 'Tabs (Loose)' : 'Packs'}
                                            </span>
                                            <div className="text-[9px] text-emerald-700 font-mono">(= {unitsLine} Units)</div>
                                          </td>
                                          <td className="p-2 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                                          <td className="p-2 text-right text-emerald-700 font-bold">{item.discountPercent}%</td>
                                          <td className="p-2 text-right font-mono">₹{item.taxableAmount.toFixed(2)}</td>
                                          <td className="p-2 text-right text-slate-600">{item.product.gstRate}%</td>
                                          <td className="p-2 text-right font-extrabold text-slate-900 font-mono">₹{item.lineTotal.toFixed(2)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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
          </div>
        )}

        {/* Table Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong>{sortedInvoices.length}</strong> of <strong>{totalInvoices}</strong> recorded invoices</span>
          <span className="text-slate-400 text-[11px]">All records stored locally &amp; synced</span>
        </div>
      </div>
    </div>
  );
};
