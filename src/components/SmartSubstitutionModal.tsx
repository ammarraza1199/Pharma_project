import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { closeSubstitutionModal, addItemToCart } from '../store/posSlice';
import type { Product } from '../types/pos';
import { Zap, X, ShieldCheck, Plus, Tag, Sparkles } from 'lucide-react';

export const SmartSubstitutionModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.substitutionModal);

  if (!modal.isOpen || !modal.originalProduct) return null;

  const { originalProduct, alternatives } = modal;

  const handleSelectAlternative = (alternative: Product) => {
    dispatch(closeSubstitutionModal());
    dispatch(
      addItemToCart({
        product: alternative,
        discountPercent: 15,
        isSubstitute: true,
        substitutedFor: originalProduct.name
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-modal rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 text-white px-4 py-2.5 flex items-center justify-between -mx-6 -mt-6 mb-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-200 animate-bounce" />
            <h3 className="text-sm font-extrabold tracking-wide font-heading">
              AI Smart Substitution Recommendation
            </h3>
          </div>
          <button
            onClick={() => dispatch(closeSubstitutionModal())}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 15% Discount Promotional Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl p-3 mb-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Special Offer
                </span>
                <span className="text-xs font-black tracking-wide">15% Substitution Discount</span>
              </div>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                Get an instant <strong>15% OFF</strong> on substitute medicines for out-of-stock items!
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-black text-amber-300 font-mono">15% OFF</span>
          </div>
        </div>

        {/* Original Requested Product Out-of-Stock Alert */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Out of Stock Item</span>
            <h4 className="text-xs font-bold text-slate-900 font-heading">{originalProduct.name}</h4>
            <p className="text-[11px] text-slate-600">Salt: {originalProduct.saltComposition}</p>
          </div>
          <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
            0 Stock
          </span>
        </div>

        {/* AI Salt Matched Recommendations */}
        <h4 className="text-xs font-bold text-slate-800 mb-2 font-heading flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>In-Stock Salt Matched Alternatives (Ranked by Stock &amp; Margin):</span>
          </span>
        </h4>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {alternatives.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl">
              No direct salt-matched alternatives currently in stock.
            </div>
          ) : (
            alternatives.map((alt, idx) => {
              const originalSellingPrice = alt.sellingPrice;
              const discountedPrice = originalSellingPrice * 0.85; // 15% discount
              const savings = originalSellingPrice - discountedPrice;

              return (
                <div
                  key={alt._id}
                  className="bg-white border border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:shadow-md transition-all duration-150 relative overflow-hidden"
                >
                  {/* Left Column Info */}
                  <div className="flex-1 pr-3">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                        Rank #{idx + 1} Recommendation
                      </span>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 flex items-center space-x-1">
                        <Tag className="w-3 h-3 text-amber-700" />
                        <span>15% OFF Discount</span>
                      </span>
                    </div>

                    <h5 className="text-xs font-bold text-slate-900 font-heading">{alt.name}</h5>
                    <p className="text-[11px] text-slate-500">
                      Brand: {alt.brand} • Stock: <strong className="text-emerald-700">{alt.totalStock} units</strong>
                    </p>
                  </div>

                  {/* Right Column Pricing & Action */}
                  <div className="text-right flex flex-col items-end space-y-1">
                    <div>
                      <span className="text-[10px] text-slate-400 line-through mr-1.5 font-mono">
                        ₹{originalSellingPrice.toFixed(2)}
                      </span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        ₹{discountedPrice.toFixed(2)}
                      </span>
                    </div>

                    <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Save ₹{savings.toFixed(2)} (15% OFF)
                    </span>

                    <button
                      onClick={() => handleSelectAlternative(alt)}
                      className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Substitute (15% OFF)</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
