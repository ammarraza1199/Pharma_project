# Genquantaa Pharmacy - Design System & UI Specifications

This section defines the visual language, layout rules, and component styling used across the Genquantaa Pharmacy POS application. The application utilizes **Tailwind CSS** for all styling to ensure a highly responsive, modern, and cohesive look and feel.

## 🎨 1. Color Palette

- **Primary Colors (Brand & Actions):**
  - \emerald-600\ / \emerald-700\: Used for primary actions (Submit, Save, Add to Cart, Confirm). Symbolizes health, success, and pharmacy contexts.
  - \indigo-600\ / \lue-600\: Used for secondary accents, links, and informational highlights.

- **Destructive & Alert Colors:**
  - ose-600\ / ose-50\: Used for Delete buttons, out-of-stock alerts, and destructive actions.
  - \mber-500\ / \mber-50\: Used for warnings, near-expiry alerts, and pending statuses.

- **Neutral / Background Colors:**
  - \slate-50\, \gray-50\: Used for the main application background to keep the interface soft and readable.
  - \slate-900\, \slate-800\: Primary text color for high contrast and readability.
  - \slate-500\, \slate-400\: Secondary text, placeholders, and subtle borders.
  - \white\ (\g-white\): Used for all main content cards, modals, and container backgrounds.

## 📏 2. Layout & Container Sizes

- **Main Application Wrapper:**
  - The main app layout spans the full viewport (\h-screen\, \w-full\) with a flex/grid layout for sidebars and main content areas.
- **Content Max-Widths:**
  - **Standard Pages (Settings, Patients, Reports):** Usually wrapped in a \max-w-7xl mx-auto\ container to ensure content doesn't stretch too wide on ultrawide monitors.
  - **Billing / POS Terminal:** Uses a fluid layout (\lex-1\, grid split) to maximize screen real estate, split into a left Cart area (approx 65-70%) and a right Summary/Payment area (approx 30-35%).
- **Modals & Dialogs:**
  - **Small Modals (Confirmations):** \max-w-md  - **Medium Modals (Forms, Patient Edit):** \max-w-lg\ to \max-w-2xl  - **Large / Complex Modals (Inventory Matrix, Brochures):** \max-w-4xl\ to \max-w-6xl
## 🔲 3. Component Styling (Borders, Shadows, Radius)

- **Cards & Containers:**
  - **Border Radius:** Heavy use of modern rounded corners: ounded-xl\ and ounded-2xl\ for all cards, panels, and modals.
  - **Borders:** Subtle borders \order border-slate-200\ are used to separate content without heavy dropshadows.
  - **Shadows:** Soft shadows like \shadow-sm\ and \shadow-md\ are used to lift cards off the gray background.
- **Buttons:**
  - **Shape:** Pill-shaped or rounded rectangles (ounded-lg\, ounded-xl\).
  - **Padding:** Standard button padding is \px-4 py-2\ for normal, \px-3 py-1.5\ for dense rows.
  - **Interactivity:** All clickable elements must have hover states (e.g., \hover:bg-emerald-700\), transition effects (\	ransition-colors duration-200\), and active scale effects (\ctive:scale-95\) for a snappy, tactile feel.
- **Inputs & Forms:**
  - Standard text inputs use \order-slate-300 rounded-xl px-3 py-2\.
  - **Focus States:** Inputs always glow with the brand color on focus (e.g., \ocus:ring-2 focus:ring-emerald-500 focus:outline-none\).

## ✍️ 4. Typography

- **Font Family:** Modern Sans-Serif stack (Inter, Roboto, or system defaults).
- **Hierarchy:**
  - **Page Titles:** \	ext-2xl\ or \	ext-3xl font-bold text-slate-900\.
  - **Section Headers (Cards):** \	ext-lg font-bold text-slate-800\.
  - **Table Headers:** \	ext-[10px]\ or \	ext-xs font-bold text-slate-500 uppercase tracking-wider\ for a clean, data-heavy look.
  - **Body / Data Text:** \	ext-sm font-medium text-slate-700\.
  - **Micro-copy:** \	ext-xs text-slate-500\ for hints, subtext, and timestamps.
- **Monospaced Fonts:** Used specifically for Invoice Numbers, Batch Numbers, and Financial amounts (e.g., \ont-mono\) to ensure numbers align perfectly vertically.

---

# Genquantaa Pharmacy - Design & Feature Matrix
This document outlines all features grouped by their respective UI pages and components.

## 📄 Component / Page: AssignBillModal.tsx

### 🔹 Pharmacist Allocation Support
- **Category:** Store & Staff Ops
- **Description:** Free/available pharmacists can support filling prescriptions for other busy stations.
- **Backend API:** PATCH /api/billing/held-bills/:id/assign
- **Integration Status:** Not Created

## 📄 Component / Page: CartSummary.tsx

