import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  updateCartItemQuantity,
  updateCartItemDiscount,
  removeFromCart,
  clearActiveCart,
  applyBulkDiscount,
  openScheduleHDetailsPrompt
} from '../store/posSlice';
import { analyzeDrugInteractions } from '../utils/drugInteractionEngine';
import {
  Trash2, Plus, Minus, AlertTriangle, AlertOctagon, UserCheck,
  Stethoscope, Edit2, Percent, FileText, RefreshCcw
} from 'lucide-react';

export const CartTable: React.FC = () => {
  const dispatch = useDispatch();
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const items = currentSession ? currentSession.items : [];
  const doctorDetails = currentSession?.doctorDetails;
  const patientDetails = currentSession?.patientDetails;

  const [showBulkDiscount, setShowBulkDiscount] = useState<boolean>(false);
  const [customBulkDiscount, setCustomBulkDiscount] = useState<string>('');

  const interactionResult = analyzeDrugInteractions(items);

  const isNearExpiry = (expiryDateStr: string) => {
    const exp = new Date(expiryDateStr);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return exp < thirtyDaysFromNow && exp > new Date();
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
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

        {/* Edit Action */}
        <button
          onClick={() => dispatch(openScheduleHDetailsPrompt())}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 hover:underline cursor-pointer"
        >
          <Edit2 className="w-3 h-3" />
          <span>Edit Patient Info</span>
        </button>
      </div>

      {/* ── CART HEADER CONTROL BAR (Bulk Discount & Clear) ─────────── */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-800 font-heading">Active Cart</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
            {items.length} Medicines ({totalItemsCount} Units)
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
                const nearExp = isNearExpiry(item.selectedBatch.expiryDate);
                const stockExceeded = item.quantity > item.selectedBatch.stockQuantity;

                return (
                  <tr key={item.cartItemId} className="hover:bg-slate-50/80 transition-colors">

                    {/* Item Name & Salt */}
                    <td className="py-2.5 px-2" style={{ maxWidth: '140px' }}>
                      <div className="font-bold text-slate-900 text-[11px] leading-tight truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{item.product.saltComposition}</div>
                      <div className="flex items-center space-x-1 mt-0.5 flex-wrap gap-y-0.5">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-mono">
                          HSN: {item.product.hsnCode}
                        </span>
                        {item.product.scheduleCategory !== 'REGULAR' && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                            {item.product.scheduleCategory}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Batch & Expiry */}
                    <td className="py-2.5 px-1 text-center" style={{ width: '90px' }}>
                      <div className="text-slate-800 font-semibold text-[10px] break-all">
                        {item.selectedBatch.batchNumber}
                      </div>
                      {nearExp ? (
                        <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold text-amber-800 bg-amber-100 px-1 rounded border border-amber-300">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                          <span>Exp: {item.selectedBatch.expiryDate}</span>
                        </span>
                      ) : (
                        <div className="text-[10px] text-slate-400">Exp: {item.selectedBatch.expiryDate}</div>
                      )}
                    </td>

                    {/* Quantity Controls */}
                    <td className="py-2.5 px-1 text-center" style={{ width: '95px' }}>
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
                      {stockExceeded && (
                        <div className="text-[9px] font-bold text-rose-600 mt-0.5">
                          Max stock: {item.selectedBatch.stockQuantity}
                        </div>
                      )}
                    </td>

                    {/* Unit Price */}
                    <td className="py-2.5 px-1 text-right font-bold text-slate-800 whitespace-nowrap" style={{ width: '68px' }}>
                      ₹{item.unitPrice.toFixed(2)}
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
                        className="w-10 text-center text-xs border border-slate-300 rounded py-0.5 focus:outline-hidden font-medium text-slate-700"
                        min="0"
                        max="100"
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
