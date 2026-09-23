# GENQUANTAA POS — Technical Specification & Feature Guide
## Handwritten Document Features ("Ammar docum / Sep-9 — Sep-11")

**Reference Document:** Handwritten Requirement Note (`Ammar docum`, Sep-9 — Sep-11, 60 Items)  
**System:** GENQUANTAA Pharmacy Point of Sale (POS) Billing Application  
**Workspace:** `c:\Users\NavyaSri\OneDrive\Desktop\POS`  

---

## Executive Overview

This document provides a comprehensive functional and architectural specification for the **6 core pharmacy features** recorded in the reference document:

1. **Substitution Model** (Smart Substitution Engine & Generic Recommender)
2. **Dump Stock Intimation** (≤30 Days Expiry Risk Alert)
3. **Expiry Days Left Badge Cart** (Real-Time FEFO Expiry Badging)
4. **Dump Clearance — Near-Expiry & Clearance Gifts** (Flash Discounts & Free Promotional Gifts)
5. **Customer Voice Record & Discussion Notes** (Audio Consultation & Clinical Notes)
6. **Sentiment Analysis — Customer** (Real-Time Customer Sentiment Engine & Counter Prompts)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        GENQUANTAA POS COUNTER ARCHITECTURE                             │
│                                                                                        │
│  [ 🎙️ Voice Recorder & Notes ] ───► [ 🧠 Sentiment Engine ] ──► [ 💬 Counter Scripts ] │
│                │                                                       │               │
│                ▼                                                       ▼               │
│  [ 🛒 Active Cart Table ] ◄─── [ ⚡ Substitution Model ] ◄─── [ 🏷️ Clearance Gifts ]  │
│                ▲                               ▲                       ▲               │
│                │                               │                       │               │
│  [ 📅 Expiry Badges (<30d) ]                   [ 🚨 Dump Stock Intimation ]             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Feature 1: Substitution Model (Smart Substitution Engine)

### 📌 Overview & Purpose
When a doctor prescribes an expensive branded medicine or a medicine currently out of stock, the **Smart Substitution Model** suggests bioequivalent generic alternatives and in-stock brands to protect pharmacy margins, maintain inventory velocity, and deliver substantial savings to patients.

### ⚙️ Core Capabilities & Rules
1. **5-Criteria Ranking Algorithm (`SmartSubstitutionModal.tsx`):**
   - **Near-Expiry Liquidation Priority:** Gives top priority to batches expiring within 30–90 days to minimize inventory dumps.
   - **Price Competitiveness / Affordability:** Ranks lower-priced generic alternatives higher so patients save 15%–60%.
   - **Stock Availability:** Prioritizes molecules with ample local buffer (Optimal stock).
   - **Branded vs Generic Balance:** Recommends verified generic salts matching identical molecule strength.
   - **Clinical Equivalence:** Matches salt composition, strength (e.g. Paracetamol 650mg), and route of administration (Tablet, Syrup, Injection).

2. **One-Click Substitute Swap:**
   - Cashier clicks **`Substitute with This`** to instantly swap the cart item without re-entering quantities or unit conversions.

3. **Visual Lineage Banner in Cart Table (`CartTable.tsx`):**
   - Renders a lineage trace under the item:
     $$\text{Substituted for: } \text{\sout{Original Prescribed Medicine}} \longrightarrow \textbf{New Substitute Alternative}$$
   - Displays real-time patient savings: `🎉 Saved ₹XX.XX!`.

4. **Commercial Highlights:**
   - `⭐ Best Seller Alternative` tag for top-selling substitutes.
   - `🎁 15% Substitute Discount` promotional badge.

### 💻 Codebase References
- Component: [`frontend/src/components/SmartSubstitutionModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/SmartSubstitutionModal.tsx)
- Cart Integration: [`frontend/src/components/CartTable.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartTable.tsx)
- State & Handlers: [`frontend/src/store/posSlice.ts`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/store/posSlice.ts)

---

## 2. Feature 2: Dump Stock Intimation

### 📌 Overview & Purpose
"Dump Stock" refers to medicine batches with **less than 30 days of shelf life remaining**. Unsold dump stock causes direct financial write-offs and hazardous pharmaceutical waste. This feature provides proactive, visual intimations across the POS so staff can clear these batches first.

### ⚙️ Core Capabilities & Rules
1. **Real-Time 30-Day Dump Intimation Alerts:**
   - When a medicine in the cart or search catalog has $\le 30\text{ days}$ left before expiry, an alert badge is rendered:
     `🚨 ≤30 Days Dump (Dump Risk — Dispatch First)`
   - Pulsing visual highlight prevents cashiers from picking newer batches when older ones are available.

2. **Catalog & Search Filter Intimations (`ProductSearch.tsx`):**
   - Dedicated filter tab: `🚨 ≤30 Days Dump (Count)` allowing the pharmacist to view all dump items at a glance.

3. **Inventory Dashboard Expiry Slabs (`InventoryDashboardPage.tsx`):**
   - Top KPI Summary card: `Shelf Expiry Health` highlighting total active Dump Batches.
   - One-click filter to isolate dump items for distributor return or clearance discounting.

