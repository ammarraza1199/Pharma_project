import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { navigateTo } from '../store/posSlice';
import type { AppView } from '../types/pos';
import {
  ShoppingCart,
  Package,
  History,
  Bike,
  Settings,
  Sparkles,
  Siren,
  FileSpreadsheet
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const dispatch = useDispatch();
  const currentView = useSelector((state: RootState) => state.pos.currentView);
  const sessions = useSelector((state: RootState) => state.pos.sessions || []);
  const activeSessionId = useSelector((state: RootState) => state.pos.activeSessionId);
  const products = useSelector((state: RootState) => state.pos.products || []);

  // Compute active cart items count
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const cartItemCount = currentSession?.items?.length || 0;

  // Compute low stock count
  const lowStockCount = products.filter(p => p.stockStatus === 'LOW_STOCK' || p.stockStatus === 'OUT_OF_STOCK').length;

  const NAV_ITEMS = [
    {
      id: 'POS_TERMINAL' as AppView,
      label: 'Billing POS',
      icon: ShoppingCart,
      badge: cartItemCount > 0 ? `${cartItemCount}` : undefined,
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'INVENTORY' as AppView,
      label: 'Inventory',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'INVOICES' as AppView,
      label: 'Invoices',
      icon: History
    },
    {
      id: 'ONLINE_DELIVERY' as AppView,
      label: 'Delivery',
      icon: Bike,
      badge: '1',
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'SETTINGS' as AppView,
      label: 'Settings',
      icon: Settings
    }
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 flex items-center justify-around shadow-lg select-none pb-safe"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => dispatch(navigateTo(item.id))}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative min-h-[48px] active:scale-95 ${
              isActive
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {item.badge && (
                <span
                  className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black shadow-xs min-w-4 text-center ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </div>

            <span className="text-[10px] mt-0.5 leading-tight truncate">
              {item.label}
            </span>

            {isActive && (
              <span className="w-5 h-0.5 rounded-full bg-emerald-600 mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;

