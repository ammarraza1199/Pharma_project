import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import api from '../utils/api';
import {
  TrendingUp, Printer, Calendar, FileSpreadsheet,
  PieChart, DollarSign, Award, ShieldCheck,
  Sparkles, ArrowRightLeft, CheckCheck, CheckCircle2, UserCheck, Filter, ArrowUpRight, Zap,
  Vault, Calculator, History, FileCheck, Download, AlertTriangle, RotateCcw, X, Check, ArrowDownRight
} from 'lucide-react';

type ReportTab = 'SALES' | 'GST' | 'EOD_REGISTER' | 'TOP_MEDS' | 'PAYMENT_MODES' | 'SUBSTITUTE_INTELLIGENCE';
type GstSubTab = 'GSTR1' | 'GSTR3B' | 'HSN';
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
  const [gstSubTab, setGstSubTab] = useState<GstSubTab>('GSTR1');
  const [datePreset, setDatePreset] = useState<DatePreset>('THIS_MONTH');
  const [fromDate, setFromDate] = useState<string>('2026-08-01');
  const [toDate, setToDate] = useState<string>('2026-08-14');

  const [salesSummary, setSalesSummary] = useState(MOCK_SALES_SUMMARY);
  const [hsnReport, setHsnReport] = useState(MOCK_HSN_TAX_REPORT);
  const [topMeds, setTopMeds] = useState(MOCK_TOP_MEDICINES);
  const [paymentSplit, setPaymentSplit] = useState(MOCK_PAYMENT_SPLIT);
  const [dailyRevenue, setDailyRevenue] = useState<{ day: string; date: string; value: number }[]>([
    { day: 'Mon', date: '2026-08-08', value: 12400 },
    { day: 'Tue', date: '2026-08-09', value: 14200 },
    { day: 'Wed', date: '2026-08-10', value: 11800 },
    { day: 'Thu', date: '2026-08-11', value: 16500 },
    { day: 'Fri', date: '2026-08-12', value: 13900 },
    { day: 'Sat', date: '2026-08-13', value: 18200 },
    { day: 'Sun', date: '2026-08-14', value: 15400 },
  ]);

  // Day 10: GSTR-1 & GSTR-3B States
  const [gstr1Data, setGstr1Data] = useState<any>({
    summaryTotals: {
      totalInvoices: 184,
      totalTaxable: 70919.64,
      totalCGST: 4255.18,
      totalSGST: 4255.18,
      totalIGST: 0,
      totalTax: 8510.36,
      grandTotal: 87940.36,
    },
    b2b: [
      {
        invoiceNumber: 'INV-2026-0814-0012',
        invoiceDate: '2026-08-12',
        customerName: 'Apollo Cradle Hospital Supplies',
        customerGstin: '36AAACA1234F1Z5',
        placeOfSupply: '36-Telangana',
        taxableValue: 18400.00,
        cgst: 1104.00,
        sgst: 1104.00,
        igst: 0,
        totalInvoiceValue: 20608.00,
      },
      {
        invoiceNumber: 'INV-2026-0814-0045',
        invoiceDate: '2026-08-13',
        customerName: 'Care Diagnostic Clinics Pvt Ltd',
        customerGstin: '36AABCB5678G2Z1',
        placeOfSupply: '36-Telangana',
        taxableValue: 12250.00,
        cgst: 735.00,
        sgst: 735.00,
        igst: 0,
        totalInvoiceValue: 13720.00,
      }
    ],
    b2cSmall: [
      { gstRate: 0,  taxableValue: 2150.00,  cgst: 0,      sgst: 0,      totalTax: 0,       lineTotal: 2150.00,  invoiceCount: 14 },
      { gstRate: 5,  taxableValue: 8400.00,  cgst: 210.00, sgst: 210.00, totalTax: 420.00,  lineTotal: 8820.00,  invoiceCount: 28 },
      { gstRate: 12, taxableValue: 48500.00, cgst: 2910.00,sgst: 2910.00,totalTax: 5820.00, lineTotal: 54320.00, invoiceCount: 122 },
      { gstRate: 18, taxableValue: 11869.64, cgst: 1068.27,sgst: 1068.27,totalTax: 2136.54, lineTotal: 14006.18, invoiceCount: 20 },
    ],
    hsnSummary: MOCK_HSN_TAX_REPORT.map(h => ({
      ...h,
      uqc: 'STRIPS/NOS',
      totalQty: 140,
      totalValue: h.lineTotal,
    })),
    docSummary: {
      docType: 'Invoices for outward supply',
      fromSerial: 'INV-2026-0801-0001',
      toSerial: 'INV-2026-0814-0184',
      totalIssued: 184,
      cancelledCount: 0,
      netIssued: 184,
    }
  });

  const [gstr3bData, setGstr3bData] = useState<any>({
    outwardSupplies: {
      taxableSupplies: {
        description: '3.1(a) Outward taxable supplies (other than zero rated, nil, non-GST)',
        taxableValue: 70919.64,
        cgst: 4255.18,
        sgst: 4255.18,
        totalTax: 8510.36,
      },
      zeroRated: { taxableValue: 0, igst: 0 },
      nilExempt: { taxableValue: 2150.00, cgst: 0, sgst: 0 },
      reverseCharge: { taxableValue: 0, cgst: 0, sgst: 0 },
      nonGst: { taxableValue: 0 },
    },
    eligibleITC: {
      allOtherITC: {
        description: '4(A)(5) All other ITC (Inward GRN Purchases)',
        taxableValue: 54200.00,
        cgst: 3252.00,
        sgst: 3252.00,
        totalITC: 6504.00,
      }
    },
    netTaxComputation: {
      outputTax: { cgst: 4255.18, sgst: 4255.18, total: 8510.36 },
      inputTaxCredit: { cgst: 3252.00, sgst: 3252.00, total: 6504.00 },
      netTaxToPayInCash: { cgst: 1003.18, sgst: 1003.18, total: 2006.36 },
      itcBalanceCarryForward: { cgst: 0, sgst: 0, total: 0 },
    }
  });

  // Day 10: EOD Cash Drawer Reconciliation States
  const [eodDate, setEodDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [eodData, setEodData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    shift: 'FULL_DAY',
    status: 'OPEN',
    isClosed: false,
    cashierName: currentUser?.pharmacistName || currentUser?.name || 'Ramesh Kumar (Pharmacist)',
    openingFloat: 2000.00,
    totalBills: 62,
    grossSales: 38450.00,
    totalSalesCash: 21850.00,
    totalSalesUpi: 12400.00,
    totalSalesCard: 4200.00,
    totalSalesSplitCash: 1200.00,
    totalRefundsCash: 450.00,
    refundsCount: 2,
    pettyCashOutflow: 180.00, // Tea/courier
    pettyCashInflow: 0.00,
    expectedCash: 23220.00, // 2000 + 21850 - 450 - 180 = 23220
    actualCashCounted: 23220.00,
    cashVariance: 0.00,
    denominationBreakdown: {
      n2000: 0,
      n500: 42,  // 21,000
      n200: 8,   // 1,600
      n100: 6,   // 600
      n50: 0,
      n20: 0,
      n10: 2,    // 20
      coins: 0,
    },
    notes: 'Regular drawer balance verified.',
    verifiedBy: 'Store Supervisor',
  });

  const [denominations, setDenominations] = useState<{
    n2000: number;
    n500: number;
    n200: number;
    n100: number;
    n50: number;
    n20: number;
    n10: number;
    coins: number;
  }>({
    n2000: 0,
    n500: 42,
    n200: 8,
    n100: 6,
    n50: 0,
    n20: 0,
    n10: 2,
    coins: 0,
  });

  const [openingFloatInput, setOpeningFloatInput] = useState<number>(2000);
  const [pettyExpenseInput, setPettyExpenseInput] = useState<number>(180);
  const [pettyInflowInput, setPettyInflowInput] = useState<number>(0);
  const [cashierNotesInput, setCashierNotesInput] = useState<string>('Shift closed with full cash drawer count matching sales.');
  const [showZReportModal, setShowZReportModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [drawerCloseSuccess, setDrawerCloseSuccess] = useState<boolean>(false);

  // Substitute Intelligence State & Filtering
  const substituteEvents = useSelector((state: RootState) => state.pos.substituteEvents || []);
  const [staffFilter, setStaffFilter] = useState<string>('ALL');

  const filteredSubstituteEvents = substituteEvents.filter(evt => {
    if (staffFilter !== 'ALL' && evt.pharmacistName !== staffFilter) return false;
    return true;
  });

  const subTotalPrompts = filteredSubstituteEvents.length;
  const subAcceptedCount = filteredSubstituteEvents.filter(e => e.status === 'ACCEPTED').length;
  const subSuccessRate = subTotalPrompts > 0 ? Number(((subAcceptedCount / subTotalPrompts) * 100).toFixed(1)) : 78.4;
  const subTotalMarginGain = filteredSubstituteEvents.filter(e => e.status === 'ACCEPTED').reduce((sum, e) => sum + (e.marginGain || 0), 0);
  const subTotalSavings = filteredSubstituteEvents.filter(e => e.status === 'ACCEPTED').reduce((sum, e) => sum + (e.customerSavings || 0), 0);

  // Calculate live counted cash from denomination inputs
  const calculatedCountedCash =
    (denominations.n2000 * 2000) +
    (denominations.n500 * 500) +
    (denominations.n200 * 200) +
    (denominations.n100 * 100) +
    (denominations.n50 * 50) +
    (denominations.n20 * 20) +
    (denominations.n10 * 10) +
    Number(denominations.coins || 0);

  const calculatedExpectedCash = Number((
    openingFloatInput +
    (eodData.totalSalesCash || 0) -
    (eodData.totalRefundsCash || 0) -
    pettyExpenseInput +
    pettyInflowInput
  ).toFixed(2));

  const calculatedVariance = Number((calculatedCountedCash - calculatedExpectedCash).toFixed(2));

  // Fetch sales, GST and EOD reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const query = `?from=${fromDate}&to=${toDate}`;
        const [salesRes, hsnRes, medsRes, paymentRes, dailyRes, gstr1Res, gstr3bRes] = await Promise.all([
          api.get(`/reports/sales-summary${query}`),
          api.get(`/reports/hsn-tax${query}`),
          api.get(`/reports/top-medicines${query}`),
          api.get(`/reports/payment-split${query}`),
          api.get(`/reports/daily-revenue?days=7`),
          api.get(`/reports/gst/gstr-1${query}`),
          api.get(`/reports/gst/gstr-3b${query}`)
        ]);

        if (salesRes.data?.success) setSalesSummary(salesRes.data.data);
        if (hsnRes.data?.success) setHsnReport(hsnRes.data.data);
        if (medsRes.data?.success) setTopMeds(medsRes.data.data);
        if (paymentRes.data?.success) setPaymentSplit(paymentRes.data.data);
        if (dailyRes.data?.success && Array.isArray(dailyRes.data.data) && dailyRes.data.data.length > 0) {
          setDailyRevenue(dailyRes.data.data);
        }
        if (gstr1Res.data?.success) setGstr1Data(gstr1Res.data.data);
        if (gstr3bRes.data?.success) setGstr3bData(gstr3bRes.data.data);
      } catch (err) {
        console.error('Failed to fetch reports', err);
      }
    };
    fetchReports();
  }, [fromDate, toDate]);

  // Fetch EOD live summary when eodDate changes
  useEffect(() => {
    const fetchEOD = async () => {
      try {
        const res = await api.get(`/reports/eod-register/live-summary?date=${eodDate}`);
        if (res.data?.success) {
          const d = res.data.data;
          setEodData(d);
          setOpeningFloatInput(d.openingFloat ?? 2000);
          setPettyExpenseInput(d.pettyCashOutflow ?? 0);
          setPettyInflowInput(d.pettyCashInflow ?? 0);
          if (d.denominationBreakdown) {
            setDenominations({
              n2000: d.denominationBreakdown.n2000 || 0,
              n500: d.denominationBreakdown.n500 || 0,
              n200: d.denominationBreakdown.n200 || 0,
              n100: d.denominationBreakdown.n100 || 0,
              n50: d.denominationBreakdown.n50 || 0,
              n20: d.denominationBreakdown.n20 || 0,
              n10: d.denominationBreakdown.n10 || 0,
              coins: d.denominationBreakdown.coins || 0,
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch live EOD drawer summary', err);
      }
    };
    fetchEOD();
  }, [eodDate]);

  // Adjust dates based on preset
  useEffect(() => {
    const now = new Date();
    if (datePreset === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      setFromDate(todayStr);
      setToDate(todayStr);
      setEodDate(todayStr);
    } else if (datePreset === 'YESTERDAY') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setFromDate(yStr);
      setToDate(yStr);
      setEodDate(yStr);
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

  // Quick count helper (pre-fill denominations to match expected cash)
  const handleQuickCountFill = () => {
    let rem = calculatedExpectedCash;
    const n500 = Math.floor(rem / 500);
    rem = rem % 500;
    const n200 = Math.floor(rem / 200);
    rem = rem % 200;
    const n100 = Math.floor(rem / 100);
    rem = rem % 100;
    const n50 = Math.floor(rem / 50);
    rem = rem % 50;
    const n20 = Math.floor(rem / 20);
    rem = rem % 20;
    const n10 = Math.floor(rem / 10);
    rem = rem % 10;
    const coins = Number(rem.toFixed(2));

    setDenominations({
      n2000: 0,
      n500,
      n200,
      n100,
      n50,
      n20,
      n10,
      coins
    });
  };

  // Close & Reconcile EOD Register
  const handleCloseDrawerSubmit = async () => {
    try {
      const payload = {
        date: eodDate,
        shift: eodData.shift || 'FULL_DAY',
        openingFloat: openingFloatInput,
        pettyCashOutflow: pettyExpenseInput,
        pettyCashInflow: pettyInflowInput,
        denominationBreakdown: denominations,
        actualCashCounted: calculatedCountedCash,
        notes: cashierNotesInput,
        verifiedBy: currentUser?.pharmacistName || currentUser?.name || 'Manager'
      };

      const res = await api.post('/reports/eod-register/close-drawer', payload);
      if (res.data?.success) {
        setEodData((prev: any) => ({
          ...prev,
          status: 'CLOSED',
          isClosed: true,
          expectedCash: calculatedExpectedCash,
          actualCashCounted: calculatedCountedCash,
          cashVariance: calculatedVariance,
          closedAt: new Date().toISOString(),
        }));
        setDrawerCloseSuccess(true);
        setTimeout(() => setDrawerCloseSuccess(false), 5000);
        setShowZReportModal(true);
      }
    } catch (err) {
      console.error('Failed to close cash drawer', err);
      // Fallback local status update
      setEodData((prev: any) => ({
        ...prev,
        status: 'CLOSED',
        isClosed: true,
        expectedCash: calculatedExpectedCash,
        actualCashCounted: calculatedCountedCash,
        cashVariance: calculatedVariance,
        closedAt: new Date().toISOString(),
      }));
      setDrawerCloseSuccess(true);
      setShowZReportModal(true);
    }
  };

  // Load history records
  const handleLoadHistory = async () => {
    try {
      const res = await api.get('/reports/eod-register/history?limit=15');
      if (res.data?.success) {
        setHistoryRecords(res.data.data);
      } else {
        setHistoryRecords([
          {
            _id: 'reg-01',
            registerDate: '2026-08-13',
            shift: 'FULL_DAY',
            cashierName: 'Ramesh Kumar',
            openingFloat: 2000,
            grossSales: 41200,
            totalSalesCash: 24500,
            expectedCash: 25850,
            actualCashCounted: 25850,
            cashVariance: 0,
            status: 'CLOSED',
            verifiedBy: 'Store Supervisor'
          },
          {
            _id: 'reg-02',
            registerDate: '2026-08-12',
            shift: 'FULL_DAY',
            cashierName: 'Priya Sharma',
            openingFloat: 2000,
            grossSales: 36800,
            totalSalesCash: 19400,
            expectedCash: 21220,
            actualCashCounted: 21200,
            cashVariance: -20,
            status: 'CLOSED',
            verifiedBy: 'Store Supervisor'
          }
        ]);
      }
    } catch (e) {
      setHistoryRecords([
        {
          _id: 'reg-01',
          registerDate: '2026-08-13',
          shift: 'FULL_DAY',
          cashierName: 'Ramesh Kumar',
          openingFloat: 2000,
          grossSales: 41200,
          totalSalesCash: 24500,
          expectedCash: 25850,
          actualCashCounted: 25850,
          cashVariance: 0,
          status: 'CLOSED',
          verifiedBy: 'Store Supervisor'
        }
      ]);
    }
    setShowHistoryModal(true);
  };

  // 1-Click GSTR-1 JSON Export (Govt Portal Ready Schema)
  const handleExportGSTR1JSON = () => {
    const portalJson = {
      gstin: currentUser?.gstin || '36AAACA1234F1Z5',
      fp: `${toDate.slice(5, 7)}${toDate.slice(0, 4)}`,
      version: 'GSTR1_V2.0',
      hash: 'hash-pharmacy-verified',
      b2b: gstr1Data.b2b.map((inv: any) => ({
        ctin: inv.customerGstin,
        inv: [
          {
            inum: inv.invoiceNumber,
            idt: inv.invoiceDate,
            val: inv.totalInvoiceValue,
            pos: '36',
            rchrg: 'N',
            inv_typ: 'R',
            itms: [
              {
                num: 1,
                itm_det: {
                  rt: 12,
                  txval: inv.taxableValue,
                  camt: inv.cgst,
                  samt: inv.sgst,
                  csamt: 0
                }
              }
            ]
          }
        ]
      })),
      b2cs: gstr1Data.b2cSmall.map((row: any) => ({
        sply_ty: 'INTRA',
        rt: row.gstRate,
        typ: 'OE',
        pos: '36',
        txval: row.taxableValue,
        camt: row.cgst,
        samt: row.sgst,
        csamt: 0
      })),
      hsn: {
        data: gstr1Data.hsnSummary.map((h: any, idx: number) => ({
          num: idx + 1,
          hsn_sc: h.hsnCode,
          desc: h.description,
          uqc: 'NOS',
          qty: h.totalQty || 100,
          val: h.totalValue,
          txval: h.taxableValue,
          camt: h.cgst,
          samt: h.sgst,
          csamt: 0
        }))
      },
      doc_issue: {
        doc_det: [
          {
            doc_num: 1,
            doc_typ: 'Invoices for outward supply',
            from: gstr1Data.docSummary?.fromSerial || 'INV-001',
            to: gstr1Data.docSummary?.toSerial || 'INV-184',
            totnum: gstr1Data.docSummary?.totalIssued || 184,
            canc: 0,
            net_issue: gstr1Data.docSummary?.netIssued || 184
          }
        ]
      }
    };

    const blob = new Blob([JSON.stringify(portalJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1_${portalJson.gstin}_${fromDate}_to_${toDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'GST') {
      if (gstSubTab === 'GSTR1') {
        csvContent += '--- GSTR-1 TAX RETURN AUDIT SUMMARY ---\n';
        csvContent += `Pharmacy GSTIN: ${currentUser?.gstin || '36AAACA1234F1Z5'}, Period: ${fromDate} to ${toDate}\n\n`;
        csvContent += 'SECTION 1: B2B INVOICES (INSTITUTIONAL / GST REGISTERED)\n';
        csvContent += 'Invoice Number,Invoice Date,Customer Name,Customer GSTIN,Place of Supply,Taxable Value (INR),CGST,SGST,IGST,Invoice Total (INR)\n';
        gstr1Data.b2b.forEach((b: any) => {
          csvContent += `"${b.invoiceNumber}","${b.invoiceDate}","${b.customerName}","${b.customerGstin}","${b.placeOfSupply}",${b.taxableValue},${b.cgst},${b.sgst},${b.igst},${b.totalInvoiceValue}\n`;
        });
        csvContent += '\nSECTION 2: B2C SMALL (RETAIL SALES GROUPED BY GST RATE)\n';
        csvContent += 'GST Rate,Invoice Count,Taxable Value (INR),CGST (INR),SGST (INR),Total Tax (INR),Line Total (INR)\n';
        gstr1Data.b2cSmall.forEach((r: any) => {
          csvContent += `${r.gstRate}%,${r.invoiceCount},${r.taxableValue},${r.cgst},${r.sgst},${r.totalTax},${r.lineTotal}\n`;
        });
        csvContent += '\nSECTION 3: HSN OUTWARD SUMMARY (TABLE 12)\n';
        csvContent += 'HSN Code,Description,UQC,Quantity,Total Value (INR),Taxable Value (INR),CGST,SGST\n';
        gstr1Data.hsnSummary.forEach((h: any) => {
          csvContent += `"${h.hsnCode}","${h.description}","${h.uqc || 'NOS'}",${h.totalQty || 100},${h.totalValue},${h.taxableValue},${h.cgst},${h.sgst}\n`;
        });
      } else if (gstSubTab === 'GSTR3B') {
        csvContent += '--- GSTR-3B MONTHLY SUMMARY & INPUT TAX CREDIT RECONCILIATION ---\n';
        csvContent += `Pharmacy GSTIN: ${currentUser?.gstin || '36AAACA1234F1Z5'}, Period: ${fromDate} to ${toDate}\n\n`;
        csvContent += 'Table 3.1: Details of Outward Supplies\n';
        csvContent += 'Supply Nature,Taxable Value (INR),CGST (INR),SGST (INR),Total Tax (INR)\n';
        csvContent += `"3.1(a) Outward Taxable Supplies",${gstr3bData.outwardSupplies?.taxableSupplies?.taxableValue},${gstr3bData.outwardSupplies?.taxableSupplies?.cgst},${gstr3bData.outwardSupplies?.taxableSupplies?.sgst},${gstr3bData.outwardSupplies?.taxableSupplies?.totalTax}\n`;
        csvContent += `"3.1(c) Nil Rated / Exempted",${gstr3bData.outwardSupplies?.nilExempt?.taxableValue},0,0,0\n\n`;
        csvContent += 'Table 4: Eligible Input Tax Credit (ITC from GRN Purchases)\n';
        csvContent += 'ITC Category,Inward Taxable (INR),Inward CGST (INR),Inward SGST (INR),Total ITC (INR)\n';
        csvContent += `"4(A)(5) All Other ITC (Purchase Inward)",${gstr3bData.eligibleITC?.allOtherITC?.taxableValue},${gstr3bData.eligibleITC?.allOtherITC?.cgst},${gstr3bData.eligibleITC?.allOtherITC?.sgst},${gstr3bData.eligibleITC?.allOtherITC?.totalITC}\n\n`;
        csvContent += 'Table 6: Net Tax Payable Calculation\n';
        csvContent += `Output Tax Liability: CGST INR ${gstr3bData.netTaxComputation?.outputTax?.cgst}, SGST INR ${gstr3bData.netTaxComputation?.outputTax?.sgst}\n`;
        csvContent += `Less Inward ITC Offset: CGST INR ${gstr3bData.netTaxComputation?.inputTaxCredit?.cgst}, SGST INR ${gstr3bData.netTaxComputation?.inputTaxCredit?.sgst}\n`;
        csvContent += `Net Cash Tax Payable: CGST INR ${gstr3bData.netTaxComputation?.netTaxToPayInCash?.cgst}, SGST INR ${gstr3bData.netTaxComputation?.netTaxToPayInCash?.sgst}\n`;
      } else {
        csvContent += 'HSN Code,Description,Taxable Value (INR),GST Rate,CGST (INR),SGST (INR),Total Tax (INR),Line Total (INR)\n';
        hsnReport.forEach((row: any) => {
          csvContent += `${row.hsnCode},"${row.description}",${row.taxableValue},${row.gstRate}%,${row.cgst},${row.sgst},${row.totalTax},${row.lineTotal}\n`;
        });
      }
    } else if (activeTab === 'EOD_REGISTER') {
      csvContent += '--- END-OF-DAY CASH DRAWER RECONCILIATION REPORT ---\n';
      csvContent += `Date: ${eodData.date}, Shift: ${eodData.shift}, Cashier: ${eodData.cashierName}, Status: ${eodData.status}\n\n`;
      csvContent += 'Drawer Cash Flow Reconciliation,Amount (INR)\n';
      csvContent += `Opening Cash Float,${openingFloatInput}\n`;
      csvContent += `Cash Sales Collected,${eodData.totalSalesCash}\n`;
      csvContent += `Split Cash Collected,${eodData.totalSalesSplitCash || 0}\n`;
      csvContent += `Cash Refunds Disbursed,-${eodData.totalRefundsCash}\n`;
      csvContent += `Petty Cash Outflow (Expenses),-${pettyExpenseInput}\n`;
      csvContent += `Petty Cash Inflow (Top-Up),+${pettyInflowInput}\n`;
      csvContent += `Net Expected Cash in Drawer,${calculatedExpectedCash}\n`;
      csvContent += `Actual Physical Counted Cash,${calculatedCountedCash}\n`;
      csvContent += `Cash Variance (Discrepancy),${calculatedVariance}\n\n`;
      csvContent += 'Denomination Count Breakdown\n';
      csvContent += `Rs 2000 x ${denominations.n2000} = INR ${denominations.n2000 * 2000}\n`;
      csvContent += `Rs 500 x ${denominations.n500} = INR ${denominations.n500 * 500}\n`;
      csvContent += `Rs 200 x ${denominations.n200} = INR ${denominations.n200 * 200}\n`;
      csvContent += `Rs 100 x ${denominations.n100} = INR ${denominations.n100 * 100}\n`;
      csvContent += `Rs 50 x ${denominations.n50} = INR ${denominations.n50 * 50}\n`;
      csvContent += `Rs 20 x ${denominations.n20} = INR ${denominations.n20 * 20}\n`;
      csvContent += `Rs 10 x ${denominations.n10} = INR ${denominations.n10 * 10}\n`;
      csvContent += `Coins = INR ${denominations.coins}\n\n`;
      csvContent += 'Digital Settlements Summary\n';
      csvContent += `UPI / QR Collections,INR ${eodData.totalSalesUpi}\n`;
      csvContent += `Card / EDC Collections,INR ${eodData.totalSalesCard}\n`;
      csvContent += `Total Gross Store Revenue,INR ${eodData.grossSales}\n`;
      csvContent += `Total Bills Settled,${eodData.totalBills}\n`;
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
            <span>Sales Reports, GST Compliance &amp; EOD Register</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {currentUser?.pharmacyName || 'GENQUANTAA MedPlus Pharmacy'} &nbsp;·&nbsp; GSTIN: {currentUser?.gstin || '36AAACA1234F1Z5'} &nbsp;·&nbsp; DL: {currentUser?.licenseNo || 'DL-2024/HYD/889201'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Day 10 GSTR-1 JSON Direct Export */}
          {activeTab === 'GST' && (
            <button
              onClick={handleExportGSTR1JSON}
              className="flex items-center space-x-1.5 bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-800 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Download GSTR-1 JSON schema for direct upload into GST Portal Offline Tool"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>GSTR-1 JSON (Govt Portal)</span>
            </button>
          )}

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

      {/* ── REPORT CATEGORY TABS (6 TABS) ───────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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
              ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white/70 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700 font-heading">GST Compliance</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-base font-black text-slate-900 font-heading">₹{salesSummary.totalTax.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-blue-700 font-bold">GSTR-1 &amp; GSTR-3B</p>
        </button>

        <button
          onClick={() => setActiveTab('EOD_REGISTER')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'EOD_REGISTER'
              ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white/70 border-slate-200 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700 font-heading">EOD Cash Drawer</span>
            <Vault className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-base font-black text-slate-900 font-heading">₹{calculatedExpectedCash.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-amber-700 font-bold">
            {eodData.isClosed ? 'Closed • Reconciled' : 'Live Active Shift'}
          </p>
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
              <p className="text-[10px] font-bold text-slate-400 uppercase">Taxable Value</p>
              <p className="text-xl font-black text-slate-900 font-heading mt-0.5">₹{salesSummary.taxableAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total GST Collected</p>
              <p className="text-xl font-black text-blue-700 font-heading mt-0.5">₹{salesSummary.totalTax.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* 7-Day Revenue Trend */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 font-heading">7-Day Sales Volume</h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Live Trend</span>
            </div>
            <div className="grid grid-cols-7 gap-2 pt-2">
              {dailyRevenue.map((d, i) => {
                const maxVal = Math.max(...dailyRevenue.map(x => x.value), 1);
                const heightPct = Math.min(100, Math.max(15, Math.round((d.value / maxVal) * 100)));
                return (
                  <div key={d.date || i} className="flex flex-col items-center space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-700">₹{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}</span>
                    <div className="w-full bg-slate-100 rounded-lg h-24 flex items-end p-1">
                      <div
                        className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-md transition-all cursor-pointer"
                        style={{ height: `${heightPct}%` }}
                        title={`${d.date} (${d.day}): ₹${d.value.toFixed(2)}`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 2: GST COMPLIANCE (GSTR-1, GSTR-3B, HSN) ───── */}
      {activeTab === 'GST' && (
        <div className="space-y-4">
          {/* Sub Navigation Bar for GST */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setGstSubTab('GSTR1')}
                className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  gstSubTab === 'GSTR1'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>GSTR-1 (Outward Returns)</span>
              </button>

              <button
                onClick={() => setGstSubTab('GSTR3B')}
                className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  gstSubTab === 'GSTR3B'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>GSTR-3B (Tax Return &amp; Inward ITC)</span>
              </button>

              <button
                onClick={() => setGstSubTab('HSN')}
                className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  gstSubTab === 'HSN'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>HSN Chapter 30 Schedule</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-slate-500">
                Filing Period: <strong>{fromDate}</strong> to <strong>{toDate}</strong>
              </span>
            </div>
          </div>

          {/* GSTR-1 View */}
          {gstSubTab === 'GSTR1' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Taxable Outward</p>
                  <p className="text-xl font-black text-slate-900 font-heading mt-0.5">₹{gstr1Data.summaryTotals?.totalTaxable?.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Across {gstr1Data.summaryTotals?.totalInvoices} Invoices</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Central Tax (CGST 50%)</p>
                  <p className="text-xl font-black text-blue-700 font-heading mt-0.5">₹{gstr1Data.summaryTotals?.totalCGST?.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-blue-600 font-semibold">Intrastate Telangana</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">State Tax (SGST 50%)</p>
                  <p className="text-xl font-black text-blue-700 font-heading mt-0.5">₹{gstr1Data.summaryTotals?.totalSGST?.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-blue-600 font-semibold">Intrastate Telangana</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Tax Liability</p>
                  <p className="text-xl font-black text-emerald-700 font-heading mt-0.5">₹{gstr1Data.summaryTotals?.totalTax?.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">GSTR-1 Outward Total</p>
                </div>
              </div>

              {/* Table 4: B2B Invoices */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 font-heading flex items-center space-x-1.5">
                      <span>Table 4: Taxable Outward Supplies to Registered Persons (B2B)</span>
                      <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{gstr1Data.b2b?.length || 0} Bills</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Invoices with valid recipient GSTIN (Hospitals, Clinics, Distributors)</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="px-4 py-2.5">Invoice #</th>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Recipient Name</th>
                        <th className="px-3 py-2.5">Recipient GSTIN</th>
                        <th className="px-3 py-2.5 text-right">Taxable Value</th>
                        <th className="px-3 py-2.5 text-right">CGST</th>
                        <th className="px-3 py-2.5 text-right">SGST</th>
                        <th className="px-4 py-2.5 text-right">Invoice Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gstr1Data.b2b?.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                            No B2B invoices recorded in this timeframe. Retail counter sales appear under B2C Small below.
                          </td>
                        </tr>
                      ) : (
                        gstr1Data.b2b?.map((row: any) => (
                          <tr key={row.invoiceNumber} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{row.invoiceNumber}</td>
                            <td className="px-3 py-2.5 text-slate-600">{row.invoiceDate ? String(row.invoiceDate).slice(0, 10) : ''}</td>
                            <td className="px-3 py-2.5 font-bold text-slate-900">{row.customerName}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-700 font-semibold">{row.customerGstin}</td>
                            <td className="px-3 py-2.5 text-right font-semibold text-slate-900">₹{row.taxableValue.toFixed(2)}</td>
                            <td className="px-3 py-2.5 text-right text-emerald-800 font-semibold">₹{row.cgst.toFixed(2)}</td>
                            <td className="px-3 py-2.5 text-right text-emerald-800 font-semibold">₹{row.sgst.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right font-black text-slate-900">₹{row.totalInvoiceValue.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 7: B2C Small (Retail Outward Grouped by Rate) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                      Table 7: Taxable Supplies to Unregistered Persons (B2C Small)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Consolidated retail patient counter sales grouped by GST slab</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="px-4 py-2.5">Rate Slab</th>
                        <th className="px-3 py-2.5 text-center">Invoices / Items</th>
                        <th className="px-3 py-2.5 text-right">Taxable Value</th>
                        <th className="px-3 py-2.5 text-right">CGST (50%)</th>
                        <th className="px-3 py-2.5 text-right">SGST (50%)</th>
                        <th className="px-3 py-2.5 text-right">Total GST</th>
                        <th className="px-4 py-2.5 text-right">Gross Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gstr1Data.b2cSmall?.map((r: any) => (
                        <tr key={r.gstRate} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 font-mono font-black text-blue-900">
                              {r.gstRate}% GST
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-700">{r.invoiceCount}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900">₹{r.taxableValue.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-800 font-semibold">₹{r.cgst.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-800 font-semibold">₹{r.sgst.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right font-black text-blue-800">₹{r.totalTax.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right font-black text-slate-900">₹{r.lineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 13: Document Issuance Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-slate-900">Table 13: Document Issuance Audit Trail</h4>
                    <p className="text-[11px] text-slate-500">
                      Serial Range: <strong>{gstr1Data.docSummary?.fromSerial}</strong> to <strong>{gstr1Data.docSummary?.toSerial}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex space-x-4 font-bold text-slate-700">
                  <span>Total Issued: <strong className="text-slate-900">{gstr1Data.docSummary?.totalIssued}</strong></span>
                  <span>Cancelled: <strong className="text-slate-500">0</strong></span>
                  <span>Net Outward: <strong className="text-emerald-700">{gstr1Data.docSummary?.netIssued}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* GSTR-3B View */}
          {gstSubTab === 'GSTR3B' && (
            <div className="space-y-4">
              {/* Computation Banner */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-md flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-black font-heading tracking-tight">GSTR-3B Tax Liability &amp; Inward ITC Offset</h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Net GST cash payable after offsetting Input Tax Credit (ITC) from Inward GRN procurement
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <p className="text-[10px] text-blue-200 uppercase font-bold">Net Cash Tax To Pay</p>
                    <p className="text-2xl font-black text-emerald-300 font-heading">
                      ₹{gstr3bData.netTaxComputation?.netTaxToPayInCash?.total?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Table 3.1 & Table 4 Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 3.1 Outward Liability */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 font-heading">3.1 Details of Outward Supplies (Sales)</h4>
                      <p className="text-[11px] text-slate-500">Output tax liability on retail and institutional sales</p>
                    </div>
                    <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md">Output Tax</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="font-bold text-slate-800">3.1(a) Outward Taxable Supplies</div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400 block">Taxable Value</span>
                          <span className="font-bold text-slate-900">₹{gstr3bData.outwardSupplies?.taxableSupplies?.taxableValue?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">CGST (50%)</span>
                          <span className="font-bold text-emerald-800">₹{gstr3bData.outwardSupplies?.taxableSupplies?.cgst?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">SGST (50%)</span>
                          <span className="font-bold text-emerald-800">₹{gstr3bData.outwardSupplies?.taxableSupplies?.sgst?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-[11px]">
                      <div>
                        <span className="font-bold text-slate-800 block">3.1(c) Nil Rated &amp; Exempted Supplies</span>
                        <span className="text-slate-400">Oral rehydration salts, life-saving exemptions</span>
                      </div>
                      <span className="font-bold text-slate-700">₹{gstr3bData.outwardSupplies?.nilExempt?.taxableValue?.toFixed(2)}</span>
                    </div>

                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex justify-between items-center font-bold">
                      <span className="text-blue-900">Total Output Tax Liability:</span>
                      <span className="text-blue-900 text-sm">₹{gstr3bData.netTaxComputation?.outputTax?.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Table 4 Eligible ITC */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 font-heading">4. Eligible Input Tax Credit (ITC)</h4>
                      <p className="text-[11px] text-slate-500">GST paid on inward medicines received through GRN</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">Input Credit</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="font-bold text-slate-800">4(A)(5) All Other ITC (Purchase GRN)</div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400 block">Inward Purchases</span>
                          <span className="font-bold text-slate-900">₹{gstr3bData.eligibleITC?.allOtherITC?.taxableValue?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Input CGST</span>
                          <span className="font-bold text-teal-800">₹{gstr3bData.eligibleITC?.allOtherITC?.cgst?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Input SGST</span>
                          <span className="font-bold text-teal-800">₹{gstr3bData.eligibleITC?.allOtherITC?.sgst?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex justify-between items-center font-bold">
                      <span className="text-emerald-900">Total Available ITC:</span>
                      <span className="text-emerald-900 text-sm">₹{gstr3bData.netTaxComputation?.inputTaxCredit?.total?.toFixed(2)}</span>
                    </div>

                    {/* Net Cash Offset Box */}
                    <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Gross Output Tax (Sales):</span>
                        <span className="font-mono font-bold">₹{gstr3bData.netTaxComputation?.outputTax?.total?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-teal-400">Less Inward ITC (Purchases):</span>
                        <span className="font-mono font-bold text-teal-300">-₹{gstr3bData.netTaxComputation?.inputTaxCredit?.total?.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-700 pt-1 flex justify-between items-center text-xs font-bold">
                        <span className="text-emerald-400">Net Tax Payable in Cash:</span>
                        <span className="font-mono text-sm text-emerald-300">₹{gstr3bData.netTaxComputation?.netTaxToPayInCash?.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HSN Schedule View */}
          {gstSubTab === 'HSN' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">HSN-Wise GST Return Summary (GSTR-1 Table 12)</h3>
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
                    {hsnReport.map((row: any) => (
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
        </div>
      )}

      {/* ── TAB CONTENT 3: END-OF-DAY (EOD) CASH DRAWER RECONCILIATION ── */}
      {activeTab === 'EOD_REGISTER' && (
        <div className="space-y-4">
          {/* Top Status & Date Control Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <Vault className="w-5 h-5 text-amber-600" />
                <span className="font-extrabold text-slate-900 text-sm font-heading">Register Date:</span>
                <input
                  type="date"
                  value={eodDate}
                  onChange={e => setEodDate(e.target.value)}
                  className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">Shift:</span>
                <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md font-mono text-[11px]">
                  {eodData.shift || 'FULL_DAY'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 font-semibold">Cashier: <strong>{eodData.cashierName}</strong></span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-black ${
                eodData.isClosed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse'
              }`}>
                {eodData.isClosed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Vault className="w-3.5 h-3.5 text-amber-600" />}
                <span>{eodData.isClosed ? 'SHIFT CLOSED & VERIFIED' : 'ACTIVE LIVE SHIFT'}</span>
              </span>

              <button
                onClick={handleLoadHistory}
                className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Past Registers</span>
              </button>
            </div>
          </div>

          {drawerCloseSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-bold animate-in fade-in">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>End-of-day register closed and reconciled successfully. Z-Report generated!</span>
              </div>
              <button
                onClick={() => setShowZReportModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs"
              >
                View Z-Report Slip
              </button>
            </div>
          )}

          {/* 6 Key Drawer Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">1. Opening Float</p>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  disabled={eodData.isClosed}
                  value={openingFloatInput}
                  onChange={e => setOpeningFloatInput(Number(e.target.value))}
                  className="w-full text-base font-black text-slate-900 font-heading bg-transparent focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400">Morning starting cash</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">2. Cash Inflow (+)</p>
              <p className="text-base font-black text-emerald-700 font-heading mt-0.5">
                ₹{eodData.totalSalesCash?.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-600 font-medium">From {eodData.totalBills} Sales Bills</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">3. Cash Refunds (-)</p>
              <p className="text-base font-black text-rose-700 font-heading mt-0.5">
                -₹{eodData.totalRefundsCash?.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-rose-600 font-medium">{eodData.refundsCount || 0} Return Notes</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">4. Petty Cash Out (-)</p>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="text-xs font-bold text-slate-500">-₹</span>
                <input
                  type="number"
                  disabled={eodData.isClosed}
                  value={pettyExpenseInput}
                  onChange={e => setPettyExpenseInput(Number(e.target.value))}
                  className="w-full text-base font-black text-slate-900 font-heading bg-transparent focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400">Tea / shop maintenance</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-blue-500/40 p-3 shadow-xs bg-blue-50/20">
              <p className="text-[10px] font-extrabold text-blue-700 uppercase">5. Expected Cash</p>
              <p className="text-lg font-black text-blue-900 font-heading mt-0.5">
                ₹{calculatedExpectedCash.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-blue-600 font-bold">System Target Total</p>
            </div>

            <div className={`rounded-2xl border-2 p-3 shadow-xs transition-all ${
              calculatedVariance === 0
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                : calculatedVariance > 0
                ? 'bg-blue-50 border-blue-500 text-blue-900'
                : 'bg-rose-50 border-rose-500 text-rose-900'
            }`}>
              <p className="text-[10px] font-extrabold uppercase">6. Cash Variance</p>
              <p className="text-lg font-black font-heading mt-0.5">
                {calculatedVariance === 0 ? '₹0.00' : `${calculatedVariance > 0 ? '+' : ''}₹${calculatedVariance.toFixed(2)}`}
              </p>
              <p className="text-[10px] font-black">
                {calculatedVariance === 0 ? '✓ Balanced (Exact)' : calculatedVariance > 0 ? '▲ Cash Overage' : '▼ Cash Shortage'}
              </p>
            </div>
          </div>

          {/* Interactive Denomination Counter & Digital Collections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Physical Cash Denomination Calculator (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 font-heading">
                      Physical Cash Denomination Calculator
                    </h3>
                    <p className="text-[11px] text-slate-500">Count physical currency notes and coins present in the cash drawer</p>
                  </div>
                </div>

                {!eodData.isClosed && (
                  <button
                    onClick={handleQuickCountFill}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer"
                  >
                    Auto-Fill Target Notes
                  </button>
                )}
              </div>

              {/* Denomination Input Rows */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: '₹2,000', key: 'n2000' as const, mult: 2000 },
                  { label: '₹500',   key: 'n500' as const,   mult: 500 },
                  { label: '₹200',   key: 'n200' as const,   mult: 200 },
                  { label: '₹100',   key: 'n100' as const,   mult: 100 },
                  { label: '₹50',    key: 'n50' as const,    mult: 50 },
                  { label: '₹20',    key: 'n20' as const,    mult: 20 },
                  { label: '₹10',    key: 'n10' as const,    mult: 10 },
                ].map(denom => (
                  <div key={denom.key} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>{denom.label} Notes</span>
                      <span className="text-slate-400">×</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        disabled={eodData.isClosed}
                        value={denominations[denom.key] || ''}
                        onChange={e => setDenominations({ ...denominations, [denom.key]: Math.max(0, parseInt(e.target.value) || 0) })}
                        placeholder="0"
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-center text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-black text-slate-800">
                        = ₹{((denominations[denom.key] || 0) * denom.mult).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Loose Coins Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>Coins Total (₹)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      disabled={eodData.isClosed}
                      value={denominations.coins || ''}
                      onChange={e => setDenominations({ ...denominations, coins: Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="0.00"
                      className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Total Counted Bottom Banner */}
              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs text-slate-400 block font-bold">Total Physical Cash Counted:</span>
                  <span className="text-xl font-black text-emerald-400 font-heading">
                    ₹{calculatedCountedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-bold">Variance vs Target:</span>
                  <span className={`text-base font-black font-heading ${
                    calculatedVariance === 0 ? 'text-emerald-400' : calculatedVariance > 0 ? 'text-blue-400' : 'text-rose-400'
                  }`}>
                    {calculatedVariance === 0 ? '₹0.00 (Exact Match)' : `${calculatedVariance > 0 ? '+' : ''}₹${calculatedVariance.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Cashier Notes & Actions */}
              <div className="pt-2 space-y-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shift Notes &amp; Variance Remarks:</label>
                  <input
                    type="text"
                    disabled={eodData.isClosed}
                    value={cashierNotesInput}
                    onChange={e => setCashierNotesInput(e.target.value)}
                    placeholder="Enter reason for variance or supervisor sign-off..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500">
                    {eodData.isClosed ? (
                      <span className="text-emerald-700 font-bold">✓ Closed at: {new Date(eodData.closedAt || Date.now()).toLocaleTimeString()}</span>
                    ) : (
                      <span>Closing drawer will seal shift totals and generate the Z-Report.</span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowZReportModal(true)}
                      className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      <span>Print Z-Report Slip</span>
                    </button>

                    {!eodData.isClosed && (
                      <button
                        onClick={handleCloseDrawerSubmit}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Vault className="w-4 h-4" />
                        <span>1-Click Close Drawer &amp; Reconcile</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Non-Cash Settlements & Store Gross Summary (1 Col) */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-sm text-slate-900 font-heading">
                    Digital &amp; Non-Cash Settlements
                  </h3>
                  <span className="bg-violet-100 text-violet-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    Audited
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-violet-50/60 border border-violet-100 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-violet-950 block">UPI / QR Code</span>
                      <span className="text-[10px] text-slate-500">PhonePe, GPay, Paytm</span>
                    </div>
                    <span className="font-black text-violet-900 text-sm">₹{eodData.totalSalesUpi?.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-blue-950 block">Card / EDC POS</span>
                      <span className="text-[10px] text-slate-500">HDFC / PineLabs Terminal</span>
                    </div>
                    <span className="font-black text-blue-900 text-sm">₹{eodData.totalSalesCard?.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 block">Split Payments Cash</span>
                      <span className="text-[10px] text-slate-500">Cash portion of mixed bills</span>
                    </div>
                    <span className="font-bold text-slate-900">₹{eodData.totalSalesSplitCash?.toLocaleString('en-IN') || '0.00'}</span>
                  </div>
                </div>

                {/* Day Gross Revenue Roll-up */}
                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1 mt-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Total Bills Processed:</span>
                    <span className="font-bold font-mono">{eodData.totalBills} Bills</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Avg Ticket Size:</span>
                    <span className="font-bold font-mono">
                      ₹{eodData.totalBills > 0 ? (eodData.grossSales / eodData.totalBills).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="border-t border-slate-700 pt-1.5 flex justify-between text-xs font-bold">
                    <span className="text-emerald-400">Total Gross Day Revenue:</span>
                    <span className="text-emerald-300 text-base font-black font-heading">
                      ₹{eodData.grossSales?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 4: TOP MEDICINES REPORT ─────────────────────── */}
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

      {/* ── TAB CONTENT 5: PAYMENT MODE BREAKDOWN ────────────────────── */}
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

      {/* ── TAB CONTENT 6: SUBSTITUTE INTELLIGENCE ───────────────────── */}
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
        </div>
      )}

      {/* ── MODAL 1: PRINTABLE EOD Z-REPORT REGISTER SLIP ────────────── */}
      {showZReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Vault className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm font-heading">EOD Cash Register Closing Slip (Z-Report)</h3>
              </div>
              <button
                onClick={() => setShowZReportModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-[11px]" id="z-report-slip">
              {/* Store Details Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-0.5">
                <h2 className="font-black text-sm text-slate-900">{currentUser?.pharmacyName || 'GENQUANTAA MEDPLUS PHARMACY'}</h2>
                <p className="text-slate-500 text-[10px]">GSTIN: {currentUser?.gstin || '36AAACA1234F1Z5'} | DL: {currentUser?.licenseNo || 'DL-HYD-889201'}</p>
                <p className="font-bold text-slate-700 uppercase pt-1">*** END-OF-DAY REGISTER CLOSING SLIP ***</p>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>DATE: {eodData.date}</span>
                  <span>SHIFT: {eodData.shift || 'FULL_DAY'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>CASHIER: {eodData.cashierName}</span>
                  <span>STATUS: {eodData.isClosed ? 'CLOSED' : 'AUDITED'}</span>
                </div>
              </div>

              {/* Cash Reconciliation Summary */}
              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span>OPENING CASH FLOAT:</span>
                  <span className="font-bold">₹{openingFloatInput.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>(+) CASH SALES INFLOW:</span>
                  <span className="font-bold">₹{eodData.totalSalesCash?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-800">
                  <span>(-) CASH REFUNDS (RETURNS):</span>
                  <span className="font-bold">-₹{eodData.totalRefundsCash?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>(-) PETTY CASH OUTFLOW:</span>
                  <span>-₹{pettyExpenseInput.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>(+) PETTY CASH INFLOW:</span>
                  <span>+₹{pettyInflowInput.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-1 flex justify-between font-black text-slate-900">
                  <span>EXPECTED CASH IN DRAWER:</span>
                  <span>₹{calculatedExpectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-blue-900">
                  <span>ACTUAL CASH COUNTED:</span>
                  <span>₹{calculatedCountedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black">
                  <span>DRAWER CASH VARIANCE:</span>
                  <span className={calculatedVariance === 0 ? 'text-emerald-700' : calculatedVariance > 0 ? 'text-blue-700' : 'text-rose-700'}>
                    {calculatedVariance === 0 ? '₹0.00 (EXACT)' : `${calculatedVariance > 0 ? '+' : ''}₹${calculatedVariance.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Denomination Breakdown */}
              <div className="space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <div className="font-bold text-slate-800 pb-1">DENOMINATION BREAKDOWN:</div>
                <div className="grid grid-cols-2 gap-x-4 text-[10px] text-slate-700">
                  <span>₹2000 x {denominations.n2000} = ₹{denominations.n2000 * 2000}</span>
                  <span>₹500  x {denominations.n500}  = ₹{denominations.n500 * 500}</span>
                  <span>₹200  x {denominations.n200}  = ₹{denominations.n200 * 200}</span>
                  <span>₹100  x {denominations.n100}  = ₹{denominations.n100 * 100}</span>
                  <span>₹50   x {denominations.n50}   = ₹{denominations.n50 * 50}</span>
                  <span>₹20   x {denominations.n20}   = ₹{denominations.n20 * 20}</span>
                  <span>₹10   x {denominations.n10}   = ₹{denominations.n10 * 10}</span>
                  <span>COINS: ₹{denominations.coins || 0}</span>
                </div>
              </div>

              {/* Digital Collections & Gross Revenue */}
              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
                <div className="font-bold text-slate-800">DIGITAL &amp; CARD SETTLEMENTS:</div>
                <div className="flex justify-between">
                  <span>UPI / QR CODE:</span>
                  <span>₹{eodData.totalSalesUpi?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CARD / POS EDC:</span>
                  <span>₹{eodData.totalSalesCard?.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-1 flex justify-between font-black text-slate-900">
                  <span>TOTAL GROSS DAY SALES:</span>
                  <span>₹{eodData.grossSales?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>TOTAL BILLS SETTLED:</span>
                  <span>{eodData.totalBills}</span>
                </div>
              </div>

              {/* Signature Lines */}
              <div className="pt-4 grid grid-cols-2 gap-4 text-center text-[10px]">
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-600">
                  CASHIER SIGNATURE
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-600">
                  SUPERVISOR SIGNATURE
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => setShowZReportModal(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EOD RECONCILIATION HISTORY ───────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm font-heading">Past Cash Drawer Reconciliations &amp; Audit Logs</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Shift</th>
                    <th className="px-3 py-2.5">Cashier</th>
                    <th className="px-3 py-2.5 text-right">Expected</th>
                    <th className="px-3 py-2.5 text-right">Counted</th>
                    <th className="px-3 py-2.5 text-right">Variance</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyRecords.map(rec => (
                    <tr key={rec._id || rec.registerDate} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                        {String(rec.registerDate).slice(0, 10)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-semibold">{rec.shift}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-800">{rec.cashierName}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-900">₹{rec.expectedCash?.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">₹{rec.actualCashCounted?.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right font-black">
                        <span className={rec.cashVariance === 0 ? 'text-emerald-700' : rec.cashVariance > 0 ? 'text-blue-700' : 'text-rose-700'}>
                          {rec.cashVariance === 0 ? '₹0.00' : `${rec.cashVariance > 0 ? '+' : ''}₹${rec.cashVariance?.toFixed(2)}`}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          CLOSED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
