import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { navigateTo } from '../store/posSlice';
import api from '../utils/api';
import type { Product, ScheduleCategory, StockStatus, BatchInfo } from '../types/pos';
import {
  Package, Search, Plus, Filter, AlertTriangle, PackageX,
  TrendingUp, Edit3, X, Truck, Layers
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 50;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'ALL' | StockStatus>('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | ScheduleCategory>('ALL');

  // Modal State for Add/Edit Medicine
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formBrand, setFormBrand] = useState<string>('');
  const [formSalt, setFormSalt] = useState<string>('');
  const [formBarcode, setFormBarcode] = useState<string>('');
  const [formHsn, setFormHsn] = useState<string>('');
  const [formGst, setFormGst] = useState<number>(12);
  const [formMRP, setFormMRP] = useState<number>(100);
  const [formPrice, setFormPrice] = useState<number>(90);
  const [formMargin, setFormMargin] = useState<number>(20);
  const [formSchedule, setFormSchedule] = useState<ScheduleCategory>('REGULAR');
  const [formBatchNo, setFormBatchNo] = useState<string>('BT-2026-01');
  const [formExpiry, setFormExpiry] = useState<string>('2026-12-31');
  const [formInitialStock, setFormInitialStock] = useState<number>(50);
  const [formRack, setFormRack] = useState<string>('Rack A-01');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products', {
        params: { search: searchTerm, stockStatus: stockFilter, schedule: scheduleFilter, page, limit }
      });
      if (res.data.success) {
        setProducts(res.data.data);
        setTotalProducts(res.data.total);
      }
      
      const lowRes = await api.get('/products/stock/low');
      if (lowRes.data.success) {
        const low = lowRes.data.data;
        setLowStockCount(low.filter((p: Product) => p.stockStatus === 'LOW_STOCK' || (p.totalStock > 0 && p.totalStock <= 20)).length);
        setOutOfStockCount(low.filter((p: Product) => p.stockStatus === 'OUT_OF_STOCK' || p.totalStock === 0).length);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, stockFilter, scheduleFilter, page]);

  // KPI Calculations (Total Stock Units approximate if backend doesn't provide it, we'll hide it or show N/A)
  const totalStockUnits = 'N/A'; 

  // Filtered Products List is now handled by the backend
  const filteredProducts = products;

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBrand('');
    setFormSalt('');
    setFormBarcode(`8901234${Math.floor(100000 + Math.random() * 900000)}`);
    setFormHsn('30049060');
    setFormGst(12);
    setFormMRP(100);
    setFormPrice(90);
    setFormMargin(20);
    setFormSchedule('REGULAR');
    setFormBatchNo(`BT-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormExpiry('2027-06-30');
    setFormInitialStock(50);
    setFormRack('Rack A-01');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBrand(p.brand);
    setFormSalt(p.saltComposition);
    setFormBarcode(p.barcode);
    setFormHsn(p.hsnCode);
    setFormGst(p.gstRate);
    setFormMRP(p.unitMRP);
    setFormPrice(p.sellingPrice);
    setFormMargin(p.grossMarginPercent);
    setFormSchedule(p.scheduleCategory);
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        // Update Product
        await api.put(`/products/${editingProduct._id}`, {
          name: formName,
          brand: formBrand,
          saltComposition: formSalt,
          barcode: formBarcode,
          hsnCode: formHsn,
          gstRate: formGst,
          unitMRP: formMRP,
          sellingPrice: formPrice,
          grossMarginPercent: formMargin,
          scheduleCategory: formSchedule,
        });
      } else {
        // Add New Product with Initial Batch
        const initialBatch = {
          batchNumber: formBatchNo,
          expiryDate: formExpiry,
          stockQuantity: formInitialStock,
          location: formRack,
          mrp: formMRP
        };

        await api.post('/products', {
          name: formName,
          brand: formBrand,
          saltComposition: formSalt,
          barcode: formBarcode,
          hsnCode: formHsn,
          gstRate: formGst,
          unitMRP: formMRP,
          sellingPrice: formPrice,
          grossMarginPercent: formMargin,
          scheduleCategory: formSchedule,
          stockStatus: formInitialStock > 20 ? 'IN_STOCK' : formInitialStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
          totalStock: formInitialStock,
          batches: [initialBatch]
        });
      }
      setShowAddModal(false);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product. Please try again.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 space-y-4 font-sans select-none">

      {/* ── HEADER & NAVIGATION ────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Pharmacy Inventory &amp; Stock Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage medicine master database, batch stock, pricing &amp; Schedule compliance
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* GRN Purchase Entry Quick Link */}
          <button
            onClick={() => dispatch(navigateTo('PURCHASE_GRN'))}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>+ Stock Purchase (GRN)</span>
          </button>

          {/* Add New Medicine Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Medicine</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Medicines</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{totalProducts}</h3>
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stock Units</p>
            <h3 className="text-xl font-black text-slate-900 font-heading">{totalStockUnits.toLocaleString()}</h3>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Items</p>
            <h3 className="text-xl font-black text-amber-700 font-heading">{lowStockCount}</h3>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex items-center space-x-3">
          <div className="bg-rose-100 p-2.5 rounded-xl text-rose-700">
            <PackageX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Out of Stock</p>
            <h3 className="text-xl font-black text-rose-700 font-heading">{outOfStockCount}</h3>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS BAR ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Medicine Name, Salt, Brand, Barcode, HSN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="text-slate-500 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Stock:</span>
          </span>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-hidden"
          >
            <option value="ALL">All Stock</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          <span className="text-slate-500 ml-2">Schedule:</span>
          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value as any)}
            className="p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:outline-hidden"
          >
            <option value="ALL">All Categories</option>
            <option value="REGULAR">Regular OTC</option>
            <option value="SCHEDULE_H">Schedule H</option>
            <option value="SCHEDULE_H1">Schedule H1</option>
            <option value="SCHEDULE_X">Schedule X (Narcotic)</option>
          </select>
        </div>
      </div>

      {/* ── INVENTORY MEDICINES TABLE ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-600">
          <span>Showing {filteredProducts.length} of {totalProducts} Products {loading && <span className="text-emerald-600 ml-2 animate-pulse">Loading...</span>}</span>
          <span className="text-slate-400">Click Edit to update prices or Schedule classification</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: '900px' }}>
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">Medicine &amp; Salt Composition</th>
                <th className="px-3 py-3">Brand &amp; HSN</th>
                <th className="px-3 py-3 text-center">Schedule</th>
                <th className="px-3 py-3 text-center">Total Stock</th>
                <th className="px-3 py-3 text-right">Selling Price</th>
                <th className="px-3 py-3 text-right">Margin %</th>
                <th className="px-4 py-3">Active Batches</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No medicines match the selected search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOut = product.stockStatus === 'OUT_OF_STOCK' || product.totalStock === 0;
                  const isLow = product.stockStatus === 'LOW_STOCK' || (product.totalStock > 0 && product.totalStock <= 20);

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/80 transition-colors">

                      {/* Medicine Name & Salt */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-xs">{product.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{product.saltComposition}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">Barcode: {product.barcode}</div>
                      </td>

                      {/* Brand & HSN */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-800">{product.brand}</div>
                        <div className="text-[10px] text-slate-500">HSN: {product.hsnCode} (GST {product.gstRate}%)</div>
                      </td>

                      {/* Schedule Category */}
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          product.scheduleCategory === 'SCHEDULE_X' ? 'bg-rose-600 text-white animate-pulse' :
                          product.scheduleCategory === 'SCHEDULE_H' ? 'bg-amber-500 text-white' :
                          product.scheduleCategory === 'SCHEDULE_H1' ? 'bg-orange-500 text-white' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {product.scheduleCategory}
                        </span>
                      </td>

                      {/* Stock Status & Units */}
                      <td className="px-3 py-3 text-center">
                        <div className="font-black text-sm text-slate-900">{product.totalStock}</div>
                        {isOut ? (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">Out of Stock</span>
                        ) : isLow ? (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">Low Stock</span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">In Stock</span>
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="px-3 py-3 text-right">
                        <div className="font-extrabold text-emerald-800 text-xs">₹{product.sellingPrice.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 line-through">MRP ₹{product.unitMRP.toFixed(2)}</div>
                      </td>

                      {/* Gross Margin */}
                      <td className="px-3 py-3 text-right">
                        <span className="font-bold text-slate-700 flex items-center justify-end space-x-0.5">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span>{product.grossMarginPercent}%</span>
                        </span>
                      </td>

                      {/* Batches Pill List */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.batches.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">No active batches</span>
                          ) : (
                            product.batches.map((b) => (
                              <span
                                key={b.batchNumber}
                                className="text-[10px] bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono"
                              >
                                {b.batchNumber} (Exp: {b.expiryDate}) - {b.stockQuantity}u
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Edit Button */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Product Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-600">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
          >
            Previous
          </button>
          <span>Page {page} of {Math.ceil(totalProducts / limit) || 1}</span>
          <button 
            disabled={page >= Math.ceil(totalProducts / limit)} 
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded disabled:opacity-50 hover:bg-slate-50 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* ── ADD / EDIT MEDICINE MODAL ──────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-modal rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900 font-heading">
                {editingProduct ? `Edit Medicine: ${editingProduct.name}` : 'Add New Medicine to Master Catalog'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Augmentin 625 Duo"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 mb-1">Brand / Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="GlaxoSmithKline"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 mb-1">Salt Composition *</label>
                  <input
                    type="text"
                    required
                    value={formSalt}
                    onChange={(e) => setFormSalt(e.target.value)}
                    placeholder="Amoxicillin 500mg + Clavulanic Acid 125mg"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Barcode / EAN</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formHsn}
                    onChange={(e) => setFormHsn(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={formGst}
                    onChange={(e) => setFormGst(parseInt(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Schedule Category</label>
                  <select
                    value={formSchedule}
                    onChange={(e) => setFormSchedule(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    <option value="REGULAR">REGULAR OTC</option>
                    <option value="SCHEDULE_H">SCHEDULE H</option>
                    <option value="SCHEDULE_H1">SCHEDULE H1</option>
                    <option value="SCHEDULE_X">SCHEDULE X (Narcotic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Unit MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMRP}
                    onChange={(e) => setFormMRP(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-emerald-800"
                  />
                </div>
              </div>

              {!editingProduct && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 mt-2">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Initial Batch Details</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500">Batch No</label>
                      <input
                        type="text"
                        value={formBatchNo}
                        onChange={(e) => setFormBatchNo(e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Expiry Date</label>
                      <input
                        type="date"
                        value={formExpiry}
                        onChange={(e) => setFormExpiry(e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Initial Stock</label>
                      <input
                        type="number"
                        value={formInitialStock}
                        onChange={(e) => setFormInitialStock(parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 border border-slate-300 rounded font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Rack Location</label>
                      <input
                        type="text"
                        value={formRack}
                        onChange={(e) => setFormRack(e.target.value)}
                        className="w-full p-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product & Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
