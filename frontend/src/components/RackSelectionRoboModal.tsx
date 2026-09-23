import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../utils/api';
import type { RootState } from '../store';
import { setRackRoboModalOpen, addItemToCart } from '../store/posSlice';
import type { Product, BatchInfo } from '../types/pos';
import {
  X, MapPin, Search, Layers, Box, Check,
  Navigation, Eye, Sparkles, ShoppingCart,
  ArrowRight, ShieldCheck, Info, Compass
} from 'lucide-react';

interface ShelfLocationDetails {
  aisle: number;
  aisleName: string;
  rack: string;
  tier: number;
  tierName: string;
  bin: number;
  zoneColor: string;
}

// Helper to parse location strings like "Rack B-14", "Rack A-04", "Safe Vault Locker-1"
export const parseLocationString = (locStr?: string): ShelfLocationDetails => {
  if (!locStr) {
    return { aisle: 1, aisleName: 'Aisle 1: Generics & OTC', rack: 'A-01', tier: 2, tierName: 'Tier 2 (Eye Level)', bin: 4, zoneColor: 'blue' };
  }

  const upper = locStr.toUpperCase();

  if (upper.includes('VAULT') || upper.includes('SAFE') || upper.includes('LOCKER')) {
    return { aisle: 4, aisleName: 'Aisle 4: High-Value & Narcotics Vault', rack: 'Vault-1', tier: 1, tierName: 'Tier 1 (High Security)', bin: 1, zoneColor: 'rose' };
  }

  if (upper.includes('B-')) {
    const num = parseInt(upper.replace(/\D/g, '')) || 12;
    const tier = (num % 5) + 1;
    return {
      aisle: 2,
      aisleName: 'Aisle 2: Cardiac, Diabetology & Chronic',
      rack: `B-${num < 10 ? '0' + num : num}`,
      tier,
      tierName: `Tier ${tier} (${tier === 2 || tier === 3 ? 'Eye Level' : tier === 1 ? 'Top' : 'Reach'})`,
      bin: (num % 8) + 1,
      zoneColor: 'emerald'
    };
  }

  if (upper.includes('C-') || upper.includes('D-')) {
    const num = parseInt(upper.replace(/\D/g, '')) || 5;
    const tier = (num % 5) + 1;
    return {
      aisle: 3,
      aisleName: 'Aisle 3: Antibiotics, Respiratory & Derma',
      rack: `C-${num < 10 ? '0' + num : num}`,
      tier,
      tierName: `Tier ${tier} (${tier === 2 || tier === 3 ? 'Eye Level' : tier === 1 ? 'Top' : 'Reach'})`,
      bin: (num % 8) + 1,
      zoneColor: 'purple'
    };
  }

  // Default Aisle 1 (Rack A)
  const num = parseInt(upper.replace(/\D/g, '')) || 4;
  const tier = (num % 5) + 1;
  return {
    aisle: 1,
    aisleName: 'Aisle 1: Fast-Moving Generics & OTC',
    rack: `A-${num < 10 ? '0' + num : num}`,
    tier,
    tierName: `Tier ${tier} (${tier === 2 || tier === 3 ? 'Eye Level' : 'Reach'})`,
    bin: (num % 8) + 1,
    zoneColor: 'cyan'
  };
};

