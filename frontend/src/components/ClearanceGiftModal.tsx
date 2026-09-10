import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  setClearanceGiftModalOpen,
  applyNearExpiryClearanceDiscount,
  addClearanceGiftToCart,
  removeClearanceGiftFromCart
} from '../store/posSlice';
import {
  Gift,
  Sparkles,
  Tag,
  CheckCircle2,
  X,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingDown,
  Trash2,
  Package,
  HeartHandshake
} from 'lucide-react';

interface PromoGiftOption {
  id: string;
  name: string;
  category: string;
  value: number;
  icon: string;
  description: string;
  stock: number;
}

const PROMOTIONAL_GIFTS: PromoGiftOption[] = [
  {
    id: 'gift-sanitizer',
    name: 'Dettol Instant Hand Sanitizer (50ml)',
    category: 'Hygiene & Sanitization',
    value: 30,
    icon: '🧴',
    description: 'Kills 99.9% germs without water. Trusted clinical antiseptic rinse.',
    stock: 48
  },
  {
    id: 'gift-vitaminc',
    name: 'Limcee Vitamin C 500mg Chewable (Strip of 5)',
    category: 'Immunity & Wellness',
    value: 25,
    icon: '🍊',
    description: 'Daily immunity booster with ascorbic acid. Orange flavored chewable.',
    stock: 60
  },
  {
    id: 'gift-bandages',
    name: 'Hansaplast Medicated Bandages (Pack of 5)',
    category: 'First-Aid & Wound Care',
    value: 20,
    icon: '🩹',
    description: 'Breathable waterproof plaster with antiseptic pad for fast wound protection.',
    stock: 120
  },
  {
    id: 'gift-ors',
    name: 'Electral ORS Energy Sachet (21.8g)',
    category: 'Hydration & Electrolytes',
    value: 22,
    icon: '⚡',
    description: 'WHO-recommended oral rehydration salts for instant vitality and restoration.',
    stock: 85
  },
  {
    id: 'gift-coughdrops',
    name: 'Dabur Honitus Herbal Cough Drops (Pack of 10)',
    category: 'Throat Care & Relief',
    value: 25,
    icon: '🌿',
    description: 'Ayurvedic soothing herbal lozenges with honey, ginger, and tulsi.',
    stock: 40
  },
  {
    id: 'gift-wipes',
    name: 'Savlon Antiseptic Wet Wipes (Pack of 10)',
    category: 'Disinfection & Hygiene',
    value: 35,
    icon: '🧻',
    description: 'Gentle multi-purpose germ protection wipes for hands and surfaces.',
    stock: 32
  }
];

