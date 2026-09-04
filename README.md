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
