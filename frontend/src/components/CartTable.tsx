import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  updateCartItemQuantity,
  updateCartItemUnitMode,
  updateCartItemDiscount,
  removeFromCart,
  clearActiveCart,
  applyBulkDiscount,
  openScheduleHDetailsPrompt,
  setVoiceConsultationModalOpen,
  setPatientInstructionModalOpen,
  openSubstitutionModalForProduct,
  setClearanceGiftModalOpen,
  applyNearExpiryClearanceDiscount,
  addClearanceGiftToCart,
  applySentimentDiscount
} from '../store/posSlice';
import { analyzeDrugInteractions } from '../utils/drugInteractionEngine';
import { getMedicineDetails } from '../utils/medicineDetails';
import {
  Trash2, Plus, Minus, AlertTriangle, AlertOctagon, UserCheck,
  Stethoscope, Edit2, Percent, FileText, RefreshCcw, Pill, Mic, Volume2, Zap,
  PackageOpen, BadgeAlert, Tag, Gift, Sparkles, CheckCircle2, X
} from 'lucide-react';

export const CartTable: React.FC = () => {
  const dispatch = useDispatch();
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const items = currentSession ? currentSession.items : [];
  const doctorDetails = currentSession?.doctorDetails;
  const patientDetails = currentSession?.patientDetails;
  const appliedSentimentDiscount = currentSession?.appliedSentimentDiscount || 0;
  const detectedSentiment = currentSession?.detectedSentiment;

  const [showBulkDiscount, setShowBulkDiscount] = useState<boolean>(false);
  const [customBulkDiscount, setCustomBulkDiscount] = useState<string>('');
  const [dismissClearancePrompt, setDismissClearancePrompt] = useState<boolean>(false);

  const interactionResult = analyzeDrugInteractions(items);

  // ── UNIFIED EXPIRY BADGE SYSTEM (Red / Orange / Amber / Green) ──────────
  type ExpiryLevel = 'URGENT' | 'CRITICAL' | 'WARNING' | 'SAFE' | 'EXPIRED';
  const getExpiryBadge = (expiryDateStr: string): {
    level: ExpiryLevel;
    daysLeft: number;
    label: string;
    badgeCls: string;
    rowCls: string;
    textCls: string;
  } => {
    const exp = new Date(expiryDateStr);
    const now = new Date();
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0)  return { level: 'EXPIRED',  daysLeft: 0,        label: 'EXPIRED',                   badgeCls: 'bg-red-700 text-white border-red-800 animate-pulse',                           rowCls: 'bg-red-50/80 border-l-4 border-l-red-600',       textCls: 'text-red-700' };
    if (daysLeft <= 10) return { level: 'URGENT',   daysLeft,           label: `🔴 ${daysLeft}d — URGENT`,  badgeCls: 'bg-red-500 text-white border-red-600 animate-pulse',                           rowCls: 'bg-red-50/60 border-l-4 border-l-red-500',       textCls: 'text-red-600' };
    if (daysLeft <= 30) return { level: 'CRITICAL',  daysLeft,          label: `🟠 ${daysLeft}d — CRITICAL`, badgeCls: 'bg-orange-500 text-white border-orange-600 animate-pulse',                     rowCls: 'bg-orange-50/60 border-l-4 border-l-orange-500',  textCls: 'text-orange-600' };
    if (daysLeft <= 90) return { level: 'WARNING',   daysLeft,          label: `🟡 ${daysLeft}d — Near Exp`, badgeCls: 'bg-amber-400 text-amber-950 border-amber-500',                               rowCls: 'bg-amber-50/40 border-l-4 border-l-amber-400',   textCls: 'text-amber-700' };
    return               { level: 'SAFE',     daysLeft,                 label: `🟢 ${daysLeft}d`,            badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-400',                          rowCls: '',                                                textCls: 'text-emerald-700' };
  };

  // Legacy helpers (kept for backward compat)
  const isNearExpiry = (expiryDateStr: string) => {
    const { level } = getExpiryBadge(expiryDateStr);
    return level === 'URGENT' || level === 'CRITICAL' || level === 'WARNING';
  };

  // ── DUMP STOCK: batch expiring within 60 days = old clearance stock ──────
  const isDumpStock = (expiryDateStr: string): { isDump: boolean; daysLeft: number; urgency: 'CRITICAL' | 'WARNING' | 'NORMAL' } => {
    const { level, daysLeft } = getExpiryBadge(expiryDateStr);
    if (level === 'EXPIRED' || level === 'SAFE') return { isDump: false, daysLeft, urgency: 'NORMAL' };
    if (level === 'URGENT' || level === 'CRITICAL') return { isDump: true, daysLeft, urgency: 'CRITICAL' };
    return { isDump: true, daysLeft, urgency: 'WARNING' };
  };

  // Check if ANY cart item has dump stock
  const dumpStockItems = items.filter(item => isDumpStock(item.selectedBatch.expiryDate).isDump);
  const hasDumpStock = dumpStockItems.length > 0;

  // Near-expiry clearance items (≤90 days)
  const nearExpiryClearanceItems = items.filter(item => {
    if (item.isClearanceGift) return false;
    const { daysLeft } = getExpiryBadge(item.selectedBatch.expiryDate);
    return daysLeft > 0 && daysLeft <= 90;
  });
  const hasNearExpiryClearance = nearExpiryClearanceItems.length > 0;

  // Urgent items (≤10 days)
  const urgentExpiryItems = items.filter(item => getExpiryBadge(item.selectedBatch.expiryDate).level === 'URGENT');
  const hasUrgentExpiry = urgentExpiryItems.length > 0;

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
  const hasRxItems = items.some(i => i.product.scheduleCategory !== 'REGULAR');

  const handleClearCart = () => {
    if (items.length === 0) return;
    if (window.confirm('Are you sure you want to clear all items from the current cart?')) {
      dispatch(clearActiveCart());
    }
  };

  const handleApplyBulkDiscount = (pct: number) => {
    dispatch(applyBulkDiscount(pct));
    setShowBulkDiscount(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 flex flex-col h-full overflow-hidden">

      {/* ── TOP BANNER: PATIENT & DOCTOR DETAILS + RX TAG ─────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-2.5 flex items-center justify-between flex-shrink-0 flex-wrap gap-y-1.5">
        <div className="flex items-center space-x-3 text-xs flex-wrap gap-y-1">
          {/* Patient */}
          <div className="flex items-center space-x-1.5 text-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Patient:{' '}
              <strong className="text-slate-900 font-semibold">
                {patientDetails?.patientName || 'Walk-in Customer'}
              </strong>{' '}
              ({patientDetails?.age ? `${patientDetails.age} yrs` : 'N/A'})
            </span>
          </div>

          <span className="text-slate-300">|</span>

          {/* Doctor */}
          <div className="flex items-center space-x-1.5 text-slate-700">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Doctor:{' '}
              <strong className="text-slate-900 font-semibold">
                {doctorDetails?.doctorName || 'Self / Direct Purchase'}
              </strong>
            </span>
          </div>

          {/* Rx Tag */}
          {hasRxItems && (
            <span className="flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
              <FileText className="w-3 h-3 text-amber-700" />
              <span>Rx Required</span>
            </span>
          )}
        </div>

        {/* Patient Bar Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => dispatch(setVoiceConsultationModalOpen({
              isOpen: true,
              patientName: patientDetails?.patientName || '',
              phone: patientDetails?.phone || '',
              age: patientDetails?.age || '',
              gender: patientDetails?.gender || 'MALE'
            }))}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
            title="Record Counter Voice Consultation & Notes"
          >
            <Mic className="w-3 h-3 text-rose-600 animate-pulse" />
            <span>Voice Note</span>
          </button>

          <button
            onClick={() => dispatch(setPatientInstructionModalOpen({
              isOpen: true,
              product: items.length > 0 ? items[0].product : null,
              patientName: patientDetails?.patientName || '',
              doctorName: doctorDetails?.doctorName || ''
            }))}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
            title="Patient Instruction Leaflet (PIL) & Multi-Language Voice Clips"
          >
            <Volume2 className="w-3 h-3 text-teal-600" />
            <span>PIL &amp; Audio</span>
          </button>

          <button
            onClick={() => dispatch(openScheduleHDetailsPrompt())}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 hover:underline cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit Patient Info</span>
          </button>
        </div>
      </div>

      {/* ── CART HEADER CONTROL BAR (Bulk Discount & Clear) ─────────── */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-800 font-heading">Active Cart</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
            {items.length} Meds ({totalPacksCount > 0 && `${totalPacksCount} Packs`}{totalPacksCount > 0 && totalLooseUnits > 0 && ' + '}{totalLooseUnits > 0 && `${totalLooseUnits} Loose Tabs`} • {totalTabletsCount} Tablets/Units)
          </span>
        </div>

        {items.length > 0 && (
          <div className="flex items-center space-x-2">
            {/* Quick Bulk Discount Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowBulkDiscount(v => !v)}
                className="flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
              >
                <Percent className="w-3 h-3" />
                <span>Bulk Disc</span>
              </button>

              {showBulkDiscount && (
                <div className="absolute right-0 top-8 z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 min-w-[170px] space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Apply to all cart items</p>
                  <div className="grid grid-cols-3 gap-1">
                    {[5, 10, 15].map(pct => (
                      <button
                        key={pct}
                        onClick={() => handleApplyBulkDiscount(pct)}
                        className="py-1 text-xs font-bold bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-md transition-colors cursor-pointer"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center space-x-1 pt-1 border-t border-slate-100">
                    <input
                      type="number"
                      placeholder="Custom %"
                      value={customBulkDiscount}
                      onChange={(e) => setCustomBulkDiscount(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-slate-300 rounded focus:outline-hidden"
                      min="0"
                      max="100"
                    />
                    <button
                      onClick={() => handleApplyBulkDiscount(parseFloat(customBulkDiscount) || 0)}
                      className="bg-emerald-600 text-white text-xs px-2 py-1 rounded font-bold hover:bg-emerald-700"
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Clear Cart Button */}
            <button
              onClick={handleClearCart}
              className="flex items-center space-x-1 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer"
              title="Clear entire cart"
            >
              <RefreshCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 💜 TASK #50: CUSTOMER SENTIMENT COURTESY CONCESSION BANNER ── */}
      {appliedSentimentDiscount > 0 && (
        <div className="mb-2 flex-shrink-0 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-black text-purple-950">
                  Customer Sentiment Incentive ({appliedSentimentDiscount}% Courtesy Concession Active)
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 border border-purple-300">
                  {detectedSentiment?.label || 'Price-Sensitive Adaptation'}
                </span>
              </div>
              <p className="text-[10px] text-purple-700">
                Applied from consultation tone analysis to satisfy price hesitation and prevent basket abandonment.
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(applySentimentDiscount(0))}
            className="flex items-center space-x-1 bg-white hover:bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-1 rounded-lg border border-purple-200 transition-colors cursor-pointer shadow-2xs ml-2"
            title="Dismiss Courtesy Concession"
          >
            <X className="w-3 h-3 text-purple-600" />
            <span>Remove</span>
          </button>
        </div>
      )}

      {/* ── 🔴 URGENT EXPIRY BANNER (≤10 days) ──────────────────────────── */}
      {hasUrgentExpiry && (
        <div className="mb-2 flex-shrink-0 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white rounded-xl p-2.5 flex items-center justify-between shadow-lg animate-fadeIn border border-red-500">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <AlertOctagon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-white">
                🔴 URGENT — Medicines Expiring in &lt;10 Days!
              </p>
              <p className="text-[10px] text-red-100 mt-0.5">
                {urgentExpiryItems.map(i => i.product.name).join(', ')} — Dispense immediately or apply discount!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              urgentExpiryItems.forEach(item => {
                dispatch(updateCartItemDiscount({ cartItemId: item.cartItemId, discountPercent: Math.min(100, item.discountPercent + 10) }));
              });
            }}
            className="flex items-center space-x-1.5 bg-white text-red-700 text-[10px] font-extrabold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer shadow-sm flex-shrink-0 ml-2"
            title="Apply 10% urgent clearance discount"
          >
            <Tag className="w-3 h-3" />
            <span>+10% Urgent Disc</span>
          </button>
        </div>
      )}

      {hasDumpStock && (
        <div className="mb-2 flex-shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
              <PackageOpen className="w-3.5 h-3.5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-slate-900 tracking-wide">
                  Dump Stock Priority
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {dumpStockItems.length} Batch{dumpStockItems.length > 1 ? 'es' : ''} &lt;60d
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Dispense near-expiry batches first to clear dump inventory.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              dumpStockItems.forEach(item => {
                const currentDisc = item.discountPercent;
                const newDisc = Math.min(100, currentDisc + 5);
                dispatch(updateCartItemDiscount({ cartItemId: item.cartItemId, discountPercent: newDisc }));
              });
            }}
            className="flex items-center space-x-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs flex-shrink-0 ml-2"
            title="Apply 5% clearance discount to all dump stock items"
          >
            <Tag className="w-3 h-3 text-slate-500" />
            <span>+5% Clear Disc</span>
          </button>
        </div>
      )}

      
      {/* ── 🎁 TASK #16: NEAR-EXPIRY CLEARANCE GIFT & EXTRA ₹5-₹10 DISCOUNT PROMPT ── */}
      {hasNearExpiryClearance && !dismissClearancePrompt && (
        <div className="mb-2.5 flex-shrink-0 bg-white border border-rose-200 rounded-xl p-2.5 shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-rose-600 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-black text-slate-900 tracking-tight">
                    🎁 Near-Expiry Clearance Incentive Available
                  </span>
                  <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-rose-200">
                    Sheet 1 — Task #16
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Near-expiry medicines in cart: <strong className="text-slate-800">{nearExpiryClearanceItems.map(i => `${i.product.name} (${getExpiryBadge(i.selectedBatch.expiryDate).daysLeft}d left)`).join(', ')}</strong>.
                  Apply extra ₹5–₹10 clearance discount or add free promotional gift item.
                </p>
              </div>
            </div>

            {/* Quick 1-Click Incentive Actions */}
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              <button
                onClick={() => dispatch(applyNearExpiryClearanceDiscount({ discountPerUnit: 5 }))}
                className="flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border border-slate-200 shadow-2xs"
                title="Apply flat ₹5 clearance discount per unit on near-expiry medicines"
              >
                <Tag className="w-3 h-3 text-emerald-600" />
                <span>-₹5 / unit Disc</span>
              </button>

              <button
                onClick={() => dispatch(applyNearExpiryClearanceDiscount({ discountPerUnit: 10 }))}
                className="flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border border-emerald-300 shadow-2xs"
                title="Apply flat ₹10 clearance discount per unit on near-expiry medicines"
              >
                <Tag className="w-3 h-3 text-emerald-600" />
                <span>-₹10 / unit Disc</span>
              </button>

              <button
                onClick={() => {
                  dispatch(addClearanceGiftToCart({
                    giftName: 'Dettol Instant Hand Sanitizer (50ml)',
                    giftValue: 30,
                    giftCategory: 'Hygiene & Sanitization',
                    giftIcon: '🧴'
                  }));
                }}
                className="flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border border-rose-300 shadow-2xs"
                title="Add 100% Free Dettol Hand Sanitizer (Worth ₹30) to cart"
              >
                <Gift className="w-3 h-3 text-rose-600" />
                <span>+Free Sanitizer (₹30)</span>
              </button>

              <button
                onClick={() => dispatch(setClearanceGiftModalOpen({ isOpen: true }))}
                className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                title="View All 6 Clearance Gifts & Custom Discount Options"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Gifts Catalog...</span>
              </button>

              <button
                onClick={() => setDismissClearancePrompt(true)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Dismiss Banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE CART ITEMS TABLE ────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
              🛒
            </div>
            <p className="text-xs font-bold text-slate-600 font-heading">Cart is Empty</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Scan a barcode (F2) or search medicines in the left panel to start billing
            </p>
          </div>
        ) : (
          <table className="text-left border-collapse" style={{ minWidth: '660px', width: '100%' }}>
            <thead>
              <tr className="border-b-2 border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 sticky top-0 z-10">
                <th className="py-2 px-2 text-left"   style={{ width: '140px' }}>Item &amp; Salt Description</th>
                <th className="py-2 px-1 text-center" style={{ width: '90px'  }}>Batch / Expiry</th>
                <th className="py-2 px-1 text-center" style={{ width: '95px'  }}>Qty</th>
                <th className="py-2 px-1 text-right"  style={{ width: '68px'  }}>Price</th>
                <th className="py-2 px-1 text-center" style={{ width: '56px'  }}>Disc%</th>
                <th className="py-2 px-1 text-right"  style={{ width: '68px'  }}>GST</th>
                <th className="py-2 px-2 text-right"  style={{ width: '76px'  }}>Total</th>
                <th className="py-2 px-1 text-center" style={{ width: '32px'  }}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {items.map((item) => {
                const stockExceeded = item.quantity > item.selectedBatch.stockQuantity;
                const expBadge = getExpiryBadge(item.selectedBatch.expiryDate);
                // keep legacy compat vars
                const nearExp = expBadge.level === 'URGENT' || expBadge.level === 'CRITICAL' || expBadge.level === 'WARNING';
                const dumpInfo = isDumpStock(item.selectedBatch.expiryDate);

                return (
                  <tr
                    key={item.cartItemId}
                    className={`transition-colors ${item.isClearanceGift ? 'bg-rose-50/70 border-l-4 border-l-rose-500' : expBadge.rowCls || 'hover:bg-slate-50/80'}`}
                  >

                    {/* Item Name & Salt */}
                    <td className="py-2.5 px-2" style={{ maxWidth: '140px' }}>
                      <div className="font-bold text-slate-900 text-[11px] leading-tight truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{item.product.saltComposition}</div>
                      
                      {/* Medicine Size & Type Info */}
                      {(() => {
                        const medDetails = getMedicineDetails(item.product);
                        return (
                          <div className="flex items-center space-x-1 mt-0.5 flex-wrap gap-y-0.5 text-[9px]">
                            <span className="bg-blue-50 text-blue-800 font-extrabold px-1 rounded border border-blue-200">
                              Type: {medDetails.medicineType}
                            </span>
                            <span className="bg-slate-100 text-slate-700 font-medium px-1 rounded border border-slate-200">
                              {medDetails.packSize}
                            </span>
                          </div>
                        );
                      })()}

                      <div className="flex items-center space-x-1 mt-0.5 flex-wrap gap-y-0.5">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-mono">
                          HSN: {item.product.hsnCode}
                        </span>
                        {item.product.scheduleCategory !== 'REGULAR' && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                            {item.product.scheduleCategory}
                          </span>
                        )}
                        {item.isSubstitute ? (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded border border-emerald-300">
                            🎁 15% Substitute Discount
                          </span>
                        ) : item.discountPercent > 0 ? (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1 rounded border border-emerald-200">
                            {item.discountPercent}% Off
                          </span>
                        ) : null}

                        <button
                          onClick={() => dispatch(openSubstitutionModalForProduct({ product: item.product, cartItemId: item.cartItemId }))}
                          className="text-[9px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                          title="Find Salt-Matched Substitutes (5 Criteria) — Replace this item"
                        >
                          <Zap className="w-2.5 h-2.5 text-amber-600" />
                          <span>Replace</span>
                        </button>

                        <button
                          onClick={() => dispatch(setPatientInstructionModalOpen({
                            isOpen: true,
                            product: item.product,
                            patientName: patientDetails?.patientName || '',
                            doctorName: doctorDetails?.doctorName || ''
                          }))}
                          className="text-[9px] font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-1.5 py-0.5 rounded flex items-center space-x-1 transition-all cursor-pointer shadow-2xs"
                          title="Patient Instruction Leaflet & Spoken Audio Guidance"
                        >
                          <Volume2 className="w-2.5 h-2.5 text-teal-600" />
                          <span>PIL &amp; Audio</span>
                        </button>
                      </div>
                      {item.isClearanceGift && (
                        <div className="mt-1 bg-rose-100/90 border border-rose-300 rounded p-1 text-[9.5px]">
                          <span className="text-rose-800 font-black flex items-center space-x-1">
                            <Gift className="w-3 h-3 text-rose-600" />
                            <span>100% FREE PROMOTIONAL GIFT (Near-Expiry Clearance Offer)</span>
                          </span>
                          <span className="text-emerald-700 font-extrabold">
                            Original Retail Value: ₹{item.giftOriginalPrice || 30}.00 (FREE)
                          </span>
                        </div>
                      )}
                      {item.clearanceDiscountApplied && !item.isClearanceGift && (
                        <div className="mt-1 bg-amber-50 border border-amber-300 rounded p-1 text-[9.5px]">
                          <span className="text-amber-900 font-black flex items-center space-x-1">
                            <Tag className="w-2.5 h-2.5 text-amber-700" />
                            <span>Extra ₹{item.clearanceDiscountApplied} Clearance Discount Applied / Unit</span>
                          </span>
                        </div>
                      )}
                      {item.substitutedFor && (
                        <div className="mt-1 bg-emerald-50 border border-emerald-200 rounded p-1 text-[9.5px]">
                          <span className="text-emerald-800 font-bold block truncate">
                            Substituted for: {item.substitutedFor}
                          </span>
                          <span className="text-emerald-700 font-black">
                            🎉 You saved ₹{((item.unitPrice * item.quantity * item.discountPercent) / 100).toFixed(2)} on this medicine!
                          </span>
                        </div>
                      )}
                      {item.sentimentDiscountApplied && (
                        <div className="mt-1 bg-purple-50 border border-purple-200 rounded p-1 text-[9.5px]">
                          <span className="text-purple-900 font-bold flex items-center space-x-1">
                            <Sparkles className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                            <span>{item.sentimentDiscountApplied}% Sentiment Courtesy Discount Applied</span>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* ── Batch & Expiry — Unified Color Badge ────────── */}
                    {(() => {
                      const expBadge = getExpiryBadge(item.selectedBatch.expiryDate);
                      const discIncrement = expBadge.level === 'URGENT' ? 10 : expBadge.level === 'CRITICAL' ? 5 : 3;
                      return (
                        <td className="py-2.5 px-1 text-center" style={{ width: '90px' }}>
                          {/* Batch number */}
                          <div className="text-slate-800 font-semibold text-[10px] break-all">
                            {item.selectedBatch.batchNumber}
                          </div>

                          {/* Color-coded Expiry Days Left Badge */}
                          <div className="mt-0.5 space-y-0.5">
                            <span className={`inline-flex items-center space-x-0.5 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md border w-full justify-center ${expBadge.badgeCls}`}>
                              <span>{expBadge.label}</span>
                            </span>
                            <div className={`text-[8.5px] font-semibold ${expBadge.textCls}`}>
                              {item.selectedBatch.expiryDate}
                            </div>

                            {/* Quick Clearance Gift / Discount Trigger */}
                            {expBadge.level !== 'SAFE' && !item.isClearanceGift && (
                              <button
                                onClick={() => dispatch(setClearanceGiftModalOpen({ isOpen: true, targetCartItemId: item.cartItemId }))}
                                className="w-full text-[8px] font-black px-1 py-0.5 rounded cursor-pointer transition-all flex items-center justify-center space-x-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 mb-0.5"
                                title="Open Clearance Gift / ₹5-₹10 Discount Manager for this item"
                              >
                                <Gift className="w-2 h-2 text-rose-600" />
                                <span>Clearance Gift</span>
                              </button>
                            )}
                            {/* Per-item clearance discount button — only for non-safe batches */}
                            {expBadge.level !== 'SAFE' && (
                              <button
                                onClick={() => dispatch(updateCartItemDiscount({
                                  cartItemId: item.cartItemId,
                                  discountPercent: Math.min(100, item.discountPercent + discIncrement)
                                }))}
                                className={`w-full text-[8px] font-extrabold px-1 py-0.5 rounded cursor-pointer transition-all flex items-center justify-center space-x-0.5 ${
                                  expBadge.level === 'URGENT'   ? 'bg-red-500 hover:bg-red-600 text-white' :
                                  expBadge.level === 'CRITICAL' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                                  expBadge.level === 'EXPIRED'  ? 'bg-red-700 hover:bg-red-800 text-white' :
                                  'bg-amber-500 hover:bg-amber-600 text-white'
                                }`}
                                title={`Apply +${discIncrement}% clearance discount`}
                              >
                                <Tag className="w-2 h-2" />
                                <span>+{discIncrement}% Clear</span>
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })()}

                    {/* Quantity Controls, Unit Mode Toggle & Total Tablets Count */}
                    <td className="py-2.5 px-1 text-center" style={{ width: '110px' }}>
                      {/* Unit Mode Toggle: Full Strip / Loose Tablet */}
                      {(() => {
                        const medDetails = getMedicineDetails(item.product);
                        const isLoose = (item.unitMode || 'PACK') === 'LOOSE';
                        if (medDetails.unitsPerPack <= 1) return null;
                        return (
                          <div className="flex items-center justify-center bg-slate-100 p-0.5 rounded-md border border-slate-200 mb-1 mx-auto" style={{ width: 'fit-content' }}>
                            <button
                              type="button"
                              onClick={() => dispatch(updateCartItemUnitMode({ cartItemId: item.cartItemId, unitMode: 'PACK' }))}
                              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                                !isLoose ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >📦 Strip</button>
                            <button
                              type="button"
                              onClick={() => dispatch(updateCartItemUnitMode({ cartItemId: item.cartItemId, unitMode: 'LOOSE' }))}
                              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                                isLoose ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >💊 Loose</button>
                          </div>
                        );
                      })()}

                      <div className={`inline-flex items-center border rounded-md bg-white ${
                        stockExceeded ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                      }`}>
                        <button
                          onClick={() =>
                            dispatch(updateCartItemQuantity({ cartItemId: item.cartItemId, quantity: item.quantity - 1 }))
                          }
                          className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-l cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            dispatch(
                              updateCartItemQuantity({
                                cartItemId: item.cartItemId,
                                quantity: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            )
                          }
                          className="w-8 text-center text-xs font-bold text-slate-900 focus:outline-hidden"
                          min="1"
                        />
                        <button
                          onClick={() =>
                            dispatch(updateCartItemQuantity({ cartItemId: item.cartItemId, quantity: item.quantity + 1 }))
                          }
                          className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-r cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total Units Calculated for this Item */}
                      {(() => {
                        const medDetails = getMedicineDetails(item.product);
                        const isLoose = (item.unitMode || 'PACK') === 'LOOSE';
                        const label = medDetails.dosageForm === 'Tablet' ? 'Tabs' : medDetails.dosageForm === 'Capsule' ? 'Caps' : 'Units';
                        if (isLoose) {
                          return (
                            <div className="text-[9px] font-black text-purple-700 mt-0.5 font-mono">
                              {item.quantity} {label} (Loose)
                            </div>
                          );
                        }
                        const lineTotalUnits = item.quantity * medDetails.unitsPerPack;
                        return (
                          <div className="text-[9.5px] font-black text-emerald-800 mt-0.5 font-mono">
                            (= {lineTotalUnits} {label})
                          </div>
                        );
                      })()}
                      {stockExceeded && (
                        <div className="text-[9px] font-bold text-rose-600 mt-0.5">
                          Max stock: {item.selectedBatch.stockQuantity}
                        </div>
                      )}
                    </td>

                    {/* Unit Price */}
                    <td className="py-2.5 px-1 text-right font-bold text-slate-800 whitespace-nowrap" style={{ width: '68px' }}>
                      {(() => {
                        const isLoose = (item.unitMode || 'PACK') === 'LOOSE';
                        return (
                          <>
                            ₹{item.unitPrice.toFixed(2)}
                            {isLoose && (
                              <div className="text-[9px] text-purple-600 font-bold">/tablet</div>
                            )}
                          </>
                        );
                      })()}
                    </td>

                    {/* Discount Input */}
                    <td className="py-2.5 px-1 text-center" style={{ width: '56px' }}>
                      <input
                        type="number"
                        value={item.discountPercent}
                        onChange={(e) =>
                          dispatch(
                            updateCartItemDiscount({
                              cartItemId: item.cartItemId,
                              discountPercent: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                            })
                          )
                        }
                        className={`w-10 text-center text-xs border rounded py-0.5 focus:outline-hidden font-bold ${
                          item.isSubstitute || item.discountPercent === 15
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300/50'
                            : item.discountPercent > 0
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'border-slate-300 text-slate-700'
                        }`}
                        min="0"
                        max="100"
                        title={item.isSubstitute ? '15% Out of Stock Substitution Discount' : 'Discount Percentage'}
                      />
                    </td>

                    {/* GST Amount */}
                    <td className="py-2.5 px-1 text-right text-[11px] text-slate-600 font-medium whitespace-nowrap" style={{ width: '68px' }}>
                      ₹{item.totalGst.toFixed(2)}
                      <div className="text-[9px] text-slate-400">({item.product.gstRate}%)</div>
                    </td>

                    {/* Line Total */}
                    <td className="py-2.5 px-2 text-right font-extrabold text-emerald-800 font-heading whitespace-nowrap" style={{ width: '76px' }}>
                      ₹{item.lineTotal.toFixed(2)}
                    </td>

                    {/* Remove Action */}
                    <td className="py-2.5 px-1 text-center" style={{ width: '32px' }}>
                      <button
                        onClick={() => dispatch(removeFromCart(item.cartItemId))}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── INLINE MINOR AI DRUG INTERACTION ALERT ─────────────────── */}
      {interactionResult.hasMinor && (
        <div className="mt-2.5 bg-amber-100/90 border border-amber-400 rounded-xl p-3 flex items-start space-x-2.5 text-amber-950 text-xs flex-shrink-0 shadow-2xs animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 animate-bounce" />
          <div className="flex-1 space-y-0.5">
            <p className="font-extrabold uppercase tracking-wide text-amber-900 text-[11px]">
              🟠 AMBER WARNING: MINOR AI DRUG INTERACTION DETECTED
            </p>
            {interactionResult.interactions
              .filter((i) => i.severity === 'MINOR')
              .map((item, idx) => (
                <div key={idx} className="text-xs font-medium text-amber-900">
                  <span>• <strong>{item.drug1}</strong> ⚡ <strong>{item.drug2}</strong>: {item.description}</span>
                  <span className="block text-[11px] font-semibold text-amber-800 italic mt-0.5">Advice: {item.management}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
