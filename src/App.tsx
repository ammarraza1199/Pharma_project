import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Navbar } from './components/Navbar';
import { TabBar } from './components/TabBar';
import { ProductSearch } from './components/ProductSearch';
import { CartTable } from './components/CartTable';
import { CartSummary } from './components/CartSummary';
import { SmartSubstitutionModal } from './components/SmartSubstitutionModal';
import { ComplianceModal } from './components/ComplianceModal';
import { DrugInteractionModal } from './components/DrugInteractionModal';
import { PaymentModal } from './components/PaymentModal';
import { HeldBillsModal } from './components/HeldBillsModal';
import { CustomerDisplayModal } from './components/CustomerDisplayModal';
import { ReceiptPrintView } from './components/ReceiptPrintView';
import { InvoiceHistoryModal } from './components/InvoiceHistoryModal';
import { Dashboard } from './components/Dashboard';
import { InventoryPage } from './components/InventoryPage';
import { PurchaseGRNPage } from './components/PurchaseGRNPage';
import { ReportsPage } from './components/ReportsPage';
import { ReturnsPage } from './components/ReturnsPage';
import { ExpiryManagementPage } from './components/ExpiryManagementPage';
import { PatientsPage } from './components/PatientsPage';
import { SuppliersPage } from './components/SuppliersPage';
import { SettingsPage } from './components/SettingsPage';
import { EmergencyDeliveryPage } from './components/EmergencyDeliveryPage';
import { InvoicesPage } from './components/InvoicesPage';
import { AssignBillModal } from './components/AssignBillModal';
import { OnlineDeliveryPage } from './components/OnlineDeliveryPage';

export const App: React.FC = () => {
  const currentView = useSelector((state: RootState) => state.pos.currentView);

  if (currentView === 'LANDING') return <LandingPage />;
  if (currentView === 'AUTH')    return <AuthPage />;

  // Shared shell for all authenticated views
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 select-none overflow-hidden">
      {/* Shared Top Header */}
      <Navbar />

      {/* ── DASHBOARD VIEW ── */}
      {currentView === 'DASHBOARD' && (
        <Dashboard />
      )}

      {/* ── INVENTORY MANAGEMENT VIEW ── */}
      {currentView === 'INVENTORY' && (
        <InventoryPage />
      )}

      {/* ── STOCK PURCHASE (GRN) VIEW ── */}
      {currentView === 'PURCHASE_GRN' && (
        <PurchaseGRNPage />
      )}

      {/* ── SALES REPORTS & ANALYTICS VIEW ── */}
      {currentView === 'REPORTS' && (
        <ReportsPage />
      )}

      {/* ── RETURNS & REFUNDS VIEW ── */}
      {currentView === 'RETURNS' && (
        <ReturnsPage />
      )}

      {/* ── EXPIRY & DISPOSAL MANAGEMENT VIEW ── */}
      {currentView === 'EXPIRY_MANAGEMENT' && (
        <ExpiryManagementPage />
      )}

      {/* ── PATIENT HISTORY RECORDS VIEW ── */}
      {currentView === 'PATIENTS' && (
        <PatientsPage />
      )}

      {/* ── SUPPLIER & VENDOR DIRECTORY VIEW ── */}
      {currentView === 'SUPPLIERS' && (
        <SuppliersPage />
      )}

      {/* ── STORE SETTINGS & HARDWARE CONFIG VIEW ── */}
      {currentView === 'SETTINGS' && (
        <SettingsPage />
      )}

      {/* ── EMERGENCY FAST DELIVERY VIEW ── */}
      {currentView === 'EMERGENCY_DELIVERY' && (
        <EmergencyDeliveryPage />
      )}

      {/* ── INVOICES & SALES JOURNAL VIEW ── */}
      {currentView === 'INVOICES' && (
        <InvoicesPage />
      )}

      {/* ── ONLINE DELIVERY DASHBOARD VIEW ── */}
      {currentView === 'ONLINE_DELIVERY' && (
        <OnlineDeliveryPage />
      )}

      {/* ── POS TERMINAL VIEW ── */}
      {currentView === 'POS_TERMINAL' && (
        <>
          {/* Multi-Tab Billing & Parking Bar */}
          <TabBar />

          {/* Main 3-Column Billing Workspace */}
          <main className="flex-1 p-3 grid grid-cols-12 gap-3 overflow-hidden h-[calc(100vh-105px)]">
            {/* Left (5 cols): Product Search */}
            <section className="col-span-12 lg:col-span-5 h-full overflow-hidden">
              <ProductSearch />
            </section>

            {/* Center (4 cols): Cart Table */}
            <section className="col-span-12 lg:col-span-4 h-full overflow-hidden">
              <CartTable />
            </section>

            {/* Right (3 cols): Billing Summary & Checkout */}
            <section className="col-span-12 lg:col-span-3 h-full overflow-hidden">
              <CartSummary />
            </section>
          </main>

          {/* Modals & Overlays */}
          <SmartSubstitutionModal />
          <ComplianceModal />
          <DrugInteractionModal />
          <PaymentModal />
          <HeldBillsModal />
          <CustomerDisplayModal />
          <AssignBillModal />
        </>
      )}

      {/* Global Overlays accessible from all tabs */}
      <ReceiptPrintView />
      <InvoiceHistoryModal />
    </div>
  );
};

export default App;
