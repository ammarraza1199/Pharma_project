import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  setInvoiceHistoryModalOpen,
  reprintInvoice,
  deleteSavedInvoice,
  clearAllSavedInvoices
} from '../store/posSlice';
import {
  X, Search, FileText, Printer, Download, Trash2,
  Calendar, CreditCard, DollarSign, Filter, RefreshCw, CheckCircle2, History
} from 'lucide-react';
import type { FinalizedInvoice } from '../types/pos';

export const InvoiceHistoryModal: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.pos.invoiceHistoryModal?.isOpen);
  const invoices = useSelector((state: RootState) => state.pos.invoices || []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('ALL');
  const [selectedInvoiceForDelete, setSelectedInvoiceForDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter invoices based on search query & payment method
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.billingSession.patientDetails?.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.billingSession.patientDetails?.phone || '').includes(searchQuery) ||
      (inv.billingSession.doctorDetails?.doctorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.billingSession.items.some(item => item.product.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPayment = paymentFilter === 'ALL' || inv.payment.method === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  // Calculate summary metrics
  const totalInvoicesCount = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const cashRevenue = invoices.filter(inv => inv.payment.method === 'CASH').reduce((sum, inv) => sum + inv.grandTotal, 0);
  const upiRevenue = invoices.filter(inv => inv.payment.method === 'UPI').reduce((sum, inv) => sum + inv.grandTotal, 0);

  const handleReprint = (invoiceNumber: string) => {
    dispatch(reprintInvoice(invoiceNumber));
    dispatch(setInvoiceHistoryModalOpen(false));
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
    if (invoices.length === 0) return;
    let csv = 'Invoice Number,Date,Patient Name,Phone,Doctor,Items Count,Subtotal,Discount,CGST,SGST,Grand Total,Payment Method\n';
    invoices.forEach(inv => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-modal rounded-2xl max-w-5xl w-full p-5 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3 flex-shrink-0">
          <div className="flex items-center space-x-2 text-emerald-800">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <History className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-heading text-slate-900 leading-tight">
                Saved Invoices &amp; Billing History
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                View, search, download, or re-print previously completed customer bills ({totalInvoicesCount} Saved)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {invoices.length > 0 && (
              <button
                onClick={handleExportAllCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Export all invoices to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All (CSV)</span>
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

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-4 gap-3 mb-3 flex-shrink-0">
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
            <div className="text-[10px] font-bold text-amber-700 uppercase">Cash Collected</div>
            <div className="text-base font-black text-amber-900 mt-0.5">₹{cashRevenue.toFixed(2)}</div>
          </div>
        </div>

        {/* Search & Payment Filter Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
          {/* Search Input */}
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

          {/* Payment Method Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl space-x-1 border border-slate-200 text-xs font-semibold overflow-x-auto">
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
        </div>

        {/* Invoices List Table Container */}
        <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm font-bold text-slate-600">No matching invoices found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Completed bills will automatically be saved here after final checkout. Try adjusting your search query.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
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
                  const itemNamesPreview = inv.billingSession.items.map(i => i.product.name).join(', ');

                  return (
                    <tr key={inv.invoiceNumber} className="hover:bg-slate-50 transition-colors">
                      {/* Invoice # & Date */}
                      <td className="p-3 font-medium">
                        <div className="font-bold text-slate-900 font-mono">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-500">{inv.invoiceDate}</div>
                      </td>

                      {/* Patient Info */}
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{patientName}</div>
                        {patientPhone && <div className="text-[10px] text-slate-500">Ph: {patientPhone}</div>}
                      </td>

                      {/* Doctor Info */}
                      <td className="p-3">
                        <div className="text-slate-700 font-medium">{doctorName}</div>
                      </td>

                      {/* Items Preview */}
                      <td className="p-3 text-center">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]" title={itemNamesPreview}>
                          {inv.billingSession.items.length} Medicines
                        </span>
                      </td>

                      {/* Payment Method Badge */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          inv.payment.method === 'UPI'
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
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

                      {/* Grand Total */}
                      <td className="p-3 text-right font-black text-slate-900 text-sm font-mono">
                        ₹{inv.grandTotal.toFixed(2)}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* View & Print Button */}
                          <button
                            onClick={() => handleReprint(inv.invoiceNumber)}
                            className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            title="View & Print Official A4/Thermal Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>View / Print</span>
                          </button>

                          {/* Download CSV */}
                          <button
                            onClick={() => handleDownloadSingleCSV(inv)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Download CSV breakdown"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Delete Invoice */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove invoice ${inv.invoiceNumber} from saved history?`)) {
                                dispatch(deleteSavedInvoice(inv.invoiceNumber));
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Saved Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info & close */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between mt-3 flex-shrink-0">
          <span className="text-[11px] text-slate-500">Showing {filteredInvoices.length} of {totalInvoicesCount} saved invoices</span>
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
