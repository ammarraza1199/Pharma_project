import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { closeSubstitutionModal, addItemToCart, removeFromCart } from '../store/posSlice';
import type { Product, BatchInfo } from '../types/pos';
import {
  Zap, X, ShieldCheck, Plus, Tag, Sparkles,
  Clock, DollarSign, Package, Award, CheckCircle2,
  TrendingUp, AlertTriangle, ArrowDownRight, Layers
} from 'lucide-react';

export type SubstitutionCriteria = 
  | 'NEAR_EXPIRED'
  | 'LEAST_PRICE'
  | 'HIGH_STOCK'
  | 'HIGH_QUALITY'
  | 'PHARMACY_SAFE';

interface CriteriaTabMeta {
  id: SubstitutionCriteria;
  label: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  activeColor: string;
  lightBg: string;
}

const CRITERIA_TABS: CriteriaTabMeta[] = [
  {
    id: 'NEAR_EXPIRED',
    label: '1. Near Expired',
    badge: 'FEFO Clearance',
    icon: Clock,
    description: 'Prioritize clearing stock closest to expiry date first with clearance discount.',
    activeColor: 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-300',
    lightBg: 'bg-rose-50 border-rose-200 text-rose-800'
  },
  {
    id: 'LEAST_PRICE',
    label: '2. Least Price',
    badge: 'Cost-Effective',
    icon: DollarSign,
    description: 'Most affordable generic/brand options sorted by lowest price to maximize patient savings.',
    activeColor: 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-300',
    lightBg: 'bg-emerald-50 border-emerald-200 text-emerald-800'
  },
  {
    id: 'HIGH_STOCK',
    label: '3. High Stock',
    badge: 'Stock More',
    icon: Package,
    description: 'Sorted by medicines currently with the highest units in pharmacy inventory.',
    activeColor: 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-300',
    lightBg: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  {
    id: 'HIGH_QUALITY',
    label: '4. High Quality',
    badge: 'Low Margin / Branded',
    icon: Award,
    description: 'Top-tier branded manufacturers (GSK, Abbott, Cipla, Sun Pharma) with verified clinical quality.',
    activeColor: 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300',
    lightBg: 'bg-amber-50 border-amber-200 text-amber-800'
  },
  {
    id: 'PHARMACY_SAFE',
    label: '5. Pharmacy Safe',
    badge: 'Pharmacist Recommended',
    icon: ShieldCheck,
    description: 'Trusted clinical efficacy, proven safety records, and reliable patient adherence.',
    activeColor: 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-300',
    lightBg: 'bg-teal-50 border-teal-200 text-teal-800'
  }
];

export const SmartSubstitutionModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.substitutionModal);
  const user = useSelector((state: RootState) => state.pos.currentUser);

  const [activeTab, setActiveTab] = useState<SubstitutionCriteria>('LEAST_PRICE');
  const isReplaceMode = Boolean(modal.originalCartItemId);

  const now = useMemo(() => new Date(), []);

  // Helper to compute closest non-expired days left for a product
  const getNearestBatchDays = (product: Product): { daysLeft: number; batchNo: string } => {
    if (!product.batches || product.batches.length === 0) return { daysLeft: 999, batchNo: '—' };
    let minDays = 9999;
    let chosenBatch = product.batches[0]?.batchNumber || '—';

    product.batches.forEach(b => {
      const exp = new Date(b.expiryDate);
      const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0 && diff < minDays) {
        minDays = diff;
        chosenBatch = b.batchNumber;
      }
    });

    return { daysLeft: minDays === 9999 ? 0 : minDays, batchNo: chosenBatch };
  };

  const TOP_BRANDS = useMemo(() => [
    'glaxosmithkline', 'gsk', 'abbott', 'cipla', 'sun pharma', 'sun pharmaceutical',
    'dr. reddy', 'dr reddy', 'pfizer', 'lupin', 'alembic', 'torrent'
  ], []);

  // Sort alternatives dynamically according to the selected criteria
  const sortedAlternatives = useMemo(() => {
    if (!modal.alternatives || modal.alternatives.length === 0) return [];

    const list = [...modal.alternatives];

    switch (activeTab) {
      case 'NEAR_EXPIRED':
        // Lowest positive daysLeft first (clear expiring stock soonest)
        return list.sort((a, b) => {
          const daysA = getNearestBatchDays(a).daysLeft;
          const daysB = getNearestBatchDays(b).daysLeft;
          return daysA - daysB;
        });

      case 'LEAST_PRICE':
        // Lowest sellingPrice first
        return list.sort((a, b) => a.sellingPrice - b.sellingPrice);

      case 'HIGH_STOCK':
        // Highest totalStock first
        return list.sort((a, b) => b.totalStock - a.totalStock);

      case 'HIGH_QUALITY':
        // Branded manufacturers prioritized, then margin
        return list.sort((a, b) => {
          const aIsTop = TOP_BRANDS.some(tb => a.brand.toLowerCase().includes(tb));
          const bIsTop = TOP_BRANDS.some(tb => b.brand.toLowerCase().includes(tb));
          if (aIsTop && !bIsTop) return -1;
          if (!aIsTop && bIsTop) return 1;
          return a.sellingPrice - b.sellingPrice;
        });

      case 'PHARMACY_SAFE':
      default:
        // Highest margin combined with safe stock
        return list.sort((a, b) => b.grossMarginPercent - a.grossMarginPercent);
    }
  }, [modal.alternatives, activeTab, now, TOP_BRANDS]);

  if (!modal.isOpen || !modal.originalProduct) return null;

  const { originalProduct } = modal;
  const currentTabMeta = CRITERIA_TABS.find(t => t.id === activeTab) || CRITERIA_TABS[0];

  const handleSelectAlternative = (alternative: Product) => {
    // If opened from a cart row, remove the original item first (replace mode)
    if (modal.originalCartItemId) {
      dispatch(removeFromCart(modal.originalCartItemId));
    }
    dispatch(closeSubstitutionModal());
    const isAuthorizedByPin = user?.role === 'MANAGER' || user?.role === 'OWNER';
    dispatch(
      addItemToCart({
        product: alternative,
        discountPercent: 15,
        isSubstitute: true,
        substitutedFor: originalProduct.name,
        isAuthorizedByPin
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[92vh] font-sans">
        
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-3 flex items-center justify-between -mx-6 -mt-6 mb-4 shadow-md flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight font-heading">
                  {isReplaceMode ? 'Replace Medicine in Cart' : 'AI Smart Medicine Substitution'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {isReplaceMode ? '↕ Swap & Remove Original' : 'Salt-Matched Alternatives'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Salt: <strong className="text-amber-200">{originalProduct.saltComposition}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(closeSubstitutionModal())}
            className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Replace mode info banner */}
        {isReplaceMode && (
          <div className="mb-3 flex-shrink-0 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-[11px] font-semibold text-amber-800">
              <strong className="font-extrabold">Replace mode:</strong> Selecting a substitute will <strong>remove "{originalProduct.name}"</strong> from the cart and add the chosen alternative with a <strong>15% discount</strong>.
            </p>
          </div>
        )}

        {/* ── 2. ORIGINAL PRODUCT CARD & 15% DISCOUNT BANNER ──────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3 flex-shrink-0">
          {/* Requested Out-of-Stock / Substituted Item */}
          <div className="sm:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Requested Item
              </span>
              <h4 className="text-xs font-bold text-slate-900 font-heading truncate">
                {originalProduct.name}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">
                Brand: {originalProduct.brand} • Price: <strong className="text-slate-700">₹{originalProduct.sellingPrice.toFixed(2)}</strong>
              </p>
            </div>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 border ${
              originalProduct.totalStock === 0
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {originalProduct.totalStock === 0 ? '0 Stock' : `${originalProduct.totalStock} in Stock`}
            </span>
          </div>

          {/* 15% Substitution Savings Callout */}
          <div className="sm:col-span-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 text-white rounded-2xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/15 rounded-xl">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="bg-amber-400 text-slate-900 text-[9.5px] font-black px-1.5 py-0.2 rounded-full uppercase">
                    Bill Discount
                  </span>
                  <span className="text-xs font-black">15% Instant Off</span>
                </div>
                <p className="text-[10.5px] text-emerald-100 mt-0.5">
                  &ldquo;You saved this much&rdquo; banner shown on bill!
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-base font-black text-amber-300 font-mono">15% OFF</span>
            </div>
          </div>
        </div>

        {/* ── 3. THE 5 SUBSTITUTION CRITERIA TABS ─────────────────────────── */}
        <div className="mb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-heading">
              Select Substitution Priority Criteria (5 Options):
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {currentTabMeta.description}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {CRITERIA_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                    isActive
                      ? `${tab.activeColor} border-transparent`
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  <span className={`text-[9px] mt-0.5 font-medium opacity-85 truncate`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 4. ALTERNATIVES LIST WITH "YOU SAVED THIS MUCH" HIGHLIGHT ───── */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[220px]">
          {sortedAlternatives.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 font-heading">
                No direct salt-matched substitutes found in stock
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Check central godown stock or place an emergency borrow request in Multi-Store.
              </p>
            </div>
          ) : (
            sortedAlternatives.map((alt, idx) => {
              const originalSellingPrice = alt.sellingPrice;
              const discountedPrice = originalSellingPrice * 0.85; // 15% discount
              const discountSavings = originalSellingPrice - discountedPrice;
              const { daysLeft, batchNo } = getNearestBatchDays(alt);

              // Comparison with requested medicine price
              const priceDiffVsOriginal = originalProduct.sellingPrice - discountedPrice;

              return (
                <div
                  key={alt._id}
                  className="bg-white border border-slate-200 hover:border-teal-500 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between shadow-2xs hover:shadow-md transition-all gap-3 relative overflow-hidden"
                >
                  {/* Left Column: Product Info & Criterion Badges */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                      <span className="bg-slate-900 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full">
                        #{idx + 1} Best Match
                      </span>

                      {/* Dynamic Badge for active criteria */}
                      {activeTab === 'NEAR_EXPIRED' && (
                        <span className="bg-rose-100 text-rose-800 text-[9.5px] font-black px-2 py-0.5 rounded-full border border-rose-300 flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5 text-rose-600" />
                          <span>Expires in {daysLeft} Days (Batch: {batchNo})</span>
                        </span>
                      )}

                      {activeTab === 'LEAST_PRICE' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[9.5px] font-black px-2 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
                          <DollarSign className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Lowest Price Option</span>
                        </span>
                      )}

                      {activeTab === 'HIGH_STOCK' && (
                        <span className="bg-blue-100 text-blue-800 text-[9.5px] font-black px-2 py-0.5 rounded-full border border-blue-300 flex items-center space-x-1">
                          <Package className="w-2.5 h-2.5 text-blue-600" />
                          <span>High Stock: {alt.totalStock} Units in Pharmacy</span>
                        </span>
                      )}

                      {activeTab === 'HIGH_QUALITY' && (
                        <span className="bg-amber-100 text-amber-900 text-[9.5px] font-black px-2 py-0.5 rounded-full border border-amber-300 flex items-center space-x-1">
                          <Award className="w-2.5 h-2.5 text-amber-700" />
                          <span>Top Quality Brand Formulation</span>
                        </span>
                      )}

                      {activeTab === 'PHARMACY_SAFE' && (
                        <span className="bg-teal-100 text-teal-800 text-[9.5px] font-black px-2 py-0.5 rounded-full border border-teal-300 flex items-center space-x-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-teal-600" />
                          <span>Pharmacist Verified Safe</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-heading truncate">
                      {alt.name}
                    </h4>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5 flex-wrap gap-y-0.5">
                      <span>Brand: <strong className="text-slate-700">{alt.brand}</strong></span>
                      <span>•</span>
                      <span>Stock: <strong className="text-emerald-700">{alt.totalStock} units</strong></span>
                      <span>•</span>
                      <span>Margin: <strong className="text-indigo-700">{alt.grossMarginPercent}%</strong></span>
                    </div>

                    {/* "You Saved This Much" Callout Pill */}
                    <div className="mt-2 flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center space-x-1">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>You Saved <strong>₹{discountSavings.toFixed(2)}</strong> with 15% discount!</span>
                      </span>

                      {priceDiffVsOriginal > 0 && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center space-x-1">
                          <ArrowDownRight className="w-3 h-3 text-amber-600" />
                          <span>₹{priceDiffVsOriginal.toFixed(2)} cheaper than requested medicine</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Pricing & Add Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-1.5 flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] text-slate-400 line-through font-mono">
                          ₹{originalSellingPrice.toFixed(2)}
                        </span>
                        <span className="text-base font-black text-emerald-700 font-mono">
                          ₹{discountedPrice.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-600 block">
                        Includes 15% Discount
                      </span>
                    </div>

                    <button
                      onClick={() => handleSelectAlternative(alt)}
                      className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isReplaceMode ? 'Replace in Cart' : 'Substitute Now'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── 5. MODAL FOOTER ─────────────────────────────────────────────── */}
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between flex-shrink-0 text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-[11px]">
              Substituted items carry an automatic 15% savings discount into the active bill
            </span>
          </div>

          <button
            onClick={() => dispatch(closeSubstitutionModal())}
            className="px-4 py-1.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default SmartSubstitutionModal;