### 💻 Codebase References
- Cart Intimation: [`frontend/src/components/CartTable.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartTable.tsx)
- Search Bar Intimation: [`frontend/src/components/ProductSearch.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/ProductSearch.tsx)
- Dashboard Slabs: [`frontend/src/components/InventoryDashboardPage.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/InventoryDashboardPage.tsx)

---

## 3. Feature 3: Expiry Days Left Badge Cart

### 📌 Overview & Purpose
Provides pharmacists with instantaneous visual awareness of the exact shelf life remaining for every single medicine placed in the billing cart, eliminating accidental dispensing of expired or near-expired goods.

### ⚙️ Core Capabilities & Rules
1. **Dynamic 4-Tier Color-Coded Expiry Badges:**
   Every batch row in the cart table computes exact remaining days:
   $$\text{Days Left} = \frac{\text{Expiry Timestamp} - \text{Current Timestamp}}{1000 \times 60 \times 60 \times 24}$$

   | Badge Tier | Condition | Color Styling | Label & Action |
   | :--- | :--- | :--- | :--- |
   | **🔴 Critical / Expired** | $\le 0\text{ days}$ or $<10\text{ days}$ | `bg-rose-100 text-rose-900 border-rose-300` | `🚨 Expired / Critical (<10d)` — Dispense Blocked |
   | **🟠 Dump Stock** | $10\text{ to } 30\text{ days}$ | `bg-orange-100 text-orange-900 border-orange-300` | `⚠️ Dump Risk (XXd Left)` — Fast-Track Clearance |
   | **🟡 Expiry Warning** | $31\text{ to } 90\text{ days}$ | `bg-amber-50 text-amber-800 border-amber-200` | `⏳ XX Days Left` — Regular Monitoring |
   | **🟢 Fresh Stock** | $> 90\text{ days}$ | `bg-emerald-50 text-emerald-800 border-emerald-200` | `✨ XX Days (Fresh Stock)` |

2. **Automated FEFO Batch Selection (`fefoHelper.ts`):**
   - The POS automatically picks the earliest-expiring available batch when an item is added to the cart, complying with the **First-Expiry-First-Out (FEFO)** standard.

### 💻 Codebase References
- Cart Implementation: [`frontend/src/components/CartTable.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/CartTable.tsx)
- FEFO Algorithm: [`frontend/src/utils/fefoHelper.ts`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/utils/fefoHelper.ts)

---

## 4. Feature 4: Dump Clearance — Near-Expiry & Clearance Gifts

### 📌 Overview & Purpose
To prevent total capital write-off on near-expiry batches (≤30 or ≤90 days), pharmacies offer steep price reductions bundled with **complimentary promotional gifts** (worth ₹5–₹30) to incentivize patients to purchase and consume the medicines immediately.

### ⚙️ Core Capabilities & Rules
1. **Tiered Clearance Discounting (`ClearanceGiftModal.tsx`):**
   - Quick-apply discounts: **15%**, **25%**, **35%**, or **50% Flash Clearance**.
   - Auto-applies to invoice line-items with savings shown on both thermal slip and A4 bill.

2. **Promotional Free Gift Catalog:**
   Cashiers can attach a zero-cost complimentary health item:
   - 🧴 **Dettol Instant Hand Sanitizer (50ml)** — Value ₹30
   - 🍊 **Limcee Vitamin C 500mg Chewable (Strip of 5)** — Value ₹25
   - 🩹 **Hansaplast Medicated Bandages (Pack of 5)** — Value ₹20
   - ⚡ **Cipla ORS Pro Hydration Sachet** — Value ₹18
   - 🧼 **Savlon Antiseptic Soap / Wipes** — Value ₹15

3. **Cart Integration & Safety Guardrails:**
   - Free gift line items are marked as `🎁 FREE CLEARANCE GIFT (₹0.00)` on the receipt.
   - Requires patient verbal consent confirming they intend to consume the full course before the stated expiry date.

