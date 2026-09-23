import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { createPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder, navigateTo } from '../store/posSlice';
import type { PurchaseOrder, PurchaseOrderItem, DistributorScheme } from '../types/pos';
import {
  FileText, Plus, Printer, MessageSquare, Truck, CheckCircle2,
  Clock, X, Trash2, Calendar, Building, CreditCard, ExternalLink,
  ChevronRight, ArrowRight, ShieldCheck, Check, Search
} from 'lucide-react';

interface Props {
  initialDraftScheme?: DistributorScheme | null;
  onClearInitialScheme?: () => void;
}

export const AdvancePurchaseOrders: React.FC<Props> = ({
  initialDraftScheme,
  onClearInitialScheme
}) => {
  const dispatch = useDispatch();
  const purchaseOrders = useSelector((state: RootState) => state.pos.purchaseOrders);
  const suppliers = useSelector((state: RootState) => state.pos.suppliers);
  const products = useSelector((state: RootState) => state.pos.products);
  const storeSettings = useSelector((state: RootState) => state.pos.settings);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PLACED' | 'CONVERTED_TO_GRN'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Draft Modal State
  const [showDraftModal, setShowDraftModal] = useState<boolean>(!!initialDraftScheme);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    initialDraftScheme?.supplierId || suppliers[0]?.supplierId || ''
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState<'COD' | 'CREDIT_10_DAYS' | 'CREDIT_15_DAYS' | 'CREDIT_30_DAYS'>('CREDIT_15_DAYS');
  const [schemeNotes, setSchemeNotes] = useState<string>(initialDraftScheme?.title || '');
  const [poNotes, setPoNotes] = useState<string>('Standard commercial replenishment order. Verify expiry > 18 months.');

  // Draft Items repeater
  const [draftItems, setDraftItems] = useState<PurchaseOrderItem[]>(() => {
    if (initialDraftScheme && initialDraftScheme.primaryProduct) {
      return [{
        productId: 'prod-custom',
        productName: initialDraftScheme.primaryProduct,
        packType: 'Strip of 10 Tablets',
        quantity: initialDraftScheme.buyQuantity || 10,
        estimatedRate: 95,
        gstRate: 12,
        totalAmount: Number(((initialDraftScheme.buyQuantity || 10) * 95 * 1.12).toFixed(2))
      }];
    }
    return [{
      productId: products[0]?._id || 'prod-001',
      productName: products[0]?.name || 'Augmentin 625 Duo Tablet',
      packType: 'Strip of 10 Tablets',
      quantity: 20,
      estimatedRate: 155,
      gstRate: 12,
      totalAmount: Number((20 * 155 * 1.12).toFixed(2))
    }];
  });

  // Print Preview Modal State
  const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null);

  // Filtered POs
  const filteredOrders = purchaseOrders.filter(po => {
    if (statusFilter !== 'ALL' && po.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = po.poNumber.toLowerCase().includes(q);
      const matchSup = po.supplierName.toLowerCase().includes(q);
      const matchItems = po.items.some(i => i.productName.toLowerCase().includes(q));
      if (!matchNo && !matchSup && !matchItems) return false;
    }
    return true;
  });

  // Calculate Draft Items Total
  const draftTotalAmount = draftItems.reduce((sum, item) => sum + item.totalAmount, 0);

  // Add Item to Draft
  const handleAddItemToDraft = () => {
    const defaultProd = products[0];
    const rate = defaultProd ? Math.round(defaultProd.sellingPrice * 0.75) : 100;
    const newItem: PurchaseOrderItem = {
      productId: defaultProd?._id || `prod-${Date.now()}`,
      productName: defaultProd?.name || 'New Medicine',
      packType: defaultProd?.packSize || 'Strip of 10 Tablets',
      quantity: 10,
      estimatedRate: rate,
      gstRate: 12,
      totalAmount: Number((10 * rate * 1.12).toFixed(2))
    };
    setDraftItems([...draftItems, newItem]);
  };

  // Update Draft Item
  const handleUpdateDraftItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...draftItems];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'estimatedRate' || field === 'gstRate') {
      const qty = Number(field === 'quantity' ? value : item.quantity);
      const rate = Number(field === 'estimatedRate' ? value : item.estimatedRate);
      const gst = Number(field === 'gstRate' ? value : item.gstRate);
      item.totalAmount = Number((qty * rate * (1 + gst / 100)).toFixed(2));
    }

    if (field === 'productId') {
      const prod = products.find(p => p._id === value);
      if (prod) {
        item.productName = prod.name;
        item.packType = prod.packSize || 'Standard Pack';
        item.estimatedRate = Math.round(prod.sellingPrice * 0.75);
        item.gstRate = prod.gstRate || 12;
        item.totalAmount = Number((item.quantity * item.estimatedRate * (1 + item.gstRate / 100)).toFixed(2));
      }
    }

    updated[index] = item;
    setDraftItems(updated);
  };

  // Remove Draft Item
  const handleRemoveDraftItem = (index: number) => {
    if (draftItems.length === 1) {
      alert('A purchase order must contain at least 1 item.');
      return;
    }
    setDraftItems(draftItems.filter((_, i) => i !== index));
  };

  // Submit Draft Purchase Order
  const handleSavePurchaseOrder = (status: 'DRAFT' | 'PLACED') => {
    const sup = suppliers.find(s => s.supplierId === selectedSupplierId) || suppliers[0];
    if (!sup) {
      alert('Please select a valid supplier.');
      return;
    }
    if (draftItems.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    const nextNumber = `PO-2026-${String(purchaseOrders.length + 101).padStart(3, '0')}`;

    const newPO: PurchaseOrder = {
      poId: `po-${Date.now()}`,
      poNumber: nextNumber,
      supplierId: sup.supplierId,
      supplierName: sup.name,
      supplierGstin: sup.gstin || '36AAACM8890A1Z2',
      supplierPhone: sup.phone || '+91 98490 12345',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate,
      paymentTerms,
      status,
      items: draftItems,
      totalAmount: Number(draftTotalAmount.toFixed(2)),
      schemeNotes,
      notes: poNotes,
      createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    };

    dispatch(createPurchaseOrder(newPO));
    alert(`✓ Purchase Order ${nextNumber} ${status === 'PLACED' ? 'placed' : 'saved as draft'} successfully!`);
    setShowDraftModal(false);
    if (onClearInitialScheme) onClearInitialScheme();
  };

  // Convert PO to GRN
  const handleConvertPOToGRN = (po: PurchaseOrder) => {
    if (!window.confirm(`Convert PO "${po.poNumber}" into an active Goods Receipt Note (GRN)?`)) return;

    dispatch(updatePurchaseOrderStatus({
      poId: po.poId,
      status: 'CONVERTED_TO_GRN'
    }));

    alert(`✓ Purchase Order "${po.poNumber}" converted to GRN! Redirecting to Stock Purchase Intake...`);
    dispatch(navigateTo('PURCHASE_GRN'));
  };

  // Share PO on WhatsApp
  const handleSharePOWhatsApp = (po: PurchaseOrder) => {
    const phone = po.supplierPhone.replace(/[^0-9]/g, '');
    const storeName = storeSettings.storeName || 'GenQuanta Pharmacy';

    let itemLines = po.items.map((it, idx) =>
      `${idx + 1}. ${it.productName} (${it.packType}) - Qty: ${it.quantity} @ Est. ₹${it.estimatedRate}`
    ).join('\n');

    const text = `*OFFICIAL ADVANCE PURCHASE ORDER*\n` +
      `*Store:* ${storeName}\n` +
      `*PO Number:* ${po.poNumber}\n` +
      `*Order Date:* ${po.orderDate}\n` +
      `*Expected Delivery:* ${po.expectedDeliveryDate}\n` +
      `*Payment Terms:* ${po.paymentTerms.replace(/_/g, ' ')}\n` +
      `--------------------------------\n` +
      `*ITEMS ORDERED:*\n${itemLines}\n` +
      `--------------------------------\n` +
      `*Estimated Value:* ₹${po.totalAmount.toLocaleString('en-IN')}\n` +
      (po.schemeNotes ? `*Applicable Scheme:* ${po.schemeNotes}\n` : '') +
      `*Authorized By:* Lead Pharmacist, ${storeName}\n` +
      `Please confirm receipt and dispatch schedule!`;

    window.open(`https://wa.me/${phone ? (phone.startsWith('91') ? phone : `91${phone}`) : ''}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* ── TOP CONTROLS BAR ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter('PLACED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'PLACED' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Placed with Wholesaler ({purchaseOrders.filter(p => p.status === 'PLACED').length})
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'DRAFT' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Drafts ({purchaseOrders.filter(p => p.status === 'DRAFT').length})
          </button>
          <button
            onClick={() => setStatusFilter('CONVERTED_TO_GRN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'CONVERTED_TO_GRN' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Received / GRN ({purchaseOrders.filter(p => p.status === 'CONVERTED_TO_GRN').length})
          </button>
        </div>

        {/* Right Search & Create Button */}
        <div className="flex items-center space-x-2">
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search PO #, supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
            />
          </div>

          <button
            onClick={() => {
              setDraftItems([{
                productId: products[0]?._id || 'prod-001',
                productName: products[0]?.name || 'Augmentin 625 Duo Tablet',
                packType: 'Strip of 10 Tablets',
                quantity: 20,
                estimatedRate: 155,
                gstRate: 12,
                totalAmount: Number((20 * 155 * 1.12).toFixed(2))
              }]);
              setShowDraftModal(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Draft Advance PO</span>
          </button>
        </div>
      </div>

      {/* ── PURCHASE ORDERS TABLE ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '950px' }}>
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">PO Number &amp; Date</th>
                <th className="px-3 py-3">Wholesaler / Distributor</th>
                <th className="px-3 py-3">Expected Delivery</th>
                <th className="px-3 py-3 text-center">Payment Terms</th>
                <th className="px-3 py-3 text-center">Items Ordered</th>
                <th className="px-3 py-3 text-right">Est. Total Amount</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No purchase orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(po => (
                  <tr key={po.poId} className="hover:bg-slate-50/80 transition-colors">
                    {/* PO Number */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-mono flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{po.poNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Ordered: {po.orderDate}</div>
                    </td>

                    {/* Wholesaler */}
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-800">{po.supplierName}</div>
                      <div className="text-[10px] text-slate-400">{po.supplierPhone}</div>
                      {po.schemeNotes && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {po.schemeNotes}
                        </span>
                      )}
                    </td>

                    {/* Expected Delivery */}
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-700 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{po.expectedDeliveryDate}</span>
                      </div>
                    </td>

                    {/* Terms */}
                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {po.paymentTerms.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Items Count */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-slate-800">{po.items.length} Products</span>
                      <div className="text-[10px] text-slate-400">
                        {po.items.reduce((s, i) => s + i.quantity, 0)} Total Packs
                      </div>
                    </td>

                    {/* Est Amount */}
                    <td className="px-3 py-3 text-right font-black text-slate-900 text-sm">
                      ₹{po.totalAmount.toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 text-center">
                      {po.status === 'PLACED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          PLACED / SENT
                        </span>
                      ) : po.status === 'DRAFT' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          DRAFT
                        </span>
                      ) : po.status === 'CONVERTED_TO_GRN' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          RECEIVED (GRN)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          CANCELLED
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Print / Preview */}
                        <button
                          onClick={() => setPreviewPO(po)}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View & Print Official Purchase Order"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={() => handleSharePOWhatsApp(po)}
                          className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                          title="Share PO directly with Wholesaler on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Convert to GRN */}
                        {po.status === 'PLACED' && (
                          <button
                            onClick={() => handleConvertPOToGRN(po)}
                            className="flex items-center space-x-1 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-all cursor-pointer"
                            title="Stock arrived: convert PO to GRN"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Inward GRN</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DRAFT PURCHASE ORDER MODAL ─────────────────────────────── */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-black text-slate-900 font-heading flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Draft Advance Purchase Order (PO)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pre-order pharmaceutical stocks from authorized distributors before delivery
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDraftModal(false);
                  if (onClearInitialScheme) onClearInitialScheme();
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 mb-1">Target Wholesaler *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    {suppliers.map(s => (
                      <option key={s.supplierId} value={s.supplierId}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Expected Delivery Date *</label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={e => setExpectedDeliveryDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Commercial Payment Terms *</label>
                  <select
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="CREDIT_15_DAYS">15 Days Credit Window</option>
                    <option value="CREDIT_10_DAYS">10 Days Credit Window</option>
                    <option value="CREDIT_30_DAYS">30 Days Extended Credit</option>
                    <option value="COD">Cash on Delivery (Spot)</option>
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-800 font-bold">Medicines &amp; Packs to Order ({draftItems.length})</label>
                  <button
                    type="button"
                    onClick={handleAddItemToDraft}
                    className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 text-[11px] font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Medicine</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2">Medicine / Item</th>
                        <th className="p-2 w-28">Pack Type</th>
                        <th className="p-2 w-16 text-center">Qty</th>
                        <th className="p-2 w-20 text-right">Est. Rate</th>
                        <th className="p-2 w-16 text-center">GST %</th>
                        <th className="p-2 w-20 text-right">Total (₹)</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {draftItems.map((item, idx) => (
                        <tr key={idx}>
                          {/* Medicine Selector */}
                          <td className="p-2">
                            <select
                              value={item.productId}
                              onChange={e => handleUpdateDraftItem(idx, 'productId', e.target.value)}
                              className="w-full p-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                            >
                              {products.map(p => (
                                <option key={p._id} value={p._id}>{p.name} ({p.brand})</option>
                              ))}
                            </select>
                          </td>

                          {/* Pack Type */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.packType}
                              onChange={e => handleUpdateDraftItem(idx, 'packType', e.target.value)}
                              className="w-full p-1 border border-slate-200 rounded-lg text-xs"
                            />
                          </td>

                          {/* Quantity */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleUpdateDraftItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full p-1 border border-slate-200 rounded-lg text-xs text-center font-bold"
                            />
                          </td>

                          {/* Estimated Rate */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.estimatedRate}
                              onChange={e => handleUpdateDraftItem(idx, 'estimatedRate', Number(e.target.value))}
                              className="w-full p-1 border border-slate-200 rounded-lg text-xs text-right font-mono"
                            />
                          </td>

                          {/* GST Rate */}
                          <td className="p-2">
                            <select
                              value={item.gstRate}
                              onChange={e => handleUpdateDraftItem(idx, 'gstRate', Number(e.target.value))}
                              className="w-full p-1 border border-slate-200 rounded-lg text-xs text-center"
                            >
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                            </select>
                          </td>

                          {/* Total Line */}
                          <td className="p-2 text-right font-black text-slate-800">
                            ₹{item.totalAmount.toLocaleString('en-IN')}
                          </td>

                          {/* Delete */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftItem(idx)}
                              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary Strip */}
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Estimated PO Total</span>
                  <div className="text-xl font-black text-emerald-900 font-heading">
                    ₹{draftTotalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right text-[11px] text-emerald-700">
                  Includes estimated GST &amp; manufacturer rates
                </div>
              </div>

              {/* Scheme / Promotion Notes */}
              <div>
                <label className="block text-slate-700 mb-1">Applicable Wholesaler Scheme / Promotion</label>
                <input
                  type="text"
                  value={schemeNotes}
                  onChange={e => setSchemeNotes(e.target.value)}
                  placeholder="e.g. 10+2 Free Box Scheme or 30% Rebate applied"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 mb-1">Dispatch Instructions &amp; PO Notes</label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  placeholder="e.g. Please deliver to front counter before 2 PM"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePurchaseOrder('DRAFT')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePurchaseOrder('PLACED')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Place Advance Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINTABLE PO PREVIEW MODAL ─────────────────────────────── */}
      {previewPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            {/* Header controls (not printed) */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800 text-xs">Official Purchase Order Sheet Preview</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PO Sheet</span>
                </button>
                <button
                  onClick={() => setPreviewPO(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formal PO Sheet Document */}
            <div className="border border-slate-300 rounded-xl p-6 bg-white space-y-4 text-xs">
              {/* Store & PO Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight font-heading">
                    {storeSettings.storeName || 'GENQUANTA PHARMACEUTICALS'}
                  </h2>
                  <p className="text-[11px] text-slate-600">{storeSettings.address || 'Plot 44, Tech City, Hyderabad - 500081'}</p>
                  <p className="text-[10px] text-slate-500">GSTIN: {storeSettings.gstin || '36AAACG0011A1Z1'} | DL No: {storeSettings.dlNumber || 'DL-HYD-2024-8891'}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-slate-900 text-white font-mono font-bold rounded-lg text-xs">
                    {previewPO.poNumber}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">Date: {previewPO.orderDate}</div>
                  <div className="text-[10px] text-emerald-700 font-bold">Status: {previewPO.status}</div>
                </div>
              </div>

              {/* Vendor & Delivery Box */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl text-[11px]">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Vendor / Wholesaler Details:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{previewPO.supplierName}</div>
                  <div className="text-slate-600">GSTIN: {previewPO.supplierGstin}</div>
                  <div className="text-slate-600">Phone: {previewPO.supplierPhone}</div>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Dispatch &amp; Commercial Terms:</span>
                  <div className="font-bold text-slate-900 mt-0.5">Expected: {previewPO.expectedDeliveryDate}</div>
                  <div className="text-slate-600">Payment: {previewPO.paymentTerms.replace(/_/g, ' ')}</div>
                  {previewPO.schemeNotes && (
                    <div className="text-emerald-700 font-semibold mt-0.5">{previewPO.schemeNotes}</div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2">Item Description</th>
                    <th className="py-2">Pack</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Est. Unit Rate</th>
                    <th className="py-2 text-center">GST</th>
                    <th className="py-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewPO.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-bold text-slate-900">{it.productName}</td>
                      <td className="py-2 text-slate-600">{it.packType}</td>
                      <td className="py-2 text-center font-bold text-slate-800">{it.quantity}</td>
                      <td className="py-2 text-right font-mono">₹{it.estimatedRate}</td>
                      <td className="py-2 text-center">{it.gstRate}%</td>
                      <td className="py-2 text-right font-mono font-bold">₹{it.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-black text-slate-900">
                    <td colSpan={5} className="py-2.5 text-right uppercase text-[11px]">Total Estimated Order Value:</td>
                    <td className="py-2.5 text-right text-sm">₹{previewPO.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Signature Line */}
              <div className="pt-8 flex justify-between items-end text-slate-600 text-[11px]">
                <div>
                  <p className="text-[10px] text-slate-400">Notes: {previewPO.notes || 'Goods subject to inspection upon arrival.'}</p>
                </div>
                <div className="text-right">
                  <div className="w-40 border-b border-slate-400 mb-1"></div>
                  <p className="font-bold text-slate-800">Authorized Pharmacist Sign</p>
                  <p className="text-[10px] text-slate-400">GenQuanta Retail Pharmacy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
