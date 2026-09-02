import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { submitGRNEntry, navigateTo } from '../store/posSlice';
import type { GRNItem, GRNEntry } from '../types/pos';
import api from '../utils/api';
import {
  Loader2,
  Package, Plus, CheckCircle2, Trash2, FileText, Building, Calendar, Truck
} from 'lucide-react';

export const PurchaseGRNPage: React.FC = () => {
  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.pos.products);
  const grnEntries = useSelector((state: RootState) => state.pos.grnEntries);

  const [grnHistoryFromApi, setGrnHistoryFromApi] = useState<any[]>([]);
  const [grnHistoryLoading, setGrnHistoryLoading] = useState<boolean>(true);

  // ── Fetch GRN history from API on mount ────────────────────────
  useEffect(() => {
    const fetchGrnHistory = async () => {
      try {
        const res = await api.get('/grn?limit=50&sort=-receivedDate');
        if (res.data.success) {
          setGrnHistoryFromApi(res.data.data);
        }
      } catch (err) {
        console.error('[PurchaseGRNPage] Failed to fetch GRN history:', err);
      } finally {
        setGrnHistoryLoading(false);
      }
    };
    fetchGrnHistory();
  }, []);

  const grnDisplayList = grnHistoryFromApi.length > 0 ? grnHistoryFromApi : grnEntries;

  // Supplier & Invoice Header State
  const [supplierName, setSupplierName] = useState<string>('MedLife Distributors Pvt Ltd');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>(`INV-SUP-${Math.floor(10000 + Math.random() * 90000)}`);
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Line Item Entry State
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?._id || '');
  const [batchNo, setBatchNo] = useState<string>(`BT-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [expiryDate, setExpiryDate] = useState<string>('2027-08-31');
  const [quantity, setQuantity] = useState<number>(100);
  const [purchaseRate, setPurchaseRate] = useState<number>(140);
  const [mrp, setMrp] = useState<number>(200);
  const [sellingPrice, setSellingPrice] = useState<number>(185);

  // Active Draft Items
  const [grnItems, setGrnItems] = useState<GRNItem[]>([]);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const selectedProduct = products.find(p => p._id === selectedProductId);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find(p => p._id === id);
    if (prod) {
      setMrp(prod.unitMRP);
      setSellingPrice(prod.sellingPrice);
      setPurchaseRate(Number((prod.sellingPrice * 0.75).toFixed(2)));
    }
  };

  const handleAddLineItem = () => {
    if (!selectedProduct) return;
    if (quantity <= 0 || purchaseRate <= 0) {
      alert('Please enter valid quantity and purchase rate!');
      return;
    }

    const lineTotal = Number((quantity * purchaseRate * (1 + selectedProduct.gstRate / 100)).toFixed(2));

    const newItem: GRNItem = {
      productId: selectedProduct._id,
      productName: selectedProduct.name,
      batchNumber: batchNo,
      expiryDate,
      quantity,
      purchaseRate,
      mrp,
      sellingPrice,
      gstRate: selectedProduct.gstRate,
      totalAmount: lineTotal
    };

    setGrnItems(prev => [...prev, newItem]);

    // Reset line form for next item
    setBatchNo(`BT-2026-${Math.floor(100 + Math.random() * 900)}`);
    setQuantity(100);
  };

  const handleRemoveLineItem = (index: number) => {
    setGrnItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalGrnAmount = grnItems.reduce((sum, item) => sum + item.totalAmount, 0);

  const handleSubmitGRN = async () => {
    if (grnItems.length === 0) {
      alert('Please add at least one line item to submit the Stock Purchase GRN!');
      return;
    }

    const payload = {
      supplierName,
      supplierInvoiceNo,
      receivedDate,
      items: grnItems,
      totalAmount: Number(totalGrnAmount.toFixed(2))
    };

    try {
      const res = await api.post('/grn', payload);
      const grnRecord = res.data.data;
      dispatch(submitGRNEntry(grnRecord));
      setIsSaved(true);

      setTimeout(() => {
        setGrnItems([]);
        setIsSaved(false);
        setSupplierInvoiceNo(`INV-SUP-${Math.floor(10000 + Math.random() * 90000)}`);
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit GRN');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── TOP HEADER & ACTIONS ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Truck className="w-6 h-6 text-amber-600" />
            <span>Stock Purchase &amp; Goods Receipt Note (GRN) Entry</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Record incoming stock shipments from suppliers, update batch stock &amp; cost rates
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => dispatch(navigateTo('INVENTORY'))}
            className="flex items-center space-x-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <Package className="w-4 h-4 text-emerald-600" />
            <span>View Inventory Catalog</span>
          </button>
        </div>
      </div>

      {/* ── SUPPLIER & INVOICE HEADER FORM ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">
          Supplier &amp; Shipment Metadata
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 mb-1">Supplier / Vendor Name *</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="MedLife Distributors"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Supplier Bill / Invoice No. *</label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={supplierInvoiceNo}
                onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                placeholder="INV-SUP-8890"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1">Received Date *</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── ADD LINE ITEM SECTION ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">
          Add Stock Medicine Item
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-7 gap-2.5 text-xs font-semibold">
          {/* Select Medicine */}
          <div className="col-span-2">
            <label className="block text-slate-700 mb-1">Select Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleSelectProduct(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold"
            >
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.saltComposition}) - Current Stock: {p.totalStock}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-slate-700 mb-1">Batch No. *</label>
            <input
              type="text"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-slate-700 mb-1">Expiry Date *</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-slate-700 mb-1">Qty Received *</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-xl font-bold"
            />
          </div>

          {/* Cost Price / Purchase Rate */}
          <div>
            <label className="block text-slate-700 mb-1">Cost Rate (₹) *</label>
            <input
              type="number"
              step="0.01"
              value={purchaseRate}
              onChange={(e) => setPurchaseRate(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border border-slate-300 rounded-xl font-bold text-amber-800"
            />
          </div>

          {/* Add Line Button */}
          <div className="flex items-end">
            <button
              onClick={handleAddLineItem}
              className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── DRAFT GRN ITEMS TABLE ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
          <span>GRN Line Items ({grnItems.length})</span>
          <span className="text-amber-800 font-extrabold text-sm">
            Total Purchase Value: ₹{totalGrnAmount.toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '700px' }}>
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-2.5">Medicine Name</th>
                <th className="px-3 py-2.5 text-center">Batch No</th>
                <th className="px-3 py-2.5 text-center">Expiry</th>
                <th className="px-3 py-2.5 text-center">Received Qty</th>
                <th className="px-3 py-2.5 text-right">Cost Rate</th>
                <th className="px-3 py-2.5 text-right">Selling Price</th>
                <th className="px-3 py-2.5 text-right">GST %</th>
                <th className="px-4 py-2.5 text-right">Line Total</th>
                <th className="px-3 py-2.5 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grnItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No items added yet. Select a medicine above and click "Add Item" to add to this purchase note.
                  </td>
                </tr>
              ) : (
                grnItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{item.productName}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-700">{item.batchNumber}</td>
                    <td className="px-3 py-2.5 text-center text-slate-500">{item.expiryDate}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-amber-800">₹{item.purchaseRate.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-800">₹{item.sellingPrice.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500">{item.gstRate}%</td>
                    <td className="px-4 py-2.5 text-right font-extrabold text-slate-900">₹{item.totalAmount.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => handleRemoveLineItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Submit Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center flex-wrap gap-2">
          {isSaved ? (
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-bounce" />
              <span>GRN Stock Entry Complete! Stock levels auto-updated in Catalog.</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">
              Submitting updates inventory batches &amp; total stock counts automatically.
            </span>
          )}

          <button
            onClick={handleSubmitGRN}
            disabled={grnItems.length === 0}
            className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer ${
              grnItems.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete &amp; Update Stock Inventory (₹{totalGrnAmount.toFixed(2)})</span>
          </button>
        </div>
      </div>

      {/* ── RECENT COMPLETED GRN HISTORY ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 font-heading">
          Completed GRN Purchase Log ({grnDisplayList.length})
        </h3>

        {grnHistoryLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading GRN history...
          </div>
        ) : grnDisplayList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">No completed GRN entries yet.</div>
        ) : (
          <div className="space-y-2">
            {grnDisplayList.map((grn: any, idx: number) => (
              <div key={grn.grnId || grn._id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-800">{grn.grnNumber}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="font-semibold text-slate-700">{grn.supplierName}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-slate-500">Inv #: {grn.supplierInvoiceNo}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-800">₹{grn.totalAmount?.toFixed(2)}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full ml-2">
                    {grn.items?.length || '?'} Items Received
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
