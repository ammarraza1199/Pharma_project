import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../utils/api';
import { addItemToCart } from '../store/posSlice';
import {
  CLINICAL_CARE_BUNDLES,
  bundleItemToProduct,
  type ClinicalBundle,
  type BundleItem
} from '../utils/clinicalBundlesEngine';
import {
  PackageCheck, X, Sparkles, CheckCircle2,
  ShieldCheck, ArrowRight, Tag, HeartHandshake,
  Check, Layers
} from 'lucide-react';

interface ClinicalBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightBundleId?: string;
}

export const ClinicalBundleModal: React.FC<ClinicalBundleModalProps> = ({
  isOpen,
  onClose,
  highlightBundleId
}) => {
  const dispatch = useDispatch();
  const [liveBundles, setLiveBundles] = useState<ClinicalBundle[]>(CLINICAL_CARE_BUNDLES);
  const [selectedBundleId, setSelectedBundleId] = useState<string>(
    highlightBundleId || CLINICAL_CARE_BUNDLES[0].id
  );
  const [addedBundleId, setAddedBundleId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/clinical-bundles')
        .then(res => {
          if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
            // Augment backend bundles with clinical engine items if needed
            setLiveBundles(CLINICAL_CARE_BUNDLES);
          }
        })
        .catch(err => console.warn('[ClinicalBundleModal] Backend fetch fallback:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeBundle = liveBundles.find(b => b.id === selectedBundleId) || liveBundles[0];

  const handleAddEntireBundle = (bundle: ClinicalBundle) => {
    bundle.items.forEach((item) => {
      const prod = bundleItemToProduct(item, bundle.title);
      dispatch(
        addItemToCart({
          product: prod,
          selectedBatch: item.sampleBatch,
          quantity: 1,
          unitMode: 'PACK'
        })
      );
    });

    setAddedBundleId(bundle.id);
    setTimeout(() => {
      setAddedBundleId(null);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border-2 border-emerald-400/80 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* ── MODAL HEADER ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <PackageCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Pre-Configured Medical Kits
                </span>
                <span className="bg-amber-400 text-amber-950 font-black text-[9px] px-2 py-0.5 rounded-full">
                  Save 14%–16% Bundle Discount
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white font-heading">
                Smart Clinical Care Bundles at Checkout
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 text-emerald-100 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── BUNDLE TABS BAR ─────────────────────────────────────────── */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-100 flex-shrink-0 bg-slate-50/70 overflow-x-auto scrollbar-none">
          <div className="flex space-x-2 min-w-max pb-2">
            {CLINICAL_CARE_BUNDLES.map((bundle) => {
              const isSelected = bundle.id === selectedBundleId;

              return (
                <button
                  key={bundle.id}
                  onClick={() => setSelectedBundleId(bundle.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300/50'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-base leading-none">{bundle.iconEmoji}</span>
                  <div className="text-left">
                    <div className="leading-tight">{bundle.title}</div>
                    <div className={`text-[9.5px] font-bold ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                      ₹{bundle.bundlePrice.toFixed(2)} (Save ₹{bundle.totalSavings.toFixed(2)})
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ACTIVE BUNDLE DETAILS BODY (SCROLLABLE) ─────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Bundle Banner */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-indigo-50/60 border-2 border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-2xl flex-shrink-0 border border-emerald-100">
                {activeBundle.iconEmoji}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                    {activeBundle.badgeText}
                  </span>
                  <span className="text-xs font-black text-slate-500">•</span>
                  <span className="text-xs font-bold text-slate-600">{activeBundle.category}</span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 font-heading">
                  {activeBundle.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                  {activeBundle.clinicalRationale}
                </p>
              </div>
            </div>

            {/* Price & Savings Pill */}
            <div className="text-left sm:text-right bg-white p-3 rounded-2xl border border-emerald-200/70 flex-shrink-0 shadow-2xs">
              <div className="text-[10px] text-slate-400 line-through font-mono">
                Individual Total: ₹{activeBundle.individualTotal.toFixed(2)}
              </div>
              <div className="text-xl font-black text-emerald-700 font-mono">
                ₹{activeBundle.bundlePrice.toFixed(2)}
              </div>
              <div className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md mt-1 inline-block">
                Save ₹{activeBundle.totalSavings.toFixed(2)} ({activeBundle.savingsPercent}% Off)
              </div>
            </div>
          </div>

          {/* Item Breakdown (3 Items in Kit) */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>All 3 Included Kit Items:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeBundle.items.map((item, idx) => (
                <div
                  key={item.productId}
                  className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs transition-all relative overflow-hidden"
                >
                  <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 font-black text-[10px] flex items-center justify-center border border-emerald-200">
                    #{idx + 1}
                  </div>

                  <div>
                    <div className="text-2xl leading-none mb-2">{item.iconEmoji}</div>
                    <h5 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 min-h-[32px]" title={item.name}>
                      {item.name}
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      {item.packSize} • {item.brand}
                    </p>

                    <div className="mt-2 bg-slate-50 rounded-xl p-2 border border-slate-100 text-[10px] text-slate-700 font-semibold leading-relaxed">
                      💡 {item.roleInKit}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[9.5px] text-slate-400 line-through">₹{item.individualPrice.toFixed(2)}</div>
                      <div className="text-xs font-black text-emerald-800">₹{item.bundlePrice.toFixed(2)}</div>
                    </div>
                    <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Bundle Rate
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Assurance Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center space-x-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-extrabold text-slate-800">Statutory Compliance: </span>
              All bundle medicines are dispensed from genuine FEFO pharmacy inventory batches with itemized GST invoices.
            </div>
          </div>

        </div>

        {/* ── MODAL FOOTER WITH 1-CLICK ADD ───────────────────────────── */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>1-Click adds all 3 kit items to active customer cart</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={() => handleAddEntireBundle(activeBundle)}
              disabled={addedBundleId === activeBundle.id}
              className={`flex items-center space-x-2 text-xs font-black px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-97 ${
                addedBundleId === activeBundle.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-emerald-700 text-white hover:shadow-lg'
              }`}
            >
              {addedBundleId === activeBundle.id ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 animate-pulse" />
                  <span>Entire Kit Added to Cart! ✓</span>
                </>
              ) : (
                <>
                  <span>Add Entire Kit to Cart (₹{activeBundle.bundlePrice.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default ClinicalBundleModal;
