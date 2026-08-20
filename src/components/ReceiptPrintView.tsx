import React, { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { clearFinalizedInvoice, setInvoiceHistoryModalOpen } from '../store/posSlice';
import { useReactToPrint } from 'react-to-print';
import { Printer, CheckCircle, X, FileText, History } from 'lucide-react';
import { numberToWords } from '../utils/numberToWords';
import { getMedicineDetails } from '../utils/medicineDetails';

export const ReceiptPrintView: React.FC = () => {
  const dispatch = useDispatch();
  const invoice = useSelector((state: RootState) => state.pos.latestFinalizedInvoice);
  const componentRef = useRef<HTMLDivElement>(null);
  const [printFormat, setPrintFormat] = useState<'THERMAL' | 'A4'>('A4');

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: invoice ? `Invoice_${invoice.invoiceNumber}` : 'Invoice',
  });

  if (!invoice) return null;

  // Extract / calculate invoice level values
  const items = invoice.billingSession.items || [];

  const totalPacksCount = items.filter(i => (i.unitMode || 'PACK') === 'PACK').reduce((sum, item) => sum + item.quantity, 0);
  const totalLooseCount = items.filter(i => (i.unitMode || 'PACK') === 'LOOSE').reduce((sum, item) => sum + item.quantity, 0);
  const totalQty = totalPacksCount + (totalLooseCount > 0 ? 1 : 0); // packs + 1 group for loose
  const totalTabletsCount = items.reduce((sum, item) => {
    const details = getMedicineDetails(item.product);
    const isLoose = (item.unitMode || 'PACK') === 'LOOSE';
    return sum + (isLoose ? item.quantity : item.quantity * details.unitsPerPack);
  }, 0);
  const grossAmount = items.reduce((sum, item) => {
    const mrp = item.selectedBatch?.mrp || item.product?.unitMRP || item.unitPrice;
    return sum + (mrp * item.quantity);
  }, 0);

  const shippingCharges = 0;
  const billAmount = invoice.subtotal + invoice.totalCGST + invoice.totalSGST;
  const roundedPayable = Math.round(invoice.grandTotal);
  const roundOffNum = roundedPayable - invoice.grandTotal;
  const roundOff = roundOffNum >= 0 ? `+${roundOffNum.toFixed(2)}` : roundOffNum.toFixed(2);
  const payableAmount = invoice.grandTotal;
  const amountInWordsStr = numberToWords(payableAmount);

  // Store & Patient Info
  const storeName = invoice.storeInfo.name || 'TATA 1MG Healthcare Solutions Private Limited';
  const dlNo = invoice.storeInfo.dlNo || '20:TG/MDL/2025-139382,21:TG/MDL/2025-139382,20B:TG/MDL/2025-139382,21B:TG/MDL/2025-139382';
  const fssaiNo = invoice.storeInfo.fssaiNo || '13625038000104';
  const gstin = invoice.storeInfo.gstin || '36AAFCD7691C1ZK';
  const cin = invoice.storeInfo.cin || 'U47721DL2016PTC302634';
  const registeredAddress = invoice.storeInfo.registeredAddress || '2nd Floor, Plot No. B-225, Okhla Industrial Area, Phase-I, South Delhi, New Delhi-110020, Delhi';
  const premiseAddress = invoice.storeInfo.premiseAddress || invoice.storeInfo.address || 'House no 2-22-310/190C/NR, Addagutta Society, KPHB, Addagutta, Hyderabad, Telangana, 500032, India';

  const patientName = invoice.billingSession.patientDetails?.patientName || 'K Shobha Rani';
  const patientAddress = invoice.billingSession.patientDetails?.phone
    ? `Flat 104, Siva Sai Heights, plot 84 and 85, Gokul plots, Serilingampally, Kukatpally, Hyderabad, 500085, IN`
    : 'Flat 104, Siva Sai Heights, plot 84 and 85, Gokul plots, Serilingampally, Kukatpally, Hyderabad, 500085, IN';
  const patientContact = invoice.billingSession.patientDetails?.phone || '9876543210';
  const doctorInfo = invoice.billingSession.doctorDetails?.doctorName || 'akhil dadi';

  const orderId = `PO${invoice.invoiceNumber.replace(/\D/g, '') || '21426134789588'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-modal rounded-2xl max-w-4xl w-full p-5 shadow-2xl border border-slate-200 relative max-h-[95vh] flex flex-col">

        {/* Modal Header */}
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
                    {items.map(item => {
                      const medDetails = getMedicineDetails(item.product);
                      const isLoose = (item.unitMode || 'PACK') === 'LOOSE';
                      const totalUnits = isLoose ? item.quantity : item.quantity * medDetails.unitsPerPack;
                      const unitLabel = medDetails.dosageForm === 'Tablet' ? 'Tab' : medDetails.dosageForm === 'Capsule' ? 'Cap' : 'Unit';
                      return (
                        <tr key={item.cartItemId} className="border-b border-slate-100">
                          <td className="py-1 pr-1">
                            <div className="font-bold">{item.product.name} ({medDetails.medicineType})</div>
                            <div className="text-[8px] text-slate-600">
                              {isLoose
                                ? `Loose: ${totalUnits} ${unitLabel}s @ ₹${item.unitPrice.toFixed(2)}/tab`
                                : `Pack: ${medDetails.packSize} • Total: ${totalUnits} ${medDetails.dosageForm}s`
                              }
                            </div>
                            <div className="text-[8px] text-slate-500">Batch: {item.selectedBatch.batchNumber} (Exp: {item.selectedBatch.expiryDate})</div>
                          </td>
                          <td className="py-1 text-center font-bold">
                            {isLoose ? `${item.quantity} ${unitLabel}` : item.quantity}
                          </td>
                          <td className="py-1 text-right">
                            ₹{item.unitPrice.toFixed(2)}
                            {isLoose && <div className="text-[7px]">/tab</div>}
                          </td>
                          <td className="py-1 text-right font-bold">₹{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="space-y-0.5 text-right font-semibold text-[10px] pb-2 border-b border-dashed border-slate-400">
                  <div>Total Quantity: {totalQty} Packs ({totalTabletsCount} Tablets/Units)</div>
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

            {/* ── A4 OFFICIAL TAX INVOICE FORMAT (TATA 1MG STYLE) ── */}
            {printFormat === 'A4' && (
              <div className="bg-white text-black p-5 rounded shadow-sm font-sans text-xs max-w-[210mm] mx-auto border border-black leading-tight">
                {/* 1. Header Section */}
                <div className="flex justify-between items-start border-b border-black pb-2 mb-2">
                  <div>
                    <h1 className="text-xs font-bold text-black">Tax Invoice/Bill of Supply/Cash Memo</h1>
                    <p className="text-[10px] text-black">(Duplicate)</p>
                  </div>

                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto" viewBox="0 0 100 100">
                      <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                      <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z" fill="#000000" fillRule="evenodd" />
                      <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z" fill="#000000" fillRule="evenodd" />
                      <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z" fill="#000000" fillRule="evenodd" />
                      <rect x="42" y="8" width="6" height="6" fill="#000" />
                      <rect x="52" y="8" width="6" height="6" fill="#000" />
                      <rect x="42" y="20" width="12" height="6" fill="#000" />
                      <rect x="8" y="42" width="6" height="12" fill="#000" />
                      <rect x="20" y="42" width="16" height="6" fill="#000" />
                      <rect x="42" y="42" width="16" height="16" fill="#000" />
                      <rect x="65" y="42" width="12" height="6" fill="#000" />
                      <rect x="82" y="42" width="10" height="10" fill="#000" />
                      <rect x="42" y="65" width="8" height="18" fill="#000" />
                      <rect x="55" y="75" width="18" height="8" fill="#000" />
                      <rect x="78" y="65" width="14" height="14" fill="#000" />
                      <rect x="65" y="84" width="10" height="10" fill="#000" />
                    </svg>
                    <p className="text-[8.5px] font-bold text-black mt-0.5">For Internal Purpose</p>
                  </div>

                  <div className="text-right text-[10px] text-black space-y-0.5">
                    <div><span className="font-bold">Invoice no.:</span> {invoice.invoiceNumber}</div>
                    <div><span className="font-bold">Date:</span> {invoice.invoiceDate}</div>
                    <div><span className="font-bold">Order ID:</span> {orderId}</div>
                  </div>
                </div>

                {/* 2. Main Details Grid (Sold By / Sold To / Doctor) */}
                <div className="border border-black mb-2 text-[9.5px] text-black">
                  <div className="grid grid-cols-2 divide-x divide-black border-b border-black">
                    {/* Left Column: Sold By */}
                    <div className="p-2 space-y-0.5">
                      <div className="font-bold text-[10px] uppercase mb-1">Sold By</div>
                      <div className="font-bold text-[10px] text-black">{storeName}</div>
                      <div><span className="font-bold">DL Number:</span> {dlNo}</div>
                      <div><span className="font-bold">FSSAI License No:</span> {fssaiNo}</div>
                      <div><span className="font-bold">GST:</span> {gstin}</div>
                      <div><span className="font-bold">CIN:</span> {cin}</div>
                      <div><span className="font-bold">Registered Address:</span> {registeredAddress}</div>
                      <div><span className="font-bold">Premise Address:</span> {premiseAddress}</div>
                    </div>

                    {/* Right Column: Sold To */}
                    <div className="p-2 space-y-0.5">
                      <div className="font-bold text-[10px] uppercase mb-1">Sold To</div>
                      <div><span className="font-bold">Patient Name:</span> {patientName}</div>
                      <div><span className="font-bold">Address:</span> {patientAddress}</div>
                      <div><span className="font-bold">Place of supply:</span> Telangana</div>
                      <div><span className="font-bold">Contact:</span> {patientContact}</div>
                    </div>
                  </div>

                  {/* Doctor Row */}
                  <div className="p-1.5 font-bold">
                    Doctor name &amp; address: <span className="font-semibold uppercase">{doctorInfo}</span>
                  </div>
                </div>

                {/* 3. Product Table (15 Columns exact match) */}
                <table className="w-full border-collapse border border-black text-[9px] text-black mb-2">
                  <thead>
                    <tr className="border-b border-black font-bold uppercase text-[8px] bg-slate-50 text-center">
                      <th className="border-r border-black p-1 w-5">SR.</th>
                      <th className="border-r border-black p-1 text-left">PRODUCT NAME &amp; TYPE</th>
                      <th className="border-r border-black p-1 text-left">Mfr. Name</th>
                      <th className="border-r border-black p-1">BATCH NO.</th>
                      <th className="border-r border-black p-1">EXP. DATE</th>
                      <th className="border-r border-black p-1">QTY (Pack)</th>
                      <th className="border-r border-black p-1">UOM</th>
                      <th className="border-r border-black p-1">Pack Size</th>
                      <th className="border-r border-black p-1 text-right">MRP (₹)</th>
                      <th className="border-r border-black p-1 text-right">DISC AMT. (₹)</th>
                      <th className="border-r border-black p-1 text-right">TAXABLE AMT. (₹)</th>
                      <th className="border-r border-black p-1">HSN</th>
                      <th className="border-r border-black p-1 text-right">GST RATE (%)</th>
                      <th className="border-r border-black p-1 text-right">GST AMT. (₹)</th>
                      <th className="p-1 text-right">TOTAL AMT. (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const mrp = item.selectedBatch?.mrp || item.product?.unitMRP || item.unitPrice;
                      const discAmt = (item.unitPrice * item.quantity * item.discountPercent) / 100;
                      const medDetails = getMedicineDetails(item.product);
                      const isLoose = (item.unitMode || 'PACK') === 'LOOSE';
                      const totalUnitsForLine = isLoose ? item.quantity : item.quantity * medDetails.unitsPerPack;
                      const unitLabel = medDetails.dosageForm === 'Tablet' ? 'Tab' : medDetails.dosageForm === 'Capsule' ? 'Cap' : 'Unit';

                      // Expiry Date formatting (e.g. 2028-03-31 -> 03/28)
                      let expFormatted = item.selectedBatch?.expiryDate || '03/28';
                      if (expFormatted.includes('-')) {
                        const parts = expFormatted.split('-');
                        if (parts.length >= 2) {
                          expFormatted = `${parts[1]}/${parts[0].slice(2)}`;
                        }
                      }

                      return (
                        <tr key={item.cartItemId} className="border-b border-black text-center align-top">
                          <td className="border-r border-black p-1">{idx + 1}</td>
                          <td className="border-r border-black p-1 text-left">
                            <div className="font-semibold">{item.product.name}</div>
                            {isLoose
                              ? <div className="text-[7.5px] text-purple-700 font-bold">LOOSE: {totalUnitsForLine} {unitLabel}s @ ₹{item.unitPrice.toFixed(2)}/tab ({medDetails.medicineType})</div>
                              : <div className="text-[7.5px] text-slate-700 font-mono">Form: {medDetails.medicineType} • ({totalUnitsForLine} {medDetails.dosageForm}s)</div>
                            }
                          </td>
                          <td className="border-r border-black p-1 text-left text-[8px]">{item.product.brand || 'Pharma Ltd'}</td>
                          <td className="border-r border-black p-1 font-mono text-[8px]">{item.selectedBatch.batchNumber}</td>
                          <td className="border-r border-black p-1 font-mono text-[8px]">{expFormatted}</td>
                          <td className="border-r border-black p-1 font-bold">
                            {isLoose ? `${item.quantity} ${unitLabel}` : item.quantity}
                          </td>
                          <td className="border-r border-black p-1 text-[8px]">
                            {isLoose ? 'Loose' : medDetails.packType}
                          </td>
                          <td className="border-r border-black p-1 text-[8px]">
                            {isLoose ? '1' : medDetails.unitsPerPack}
                          </td>
                          <td className="border-r border-black p-1 text-right">{mrp.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-right">{discAmt.toFixed(2)}</td>
                          <td className="border-r border-black p-1 text-right">{item.taxableAmount.toFixed(2)}</td>
                          <td className="border-r border-black p-1 font-mono text-[8px]">{item.product.hsnCode || '30049099'}</td>
                          <td className="border-r border-black p-1 text-right">{item.product.gstRate}</td>
                          <td className="border-r border-black p-1 text-right">{item.totalGst.toFixed(2)}</td>
                          <td className="p-1 text-right font-bold">{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}

                    {/* Fill minimum table height with empty rows if fewer than 4 items */}
                    {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="border-b border-black h-5">
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="border-r border-black p-1"></td>
                        <td className="p-1"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 4. Tax Breakdown Table & Financial Totals Table */}
                <div className="grid grid-cols-12 gap-2 mb-2 text-black text-[9px]">
                  {/* Left Column: QR Code + GST Breakdown */}
                  <div className="col-span-7 flex space-x-1.5">
                    {/* Compliance QR Code Box */}
                    <div className="text-center flex-shrink-0 w-24 border border-black p-1 flex flex-col items-center justify-center">
                      <svg className="w-16 h-16" viewBox="0 0 100 100">
                        <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                        <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z" fill="#000000" fillRule="evenodd" />
                        <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z" fill="#000000" fillRule="evenodd" />
                        <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z M15,75 h10 v10 h-10 z" fill="#000000" fillRule="evenodd" />
                        <rect x="42" y="8" width="6" height="6" fill="#000" />
                        <rect x="52" y="8" width="6" height="6" fill="#000" />
                        <rect x="42" y="20" width="12" height="6" fill="#000" />
                        <rect x="8" y="42" width="6" height="12" fill="#000" />
                        <rect x="20" y="42" width="16" height="6" fill="#000" />
                        <rect x="42" y="42" width="16" height="16" fill="#000" />
                        <rect x="65" y="42" width="12" height="6" fill="#000" />
                        <rect x="82" y="42" width="10" height="10" fill="#000" />
                        <rect x="42" y="65" width="8" height="18" fill="#000" />
                        <rect x="55" y="75" width="18" height="8" fill="#000" />
                        <rect x="78" y="65" width="14" height="14" fill="#000" />
                        <rect x="65" y="84" width="10" height="10" fill="#000" />
                      </svg>
                      <p className="text-[7.5px] font-bold mt-1 text-center leading-none">For Compliance Purpose</p>
                    </div>

                    {/* GST Rates Table */}
                    <table className="flex-1 border-collapse border border-black text-center text-[8.5px]">
                      <thead>
                        <tr className="border-b border-black font-bold uppercase bg-slate-50">
                          <th className="border-r border-black p-0.5">GST%</th>
                          <th className="border-r border-black p-0.5">Taxable Amt (₹)</th>
                          <th className="border-r border-black p-0.5">CGST (₹)</th>
                          <th className="border-r border-black p-0.5">SGST (₹)</th>
                          <th className="p-0.5">IGST (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[0, 5, 12, 18, 28, 40].map(rate => {
                          const matchingItems = items.filter(it => it.product.gstRate === rate);
                          const taxable = matchingItems.reduce((s, it) => s + it.taxableAmount, 0);
                          const cgst = matchingItems.reduce((s, it) => s + it.cgstAmount, 0);
                          const sgst = matchingItems.reduce((s, it) => s + it.sgstAmount, 0);
                          return (
                            <tr key={rate} className="border-b border-black last:border-b-0">
                              <td className="border-r border-black p-0.5 font-bold">{rate}</td>
                              <td className="border-r border-black p-0.5">{taxable > 0 ? taxable.toFixed(2) : '0'}</td>
                              <td className="border-r border-black p-0.5">{cgst > 0 ? cgst.toFixed(2) : '0'}</td>
                              <td className="border-r border-black p-0.5">{sgst > 0 ? sgst.toFixed(2) : '0'}</td>
                              <td className="p-0.5">0</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column: Financial Summary Table */}
                  <div className="col-span-5 border border-black text-[8.5px]">
                    <div className="flex justify-between border-b border-black p-0.5 px-1 font-bold">
                      <span>TOTAL QUANTITY:</span>
                      <span>{totalQty} Packs ({totalTabletsCount} Tablets/Units)</span>
                    </div>
                    <div className="flex justify-between border-b border-black p-0.5 px-1 font-bold">
                      <span>GROSS AMOUNT:</span>
                      <span>₹{grossAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-black p-0.5 px-1 font-bold">
                      <span>SHIPPING &amp; VAS CHARGES:</span>
                      <span>₹{shippingCharges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-black p-0.5 px-1 font-bold">
                      <span>DISCOUNT AMOUNT:</span>
                      <span>₹{invoice.totalDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-black p-0.5 px-1 font-bold">
                      <span>BILL AMOUNT:</span>
                      <span>₹{billAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-black p-0.5 px-1 font-bold">
                      <span>ROUND OFF:</span>
                      <span>₹{roundOff}</span>
                    </div>
                    <div className="flex justify-between p-0.5 px-1 font-black text-[9.5px] bg-slate-50">
                      <span>PAYABLE AMOUNT:</span>
                      <span>₹{payableAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Amount in Words & E.&O.E. */}
                <div className="flex justify-between items-center my-1.5 text-[9.5px] text-black font-bold">
                  <div>
                    Amount in Words: <span className="font-normal">{amountInWordsStr}</span>
                  </div>
                  <div>E.&amp;O.E.</div>
                </div>

                {/* 6. Terms & Return Policy / Signature Block */}
                <div className="border border-black grid grid-cols-12 text-[8.5px] text-black mb-2">
                  <div className="col-span-8 p-1.5 border-r border-black space-y-1">
                    <p>
                      a) Any refund/exchange is applicable within 7 days from date of invoice subject to original invoice being produced and in accordance with Return &amp; Refund Policy of the company. Please visit the store for the same.
                    </p>
                    <p>
                      b) All disputes related to this order are subject to the jurisdiction of courts at Hyderabad, Telangana.
                    </p>
                    <p className="font-bold">Computer Generated Invoice.</p>
                  </div>
                  <div className="col-span-4 p-1.5 flex flex-col justify-between text-right">
                    <div className="text-[8px] font-bold">
                      For: {storeName}
                    </div>
                    <div className="pt-4 text-center">
                      <div className="border-t border-dashed border-black w-28 mx-auto mb-0.5"></div>
                      <div className="font-bold text-[8.5px]">Pharmacist Signature</div>
                    </div>
                  </div>
                </div>

                {/* 7. Bottom Bar */}
                <div className="flex justify-between items-end text-[8.5px] text-black pt-1">
                  <div>Transit mode: By Road/Air</div>
                  <div className="font-bold">For Support Contact: care@1mg.com</div>
                  <div className="text-right">
                    <div className="text-sm font-black tracking-tight leading-none text-black font-heading">
                      TATA <span className="text-teal-700">1mg</span>
                    </div>
                    <div className="text-[7.5px] italic text-slate-700">Bringing care to health</div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between mt-3 flex-shrink-0">
          <button
            onClick={() => {
              dispatch(clearFinalizedInvoice());
              dispatch(setInvoiceHistoryModalOpen(true));
            }}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>View All Saved Invoices</span>
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={() => dispatch(clearFinalizedInvoice())}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
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
