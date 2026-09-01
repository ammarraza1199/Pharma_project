# Genquantaa Pharmacy POS System

A comprehensive Pharmacy POS (Point of Sale) system built with the MERN stack (MongoDB, Express, React, Node.js). It includes features like stock management, GST calculation, sequential invoice generation, schedule drug compliance (H, H1, X), returns, disposals, and detailed reporting.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **MongoDB** (Local instance running on `localhost:27017`, or a MongoDB Atlas URI)
- **Git** (optional, for version control)

---

## 1. Backend Setup (API & Database)

The backend is built with Node.js, Express, and TypeScript.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   A `.env` file should already be present in the `backend` folder. If not, create one with the following variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/genquantaa_pharmacy
   JWT_SECRET=genquantaa_super_secret_jwt_key_2026
   JWT_EXPIRES_IN=8h
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   ```

4. **Start the backend development server:**
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000`. On first run, it will automatically connect to MongoDB and seed the database with default store settings and drug interactions.*

---

## 2. Frontend Setup (User Interface)

The frontend is built with React, Vite, TypeScript, and TailwindCSS.

1. **Open a new terminal window** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173`.*

---

## 3. Important Default Credentials

The backend automatically creates default store settings upon its first startup. Here are the default PINs needed for authorization inside the app (like overriding Schedule X sales or handling stock disposals):

- **Manager PIN:** `1234`
- **Owner PIN:** `1234`

*(These can be updated later from the Settings page in the application).*

---

## Project Structure

```text
Pharma_project/
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── config/         # DB & Env configurations
│   │   ├── middleware/     # Auth & Error handling
│   │   ├── models/         # Mongoose Schemas (11 collections)
│   │   ├── routes/         # API Endpoints
│   │   └── services/       # Core business logic (Stock, GST, Interactions)
│   └── package.json
└── frontend/               # React + Vite UI
    ├── src/
    │   ├── components/     # React Components & Pages
    │   ├── store/          # Redux State Management
    │   ├── types/          # TypeScript definitions
    │   └── utils/          # Helper functions (GST calc, Number to Words)
    └── package.json