### 💻 Codebase References
- Modal & Gift Engine: [`frontend/src/components/ClearanceGiftModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/ClearanceGiftModal.tsx)
- Redux Actions: `applyNearExpiryClearanceDiscount`, `addClearanceGiftToCart` in [`frontend/src/store/posSlice.ts`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/store/posSlice.ts)

---

## 5. Feature 5: Customer Voice Record & Discussion Notes

### 📌 Overview & Purpose
Captures verbal counter interactions between pharmacist and patient. This provides legal protection, records custom dosage instructions, and maintains a clinical consultation history accessible across shifts.

### ⚙️ Core Capabilities & Rules
1. **HTML5 Audio Consultation Recorder (`VoiceConsultationModal.tsx`):**
   - Visual waveform indicator and real-time elapsed timer (`00:00`).
   - Quick controls: **Record (🎙️)**, **Pause (⏸️)**, **Stop (⏹️)**, and **Replay (▶️)**.
   - Generates an audio blob attached to the patient's active billing session.

2. **Pharmacist Discussion Notes & Preset Clinical Hashtags:**
   - Free-text discussion notes field capturing patient complaints and instructions.
   - 1-Click clinical quick-tags:
     `#WithFood` · `#BeforeBed` · `#AvoidAlcohol` · `#CompleteCourse` · `#ReportDizziness` · `#BloodSugarLog` · `#DoctorFollowUp` · `#DrinkPlentyWater`

3. **Consultation Categorization:**
   - `CHRONIC_CARE` (Diabetes, BP, Thyroid refills)
   - `DOSAGE_ADMIN` (Special administration timing)
   - `ALLERGY_WARNING` (Contraindication alerts)
   - `OTC_GUIDANCE` (Symptom consultation)
   - `PEDIATRIC_GERIATRIC` (Elderly/infant weight-based dosing)

### 💻 Codebase References
- Voice Modal: [`frontend/src/components/VoiceConsultationModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/VoiceConsultationModal.tsx)
- Navbar Trigger: `Mic` icon with recording badge in [`frontend/src/components/Navbar.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/Navbar.tsx)
- Session Types: `VoiceConsultationRecord` in [`frontend/src/types/pos.ts`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/types/pos.ts)

---

## 6. Feature 6: Sentiment Analysis — Customer

### 📌 Overview & Purpose
Analyzes customer vocal tone, language, and behavioral cues during counter discussions using a weighted Natural Language Processing (NLP) rule engine. It identifies patient emotional state and provides the cashier with immediate, tailored prompts.

### ⚙️ Core Sentiment Profiles & Dynamic Actions (`sentimentEngine.ts`)

| Sentiment Profile | Keyword Indicators | Detected State | Automated POS Action & Counter Prompt |
| :--- | :--- | :--- | :--- |
| **💰 Price-Sensitive** | *expensive, costly, high price, cheaper, discount, out of budget, less tablets* | Customer worried about affordability | - Prompt: *"Offer bioequivalent generic substitute."*<br>- Triggers: 1-click 10%–15% substitute concession banner. |
| **😰 Anxious / Urgent** | *severe, unbearable pain, high fever, bleeding, emergency, terrified, breathless* | Customer in distress or acute pain | - Prompt: *"Prioritize expedited checkout & reassure immediately."*<br>- Suggests first-aid companion item or emergency desk handover. |
| **🤨 Hesitant / Skeptical** | *is it safe, doctor didn't write, works same, quality ok, original, fake* | Doubtful about generic substitutes | - Prompt: *"Read Clinical Bioequivalence script: Identical molecule & CDSCO approved."* |
| **😊 Satisfied / Loyal** | *thank you, good service, very helpful, regularly taking, best pharmacy* | Positive, trusting patient | - Prompt: *"Enroll in Chronic Care refill subscription & loyalty points."* |
| **🩺 Inquisitive / Chronic** | *how to take, morning or night, side effects, empty stomach, interaction* | Patient seeking detailed guidance | - Prompt: *"Print Multilingual PIL Leaflet & send WhatsApp voice guide."* |

### ⚙️ Algorithmic Scoring Formula
$$\text{Category Score} = \sum (\text{Term Frequency} \times \text{Keyword Weight})$$
The dominant category with the highest weighted score generates the real-time **Pharmacist Action Recommendation Prompt** displayed on the billing terminal.

### 💻 Codebase References
- Sentiment Engine: [`frontend/src/utils/sentimentEngine.ts`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/utils/sentimentEngine.ts)
- Modal Integration: [`frontend/src/components/VoiceConsultationModal.tsx`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/components/VoiceConsultationModal.tsx)
- Action Handlers: `applySentimentDiscount`, `setSessionSentiment` in [`frontend/src/store/posSlice.ts`](file:///c:/Users/NavyaSri/OneDrive/Desktop/POS/frontend/src/store/posSlice.ts)

---

## Summary Feature-to-Component Mapping Table

| # | Handwritten Note Item | Primary Component | Secondary Component | Redux Action / Utility | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Substitution Model** | `SmartSubstitutionModal.tsx` | `CartTable.tsx` | `swapCartItemWithSubstitute` | ✅ Operational |
| **2** | **Dump Stock Intimation** | `CartTable.tsx` | `ProductSearch.tsx` | Local Expiry Filter | ✅ Operational |
| **3** | **Expiry Days Left Badge Cart** | `CartTable.tsx` | `fefoHelper.ts` | FEFO Batch Auto-Assign | ✅ Operational |
| **4** | **Dump Clearance & Gifts** | `ClearanceGiftModal.tsx` | `CartTable.tsx` | `addClearanceGiftToCart` | ✅ Operational |
| **5** | **Customer Voice & Notes** | `VoiceConsultationModal.tsx`| `Navbar.tsx` | `saveConsultationRecord` | ✅ Operational |
| **6** | **Sentiment Analysis** | `sentimentEngine.ts` | `VoiceConsultationModal.tsx`| `applySentimentDiscount` | ✅ Operational |
