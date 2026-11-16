import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  navigateTo,
  setWellnessBrochureModalOpen,
  setMultiStoreModalOpen,
  setInterStoreChatbotModalOpen,
  setVoiceConsultationModalOpen,
  setPatientInstructionModalOpen,
  setRackRoboModalOpen,
  setPrescriptionUploadModalOpen,
  setOfflineBackupModalOpen
} from '../store/posSlice';
import type { AppView } from '../types/pos';
import api from '../utils/api';
import {
  Package,
  Layers,
  Truck,
  Bike,
  History,
  RotateCcw,
  Clock,
  Users,
  Building,
  BarChart3,
  Settings,
  Siren,
  Compass,
  Bot,
  Mic,
  Volume2,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  CloudUpload
} from 'lucide-react';

interface SidebarNavItem {
  id: string;
  view?: AppView;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  iconColor: string;
  badge?: string | number;
  badgeColor?: string;
  badgePulse?: boolean;
  isEmergency?: boolean;
  isModal?: boolean;
  onClick: () => void;
}

export const ToolsSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const currentView = useSelector((state: RootState) => state.pos.currentView);
  const products = useSelector((state: RootState) => state.pos.products || []);
  const deliveryOrders = useSelector((state: RootState) => state.pos.deliveryOrders || []);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [liveLowStockCount, setLiveLowStockCount] = useState<number>(0);
  const [livePendingDeliveryCount, setLivePendingDeliveryCount] = useState<number>(0);

  // Calculate local fallback counts
  const reduxLowStockCount = products.filter(p =>
    p.stockStatus === 'LOW_STOCK' ||
    p.stockStatus === 'OUT_OF_STOCK' ||
    (typeof p.totalStock === 'number' && p.totalStock <= 20)
  ).length;

  const reduxPendingDeliveryCount = deliveryOrders.filter(o =>
    o.status === 'PENDING' || o.status === 'CONFIRMED'
  ).length;

  // Sync real-time badge counters with backend
  useEffect(() => {
    api.get('/products/stock/low')
      .then(res => {
        if (res.data?.success && typeof res.data.count === 'number') {
          setLiveLowStockCount(res.data.count);
        } else {
          setLiveLowStockCount(reduxLowStockCount);
        }
      })
      .catch(() => setLiveLowStockCount(reduxLowStockCount));

    api.get('/delivery')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          const count = res.data.data.filter((o: any) =>
            o.status === 'PENDING' || o.status === 'CONFIRMED'
          ).length;
          setLivePendingDeliveryCount(count);
        } else {
          setLivePendingDeliveryCount(reduxPendingDeliveryCount);
        }
      })
      .catch(() => setLivePendingDeliveryCount(reduxPendingDeliveryCount));
  }, [products.length, deliveryOrders.length]);

  const displayLowStock = Math.max(liveLowStockCount, reduxLowStockCount);
  const displayPendingDelivery = Math.max(livePendingDeliveryCount, reduxPendingDeliveryCount);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Operational Modules (From Inventory to Reports - One by One)
  // ─────────────────────────────────────────────────────────────────────────
  const operationsNav: SidebarNavItem[] = [
    {
      id: 'INVENTORY',
      view: 'INVENTORY',
      title: 'Inventory Master',
      shortTitle: 'Inventory',
      description: 'Stock & batch master',
      icon: Package,
      iconColor: 'text-sky-600',
      badge: displayLowStock > 0 ? displayLowStock : undefined,
      badgeColor: 'bg-rose-500 text-white',
      badgePulse: true,
      onClick: () => dispatch(navigateTo('INVENTORY'))
    },
    {
      id: 'INVENTORY_DASHBOARD',
      view: 'INVENTORY_DASHBOARD',
      title: 'Shelf Health & Racks',
      shortTitle: 'Shelf Health',
      description: 'Rack & shelf occupancy',
      icon: Layers,
      iconColor: 'text-teal-600',
      onClick: () => dispatch(navigateTo('INVENTORY_DASHBOARD'))
    },
    {
      id: 'PURCHASE_GRN',
      view: 'PURCHASE_GRN',
      title: 'GRN Inwarding & Bills',
      shortTitle: 'GRN Inward',
      description: 'Purchase inward & POs',
      icon: Truck,
      iconColor: 'text-indigo-600',
      onClick: () => dispatch(navigateTo('PURCHASE_GRN'))
    },
    {
      id: 'ONLINE_DELIVERY',
      view: 'ONLINE_DELIVERY',
      title: 'Online Orders & Dispatch',
      shortTitle: 'Delivery',
      description: 'Home delivery & dispatch',
      icon: Bike,
      iconColor: 'text-emerald-600',
      badge: displayPendingDelivery > 0 ? displayPendingDelivery : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
      badgePulse: true,
      onClick: () => dispatch(navigateTo('ONLINE_DELIVERY'))
    },
    {
      id: 'INVOICES',
      view: 'INVOICES',
      title: 'Invoices & Billing History',
      shortTitle: 'Invoices',
      description: 'Past bill lookup & reprint',
      icon: History,
      iconColor: 'text-violet-600',
      onClick: () => dispatch(navigateTo('INVOICES'))
    },
    {
      id: 'RETURNS',
      view: 'RETURNS',
      title: 'Sales Returns & Credit',
      shortTitle: 'Returns',
      description: 'Sales returns & refunds',
      icon: RotateCcw,
      iconColor: 'text-amber-600',
      onClick: () => dispatch(navigateTo('RETURNS'))
    },
    {
      id: 'EXPIRY_MANAGEMENT',
      view: 'EXPIRY_MANAGEMENT',
      title: 'Expiry & Dump Tracker',
      shortTitle: 'Expiry Tracker',
      description: 'Dump & FEFO management',
      icon: Clock,
      iconColor: 'text-rose-600',
      onClick: () => dispatch(navigateTo('EXPIRY_MANAGEMENT'))
    },
    {
      id: 'PATIENTS',
      view: 'PATIENTS',
      title: 'Patient Master & History',
      shortTitle: 'Patients',
      description: 'Rx history & profiles',
      icon: Users,
      iconColor: 'text-teal-600',
      onClick: () => dispatch(navigateTo('PATIENTS'))
    },
    {
      id: 'SUPPLIERS',
      view: 'SUPPLIERS',
      title: 'Suppliers & Accounts',
      shortTitle: 'Suppliers',
      description: 'Vendor ledger & GST',
      icon: Building,
      iconColor: 'text-blue-600',
      onClick: () => dispatch(navigateTo('SUPPLIERS'))
    },
    {
      id: 'REPORTS',
      view: 'REPORTS',
      title: 'Reports & Analytics',
      shortTitle: 'Reports',
      description: 'Sales, GST & profit reports',
      icon: BarChart3,
      iconColor: 'text-fuchsia-600',
      onClick: () => dispatch(navigateTo('REPORTS'))
    }
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Settings (Directly Above Clinical Tools)
  // ─────────────────────────────────────────────────────────────────────────
  const settingsNav: SidebarNavItem = {
    id: 'SETTINGS',
    view: 'SETTINGS',
    title: 'Store Settings & Hardware',
    shortTitle: 'Store Settings',
    description: 'Hardware, printers & config',
    icon: Settings,
    iconColor: 'text-slate-600',
    badge: 'CONFIG',
    badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
    onClick: () => dispatch(navigateTo('SETTINGS'))
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Clinical Tools (Directly Below Settings)
  // ─────────────────────────────────────────────────────────────────────────
  const clinicalTools: SidebarNavItem[] = [
    {
      id: 'DIGITAL_RX',
      title: 'Digital Rx & Quick Dispense',
      shortTitle: 'Digital Rx',
      description: 'OCR scan doctor Rx & fast dispense',
      icon: Sparkles,
      iconColor: 'text-emerald-600',
      badge: 'AI OCR',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300',
      isModal: true,
      onClick: () => dispatch(setPrescriptionUploadModalOpen(true))
    },
    {
      id: 'EMERGENCY_DELIVERY',
      view: 'EMERGENCY_DELIVERY',
      title: 'Emergency Fast Delivery',
      shortTitle: 'Emergency',
      description: 'Urgent prescription dispatch',
      icon: Siren,
      iconColor: 'text-rose-600',
      badge: 'URGENT',
      badgeColor: 'bg-rose-600 text-white animate-pulse',
      isEmergency: true,
      onClick: () => dispatch(navigateTo('EMERGENCY_DELIVERY'))
    },
    {
      id: 'RACK_ROBO',
      title: '2D Shelf Robo Map',
      shortTitle: 'Robo Map',
      description: 'Visual rack & shelf locator',
      icon: Compass,
      iconColor: 'text-teal-600',
      isModal: true,
      onClick: () => dispatch(setRackRoboModalOpen({ isOpen: true }))
    },
    {
      id: 'CHATBOT',
      title: 'PharmaConnect AI Chatbot',
      shortTitle: 'AI Chat',
      description: 'Inter-store chatbot assistant',
      icon: Bot,
      iconColor: 'text-emerald-600',
      isModal: true,
      onClick: () => dispatch(setInterStoreChatbotModalOpen(true))
    },
    {
      id: 'VOICE_CONSULT',
      title: 'Voice Consultation',
      shortTitle: 'Voice Notes',
      description: 'Record audio & clinical notes',
      icon: Mic,
      iconColor: 'text-rose-600',
      isModal: true,
      onClick: () => dispatch(setVoiceConsultationModalOpen({ isOpen: true }))
    },
    {
      id: 'PATIENT_PIL',
      title: 'Patient PIL Audio',
      shortTitle: 'Audio PIL',
      description: 'Multi-language dosage voice',
      icon: Volume2,
      iconColor: 'text-cyan-600',
      isModal: true,
      onClick: () => dispatch(setPatientInstructionModalOpen({ isOpen: true }))
    },
    {
      id: 'MULTI_STORE',
      title: 'Multi-Store Stock',
      shortTitle: 'Store Loans',
      description: 'Branch medicine loans',
      icon: Building2,
      iconColor: 'text-blue-600',
      isModal: true,
      onClick: () => dispatch(setMultiStoreModalOpen({ isOpen: true }))
    },
    {
      id: 'WELLNESS_BROCHURE',
      title: 'Wellness Brochure',
      shortTitle: 'Brochure',
      description: 'Patient healthcare plans',
      icon: FileText,
      iconColor: 'text-amber-600',
      isModal: true,
      onClick: () => dispatch(setWellnessBrochureModalOpen({ isOpen: true }))
    },
    {
      id: 'OFFLINE_BACKUP',
      title: 'Offline Sync & Data Backup',
      shortTitle: 'Offline Sync',
      description: 'Local billing cache & 1-click backup',
      icon: CloudUpload,
      iconColor: 'text-amber-600',
      badge: 'SAFE',
      badgeColor: 'bg-amber-100 text-amber-800 font-bold border border-amber-300',
      isModal: true,
      onClick: () => dispatch(setOfflineBackupModalOpen(true))
    }
  ];

  const renderNavItem = (item: SidebarNavItem) => {
    const isActive = item.view ? currentView === item.view : false;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={item.onClick}
        className={`w-full group relative flex items-center rounded-xl transition-all cursor-pointer border ${
          isExpanded ? 'px-3 py-2 space-x-3 text-left' : 'p-2.5 justify-center'
        } ${
          item.isEmergency
            ? isActive
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs shadow-rose-600/30'
              : 'bg-rose-50/80 hover:bg-rose-100 text-rose-800 border-rose-200/90 hover:border-rose-300 hover:text-rose-950 shadow-2xs'
            : isActive
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-500 font-bold'
              : 'bg-white hover:bg-emerald-50/70 text-slate-700 hover:text-emerald-950 border-slate-200/80 hover:border-emerald-200 shadow-2xs'
        }`}
        title={!isExpanded ? `${item.title} — ${item.description}` : undefined}
      >
        {/* Icon & Mini-badge for collapsed view */}
        <div className="relative shrink-0 flex items-center justify-center">
          <Icon
            className={`w-4 h-4 ${
              isActive ? 'text-white' : item.isEmergency ? 'text-rose-600 animate-pulse' : item.iconColor
            } group-hover:scale-110 transition-transform`}
          />

          {/* Collapsed Badge Count or Dot */}
          {!isExpanded && item.badge !== undefined && (
            <span
              className={`absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[8.5px] font-black shadow-xs min-w-4 text-center ${
                item.badgeColor || 'bg-rose-500 text-white'
              } ${item.badgePulse ? 'animate-pulse' : ''}`}
            >
              {item.badge}
            </span>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className={`font-bold text-xs truncate leading-tight ${
                isActive
                  ? 'text-white'
                  : item.isEmergency
                    ? 'text-rose-900 group-hover:text-rose-950 font-black'
                    : 'text-slate-800 group-hover:text-emerald-950'
              }`}>
                {item.shortTitle}
              </span>
              {item.badge !== undefined && (
                <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-emerald-700 text-white' : item.badgeColor || 'bg-slate-100 text-slate-700 border border-slate-200'
                } ${item.badgePulse ? 'animate-pulse' : ''}`}>
                  {item.badge}
                </span>
              )}
            </div>
            <p className={`text-[10px] truncate mt-0.5 leading-none ${
              isActive
                ? 'text-emerald-100'
                : item.isEmergency
                  ? 'text-rose-500 group-hover:text-rose-700'
                  : 'text-slate-400 group-hover:text-slate-600'
            }`}>
              {item.description}
            </p>
          </div>
        )}

        {/* Floating Tooltip when Collapsed */}
        {!isExpanded && (
          <div className="absolute left-full ml-2.5 px-3 py-2 bg-slate-900 text-white text-xs rounded-xl shadow-2xl border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            <div className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>{item.title}</span>
              {item.badge !== undefined && (
                <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{item.description}</div>
          </div>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`h-full bg-slate-50/90 border-r border-slate-200/90 shadow-2xs flex flex-col justify-between transition-all duration-300 ease-in-out select-none z-20 shrink-0 ${
        isExpanded ? 'w-56' : 'w-14'
      }`}
    >
      {/* ── 1. Top Header: Toggle Sidebar ── */}
      <div className="p-2.5 flex items-center justify-between border-b border-slate-200/80 bg-white shrink-0">
        {isExpanded ? (
          <div className="flex items-center space-x-2 px-1">
            <LayoutGrid className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-black text-slate-800 tracking-wide uppercase font-heading">
              Pharma Menu
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center py-0.5">
            <LayoutGrid className="w-4 h-4 text-slate-500" />
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* ── 2. Scrollable Navigation Body ── */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {/* SECTION A: OPERATIONS (Inventory to Reports) */}
        <div>
          <div className="pb-1 px-1.5 flex items-center justify-between">
            {isExpanded ? (
              <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider font-heading">
                Operations
              </span>
            ) : (
              <div className="w-full flex justify-center py-0.5">
                <span className="w-5 h-0.5 bg-slate-200 rounded-full" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            {operationsNav.map(renderNavItem)}
          </div>
        </div>

        {/* SECTION B: STORE SETTINGS (Directly Above Clinical Tools) */}
        <div className="pt-0.5">
          <div className="pb-1 px-1.5 flex items-center justify-between">
            {isExpanded ? (
              <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider font-heading">
                Settings
              </span>
            ) : (
              <div className="w-full flex justify-center py-0.5">
                <span className="w-5 h-0.5 bg-slate-200 rounded-full" />
              </div>
            )}
          </div>

          <div>
            {renderNavItem(settingsNav)}
          </div>
        </div>

        {/* SECTION C: CLINICAL TOOLS (Directly Below Settings) */}
        <div className="pt-0.5">
          <div className="pb-1 px-1.5 flex items-center justify-between">
            {isExpanded ? (
              <div className="flex items-center space-x-1.5 text-[9.5px] font-black text-slate-400 uppercase tracking-wider font-heading">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Clinical Tools</span>
              </div>
            ) : (
              <div className="w-full flex justify-center py-0.5">
                <span className="w-5 h-0.5 bg-slate-200 rounded-full" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            {clinicalTools.map(renderNavItem)}
          </div>
        </div>
      </div>

      {/* ── 3. Bottom Expand / Collapse Toggle Bar ── */}
      <div className="p-2 border-t border-slate-200/80 bg-white shrink-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-xs font-semibold cursor-pointer ${
            isExpanded ? 'px-3 space-x-2' : 'justify-center'
          }`}
          title={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Collapse Sidebar</span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
