import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './config/db';
import { config } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import billingRoutes from './routes/billing.routes';
import invoiceRoutes from './routes/invoice.routes';
import grnRoutes from './routes/grn.routes';
import returnsRoutes from './routes/returns.routes';
import disposalRoutes from './routes/disposal.routes';
import patientRoutes from './routes/patient.routes';
import supplierRoutes from './routes/supplier.routes';
import reportsRoutes from './routes/reports.routes';
import settingsRoutes from './routes/settings.routes';
import drugInteractionRoutes from './routes/drugInteraction.routes';

const app = express();
const httpServer = createServer(app);

// ── Socket.IO (Real-Time Stock Updates) ────────────────────────────────────────
export const io = new SocketIOServer(httpServer, {
  cors: { origin: config.clientUrl, methods: ['GET', 'POST'] },
});
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 Socket disconnected: ${socket.id}`));
});

// ── Global Middlewares ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/grn', grnRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/disposal', disposalRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/drug-interactions', drugInteractionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Genquantaa Pharmacy API is running 🚀', timestamp: new Date().toISOString() });
});

// ── Error Handlers ──────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  httpServer.listen(config.port, () => {
    console.log(`\n🏥 Genquantaa Pharmacy Backend`);
    console.log(`🚀 Server running on http://localhost:${config.port}`);
    console.log(`📦 Environment: ${config.nodeEnv}`);
    console.log(`\n📋 Available API Routes:`);
    console.log(`   /api/auth           → Authentication & PIN Verification`);
    console.log(`   /api/products       → Inventory & Barcode Lookup`);
    console.log(`   /api/billing        → Drug Interactions, Substitution, Hold Bills`);
    console.log(`   /api/invoices       → Finalize Bill, Invoice History`);
    console.log(`   /api/grn            → Purchase & Goods Received Notes`);
    console.log(`   /api/returns        → Returns & Credit Notes`);
    console.log(`   /api/disposal       → Expired Stock Disposal`);
    console.log(`   /api/patients       → Patient Records & History`);
    console.log(`   /api/suppliers      → Supplier Directory`);
    console.log(`   /api/reports        → Sales, GST, Dashboard Analytics`);
    console.log(`   /api/settings       → Store Configuration & Secure PINs`);
    console.log(`   /api/drug-interactions → Drug Interaction Rules\n`);
  });
};

start().catch((err) => { console.error('Failed to start server:', err); process.exit(1); });