### 🔹 Invoice Actions Controls
- **Category:** Billing & Invoicing
- **Description:** Action buttons on billing page: Clear, Previous, Save, and Record Invoice.
- **Backend API:** Local Redux
- **Integration Status:** Connected

### 🔹 Reorder Previously Ordered Tab
- **Category:** Billing & Invoicing
- **Description:** Quick-add tab for previously ordered medicines during repeat customer checkout.
- **Backend API:** Local AI / Redux Logic
- **Integration Status:** Connected

### 🔹 Age-Based Recommendation & Coupons
- **Category:** CRM & Loyalty
- **Description:** Pharmacist recommendations and coupon issuance based on patient age.
- **Backend API:** Local AI / Redux Logic
- **Integration Status:** Connected

### 🔹 Sales Insights Pitch Guidance
- **Category:** Clinical & AI Insights
- **Description:** Provide key messages and overlapping screens to help pharmacists convince customers.
- **Backend API:** Local AI / Redux Logic
- **Integration Status:** Connected

### 🔹 Combo Recommendation Popup
- **Category:** Clinical & AI Insights
- **Description:** Suggest complementary add-on products (Combos) during billing.
- **Backend API:** Local AI / Redux Logic
- **Integration Status:** Connected

### 🔹 Discount & Value-Added Product Prompts
- **Category:** Billing & Invoicing
- **Description:** Prompt pharmacists with desirable value-added items at checkout.
- **Backend API:** Local AI / Redux Logic
- **Integration Status:** Connected

## 📄 Component / Page: CartSummary.tsx, posSlice.ts

### 🔹 Discount Support
- **Category:** Billing & Invoicing
- **Description:** Apply line-item percentage discounts and overall invoice-level discounts while creating bills.
- **Backend API:** POST /api/invoices
- **Integration Status:** Connected

## 📄 Component / Page: CartTable.tsx

### 🔹 Tablet Strip Size Billing
- **Category:** Billing & Invoicing
- **Description:** Bill tablets accurately by strip size, overall count, customer name, and phone number.
- **Backend API:** Pending Review
- **Integration Status:** Pending

### 🔹 Strip / Loose Tablet Billing
- **Category:** Billing & Invoicing
- **Description:** Dynamically update inventory and invoice calculations when cutting tablet strips.
- **Backend API:** Local Redux Logic
- **Integration Status:** Connected

### 🔹 Loose Tablet Billing Unit Calculation
- **Category:** Billing & Invoicing
- **Description:** Accurately compute fractional pricing when adding loose tablets into billing page.
- **Backend API:** Local Redux Logic
- **Integration Status:** Connected

## 📄 Component / Page: ChronicRefillModal.tsx

### 🔹 Patient Refill Automation
- **Category:** CRM & Loyalty
- **Description:** Auto-prompt refills for chronic conditions (BP, Diabetes) based on past order history.
- **Backend API:** GET /api/patients/:id/chronic-medicines
- **Integration Status:** Not Created

## 📄 Component / Page: Client-Side Architecture

### 🔹 Data Privacy & Local Storage
- **Category:** Security & Privacy
- **Description:** Client-side local architecture ensures zero unauthorized third-party data sharing.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: ComplianceModal.tsx

### 🔹 Senior Pharmacist Overrides
- **Category:** Store & Staff Ops
- **Description:** Special permissions allowing senior pharmacists to handle regular/VIP customer overrides.
- **Backend API:** POST /api/auth/verify-manager-pin
- **Integration Status:** Connected

## 📄 Component / Page: ComplianceModal.tsx, SettingsPage.tsx

### 🔹 4-Digit Security PIN
- **Category:** Security & Privacy
- **Description:** 4-Digit security PIN protection implemented for manager overrides, disposal approvals, and Schedule X dispensing.
- **Backend API:** POST /api/auth/verify-manager-pin
- **Integration Status:** Connected

## 📄 Component / Page: ComplianceModal.tsx, posSlice.ts

### 🔹 Schedule H / H1 / X Compliance Management
- **Category:** Compliance & Clinical
- **Description:** Mandatory doctor details recording, patient prescription tracking, and 4-digit PIN verification for restricted drugs.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: Dashboard.tsx

### 🔹 Daily Sales View
- **Category:** Sales & Profit
- **Description:** Dashboard card displaying today's gross revenue, net collection, and bill count in real time.
- **Backend API:** GET /api/reports/dashboard-stats
- **Integration Status:** Connected

### 🔹 Safety & Profit Balance Indicator
- **Category:** Clinical & AI Insights
- **Description:** Dashboard indicator balancing clinical safety and profit margin optimization.
- **Backend API:** GET /api/reports/dashboard-stats
- **Integration Status:** Connected

