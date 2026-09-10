# GENQUANTAA POS Application — Complete 6-Sheet Audit & Pending Tasks Report

**Audit Date:** September 10, 2026  
**Project:** GENQUANTAA Pharmacy Point of Sale (POS) Billing Application  
**Repository:** [ammarraza1199/Pharma_project](https://github.com/ammarraza1199/Pharma_project)  
**File Location in Workspace:** [PENDING_TASKS_REPORT.md](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/PENDING_TASKS_REPORT.md)  
**Scope:** Complete Audit of all 6 Handwritten Requirement Sheets (Tasks #0 to #57) against the POS Codebase  

---

## 1. Executive Summary & 6-Sheet Verification Overview

A complete audit of all **6 handwritten requirement sheets** (Circle 1 through Circle 6) has been performed against the active POS application codebase in [`frontend/src/`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/).

### Overall Status Breakdown (57 Total Requirements Audited)

| Category | Count | Percentage | Description |
| :--- | :---: | :---: | :--- |
| **Fully Implemented & Operational** | **30 Tasks** | **52.6%** | Built, styled, wired to Redux, and functional in UI. |
| **Partially Implemented** | **2 Tasks** | **3.5%** | Basic foundation present; specific handwritten features missing. |
| **Pending / Incompleted Tasks** | **25 Tasks** | **43.9%** | Requires frontend components, Redux state, and/or analytics logic. |
| **Total Requirements Audited** | **57 Items** | **100%** | Comprehensive audit across all 6 sheets. |

### Status Breakdown by Sheet

| Sheet # | Handwritten Circle | Task Range | Domain | Completed | Partial | Incompleted / Pending |
| :---: | :---: | :---: | :--- | :---: | :---: | :---: |
| **Sheet 1** | **(1)** | Tasks #0 – #10 | Core Billing, Delivery, Invoicing & Payments | **11** | 0 | **0** |
| **Sheet 2** | **(2)** | Tasks #12 – #18 | Substitutions, Expiry Badges, FEFO & Vendor Compare | **6** | 0 | **1** |
| **Sheet 3** | **(3)** | Tasks #19 – #28 | Procurement, Returns, Refills & Care Plans | **5** | 0 | **5** |
| **Sheet 4** | **(4)** | Tasks #29 – #40 | Wellness, Inter-Store Chatbot, Borrowing & Stock Levels | **7** | 1 | **4** |
| **Sheet 5** | **(5)** | Tasks #41 – #51 | Profit Maker, Convince Scripts, Audio AI & PIL | **1** | 1 | **9** |
| **Sheet 6** | **(6)** | Tasks #52 – #57 | Waiting Time, Adherence, Referrals & Routing | **0** | 0 | **6** |
| **TOTALS** | — | **57 Tasks** | — | **30 (52.6%)** | **2 (3.5%)** | **25 (43.9%)** |

---

## 2. Itemized Inventory of INCOMPLETED & PENDING Tasks (25 Tasks)

The following items from the 6 handwritten sheets currently require development or completion:

### Group A: Counter Profitability & Cross-Selling (Sheet 5)
| # | Sheet & Note Ref | Task / Feature Name | Target Component | Priority | Detailed Functional Requirement |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **01** | **Sheet 5 — #45** | **Profit Maker & Margin Maximizer Engine** | `CartTable.tsx`<br>`ProductSearch.tsx` | **High** | High-margin cross-sell engine: Suggests profitable companion items (*Dettol, medicated bandages, antiseptics, cotton rolls, multivitamin supplements*) based on sales insights to maximize counter margin. |
| **02** | **Sheet 5 — #46** | **"How to Convince Customer" Key Message Overlapping Screen** | `SmartSubstitutionModal.tsx`<br>(New Overlay) | **High** | Quick prompt card overlaying the screen with verbal talking points and clinical reassurance scripts to help staff convince hesitant patients to accept substitutes or profit-maker add-ons. |
| **03** | **Sheet 5 — #47** | **Combo Recommendations (Clinical & First-Aid Bundles)** | `CartTable.tsx`<br>`CartSummary.tsx` | **Medium** | Intelligent product bundle suggestions (e.g., *Fever Kit: Paracetamol + ORS + Digital Thermometer*; *Wound Care Kit: Betadine + Sterile Gauze + Bandage*) with a 1-click "Add Bundle to Cart" button. |

### Group B: Supply Chain, Procurement & Supplier Terms (Sheets 2 & 3)
| # | Sheet & Note Ref | Task / Feature Name | Target Component | Priority | Detailed Functional Requirement |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **04** | **Sheet 5 — #41** | **Pharmacist Reorder Intimation / Push Notification** | `Navbar.tsx`<br>`Dashboard.tsx` | **High** | Instant notification/alert when product stock falls below minimum safety threshold during billing, prompting immediate replenishment. |
| **05** | **Sheet 3 — #19** | **Supplier Cash vs Credit Bills & 10/15-Day Due Dates Log** | `SuppliersPage.tsx` | **High** | Breakdown of supplier purchases into **Cash Bills** vs **Credit Bills**, with a structured repayment ledger and countdown badges for **10-day** and **15-day** credit terms. |
| **06** | **Sheet 2 (#18) & Sheet 3 (#20)** | **Procurement Intelligence & Supplier Price Comparison** | `SuppliersPage.tsx`<br>`PurchaseGRNPage.tsx` | **High** | Multi-vendor price comparison matrix for the same medicine: Compares purchase prices, schemes (*Buy 10 Get 2 Free*), wholesale rebates, and liquidation margins to identify lowest-cost distributor. |
| **07** | **Sheet 3 — #21** | **Advance Purchase Order (PO) Placement to Distributors** | `PurchaseGRNPage.tsx` | **High** | Pharmacist ability to draft, approve, and dispatch formal **Purchase Orders (POs)** in advance to selected distributors with scheduled delivery dates before stock arrives. |

### Group C: Expiry Actions, Returns & Shelf Management (Sheets 3 & 5)
| # | Sheet & Note Ref | Task / Feature Name | Target Component | Priority | Detailed Functional Requirement |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **08** | **Sheet 5 — #42** | **Expiry Page Rx vs OTC Views & "Ask Doctor" Intimation** | `ExpiryManagementPage.tsx` | **Medium** | Segmented filter tab to toggle between **Prescription (Rx)** and **OTC** expiring batches, and an **"Ask Doctor"** action allowing staff to contact prescribing doctors to clear near-expiry Rx stock. |
| **09** | **Sheet 5 — #43** | **Return to Distributor for Near-Expiry Stock** | `ExpiryManagementPage.tsx`<br>`ReturnsPage.tsx` | **High** | Workflow to initiate a return-for-credit to the distributor before the cutoff window (60–90 days prior to expiry) rather than holding stock until total loss/disposal. |
| **10** | **Sheet 5 — #44** | **Rack / Shelf Selection Robo (Visual Picking Locator)** | `ProductSearch.tsx`<br>`CartTable.tsx` | **Medium** | Automated visual shelf locator showing the cashier the exact 2D aisle, rack, shelf tier, and bin coordinates to pick medicines at high speed during peak counter rushes. |
| **11** | **Sheet 3 — #22** | **Return & Refund 15% Restocking Deduction Option** | `ReturnsPage.tsx` | **Medium** | Checkbox/toggle to apply a statutory **15% deduction / restocking fee** for customer-returned medicines or late returns. |
| **12** | **Sheet 3 — #23** | **Returned Medicine Physical Put-Away / Shelf Restocking Queue** | `ReturnsPage.tsx` | **Low** | Physical restock task queue displaying returned items waiting for idle counter staff to put back on physical storage racks. |

### Group D: Stock Levels & Cart Substitution Lineage (Sheet 4)
| # | Sheet & Note Ref | Task / Feature Name | Target Component | Priority | Detailed Functional Requirement |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **13** | **Sheet 4 — #36 (Partial)** | **Substitute "Best Seller" Tag & Highlight** | `CartTable.tsx` | **Low** | Display "Best Seller" badge and promotional tag next to substitute items in the cart table. |
| **14** | **Sheet 4 — #37** | **"This Substitute with This" Cart Lineage Display** | `CartTable.tsx` | **Medium** | Explicitly display textual lineage directly under the item in the cart table: *"Substituted for: [Original Medicine Name]"*. |
| **15** | **Sheet 4 — #39** | **4-Tier Stock Classification (Heavy, Optimal, Trigger Order, Low Stock)** | `InventoryDashboardPage.tsx` | **Medium** | Structured 4-tier stock classification tabs: **Heavy (Overstocked)**, **Optimal**, **Trigger Order (Reorder Point)**, and **Low Stock Trigger (Critical)**. |
| **16** | **Sheet 4 — #40** | **Low Stock Order Recommendation on Dashboard** | `Dashboard.tsx` | **Medium** | Displaying recommended reorder quantities (Economic Order Quantity / EOQ) on the dashboard for low stock items based on sales velocity. |

### Group E: Audio AI & Sentiment Analysis (Sheet 5)
| # | Sheet & Note Ref | Task / Feature Name | Target Component | Priority | Detailed Functional Requirement |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **17** | **Sheet 5 — #48 (Partial)** | **Value-Added Products with Discussion Recording** | `VoiceConsultationModal.tsx` | **Low** | Link value-added product discount offers directly to the counter audio recording history. |
| **18** | **Sheet 5 — #49** | **Customer Voice Speech-to-Text (STT) Live Transcription** | `VoiceConsultationModal.tsx` | **Medium** | Convert recorded counter audio into live searchable text using Web Speech API, logging verbatim patient queries and pharmacist advice. |
| **19** | **Sheet 5 — #50** | **Customer Sentiment Analysis & Dynamic Recommendations** | `VoiceConsultationModal.tsx`<br>`CartTable.tsx` | **Medium** | Real-time sentiment engine (analyzing customer tone: *Hesitant, Price-Sensitive, Anxious, Satisfied*) to dynamically trigger special discount incentives or suggest affordable generic alternatives. |

### Group F: Store Analytics, Adherence & Staff Routing (Sheet 6)
| # | Sheet & Note Ref | Task / Feature Name | Target Component | Priority | Detailed Functional Requirement |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **20** | **Sheet 6 — #52** | **Substitute Intelligence & Acceptance Success Rate Analytics** | `Dashboard.tsx`<br>`ReportsPage.tsx` | **Medium** | Analytics dashboard tracking substitution performance: Total substitutes suggested, count accepted vs rejected by patients, conversion **Success Rate %**, and store margin gains. |
| **21** | **Sheet 6 — #53** | **Customer Turnaround & Waiting Time Analytics** | `Dashboard.tsx`<br>`ReportsPage.tsx` | **Medium** | Customer waiting time metric logging: **Entry Time &rarr; Billing Time &rarr; Delivery/Packing Time &rarr; Dispatch Time**, tracking average service duration per person against counter target SLAs. |
| **22** | **Sheet 6 — #54** | **Customer Adherence & Dosage Behavior Analysis** | `PatientsPage.tsx`<br>`ReportsPage.tsx` | **Medium** | Analyze patient purchase compliance (detecting when a patient requests only 10 loose tablets instead of the prescribed 30-day course of 30 tablets) and displaying clinical adherence alerts. |
| **23** | **Sheet 6 — #55** | **Doctor & Diagnostic Lab Referral Volume Analytics** | `ReportsPage.tsx` | **Medium** | Analytics measuring referral volume per clinic/doctor and partner lab, tracking chronic vs acute patient distribution, average items per prescription, and top prescribers. |
| **24** | **Sheet 6 — #56** | **Regular / Chronic Customer Routing to Senior Pharmacists** | `TabBar.tsx`<br>`AssignBillModal.tsx` | **Medium** | Automated counter routing logic assigning chronic, elderly, or regular high-value customers to Senior Pharmacists. |
| **25** | **Sheet 6 — #57** | **Gender-Sensitive Pharmacist Routing (Female Pharmacist for Maternity)** | `TabBar.tsx`<br>`AssignBillModal.tsx` | **Medium** | Suggesting/routing female pharmacists for maternity, women's wellness, and sensitive personal care products, plus adding discreet packaging tags. |

---

## 3. Complete Inventory of COMPLETED Tasks (30 Tasks Operational)

| Note Ref | Task Name & Description | Codebase Reference | Status |
| :---: | :--- | :--- | :---: |
| **Sheet 1 — #0** | Bill &rarr; Invoice &rarr; Account &rarr; Pharmacy Database | [`InvoicesPage.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/InvoicesPage.tsx) | ✅ Completed |
| **Sheet 1 — #1** | Emergency Medicine Quick Delivery & Special Pharmacist | [`EmergencyDeliveryPage.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/EmergencyDeliveryPage.tsx) | ✅ Completed |
| **Sheet 1 — #2** | Workload Rebalancing & Multi-Pharmacist Bill Assignment | [`AssignBillModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/AssignBillModal.tsx), [`TabBar.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/TabBar.tsx) | ✅ Completed |
| **Sheet 1 — #3** | Multi-Branch Extension & Counter Sync | [`MultiStoreModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/MultiStoreModal.tsx) | ✅ Completed |
| **Sheet 1 — #4** | Emergency Delivery (Snake Bite, Cardiac, Anaphylaxis) | [`EmergencyDeliveryPage.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/EmergencyDeliveryPage.tsx) | ✅ Completed |
| **Sheet 1 — #5** | Tablets Strip Cutting, Oral Dosage, Patient Name/Phone | [`CartTable.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartTable.tsx), [`ProductSearch.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/ProductSearch.tsx) | ✅ Completed |
| **Sheet 1 — #6** | 2nd Dashboard for Online & Home Delivery (24hr Wait SLA) | [`OnlineDeliveryPage.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/OnlineDeliveryPage.tsx) | ✅ Completed |
| **Sheet 1 — #7** | Dual Printing (A4 Tax Invoice + 3" Thermal Slip) & Hold Bill | [`ReceiptPrintView.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/ReceiptPrintView.tsx), [`HeldBillsModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/HeldBillsModal.tsx) | ✅ Completed |
| **Sheet 1 — #8** | Multi-Tender Split Payment (Cash, Card, UPI, AutoPay) | [`PaymentModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/PaymentModal.tsx) | ✅ Completed |
| **Sheet 1 — #9** | Customer Phone, Name, Email, Preferred Doctor Capture | [`CartSummary.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartSummary.tsx), [`ComplianceModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/ComplianceModal.tsx) | ✅ Completed |
| **Sheet 1 — #10** | Substitute Savings Banner ("You saved ₹XX.XX!") | [`CartTable.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartTable.tsx), [`CartSummary.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartSummary.tsx) | ✅ Completed |
| **Sheet 2 — #12** | 5-Criteria Substitution Ranking (Near Exp, Low Price, Stock, Branded, Safe) | [`SmartSubstitutionModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/SmartSubstitutionModal.tsx) | ✅ Completed |
| **Sheet 2 — #13** | Dynamic Expiry Days Badges (Red <10d, Orange <30d, Amber <90d, Green) | [`CartTable.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartTable.tsx) | ✅ Completed |
| **Sheet 2 — #14** | Strip Tablets Inventory Auto-Update After Cutting | [`CartTable.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartTable.tsx), [`posSlice.ts`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/store/posSlice.ts) | ✅ Completed |
| **Sheet 2 — #15** | FEFO Batch Auto-Selection & Expiry Guardrails | [`fefoHelper.ts`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/utils/fefoHelper.ts) | ✅ Completed |
| **Sheet 2 — #16** | Near-Expiry Clearance Discount & ₹5–₹10 Free Promotional Gifts | [`ClearanceGiftModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/ClearanceGiftModal.tsx) | ✅ Completed |
| **Sheet 2 — #17** | 30-Day Dump Stock Intimation & Counter Dispatch Notification | [`CartTable.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartTable.tsx), [`ProductSearch.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/ProductSearch.tsx) | ✅ Completed |
| **Sheet 3 — #24** | Chronic Prescription Refill (BP, Sugar Repeat Orders + WhatsApp) | [`ChronicRefillModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/ChronicRefillModal.tsx) | ✅ Completed |
| **Sheet 3 — #25** | Prescription Image Upload & Medicine Extraction | [`PrescriptionUploadModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/PrescriptionUploadModal.tsx) | ✅ Completed |
| **Sheet 3 — #26** | Dedicated "🕒 Previously Ordered" Reorder Tab in Product Search | [`ProductSearch.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/ProductSearch.tsx) | ✅ Completed |
| **Sheet 3 — #27** | Pharmacist Value Services (Insurance Tag, Doctor Consult, Lab Tests) | [`CartSummary.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartSummary.tsx) | ✅ Completed |
| **Sheet 3 — #28** | Patient Health Insights & Chronic Care Plan | [`PatientsPage.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/PatientsPage.tsx) | ✅ Completed |
| **Sheet 4 — #29** | Health & Wellness Educational Patient Brochures (6 Conditions) | [`WellnessBrochureModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/WellnessBrochureModal.tsx) | ✅ Completed |
| **Sheet 4 — #30** | Age-Based Recommendations & Parent Coupon Booking | [`CartSummary.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartSummary.tsx) | ✅ Completed |
| **Sheet 4 — #31** | Store-to-Store Stock Inquiries & Branch Borrowing | [`MultiStoreModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/MultiStoreModal.tsx) | ✅ Completed |
| **Sheet 4 — #32** | Inter-Store Pharmacy AI Communication Chatbot | [`InterStoreChatbotModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/InterStoreChatbotModal.tsx) | ✅ Completed |
| **Sheet 4 — #33** | Recommend Neighbor Store if Out of Stock | [`MultiStoreModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/MultiStoreModal.tsx) | ✅ Completed |
| **Sheet 4 — #34** | Inter-Pharmacy Inquiries (Price & Quantity Request) | [`MultiStoreModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/MultiStoreModal.tsx) | ✅ Completed |
| **Sheet 4 — #35** | Borrowed Stock Ledger (Wholesale Cost & New Selling Price) | [`MultiStoreModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/MultiStoreModal.tsx) | ✅ Completed |
| **Sheet 4 — #38** | Loose Tablets Direct Billing & Fraction Calculation | [`CartTable.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartTable.tsx) | ✅ Completed |
| **Sheet 5 — #51** | Multilingual Patient Instruction Leaflets (PIL) with Audio Voice Clips | [`PatientInstructionModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/PatientInstructionModal.tsx) | ✅ Completed |
| **Foundation** | Audio Recording of Counter Consultations | [`VoiceConsultationModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/VoiceConsultationModal.tsx) | ✅ Completed |
