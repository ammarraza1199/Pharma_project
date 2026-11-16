import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import {
  navigateTo,
  addNewTab,
  switchTab,
  setHeldBillsModalOpen,
  setPaymentModalOpen
} from '../store/posSlice';
import {
  Keyboard,
  Search,
  Plus,
  CreditCard,
  PauseCircle,
  History,
  Package,
  X,
  HelpCircle,
  Command,
  Sparkles
} from 'lucide-react';

export const KeyboardShortcutsBar: React.FC = () => {
  const dispatch = useDispatch();
  const currentView = useSelector((state: RootState) => state.pos.currentView);
  const activePharmacistId = useSelector((state: RootState) => state.pos.activePharmacistId || 'pharm-1');
  const sessions = useSelector((state: RootState) => state.pos.sessions || []);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const [showCheatsheet, setShowCheatsheet] = useState<boolean>(false);

  // Active cart items count
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const cartItemsCount = currentSession?.items?.length || 0;

  // Global Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

      // F1 or Shift + ? -> Toggle Help Cheatsheet
      if (e.key === 'F1' || (e.key === '?' && !isInput)) {
        e.preventDefault();
        setShowCheatsheet(prev => !prev);
        return;
      }

      // Escape -> Close cheatsheet if open
      if (e.key === 'Escape' && showCheatsheet) {
        e.preventDefault();
        setShowCheatsheet(false);
        return;
      }

      // F2 -> Focus medicine barcode / name search
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // F4 or Alt + N -> New Customer Tab
      if (e.key === 'F4' || (e.altKey && (e.key === 'n' || e.key === 'N'))) {
        e.preventDefault();
        if (sessions.length < 8) {
          dispatch(addNewTab(activePharmacistId));
        }
        return;
      }

      // F7 -> Navigate to Invoices History
      if (e.key === 'F7') {
        e.preventDefault();
        dispatch(navigateTo('INVOICES'));
        return;
      }

      // F8 -> Open Parked / Held Bills Drawer
      if (e.key === 'F8') {
        e.preventDefault();
        dispatch(setHeldBillsModalOpen(true));
        return;
      }

      // F9 or Ctrl + Enter -> Finalize & Collect Payment (Checkout)
      if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (cartItemsCount > 0) {
          dispatch(setPaymentModalOpen(true));
        }
        return;
      }

      // F10 -> Navigate to Inventory
      if (e.key === 'F10') {
        e.preventDefault();
        dispatch(navigateTo('INVENTORY'));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessions, activePharmacistId, cartItemsCount, showCheatsheet, dispatch]);

  const SHORTCUTS = [
    { key: 'F1', label: 'Help', action: () => setShowCheatsheet(true), color: 'text-slate-700' },
    {
      key: 'F2',
      label: 'Search',
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement | null;
        searchInput?.focus();
      },
      color: 'text-emerald-700'
    },
    {
      key: 'F4',
      label: 'New Tab',
      action: () => {
        if (sessions.length < 8) dispatch(addNewTab(activePharmacistId));
      },
      color: 'text-blue-700'
    },
    {
      key: 'F7',
      label: 'Invoices',
      action: () => dispatch(navigateTo('INVOICES')),
      color: 'text-indigo-700'
    },
    {
      key: 'F8',
      label: 'Held Bills',
      action: () => dispatch(setHeldBillsModalOpen(true)),
      color: 'text-amber-700'
    },
    {
      key: 'F9',
      label: 'Pay',
      action: () => {
        if (cartItemsCount > 0) dispatch(setPaymentModalOpen(true));
      },
      color: 'text-emerald-800 font-black'
    },
    { key: 'Esc', label: 'Cancel', action: () => {}, color: 'text-slate-500' }
  ];

  const CHEATSHEET_GROUPS = [
    {
      category: 'Counter Billing & Checkout',
      shortcuts: [
        { keys: ['F2', '/'], description: 'Focus barcode scanner / medicine search bar' },
        { keys: ['F9', 'Ctrl + ↵'], description: 'Open Finalize & Collect Payment modal' },
        { keys: ['F8'], description: 'Open Held / Parked Bills drawer' },
        { keys: ['Ctrl + H'], description: 'Park (Hold) active customer bill' },
        { keys: ['Esc'], description: 'Close open dialogs or clear search filter' }
      ]
    },
    {
      category: 'Multi-Customer Billing Tabs',
      shortcuts: [
        { keys: ['F4', 'Ctrl + T'], description: 'Open a new customer billing cart tab (up to 8)' },
        { keys: ['Ctrl + W'], description: 'Close active customer billing tab' },
        { keys: ['Ctrl + 1..8'], description: 'Directly switch to Customer Tab 1 through 8' }
      ]
    },
    {
      category: 'Navigation & Master Records',
      shortcuts: [
        { keys: ['F7'], description: 'Jump to Invoice History & Today\'s sales records' },
        { keys: ['F10'], description: 'Jump to Inventory Master & Shelf Health' },
        { keys: ['F1', '?'], description: 'Toggle this keyboard shortcuts cheat-sheet' }
      ]
    }
  ];

  return (
    <>
      {/* ── Discreet Bottom Shortcut Keycap Strip (Desktop / Laptop) ── */}
      <aside
        aria-label="Cashier Keyboard Shortcuts"
        className="hidden md:flex items-center justify-between px-3 py-1 bg-white border-t border-slate-200/80 text-slate-600 text-[11px] select-none shrink-0"
      >
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1.5 font-bold text-slate-700 mr-2">
            <Keyboard className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-500">Hotkeys:</span>
          </div>

          <div className="flex items-center space-x-2">
            {SHORTCUTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={s.action}
                className="flex items-center space-x-1 hover:bg-slate-100 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                title={`Press ${s.key} to ${s.label}`}
              >
                <kbd className="px-1.5 py-0.2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded font-mono font-black text-[9.5px] shadow-2xs">
                  {s.key}
                </kbd>
                <span className={`text-[10px] font-bold ${s.color}`}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCheatsheet(true)}
          className="flex items-center space-x-1 text-slate-500 hover:text-emerald-700 text-[10.5px] font-bold cursor-pointer transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Full Hotkey Cheatsheet [F1]</span>
        </button>
      </aside>

      {/* ── Keyboard Shortcuts Cheatsheet Modal ── */}
      {showCheatsheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-modal bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Keyboard className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-heading">
                    Cashier Keyboard Shortcuts Cheatsheet
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Rapid keyboard hotkeys for high-speed dispensing and multi-customer checkout
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCheatsheet(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {CHEATSHEET_GROUPS.map((group, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-heading flex items-center space-x-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>{group.category}</span>
                  </h4>

                  <div className="space-y-1.5">
                    {group.shortcuts.map((sc, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-b-0 text-xs">
                        <span className="text-slate-700 font-medium">{sc.description}</span>
                        <div className="flex items-center space-x-1">
                          {sc.keys.map((k, kIdx) => (
                            <kbd
                              key={kIdx}
                              className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-black text-slate-800 text-[10px] shadow-2xs"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[10px]">Esc</kbd> anytime to close dialogs</span>
              <button
                type="button"
                onClick={() => setShowCheatsheet(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcutsBar;