### 🔹 Billing Waiting Time Analytics
- **Category:** Store & Staff Ops
- **Description:** Track total billing duration (Entry Time vs Exit Time, Delivery Time) on dashboard.
- **Backend API:** GET /api/reports/dashboard-stats
- **Integration Status:** Connected

## 📄 Component / Page: EmergencyDeliveryPage.tsx

### 🔹 Bill / Invoice Routing
- **Category:** Billing & Invoicing
- **Description:** Route emergency medicine bills for quick delivery via special pharmacist.
- **Backend API:** Pending Review
- **Integration Status:** Pending

### 🔹 Emergency Medicine Delivery
- **Category:** Fulfillment & Delivery
- **Description:** Process rapid emergency medicine dispatches (e.g., snake bite cases).
- **Backend API:** POST /api/delivery-orders, GET /api/delivery-orders
- **Integration Status:** Not Created

## 📄 Component / Page: ExpiryManagementPage.tsx

### 🔹 Expiry Dump Clearance & Formal Disposal Log
- **Category:** Inventory Advanced
- **Description:** Dedicated expiry quarantine workflow, clearance discounting, and formal PIN-approved disposal audit log.
- **Backend API:** POST /api/disposal
- **Integration Status:** Connected

### 🔹 Expiry Days Filter
- **Category:** Inventory & Expiry
- **Description:** Filter inventory nearing expiry (<10 days left, 3 days left, 10 days left) for billing priority.
- **Backend API:** GET /api/products/expiry/alerts
- **Integration Status:** Connected

### 🔹 Expired Stock Prescription Review
- **Category:** Clinical & AI Insights
- **Description:** View prescription history for expired/near-expiry stock and contact doctor.
- **Backend API:** GET /api/prescriptions
- **Integration Status:** Not Created

## 📄 Component / Page: General / Backend / Unassigned

### 🔹 AI Speech Billing
- **Category:** AI & Automation
- **Description:** Allow counter clerks to speak product names and quantities (e.g., 'Add 2 strips of Paracetamol 650'), auto-adding items to cart via Web Speech API.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 AI Shop Assistant
- **Category:** AI & Automation
- **Description:** Conversational voice/text assistant on dashboard answering sales, stock, profit, and supplier dues queries.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 AI Dashboard Insights
- **Category:** AI & Automation
- **Description:** Automated AI recommendations on main dashboard categorizing stock velocity and suggesting reorders or dump clearance discounts.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 AI / Auto Udhar Call & Reminders
- **Category:** AI & Automation
- **Description:** Automated WhatsApp / SMS payment due reminders for credit customers with payment link attachments.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Udhar Khata (Customer Ledger)
- **Category:** Credit / Udhar
- **Description:** Digital credit ledger module for retail customers tracking total credit limit, total credit outstanding, and payment terms.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Partial Payments for Udhar
- **Category:** Credit / Udhar
- **Description:** Interface to record partial cash/UPI settlements against a customer's outstanding balance, updating remaining debt in real-time.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Customer Dues & Balance Tracking
- **Category:** Credit / Udhar
- **Description:** Real-time outstanding balance summary per customer with overdue alerts, credit limits, and credit filtering.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Automated WhatsApp Due Reminders
- **Category:** Credit / Udhar
- **Description:** One-click WhatsApp link generation containing outstanding balance summary and UPI payment links sent to credit customers.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Fast-Moving Stock Analysis
- **Category:** Inventory
- **Description:** Analytics report ranking items with highest sales velocity over 7/30 days to optimize reorder frequency.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Slow-Moving Stock Analysis
- **Category:** Inventory
- **Description:** Report listing items with low sales velocity relative to stock quantity, suggesting promotional discounts.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Dead Stock Analysis
- **Category:** Inventory
- **Description:** Report identifying products with zero sales for 60+ or 90+ days to prevent locked working capital.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Voice Billing
- **Category:** Billing & Invoicing
- **Description:** Direct speech-to-cart addition during active counter billing sessions.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Service Charge Support
- **Category:** Billing & Invoicing
- **Description:** Configurable service fee, delivery charge, or handling fee field in cart summary and invoice calculations.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 SMS Bill Sharing
- **Category:** Billing & Integrations
- **Description:** SMS link button (sms:?body=...) or SMS gateway API integration for delivering invoices.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 GSTR-3B Style Reporting
- **Category:** GST & Tax
- **Description:** Tax summary report comparing outward GST tax liability against inward Input Tax Credit (ITC) from purchase GRNs.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 True Excel (.xlsx) Export
- **Category:** Sales & Profit
- **Description:** Export reports and inventory tables directly into native formatted .xlsx files using the xlsx library.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Public Developer API
- **Category:** Integrations
- **Description:** REST API endpoints for external integrations (e.g., e-commerce sync or external accounting software).
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Multi-Store Management
- **Category:** Multi-Store
- **Description:** Manage multiple pharmacy/retail outlets under a single account with aggregated dashboards.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Per-Shop Data Isolation
- **Category:** Multi-Store
- **Description:** Separate sales, inventory, batch numbers, and ledger databases for each outlet.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 One-Tap Shop Switching
- **Category:** Multi-Store
- **Description:** Store switcher dropdown in top Navbar to switch active branch context seamlessly.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Google Drive Sync & Backup
- **Category:** Sync & Backup
- **Description:** Automatic or manual encrypted JSON database backup to Google Drive / Gmail.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Android-to-Desktop Data Transfer
- **Category:** Sync & Backup
- **Description:** Seamless data migration utility between mobile and desktop instances.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 22+ Indian Languages UI
- **Category:** Languages
- **Description:** Multilingual i18n support (Hindi, Telugu, Tamil, Marathi, Kannada, etc.) across the app interface.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Multilingual Voice Commands
- **Category:** Languages
- **Description:** Voice recognition supporting regional Indian languages for product lookup and bill entries.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Native Android App (APK / PWA)
- **Category:** Platforms
- **Description:** Package Web App as a Native Android APK (Capacitor/Cordova) or Progressive Web App (PWA).
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Restaurant / Café Mode
- **Category:** Business Types
- **Description:** Dedicated restaurant menu mode, table reservation, and food order billing alongside retail mode.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Public Help & FAQ Center
- **Category:** Support & Docs
- **Description:** In-app searchable help documentation, feature tours, and user guide.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Multi-Outlet Business Management
- **Category:** Business Types
- **Description:** Multi-store business capability suited to owners with multiple shop locations.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Granular Role-Based Permissions
- **Category:** Security & Governance
- **Description:** Multi-user role permissions (Cashier vs Store Manager vs Accountant vs Owner).
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Advanced Accounting / Full ERP Sync
- **Category:** Accounting
- **Description:** Tally / Marg / ERP sync export capability for ledger and invoice data.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Advanced Customer Analytics & Churn
- **Category:** Analytics
- **Description:** Customer purchase frequency, cohort analysis, and churn risk detection.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Custom Discount Campaigns
- **Category:** Billing & Invoicing
- **Description:** Scheduled promotional rules (e.g., Buy 1 Get 1, Happy Hour 5% off, Festival discounts).
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Supplier Credit Due Reminders
- **Category:** Supplier Management
- **Description:** WhatsApp / SMS alerts for upcoming supplier invoice payment due dates.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Audit Log & Activity History
- **Category:** Security & Governance
- **Description:** Detailed audit log of every price edit, deletion, GRN modification, or discount override.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

