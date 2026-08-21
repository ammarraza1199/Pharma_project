import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  setPaymentModalOpen,
  startSubmittingBill,
  finalizeBillSuccess
} from '../store/posSlice';
import type { PaymentDetails, PaymentMethodType } from '../types/pos';
import {
  QrCode,
  CreditCard,
  Banknote,
  Split,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  Repeat,
  ShieldCheck,
  Smartphone,
  Check,
  Sparkles
} from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.paymentModal);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const isSubmittingBill = useSelector((state: RootState) => state.pos.isSubmittingBill);

  const currentSession = useSelector((state: RootState) => state.pos.sessions.find(s => s.id === activeSessionId));
  const items = currentSession?.items || [];
  const grandTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('UPI');
  
  // Split payment inputs
  const [cashInput, setCashInput] = useState<number>(0);
  const [upiInput, setUpiInput] = useState<number>(grandTotal);
  const [creditCardInput, setCreditCardInput] = useState<number>(0);
  const [debitCardInput, setDebitCardInput] = useState<number>(0);
  const [autoPayInput, setAutoPayInput] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(grandTotal);

  // Credit Card state
  const [creditNetwork, setCreditNetwork] = useState<'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX'>('VISA');
  const [creditLast4, setCreditLast4] = useState<string>('4242');
  const [creditAuthCode, setCreditAuthCode] = useState<string>('AUTH-789124');

  // Debit Card state
  const [debitNetwork, setDebitNetwork] = useState<'RUPAY' | 'VISA' | 'MASTERCARD'>('RUPAY');
  const [debitLast4, setDebitLast4] = useState<string>('5588');
  const [isPinEntered, setIsPinEntered] = useState<boolean>(true);
  const [debitAuthCode, setDebitAuthCode] = useState<string>('DBT-443910');

  // Auto Pay state
  const [autoPayAuthMode, setAutoPayAuthMode] = useState<'UPI_AUTOPAY' | 'E_NACH' | 'STANDING_INSTRUCTION'>('UPI_AUTOPAY');
  const [autoPayFrequency, setAutoPayFrequency] = useState<'MONTHLY_REFILL' | 'BI_WEEKLY' | 'ON_DEMAND'>('MONTHLY_REFILL');
  const [autoPayMandateId, setAutoPayMandateId] = useState<string>('MN-2026-884920');
  const [autoPayVpa, setAutoPayVpa] = useState<string>(currentSession?.patientDetails?.phone ? `${currentSession.patientDetails.phone}@upi` : 'customer@okhdfcbank');
  const [isAutoPayAuthorized, setIsAutoPayAuthorized] = useState<boolean>(true);

  // Razorpay UPI QR Simulation State
  const [upiPollTimer, setUpiPollTimer] = useState<number>(45);
  const [isUpiVerified, setIsUpiVerified] = useState<boolean>(false);

  useEffect(() => {
    if (paymentMethod === 'UPI' && modal.isOpen) {
      setUpiPollTimer(45);
      setIsUpiVerified(false);
      const timer = setInterval(() => {
        setUpiPollTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsUpiVerified(true); // Auto-verify UPI simulation
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentMethod, modal.isOpen]);

  useEffect(() => {
    if (modal.isOpen) {
      // Auto-generate fresh random auth/mandate codes
      setCreditAuthCode(`AUTH-${Math.floor(100000 + Math.random() * 900000)}`);
      setDebitAuthCode(`DBT-${Math.floor(100000 + Math.random() * 900000)}`);
      setAutoPayMandateId(`MN-2026-${Math.floor(100000 + Math.random() * 900000)}`);
      if (currentSession?.patientDetails?.phone) {
        setAutoPayVpa(`${currentSession.patientDetails.phone}@upi`);
      }
    }
  }, [modal.isOpen, currentSession?.patientDetails?.phone]);

  useEffect(() => {
    if (paymentMethod === 'UPI') {
      setUpiInput(grandTotal);
      setCashInput(0);
      setCreditCardInput(0);
      setDebitCardInput(0);
      setAutoPayInput(0);
    } else if (paymentMethod === 'CASH') {
      setCashInput(grandTotal);
      setUpiInput(0);
      setCreditCardInput(0);
      setDebitCardInput(0);
      setAutoPayInput(0);
    } else if (paymentMethod === 'CREDIT_CARD') {
      setCreditCardInput(grandTotal);
      setCashInput(0);
      setUpiInput(0);
      setDebitCardInput(0);
      setAutoPayInput(0);
    } else if (paymentMethod === 'DEBIT_CARD') {
      setDebitCardInput(grandTotal);
      setCashInput(0);
      setUpiInput(0);
      setCreditCardInput(0);
      setAutoPayInput(0);
    } else if (paymentMethod === 'AUTO_PAY') {
      setAutoPayInput(grandTotal);
      setCashInput(0);
      setUpiInput(0);
      setCreditCardInput(0);
      setDebitCardInput(0);
    }
  }, [paymentMethod, grandTotal]);

  if (!modal.isOpen) return null;

  const totalSplitSum = Number((cashInput + upiInput + creditCardInput + debitCardInput + autoPayInput).toFixed(2));
  const isSplitValid = Math.abs(totalSplitSum - grandTotal) < 0.01;
  const changeDue = Math.max(0, cashTendered - (paymentMethod === 'CASH' ? grandTotal : cashInput));

  const handleFinalizeBill = () => {
    if (paymentMethod === 'SPLIT' && !isSplitValid) {
      alert(`SPLIT PAYMENT MISMATCH: Sum of split amounts (₹${totalSplitSum}) must equal Grand Total (₹${grandTotal})!`);
      return;
    }

    // P0 Data Integrity: Immediately disable submit button and show spinner
    dispatch(startSubmittingBill());

    setTimeout(() => {
      let cardAmount = 0;
      let cardLast4: string | undefined = undefined;
      let cardNetwork: string | undefined = undefined;
      let cardType: 'CREDIT' | 'DEBIT' | undefined = undefined;
      let autoPayDetails = undefined;

      if (paymentMethod === 'CREDIT_CARD') {
        cardAmount = grandTotal;
        cardLast4 = creditLast4;
        cardNetwork = creditNetwork;
        cardType = 'CREDIT';
      } else if (paymentMethod === 'DEBIT_CARD') {
        cardAmount = grandTotal;
        cardLast4 = debitLast4;
        cardNetwork = debitNetwork;
        cardType = 'DEBIT';
      } else if (paymentMethod === 'AUTO_PAY') {
        autoPayDetails = {
          mandateId: autoPayMandateId,
          authMode: autoPayAuthMode,
          frequency: autoPayFrequency,
          customerVpaOrAcc: autoPayVpa
        };
      } else if (paymentMethod === 'SPLIT') {
        cardAmount = creditCardInput + debitCardInput;
        if (creditCardInput > 0) {
          cardType = 'CREDIT';
          cardNetwork = creditNetwork;
        } else if (debitCardInput > 0) {
          cardType = 'DEBIT';
          cardNetwork = debitNetwork;
        }
      }

      const payment: PaymentDetails = {
        method: paymentMethod,
        cashAmount: cashInput,
        upiAmount: upiInput,
        cardAmount,
        creditCardAmount: creditCardInput,
        debitCardAmount: debitCardInput,
        autoPayAmount: autoPayInput,
        totalPaid: grandTotal,
        changeDue,
        cardLast4,
        cardNetwork,
        cardType,
        autoPayDetails,
        paymentStatus: 'SUCCESS'
      };

      dispatch(finalizeBillSuccess(payment));
    }, 1000); // Simulated latency
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-modal rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden max-h-[95vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 flex-shrink-0">
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Multi-Mode Payment Terminal
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 font-heading mt-1">
              Select Billing Payment Method
            </h3>
          </div>
          <button
            onClick={() => dispatch(setPaymentModalOpen(false))}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* Grand Total Display Card */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-md">
            <div>
              <p className="text-xs text-emerald-100 font-medium">Payable Amount (GST &amp; Discounts Applied)</p>
              <h2 className="text-3xl font-black font-heading tracking-tight">₹{grandTotal.toFixed(2)}</h2>
            </div>
            <div className="text-right space-y-1">
              <div className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-xs font-bold inline-block">
                {items.length} Cart Items
              </div>
              <div className="text-[10px] text-emerald-200">
                Patient: <span className="font-bold text-white">{currentSession?.patientDetails?.patientName || 'Walk-in Customer'}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {/* Dynamic UPI */}
            <button
              onClick={() => setPaymentMethod('UPI')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                paymentMethod === 'UPI'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <QrCode className={`w-5 h-5 mb-1 ${paymentMethod === 'UPI' ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span className="text-[11px] leading-tight text-center">Dynamic UPI QR</span>
            </button>

            {/* Cash */}
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                paymentMethod === 'CASH'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Banknote className={`w-5 h-5 mb-1 ${paymentMethod === 'CASH' ? 'text-amber-600' : 'text-slate-500'}`} />
              <span className="text-[11px] leading-tight text-center">Cash</span>
            </button>

            {/* Credit Card */}
            <button
              onClick={() => setPaymentMethod('CREDIT_CARD')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                paymentMethod === 'CREDIT_CARD'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className={`w-5 h-5 mb-1 ${paymentMethod === 'CREDIT_CARD' ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className="text-[11px] leading-tight text-center">Credit Card</span>
            </button>

            {/* Debit Card */}
            <button
              onClick={() => setPaymentMethod('DEBIT_CARD')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                paymentMethod === 'DEBIT_CARD'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 mb-1 ${paymentMethod === 'DEBIT_CARD' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span className="text-[11px] leading-tight text-center">Debit Card</span>
            </button>

            {/* Auto Pay */}
            <button
              onClick={() => setPaymentMethod('AUTO_PAY')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                paymentMethod === 'AUTO_PAY'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Repeat className={`w-5 h-5 mb-1 ${paymentMethod === 'AUTO_PAY' ? 'text-teal-600' : 'text-slate-500'}`} />
              <span className="text-[11px] leading-tight text-center">Auto Pay Refill</span>
            </button>

            {/* Split */}
            <button
              onClick={() => setPaymentMethod('SPLIT')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                paymentMethod === 'SPLIT'
                  ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-200 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Split className={`w-5 h-5 mb-1 ${paymentMethod === 'SPLIT' ? 'text-purple-600' : 'text-slate-500'}`} />
              <span className="text-[11px] leading-tight text-center">Split Bill</span>
            </button>
          </div>

          {/* ────────────────── DYNAMIC UPI TAB ────────────────── */}
          {paymentMethod === 'UPI' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-3">
              <div className="inline-block bg-white p-3 rounded-2xl border border-slate-300 shadow-md relative">
                <svg className="w-32 h-32 mx-auto text-slate-900" viewBox="0 0 100 100">
                  <path fill="currentColor" d="M0 0h30v30H0zM40 0h20v10H40zM70 0h30v30H70zM10 10h10v10H10zM80 10h10v10H80zM0 40h10v20H0zM20 40h20v10H20zM50 40h20v20H50zM80 40h20v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 70h20v30H40zM70 70h20v10H70zM90 80h10v20H90z"/>
                </svg>

                {isUpiVerified && (
                  <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white p-2">
                    <CheckCircle2 className="w-9 h-9 text-emerald-400 mb-1 animate-bounce" />
                    <span className="text-xs font-bold">UPI Payment Received!</span>
                    <span className="text-[10px] text-emerald-200">GPay / PhonePe Verified</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-700">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>
                  {isUpiVerified
                    ? 'Instant UPI WebSocket Payment Verified ✅'
                    : `Waiting for customer scan... Auto-verifying in ${upiPollTimer}s`}
                </span>
              </div>

              <div className="flex items-center justify-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsUpiVerified(true)}
                  className="text-xs px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  ⚡ Simulate Instant UPI Scan (PhonePe / GPay / Paytm)
                </button>
              </div>
            </div>
          )}

          {/* ────────────────── CASH TAB ────────────────── */}
          {paymentMethod === 'CASH' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cash Tendered by Customer (₹)</label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm font-bold p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Change to Return (₹)</label>
                  <div className="w-full text-lg font-extrabold p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-heading flex items-center justify-between">
                    <span>₹{changeDue.toFixed(2)}</span>
                    <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md font-sans">
                      Cash Drawer Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quick Cash Presets</p>
                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotal)}
                    className="px-3 py-1 text-xs font-bold bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-lg text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    Exact (₹{grandTotal.toFixed(2)})
                  </button>
                  {[100, 200, 500, 2000].map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setCashTendered(note)}
                      className="px-3 py-1 text-xs font-bold bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-lg text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
                    >
                      ₹{note}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── CREDIT CARD TAB ────────────────── */}
          {paymentMethod === 'CREDIT_CARD' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 font-heading">
                      Credit Card POS Terminal (PineLabs / Paytm EDC)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tap contactless NFC, Dip Chip, or Swipe Credit Card
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>Terminal Online</span>
                </span>
              </div>

              {/* Card Network Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Card Network</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['VISA', 'MASTERCARD', 'RUPAY', 'AMEX'] as const).map(net => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setCreditNetwork(net)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                        creditNetwork === net
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Last 4 & Authorization Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Card Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={creditLast4}
                    onChange={(e) => setCreditLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4242"
                    className="w-full text-xs font-mono font-bold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Approval / Auth Code</label>
                  <input
                    type="text"
                    value={creditAuthCode}
                    onChange={(e) => setCreditAuthCode(e.target.value)}
                    className="w-full text-xs font-mono font-bold p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Card Reward Points &amp; Health Cashback eligible</span>
                </span>
                <span className="font-bold text-blue-700">0% Pharmacy Surcharge</span>
              </div>
            </div>
          )}

          {/* ────────────────── DEBIT CARD TAB ────────────────── */}
          {paymentMethod === 'DEBIT_CARD' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 font-heading">
                      Debit Card / ATM PIN Authentication
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      RuPay / Visa / Mastercard PIN-Verified Card Reader
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>PIN Pad Ready</span>
                </span>
              </div>

              {/* Debit Network Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Debit Card Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['RUPAY', 'VISA', 'MASTERCARD'] as const).map(net => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setDebitNetwork(net)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                        debitNetwork === net
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {net === 'RUPAY' ? 'RuPay Debit (0% MDR)' : `${net} Debit`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Last 4 & PIN Verification Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Card Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={debitLast4}
                    onChange={(e) => setDebitLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 5588"
                    className="w-full text-xs font-mono font-bold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">EDC Auth Ref #</label>
                  <input
                    type="text"
                    value={debitAuthCode}
                    onChange={(e) => setDebitAuthCode(e.target.value)}
                    className="w-full text-xs font-mono font-bold p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>4-Digit Bank ATM PIN Verified by Customer</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPinEntered(!isPinEntered)}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md cursor-pointer ${
                    isPinEntered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isPinEntered ? '✔ PIN Verified' : 'Prompt PIN Pad'}
                </button>
              </div>
            </div>
          )}

          {/* ────────────────── AUTO PAY / REFILL MANDATE TAB ────────────────── */}
          {paymentMethod === 'AUTO_PAY' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-teal-200 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="bg-teal-600 text-white p-2.5 rounded-xl shadow-xs">
                    <Repeat className="w-5 h-5 animate-spin text-white" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 font-heading">
                      AutoPay &amp; Chronic Medicine Refill Mandate
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Automatic recurring billing for Monthly Prescriptions (BP, Sugar, Thyroid)
                    </p>
                  </div>
                </div>
                <span className="bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  NPCI / RBI Compliant
                </span>
              </div>

              {/* Mandate Frequency */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Refill Cycle Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'MONTHLY_REFILL', label: 'Monthly Refill (30 Days)' },
                    { id: 'BI_WEEKLY', label: 'Bi-Weekly (15 Days)' },
                    { id: 'ON_DEMAND', label: 'On-Demand Refill' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAutoPayFrequency(f.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                        autoPayFrequency === f.id
                          ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mandate Mode & Customer VPA / Bank */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Authorization Mode</label>
                  <select
                    value={autoPayAuthMode}
                    onChange={(e) => setAutoPayAuthMode(e.target.value as any)}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="UPI_AUTOPAY">UPI AutoPay (GooglePay / PhonePe)</option>
                    <option value="E_NACH">e-NACH NetBanking Mandate</option>
                    <option value="STANDING_INSTRUCTION">Card Standing Instruction (SI)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer UPI ID / Account</label>
                  <input
                    type="text"
                    value={autoPayVpa}
                    onChange={(e) => setAutoPayVpa(e.target.value)}
                    placeholder="customer@upi"
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Mandate Authorization Status */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-teal-900">Mandate ID: </span>
                  <span className="font-mono text-teal-800 font-bold">{autoPayMandateId}</span>
                </div>
                <div className="flex items-center space-x-1 text-teal-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Mandate Pre-Authorized</span>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── SPLIT BILL TAB ────────────────── */}
          {paymentMethod === 'SPLIT' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <p className="text-xs text-slate-600 font-semibold">
                Split total amount across multiple payment channels:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Cash (₹)</label>
                  <input
                    type="number"
                    value={cashInput}
                    onChange={(e) => setCashInput(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">UPI (₹)</label>
                  <input
                    type="number"
                    value={upiInput}
                    onChange={(e) => setUpiInput(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Credit Card (₹)</label>
                  <input
                    type="number"
                    value={creditCardInput}
                    onChange={(e) => setCreditCardInput(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Debit Card (₹)</label>
                  <input
                    type="number"
                    value={debitCardInput}
                    onChange={(e) => setDebitCardInput(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">AutoPay / Refill (₹)</label>
                  <input
                    type="number"
                    value={autoPayInput}
                    onChange={(e) => setAutoPayInput(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                <span>Split Sum: <strong className={isSplitValid ? 'text-emerald-700 text-sm' : 'text-rose-600 text-sm'}>₹{totalSplitSum.toFixed(2)}</strong> / ₹{grandTotal.toFixed(2)}</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${isSplitValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
                  {isSplitValid ? '✅ Balanced Exact Amount' : `❌ Difference: ₹${(grandTotal - totalSplitSum).toFixed(2)}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 mt-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => dispatch(setPaymentModalOpen(false))}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleFinalizeBill}
            disabled={isSubmittingBill || (paymentMethod === 'SPLIT' && !isSplitValid)}
            className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer ${
              isSubmittingBill || (paymentMethod === 'SPLIT' && !isSplitValid)
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
            }`}
          >
            {isSubmittingBill ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm {paymentMethod.replace('_', ' ')} &amp; Generate Invoice</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
