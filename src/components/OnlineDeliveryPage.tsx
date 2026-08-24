import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { addDeliveryOrder, updateDeliveryOrderStatus, deleteDeliveryOrder } from '../store/posSlice';
import type { DeliveryOrder, DeliveryStatus, DeliveryType } from '../types/pos';
import {
  Bike, Clock, CheckCircle2, AlertTriangle, Package, PackageCheck,
  XCircle, Plus, Phone, MapPin, Pill, ShieldCheck, ShieldAlert,
  Truck, Trash2, Search, X
} from 'lucide-react';

type FilterTab = 'ALL' | DeliveryStatus;

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  PENDING:    { label: 'Pending',    color: 'text-slate-700',   bg: 'bg-slate-100',  border: 'border-slate-300',  dot: 'bg-slate-400' },
  CONFIRMED:  { label: 'Confirmed',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-300',   dot: 'bg-blue-500' },
  DISPATCHED: { label: 'Dispatched', color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-300', dot: 'bg-violet-500' },
  ON_TIME:    { label: 'On-Time',    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300',dot: 'bg-emerald-500' },
  DELAYED:    { label: '⚠ Delayed',  color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-300',   dot: 'bg-rose-500' },
  DELIVERED:  { label: 'Delivered',  color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-300',   dot: 'bg-teal-500' },
  CANCELLED:  { label: 'Cancelled',  color: 'text-slate-500',   bg: 'bg-slate-50',   border: 'border-slate-200',  dot: 'bg-slate-300' },
};

const DELIVERY_TYPE_LABEL: Record<DeliveryType, string> = {
  STANDARD:  'Standard',
  EXPRESS:   'Express ⚡',
  SCHEDULED: 'Scheduled 🗓',
};

function formatTimeLeft(isoDate: string): { label: string; isLate: boolean } {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff < 0) {
    const mins = Math.abs(Math.floor(diff / 60000));
    return { label: `${mins}m late`, isLate: true };
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return { label: `${mins}m left`, isLate: false };
  return { label: `${Math.floor(mins / 60)}h ${mins % 60}m left`, isLate: false };
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

interface NewOrderForm {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  deliveryType: DeliveryType;
  prescriptionRequired: boolean;
  notes: string;
}

const EMPTY_FORM: NewOrderForm = {
  customerName: '', customerPhone: '', deliveryAddress: '',
  productName: '', quantity: 1, unitPrice: 0,
  deliveryType: 'STANDARD', prescriptionRequired: false, notes: ''
};

export const OnlineDeliveryPage: React.FC = () => {
  const dispatch = useDispatch();
  const deliveryOrders = useSelector((state: RootState) => state.pos.deliveryOrders);

  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [form, setForm] = useState<NewOrderForm>(EMPTY_FORM);

  const totalOrders  = deliveryOrders.length;
  const onTimeCount  = deliveryOrders.filter(o => o.status === 'ON_TIME' || o.status === 'DELIVERED').length;
  const delayedCount = deliveryOrders.filter(o => o.status === 'DELAYED').length;
  const activeCount  = deliveryOrders.filter(o => o.status === 'DISPATCHED').length;
  const totalRevenue = deliveryOrders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.totalAmount, 0);

  const filtered = deliveryOrders.filter(o => {
    const matchTab    = filterTab === 'ALL' || o.status === filterTab;
    const matchSearch = !searchQuery ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery);
    return matchTab && matchSearch;
  });

  const handleStatusChange = (orderId: string, status: DeliveryStatus) => {
    dispatch(updateDeliveryOrderStatus({
      orderId, status,
      actualDeliveryTime: status === 'DELIVERED' ? new Date().toISOString() : undefined
    }));
    setSelectedOrder(prev => prev ? { ...prev, status } : null);
  };

  const handleNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addDeliveryOrder({
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      deliveryAddress: form.deliveryAddress,
      items: [{ productId: `prod-${Date.now()}`, productName: form.productName, quantity: form.quantity, unitPrice: form.unitPrice, lineTotal: form.quantity * form.unitPrice }],
      totalAmount: form.quantity * form.unitPrice,
      status: 'PENDING',
      deliveryType: form.deliveryType,
      estimatedDeliveryTime: new Date(Date.now() + (form.deliveryType === 'EXPRESS' ? 30 : 90) * 60000).toISOString(),
      prescriptionRequired: form.prescriptionRequired,
      prescriptionVerified: false,
      notes: form.notes
    }));
    setForm(EMPTY_FORM);
    setShowNewOrderModal(false);
  };

  const TAB_DEFS: { key: FilterTab; label: string; activeClass: string }[] = [
    { key: 'ALL',        label: `All (${totalOrders})`,       activeClass: 'bg-slate-800 text-white' },
    { key: 'PENDING',    label: `Pending (${deliveryOrders.filter(o=>o.status==='PENDING').length})`,    activeClass: 'bg-slate-600 text-white' },
    { key: 'DISPATCHED', label: `Dispatched (${activeCount})`, activeClass: 'bg-violet-600 text-white' },
    { key: 'ON_TIME',    label: `On-Time (${onTimeCount})`,   activeClass: 'bg-emerald-600 text-white' },
    { key: 'DELAYED',    label: `⚠ Delayed (${delayedCount})`, activeClass: 'bg-rose-600 text-white' },
    { key: 'DELIVERED',  label: `Delivered (${deliveryOrders.filter(o=>o.status==='DELIVERED').length})`, activeClass: 'bg-teal-600 text-white' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Bike className="w-6 h-6 text-emerald-600" />
            <span>Online Delivery Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pharmacy Home Delivery — Real-time order tracking
          </p>
        </div>
        <button
          onClick={() => setShowNewOrderModal(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery Order</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3">
          <div className="bg-slate-100 p-2.5 rounded-xl"><Package className="w-5 h-5 text-slate-600" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-2xl font-black text-slate-900 font-heading">{totalOrders}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs bg-emerald-50/40 flex items-center space-x-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl"><CheckCircle2 className="w-5 h-5 text-emerald-700" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">On-Time</p>
            <h3 className="text-2xl font-black text-emerald-700 font-heading">{onTimeCount}</h3>
          </div>
        </div>
        <div className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center space-x-3 ${delayedCount > 0 ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200'}`}>
          <div className={`p-2.5 rounded-xl ${delayedCount > 0 ? 'bg-rose-100' : 'bg-slate-100'}`}>
            <AlertTriangle className={`w-5 h-5 ${delayedCount > 0 ? 'text-rose-700' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delayed</p>
            <h3 className={`text-2xl font-black font-heading ${delayedCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>{delayedCount}</h3>
            {delayedCount > 0 && <p className="text-[10px] text-rose-600 font-bold animate-pulse">Action needed!</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center space-x-3">
          <div className="bg-teal-100 p-2.5 rounded-xl"><Truck className="w-5 h-5 text-teal-700" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">₹{totalRevenue.toFixed(0)}</h3>
          </div>
        </div>
      </div>

      {/* FILTER TABS + SEARCH */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs">
          {TAB_DEFS.map(tab => (
            <button key={tab.key} onClick={() => setFilterTab(tab.key)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === tab.key ? tab.activeClass : 'text-slate-600 hover:bg-slate-100'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search customer / order..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 w-56" />
        </div>
      </div>

      {/* ORDER CARDS */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          No delivery orders found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(order => {
            const cfg      = STATUS_CONFIG[order.status];
            const timeLeft = formatTimeLeft(order.estimatedDeliveryTime);
            const isLate   = timeLeft.isLate && order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
            return (
              <div key={order.orderId} onClick={() => setSelectedOrder(order)}
                className={`bg-white rounded-2xl border shadow-xs p-4 cursor-pointer hover:shadow-md transition-all duration-150 relative overflow-hidden group ${isLate ? 'border-rose-300' : 'border-slate-200 hover:border-emerald-300'}`}>
                {/* left bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${cfg.dot}`} />
                <div className="pl-2">
                  {/* top */}
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">{order.orderNumber}</span>
                      <h4 className="text-sm font-extrabold text-slate-900 font-heading leading-tight">{order.customerName}</h4>
                      <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                        <Phone className="w-3 h-3" /><span>{order.customerPhone}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">{DELIVERY_TYPE_LABEL[order.deliveryType]}</span>
                    </div>
                  </div>
                  {/* address */}
                  <div className="flex items-start space-x-1 text-[11px] text-slate-500 mb-2">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{order.deliveryAddress}</span>
                  </div>
                  {/* items */}
                  <div className="bg-slate-50 rounded-lg p-2 mb-2 space-y-0.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span className="flex items-center space-x-1 text-slate-700">
                          <Pill className="w-3 h-3 text-emerald-600" />
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-slate-400">×{item.quantity}</span>
                        </span>
                        <span className="font-bold text-slate-900">₹{item.lineTotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {/* bottom */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${timeLeft.isLate ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                      ⏱ {formatTime(order.estimatedDeliveryTime)} ({timeLeft.label})
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {order.prescriptionRequired && (
                        order.prescriptionVerified
                          ? <ShieldCheck className="w-4 h-4 text-emerald-500" title="Rx Verified" />
                          : <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" title="Rx Pending" />
                      )}
                      <span className="text-sm font-black text-emerald-700">₹{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  {order.assignedRider && (
                    <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-violet-600">
                      <Bike className="w-3 h-3" />
                      <span>Rider: <strong>{order.assignedRider}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ORDER DETAIL SIDE PANEL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-5 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-[10px] text-slate-400 font-mono">{selectedOrder.orderNumber}</p>
                <h3 className="text-sm font-extrabold font-heading">{selectedOrder.customerName}</h3>
                <p className="text-[11px] text-slate-300">{selectedOrder.customerPhone}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-white/70 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-4 text-xs overflow-y-auto">
              {/* Status row */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Current Status</span>
                <span className={`text-[11px] font-black px-3 py-1.5 rounded-full border ${STATUS_CONFIG[selectedOrder.status].bg} ${STATUS_CONFIG[selectedOrder.status].color} ${STATUS_CONFIG[selectedOrder.status].border}`}>
                  {STATUS_CONFIG[selectedOrder.status].label}
                </span>
              </div>

              {/* Delivery Info */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="font-bold text-slate-800">{DELIVERY_TYPE_LABEL[selectedOrder.deliveryType]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ETA</span>
                  <span className={`font-bold ${formatTimeLeft(selectedOrder.estimatedDeliveryTime).isLate ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatTime(selectedOrder.estimatedDeliveryTime)} ({formatTimeLeft(selectedOrder.estimatedDeliveryTime).label})
                  </span>
                </div>
                {selectedOrder.actualDeliveryTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivered At</span>
                    <span className="font-bold text-teal-700">{formatTime(selectedOrder.actualDeliveryTime)}</span>
                  </div>
                )}
                <div className="flex items-start space-x-1 pt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{selectedOrder.deliveryAddress}</span>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Order Items</h4>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between bg-white border border-slate-200 rounded-lg p-2.5 mb-1.5">
                    <div>
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-slate-400 text-[11px]">Qty: {item.quantity} × ₹{item.unitPrice.toFixed(2)}</div>
                    </div>
                    <span className="font-black text-emerald-700">₹{item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-200 pt-2">
                  <span>Total</span>
                  <span className="text-emerald-700">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Prescription */}
              {selectedOrder.prescriptionRequired && (
                <div className={`rounded-xl p-3 flex items-center space-x-2 ${selectedOrder.prescriptionVerified ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                  {selectedOrder.prescriptionVerified ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
                  <span className={`font-bold ${selectedOrder.prescriptionVerified ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {selectedOrder.prescriptionVerified ? 'Prescription Verified ✓' : 'Prescription NOT Verified — Hold order!'}
                  </span>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-amber-800 font-bold">📝 </span>
                  <span className="text-amber-700">{selectedOrder.notes}</span>
                </div>
              )}

              {/* Rider */}
              {selectedOrder.assignedRider && (
                <div className="flex items-center space-x-3 bg-violet-50 border border-violet-200 rounded-xl p-3">
                  <Bike className="w-5 h-5 text-violet-600" />
                  <div>
                    <div className="font-bold text-violet-900">{selectedOrder.assignedRider}</div>
                    {selectedOrder.riderPhone && <div className="text-violet-600">{selectedOrder.riderPhone}</div>}
                  </div>
                </div>
              )}

              {/* Status Controls */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Update Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['CONFIRMED','DISPATCHED','ON_TIME','DELAYED','DELIVERED','CANCELLED'] as DeliveryStatus[]).map(s => (
                    <button key={s} disabled={selectedOrder.status === s}
                      onClick={() => handleStatusChange(selectedOrder.orderId, s)}
                      className={`text-[11px] font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].border} hover:opacity-80`}>
                      → {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => { dispatch(deleteDeliveryOrder(selectedOrder.orderId)); setSelectedOrder(null); }}
                className="w-full flex items-center justify-center space-x-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl py-2.5 transition-colors cursor-pointer font-bold">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Order</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ORDER MODAL */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Bike className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 font-heading">New Home Delivery Order</h3>
              </div>
              <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleNewOrder} className="space-y-3 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Customer Name *</label>
                  <input required value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Full Name" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Phone *</label>
                  <input required value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="10-digit mobile" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Delivery Address *</label>
                <textarea required value={form.deliveryAddress} onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))}
                  rows={2} className="w-full p-2 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Full delivery address" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Medicine / Product *</label>
                <input required value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="e.g. Metformin 500mg" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Qty *</label>
                  <input required type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Unit Price (₹) *</label>
                  <input required type="number" min="0" step="0.01" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: +e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Total</label>
                  <div className="p-2 border border-emerald-300 rounded-xl bg-emerald-50 text-emerald-800 font-black text-center">
                    ₹{(form.quantity * form.unitPrice).toFixed(2)}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Delivery Type *</label>
                <select value={form.deliveryType} onChange={e => setForm(f => ({ ...f, deliveryType: e.target.value as DeliveryType }))}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="STANDARD">Standard (~90 min)</option>
                  <option value="EXPRESS">Express ⚡ (~30 min)</option>
                  <option value="SCHEDULED">Scheduled 🗓</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 mb-1">Notes (optional)</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Delivery instructions..." />
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input type="checkbox" id="rx-req" checked={form.prescriptionRequired} onChange={e => setForm(f => ({ ...f, prescriptionRequired: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
                <label htmlFor="rx-req" className="text-slate-700 cursor-pointer">Prescription Required</label>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowNewOrderModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer font-bold">Cancel</button>
                <button type="submit" className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
