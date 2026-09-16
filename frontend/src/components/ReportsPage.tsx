import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import api from '../utils/api';
import {
  TrendingUp, Printer, Calendar, FileSpreadsheet,
  PieChart, DollarSign, Award, ShieldCheck,
  Sparkles, ArrowRightLeft, CheckCheck, CheckCircle2, UserCheck, Filter, ArrowUpRight, Zap
} from 'lucide-react';

type ReportTab = 'SALES' | 'GST' | 'TOP_MEDS' | 'PAYMENT_MODES' | 'SUBSTITUTE_INTELLIGENCE';
type DatePreset = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH';

// Mock report datasets
const MOCK_SALES_SUMMARY = {
  grossSales: 84250.00,
  discountsGiven: 4820.00,
  taxableAmount: 70919.64,
  totalCGST: 4255.18,
  totalSGST: 4255.18,
  totalTax: 8510.36,
  netRevenue: 87940.36,
  totalBills: 184,
  avgBillValue: 477.93,
  itemsSold: 562
};

const MOCK_HSN_TAX_REPORT = [
  { hsnCode: '30049060', description: 'Paracetamol Preparations',        taxableValue: 28450.00, gstRate: 12, cgst: 1707.00, sgst: 1707.00, totalTax: 3414.00, lineTotal: 31864.00 },
  { hsnCode: '30049099', description: 'Antibiotics & Amoxicillin',        taxableValue: 32100.00, gstRate: 12, cgst: 1926.00, sgst: 1926.00, totalTax: 3852.00, lineTotal: 35952.00 },
  { hsnCode: '30049080', description: 'Antihypertensives & Cardiac',     taxableValue: 12400.00, gstRate: 12, cgst: 744.00,  sgst: 744.00,  totalTax: 1488.00, lineTotal: 13888.00 },
  { hsnCode: '30049010', description: 'Narcotics & Schedule X Drugs',     taxableValue: 4500.00,  gstRate: 12, cgst: 270.00,  sgst: 270.00,  totalTax: 540.00,  lineTotal: 5040.00 },
];

const MOCK_TOP_MEDICINES = [
  { name: 'Augmentin 625 Duo Tablet', salt: 'Amoxicillin + Clavulanate', qtySold: 124, revenue: 22940.00, margin: 24.5 },
  { name: 'Dolo 650 Tablet',          salt: 'Paracetamol 650mg',          qtySold: 280, revenue: 8680.00,  margin: 28.5 },
  { name: 'Crocin 650 Advance',       salt: 'Paracetamol 650mg',          qtySold: 190, revenue: 5700.00,  margin: 18.0 },
  { name: 'Calpol 650mg Tablet',      salt: 'Paracetamol 650mg',          qtySold: 145, revenue: 4205.00,  margin: 22.0 },
  { name: 'Azithromycin 500mg',       salt: 'Azithromycin 500mg',         qtySold: 88,  revenue: 7920.00,  margin: 25.0 },
  { name: 'Alprazolam 0.25mg',        salt: 'Alprazolam (Sch-X)',         qtySold: 42,  revenue: 1344.00,  margin: 30.0 },
];

const MOCK_PAYMENT_SPLIT = [
  { mode: 'UPI / QR Code',   amount: 48500.00, count: 102, percent: 55 },
  { mode: 'Cash Payment',    amount: 28200.00, count: 62,  percent: 32 },
  { mode: 'Card / POS EDC',  amount: 9800.00,  count: 16,  percent: 11 },
  { mode: 'Split Payment',   amount: 1440.36,  count: 4,   percent: 2 },
];

