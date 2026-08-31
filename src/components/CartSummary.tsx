import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setPaymentModalOpen, openScheduleHDetailsPrompt, addItemToCart } from '../store/posSlice';
import { getMedicineDetails } from '../utils/medicineDetails';
import { CreditCard, ShieldAlert, Loader2, ArrowRight, Sparkles, Tag, ShieldCheck, Stethoscope, TestTube, CheckCircle2, Plus } from 'lucide-react';

export const CartSummary: React.FC = () => {
  const dispatch = useDispatch();
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const products = useSelector((state: RootState) => state.pos.products);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const isSubmittingBill = useSelector((state: RootState) => state.pos.isSubmittingBill);

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const items = currentSession ? currentSession.items : [];
  const doctorDetails = currentSession?.doctorDetails;

  // Pharmacist Recommendations State (Requirement #27)
  const [insuranceTagged, setInsuranceTagged] = useState<boolean>(false);
  const [doctorReferred, setDoctorReferred] = useState<boolean>(false);
  const [labTestsAdded, setLabTestsAdded] = useState<string[]>([]);

  // Financial calculations
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalDiscount = items.reduce((sum, item) => sum + ((item.unitPrice * item.quantity * item.discountPercent) / 100), 0);
  const totalCGST = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSGST = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  // Substitute savings calculation
  const substituteItems = items.filter(item => item.isSubstitute && item.discountPercent > 0);
  const totalSubstituteSavings = substituteItems.reduce((sum, item) => {
    return sum + ((item.unitPrice * item.quantity * item.discountPercent) / 100);
  }, 0);
  const hasSubstituteSavings = totalSubstituteSavings > 0;
  
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

  const handleAddLabTestPack = (testName: string, price: number) => {
    if (labTestsAdded.includes(testName)) return;
    const dummyProduct = products[0] || { _id: 'lab-001', name: testName, sellingPrice: price, batches: [{ batchNumber: 'LAB-PACK', expiryDate: '2027-12-31', stockQuantity: 999, location: 'LAB', mrp: price }] };
    dispatch(addItemToCart({
      product: {
        ...dummyProduct,
        _id: `lab-${Date.now()}`,
        name: `🧪 Diagnostic Lab Test: ${testName}`,
        sellingPrice: price,
        unitMRP: price,
        gstRate: 0
      },
      selectedBatch: dummyProduct.batches[0],
      quantity: 1,
      unitMode: 'PACK'
    }));
    setLabTestsAdded(prev => [...prev, testName]);
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

        {/* 🎉 Substitute Savings Banner */}
        {hasSubstituteSavings && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl p-3 mb-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Substitute Savings</div>
                  <div className="text-sm font-black leading-tight">
                    🎉 You saved <span className="text-amber-300">₹{totalSubstituteSavings.toFixed(2)}</span>!
                  </div>
                </div>
              </div>
              <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                {substituteItems.length} Substitute{substituteItems.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="mt-1.5 space-y-0.5">
              {substituteItems.map(item => {
                const itemSaving = (item.unitPrice * item.quantity * item.discountPercent) / 100;
                return (
                  <div key={item.cartItemId} className="flex items-center justify-between text-[10px] text-emerald-100">
                    <span className="flex items-center space-x-1">
                      <Tag className="w-2.5 h-2.5 text-amber-300" />
                      <span>{item.product.name.split(' ').slice(0, 3).join(' ')}</span>
                      <span className="text-emerald-300">({item.discountPercent}% OFF)</span>
                    </span>
                    <span className="font-bold text-amber-200">-₹{itemSaving.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
            <span className="flex items-center space-x-1">
              {hasSubstituteSavings && <Tag className="w-3 h-3 text-emerald-600" />}
              <span>{hasSubstituteSavings ? 'Discount (incl. Substitute)' : 'Special Discount'}</span>
            </span>
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

        {/* ── PHARMACIST RECOMMENDATIONS & VALUE SERVICES (Requirement #27) ── */}
        <div className="mt-3 bg-gradient-to-br from-slate-50 to-teal-50/50 p-3 rounded-xl border border-teal-200/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-800">
            <span className="flex items-center space-x-1 text-teal-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Pharmacist Recommendations</span>
            </span>
            <span className="text-[9.5px] font-bold text-teal-600 bg-teal-100 px-1.5 py-0.2 rounded-full">
              Value Services
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[10.5px]">
            {/* 1. Insurance */}
            <button
              type="button"
              onClick={() => setInsuranceTagged(prev => !prev)}
              className={`p-2 rounded-lg border text-left font-bold transition-all cursor-pointer flex flex-col justify-between ${
                insuranceTagged
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <ShieldCheck className={`w-3.5 h-3.5 ${insuranceTagged ? 'text-white' : 'text-emerald-600'}`} />
                {insuranceTagged && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className="mt-1 text-[10px] leading-tight">
                {insuranceTagged ? '🛡️ Claim Tagged' : '🛡️ Health Insurance'}
              </span>
            </button>

            {/* 2. Doctor */}
            <button
              type="button"
              onClick={() => setDoctorReferred(prev => !prev)}
              className={`p-2 rounded-lg border text-left font-bold transition-all cursor-pointer flex flex-col justify-between ${
                doctorReferred
                  ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <Stethoscope className={`w-3.5 h-3.5 ${doctorReferred ? 'text-white' : 'text-teal-600'}`} />
                {doctorReferred && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className="mt-1 text-[10px] leading-tight">
                {doctorReferred ? '🩺 Doctor Referred' : '🩺 Doctor Consult'}
              </span>
            </button>

            {/* 3. Lab Test */}
            <button
              type="button"
              onClick={() => handleAddLabTestPack('HbA1c Sugar Test', 299)}
              className={`p-2 rounded-lg border text-left font-bold transition-all cursor-pointer flex flex-col justify-between ${
                labTestsAdded.length > 0
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <TestTube className={`w-3.5 h-3.5 ${labTestsAdded.length > 0 ? 'text-white' : 'text-purple-600'}`} />
                {labTestsAdded.length > 0 ? <CheckCircle2 className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-purple-600" />}
              </div>
              <span className="mt-1 text-[10px] leading-tight">
                {labTestsAdded.length > 0 ? '🧪 Lab Added' : '🧪 Add Lab Test'}
              </span>
            </button>
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

        {/* Checkout Button & Delegate Option */}
        <div className="space-y-2">
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
                <span>Finalize &amp; Collect Payment (₹{grandTotal.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
