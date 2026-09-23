import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { DistributorScheme } from '../types/pos';
import {
  Sparkles, Tag, TrendingUp, DollarSign, Award, Clock,
  CheckCircle2, ShoppingCart, ArrowRight, Layers, Percent,
  Building, ShieldCheck, Filter, Search, Zap
} from 'lucide-react';

interface Props {
  onSelectDealForPO?: (scheme: DistributorScheme) => void;
  onSelectProductForPO?: (productId: string, supplierId: string) => void;
}

interface PriceComparisonRow {
  molecule: string;
  brandName: string;
  packType: string;
  mrp: number;
  rates: {
    supplierId: string;
    supplierName: string;
    rate: number;
    schemeAvailable?: string;
    isLowest: boolean;
  }[];
  bestSupplier: string;
  lowestRate: number;
  highestRate: number;
  potentialSavingsPercent: number;
  marginAtLowestRate: number;
}

export const ProcurementIntelligence: React.FC<Props> = ({
  onSelectDealForPO,
  onSelectProductForPO
}) => {
  const schemes = useSelector((state: RootState) => state.pos.distributorSchemes);
  const suppliers = useSelector((state: RootState) => state.pos.suppliers);

  const [selectedDealType, setSelectedDealType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Molecules Price Comparison Across Registered Distributors
  const comparisonMatrix: PriceComparisonRow[] = [
    {
      molecule: 'Pantoprazole Sodium 40mg',
      brandName: 'Pantocid 40mg Tablet',
      packType: 'Strip of 10 Tablets',
      mrp: 165,
      rates: [
        { supplierId: 'sup-002', supplierName: 'Sun Pharma Wholesale Depot', rate: 98, schemeAvailable: '10+2 Free (Effective ₹81.6)', isLowest: true },
        { supplierId: 'sup-001', supplierName: 'MedLife Distributors Pvt Ltd', rate: 108, isLowest: false },
        { supplierId: 'sup-003', supplierName: 'Cipla Regional Depot', rate: 104, isLowest: false },
        { supplierId: 'sup-004', supplierName: "Dr. Reddy's Logistics", rate: 102, isLowest: false },
      ],
      bestSupplier: 'Sun Pharma Wholesale Depot',
      lowestRate: 98,
      highestRate: 108,
      potentialSavingsPercent: 9.3,
      marginAtLowestRate: 40.6
    },
    {
      molecule: 'Montelukast 10mg + Levocetirizine 5mg',
      brandName: 'Montek-LC Tablet',
      packType: 'Strip of 10 Tablets',
      mrp: 210,
      rates: [
        { supplierId: 'sup-001', supplierName: 'MedLife Distributors Pvt Ltd', rate: 110, schemeAvailable: 'Flat 30% Off Rebate', isLowest: true },
        { supplierId: 'sup-002', supplierName: 'Sun Pharma Wholesale Depot', rate: 128, isLowest: false },
        { supplierId: 'sup-003', supplierName: 'Cipla Regional Depot', rate: 122, isLowest: false },
        { supplierId: 'sup-004', supplierName: "Dr. Reddy's Logistics", rate: 125, isLowest: false },
      ],
      bestSupplier: 'MedLife Distributors Pvt Ltd',
      lowestRate: 110,
      highestRate: 128,
      potentialSavingsPercent: 14.1,
      marginAtLowestRate: 47.6
    },
    {
      molecule: 'Formoterol Fumarate + Budesonide',
      brandName: 'Foracort 200 Inhaler',
      packType: 'Inhaler Canister',
      mrp: 495,
      rates: [
        { supplierId: 'sup-003', supplierName: 'Cipla Regional Depot', rate: 345, schemeAvailable: '5+1 Free Respules Pack', isLowest: true },
        { supplierId: 'sup-001', supplierName: 'MedLife Distributors Pvt Ltd', rate: 370, isLowest: false },
        { supplierId: 'sup-002', supplierName: 'Sun Pharma Wholesale Depot', rate: 365, isLowest: false },
        { supplierId: 'sup-004', supplierName: "Dr. Reddy's Logistics", rate: 368, isLowest: false },
      ],
      bestSupplier: 'Cipla Regional Depot',
      lowestRate: 345,
      highestRate: 370,
      potentialSavingsPercent: 6.8,
      marginAtLowestRate: 30.3
    },
    {
      molecule: 'Omeprazole 20mg',
      brandName: 'Omez 20mg Capsule',
      packType: 'Strip of 20 Capsules',
      mrp: 130,
      rates: [
        { supplierId: 'sup-004', supplierName: "Dr. Reddy's Logistics", rate: 74, schemeAvailable: '15+3 Free Wholesale Saver', isLowest: true },
        { supplierId: 'sup-001', supplierName: 'MedLife Distributors Pvt Ltd', rate: 84, isLowest: false },
        { supplierId: 'sup-002', supplierName: 'Sun Pharma Wholesale Depot', rate: 80, isLowest: false },
        { supplierId: 'sup-003', supplierName: 'Cipla Regional Depot', rate: 79, isLowest: false },
      ],
      bestSupplier: "Dr. Reddy's Direct Supply Logistics",
      lowestRate: 74,
      highestRate: 84,
      potentialSavingsPercent: 11.9,
      marginAtLowestRate: 43.1
    },
    {
      molecule: 'Paracetamol 650mg',
      brandName: 'Dolo 650 Tablet',
      packType: 'Strip of 15 Tablets',
      mrp: 34.5,
      rates: [
        { supplierId: 'sup-001', supplierName: 'MedLife Distributors Pvt Ltd', rate: 23.8, schemeAvailable: 'Bulk Tier Rate', isLowest: true },
        { supplierId: 'sup-002', supplierName: 'Sun Pharma Wholesale Depot', rate: 24.5, isLowest: false },
        { supplierId: 'sup-003', supplierName: 'Cipla Regional Depot', rate: 24.2, isLowest: false },
        { supplierId: 'sup-004', supplierName: "Dr. Reddy's Logistics", rate: 24.9, isLowest: false },
      ],
      bestSupplier: 'MedLife Distributors Pvt Ltd',
      lowestRate: 23.8,
      highestRate: 24.9,
      potentialSavingsPercent: 4.4,
      marginAtLowestRate: 31.0
    }
  ];

  // Filter schemes
  const filteredSchemes = schemes.filter(s => {
    if (selectedDealType !== 'ALL' && s.dealType !== selectedDealType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchSupplier = s.supplierName.toLowerCase().includes(q);
      const matchProd = (s.primaryProduct || '').toLowerCase().includes(q);
      const matchSalt = (s.saltComposition || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSupplier && !matchProd && !matchSalt) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* ── INTELLIGENCE HEADER CARDS ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-2 bottom-2 text-white/10 pointer-events-none">
            <Zap className="w-24 h-24" />
          </div>
          <div className="flex items-center space-x-2 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Procurement Margin Maximizer</span>
          </div>
          <h3 className="text-2xl font-black font-heading mt-1">Up to 67.8%</h3>
          <p className="text-xs text-emerald-100 mt-1">
            Available gross margin on distributor generic picks vs branded stock procurement.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Distributor Deals</span>
            <div className="text-2xl font-black text-slate-900 font-heading mt-0.5">
              {schemes.length} Active Schemes
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              Across Sun Pharma, Cipla, MedLife &amp; Dr. Reddy's
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arbitrage Savings Potential</span>
            <div className="text-2xl font-black text-blue-900 font-heading mt-0.5">
              ₹14,800/mo
            </div>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
              Estimated savings by routing orders to lowest-rate wholesalers
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── SECTION 1: DISTRIBUTOR SCHEMES & COMBO DEALS ─────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 font-heading flex items-center space-x-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Distributor Schemes, Combos &amp; Trade Rebates</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verified promotional wholesale schemes providing free units, volume rebates, and high retailer margins
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scheme..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div className="flex space-x-1">
              <button
                onClick={() => setSelectedDealType('ALL')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedDealType === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedDealType('BUY_X_GET_Y')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedDealType === 'BUY_X_GET_Y' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Buy X Get Y
              </button>
              <button
                onClick={() => setSelectedDealType('COMBO_OFFER')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedDealType === 'COMBO_OFFER' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Combos
              </button>
            </div>
          </div>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSchemes.map(sch => (
            <div
              key={sch.schemeId}
              className="border border-slate-200 hover:border-emerald-300 rounded-2xl p-3.5 bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Tag & Supplier */}
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 tracking-wide">
                    {sch.badgeTag || 'WHOLESALE DEAL'}
                  </span>
                  <div className="text-[10px] text-slate-500 font-semibold flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Valid till: {sch.validTill}</span>
                  </div>
                </div>

                <h4 className="text-xs font-black text-slate-900 font-heading">
                  {sch.title}
                </h4>

                <div className="text-[11px] text-slate-600 font-semibold mt-1 flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Wholesaler: <strong className="text-slate-800">{sch.supplierName}</strong></span>
                </div>

                {/* Deal Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 mt-2.5 bg-white p-2 rounded-xl border border-slate-200 text-center">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Deal Terms</div>
                    <div className="text-xs font-black text-slate-800">
                      {sch.buyQuantity ? `Buy ${sch.buyQuantity} + ${sch.freeQuantity} Free` : 'Rebate Scheme'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Wholesale Discount</div>
                    <div className="text-xs font-black text-blue-700">
                      {sch.discountPercent}% Off
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">Effective Margin</div>
                    <div className="text-xs font-black text-emerald-700">
                      {sch.effectiveMarginPercent}%
                    </div>
                  </div>
                </div>

                {/* Combo Items if present */}
                {sch.comboItems && (
                  <div className="mt-2 text-[10px] text-slate-600 bg-blue-50 p-1.5 rounded-lg border border-blue-200">
                    <span className="font-bold text-blue-800">Included Combo: </span>
                    {sch.comboItems.join(' + ')}
                  </div>
                )}

                {/* Generic Substitute Arbitrage Opportunity */}
                {sch.substituteOption && (
                  <div className="mt-2.5 p-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-emerald-200 text-[11px]">
                    <div className="flex items-center justify-between text-[10px] font-bold text-teal-800">
                      <span className="flex items-center space-x-1">
                        <Percent className="w-3 h-3 text-emerald-600" />
                        <span>Generic Profit Opportunity:</span>
                      </span>
                      <span className="text-emerald-700 font-black">
                        {sch.substituteOption.marginPercent}% Net Margin
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      {sch.substituteOption.brandName}
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between mt-0.5">
                      <span>Purchase Rate: ₹{sch.substituteOption.purchaseRate}</span>
                      <span>MRP: ₹{sch.substituteOption.mrp}</span>
                      <span className="text-emerald-700 font-bold">Profit: ₹{sch.substituteOption.mrp - sch.substituteOption.purchaseRate}/pack</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Min. Order: ₹{sch.minOrderValue?.toLocaleString('en-IN') || '2,000'}
                </span>
                <button
                  onClick={() => onSelectDealForPO ? onSelectDealForPO(sch) : alert(`Drafting Purchase Order for scheme "${sch.title}"`)}
                  className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Draft PO with Deal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: LOWEST WHOLESALE PRICE COMPARISON MATRIX ──── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-900 font-heading flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Multi-Distributor Wholesale Rate Comparison Matrix</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Compares negotiated purchase prices across registered distributors for high-turnover pharmaceutical molecules
            </p>
          </div>
          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full border border-blue-300">
            Real-Time Wholesale Arbitrage
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '950px' }}>
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">Molecule &amp; Standard Brand</th>
                <th className="px-3 py-3 text-center">MRP</th>
                <th className="px-3 py-3 text-center">MedLife Pvt Ltd</th>
                <th className="px-3 py-3 text-center">Sun Pharma Wholesale</th>
                <th className="px-3 py-3 text-center">Cipla Depot</th>
                <th className="px-3 py-3 text-center">Dr. Reddy's Logistics</th>
                <th className="px-3 py-3 text-center">Best Vendor &amp; Rate</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-black text-slate-900">{row.brandName}</div>
                    <div className="text-[10px] text-slate-500">{row.molecule}</div>
                    <div className="text-[9px] text-slate-400">{row.packType}</div>
                  </td>

                  <td className="px-3 py-3 text-center font-bold text-slate-700">
                    ₹{row.mrp}
                  </td>

                  {/* MedLife Rate */}
                  {(() => {
                    const r = row.rates.find(x => x.supplierId === 'sup-001');
                    return (
                      <td className={`px-3 py-3 text-center ${r?.isLowest ? 'bg-emerald-50/80 font-bold' : ''}`}>
                        <div className={`text-xs font-mono ${r?.isLowest ? 'text-emerald-800 font-black' : 'text-slate-700'}`}>
                          ₹{r?.rate}
                        </div>
                        {r?.schemeAvailable && (
                          <div className="text-[9px] text-emerald-700 font-semibold">{r.schemeAvailable}</div>
                        )}
                      </td>
                    );
                  })()}

                  {/* Sun Pharma Rate */}
                  {(() => {
                    const r = row.rates.find(x => x.supplierId === 'sup-002');
                    return (
                      <td className={`px-3 py-3 text-center ${r?.isLowest ? 'bg-emerald-50/80 font-bold' : ''}`}>
                        <div className={`text-xs font-mono ${r?.isLowest ? 'text-emerald-800 font-black' : 'text-slate-700'}`}>
                          ₹{r?.rate}
                        </div>
                        {r?.schemeAvailable && (
                          <div className="text-[9px] text-emerald-700 font-semibold">{r.schemeAvailable}</div>
                        )}
                      </td>
                    );
                  })()}

                  {/* Cipla Depot Rate */}
                  {(() => {
                    const r = row.rates.find(x => x.supplierId === 'sup-003');
                    return (
                      <td className={`px-3 py-3 text-center ${r?.isLowest ? 'bg-emerald-50/80 font-bold' : ''}`}>
                        <div className={`text-xs font-mono ${r?.isLowest ? 'text-emerald-800 font-black' : 'text-slate-700'}`}>
                          ₹{r?.rate}
                        </div>
                        {r?.schemeAvailable && (
                          <div className="text-[9px] text-emerald-700 font-semibold">{r.schemeAvailable}</div>
                        )}
                      </td>
                    );
                  })()}

                  {/* Dr. Reddy's Rate */}
                  {(() => {
                    const r = row.rates.find(x => x.supplierId === 'sup-004');
                    return (
                      <td className={`px-3 py-3 text-center ${r?.isLowest ? 'bg-emerald-50/80 font-bold' : ''}`}>
                        <div className={`text-xs font-mono ${r?.isLowest ? 'text-emerald-800 font-black' : 'text-slate-700'}`}>
                          ₹{r?.rate}
                        </div>
                        {r?.schemeAvailable && (
                          <div className="text-[9px] text-emerald-700 font-semibold">{r.schemeAvailable}</div>
                        )}
                      </td>
                    );
                  })()}

                  {/* Best Pick Column */}
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <Award className="w-3 h-3 text-emerald-700" />
                      <span>₹{row.lowestRate} ({row.marginAtLowestRate}% Margin)</span>
                    </span>
                    <div className="text-[9px] text-emerald-700 font-bold mt-0.5 truncate max-w-[140px] mx-auto">
                      {row.bestSupplier}
                    </div>
                  </td>

                  {/* 1-Click Order */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        const lowestRateObj = row.rates.find(x => x.isLowest);
                        if (lowestRateObj && onSelectProductForPO) {
                          onSelectProductForPO(row.brandName, lowestRateObj.supplierId);
                        } else {
                          alert(`Initiating PO for ${row.brandName} with lowest wholesaler: ${row.bestSupplier}`);
                        }
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      Order Best
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