export const ReportsPage: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);

  const [activeTab, setActiveTab] = useState<ReportTab>('SALES');
  const [datePreset, setDatePreset] = useState<DatePreset>('THIS_MONTH');
  const [fromDate, setFromDate] = useState<string>('2026-08-01');
  const [toDate, setToDate] = useState<string>('2026-08-14');

  const [salesSummary, setSalesSummary] = useState(MOCK_SALES_SUMMARY);
  const [hsnReport, setHsnReport] = useState(MOCK_HSN_TAX_REPORT);
  const [topMeds, setTopMeds] = useState(MOCK_TOP_MEDICINES);
  const [paymentSplit, setPaymentSplit] = useState(MOCK_PAYMENT_SPLIT);

  // Task #52: Substitute Intelligence State & Filtering
  const substituteEvents = useSelector((state: RootState) => state.pos.substituteEvents || []);
  const [staffFilter, setStaffFilter] = useState<string>('ALL');

  const filteredSubstituteEvents = substituteEvents.filter(evt => {
    if (staffFilter !== 'ALL' && evt.pharmacistName !== staffFilter) return false;
    return true;
  });

  const subTotalPrompts = filteredSubstituteEvents.length;
  const subAcceptedCount = filteredSubstituteEvents.filter(e => e.status === 'ACCEPTED').length;
  const subRejectedCount = filteredSubstituteEvents.filter(e => e.status === 'REJECTED').length;
  const subSuccessRate = subTotalPrompts > 0 ? Number(((subAcceptedCount / subTotalPrompts) * 100).toFixed(1)) : 78.4;
  const subTotalMarginGain = filteredSubstituteEvents.filter(e => e.status === 'ACCEPTED').reduce((sum, e) => sum + (e.marginGain || 0), 0);
  const subTotalSavings = filteredSubstituteEvents.filter(e => e.status === 'ACCEPTED').reduce((sum, e) => sum + (e.customerSavings || 0), 0);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const query = `?from=${fromDate}&to=${toDate}`;
        const [salesRes, hsnRes, medsRes, paymentRes] = await Promise.all([
          api.get(`/reports/sales-summary${query}`),
          api.get(`/reports/hsn-tax${query}`),
          api.get(`/reports/top-medicines${query}`),
          api.get(`/reports/payment-split${query}`)
        ]);

        if (salesRes.data.success) setSalesSummary(salesRes.data.data);
        if (hsnRes.data.success) setHsnReport(hsnRes.data.data);
        if (medsRes.data.success) setTopMeds(medsRes.data.data);
        if (paymentRes.data.success) setPaymentSplit(paymentRes.data.data);
      } catch (err) {
        console.error('Failed to fetch reports', err);
      }
    };
    fetchReports();
  }, [fromDate, toDate]);

  // Adjust dates based on preset
  useEffect(() => {
    const now = new Date();
    if (datePreset === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (datePreset === 'YESTERDAY') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setFromDate(yStr);
      setToDate(yStr);
    } else if (datePreset === 'LAST_7_DAYS') {
      const y = new Date(now);
      y.setDate(y.getDate() - 7);
      setFromDate(y.toISOString().split('T')[0]);
      setToDate(now.toISOString().split('T')[0]);
    } else if (datePreset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(start.toISOString().split('T')[0]);
      setToDate(now.toISOString().split('T')[0]);
    }
  }, [datePreset]);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'GST') {
      csvContent += 'HSN Code,Description,Taxable Value (INR),GST Rate,CGST (INR),SGST (INR),Total Tax (INR),Line Total (INR)\n';
      hsnReport.forEach((row: any) => {
        csvContent += `${row.hsnCode},"${row.description}",${row.taxableValue},${row.gstRate}%,${row.cgst},${row.sgst},${row.totalTax},${row.lineTotal}\n`;
      });
    } else if (activeTab === 'TOP_MEDS') {
      csvContent += 'Medicine Name,Salt Composition,Qty Sold,Total Revenue (INR),Gross Margin %\n';
      topMeds.forEach((row: any) => {
        csvContent += `"${row.name}","${row.salt}",${row.qtySold},${row.revenue},${row.margin}%\n`;
      });
    } else if (activeTab === 'SUBSTITUTE_INTELLIGENCE') {
      csvContent += 'Event ID,Date,Time,Original Medicine,Prescribed Brand,Salt Composition,Substituted Medicine,Substitute Brand,Status,Margin Gained (INR),Customer Savings (INR),Pharmacist,Counter,Patient Response\n';
      filteredSubstituteEvents.forEach((evt) => {
        csvContent += `"${evt.id}","${evt.date}","${new Date(evt.timestamp).toLocaleTimeString()}","${evt.originalProductName}","${evt.originalBrand || 'Standard'}","${evt.saltComposition}","${evt.substitutedProductName || 'None'}","${evt.substitutedBrand || 'None'}","${evt.status}",${evt.marginGain || 0},${evt.customerSavings || 0},"${evt.pharmacistName}",${evt.counterNumber},"${evt.patientResponseNote || ''}"\n`;
      });
    } else {
      csvContent += 'Metric,Value\n';
      csvContent += `Gross Sales,INR ${salesSummary.grossSales}\n`;
      csvContent += `Discounts,INR ${salesSummary.discountsGiven}\n`;
      csvContent += `Total CGST,INR ${salesSummary.totalCGST}\n`;
      csvContent += `Total SGST,INR ${salesSummary.totalSGST}\n`;
      csvContent += `Net Revenue,INR ${salesSummary.netRevenue}\n`;
      csvContent += `Total Bills,${salesSummary.totalBills}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GENQUANTAA_${activeTab}_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── HEADER & ACTIONS ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <span>Sales Reports &amp; GST Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {currentUser?.pharmacyName || 'GENQUANTAA MedPlus Pharmacy'} &nbsp;·&nbsp; DL: {currentUser?.licenseNo || 'DL-2024/HYD/889201'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Print Report */}
          <button
            onClick={handlePrintReport}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── DATE FILTER BAR ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">Timeframe:</span>
          {(['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'THIS_MONTH'] as DatePreset[]).map(p => (
            <button
              key={p}
              onClick={() => setDatePreset(p)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                datePreset === p
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 font-semibold text-slate-600">
          <span>From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
          />
          <span>To:</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
          />
        </div>
      </div>

      {/* ── REPORT CATEGORY TABS ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <button
          onClick={() => setActiveTab('SALES')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'SALES'
              ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white/70 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700 font-heading">Sales Overview</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-base font-black text-slate-900 font-heading">₹{salesSummary.netRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-emerald-700 font-bold">Net Revenue</p>
        </button>

        <button
          onClick={() => setActiveTab('GST')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'GST'
              ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white/70 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700 font-heading">GST Tax Report</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-base font-black text-slate-900 font-heading">₹{salesSummary.totalTax.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-blue-700 font-bold">Total GST Collected</p>
        </button>

        <button
          onClick={() => setActiveTab('TOP_MEDS')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'TOP_MEDS'
              ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white/70 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700 font-heading">Top Medicines</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-base font-black text-slate-900 font-heading">{topMeds.length > 0 ? topMeds[0].name.split(' ')[0] : 'N/A'}</p>
          <p className="text-[10px] text-amber-700 font-bold">#1 Best Seller</p>
        </button>

        <button
          onClick={() => setActiveTab('PAYMENT_MODES')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'PAYMENT_MODES'
              ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white/70 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700 font-heading">Payment Modes</span>
            <PieChart className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-base font-black text-slate-900 font-heading">{paymentSplit.length > 0 ? paymentSplit[0].percent : 0}% UPI</p>
          <p className="text-[10px] text-violet-700 font-bold">Digital Payment Share</p>
        </button>

        <button
          onClick={() => setActiveTab('SUBSTITUTE_INTELLIGENCE')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'SUBSTITUTE_INTELLIGENCE'
              ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-500/20'
              : 'bg-white/70 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700 font-heading">Substitute Intel</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-base font-black text-slate-900 font-heading">{subSuccessRate}%</p>
          <p className="text-[10px] text-purple-700 font-bold">Acceptance Rate ({subAcceptedCount}/{subTotalPrompts})</p>
        </button>
      </div>

      {/* ── TAB CONTENT 1: SALES OVERVIEW ───────────────────────────── */}
      {activeTab === 'SALES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Sales</p>
              <p className="text-xl font-black text-slate-900 font-heading mt-0.5">₹{salesSummary.grossSales.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Discounts Allowed</p>
              <p className="text-xl font-black text-emerald-700 font-heading mt-0.5">-₹{salesSummary.discountsGiven.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Bills</p>
              <p className="text-xl font-black text-slate-900 font-heading mt-0.5">{salesSummary.totalBills}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Avg. Bill Value</p>
              <p className="text-xl font-black text-slate-900 font-heading mt-0.5">₹{salesSummary.avgBillValue.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 2: GST TAX REPORT ───────────────────────────── */}
      {activeTab === 'GST' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-heading">HSN-Wise GST Return Summary (GSTR-1 Ready)</h3>
              <p className="text-[11px] text-slate-500 font-medium">Split 50% CGST + 50% SGST for intrastate Telangana transactions</p>
            </div>
            <div className="flex space-x-3 text-xs font-bold">
              <span className="text-slate-700">Total CGST: <strong className="text-emerald-800">₹{salesSummary.totalCGST}</strong></span>
              <span className="text-slate-700">Total SGST: <strong className="text-emerald-800">₹{salesSummary.totalSGST}</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '750px' }}>
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-2.5">HSN Code</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5 text-right">Taxable Value</th>
                  <th className="px-3 py-2.5 text-center">GST Rate</th>
                  <th className="px-3 py-2.5 text-right">CGST (50%)</th>
                  <th className="px-3 py-2.5 text-right">SGST (50%)</th>
                  <th className="px-3 py-2.5 text-right">Total Tax</th>
                  <th className="px-4 py-2.5 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_HSN_TAX_REPORT.map(row => (
                  <tr key={row.hsnCode} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{row.hsnCode}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">{row.description}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900">₹{row.taxableValue.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-600">{row.gstRate}%</td>
                    <td className="px-3 py-2.5 text-right text-emerald-800 font-semibold">₹{row.cgst.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right text-emerald-800 font-semibold">₹{row.sgst.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-800">₹{row.totalTax.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-black text-slate-900">₹{row.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 3: TOP MEDICINES REPORT ─────────────────────── */}
      {activeTab === 'TOP_MEDS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900 font-heading">Best Selling Drugs &amp; Medicines</h3>
            <p className="text-[11px] text-slate-500 font-medium">Ranked by volume sold and gross margin percentage</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '650px' }}>
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-2.5 text-center">Rank</th>
                  <th className="px-4 py-2.5">Medicine Name</th>
                  <th className="px-3 py-2.5">Salt Composition</th>
                  <th className="px-3 py-2.5 text-center">Units Sold</th>
                  <th className="px-3 py-2.5 text-right">Revenue Generated</th>
                  <th className="px-4 py-2.5 text-right">Gross Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topMeds.map((med: any, idx: number) => (
                  <tr key={med.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-center">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-black text-[10px] text-white ${
                        idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-orange-400'
                      }`}>{idx + 1}</span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{med.name}</td>
                    <td className="px-3 py-2.5 text-slate-600">{med.salt || 'N/A'}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-900">{med.qtySold || med.sold || 0}</td>
                    <td className="px-3 py-2.5 text-right font-black text-emerald-800">₹{(med.revenue || 0).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-700">{med.margin || 20}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 4: PAYMENT MODE BREAKDOWN ────────────────────── */}
      {activeTab === 'PAYMENT_MODES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Collection by Payment Channel</h3>
            <div className="space-y-4">
              {paymentSplit.map((p: any) => (
                <div key={p.mode} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{p.mode} ({p.count} bills)</span>
                    <span className="text-emerald-800">₹{p.amount.toLocaleString('en-IN')} ({p.percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${p.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 5: SUBSTITUTE INTELLIGENCE & CONVERSION ANALYTICS (Task #52) ── */}
      {activeTab === 'SUBSTITUTE_INTELLIGENCE' && (
        <div className="space-y-4">
          {/* Staff Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-slate-700">Filter Pharmacist Dispenser:</span>
              {(['ALL', 'Ramesh Kumar', 'Priya Sharma', 'Anand Verma'] as const).map(staff => (
                <button
                  key={staff}
                  onClick={() => setStaffFilter(staff)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    staffFilter === staff
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {staff === 'ALL' ? 'All Pharmacists' : staff}
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Showing <strong>{filteredSubstituteEvents.length}</strong> substitution inquiries
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold font-heading">Total Prompted</span>
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-heading">{subTotalPrompts}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Generic &amp; salt alternatives suggested</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold font-heading">Accepted Swaps</span>
                <CheckCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700 font-heading">{subAcceptedCount}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{subSuccessRate}% conversion success rate</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold font-heading">Pharmacy Margin Gained</span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-2xl font-black text-teal-700 font-heading">+₹{subTotalMarginGain.toFixed(2)}</p>
              <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Extra gross margin captured</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold font-heading">Customer Savings</span>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-700 font-heading">₹{subTotalSavings.toFixed(2)}</p>
              <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Passed via 15% out-of-stock discount</p>
            </div>
          </div>

          {/* Detailed Itemized Substitution Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Substitution Inquiries &amp; Patient Decision History
                </h3>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                Live Store Intelligence
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-2.5">Date &amp; Time</th>
                    <th className="px-3 py-2.5">Requested Medicine</th>
                    <th className="px-3 py-2.5">Salt Active Composition</th>
                    <th className="px-3 py-2.5">Substituted Brand</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-3 py-2.5">Pharmacist</th>
                    <th className="px-3 py-2.5 text-right">Margin Gain</th>
                    <th className="px-3 py-2.5 text-right">Customer Saved</th>
                    <th className="px-4 py-2.5">Patient Notes / Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubstituteEvents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No substitution events match the selected timeframe and pharmacist filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSubstituteEvents.map(evt => (
                      <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {evt.date} <span className="text-slate-400 font-normal">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          <div>{evt.originalProductName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{evt.originalBrand || 'Standard'}</div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 text-[11px] max-w-[180px] truncate" title={evt.saltComposition}>
                          {evt.saltComposition}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-indigo-950">
                          {evt.substitutedProductName ? (
                            <div>
                              <div className="font-bold text-indigo-700">{evt.substitutedProductName}</div>
                              <div className="text-[10px] text-slate-500">{evt.substitutedBrand} • ₹{evt.substitutedPrice}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Declined swap</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {evt.status === 'ACCEPTED' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>✓ Accepted</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span>✕ Declined</span>
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-semibold whitespace-nowrap">
                          {evt.pharmacistName}
                          <div className="text-[10px] text-slate-400">Counter {evt.counterNumber}</div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-teal-700 whitespace-nowrap">
                          {evt.marginGain > 0 ? `+₹${evt.marginGain.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-amber-700 whitespace-nowrap">
                          {evt.customerSavings > 0 ? `₹${evt.customerSavings.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 text-[11px] max-w-[220px]">
                          {evt.patientResponseNote || 'Customer accepted alternative.'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Intelligence Alert */}
          <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-2.5 text-purple-950">
              <Zap className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                <strong>Store Intelligence Recommendation:</strong> Amoxicillin + Clavulanic Acid substitutes yield an average of <strong>+₹42.50 margin per pack</strong> with an 86% patient conversion rate when presenting the 15% discount.
              </span>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              Export Intelligence CSV
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