### 🔹 Auto-Database Backup
- **Category:** Data Safety
- **Description:** Scheduled automatic local daily backup of IndexedDB / Redux store state to downloadable JSON.
- **Backend API:** TBD (Future Roadmap)
- **Integration Status:** Future Roadmap

## 📄 Component / Page: InterStoreChatbotModal.tsx

### 🔹 Store Network Chatbot
- **Category:** Fulfillment & Delivery
- **Description:** Inter-store chatbot connecting pharmacists across branches to locate inventory.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: InventoryDashboardPage.tsx

### 🔹 Stock Tracking
- **Category:** Inventory
- **Description:** Real-time batch-level inventory tracking across all product batches and store locations.
- **Backend API:** Pending Review
- **Integration Status:** Pending

### 🔹 Low-Stock Visibility / Alerts
- **Category:** Inventory
- **Description:** Automatic low-stock identification, filter tags, and dashboard alert counters for items below reorder level.
- **Backend API:** Pending Review
- **Integration Status:** Pending

### 🔹 Clearance & Dump Stock Dashboard
- **Category:** Inventory & Expiry
- **Description:** Identify and notify dump stock (>30 days on shelf) for inventory clearance dispatch.
- **Backend API:** GET /api/reports/dead-stock
- **Integration Status:** Not Created

### 🔹 Low Stock Dashboard Alert
- **Category:** Inventory & Expiry
- **Description:** Dashboard display of low stock items with one-click reorder recommendation.
- **Backend API:** GET /api/products/stock/low
- **Integration Status:** Connected

## 📄 Component / Page: InventoryPage.tsx

### 🔹 Retail Product Mode
- **Category:** Inventory
- **Description:** Supports a comprehensive retail product-based billing mode with selling price, MRP, margin %, and barcode support.
- **Backend API:** GET /api/products
- **Integration Status:** Connected

### 🔹 Low Stock Reorder Trigger
- **Category:** Inventory & Expiry
- **Description:** Automated low stock trigger (heavy/optimal threshold) creating auto-orders.
- **Backend API:** GET /api/products/stock/low
- **Integration Status:** Connected

## 📄 Component / Page: Local Architecture

