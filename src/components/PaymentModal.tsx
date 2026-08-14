import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  setPaymentModalOpen,
  startSubmittingBill,
  finalizeBillSuccess
} from '../store/posSlice';
import type { PaymentDetails } from '../types/pos';
import { QrCode, CreditCard, Banknote, Split, CheckCircle2, Loader2, RefreshCw, X } from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.paymentModal);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const isSubmittingBill = useSelector((state: RootState) => state.pos.isSubmittingBill);

  const currentSession = useSelector((state: RootState) => state.pos.sessions.find(s => s.id === activeSessionId));
  const items = currentSession?.items || [];
  const grandTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('UPI');
  
  // Split payment inputs
  const [cashInput, setCashInput] = useState<number>(0);
  const [upiInput, setUpiInput] = useState<number>(grandTotal);
  const [cardInput, setCardInput] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(grandTotal);

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
    if (paymentMethod === 'UPI') {
      setUpiInput(grandTotal);
      setCashInput(0);
      setCardInput(0);
    } else if (paymentMethod === 'CASH') {
      setCashInput(grandTotal);
      setUpiInput(0);
      setCardInput(0);
    } else if (paymentMethod === 'CARD') {
      setCardInput(grandTotal);
      setCashInput(0);
      setUpiInput(0);
    }
  }, [paymentMethod, grandTotal]);

  if (!modal.isOpen) return null;

  const totalSplitSum = Number((cashInput + upiInput + cardInput).toFixed(2));
  const isSplitValid = Math.abs(totalSplitSum - grandTotal) < 0.01;
  const changeDue = Math.max(0, cashTendered - (paymentMethod === 'CASH' ? grandTotal : cashInput));

  const handleFinalizeBill = () => {
    if (!isSplitValid) {
      alert(`SPLIT PAYMENT MISMATCH: Sum of split amounts (₹${totalSplitSum}) must equal Grand Total (₹${grandTotal})!`);
      return;
    }

    // P0 Data Integrity: Immediately disable submit button and show spinner
    dispatch(startSubmittingBill());

    setTimeout(() => {
      const payment: PaymentDetails = {
        method: paymentMethod,
        cashAmount: cashInput,
        upiAmount: upiInput,
        cardAmount: cardInput,
        totalPaid: grandTotal,
        changeDue,
        paymentStatus: 'SUCCESS'
      };

      dispatch(finalizeBillSuccess(payment));
    }, 1200); // Simulated backend latency < 2s
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-modal rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Razorpay Gateway Integration</span>
            <h3 className="text-base font-extrabold text-slate-900 font-heading">
              Select Payment Method
            </h3>
          </div>
          <button
            onClick={() => dispatch(setPaymentModalOpen(false))}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grand Total Display Card */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl p-4 mb-4 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-emerald-100 font-medium">Grand Total (Inclusive of HSN GST)</p>
            <h2 className="text-2xl font-black font-heading tracking-tight">₹{grandTotal.toFixed(2)}</h2>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-xs font-semibold">
            {items.length} Cart Items
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setPaymentMethod('UPI')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              paymentMethod === 'UPI'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-5 h-5 mb-1 text-emerald-600" />
            <span>Dynamic UPI QR</span>
          </button>

          <button
            onClick={() => setPaymentMethod('CASH')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              paymentMethod === 'CASH'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
            <span>Cash Payment</span>
          </button>

          <button
            onClick={() => setPaymentMethod('CARD')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              paymentMethod === 'CARD'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-1 text-emerald-600" />
            <span>Card / POS Terminal</span>
          </button>

          <button
            onClick={() => setPaymentMethod('SPLIT')}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              paymentMethod === 'SPLIT'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Split className="w-5 h-5 mb-1 text-emerald-600" />
            <span>Split Payment</span>
          </button>
        </div>

        {/* Payment Specific Content */}
        {paymentMethod === 'UPI' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-3">
            <div className="inline-block bg-white p-3 rounded-2xl border border-slate-300 shadow-md relative">
              {/* Generated QR Code Simulation SVG */}
              <svg className="w-36 h-36 mx-auto text-slate-900" viewBox="0 0 100 100">
                <path fill="currentColor" d="M0 0h30v30H0zM40 0h20v10H40zM70 0h30v30H70zM10 10h10v10H10zM80 10h10v10H80zM0 40h10v20H0zM20 40h20v10H20zM50 40h20v20H50zM80 40h20v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 70h20v30H40zM70 70h20v10H70zM90 80h10v20H90z"/>
              </svg>

              {isUpiVerified && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-1 animate-bounce" />
                  <span className="text-xs font-bold">UPI Payment Received!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>
                {isUpiVerified
                  ? 'WebSocket Payment Confirmation Verified ✅'
                  : `Polling Razorpay WebSocket... Auto-verifying in ${upiPollTimer}s`}
              </span>
            </div>

            <button
              onClick={() => setIsUpiVerified(true)}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              [Simulate Instant Customer PhonePe / GooglePay Scan]
            </button>
          </div>
        )}

        {paymentMethod === 'CASH' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cash Tendered (₹)</label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-bold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Change to Return (₹)</label>
                <div className="w-full text-base font-extrabold p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-heading">
                  ₹{changeDue.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Quick Cash Presets */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quick Cash Presets</p>
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <button
                  type="button"
                  onClick={() => setCashTendered(grandTotal)}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-lg text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  Exact (₹{grandTotal.toFixed(2)})
                </button>
                {[100, 200, 500, 2000].map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setCashTendered(note)}
                    className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 rounded-lg text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    ₹{note}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'CARD' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center space-y-2">
            <div className="inline-block bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <CreditCard className="w-10 h-10 text-emerald-600 mx-auto mb-1 animate-pulse" />
              <p className="text-xs font-bold text-slate-800">Pinelabs / Paytm EDC Terminal Connected</p>
              <p className="text-[11px] text-slate-500">Swipe, Dip, or Tap Visa/Mastercard/Rupay card</p>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold">
              ✔ EDC POS Hardware Ready · Press "Confirm Payment" to complete transaction
            </p>
          </div>
        )}

        {paymentMethod === 'SPLIT' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Cash (₹)</label>
                <input
                  type="number"
                  value={cashInput}
                  onChange={(e) => setCashInput(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">UPI (₹)</label>
                <input
                  type="number"
                  value={upiInput}
                  onChange={(e) => setUpiInput(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Card (₹)</label>
                <input
                  type="number"
                  value={cardInput}
                  onChange={(e) => setCardInput(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-bold p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
              <span>Split Sum: <strong className={isSplitValid ? 'text-emerald-700' : 'text-rose-600'}>₹{totalSplitSum.toFixed(2)}</strong></span>
              <span className="font-semibold">{isSplitValid ? '✅ Balanced' : '❌ Must match total ₹' + grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 mt-4">
          <button
            type="button"
            onClick={() => dispatch(setPaymentModalOpen(false))}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>

          <button
            onClick={handleFinalizeBill}
            disabled={isSubmittingBill || !isSplitValid}
            className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer ${
              isSubmittingBill || !isSplitValid
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
            }`}
          >
            {isSubmittingBill ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirming Bill...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Payment & Print Receipt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
