import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { navigateTo } from '../store/posSlice';
import api from '../utils/api';
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  Clock, BarChart2, ArrowUpRight,
  ArrowRight, Pill, Users, Activity,
  CheckCircle2, ChevronRight, Loader2
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
  const [activeChart, setActiveChart] = useState<'revenue' | 'bills'>('revenue');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

      {/* ── ROW 4: ALERTS + QUICK ACTIONS ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 font-heading">Low Stock Alerts</h3>
          </div>
          <div className="space-y-2">
            {(data.lowStockAlerts || []).length === 0 ? (
              <div className="text-center py-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-emerald-700">All stocks healthy</p>
              </div>
            ) : (
              (data.lowStockAlerts || []).map((s: any) => (
                <div key={s.name} className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{s.name}</p>
                    <p className="text-[10px] text-rose-600 font-semibold">{s.stock} units left</p>
                  </div>
                  {s.schedule === 'SCHEDULE_X' && (
                    <span className="text-[9px] bg-rose-200 text-rose-800 font-black px-1.5 py-0.5 rounded">Sch-X</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Near Expiry Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 font-heading">Near Expiry</h3>
          </div>
          <div className="space-y-2">
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[11px] font-bold text-slate-500">Coming Soon</p>
            </div>
            {/* 
            {MOCK_NEAR_EXPIRY.map((e) => (
              <div key={e.batch} className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-slate-800">{e.name}</p>
                <p className="text-[10px] text-amber-700 font-semibold">Batch: {e.batch} · Exp: {e.expiry}</p>
                <p className="text-[10px] text-slate-500">{e.qty} units in stock</p>
              </div>
            ))}
            */}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 font-heading mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { icon: ShoppingCart, label: 'New Billing Session', color: 'text-emerald-600 bg-emerald-50', view: 'POS_TERMINAL' as const },
              { icon: Package, label: 'View Inventory', color: 'text-blue-600 bg-blue-50', view: 'INVENTORY' as const },
              { icon: TrendingUp, label: 'Sales Reports', color: 'text-violet-600 bg-violet-50', view: 'REPORTS' as const },
              { icon: Users, label: 'Patient Records', color: 'text-orange-600 bg-orange-50', view: 'PATIENTS' as const },
              { icon: Activity, label: 'Expiry Management', color: 'text-rose-600 bg-rose-50', view: 'EXPIRY_MANAGEMENT' as const },
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
  );
};
