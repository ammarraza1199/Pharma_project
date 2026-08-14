import React, { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { clearFinalizedInvoice } from '../store/posSlice';
import { useReactToPrint } from 'react-to-print';
import { Printer, CheckCircle, X, FileText } from 'lucide-react';

export const ReceiptPrintView: React.FC = () => {
  const dispatch = useDispatch();
  const invoice = useSelector((state: RootState) => state.pos.latestFinalizedInvoice);
  const componentRef = useRef<HTMLDivElement>(null);
  const [printFormat, setPrintFormat] = useState<'THERMAL' | 'A4'>('THERMAL');

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: invoice ? `Invoice_${invoice.invoiceNumber}` : 'Invoice',
  });

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-modal rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">

        {/* Top Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3 flex-shrink-0">
          <div className="flex items-center space-x-2 text-emerald-700">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-extrabold font-heading text-slate-900 leading-tight">
                Bill Finalized Successfully!
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Invoice: {invoice.invoiceNumber} · Latency &lt; 2s</p>
            </div>
          </div>

          <button
            onClick={() => dispatch(clearFinalizedInvoice())}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Receipt Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setPrintFormat('THERMAL')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              printFormat === 'THERMAL'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>80mm ESC/POS Thermal Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => setPrintFormat('A4')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              printFormat === 'A4'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>A4 Official Tax Invoice</span>
          </button>
        </div>

        {/* Printable Container */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-3 rounded-xl border border-slate-200">
          <div ref={componentRef} id="printable-area">

            {/* ── 80mm ESC/POS THERMAL FORMAT ── */}
            {printFormat === 'THERMAL' && (
              <div className="bg-white text-slate-900 p-4 rounded shadow-2xs font-mono text-[11px] leading-tight mx-auto max-w-[80mm]">
                <div className="text-center pb-2 border-b border-dashed border-slate-400">
                  <h2 className="font-extrabold text-xs uppercase tracking-wider">{invoice.storeInfo.name}</h2>
                  <p className="text-[10px]">{invoice.storeInfo.address}</p>
                  <p className="text-[10px]">Ph: {invoice.storeInfo.phone}</p>
                  <p className="text-[10px]">DL No: {invoice.storeInfo.dlNo}</p>
                  <p className="text-[10px]">GSTIN: {invoice.storeInfo.gstin}</p>
                </div>

                <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
                  <div>Invoice #: <strong>{invoice.invoiceNumber}</strong></div>
                  <div>Date: {invoice.invoiceDate}</div>
                  <div>Doctor: {invoice.billingSession.doctorDetails?.doctorName || 'Direct Purchase'}</div>
                  <div>Patient: {invoice.billingSession.patientDetails?.patientName || 'Walk-in Customer'}</div>
                </div>

                <table className="w-full text-left my-2 border-b border-dashed border-slate-400">
                  <thead>
                    <tr className="text-[9px] font-bold border-b border-slate-300">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Price</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.billingSession.items.map(item => (
                      <tr key={item.cartItemId} className="border-b border-slate-100">
                        <td className="py-1 pr-1">
                          <div className="font-bold">{item.product.name}</div>
                          <div className="text-[8px] text-slate-500">Batch: {item.selectedBatch.batchNumber} (Exp: {item.selectedBatch.expiryDate})</div>
                        </td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-right">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="py-1 text-right font-bold">₹{item.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-0.5 text-right font-semibold text-[10px] pb-2 border-b border-dashed border-slate-400">
                  <div>Subtotal: ₹{invoice.subtotal.toFixed(2)}</div>
                  <div>Total Discount: -₹{invoice.totalDiscount.toFixed(2)}</div>
                  <div>CGST: ₹{invoice.totalCGST.toFixed(2)}</div>
                  <div>SGST: ₹{invoice.totalSGST.toFixed(2)}</div>
                  <div className="text-xs font-black pt-1">Grand Total: ₹{invoice.grandTotal.toFixed(2)}</div>
                </div>

                <div className="pt-2 text-center text-[9px] text-slate-500 space-y-0.5">
                  <div>Payment Mode: <strong>{invoice.payment.method}</strong></div>
                  <div>Thank you! Get well soon.</div>
                  <div>Powered by GENQUANTAA POS Platform</div>
                </div>
              </div>
            )}

            {/* ── A4 FULL TAX INVOICE FORMAT ── */}
            {printFormat === 'A4' && (
              <div className="bg-white text-slate-900 p-6 rounded shadow-md font-sans text-xs space-y-4 max-w-[210mm] mx-auto border border-slate-300">
                {/* Store & Invoice Header */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                  <div>
                    <h1 className="text-lg font-black text-emerald-800 font-heading">{invoice.storeInfo.name}</h1>
                    <p className="text-[11px] text-slate-600">{invoice.storeInfo.address}</p>
                    <p className="text-[11px] text-slate-600">Ph: {invoice.storeInfo.phone} · DL No: {invoice.storeInfo.dlNo}</p>
                    <p className="text-[11px] text-slate-600">GSTIN: {invoice.storeInfo.gstin}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">GST TAX INVOICE</span>
                    <h2 className="text-sm font-bold text-slate-900 mt-1">{invoice.invoiceNumber}</h2>
                    <p className="text-[11px] text-slate-500">{invoice.invoiceDate}</p>
                  </div>
                </div>

                {/* Patient & Doctor Box */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Patient Details</p>
                    <p className="font-bold text-slate-800">{invoice.billingSession.patientDetails?.patientName || 'Walk-in Customer'}</p>
                    <p className="text-slate-600">Age: {invoice.billingSession.patientDetails?.age || 'N/A'} · Mobile: {invoice.billingSession.patientDetails?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Prescribing Doctor</p>
                    <p className="font-bold text-slate-800">{invoice.billingSession.doctorDetails?.doctorName || 'Self / Direct Purchase'}</p>
                    <p className="text-slate-600">Reg No: {invoice.billingSession.doctorDetails?.regNo || 'N/A'}</p>
                  </div>
                </div>

                {/* Full A4 Items Table */}
                <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300">#</th>
                      <th className="p-2 border-r border-slate-300">Medicine &amp; Salt Description</th>
                      <th className="p-2 border-r border-slate-300">HSN</th>
                      <th className="p-2 border-r border-slate-300">Batch / Exp</th>
                      <th className="p-2 text-center border-r border-slate-300">Qty</th>
                      <th className="p-2 text-right border-r border-slate-300">Rate</th>
                      <th className="p-2 text-right border-r border-slate-300">GST %</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.billingSession.items.map((item, idx) => (
                      <tr key={item.cartItemId} className="border-b border-slate-200 text-slate-800">
                        <td className="p-2 border-r border-slate-200 font-bold">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="font-bold">{item.product.name}</div>
                          <div className="text-[10px] text-slate-500">{item.product.saltComposition}</div>
                        </td>
                        <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{item.product.hsnCode}</td>
                        <td className="p-2 border-r border-slate-200 text-[10px]">
                          <div>{item.selectedBatch.batchNumber}</div>
                          <div className="text-slate-400">Exp: {item.selectedBatch.expiryDate}</div>
                        </td>
                        <td className="p-2 text-center font-bold border-r border-slate-200">{item.quantity}</td>
                        <td className="p-2 text-right border-r border-slate-200">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-right border-r border-slate-200">{item.product.gstRate}%</td>
                        <td className="p-2 text-right font-bold">₹{item.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tax Breakdown Summary */}
                <div className="flex justify-between items-end pt-2 border-t border-slate-300">
                  <div className="text-[10px] text-slate-500 space-y-1">
                    <p>Payment Mode: <strong className="text-slate-800">{invoice.payment.method}</strong></p>
                    <p>Terms: Goods once sold will be taken back as per return policy.</p>
                  </div>
                  <div className="w-56 space-y-1 text-right text-xs">
                    <div className="flex justify-between"><span>Subtotal:</span><span>₹{invoice.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-emerald-700"><span>Discount:</span><span>-₹{invoice.totalDiscount.toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-500"><span>CGST:</span><span>+₹{invoice.totalCGST.toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-500"><span>SGST:</span><span>+₹{invoice.totalSGST.toFixed(2)}</span></div>
                    <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300 text-slate-900">
                      <span>Net Payable:</span>
                      <span className="text-emerald-800">₹{invoice.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Trigger Button */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between mt-3 flex-shrink-0">
          <span className="text-[11px] text-slate-500">Format: {printFormat} · Latency &lt; 2s</span>
          <div className="flex space-x-2">
            <button
              onClick={() => dispatch(clearFinalizedInvoice())}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Done &amp; Start New Bill
            </button>

            <button
              onClick={() => handlePrint()}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print {printFormat === 'THERMAL' ? '80mm Thermal Receipt' : 'A4 Tax Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
