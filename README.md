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

## 3. Important Default Credentials & Sign-In Access (RBAC)

The application implements a 4-tier **Role-Based Access Control (RBAC)** architecture. All accounts below are pre-registered and active in the MongoDB database with the default password: **`password123`**.

### 👥 1. Role-Based Sign-In Accounts

| Role | Role Title | Email Address | Password | Permissions & Key Capabilities |
|---|---|---|---|---|
| **`OWNER`** | Store Owner / Chief | `owner@genquantaa.com` | `password123` | **Full Master Privileges**: Staff management, user activation/deactivation, role promotion/demotion, permanent & soft deletions (products, patients, suppliers, purchase orders), store settings, master Owner PIN (`1234`). |
| **`MANAGER`** | Pharmacy Manager | `manager@genquantaa.com` | `password123` | **Operational Oversight**: Adding/editing products & batches, verifying Goods Receipt Note (GRN) inward shipments, approving stock disposal, modifying store profile & tax rates, deleting invoices, CSV exports, Manager PIN (`1234`). |
| **`PHARMACIST`** | Staff Pharmacist | `jane@healthfirst.com` | `password123` | **Front-Counter Operations**: Standard POS billing, drug & barcode search, FEFO batch selection, parking/holding bills, repeat chronic refills, customer convince cards, multilingual PIL generation, returns intake. |
| **`EMERGENCY_DESK`** | Emergency Specialist | `emergency@genquantaa.com` | `password123` | **Rapid Response Billing**: Dedicated emergency kit billing (Snake Bite, Cardiac Arrest, Acute Asthma, Severe Burns), fast-track emergency invoice generation, priority stock allocation, 108 ambulance dispatch linkage. |

---

### 🛡️ 2. Fallback / Offline Seed Account
In-memory administrator configured as fallback when running without MongoDB connection:

| Field | Credential |
|---|---|
| **Email** | `admin@genquantaa.com` |
| **Password** | `1234` |
| **Pharmacist Name** | Ramesh Kumar (Lead Pharmacist) |
| **Pharmacy Name** | GENQUANTAA MedPlus Pharmacy |
| **Role** | `PHARMACIST` |

---

### 🚨 3. Emergency Desk Direct Sign-In Mode
On the **Sign In** screen, enter your credentials and select the **🚨 Dr. S. Reddy (Chief Emergency)** workstation card at the bottom of the counter list. This automatically routes directly into the **Emergency Delivery Desk** terminal with pre-approved emergency inventory dispensing.

---

### 🔐 4. Manager & Owner Security PINs
Default cryptographic PINs required for high-privilege in-app authorization (Schedule H/X compliance gates, hazardous stock disposal, master security overrides):

- **Manager PIN:** `1234`
- **Owner PIN:** `1234`

*(These can be re-configured anytime by an Owner or Manager from **Settings → Security & Authorization**).*

---

## Project Structure

```text
Pharma_project/
├── backend/                # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/         # DB & Env configurations
│   │   ├── middleware/     # Auth, RBAC & Error handling
│   │   ├── models/         # Mongoose Schemas (Products, Invoices, DeliveryOrders, POs, Consultations, etc.)
│   │   ├── routes/         # API Endpoints (Auth, Products, Billing, GRN, Returns, Delivery, etc.)
│   │   └── services/       # Core business logic (Stock, GST, Drug Interactions)
│   └── package.json
└── frontend/               # React + Vite + TypeScript + TailwindCSS UI
    ├── src/
    │   ├── components/     # React Components (POS, Invoices, Delivery, Patients, Purchase Orders, etc.)
    │   ├── store/          # Redux State Management (posSlice, store config)
    │   ├── types/          # TypeScript Domain Definitions
    │   └── utils/          # Helper functions (API Axios client, WhatsApp Share, GST Engine)
    └── package.json
```

## Troubleshooting

- **MongoDB Connection Error:** Make sure your local MongoDB server is running. If you are using Windows, you can start it from the Services app (look for "MongoDB Server").
- **Port already in use:** If port 5000 or 5173 is busy, change the `PORT` in backend `.env` or run vite with a different port.