export const ClearanceGiftModal: React.FC = () => {
  const dispatch = useDispatch();
  const modalState = useSelector((state: RootState) => state.pos.clearanceGiftModal);
  const sessions = useSelector((state: RootState) => state.pos.sessions);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);

  const [activeTab, setActiveTab] = useState<'DISCOUNT' | 'GIFT'>('GIFT');
  const [customDiscount, setCustomDiscount] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!modalState?.isOpen) return null;

  const currentSession = sessions.find(s => s.id === activeSessionId);
  const items = currentSession ? currentSession.items : [];

  // Identify near-expiry items (<= 90 days)
  const now = new Date().getTime();
  const nearExpiryItems = items.filter(i => {
    if (i.isClearanceGift) return false;
    const exp = new Date(i.selectedBatch.expiryDate).getTime();
    const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return daysLeft <= 90;
  });

  // Targeted item if opened for a specific cart row
  const targetItem = modalState.targetCartItemId
    ? items.find(i => i.cartItemId === modalState.targetCartItemId)
    : (nearExpiryItems[0] || items[0]);

  // Already claimed gifts in cart
  const claimedGifts = items.filter(i => i.isClearanceGift);

  const handleApplyDiscount = (amountPerUnit: number) => {
    dispatch(applyNearExpiryClearanceDiscount({
      discountPerUnit: amountPerUnit,
      targetCartItemId: modalState.targetCartItemId
    }));
    setActionSuccessMsg(`Applied extra ₹${amountPerUnit} clearance discount per unit!`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleAddGift = (gift: PromoGiftOption) => {
    dispatch(addClearanceGiftToCart({
      giftName: gift.name,
      giftValue: gift.value,
      giftCategory: gift.category,
      giftIcon: gift.icon
    }));
    setActionSuccessMsg(`Added 100% Free "${gift.name}" (Worth ₹${gift.value}) to cart!`);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleRemoveGift = (cartItemId: string) => {
    dispatch(removeClearanceGiftFromCart(cartItemId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/20">
              <Gift className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black font-heading text-slate-900">
                  Near-Expiry Clearance Incentives &amp; Free Gift
                </h3>
                <span className="bg-rose-50 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                  Sheet 1 — Task #16
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Apply extra ₹5–₹10 clearance discount or add free promotional gift item to close the sale fast.
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(setClearanceGiftModalOpen({ isOpen: false }))}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Toast */}
        {actionSuccessMsg && (
          <div className="mt-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl p-2.5 flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-3.5 pr-1">

          {/* Near-Expiry Item Highlight Card */}
          {targetItem ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wide">
                    Near-Expiry Medicine in Cart
                  </span>
                  <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                    Exp: {targetItem.selectedBatch.expiryDate}
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900 mt-1">
                  {targetItem.product.name}
                </p>
                <p className="text-[11px] text-slate-600">
                  Batch: <strong className="font-mono">{targetItem.selectedBatch.batchNumber}</strong> · Price: ₹{targetItem.unitPrice.toFixed(2)} · Current Disc: {targetItem.discountPercent}%
                  {targetItem.clearanceDiscountApplied ? (
                    <span className="ml-2 text-emerald-700 font-extrabold">(₹{targetItem.clearanceDiscountApplied} Clearance Disc Applied)</span>
                  ) : null}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold block">Shelf-Life Urgency</span>
                <span className="inline-block mt-0.5 text-xs font-black px-2.5 py-1 rounded-lg bg-rose-600 text-white shadow-xs">
                  ⚡ Clearance Eligible
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center text-xs text-slate-600">
              Select or apply clearance incentives to cart items.
            </div>
          )}

          {/* Tabs: Choose between Free Gift vs Extra Cash Discount */}
          <div className="flex border-b border-slate-200 gap-2">
            <button
              onClick={() => setActiveTab('GIFT')}
              className={`pb-2 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'GIFT'
                  ? 'border-rose-600 text-rose-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Gift className="w-4 h-4 text-rose-600" />
              <span>Free Promotional Gift (100% Free)</span>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                Recommended
              </span>
            </button>

            <button
              onClick={() => setActiveTab('DISCOUNT')}
              className={`pb-2 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'DISCOUNT'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Extra ₹5–₹10 Cash Discount</span>
            </button>
          </div>

          {/* TAB 1: FREE PROMOTIONAL GIFT CATALOG */}
          {activeTab === 'GIFT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <p className="text-slate-600 font-medium">
                  Select a complimentary gift to add to the bill at <strong>₹0.00</strong> (100% Free).
                </p>
                <span className="text-xs text-rose-600 font-bold">
                  {PROMOTIONAL_GIFTS.length} Promotional Gifts Available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PROMOTIONAL_GIFTS.map((gift) => {
                  const isAdded = claimedGifts.some(cg => cg.product.name.includes(gift.name));
                  return (
                    <div
                      key={gift.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isAdded
                          ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20'
                          : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{gift.icon}</span>
                          <div className="text-right">
                            <span className="text-[10px] line-through text-slate-400 font-bold block">
                              M.R.P ₹{gift.value}
                            </span>
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                              100% FREE
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-black text-slate-900 mt-2 leading-tight">
                          {gift.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          {gift.description}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[9.5px] font-bold text-slate-500">
                          Counter Stock: <strong className="text-slate-700">{gift.stock} pcs</strong>
                        </span>

                        {isAdded ? (
                          <span className="flex items-center space-x-1 text-[10.5px] font-extrabold text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Gift in Cart</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddGift(gift)}
                            className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
                          >
                            <Gift className="w-3 h-3" />
                            <span>Add Free Gift</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Already Added Gifts List */}
              {claimedGifts.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center space-x-1 text-rose-700">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      <span>Promotional Gifts Included in Active Cart:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Total Gift Value: <strong className="text-emerald-700">₹{claimedGifts.reduce((s, g) => s + (g.giftOriginalPrice || 30) * g.quantity, 0)} (FREE)</strong>
                    </span>
                  </div>

                  <div className="space-y-1">
                    {claimedGifts.map(giftItem => (
                      <div key={giftItem.cartItemId} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                        <span className="font-bold text-slate-900 truncate">
                          {giftItem.product.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-emerald-700 font-extrabold text-[11px]">
                            ₹0.00 (Worth ₹{giftItem.giftOriginalPrice || 30})
                          </span>
                          <button
                            onClick={() => handleRemoveGift(giftItem.cartItemId)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5"
                            title="Remove Gift"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXTRA DIRECT CASH DISCOUNT */}
          {activeTab === 'DISCOUNT' && (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-600 font-medium">
                Apply a direct, transparent rupee clearance discount per medicine unit to eliminate customer price objection.
              </p>

              <div className="grid grid-cols-3 gap-2.5">
                {/* ₹5 Discount */}
                <button
                  type="button"
                  onClick={() => handleApplyDiscount(5)}
                  className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 hover:border-emerald-400 transition-all text-left flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200/80 px-1.5 py-0.5 rounded">
                      Standard Clearance
                    </span>
                    <div className="text-xl font-black text-emerald-900 mt-2 font-heading">
                      -₹5.00
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700">
                      Per Strip / Unit
                    </div>
                  </div>
                  <span className="mt-3 text-[10px] font-black text-emerald-800 group-hover:underline">
                    Apply -₹5 Off →
                  </span>
                </button>

                {/* ₹10 Discount */}
                <button
                  type="button"
                  onClick={() => handleApplyDiscount(10)}
                  className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-100/60 hover:bg-emerald-200/70 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-xs"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-300 px-1.5 py-0.5 rounded">
                      ★ Recommended
                    </span>
                    <div className="text-xl font-black text-emerald-950 mt-2 font-heading">
                      -₹10.00
                    </div>
                    <div className="text-[11px] font-bold text-emerald-800">
                      Per Strip / Unit
                    </div>
                  </div>
                  <span className="mt-3 text-[10px] font-black text-emerald-900 group-hover:underline">
                    Apply -₹10 Off →
                  </span>
                </button>

                {/* ₹15 Discount */}
                <button
                  type="button"
                  onClick={() => handleApplyDiscount(15)}
                  className="p-3 rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100 hover:border-amber-400 transition-all text-left flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded">
                      Urgent Batch
                    </span>
                    <div className="text-xl font-black text-amber-950 mt-2 font-heading">
                      -₹15.00
                    </div>
                    <div className="text-[11px] font-bold text-amber-800">
                      Aggressive Clear
                    </div>
                  </div>
                  <span className="mt-3 text-[10px] font-black text-amber-900 group-hover:underline">
                    Apply -₹15 Off →
                  </span>
                </button>
              </div>

              {/* Custom Discount Input */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Custom Clearance Discount:
                  </label>
                  <p className="text-[10.5px] text-slate-500">Enter custom flat rupee amount to deduct per strip/unit</p>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={customDiscount}
                      onChange={(e) => setCustomDiscount(e.target.value)}
                      className="w-24 pl-6 pr-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:outline-emerald-600"
                      min="1"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const val = parseFloat(customDiscount);
                      if (val > 0) handleApplyDiscount(val);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pharmacist Customer Persuasion Tip Script */}
          <div className="bg-slate-100/90 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-800 font-extrabold text-[11px]">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pharmacist Script to Reassure Customer:</span>
            </div>
            <p className="text-[11px] text-slate-600 italic leading-relaxed">
              &ldquo;Sir/Madam, this medicine batch has full clinical potency with 100% active salts. As a pharmacy goodwill clearance offer today, we are giving you an extra ₹10 discount / complimentary Dettol Hand Sanitizer on this purchase!&rdquo;
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between flex-shrink-0 text-xs">
          <div className="text-slate-500 text-[11px]">
            Eligible near-expiry cart items: <strong className="text-slate-800">{nearExpiryItems.length}</strong>
          </div>
          <button
            onClick={() => dispatch(setClearanceGiftModalOpen({ isOpen: false }))}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Done / Close
          </button>
        </div>

      </div>
    </div>
  );
};
