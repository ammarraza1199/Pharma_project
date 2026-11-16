import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  closeMedicineInspectionModal,
  setMedicineInspectionTab,
  addItemToCart,
  setRackRoboModalOpen,
  setMultiStoreModalOpen,
  setPatientInstructionModalOpen
} from '../store/posSlice';
import { getMedicineDetails } from '../utils/medicineDetails';
import { getSortedBatchesFEFO, getEarliestExpiringBatch } from '../utils/fefoHelper';
import type { BatchInfo, Product, ScheduleCategory } from '../types/pos';
import {
  X,
  DollarSign,
  Package,
  ArrowRightLeft,
  AlertTriangle,
  MapPin,
  Clock,
  Sparkles,
  TrendingUp,
  Percent,
  Layers,
  Building2,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Volume2,
  Check,
  Zap,
  Info,
  Calendar,
  Thermometer,
  Pill,
  HeartPulse,
  Share2
} from 'lucide-react';

export const MedicineInspectionModal: React.FC = () => {
  const dispatch = useDispatch();
  const inspection = useSelector((state: RootState) => state.pos.medicineInspectionModal);
  const allProducts = useSelector((state: RootState) => state.pos.products || []);

  const isOpen = inspection?.isOpen;
  const product = inspection?.product;
  const activeTab = inspection?.activeTab || 'PRICING';

  const [selectedBatch, setSelectedBatch] = useState<BatchInfo | null>(null);
  const [dispenseQty, setDispenseQty] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Sync selected batch on modal open
  useEffect(() => {
    if (product?.batches && product.batches.length > 0) {
      const fefo = getEarliestExpiringBatch(product.batches) || product.batches[0];
      setSelectedBatch(fefo);
      setDispenseQty(1);
    }
  }, [product]);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        dispatch(closeMedicineInspectionModal());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dispatch]);

  // Salt-based generic alternatives lookup
  const genericSubstitutes = useMemo(() => {
    if (!product || !product.saltComposition) return [];
    const currentSaltClean = product.saltComposition.toLowerCase().replace(/[^a-z0-9]/g, '');
    const currentTokens = product.saltComposition
      .toLowerCase()
      .split(/[\s+,/]+/)
      .filter(t => t.length > 3 && !t.includes('mg') && !t.includes('tablet') && !t.includes('capsule'));

    return allProducts.filter(p => {
      if (p._id === product._id) return false;
      if (!p.saltComposition) return false;

      const otherSaltClean = p.saltComposition.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (otherSaltClean === currentSaltClean) return true;

      // Token match
      return currentTokens.some(token => p.saltComposition.toLowerCase().includes(token));
    });
  }, [product, allProducts]);

  if (!isOpen || !product) return null;

  const medDetails = getMedicineDetails(product);
  const sortedBatches = getSortedBatchesFEFO(product.batches || []);
  const earliestBatch = getEarliestExpiringBatch(product.batches || []) || sortedBatches[0];

  // Pricing & margin calculations
  const mrp = product.unitMRP || product.sellingPrice * 1.15;
  const sellingPrice = product.sellingPrice || mrp;
  const marginPct = product.grossMarginPercent || 20;
  const estimatedCost = sellingPrice * (1 - marginPct / 100);
  const grossProfitAmount = sellingPrice - estimatedCost;
  const perTabletPrice = medDetails.unitsPerPack > 1 ? sellingPrice / medDetails.unitsPerPack : sellingPrice;
  const perTabletCost = medDetails.unitsPerPack > 1 ? estimatedCost / medDetails.unitsPerPack : estimatedCost;

  // Schedule badge styling
  const getScheduleStyle = (cat: ScheduleCategory) => {
    switch (cat) {
      case 'SCHEDULE_X':
        return { label: 'Schedule X (Strict Narcotic)', cls: 'bg-rose-600 text-white animate-pulse' };
      case 'SCHEDULE_H1':
        return { label: 'Schedule H1 (Prescription Only)', cls: 'bg-orange-500 text-white' };
      case 'SCHEDULE_H':
        return { label: 'Schedule H (Rx Required)', cls: 'bg-amber-500 text-white' };
      default:
        return { label: 'Regular / OTC Form', cls: 'bg-emerald-600 text-white' };
    }
  };

  const scheduleInfo = getScheduleStyle(product.scheduleCategory);

  const handleAddToCart = (batchToUse?: BatchInfo) => {
    const targetBatch = batchToUse || selectedBatch || earliestBatch;
    if (!targetBatch) return;

    dispatch(
      addItemToCart({
        product,
        selectedBatch: targetBatch,
        quantity: dispenseQty,
        unitMode: 'PACK'
      })
    );

    setAddedToast(`Added ${dispenseQty} pack(s) of ${product.name} to cart!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const handleAddSubstitute = (sub: Product) => {
    const fefoSubBatch = getEarliestExpiringBatch(sub.batches || []) || sub.batches[0];
    if (!fefoSubBatch) return;

    dispatch(
      addItemToCart({
        product: sub,
        selectedBatch: fefoSubBatch,
        quantity: 1,
        unitMode: 'PACK'
      })
    );

    setAddedToast(`Added substitute ${sub.name} to cart!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* ── 1. MODAL HEADER ── */}
        <div className="p-4 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 border-b border-slate-200 flex items-start justify-between shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-1">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${scheduleInfo.cls}`}>
                {scheduleInfo.label}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                {medDetails.medicineType} • {medDetails.dosageForm}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full">
                {medDetails.packSize}
              </span>
            </div>

            <h2 className="text-lg font-black text-slate-900 font-heading leading-tight truncate" title={product.name}>
              {product.name}
            </h2>

            <div className="flex items-center space-x-2 text-xs text-slate-600 mt-0.5">
              <span className="font-semibold text-slate-700 truncate" title={product.saltComposition}>
                {product.saltComposition || 'Standard Pharmaceutical Formulation'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">Mfg: {product.brand || 'Licensed Manufacturer'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => dispatch(setPatientInstructionModalOpen({ isOpen: true }))}
              className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer border border-slate-200 shadow-2xs"
              title="Open Patient Audio PIL Instructions"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => dispatch(closeMedicineInspectionModal())}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close Inspection Modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 2. 4 SEGMENTED NAVIGATION TABS ── */}
        <div className="px-4 pt-2.5 pb-2 bg-slate-50 border-b border-slate-200 shrink-0">
          <nav className="flex space-x-1.5 p-1 bg-slate-200/60 rounded-xl">
            <button
              onClick={() => dispatch(setMedicineInspectionTab('PRICING'))}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'PRICING'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Pricing &amp; Margins</span>
            </button>

            <button
              onClick={() => dispatch(setMedicineInspectionTab('BATCH_SHELF'))}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'BATCH_SHELF'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-teal-600" />
              <span>2. Batch Shelf Locations</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold border">
                {product.batches?.length || 0}
              </span>
            </button>

            <button
              onClick={() => dispatch(setMedicineInspectionTab('SUBSTITUTES'))}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SUBSTITUTES'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Generic Substitutes</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
                {genericSubstitutes.length}
              </span>
            </button>

            <button
              onClick={() => dispatch(setMedicineInspectionTab('WARNINGS'))}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'WARNINGS'
                  ? 'bg-white text-rose-800 shadow-xs ring-1 ring-rose-500 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>4. Usage Warnings</span>
            </button>
          </nav>
        </div>

        {/* ── 3. TAB CONTENT WORKSPACE ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Added Toast Notification */}
          {addedToast && (
            <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
              <span className="text-xs font-bold">{addedToast}</span>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 1: PRICING & MARGINS                                      */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'PRICING' && (
            <div className="space-y-4 animate-fadeIn">
              {/* 4 Primary Financial Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    MRP (Max Retail)
                  </span>
                  <div className="text-lg font-black text-slate-800 font-heading mt-0.5">
                    ₹{mrp.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Printed box price</span>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Counter Selling Price
                  </span>
                  <div className="text-lg font-black text-emerald-700 font-heading mt-0.5">
                    ₹{sellingPrice.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {mrp > sellingPrice ? `₹${(mrp - sellingPrice).toFixed(2)} (${(((mrp - sellingPrice) / mrp) * 100).toFixed(0)}% Off)` : 'At Standard Rate'}
                  </span>
                </div>

                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                    Wholesale Purchase Cost
                  </span>
                  <div className="text-lg font-black text-blue-700 font-heading mt-0.5">
                    ₹{estimatedCost.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">Distributor net rate</span>
                </div>

                <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                    Gross Margin %
                  </span>
                  <div className="text-lg font-black text-purple-700 font-heading mt-0.5">
                    {marginPct.toFixed(1)}%
                  </div>
                  <span className="text-[10px] text-purple-700 font-bold">
                    +₹{grossProfitAmount.toFixed(2)} profit / pack
                  </span>
                </div>
              </div>

              {/* Unit Economics & Loose Strip Cutting */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide font-heading">
                    Pack Structure &amp; Unit Economics
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-bold block">Pack Configuration</span>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      {medDetails.unitsPerPack} {medDetails.dosageForm}s in 1 {medDetails.packType}
                    </p>
                    <span className="text-[10px] text-slate-400">Standard packaging</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-bold block">Loose Tablet Dispensing Price</span>
                    <p className="text-xs font-black text-emerald-700 mt-0.5">
                      ₹{perTabletPrice.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">/ {medDetails.dosageForm.toLowerCase()}</span>
                    </p>
                    <span className="text-[10px] text-emerald-600 font-medium">Supports strip cutting</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 font-bold block">Loose Tablet Purchase Cost</span>
                    <p className="text-xs font-black text-slate-700 mt-0.5">
                      ₹{perTabletCost.toFixed(2)} <span className="text-[10px] font-normal text-slate-500">/ {medDetails.dosageForm.toLowerCase()}</span>
                    </p>
                    <span className="text-[10px] text-slate-400">Wholesale cost basis</span>
                  </div>
                </div>
              </div>

              {/* GST & Tax Compliance */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Percent className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide font-heading">
                      GST Tax Breakdown &amp; HSN Compliance
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md">
                    HSN: {product.hsnCode || '3004.90'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block">CGST (Central)</span>
                    <span className="text-xs font-black text-slate-800">{((product.gstRate || 12) / 2).toFixed(1)}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block">SGST (State)</span>
                    <span className="text-xs font-black text-slate-800">{((product.gstRate || 12) / 2).toFixed(1)}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block">IGST (Inter-State)</span>
                    <span className="text-xs font-black text-slate-800">{(product.gstRate || 12).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 2: BATCH SHELF LOCATIONS                                  */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'BATCH_SHELF' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Floor Plan & Stock Overview */}
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                      Pharmacy Shelf Location
                    </span>
                    <div className="text-sm font-black text-slate-900 font-heading">
                      {earliestBatch?.location || 'Rack B-02, Shelf 3 (Dispense Bay A)'}
                    </div>
                    <span className="text-[10px] text-teal-700">
                      Total Stock: <strong className="text-teal-900">{product.totalStock} units</strong> across {product.batches?.length || 0} batches
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => dispatch(setRackRoboModalOpen({
                    isOpen: true,
                    targetProductName: product.name,
                    targetLocation: earliestBatch?.location || 'Rack B-02'
                  }))}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Locate on 2D Robo Map</span>
                </button>
              </div>

              {/* Batches Table (Sorted FEFO) */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide font-heading">
                      Active Batches (FEFO Dispensing Queue)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Earliest expiring batch automatically prioritized
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Batch Number</th>
                      <th className="py-2.5 px-2">Expiry Date</th>
                      <th className="py-2.5 px-2 text-center">Available Stock</th>
                      <th className="py-2.5 px-2">Shelf Rack</th>
                      <th className="py-2.5 px-2 text-right">MRP / Unit</th>
                      <th className="py-2.5 px-3 text-right">Dispense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedBatches.map((batch, idx) => {
                      const exp = new Date(batch.expiryDate);
                      const now = new Date();
                      const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      const isExpired = daysLeft <= 0;
                      const isNear = !isExpired && daysLeft <= 60;
                      const isFirst = idx === 0;

                      return (
                        <tr
                          key={batch.batchNumber}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            selectedBatch?.batchNumber === batch.batchNumber ? 'bg-emerald-50/60 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{batch.batchNumber}</span>
                              {isFirst && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  ⚡ FEFO First
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-2">
                            <div className="text-slate-800 font-medium">
                              {batch.expiryDate}
                            </div>
                            <span className={`text-[9.5px] font-bold ${
                              isExpired
                                ? 'text-rose-600'
                                : isNear
                                  ? 'text-amber-600'
                                  : 'text-slate-400'
                            }`}>
                              {isExpired ? 'EXPIRED' : `${daysLeft} days remaining`}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              batch.stockQuantity <= 10
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {batch.stockQuantity} units
                            </span>
                          </td>

                          <td className="py-3 px-2">
                            <span className="text-slate-700 font-medium flex items-center space-x-1">
                              <MapPin className="w-2.5 h-2.5 text-slate-400" />
                              <span>{batch.location || 'Rack B-01'}</span>
                            </span>
                          </td>

                          <td className="py-3 px-2 text-right font-black text-slate-800">
                            ₹{(batch.mrp || product.sellingPrice).toFixed(2)}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedBatch(batch);
                                handleAddToCart(batch);
                              }}
                              disabled={isExpired}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isExpired
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                              }`}
                            >
                              + Add Batch
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 3: GENERIC SUBSTITUTES                                    */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'SUBSTITUTES' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-blue-900 font-heading">
                    Active Molecule / Salt Formula
                  </h4>
                  <p className="text-xs text-blue-800 font-semibold mt-0.5">
                    {product.saltComposition || 'Standard Molecule Match'}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-white text-blue-800 border border-blue-200 rounded-lg">
                  {genericSubstitutes.length} Available In Stock
                </span>
              </div>

              {genericSubstitutes.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">No Direct Generic Substitutes in Local Store</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Check peer store branches or wholesale godowns for stock transfer.
                    </p>
                  </div>
                  <button
                    onClick={() => dispatch(setMultiStoreModalOpen({ isOpen: true, selectedProductId: product._id }))}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Check Multi-Store Stock Loans</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {genericSubstitutes.map(sub => {
                    const priceDiff = product.sellingPrice - sub.sellingPrice;
                    const isCheaper = priceDiff > 0;
                    const pctDiff = Math.abs((priceDiff / product.sellingPrice) * 100);

                    return (
                      <div
                        key={sub._id}
                        className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="text-xs font-black text-slate-900 leading-tight">
                                {sub.name}
                              </h5>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Mfg: {sub.brand || 'Pharma Lab'}
                              </span>
                            </div>
                            <span className="text-xs font-black text-slate-800">
                              ₹{sub.sellingPrice.toFixed(2)}
                            </span>
                          </div>

                          {/* Savings / Margin badges */}
                          <div className="mt-2.5 flex items-center space-x-2 flex-wrap gap-y-1">
                            {isCheaper ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300 flex items-center space-x-1">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-700" />
                                <span>Patient Saves ₹{priceDiff.toFixed(2)} ({pctDiff.toFixed(0)}%)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                Similar Price Bracket
                              </span>
                            )}

                            <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md border border-purple-300">
                              Margin: {sub.grossMarginPercent || 25}%
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 mt-2">
                            Stock: <strong>{sub.totalStock} units</strong> in store
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Exact Salt Match</span>
                          <button
                            onClick={() => handleAddSubstitute(sub)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center space-x-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Dispense Substitute</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 4: USAGE WARNINGS & CLINICAL GUIDE                        */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'WARNINGS' && (
            <div className="space-y-4 animate-fadeIn">
              {/* CDSCO Regulatory Banner */}
              <div className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
                product.scheduleCategory === 'SCHEDULE_X'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : product.scheduleCategory === 'SCHEDULE_H1'
                    ? 'bg-orange-50 border-orange-300 text-orange-900'
                    : product.scheduleCategory === 'SCHEDULE_H'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider font-heading">
                    {scheduleInfo.label} — Regulatory Mandatory Notice
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed">
                    {product.scheduleCategory === 'SCHEDULE_X' &&
                      'Schedule X Drug: Requires dual-lock cabinet storage. Dispense only against registered medical practitioner Rx with doctor registration number. Retain duplicate prescription records for 2 years.'}
                    {product.scheduleCategory === 'SCHEDULE_H1' &&
                      'Schedule H1 Drug: Warning: Dangerous to take without medical advice. Mandatory prescription register logging required. Retain records for 2 years for drug inspector audit.'}
                    {product.scheduleCategory === 'SCHEDULE_H' &&
                      'Schedule H Prescription Drug: Warning: To be sold by retail on the prescription of a Registered Medical Practitioner only. Do not dispense without valid Rx.'}
                    {product.scheduleCategory === 'REGULAR' &&
                      'Standard Formulation: General over-the-counter or non-restricted medicinal category. Safe for standard retail dispensing.'}
                  </p>
                </div>
              </div>

              {/* Clinical Guidelines Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Storage Conditions */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center space-x-2 text-slate-800">
                    <Thermometer className="w-4 h-4 text-cyan-600" />
                    <span className="text-xs font-black uppercase tracking-wide">Storage Conditions</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Store below 25°C in a cool, dry place. Protect from direct heat, sunlight and moisture. Keep out of reach of children.
                  </p>
                </div>

                {/* Dosage Administration */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center space-x-2 text-slate-800">
                    <Pill className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black uppercase tracking-wide">Route &amp; Administration</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Administer {medDetails.medicineType.toLowerCase()} as prescribed. Swallow whole with a glass of water. Take with or after food to minimize gastric irritation.
                  </p>
                </div>

                {/* Clinical Precautions */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center space-x-2 text-slate-800">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-black uppercase tracking-wide">Contraindications &amp; Precautions</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Exercise caution during pregnancy &amp; lactation. Consult physician for renal or hepatic dose adjustments. Avoid concurrent consumption of alcohol.
                  </p>
                </div>

                {/* Common Side Effects */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center space-x-2 text-slate-800">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black uppercase tracking-wide">Common Side Effects</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mild nausea, transient abdominal discomfort, headache or mild drowsiness. Contact doctor if allergic rash, swelling or difficulty breathing occurs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. MODAL FOOTER CONTROLS ── */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">Dispense Qty:</span>
            <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setDispenseQty(q => Math.max(1, q - 1))}
                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                −
              </button>
              <span className="px-2.5 text-xs font-black text-slate-900 min-w-[28px] text-center">
                {dispenseQty}
              </span>
              <button
                type="button"
                onClick={() => setDispenseQty(q => q + 1)}
                className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                +
              </button>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              = ₹{(sellingPrice * dispenseQty).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => dispatch(closeMedicineInspectionModal())}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => handleAddToCart()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add {dispenseQty} Pack{dispenseQty > 1 ? 's' : ''} to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

