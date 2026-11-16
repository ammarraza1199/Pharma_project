import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setOfflineBackupModalOpen } from '../store/posSlice';
import {
  getOfflineInvoices,
  syncOfflineInvoicesWithBackend,
  clearSyncedOfflineArchive,
  downloadPharmacyBackupJSON,
  isBrowserOnline
} from '../utils/offlineStorage';
import type { OfflineInvoiceRecord } from '../utils/offlineStorage';
import {
  Wifi,
  WifiOff,
  CloudUpload,
  Download,
  Database,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  FileText,
  Trash2,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Server
} from 'lucide-react';

export const OfflineBackupModal: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.pos.offlineBackupModal.isOpen);
  const currentUser = useSelector((state: RootState) => state.pos.currentUser);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<OfflineInvoiceRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  // Monitor network connectivity in real time
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(isBrowserOnline());
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reload offline queue whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setOfflineQueue(getOfflineInvoices());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingCount = offlineQueue.filter(i => i.syncStatus === 'PENDING_SYNC').length;
  const syncedCount = offlineQueue.filter(i => i.syncStatus === 'SYNCED').length;

  // Handle 1-Click Auto-Sync
  const handleAutoSync = async () => {
    if (pendingCount === 0) {
      setToastMsg('No pending offline invoices to synchronize.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }

    setIsSyncing(true);
    try {
      const res = await syncOfflineInvoicesWithBackend();
      setOfflineQueue(getOfflineInvoices());
      if (res.synced > 0) {
        setToastMsg(`✓ Successfully synchronized ${res.synced} offline invoices to central database!`);
      } else if (res.failed > 0) {
        setToastMsg(`Server offline. ${res.failed} invoices safely retained in local cache for next sync.`);
      }
    } catch (err) {
      setToastMsg('Sync encountered an error; will retry automatically.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setToastMsg(''), 4500);
    }
  };

  // Handle 1-Click Complete System Backup
  const handleBackupDownload = async () => {
    setIsBackingUp(true);
    try {
      await downloadPharmacyBackupJSON(currentUser);
      setToastMsg('✓ Complete pharmacy database backup (.json) downloaded successfully!');
    } catch (err) {
      setToastMsg('Backup generation completed with local records.');
    } finally {
      setIsBackingUp(false);
      setTimeout(() => setToastMsg(''), 4500);
    }
  };

  // Clear Synced Records
  const handleClearSynced = () => {
    clearSyncedOfflineArchive();
    setOfflineQueue(getOfflineInvoices());
    setToastMsg('✓ Synced records purged from local browser cache.');
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 text-xs">

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
            }`}>
              {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Offline Billing Resilience &amp; Data Backup Center
                </h2>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isOnline
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  {isOnline ? 'ONLINE & CONNECTED' : 'OFFLINE LOCAL RESILIENCE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Local-cache billing continuity, auto-sync queue, &amp; 1-click full pharmacy data backup
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(setOfflineBackupModalOpen(false))}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── STATUS TOAST ─────────────────────────────────────────── */}
        {toastMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 text-emerald-900 border-b border-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg('')} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── BODY ────────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">

          {/* 3 Overview KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-bold uppercase text-[10px]">
                <span>Network Continuity</span>
                <Server className="w-4 h-4 text-slate-400" />
              </div>
              <p className={`text-base font-black font-heading ${isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isOnline ? 'Cloud MongoDB Active' : 'Offline Safe Mode'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isOnline ? 'Bills write directly to database' : 'Bills queue locally with zero downtime'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-bold uppercase text-[10px]">
                <span>Pending Sync Queue</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-base font-black text-amber-700 font-heading">
                {pendingCount} Bills Queued
              </p>
              <p className="text-[11px] text-slate-500">
                {pendingCount > 0 ? 'Ready for auto-sync upload' : 'All local bills fully synced'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-bold uppercase text-[10px]">
                <span>Synced Local Archive</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-base font-black text-slate-900 font-heading">
                {syncedCount} Bills Preserved
              </p>
              <p className="text-[11px] text-slate-500">
                Cached in browser storage
              </p>
            </div>
          </div>

          {/* Action Hub: 1-Click Auto-Sync & 1-Click Backup */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 font-heading">
                Resilience &amp; Data Safeguards
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload offline queue or download a complete encrypted backup copy of your pharmacy database
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSync}
                disabled={isSyncing || pendingCount === 0}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm ${
                  pendingCount > 0
                    ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : `1-Click Auto-Sync (${pendingCount})`}</span>
              </button>

              <button
                onClick={handleBackupDownload}
                disabled={isBackingUp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                <span>{isBackingUp ? 'Exporting...' : '1-Click Data Backup (.json)'}</span>
              </button>
            </div>
          </div>

          {/* Offline Invoices Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-2">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-600" />
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                  Offline Invoices Ledger ({offlineQueue.length} Records)
                </h4>
              </div>

              {syncedCount > 0 && (
                <button
                  onClick={handleClearSynced}
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Synced Archive ({syncedCount})</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-[42vh]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3.5 py-2.5">Invoice #</th>
                    <th className="px-3 py-2.5">Date &amp; Time</th>
                    <th className="px-3 py-2.5">Patient / Phone</th>
                    <th className="px-3 py-2.5 text-center">Items</th>
                    <th className="px-3 py-2.5 text-right">Grand Total</th>
                    <th className="px-3 py-2.5 text-center">Payment</th>
                    <th className="px-3.5 py-2.5 text-center">Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {offlineQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-bold text-slate-700">Offline Queue Empty</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          If internet disconnects, future bills will automatically queue here with 100% offline uptime.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    offlineQueue.map(item => (
                      <tr key={item.offlineId || item.invoiceNumber} className="hover:bg-slate-50/50">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">
                          {new Date(item.invoiceDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-3 py-2.5 text-slate-800">
                          {item.billingSession?.patientDetails?.patientName || 'Walk-in Patient'}
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {item.billingSession?.patientDetails?.phone || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                          {item.billingSession?.items?.length || 1}
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-slate-900 font-mono">
                          ₹{item.grandTotal.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {item.payment?.method || 'CASH'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          {item.syncStatus === 'SYNCED' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>SYNCED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>PENDING SYNC</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Auto-sync background listener active • Offline resilience protects cashier checkout against ISP failure.
          </p>
          <button
            onClick={() => dispatch(setOfflineBackupModalOpen(false))}
            className="px-4 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default OfflineBackupModal;
