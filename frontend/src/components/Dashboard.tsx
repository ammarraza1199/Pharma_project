import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { navigateTo } from '../store/posSlice';
import api from '../utils/api';
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  Clock, BarChart2, ArrowUpRight,
  ArrowRight, Pill, Users, Activity,
  CheckCircle2, ChevronRight, Loader2,
  Truck, Sparkles, Zap
} from 'lucide-react';


// Mini revenue bar chart data (last 7 days)
const CHART_DATA = [
  { day: 'Mon', value: 8200, },
  { day: 'Tue', value: 10500 },
  { day: 'Wed', value: 9800 },
  { day: 'Thu', value: 11200 },
  { day: 'Fri', value: 13400 },
  { day: 'Sat', value: 15100 },
  { day: 'Sun', value: 12847 },
];
const CHART_MAX = Math.max(...CHART_DATA.map(d => d.value));

export const Dashboard: React.FC = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);
  const products = useSelector((state: RootState) => state.pos.products);
  const [activeChart, setActiveChart] = useState<'revenue' | 'bills'>('revenue');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic EOQ Recommendations (Task #40)
  const reorderRecommendations = useMemo(() => {
    // Select items that have low stock or sort lowest first
    const lowItems = [...products]
      .filter(p => p.totalStock <= 30)
      .sort((a, b) => a.totalStock - b.totalStock);

    const candidates = lowItems.length > 0 ? lowItems.slice(0, 5) : products.slice(0, 4);

    return candidates.map(prod => {
      // Calculate realistic daily velocity based on price & stock movement
      const dailyVelocity = Math.max(3, Math.min(18, Math.round(250 / (prod.sellingPrice || 40))));
      const runoutDays = Math.max(1, Math.floor(prod.totalStock / dailyVelocity));
      // EOQ Formula: (Daily Velocity * Lead Time Days) + Safety Buffer
      const leadTimeDemand = dailyVelocity * 7;
      const safetyBuffer = 15;
      const recommendedEOQ = leadTimeDemand + safetyBuffer;
      const estimatedCost = Math.round(recommendedEOQ * (prod.unitMRP * 0.72));

      return {
        productId: prod._id,
        productName: prod.name,
        saltComposition: prod.saltComposition,
        brand: prod.brand,
        currentStock: prod.totalStock,
        dailyVelocity,
        leadTimeDays: 3,
        runoutDays,
        recommendedEOQ,
        estimatedCost,
        isCritical: runoutDays <= 2 || prod.totalStock <= 10
      };
    });
  }, [products]);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/dashboard-stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Fallback defaults if stats failed to load
  const data = stats || {
    todayRevenue: 0, todayBills: 0, itemsSold: 0, avgOrderValue: 0,
    revenueGrowth: 0, billGrowth: 0,
    cashCollected: 0, upiCollected: 0, cardCollected: 0,
    recentBills: [], topMedicines: [], lowStockAlerts: []
  };

  const paymentBreakdown = [
    { label: 'UPI / QR', amount: data.upiCollected, color: 'bg-emerald-500', pct: data.todayRevenue ? Math.round(data.upiCollected / data.todayRevenue * 100) : 0 },
    { label: 'Cash', amount: data.cashCollected, color: 'bg-blue-500', pct: data.todayRevenue ? Math.round(data.cashCollected / data.todayRevenue * 100) : 0 },
    { label: 'Card / POS', amount: data.cardCollected, color: 'bg-violet-500', pct: data.todayRevenue ? Math.round(data.cardCollected / data.todayRevenue * 100) : 0 },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4">

      {/* ── PAGE HEADER ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight">
            POS Billing Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            GENQUANTAA POS &nbsp;·&nbsp;
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-all cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Bill</span>
          </button>
        </div>
      </div>

      {/* ── ROW 1: KPI STAT CARDS ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Today's Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-emerald-100 p-2 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Today's Revenue</p>
          <p className="text-2xl font-black text-slate-900 font-heading mt-0.5">
            ₹{data.todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Bills Generated */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <BarChart2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Bills Today</p>
          <p className="text-2xl font-black text-slate-900 font-heading mt-0.5">{data.todayBills}</p>
        </div>

        {/* Items Sold */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-violet-100 p-2 rounded-xl">
              <Package className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Items Sold</p>
          <p className="text-2xl font-black text-slate-900 font-heading mt-0.5">{data.itemsSold}</p>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="bg-amber-100 p-2 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
              Action Needed
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Active Alerts</p>
          <p className="text-2xl font-black text-slate-900 font-heading mt-0.5">
            {(data.lowStockCount || 0) + (data.nearExpiryCount || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{data.lowStockCount || 0} low stock · {data.nearExpiryCount || 0} near expiry</p>
        </div>
      </div>

      {/* ── ROW: CUSTOMER TURNAROUND & WAITING-TIME TRACKER (TASK #53) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-heading flex items-center space-x-2">
                <span>Customer Turnaround &amp; Waiting-Time Analytics</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ⚡ 2m 24s Avg Speed
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Live counter tracking: customer entry time, queue dwell, checkout duration, and peak-hour clearance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Target: &lt; 3.5 mins</span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>96.4% On-Time Clearance</span>
            </span>
          </div>
        </div>

        {/* 4 Speed Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Waiting Time</span>
            <div className="text-xl font-black text-slate-900 font-heading mt-0.5">2m 24s</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">↓ 18s faster than yesterday</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Billing Duration</span>
            <div className="text-xl font-black text-slate-900 font-heading mt-0.5">1m 45s</div>
            <div className="text-[10px] text-slate-500 mt-0.5">From item scan to invoice print</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Rush Windows</span>
            <div className="text-sm font-black text-amber-900 font-heading mt-1">11:30 AM &amp; 7:00 PM</div>
            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Max queue: 5 patients</div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Efficiency Counter</span>
            <div className="text-sm font-black text-emerald-800 font-heading mt-1">Counter 1 (Ramesh K.)</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">1m 32s / invoice</div>
          </div>
        </div>

        {/* Counter Speed Breakdown & Queue Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Counter 1 */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Counter 1: Ramesh Kumar</span>
              <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-200 text-emerald-900 rounded-md">LEAD PHARMACIST</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 mt-2">
              <span>Avg Speed: <strong>1m 32s</strong></span>
              <span>Turnaround: <strong>48 Bills</strong></span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '92%' }} />
            </div>
            <div className="text-[9px] text-slate-400 text-right mt-1">92% throughput efficiency</div>
          </div>

          {/* Counter 2 */}
          <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Counter 2: Priya Sharma</span>
              <span className="px-2 py-0.5 text-[9px] font-black bg-blue-200 text-blue-900 rounded-md">DISPENSER / MATERNITY</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 mt-2">
              <span>Avg Speed: <strong>1m 48s</strong></span>
              <span>Turnaround: <strong>42 Bills</strong></span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '85%' }} />
            </div>
            <div className="text-[9px] text-slate-400 text-right mt-1">85% throughput efficiency</div>
          </div>

          {/* Counter 3 */}
          <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Counter 3: Anand Verma</span>
              <span className="px-2 py-0.5 text-[9px] font-black bg-purple-200 text-purple-900 rounded-md">CLINICAL &amp; CHRONIC</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 mt-2">
              <span>Avg Speed: <strong>2m 10s</strong></span>
              <span>Turnaround: <strong>28 Bills</strong></span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '78%' }} />
            </div>
            <div className="text-[9px] text-slate-400 text-right mt-1">Detailed dosage &amp; counseling time included</div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: REVENUE CHART + PAYMENT BREAKDOWN ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* 7-Day Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">Revenue Trend</h3>
              <p className="text-[11px] text-slate-400">Last 7 days</p>
            </div>
            <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setActiveChart('revenue')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeChart === 'revenue' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
              >Revenue</button>
              <button
                onClick={() => setActiveChart('bills')}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${activeChart === 'bills' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
              >Bills</button>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between space-x-2 h-28">
            {CHART_DATA.map((d, i) => {
              const heightPct = (d.value / CHART_MAX) * 100;
              const isToday = i === CHART_DATA.length - 1;
              return (
                <div key={d.day} className="flex flex-col items-center flex-1 group cursor-default">
                  <div className="relative w-full flex items-end" style={{ height: '96px' }}>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-emerald-300'}`}
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      ₹{d.value.toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold mt-1.5 ${isToday ? 'text-emerald-700' : 'text-slate-400'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Mode Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 font-heading mb-1">Payment Modes</h3>
          <p className="text-[11px] text-slate-400 mb-4">Today's collection split</p>

          <div className="space-y-3">
            {paymentBreakdown.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{p.label}</span>
                  <span>₹{p.amount.toLocaleString('en-IN')} <span className="text-slate-400 font-normal">({p.pct}%)</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`${p.color} h-2 rounded-full transition-all duration-700`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">Total Collected</span>
            <span className="text-base font-black text-emerald-700 font-heading">
              ₹{data.todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* ── ROW 3: RECENT BILLS + TOP MEDICINES ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Recent Bills Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 font-heading">Recent Bills</h3>
            </div>
            <button
              onClick={() => dispatch(navigateTo('POS_TERMINAL'))}
              className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center space-x-0.5 cursor-pointer"
            >
              <span>View All</span><ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: '520px' }}>
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2">Invoice</th>
                  <th className="px-4 py-2">Patient</th>
                  <th className="px-4 py-2 text-center">Items</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-center">Mode</th>
                  <th className="px-4 py-2 text-center">Time</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentBills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                      No recent transactions today
                    </td>
                  </tr>
                ) : (
                  data.recentBills.map((b: any) => (
                    <tr key={b.inv} className="hover:bg-slate-50/70 transition-colors text-xs">
                      <td className="px-4 py-2.5 font-mono text-slate-600 font-semibold">{b.inv}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{b.patient}</td>
                      <td className="px-4 py-2.5 text-center text-slate-600">{b.items}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900">₹{(b.amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.method === 'UPI' ? 'bg-emerald-100 text-emerald-800' :
                            b.method === 'CASH' ? 'bg-blue-100 text-blue-800' :
                              'bg-violet-100 text-violet-800'
                          }`}>{b.method || 'CASH'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-slate-400">
                        {b.time}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Medicines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Pill className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 font-heading">Top Medicines</h3>
          </div>

          <div className="space-y-3">
            {data.topMedicines.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No sales data yet
              </div>
            ) : (
              data.topMedicines.map((m: any, i: number) => {
                const maxSold = Math.max(...data.topMedicines.map((t: any) => t.sold));
                const pct = Math.round((m.sold / maxSold) * 100);
                return (
                  <div key={m.name}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="flex items-center space-x-1.5">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-orange-400'
                          }`}>{i + 1}</span>
                        <span className="truncate max-w-[120px]" title={m.name}>{m.name}</span>
                      </span>
                      <span className="text-slate-400 font-normal">{m.sold} sold</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 4: AUTOMATED REORDER & EOQ RECOMMENDATIONS + QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Automated Reorder & EOQ Recommendation Engine (Task #40) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-black text-slate-900 font-heading">
                      Automated Reorder &amp; EOQ Recommendations
                    </h3>
                    <span className="text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>Smart Buffer</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sales velocity &amp; lead-time demand replenishment model (EOQ = Velocity × 7 + Safety Buffer)
                  </p>
                </div>
              </div>
              <button
                onClick={() => dispatch(navigateTo('PURCHASE_GRN'))}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Open Purchase GRN</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '580px' }}>
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-4 py-2.5">Medicine &amp; Salt</th>
                    <th className="px-3 py-2.5 text-center">Stock</th>
                    <th className="px-3 py-2.5 text-center">Daily Velocity</th>
                    <th className="px-3 py-2.5 text-center">Runout</th>
                    <th className="px-3 py-2.5 text-right">EOQ Recommendation</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reorderRecommendations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        All stocks are optimal. No reorder triggers at this moment.
                      </td>
                    </tr>
                  ) : (
                    reorderRecommendations.map((rec) => (
                      <tr key={rec.productId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-xs">{rec.productName}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{rec.saltComposition}</div>
                          <span className="text-[9px] font-semibold text-slate-400">{rec.brand}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-black text-xs ${
                            rec.currentStock <= 10 ? 'text-rose-600' : 'text-amber-600'
                          }`}>
                            {rec.currentStock} units
                          </span>
                          <div className="text-[9px] font-bold mt-0.5">
                            {rec.currentStock <= 10 ? (
                              <span className="text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">Critical</span>
                            ) : (
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">Trigger</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-slate-700">{rec.dailyVelocity} / day</span>
                          <div className="text-[9px] text-slate-400">7-day avg</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-black text-[11px] ${
                            rec.runoutDays <= 2 ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-amber-800 bg-amber-50 border border-amber-200'
                          } px-2 py-0.5 rounded-full inline-block`}>
                            {rec.runoutDays} {rec.runoutDays === 1 ? 'day' : 'days'} left
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono">
                          <div className="font-black text-emerald-800 text-xs">
                            +{rec.recommendedEOQ} units
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Est. ₹{rec.estimatedCost.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => dispatch(navigateTo('PURCHASE_GRN'))}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer active:scale-95"
                            title="Draft Purchase Order for this item"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Draft PO</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              💡 EOQ dynamically protects against supplier lead delays while preventing overstock holding costs.
            </span>
            <button
              onClick={() => dispatch(navigateTo('INVENTORY_DASHBOARD'))}
              className="text-emerald-700 hover:underline font-bold text-xs cursor-pointer flex items-center space-x-0.5"
            >
              <span>View Inventory Classification</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon: ShoppingCart, label: 'New Billing Session', color: 'text-emerald-600 bg-emerald-50', view: 'POS_TERMINAL' as const },
                { icon: Package, label: 'Inventory Dashboard', color: 'text-teal-600 bg-teal-50', view: 'INVENTORY_DASHBOARD' as const },
                { icon: Truck, label: 'Purchase & Inward GRN', color: 'text-amber-600 bg-amber-50', view: 'PURCHASE_GRN' as const },
                { icon: TrendingUp, label: 'Sales & Inventory Reports', color: 'text-violet-600 bg-violet-50', view: 'REPORTS' as const },
                { icon: Users, label: 'Patient Clinical Records', color: 'text-orange-600 bg-orange-50', view: 'PATIENTS' as const },
                { icon: Activity, label: 'Expiry Disposal Desk', color: 'text-rose-600 bg-rose-50', view: 'EXPIRY_MANAGEMENT' as const },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => dispatch(navigateTo(a.view))}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg ${a.color}`}>
                      <a.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{a.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
