import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setPaymentModalOpen, openScheduleHDetailsPrompt } from '../store/posSlice';
import { getMedicineDetails } from '../utils/medicineDetails';
import { CreditCard, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';

export const CartSummary: React.FC = () => {
  const dispatch = useDispatch();
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const isSubmittingBill = useSelector((state: RootState) => state.pos.isSubmittingBill);

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const items = currentSession ? currentSession.items : [];
  const doctorDetails = currentSession?.doctorDetails;

  // Financial calculations
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalDiscount = items.reduce((sum, item) => sum + ((item.unitPrice * item.quantity * item.discountPercent) / 100), 0);
  const totalCGST = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSGST = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  
  const totalPacksCount = items
    .filter(item => (item.unitMode || 'PACK') === 'PACK')
    .reduce((sum, item) => sum + item.quantity, 0);
  const totalLooseUnits = items
    .filter(item => (item.unitMode || 'PACK') === 'LOOSE')
    .reduce((sum, item) => sum + item.quantity, 0);
  const totalTabletsCount = items.reduce((sum, item) => {
    const details = getMedicineDetails(item.product);
    const isLoose = (item.unitMode || 'PACK') === 'LOOSE';
    return sum + (isLoose ? item.quantity : item.quantity * details.unitsPerPack);
  }, 0);

  // Check if any Schedule H / H1 items are in cart without Doctor info
  const hasScheduleHItems = items.some(i => i.product.scheduleCategory === 'SCHEDULE_H' || i.product.scheduleCategory === 'SCHEDULE_H1');
  const isScheduleHMissingDoctor = hasScheduleHItems && (!doctorDetails?.doctorName || doctorDetails.doctorName.trim() === '');

  const handleCheckoutClick = () => {
    if (items.length === 0) return;

    if (isScheduleHMissingDoctor) {
      alert('COMPLIANCE REQUIREMENT: Schedule H medicines present in cart. Please enter Doctor & Patient details.');
      dispatch(openScheduleHDetailsPrompt());
      return;
    }

    dispatch(setPaymentModalOpen(true));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between h-full">
      {/* Financial Summary Breakdown */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100 font-heading flex items-center justify-between">
          <span>Billing Summary</span>
          <span className="text-emerald-800 font-extrabold text-[11px] font-mono">
            {totalPacksCount > 0 && `${totalPacksCount} Packs`}
            {totalPacksCount > 0 && totalLooseUnits > 0 && ' + '}
            {totalLooseUnits > 0 && `${totalLooseUnits} Loose Tabs`}
            {` (${totalTabletsCount} Units)`}
          </span>
        </h2>

        <div className="space-y-2 text-xs font-medium text-slate-600">
          <div className="flex justify-between text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11.5px]">
            <span>Selected Quantity</span>
            <span className="font-extrabold text-slate-900 font-mono">
              {totalPacksCount > 0 && `${totalPacksCount} Packs `}
              {totalLooseUnits > 0 && `${totalLooseUnits} Loose Tabs `}
              ({totalTabletsCount} Tablets/Units)
            </span>
          </div>

          <div className="flex justify-between">
            <span>Items Gross Total</span>
            <span className="font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-emerald-700">
            <span>Special Discount</span>
            <span className="font-bold">-₹{totalDiscount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-500 text-[11px]">
            <span>CGST Amount</span>
            <span>+₹{totalCGST.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-slate-500 text-[11px]">
            <span>SGST Amount</span>
            <span>+₹{totalSGST.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-extrabold text-slate-900 font-heading">Net Payable</span>
            <span className="text-xl font-black text-emerald-700 font-heading">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Compliance Indicator & Finalize Checkout Trigger */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
        {isScheduleHMissingDoctor && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-2 flex items-center space-x-2 text-[11px] text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Doctor Name required for Schedule H cart items!</span>
          </div>
        )}

        <button
          onClick={handleCheckoutClick}
          disabled={items.length === 0 || isSubmittingBill}
          className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
            items.length === 0 || isSubmittingBill
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white'
          }`}
        >
          {isSubmittingBill ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Processing Transaction...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Finalize & Collect Payment (₹{grandTotal.toFixed(2)})</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
