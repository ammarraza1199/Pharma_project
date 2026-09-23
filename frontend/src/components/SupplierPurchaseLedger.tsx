import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { recordSupplierPayment, addSupplierBill } from '../store/posSlice';
import type { SupplierBill } from '../types/pos';
import {
  FileText, DollarSign, Clock, AlertTriangle, CheckCircle2,
  Calendar, Building, Plus, Search, Filter, MessageSquare,
  CreditCard, ArrowUpRight, History, X, Check, ShieldAlert
} from 'lucide-react';

interface Props {
  onSwitchToPO?: () => void;
}

export const SupplierPurchaseLedger: React.FC<Props> = ({ onSwitchToPO }) => {
  const dispatch = useDispatch();
  const suppliers = useSelector((state: RootState) => state.pos.suppliers);
  const supplierBills = useSelector((state: RootState) => state.pos.supplierBills);
  const paymentLogs = useSelector((state: RootState) => state.pos.supplierPaymentLogs);
  const storeSettings = useSelector((state: RootState) => state.pos.settings);

  // Filter state
  const [activeTab, setActiveTab] = useState<'ALL' | 'CREDIT' | 'OVERDUE' | 'CASH' | 'LOGS'>('CREDIT');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');

  // Settlement Modal State
  const [settlementBill, setSettlementBill] = useState<SupplierBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'NEFT_RTGS' | 'UPI' | 'CHEQUE' | 'CASH'>('NEFT_RTGS');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Add Bill Modal State
  const [showAddBillModal, setShowAddBillModal] = useState<boolean>(false);
  const [newBillSupplierId, setNewBillSupplierId] = useState<string>(suppliers[0]?.supplierId || '');
  const [newBillInvoiceNo, setNewBillInvoiceNo] = useState<string>(`INV-SUP-${Math.floor(10000 + Math.random() * 90000)}`);
  const [newBillType, setNewBillType] = useState<'CASH' | 'CREDIT'>('CREDIT');
  const [newBillCreditDays, setNewBillCreditDays] = useState<number>(15);
  const [newBillTotalAmount, setNewBillTotalAmount] = useState<number>(12500);
  const [newBillNotes, setNewBillNotes] = useState<string>('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to calculate days remaining
  const getDaysRemaining = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // KPIs
  const totalOutstandingCredit = supplierBills
    .filter(b => b.billType === 'CREDIT')
    .reduce((sum, b) => sum + b.pendingAmount, 0);

  const overdueBills = supplierBills.filter(b => {
    if (b.billType !== 'CREDIT' || b.pendingAmount <= 0) return false;
    return getDaysRemaining(b.dueDate) < 0;
  });
  const totalOverdueAmount = overdueBills.reduce((sum, b) => sum + b.pendingAmount, 0);

  const nearDue10Or15Bills = supplierBills.filter(b => {
    if (b.billType !== 'CREDIT' || b.pendingAmount <= 0) return false;
    const days = getDaysRemaining(b.dueDate);
    return days >= 0 && days <= 15;
  });
  const totalNearDueAmount = nearDue10Or15Bills.reduce((sum, b) => sum + b.pendingAmount, 0);

  const totalCashSettled = supplierBills
    .filter(b => b.billType === 'CASH')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // Filtered bills list
  const filteredBills = supplierBills.filter(b => {
    if (selectedSupplierFilter !== 'ALL' && b.supplierId !== selectedSupplierFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchInv = b.invoiceNumber.toLowerCase().includes(term);
      const matchSup = b.supplierName.toLowerCase().includes(term);
      const matchNotes = (b.notes || '').toLowerCase().includes(term);
      if (!matchInv && !matchSup && !matchNotes) return false;
    }

    if (activeTab === 'CREDIT') return b.billType === 'CREDIT' && b.pendingAmount > 0;
    if (activeTab === 'OVERDUE') return b.billType === 'CREDIT' && b.pendingAmount > 0 && getDaysRemaining(b.dueDate) < 0;
    if (activeTab === 'CASH') return b.billType === 'CASH';
    return true; // 'ALL'
  });

  // Open Settlement Modal
  const handleOpenSettlement = (bill: SupplierBill) => {
    setSettlementBill(bill);
    setPaymentAmount(bill.pendingAmount);
    setPaymentMode('NEFT_RTGS');
    setReferenceNo(`NEFT${Date.now().toString().slice(-8)}`);
    setPaymentNotes(`Payment settlement for invoice ${bill.invoiceNumber}`);
  };

  // Submit Settlement Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementBill || paymentAmount <= 0) return;

    dispatch(recordSupplierPayment({
      supplierId: settlementBill.supplierId,
      amount: Number(paymentAmount),
      paymentMode,
      referenceNo: referenceNo.trim() || `REF-${Date.now()}`,
      billInvoiceNo: settlementBill.invoiceNumber,
      notes: paymentNotes
    }));

    alert(`✓ Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully against ${settlementBill.invoiceNumber}!`);
    setSettlementBill(null);
  };

  // WhatsApp Intimation Link Generator
  const handleWhatsAppIntimation = (bill: SupplierBill) => {
    const supplier = suppliers.find(s => s.supplierId === bill.supplierId);
    const phone = supplier?.phone?.replace(/[^0-9]/g, '') || '';
    const storeName = storeSettings.storeName || 'GenQuanta Pharmacy';

    const text = `*SUPPLIER PURCHASE INTIMATION - ${storeName}*\n` +
      `--------------------------------\n` +
      `Vendor: ${bill.supplierName}\n` +
      `Invoice No: ${bill.invoiceNumber}\n` +
      `Bill Type: ${bill.billType} (${bill.creditDays ? `${bill.creditDays}-Day Credit` : 'Spot'})\n` +
      `Total Amount: ₹${bill.totalAmount.toLocaleString('en-IN')}\n` +
      `Paid So Far: ₹${bill.paidAmount.toLocaleString('en-IN')}\n` +
      `Pending Dues: ₹${bill.pendingAmount.toLocaleString('en-IN')}\n` +
      `Due Date: ${bill.dueDate}\n` +
      `--------------------------------\n` +
      `Status: ${bill.status}\n` +
      `Thank you for your continuous B2B supply partnership!`;

    window.open(`https://wa.me/${phone ? (phone.startsWith('91') ? phone : `91${phone}`) : ''}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Handle Add New Bill Submit
  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.supplierId === newBillSupplierId) || suppliers[0];
    if (!sup) {
      alert('Please register a supplier first.');
      return;
    }

    const billDateStr = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + (newBillType === 'CREDIT' ? Number(newBillCreditDays) : 0));
    const dueDateStr = dueDateObj.toISOString().split('T')[0];

    const isCash = newBillType === 'CASH';

    dispatch(addSupplierBill({
      supplierId: sup.supplierId,
      supplierName: sup.name,
      invoiceNumber: newBillInvoiceNo.trim(),
      billDate: billDateStr,
      dueDate: dueDateStr,
      creditDays: isCash ? 0 : Number(newBillCreditDays),
      billType: newBillType,
      totalAmount: Number(newBillTotalAmount),
      paidAmount: isCash ? Number(newBillTotalAmount) : 0,
      pendingAmount: isCash ? 0 : Number(newBillTotalAmount),
      status: isCash ? 'PAID' : 'PENDING',
      notes: newBillNotes || `${newBillType} shipment entry`
    }));

    alert(`✓ Supplier bill "${newBillInvoiceNo}" created successfully!`);
    setShowAddBillModal(false);
    setNewBillInvoiceNo(`INV-SUP-${Math.floor(10000 + Math.random() * 90000)}`);
    setNewBillNotes('');
  };

  return (
    <div className="space-y-4">
      {/* ── KPI METRICS BAR ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Credit Dues */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Credit Outstanding</span>
            <div className="text-xl font-black text-amber-800 font-heading mt-0.5">
              ₹{totalOutstandingCredit.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-amber-600 font-semibold mt-0.5 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Credit Supplier Ledger</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* 10-Day & 15-Day Near Due */}
        <div className="bg-white rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Due in 10–15 Days</span>
            <div className="text-xl font-black text-blue-900 font-heading mt-0.5">
              ₹{totalNearDueAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-blue-700 font-bold mt-0.5">
              {nearDue10Or15Bills.length} Invoices Nearing Cutoff
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Critical Overdue */}
        <div className="bg-white rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/50 to-white p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Past Due Date (Overdue)</span>
            <div className="text-xl font-black text-rose-800 font-heading mt-0.5 flex items-center space-x-1.5">
              <span>₹{totalOverdueAmount.toLocaleString('en-IN')}</span>
              {overdueBills.length > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] bg-rose-600 text-white rounded-full font-bold animate-pulse">
                  {overdueBills.length} OVERDUE
                </span>
              )}
            </div>
            <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
              Immediate settlement required
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Spot Cash Purchases */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Bills Settled</span>
            <div className="text-xl font-black text-emerald-800 font-heading mt-0.5">
              ₹{totalCashSettled.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Paid on Spot / Delivery</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── CONTROLS & SUB-TABS ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('CREDIT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'CREDIT'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Credit Bills ({supplierBills.filter(b => b.billType === 'CREDIT' && b.pendingAmount > 0).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('OVERDUE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'OVERDUE'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue ({overdueBills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CASH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'CASH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cash Spot ({supplierBills.filter(b => b.billType === 'CASH').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>All Invoices ({supplierBills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'LOGS'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Settlement History ({paymentLogs.length})</span>
          </button>
        </div>

        {/* Right Search & Action */}
        <div className="flex items-center space-x-2 flex-1 sm:flex-initial justify-end">
          {activeTab !== 'LOGS' && (
            <>
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter invoice, vendor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={selectedSupplierFilter}
                onChange={e => setSelectedSupplierFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700"
              >
                <option value="ALL">All Vendors</option>
                {suppliers.map(s => (
                  <option key={s.supplierId} value={s.supplierId}>{s.name}</option>
                ))}
              </select>

              <button
                onClick={() => setShowAddBillModal(true)}
                className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Inward Bill</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── TABLE 1: PURCHASE INVOICES LEDGER ──────────────────────── */}
      {activeTab !== 'LOGS' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '950px' }}>
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3">Invoice &amp; Bill Date</th>
                  <th className="px-3 py-3">Distributor / Supplier</th>
                  <th className="px-3 py-3 text-center">Payment Terms</th>
                  <th className="px-3 py-3 text-center">Repayment Countdown Alert</th>
                  <th className="px-3 py-3 text-right">Total Amount</th>
                  <th className="px-3 py-3 text-right">Paid / Balance</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No purchase bills found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map(bill => {
                    const daysRemaining = getDaysRemaining(bill.dueDate);
                    const isCredit = bill.billType === 'CREDIT';
                    const isOverdue = isCredit && bill.pendingAmount > 0 && daysRemaining < 0;
                    const isDueSoon = isCredit && bill.pendingAmount > 0 && daysRemaining >= 0 && daysRemaining <= 3;
                    const is10DayWindow = isCredit && bill.pendingAmount > 0 && daysRemaining > 3 && daysRemaining <= 10;
                    const is15DayWindow = isCredit && bill.pendingAmount > 0 && daysRemaining > 10;

                    return (
                      <tr
                        key={bill.billId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isOverdue ? 'bg-rose-50/30' : isDueSoon ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Invoice & Date */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 font-mono flex items-center space-x-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>{bill.invoiceNumber}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">Bill Date: {bill.billDate}</div>
                        </td>

                        {/* Distributor */}
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-800">{bill.supplierName}</div>
                          {bill.notes && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[220px]" title={bill.notes}>
                              {bill.notes}
                            </div>
                          )}
                        </td>

                        {/* Payment Terms (Cash vs Credit) */}
                        <td className="px-3 py-3 text-center">
                          {bill.billType === 'CASH' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              CASH SPOT BILL
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              {bill.creditDays || 15}-DAY CREDIT
                            </span>
                          )}
                        </td>

                        {/* 10-day & 15-day Repayment Alerts */}
                        <td className="px-3 py-3 text-center">
                          {!isCredit || bill.pendingAmount <= 0 ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Settled</span>
                            </span>
                          ) : isOverdue ? (
                            <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-black bg-rose-600 text-white shadow-xs animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>OVERDUE ({Math.abs(daysRemaining)}d ago)</span>
                            </div>
                          ) : isDueSoon ? (
                            <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-black bg-amber-500 text-white shadow-xs">
                              <Clock className="w-3 h-3" />
                              <span>CRITICAL: Due in {daysRemaining} days</span>
                            </div>
                          ) : is10DayWindow ? (
                            <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>10-Day Alert: Due in {daysRemaining}d</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                              <Calendar className="w-3 h-3 text-blue-600" />
                              <span>15-Day Window: Due in {daysRemaining}d</span>
                            </div>
                          )}
                          {isCredit && bill.pendingAmount > 0 && (
                            <div className="text-[9px] text-slate-400 mt-0.5">Cutoff: {bill.dueDate}</div>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="px-3 py-3 text-right font-black text-slate-900">
                          ₹{bill.totalAmount.toLocaleString('en-IN')}
                        </td>

                        {/* Paid / Balance */}
                        <td className="px-3 py-3 text-right">
                          <div className="font-bold text-emerald-700 text-xs">
                            Paid: ₹{bill.paidAmount.toLocaleString('en-IN')}
                          </div>
                          <div className={`font-black text-xs ${bill.pendingAmount > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                            Pending: ₹{bill.pendingAmount.toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 text-center">
                          {bill.status === 'PAID' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              PAID
                            </span>
                          ) : bill.status === 'PARTIAL' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              PARTIAL
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              OVERDUE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              UNPAID
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {bill.pendingAmount > 0 ? (
                              <button
                                onClick={() => handleOpenSettlement(bill)}
                                className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-all cursor-pointer active:scale-95"
                                title="Record payment settlement"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Pay Now</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-bold px-2 py-1 bg-emerald-50 rounded-lg">
                                Cleared
                              </span>
                            )}

                            <button
                              onClick={() => handleWhatsAppIntimation(bill)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                              title="Send B2B WhatsApp Ledger Statement"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
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
      ) : (
        /* ── TABLE 2: PAYMENT SETTLEMENT AUDIT LOGS ───────────────── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Supplier Remittance &amp; Settlement Audit Trail ({paymentLogs.length} transactions)</span>
            <span className="text-slate-400">Recorded bank and spot settlements</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '800px' }}>
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3">Payment ID &amp; Date</th>
                  <th className="px-3 py-3">Distributor Name</th>
                  <th className="px-3 py-3">Against Invoice</th>
                  <th className="px-3 py-3">Payment Mode</th>
                  <th className="px-3 py-3">Bank UTR / Reference</th>
                  <th className="px-4 py-3 text-right">Settlement Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No payment settlements recorded yet.
                    </td>
                  </tr>
                ) : (
                  paymentLogs.map(log => (
                    <tr key={log.paymentId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 font-mono">{log.paymentId}</div>
                        <div className="text-[10px] text-slate-500">{log.paymentDate}</div>
                      </td>

                      <td className="px-3 py-3 font-semibold text-slate-800">
                        {log.supplierName}
                      </td>

                      <td className="px-3 py-3 font-mono font-bold text-slate-700">
                        {log.billInvoiceNo || 'Direct Balance'}
                      </td>

                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {log.paymentMode}
                        </span>
                      </td>

                      <td className="px-3 py-3 font-mono text-slate-600">
                        {log.referenceNo}
                      </td>

                      <td className="px-4 py-3 text-right font-black text-emerald-700 text-sm">
                        ₹{log.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SETTLEMENT PAYMENT MODAL ──────────────────────────────── */}
      {settlementBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Settle Supplier Bill — {settlementBill.invoiceNumber}</span>
              </h3>
              <button onClick={() => setSettlementBill(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-3 text-xs font-semibold">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Vendor:</span>
                  <span className="font-bold text-slate-900">{settlementBill.supplierName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Bill Amount:</span>
                  <span className="font-bold text-slate-900">₹{settlementBill.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Outstanding Dues:</span>
                  <span className="font-black text-sm">₹{settlementBill.pendingAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Repayment Due Date:</span>
                  <span>{settlementBill.dueDate}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Settlement Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={settlementBill.pendingAmount}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex space-x-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(settlementBill.pendingAmount)}
                    className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 cursor-pointer"
                  >
                    Full Balance (₹{settlementBill.pendingAmount.toLocaleString('en-IN')})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.round(settlementBill.pendingAmount / 2))}
                    className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded hover:bg-slate-200 cursor-pointer"
                  >
                    50% Partial
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  >
                    <option value="NEFT_RTGS">NEFT / RTGS</option>
                    <option value="UPI">UPI / QR Transfer</option>
                    <option value="CHEQUE">Cheque Clearance</option>
                    <option value="CASH">Spot Cash Settlement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">UTR / Ref No. *</label>
                  <input
                    type="text"
                    required
                    value={referenceNo}
                    onChange={e => setReferenceNo(e.target.value)}
                    placeholder="NEFT99214012"
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Remittance Note</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cleared 15-day antibiotics credit"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSettlementBill(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE NEW BILL MODAL ──────────────────────────────────── */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-900 font-heading flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>Record New Inward Supplier Bill</span>
              </h3>
              <button onClick={() => setShowAddBillModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Select Registered Distributor *</label>
                <select
                  value={newBillSupplierId}
                  onChange={e => setNewBillSupplierId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                >
                  {suppliers.map(s => (
                    <option key={s.supplierId} value={s.supplierId}>{s.name} (GST: {s.gstin})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Distributor Invoice # *</label>
                  <input
                    type="text"
                    required
                    value={newBillInvoiceNo}
                    onChange={e => setNewBillInvoiceNo(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Total Bill Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newBillTotalAmount}
                    onChange={e => setNewBillTotalAmount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1">Bill Type *</label>
                  <select
                    value={newBillType}
                    onChange={e => setNewBillType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  >
                    <option value="CREDIT">Credit Bill (Pay Later)</option>
                    <option value="CASH">Spot Cash Bill (Paid on Spot)</option>
                  </select>
                </div>

                {newBillType === 'CREDIT' ? (
                  <div>
                    <label className="block text-slate-700 mb-1">Credit Window (Days) *</label>
                    <select
                      value={newBillCreditDays}
                      onChange={e => setNewBillCreditDays(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    >
                      <option value="10">10 Days Credit Window</option>
                      <option value="15">15 Days Credit Window</option>
                      <option value="30">30 Days Extended Credit</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-700 mb-1">Settlement Status</label>
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl font-bold border border-emerald-200">
                      ✓ Settled on Delivery
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Shipment Notes / Products Summary</label>
                <input
                  type="text"
                  value={newBillNotes}
                  onChange={e => setNewBillNotes(e.target.value)}
                  placeholder="e.g. Paracetamol 650 & Inhaler restock shipment"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save to Purchase Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