export const RackSelectionRoboModal: React.FC = () => {
  const dispatch = useDispatch();
  const modal = useSelector((state: RootState) => state.pos.rackRoboModal);
  const products = useSelector((state: RootState) => state.pos.products);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAisle, setSelectedAisle] = useState<number>(1);
  const [selectedRack, setSelectedRack] = useState<string>('Rack B-14');

  // Initialize selected rack from modal payload
  useEffect(() => {
    if (!modal?.isOpen) return;
    if (modal.targetLocation) {
      const parsed = parseLocationString(modal.targetLocation);
      setSelectedAisle(parsed.aisle);
      setSelectedRack(parsed.rack);
    } else if (modal.targetProductName) {
      const prod = products.find(p => p.name.toLowerCase().includes(modal.targetProductName!.toLowerCase()));
      const loc = prod?.batches[0]?.location || 'Rack B-14';
      const parsed = parseLocationString(loc);
      setSelectedAisle(parsed.aisle);
      setSelectedRack(parsed.rack);
    }
  }, [modal?.isOpen, modal?.targetLocation, modal?.targetProductName, products]);

  // Early return MUST happen after all React hooks are executed unconditionally
  if (!modal || !modal.isOpen) return null;

  const targetParsed = parseLocationString(modal.targetLocation || 'Rack B-14');

  // Medicines residing in the currently selected rack (with optional search filter)
  const medicinesInCurrentRack = products.filter(p => {
    const matchesRack = p.batches.some(b => (b.location || '').toLowerCase().includes(selectedRack.toLowerCase().replace('rack ', '')));
    if (!searchQuery.trim()) return matchesRack;
    const query = searchQuery.toLowerCase();
    return matchesRack && (p.name.toLowerCase().includes(query) || (p.saltComposition || '').toLowerCase().includes(query));
  });

  const handleClose = () => {
    dispatch(setRackRoboModalOpen({ isOpen: false }));
  };

  const handleSelectMedicineFromMap = (prod: Product) => {
    const batch = prod.batches.find(b => b.stockQuantity > 0) || prod.batches[0];
    if (batch) {
      dispatch(addItemToCart({
        product: prod,
        selectedBatch: batch,
        quantity: 1,
        unitMode: 'PACK'
      }));
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black tracking-tight font-heading text-white">
                  Rack Selection Robo
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                  Interactive 2D Pharmacy Floor Plan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Physical shelf picker coordinates, aisle navigation &amp; storage bin locator
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {modal.targetProductName && (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-400">Target:</span>
                <span className="font-extrabold text-cyan-300">{modal.targetProductName}</span>
                <span className="text-[10px] bg-cyan-500/30 text-cyan-200 px-1.5 py-0.2 rounded font-mono">
                  {modal.targetLocation || targetParsed.rack}
                </span>
              </div>
            )}

            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── BODY ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50 select-none">

          {/* Top Picker Guidance Banner */}
          <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-md border border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider">
                  Real-Time Picker Route Guidance
                </span>
                <div className="text-xs font-bold text-slate-100 flex items-center space-x-1.5 mt-0.5 flex-wrap">
                  <span>Start: Counter Desk</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-cyan-300 font-extrabold">Aisle {targetParsed.aisle}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-emerald-300 font-extrabold">Rack {targetParsed.rack}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-amber-300 font-extrabold">{targetParsed.tierName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded text-[10px]">
                    Bin {targetParsed.bin}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              Approx. Retrieval Time: <strong className="text-white">~14 Seconds</strong>
            </div>
          </div>

          {/* 2D Graphical Floor Plan (Aisles 1–4) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-heading flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-600" />
                <span>Pharmacy Floor Layout (Top-Down 2D Map)</span>
              </h3>
              <span className="text-[11px] text-slate-400">Click any aisle or rack to inspect shelf tiers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 1,
                  name: 'Aisle 1: Generics & OTC',
                  color: 'cyan',
                  racks: ['Rack A-01', 'Rack A-02', 'Rack A-03', 'Rack A-04', 'Rack A-05', 'Rack A-06'],
                  desc: 'Fast-moving paracetamol, antacids, vitamins'
                },
                {
                  id: 2,
                  name: 'Aisle 2: Cardiac & Chronic',
                  color: 'emerald',
                  racks: ['Rack B-01', 'Rack B-08', 'Rack B-12', 'Rack B-14', 'Rack B-15', 'Rack B-16'],
                  desc: 'Telmisartan, Metformin, Atorvastatin, BP care'
                },
                {
                  id: 3,
                  name: 'Aisle 3: Antibiotics & Derma',
                  color: 'purple',
                  racks: ['Rack C-02', 'Rack C-05', 'Rack C-08', 'Rack C-10', 'Rack C-12'],
                  desc: 'Augmentin, Azithromycin, Ointments, Eye drops'
                },
                {
                  id: 4,
                  name: 'Aisle 4: High-Value & Vault',
                  color: 'rose',
                  racks: ['Rack D-01', 'Rack E-01', 'Safe Vault Locker-1', 'Narcotics Vault L-2'],
                  desc: 'Schedule X, Narcotics & Refrigerator cold chain'
                }
              ].map(aisle => {
                const isSelected = selectedAisle === aisle.id;
                const containsTarget = targetParsed.aisle === aisle.id;

                return (
                  <div
                    key={aisle.id}
                    onClick={() => {
                      setSelectedAisle(aisle.id);
                      setSelectedRack(aisle.racks[0]);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                      containsTarget
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-400/30'
                        : isSelected
                        ? 'border-slate-800 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {containsTarget && (
                      <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center space-x-1 animate-bounce">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>TARGET LOCATED</span>
                      </span>
                    )}

                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-black text-slate-900 font-heading">
                        {aisle.name}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-1">
                      {aisle.desc}
                    </p>

                    {/* Racks Grid within Aisle */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                      {aisle.racks.map(rk => {
                        const isTargetRack = targetParsed.rack.toLowerCase() === rk.toLowerCase() ||
                          (targetParsed.rack.replace('Rack ', '').toLowerCase() === rk.replace('Rack ', '').toLowerCase());
                        const isRackActive = selectedRack.toLowerCase() === rk.toLowerCase();

                        return (
                          <button
                            key={rk}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAisle(aisle.id);
                              setSelectedRack(rk);
                            }}
                            className={`px-2 py-1.5 rounded-xl text-[10px] font-bold text-center border transition-all cursor-pointer ${
                              isTargetRack
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-black animate-pulse'
                                : isRackActive
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {rk}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Counter Checkout Desk Reference */}
            <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-slate-900 inline-block"></span>
                <span className="font-bold text-slate-900">Billing Counter &amp; Pharmacist Dispense Station</span>
                <span className="text-[10px] text-slate-400 font-mono">(Floor Origin: X:0, Y:0)</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-semibold">
                Walking Aisle Clearance: 4.5 ft
              </span>
            </div>
          </div>

          {/* Vertical Shelf Elevation View (Selected Rack) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-heading flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Rack Elevation &amp; Storage Bins: {selectedRack}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  5 vertical shelving tiers with itemized bin storage slots
                </p>
              </div>

              <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl">
                {medicinesInCurrentRack.length} Medicine(s) Stored Here
              </span>
            </div>

            {/* 5 Vertical Shelves */}
            <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50">
              {[
                { tier: 1, name: 'Tier 1: Top Shelf (Height: 6.2 ft)', tag: 'Bulk Reserves / Low-Turnover', color: 'slate' },
                { tier: 2, name: 'Tier 2: Upper Eye-Level (Height: 5.0 ft)', tag: 'Fast-Moving Chronic Tablets', color: 'emerald' },
                { tier: 3, name: 'Tier 3: Lower Eye-Level (Height: 4.2 ft)', tag: 'High-Demand Daily Essentials', color: 'cyan' },
                { tier: 4, name: 'Tier 4: Waist-Level (Height: 3.0 ft)', tag: 'Liquid Syrups & Ointments', color: 'amber' },
                { tier: 5, name: 'Tier 5: Floor Shelf (Height: 1.2 ft)', tag: 'Heavy Cartons & Infusions', color: 'slate' }
              ].map(shelf => {
                const isTargetTier = targetParsed.tier === shelf.tier &&
                  (targetParsed.rack.toLowerCase().includes(selectedRack.toLowerCase().replace('rack ', '')));

                return (
                  <div
                    key={shelf.tier}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isTargetTier
                        ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-800">{shelf.name}</span>
                        <span className="text-[9.5px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-full font-medium">
                          {shelf.tag}
                        </span>
                      </div>
                      {isTargetTier && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full flex items-center space-x-1 animate-pulse">
                          <Check className="w-2.5 h-2.5" />
                          <span>PICK HERE (BIN {targetParsed.bin})</span>
                        </span>
                      )}
                    </div>

                    {/* Bins on this shelf */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mt-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(binNum => {
                        const isTargetBin = isTargetTier && targetParsed.bin === binNum;

                        return (
                          <div
                            key={binNum}
                            className={`p-1.5 rounded-lg border text-center transition-all ${
                              isTargetBin
                                ? 'bg-emerald-600 border-emerald-600 text-white font-black shadow-xs ring-2 ring-emerald-300'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className="text-[9px] uppercase font-mono font-bold">
                              Bin {binNum < 10 ? '0' + binNum : binNum}
                            </div>
                            <div className="text-[8px] opacity-75 mt-0.5">
                              {isTargetBin ? '⭐ Target' : 'Available'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Medicines Currently Placed in This Rack */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-heading">
              Medicines Stored in {selectedRack} ({medicinesInCurrentRack.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {medicinesInCurrentRack.length === 0 ? (
                <div className="col-span-3 py-6 text-center text-slate-400 text-xs">
                  No medicines cataloged at {selectedRack} yet.
                </div>
              ) : (
                medicinesInCurrentRack.map(p => (
                  <div
                    key={p._id}
                    className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{p.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Stock: <strong className="text-emerald-700">{p.totalStock}</strong> · ₹{p.sellingPrice.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectMedicineFromMap(p)}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs cursor-pointer active:scale-95 transition-all"
                      title="Add to Active POS Cart"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-cyan-600" />
            <span>
              Rack Robo coordinates sync dynamically with product batch locations and shelf put-away tasks.
            </span>
          </div>
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
          >
            Close Map
          </button>
        </div>

      </div>
    </div>
  );
};