### 🔹 Offline Inventory & Reports
- **Category:** Offline
- **Description:** All stock adjustments, GRN entries, and reporting views operate completely offline.
- **Backend API:** Redux / LocalStorage
- **Integration Status:** Connected (No Backend needed)

## 📄 Component / Page: Local State / Client Storage

### 🔹 Local Data Storage
- **Category:** Offline
- **Description:** Billing, product, cart, transactions, and settings data remain stored securely on the local client state.
- **Backend API:** Redux / LocalStorage
- **Integration Status:** Connected (No Backend needed)

## 📄 Component / Page: MultiStoreModal.tsx

### 🔹 Store-to-Store Pickup Routing
- **Category:** Fulfillment & Delivery
- **Description:** Route inventory from neighboring stores for customer pickup if item is out of stock.
- **Backend API:** GET /api/stores, POST /api/stores/borrow-stock
- **Integration Status:** Not Created

### 🔹 Out of Stock Branch Redirect
- **Category:** Inventory & Expiry
- **Description:** Auto-recommend neighboring store branches when local stock is exhausted.
- **Backend API:** GET /api/stores, POST /api/stores/borrow-stock
- **Integration Status:** Not Created

### 🔹 Inter-Pharmacy Price & Qty Query
- **Category:** Procurement & Vendor
- **Description:** Inquire price and quantity availability across partner pharmacies.
- **Backend API:** GET /api/stores
- **Integration Status:** Not Created

## 📄 Component / Page: MultiStoreModal.tsx & posSlice.ts

### 🔹 Borrowed Medicine Tracking
- **Category:** Inventory & Expiry
- **Description:** Track borrowed/lent medicines from wholesale or godown with display adjustment.
- **Backend API:** GET /api/stores, POST /api/stores/borrow-stock
- **Integration Status:** Not Created

## 📄 Component / Page: OnlineDeliveryPage.tsx

### 🔹 Online Delivery Dashboard
- **Category:** Fulfillment & Delivery
- **Description:** Secondary dashboard tracking online, home delivery, delayed orders, and pharmacist assignment.
- **Backend API:** POST /api/delivery-orders, GET /api/delivery-orders
- **Integration Status:** Not Created

### 🔹 Delivery Mode & Verification
- **Category:** Fulfillment & Delivery
- **Description:** Track pickup vs delivery timing, mode, and verification status (wait up to 24 hours).
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: POS Layout

### 🔹 Neighbourhood Retail
- **Category:** Business Types
- **Description:** Designed for neighbourhood retail businesses needing quick counter sales and customer management.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: PatientsPage.tsx

### 🔹 Customer Info Capture
- **Category:** CRM & Loyalty
- **Description:** Capture customer phone number, email ID, and preferred doctor/family details.
- **Backend API:** POST /api/patients
- **Integration Status:** Connected

### 🔹 Pharmacist Recommendations Tagging
- **Category:** Clinical & AI Insights
- **Description:** Tag recommendations source (Insurance, Doctor, Lab, Pharmacist).
- **Backend API:** Local AI / Redux Logic
- **Integration Status:** Connected

### 🔹 Customer Behavior & Quantity Analysis
- **Category:** CRM & Loyalty
- **Description:** Analyze customer purchase history patterns (e.g., 10 vs 30 tablets preference).
- **Backend API:** GET /api/patients/:id/insights
- **Integration Status:** Not Created

### 🔹 Special Care & Chronic Patient Tags
- **Category:** CRM & Loyalty
- **Description:** Tag doctor/lab referrals, chronic patients, acute vs regular needs, item counts.
- **Backend API:** GET /api/patients/:id/insights
- **Integration Status:** Not Created

## 📄 Component / Page: PaymentModal.tsx

### 🔹 Payment Gateway / Dynamic UPI QR Integration
- **Category:** Limitations / Integrations
- **Description:** Generates dynamic Razorpay UPI QR codes for customer scanning on counter display or payment modal.
- **Backend API:** Pending Review
- **Integration Status:** Pending

### 🔹 Auto Pay / Card Payment
- **Category:** Billing & Invoicing
- **Description:** Auto-pay setup for Credit/Debit cards with categorization for big bills vs small bills.
- **Backend API:** POST /api/payments/razorpay-webhook
- **Integration Status:** Not Created

## 📄 Component / Page: Pending Audio Recording Module (Requires counter microphone audio recorder MediaRecorder API & consultation note storage)

### 🔹 Customer Voice Record & Discussion Notes
- **Category:** CRM & Loyalty
- **Description:** Record text/voice notes during customer discussion for consultation logging.
- **Backend API:** MediaRecorder API
- **Integration Status:** Not Created

## 📄 Component / Page: Pending Hardware Integration (Requires API hardware driver integration with automated robotic dispensing machines - RAAC)

### 🔹 RAAC / Robotic Selection
- **Category:** Store & Staff Ops
- **Description:** Integration with automated/robotic drug selection systems (RAAC).
- **Backend API:** Hardware API (TCP/IP)
- **Integration Status:** Not Created

