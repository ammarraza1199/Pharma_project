import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { Product, GRNItem } from '../types/pos';
import {
  parseInvoiceFile,
  downloadSampleExcelTemplate,
  normalizeExpiryDate,
  loadSampleInvoicePreset
} from '../utils/excelInvoiceParser';
import type { ParsedInvoiceResult, ParsedInvoiceRow } from '../utils/excelInvoiceParser';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Trash2,
  Check,
  Search,
  Building,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  Camera,
  Sparkles
} from 'lucide-react';

interface ExcelInvoiceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportVerifiedItems: (items: GRNItem[], metadata: { supplierName: string; supplierInvoiceNo: string; receivedDate: string }) => void;
}

export const ExcelInvoiceImportModal: React.FC<ExcelInvoiceImportModalProps> = ({
  isOpen,
  onClose,
  onImportVerifiedItems
}) => {
  const products = useSelector((state: RootState) => state.pos.products);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parsing result
  const [parsedData, setParsedData] = useState<ParsedInvoiceResult | null>(null);
  const [editableRows, setEditableRows] = useState<ParsedInvoiceRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Invoice Metadata
  const [supplierName, setSupplierName] = useState<string>('MedLife Distributors Pvt Ltd');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>('');
  const [receivedDate, setReceivedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter tab: 'ALL' | 'VALID' | 'WARNING' | 'ERROR'
  const [filterTab, setFilterTab] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const applyParsedResult = (result: ParsedInvoiceResult) => {
    setParsedData(result);
    setEditableRows(result.rows);

    // By default, select all valid and warning rows (exclude critical errors like expired)
    const initialSelected = new Set<string>();
    result.rows.forEach(r => {
      if (r.status !== 'ERROR') {
        initialSelected.add(r.rowId);
      }
    });
    setSelectedRowIds(initialSelected);

    if (result.detectedSupplier) setSupplierName(result.detectedSupplier);
    if (result.detectedInvoiceNo) setSupplierInvoiceNo(result.detectedInvoiceNo);
    else setSupplierInvoiceNo(`INV-IMP-${Math.floor(10000 + Math.random() * 90000)}`);
    if (result.detectedInvoiceDate) setReceivedDate(result.detectedInvoiceDate);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await parseInvoiceFile(file, products);
      applyParsedResult(result);
    } catch (err: any) {
      console.error('[ExcelInvoiceImportModal] Parse error:', err);
      setErrorMsg(err.message || 'Failed to parse invoice file. Please check format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreset = (preset: 'EXCEL_MEDLIFE' | 'OCR_APOLLO_SCANNED' | 'PDF_SUN_PHARMA') => {
    setErrorMsg(null);
    const result = loadSampleInvoicePreset(preset, products);
    applyParsedResult(result);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // ── Row Editing Helpers ─────────────────────────────────────────
  const updateRowField = (rowId: string, field: keyof ParsedInvoiceRow, value: any) => {
    setEditableRows(prev =>
      prev.map(row => {
        if (row.rowId !== rowId) return row;

        const updated: ParsedInvoiceRow = { ...row, [field]: value };

        // If matchedProduct changed, sync rates if available
        if (field === 'matchedProduct' && value) {
          const prod = value as Product;
          updated.originalName = prod.name;
          updated.matchConfidence = 'EXACT';
          updated.mrp = prod.unitMRP;
          updated.sellingPrice = prod.sellingPrice;
          updated.gstRate = prod.gstRate;
          updated.purchaseRate = Number((prod.sellingPrice * 0.75).toFixed(2));
        }

        // If expiryDate changed, re-validate
        if (field === 'expiryDate') {
          const expNorm = normalizeExpiryDate(value);
          const newIssues = row.issues.filter(i => !i.toLowerCase().includes('expiry'));
          if (expNorm.isExpired) {
            newIssues.push(`Medicine is already EXPIRED (${expNorm.dateStr})`);
          } else if (expNorm.isNearExpiry) {
            newIssues.push(`Warning: Short expiry date within 90 days (${expNorm.dateStr})`);
          }
          updated.issues = newIssues;
        }

        // Recalculate line total
        const qty = updated.quantity || 1;
        const rate = updated.purchaseRate || 0;
        const gst = updated.gstRate || 0;
        updated.totalAmount = Number((qty * rate * (1 + gst / 100)).toFixed(2));

        // Re-evaluate row status
        const hasExpiryError = updated.issues.some(i => i.toLowerCase().includes('already expired'));
        if (hasExpiryError || updated.quantity <= 0) {
          updated.status = 'ERROR';
        } else if (updated.issues.length > 0 || updated.matchConfidence === 'UNMATCHED') {
          updated.status = 'WARNING';
        } else {
          updated.status = 'VALID';
        }

        return updated;
      })
    );
  };

  const removeRow = (rowId: string) => {
    setEditableRows(prev => prev.filter(r => r.rowId !== rowId));
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      next.delete(rowId);
      return next;
    });
  };

  // ── Selection Toggles ───────────────────────────────────────────
  const toggleRowSelect = (rowId: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.size === filteredRows.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredRows.map(r => r.rowId)));
    }
  };

  // Filtered rows
  const filteredRows = editableRows.filter(r => {
    if (filterTab === 'VALID' && r.status !== 'VALID') return false;
    if (filterTab === 'WARNING' && r.status !== 'WARNING') return false;
    if (filterTab === 'ERROR' && r.status !== 'ERROR') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (r.matchedProduct ? r.matchedProduct.name : r.originalName).toLowerCase();
      const batch = r.batchNumber.toLowerCase();
      return name.includes(q) || batch.includes(q);
    }
    return true;
  });

  const validCount = editableRows.filter(r => r.status === 'VALID').length;
  const warningCount = editableRows.filter(r => r.status === 'WARNING').length;
  const errorCount = editableRows.filter(r => r.status === 'ERROR').length;

  const selectedRows = editableRows.filter(r => selectedRowIds.has(r.rowId));
  const selectedTotalAmount = selectedRows.reduce((sum, r) => sum + r.totalAmount, 0);

  // ── Import Action ───────────────────────────────────────────────
  const handleConfirmImport = () => {
    if (selectedRows.length === 0) {
      alert('Please select at least one row to import.');
      return;
    }

    const unassigned = selectedRows.filter(r => !r.matchedProduct);
    if (unassigned.length > 0) {
      const proceed = window.confirm(
        `${unassigned.length} items are not linked to an existing catalog product. They will be imported with their distributor names. Proceed?`
      );
      if (!proceed) return;
    }

    const grnItems: GRNItem[] = selectedRows.map(r => ({
      productId: r.matchedProduct ? r.matchedProduct._id : `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productName: r.matchedProduct ? r.matchedProduct.name : r.originalName,
      batchNumber: r.batchNumber,
      expiryDate: r.expiryDate,
      quantity: r.quantity + (r.freeQuantity || 0),
      purchaseRate: r.purchaseRate,
      mrp: r.mrp,
      sellingPrice: r.sellingPrice,
      gstRate: r.gstRate,
      totalAmount: r.totalAmount
    }));

    onImportVerifiedItems(grnItems, {
      supplierName: supplierName || 'Distributor',
      supplierInvoiceNo: supplierInvoiceNo || `INV-${Date.now()}`,
      receivedDate: receivedDate || new Date().toISOString().split('T')[0]
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* ── MODAL HEADER ────────────────────────────────────────────── */}
        <div className="p-5 border-b border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading tracking-tight flex items-center space-x-2">
                <span>Excel, CSV &amp; OCR Invoice Stock Importer</span>
                <span className="text-[10px] bg-amber-500/30 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                  Smart Auto-Match &amp; OCR
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Bulk import supplier invoices from Excel/CSV spreadsheets or PDF/scanned bills via OCR, match catalog, audit batch &amp; expiry, and verify with human review before updating POS stock
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadSampleExcelTemplate}
              className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              title="Download standard Excel format for distributors"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Sample Template</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── MODAL BODY ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          
          {/* UPLOAD DROPZONE & SAMPLE PRESETS */}
          {!parsedData && (
            <div className="space-y-4">
              {/* Quick Preset Buttons */}
              <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quick Test Demo Invoices (Click to Load Instantly):</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Test Excel import, Optical Character Recognition (OCR), or PDF extraction with 1 click
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <button
                    onClick={() => handleLoadPreset('EXCEL_MEDLIFE')}
                    className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Test Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleLoadPreset('OCR_APOLLO_SCANNED')}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-200" />
                    <span>Test Scanned Bill (OCR)</span>
                  </button>
                  <button
                    onClick={() => handleLoadPreset('PDF_SUN_PHARMA')}
                    className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Test PDF Invoice (OCR)</span>
                  </button>
                </div>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50/60 scale-[1.01]'
                    : 'border-slate-300 bg-white hover:border-amber-500 hover:bg-slate-50/80 shadow-xs'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .pdf, .png, .jpg, .jpeg, .webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  {isLoading ? (
                    <div className="w-7 h-7 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {isLoading ? 'Processing and extracting invoice data...' : 'Upload Distributor Invoice File'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Drag &amp; drop your supplier's Excel spreadsheet (.xlsx, .xls, .csv) or scanned invoice / PDF (.pdf, .jpg, .png) here, or click to browse
                </p>
                <div className="flex items-center justify-center flex-wrap gap-1.5 mt-4 text-[11px] text-slate-500 font-medium">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-bold">.XLSX</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-bold">.XLS</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-mono font-bold">.CSV</span>
                  <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200 font-mono font-bold">.PDF</span>
                  <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 font-mono font-bold">.JPG / .PNG (OCR)</span>
                  <span>• Auto-detects columns: Medicine, Batch, Expiry, Qty, Cost, MRP, GST</span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-rose-700 text-xs font-semibold">
              <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PARSED INVOICE VIEW */}
          {parsedData && (
            <div className="space-y-4">
              
              {/* FILE METADATA & RE-UPLOAD BAR */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                      <span>{parsedData.fileName}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                        Sheet: {parsedData.selectedSheet}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {editableRows.length} line items extracted from distributor invoice
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-slate-600 hover:text-amber-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    Change File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv, .pdf, .png, .jpg, .jpeg, .webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              {/* OCR EXTRACTION NOTIFICATION */}
              {parsedData.summary.averageOcrConfidence !== undefined && (
                <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-950">
                        Optical Character Recognition (OCR) Engine Active — Average Accuracy: {parsedData.summary.averageOcrConfidence}%
                      </span>
                      <p className="text-[11px] text-emerald-700">
                        Extracted text from {parsedData.sourceType === 'OCR_IMAGE' ? 'Scanned Document / Photo' : 'Distributor PDF Invoice'}. Low-confidence items are highlighted with warnings for human verification.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold">
                    OCR Mode
                  </span>
                </div>
              )}

              {/* INVOICE HEADER DETAILS (SUPPLIER & INVOICE NO) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Invoice &amp; Supplier Metadata</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-600 mb-1">Distributor / Supplier Name *</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        placeholder="e.g. MedLife Distributors"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Distributor Invoice No. *</label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={supplierInvoiceNo}
                        onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                        placeholder="e.g. INV-8890"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Received Date *</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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

              {/* VERIFICATION METRICS & FILTER TABS */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center space-x-1.5 bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
                  <button
                    onClick={() => setFilterTab('ALL')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Items ({editableRows.length})
                  </button>
                  <button
                    onClick={() => setFilterTab('VALID')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                      filterTab === 'VALID' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Valid ({validCount})</span>
                  </button>
                  <button
                    onClick={() => setFilterTab('WARNING')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                      filterTab === 'WARNING' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Warnings ({warningCount})</span>
                  </button>
                  <button
                    onClick={() => setFilterTab('ERROR')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                      filterTab === 'ERROR' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Errors ({errorCount})</span>
                  </button>
                </div>

                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search medicine or batch..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* INTERACTIVE VERIFICATION TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[46vh]">
                  <table className="w-full text-left border-collapse text-xs" style={{ minWidth: '950px' }}>
                    <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5 text-center w-10">
                          <input
                            type="checkbox"
                            checked={filteredRows.length > 0 && selectedRowIds.size === filteredRows.length}
                            onChange={toggleSelectAll}
                            className="rounded-sm text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-3 py-2.5">Distributor Medicine Name</th>
                        <th className="px-3 py-2.5">Catalog Match</th>
                        <th className="px-3 py-2.5 text-center">Batch No</th>
                        <th className="px-3 py-2.5 text-center">Expiry</th>
                        <th className="px-3 py-2.5 text-center">Qty</th>
                        <th className="px-3 py-2.5 text-right">Cost (PTR)</th>
                        <th className="px-3 py-2.5 text-right">MRP</th>
                        <th className="px-3 py-2.5 text-right">Selling</th>
                        <th className="px-3 py-2.5 text-right">GST %</th>
                        <th className="px-3 py-2.5 text-right">Line Total</th>
                        <th className="px-3 py-2.5 text-center">Audit Status</th>
                        <th className="px-2 py-2.5 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="py-12 text-center text-slate-400">
                            No items match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const isSelected = selectedRowIds.has(row.rowId);
                          return (
                            <tr
                              key={row.rowId}
                              className={`transition-colors ${
                                isSelected ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50'
                              } ${row.status === 'ERROR' ? 'bg-rose-50/20' : ''}`}
                            >
                              {/* Checkbox */}
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleRowSelect(row.rowId)}
                                  className="rounded-sm text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                              </td>

                              {/* Original Name */}
                              <td className="px-3 py-2 font-bold text-slate-900 max-w-[200px]">
                                <div className="truncate" title={row.originalName}>
                                  {row.originalName}
                                </div>
                                {row.isOcrExtracted && row.ocrConfidence !== undefined && (
                                  <div className="mt-0.5">
                                    <span className={`inline-flex items-center text-[9.5px] px-1.5 py-0.2 rounded-md font-bold ${
                                      row.ocrConfidence < 80
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}>
                                      OCR: {row.ocrConfidence}% {row.ocrConfidence < 80 ? '⚠️ Verify' : '✓'}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Catalog Match Selector */}
                              <td className="px-3 py-2">
                                <select
                                  value={row.matchedProduct?._id || ''}
                                  onChange={(e) => {
                                    const prod = products.find(p => p._id === e.target.value) || null;
                                    updateRowField(row.rowId, 'matchedProduct', prod);
                                  }}
                                  className={`w-44 text-[11px] p-1 border rounded-lg focus:outline-hidden font-medium ${
                                    row.matchedProduct
                                      ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                                      : 'border-amber-300 bg-amber-50/50 text-amber-900 font-bold'
                                  }`}
                                >
                                  <option value="">-- Unmatched (Click to Select) --</option>
                                  {products.map(p => (
                                    <option key={p._id} value={p._id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Batch No */}
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="text"
                                  value={row.batchNumber}
                                  onChange={(e) => updateRowField(row.rowId, 'batchNumber', e.target.value)}
                                  className="w-24 text-center font-mono text-[11px] p-1 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                                />
                              </td>

                              {/* Expiry Date */}
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="date"
                                  value={row.expiryDate}
                                  onChange={(e) => updateRowField(row.rowId, 'expiryDate', e.target.value)}
                                  className={`w-30 text-center text-[11px] p-1 border rounded-lg focus:ring-1 focus:ring-amber-500 ${
                                    row.issues.some(i => i.toLowerCase().includes('already expired'))
                                      ? 'border-rose-400 bg-rose-50 text-rose-700 font-bold'
                                      : 'border-slate-300'
                                  }`}
                                />
                              </td>

                              {/* Quantity */}
                              <td className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  value={row.quantity}
                                  onChange={(e) => updateRowField(row.rowId, 'quantity', parseInt(e.target.value) || 0)}
                                  className="w-16 text-center font-bold text-slate-900 text-[11px] p-1 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                                />
                              </td>

                              {/* Cost Rate */}
                              <td className="px-2 py-2 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.purchaseRate}
                                  onChange={(e) => updateRowField(row.rowId, 'purchaseRate', parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right font-bold text-amber-800 text-[11px] p-1 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                                />
                              </td>

                              {/* MRP */}
                              <td className="px-2 py-2 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.mrp}
                                  onChange={(e) => updateRowField(row.rowId, 'mrp', parseFloat(e.target.value) || 0)}
                                  className="w-18 text-right text-slate-700 text-[11px] p-1 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                                />
                              </td>

                              {/* Selling Price */}
                              <td className="px-2 py-2 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={row.sellingPrice}
                                  onChange={(e) => updateRowField(row.rowId, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                  className="w-18 text-right font-semibold text-emerald-800 text-[11px] p-1 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                                />
                              </td>

                              {/* GST % */}
                              <td className="px-2 py-2 text-right">
                                <input
                                  type="number"
                                  value={row.gstRate}
                                  onChange={(e) => updateRowField(row.rowId, 'gstRate', parseFloat(e.target.value) || 0)}
                                  className="w-14 text-right text-slate-600 text-[11px] p-1 border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                                />
                              </td>

                              {/* Line Total */}
                              <td className="px-3 py-2 text-right font-extrabold text-slate-900">
                                ₹{row.totalAmount.toFixed(2)}
                              </td>

                              {/* Audit Status */}
                              <td className="px-3 py-2 text-center">
                                {row.status === 'VALID' && (
                                  <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Verified</span>
                                  </span>
                                )}
                                {row.status === 'WARNING' && (
                                  <span
                                    className="inline-flex items-center space-x-1 text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full cursor-help"
                                    title={row.issues.join(' • ')}
                                  >
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>{row.issues[0] || 'Attention'}</span>
                                  </span>
                                )}
                                {row.status === 'ERROR' && (
                                  <span
                                    className="inline-flex items-center space-x-1 text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full cursor-help"
                                    title={row.issues.join(' • ')}
                                  >
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    <span>{row.issues[0] || 'Invalid'}</span>
                                  </span>
                                )}
                              </td>

                              {/* Remove */}
                              <td className="px-2 py-2 text-center">
                                <button
                                  onClick={() => removeRow(row.rowId)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                                  title="Remove line"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── MODAL FOOTER ────────────────────────────────────────────── */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-4 text-xs">
            <span className="font-bold text-slate-700">
              Selected: <span className="text-amber-700 font-extrabold">{selectedRows.length}</span> / {editableRows.length} items
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-slate-700">
              Selected Invoice Value: <span className="text-amber-800 font-extrabold text-sm">₹{selectedTotalAmount.toFixed(2)}</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            {parsedData && (
              <button
                onClick={handleConfirmImport}
                disabled={selectedRows.length === 0}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center space-x-2 transition-all cursor-pointer ${
                  selectedRows.length === 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
                }`}
              >
                <span>Confirm &amp; Load {selectedRows.length} Items into GRN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