```

## Troubleshooting

- **MongoDB Connection Error:** Make sure your local MongoDB server is running. If you are using Windows, you can start it from the Services app (look for "MongoDB Server").
- **Port already in use:** If port 5000 or 5173 is busy, change the `PORT` in backend `.env` or run vite with a different port.
# Genquantaa Pharmacy Billing — Current Findings

> Analysis as of 2026-08-25. Build: ✅ Compiles clean (0 TS errors).

---

## What Has Improved Since Last Analysis

The previous analysis (from the earlier session) stated **"Frontend to Backend integration = 0%"**.
That is **no longer accurate**. Several components have been partially wired:

| Component | API Calls Wired |
|---|---|
| `AuthPage.tsx` | ✅ Login, Register, Forgot Password, Reset Password |
| `Dashboard.tsx` | ✅ `GET /reports/dashboard-stats` on mount |
| `InventoryPage.tsx` | ✅ Fetch products, fetch low-stock, add product, edit product |
| `InvoicesPage.tsx` | ✅ Paginated fetch with filters |
| `HeldBillsModal.tsx` | ✅ Load, delete, restore held bills via API |
| `TabBar.tsx` | ✅ Hold active bill to server, sync held bill count |

**Updated integration estimate: ~30–35% wired** (up from 0%).

---

## 🔴 Critical Issues (Fix These First)

### 1. Plaintext PINs Still in Redux State
Manager PIN and Owner PIN are stored and compared **client-side in Redux**:
- `ExpiryManagementPage.tsx` — compares Manager PIN against `state.settings.managerPin` (plaintext string)
- `SettingsPage.tsx` — PIN change form reads current PIN from Redux
- **Risk:** Anyone who opens Redux DevTools can see the PIN. Any `console.log(state)` leaks it.
- **Fix:** Remove all PIN values from Redux. Send PINs directly to `POST /api/auth/verify-manager-pin` or `PUT /api/settings/pins` for bcrypt server-side compare only.

### 2. JWT Token Stored in `localStorage` — XSS Vulnerable
`api.ts` reads the JWT from `localStorage.getItem('token')`.
- If any third-party script or XSS attack runs, the token can be stolen.
- **Fix:** Move to `httpOnly` cookie (preferred) or at minimum `sessionStorage` with `sameSite: strict`.

### 3. `requireRole` Middleware Not Applied to Any Backend Route
The backend has a working `requireRole('MANAGER', 'OWNER')` middleware, but **no route uses it**. Any logged-in pharmacist can currently:
- Delete invoices
- Process disposals
- Change settings
- Export CSVs

---

## 🟡 Significant Gaps Still Remaining

### Billing Finalization — Not Connected to Backend
`PaymentModal.tsx` still fires `finalizeBillSuccess` as a **local Redux action only**. No `POST /api/invoices` call is made. This means:
- Invoice numbers are generated client-side (not sequential from server)
- Stock is deducted only in local Redux memory (lost on refresh)
- Invoices are saved to `localStorage` only (not DB)
- Patient auto-upsert doesn't happen

> This is the **most important missing connection**. Everything else flows from billing.

### Product Search in POS — Still Using Mock Data
`ProductSearch.tsx` reads from `MOCK_PRODUCTS` in Redux. The `InventoryPage` is wired to the API but the **POS terminal search is not**. Selling products from stale local mock data means:
- Stock counts are wrong
- New products added in Inventory don't appear in POS
- Barcode scan is not wired to `GET /api/products/barcode/:code`

### Real-time Sync — Not Wired
Socket.IO is set up on the backend but **no frontend listeners exist**. Multiple counters cannot see each other's actions in real time.

### Multi-Counter Backend — Missing Entirely
The `PharmacistCounter` concept only exists in the frontend Redux. There is no:
- `GET /api/counters` endpoint
- `PATCH /api/billing/held-bills/:id/assign` to delegate a held bill between real user accounts
- Socket.IO `counter_workload_updated` event

The delegation feature (`AssignBillModal`) only reassigns bills locally in Redux memory.

---

## 🟢 What Is Working Well

| Area | Status |
|---|---|
| TypeScript build | ✅ 0 errors after today's fixes |
| Auth flow (Login/Register/ForgotPassword) | ✅ Fully wired |
| Inventory CRUD | ✅ Wired (Add, Edit, Fetch) |
| Invoice list (read-only) | ✅ Wired with pagination/filters |
| Hold Bill flow | ✅ Persisted to server via TabBar + HeldBillsModal |
| Dashboard stats | ✅ Fetched from real API |
| GST calculation | ✅ Correct (local utility) |
| Schedule H/X compliance | ✅ UI enforced |
| Drug interaction detection | ✅ Local engine in place |
| Smart substitution modal | ✅ Working |
| Receipt printing | ✅ A4 + thermal print views ready |
| FEFO batch helper | ✅ Present in utils (new from git pull) |

---

## 📋 Recommended Priority Order

### 🔥 Do This Week
1. **Wire `PaymentModal` → `POST /api/invoices`** — the core transaction
2. **Wire `ProductSearch` → `GET /api/products`** — so POS uses live stock
3. **Remove plaintext PINs from Redux** — security critical
4. **Apply `requireRole` to backend routes** — delete invoice, disposal, settings

### 🗓 Next Sprint
5. Wire `ReturnsPage` → `POST /api/returns`
6. Wire `PurchaseGRNPage` → `POST /api/grn`
7. Wire `ReportsPage` → all 6 report endpoints
8. Wire `PatientsPage` → patient CRUD API
9. Wire `SuppliersPage` → supplier CRUD API

### 🔮 Future
10. Socket.IO frontend listeners for real-time stock + counter sync
11. Backend counter model + workload routes
12. JWT refresh token flow
13. Batch FIFO fix in stock service (currently deducts by batchNumber, not expiry date order)
14. Razorpay real payment webhook
15. GSTR-1 export

---

## Summary Table

| Dimension | Previous Estimate | Current Estimate |
|---|---|---|
| Frontend UI completeness | ~95% | ~97% (OnlineDelivery added) |
| Backend API completeness | ~75% | ~75% (unchanged) |
| Frontend → Backend integration | 0% | **~35%** |
| RBAC enforcement | ~10% | ~10% (unchanged) |
| Security (plaintext PINs) | CRITICAL | Still CRITICAL |
| Production readiness | ~20% | **~35%** |