## 📄 Component / Page: Pending Voice Clips Audio Player (Requires multi-language audio player clips & downloadable PIL PDF document repository)

### 🔹 Patient Instruction Leaflet (PIL) & Voice Clips
- **Category:** Clinical & AI Insights
- **Description:** Provide dosage instructions, voice audio clips, and multi-language PIL info.
- **Backend API:** PDF Delivery API
- **Integration Status:** Not Created

## 📄 Component / Page: Pending Voice NLP Model Integration (Requires real-time Speech-to-Text NLP sentiment model integration during billing)

### 🔹 Sentiment Analysis Recommendation
- **Category:** Clinical & AI Insights
- **Description:** Dynamic product suggestions based on customer sentiment and talk analysis.
- **Backend API:** Voice NLP API
- **Integration Status:** Not Created

## 📄 Component / Page: PrescriptionModal.tsx

### 🔹 Prescription Upload & Doctor Details Recording
- **Category:** Prescription Auditing
- **Description:** Captures prescribing doctor registration details and supports digital prescription image attachment.
- **Backend API:** POST /api/prescriptions/upload
- **Integration Status:** Not Created

## 📄 Component / Page: PrescriptionUploadModal.tsx

### 🔹 Prescription Upload to Billing
- **Category:** Billing & Invoicing
- **Description:** Upload prescription images/docs directly into the active billing workflow.
- **Backend API:** POST /api/prescriptions/upload
- **Integration Status:** Not Created

## 📄 Component / Page: ProductSearch.tsx

### 🔹 Near Expiry Discount/Gifting
- **Category:** Inventory & Expiry
- **Description:** Apply discount (Rs 5-10) or gift add-on for items nearing expiry at checkout.
- **Backend API:** Local Redux Logic
- **Integration Status:** Connected

## 📄 Component / Page: ProductSearch.tsx, CartTable.tsx

### 🔹 Quick Billing
- **Category:** Billing & Invoicing
- **Description:** Create bills quickly using quick product search and barcode scanning, supporting unit selection (PACK vs LOOSE).
- **Backend API:** POST /api/invoices
- **Integration Status:** Connected

### 🔹 Kirana / General Stores
- **Category:** Business Types
- **Description:** Designed for small Indian retail stores and kirana businesses with barcode scanning and rapid checkout.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: PurchaseGRNPage.tsx, ExpiryManagementPage.tsx

### 🔹 Stock Activity
- **Category:** Inventory
- **Description:** Comprehensive audit log of stock movement including Purchase GRNs, Returns, and Expired Stock Disposals.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: ReceiptPrintView.tsx

### 🔹 PDF Invoice Sharing
- **Category:** Billing & Invoicing
- **Description:** Generate and share digital invoice print previews capable of standard PDF saving and printing.
- **Backend API:** Local UI / Print API
- **Integration Status:** Connected (No Backend needed)

### 🔹 Thermal Invoice Printing
- **Category:** Billing & Invoicing
- **Description:** Print invoices using supported thermal printers with responsive narrow layouts for 58mm and 80mm roll printers.
- **Backend API:** Local UI / Print API
- **Integration Status:** Connected (No Backend needed)

### 🔹 Thermal Printers
- **Category:** Integrations
- **Description:** Supports thermal invoice printing via standard browser print dialog and media queries.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: ReceiptPrintView.tsx, SettingsPage.tsx

### 🔹 Custom Bill Layout
- **Category:** Billing & Invoicing
- **Description:** Customize bill layout with store branding, shop name, address, DL license number, GSTIN, and custom footer terms.
- **Backend API:** GET /api/settings, PUT /api/settings
- **Integration Status:** Connected

## 📄 Component / Page: ReportsPage.tsx

### 🔹 GSTR-1 Style Reporting
- **Category:** GST & Tax
- **Description:** Provides HSN-wise tax sales report breaking down taxable value, CGST, SGST, total tax, and invoice totals.
- **Backend API:** GET /api/reports/sales-summary
- **Integration Status:** Connected

### 🔹 Profit View
- **Category:** Sales & Profit
- **Description:** Displays gross margin %, cost of goods sold (COGS), and net profit estimations across timeframes.
- **Backend API:** GET /api/reports/sales-summary
- **Integration Status:** Connected

### 🔹 Date-Range Reports
- **Category:** Sales & Profit
- **Description:** Generate sales and profit reports for selected periods (Today, Yesterday, Last 7 Days, This Month, Custom).
- **Backend API:** GET /api/reports/sales-summary
- **Integration Status:** Connected

### 🔹 PDF Export
- **Category:** Sales & Profit
- **Description:** Export and print clean, formatted PDF versions of sales summaries and tax reports.
- **Backend API:** GET /api/reports/sales-summary
- **Integration Status:** Connected

### 🔹 Substitute Success Rate Intelligence
- **Category:** Clinical & AI Insights
- **Description:** Track daily acceptance rate of generic/substitute suggestions by store.
- **Backend API:** GET /api/reports/substitute-success
- **Integration Status:** Not Created

## 📄 Component / Page: Responsive Web / Desktop

### 🔹 Windows
- **Category:** Platforms
- **Description:** Desktop application and responsive web support optimized for Windows OS.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: ReturnsPage.tsx

### 🔹 Return & Refund Tracking
- **Category:** Inventory & Expiry
- **Description:** Handle returns with low price return policy (~15%) and track inventory credit.
- **Backend API:** POST /api/returns, GET /api/invoices/:id
- **Integration Status:** Connected

### 🔹 Restocking Returned Medicines
- **Category:** Inventory & Expiry
- **Description:** Directly re-add returned, unexpired medicines back to active display shelves/stock.
- **Backend API:** POST /api/grn, GET /api/grn
- **Integration Status:** Connected

### 🔹 Distributor Expiry Returns
- **Category:** Inventory & Expiry
- **Description:** Process distributor returns for near-expiry and expired stock.
- **Backend API:** POST /api/returns
- **Integration Status:** Connected

## 📄 Component / Page: SettingsPage.tsx

### 🔹 GSTIN Support
- **Category:** GST & Tax
- **Description:** GST business information can be configured and displayed across tax invoices, reports, and headers.
- **Backend API:** GET /api/settings, PUT /api/settings
- **Integration Status:** Connected

## 📄 Component / Page: SmartSubstitutionModal.tsx

### 🔹 Substitute Discount Display
- **Category:** Billing & Invoicing
- **Description:** Calculate and display total savings on invoice line items when generic substitutes are chosen.
- **Backend API:** Pending Review
- **Integration Status:** Pending

### 🔹 Substitute Ranking & Filtering
- **Category:** Clinical & AI Insights
- **Description:** Rank substitutes based on cost-effective/affordable, near expiry stock, high quality brand, and pharmacy recommended safety.
- **Backend API:** POST /api/billing/check-substitutes
- **Integration Status:** Created not connected

### 🔹 Substitute UI & Savings Badge
- **Category:** Billing & Invoicing
- **Description:** Show substitute options, discount amount, and 'Best Seller' tags on billing screen.
- **Backend API:** POST /api/billing/check-substitutes
- **Integration Status:** Created not connected

### 🔹 One-Click Substitute Swap
- **Category:** Billing & Invoicing
- **Description:** 'Substitute with this' button to instantly swap item on active invoice.
- **Backend API:** Pending Review
- **Integration Status:** Pending

### 🔹 Profit Maker Margin Maximizer
- **Category:** Clinical & AI Insights
- **Description:** Highlight higher-margin alternative brands (e.g. Dettol, Bandages) to boost profit.
- **Backend API:** Local AI / Redux Logic
- **Integration Status:** Connected

## 📄 Component / Page: SupplierDirectoryPage.tsx

### 🔹 Supplier & Vendor Directory
- **Category:** Procurement & SCM
- **Description:** Complete vendor directory tracking supplier contact details, pending credit balances, GSTIN, and lead times.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: SuppliersPage.tsx

### 🔹 Supplier Price & Rebate Comparison
- **Category:** Procurement & Vendor
- **Description:** Compare suppliers/wholesalers on discounts, schemes, rebates, and margins to liquidate stock.
- **Backend API:** GET /api/suppliers
- **Integration Status:** Connected

### 🔹 Supplier Payment Logs
- **Category:** Procurement & Vendor
- **Description:** Track cash vs credit bills, repayment due dates, and payment logs (10-15 day windows).
- **Backend API:** GET /api/suppliers
- **Integration Status:** Connected

### 🔹 Procurement Intelligence
- **Category:** Procurement & Vendor
- **Description:** Smart procurement alerts on combo offers, distributor deals, and feature-equivalent substitutes.
- **Backend API:** GET /api/suppliers
- **Integration Status:** Connected

### 🔹 Advance Order Placement
- **Category:** Procurement & Vendor
- **Description:** Enable pharmacists to place advance replenishment orders directly with distributors.
- **Backend API:** GET /api/suppliers
- **Integration Status:** Connected

## 📄 Component / Page: TabBar.tsx

### 🔹 Pharmacy Work Clarity
- **Category:** Store & Staff Ops
- **Description:** Clarify active vs background pharmacy work (e.g. emergency snake bite handling).
- **Backend API:** Local UI
- **Integration Status:** Connected

## 📄 Component / Page: Vite / React 19 Stack

### 🔹 Web Application
- **Category:** Platforms
- **Description:** Full modern browser-based Web Application platform built with Vite + React 19 + Redux Toolkit + TailwindCSS.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: WellnessBrochureModal.tsx

### 🔹 Health Insights & Care Plans
- **Category:** CRM & Loyalty
- **Description:** Generate customer health insights and assign personalized care plans.
- **Backend API:** GET /api/wellness/plans
- **Integration Status:** Not Created

### 🔹 Health & Wellness Plan Integration
- **Category:** CRM & Loyalty
- **Description:** Attach health & wellness brochures / digital plans to customer accounts.
- **Backend API:** Pending Review
- **Integration Status:** Pending

### 🔹 Gender & Maternity Care Customization
- **Category:** CRM & Loyalty
- **Description:** Customize recommended care packages based on gender (M/F), specializations, or maternity.
- **Backend API:** GET /api/wellness/plans
- **Integration Status:** Not Created

## 📄 Component / Page: drugInteractions.ts, CartTable.tsx

### 🔹 Drug Interaction Check Engine
- **Category:** Clinical Intelligence
- **Description:** Automated real-time cart engine that checks and warns against severe or dangerous drug-to-drug interactions.
- **Backend API:** POST /api/billing/check-drug-interactions
- **Integration Status:** Created not connected

## 📄 Component / Page: fefoHelper.ts

### 🔹 Batch Auto-Selection (FEFO)
- **Category:** Inventory & Expiry
- **Description:** Auto-select near-expiry batch numbers first with color-coded alerts (Red: <22 days, Amber, Green).
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: gstCalculator.ts

### 🔹 Tax Support
- **Category:** Billing & Invoicing
- **Description:** Supports item-wise tax calculation with automated 50/50 CGST & SGST intra-state split and HSN tax codes.
- **Backend API:** POST /api/invoices
- **Integration Status:** Connected

### 🔹 Offline GST Billing
- **Category:** GST & Tax
- **Description:** Generate GST-compliant invoices with HSN breakdowns without requiring an active internet connection.
- **Backend API:** Redux / LocalStorage
- **Integration Status:** Connected (No Backend needed)

## 📄 Component / Page: macOS Browser / App

### 🔹 macOS
- **Category:** Platforms
- **Description:** Desktop application and browser support running smoothly on Apple Mac workstations.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: medicineDetails.ts

### 🔹 Units of Measure
- **Category:** Inventory
- **Description:** Products can use multiple units such as Strips, Bottles, Tablets, Vials, and Loose units.
- **Backend API:** GET /api/products
- **Integration Status:** Connected

## 📄 Component / Page: medicineDetails.ts, CartTable.tsx

### 🔹 Sweet Shops
- **Category:** Business Types
- **Description:** Supports loose item quantity selection, weight units, quick discounts, and fast checkout.
- **Backend API:** Pending Review
- **Integration Status:** Pending

## 📄 Component / Page: posSlice.ts

### 🔹 Automatic Stock Deduction
- **Category:** Inventory
- **Description:** Deducts exact item and batch quantities from stock as soon as a payment/sale is finalized.
- **Backend API:** Pending Review
- **Integration Status:** Pending

### 🔹 Offline Billing
- **Category:** Offline
- **Description:** Billing works without active Wi-Fi/mobile data; all sales transactions process locally.
- **Backend API:** Redux / LocalStorage
- **Integration Status:** Connected (No Backend needed)

## 📄 Component / Page: posSlice.ts, batchSelector.ts

### 🔹 FEFO Batch Selection (First Expiry First Out)
- **Category:** Inventory Advanced
- **Description:** Automated batch routing during cart addition that automatically picks the earliest expiring batch.
- **Backend API:** Local Redux Logic (No backend needed)
- **Integration Status:** Connected

## 📄 Component / Page: products.ts

### 🔹 Product Catalog
- **Category:** Inventory
- **Description:** Maintain centralized products/items database with search, category filtering, salt compositions, and pack types.
- **Backend API:** GET /api/products
- **Integration Status:** Connected

## 📄 Component / Page: substituteEngine.ts, ProductSearch.tsx

### 🔹 Smart Substitute Medicine Engine
- **Category:** Smart Retail
- **Description:** Recommends generic salts and in-stock alternative brand substitutes when requested product is out of stock.
- **Backend API:** POST /api/billing/check-substitutes
- **Integration Status:** Created not connected

## 📄 Component / Page: whatsappShare.ts

### 🔹 WhatsApp Bill Sharing
- **Category:** Billing & Invoicing
- **Description:** Instantly share pre-formatted text invoices directly with customers through WhatsApp (wa.me).
- **Backend API:** Local UI / Print API
- **Integration Status:** Connected (No Backend needed)

### 🔹 WhatsApp
- **Category:** Integrations
- **Description:** Invoice links and formatted order summaries can be shared directly through WhatsApp.
- **Backend API:** Local UI / Print API
- **Integration Status:** Connected (No Backend needed)
