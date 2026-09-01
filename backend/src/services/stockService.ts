import mongoose from 'mongoose';
import { Product } from '../models/Product';

/**
 * Recomputes totalStock and stockStatus for a product
 * and saves it atomically.
 */
export async function recomputeStock(
  productId: mongoose.Types.ObjectId | string,
  session?: mongoose.ClientSession
): Promise<void> {
  const opts = session ? { session } : {};
  const prod = await Product.findById(productId).session(session || null);
  if (!prod) return;

  prod.totalStock = prod.batches.reduce((sum, b) => sum + b.stockQuantity, 0);
  prod.stockStatus =
    prod.totalStock > 20 ? 'IN_STOCK' : prod.totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';

  await prod.save(opts);
}

/**
 * Deduct stock from a product batch when a sale is made.
 * Uses a MongoDB transaction session for atomicity.
 */
export async function deductStock(
  productId: string,
  batchNumber: string,
  quantity: number,
  session: mongoose.ClientSession
): Promise<void> {
  const prod = await Product.findById(productId).session(session);
  if (!prod) throw new Error(`Product not found: ${productId}`);

  const batch = prod.batches.find((b) => b.batchNumber === batchNumber);
  if (!batch) throw new Error(`Batch not found: ${batchNumber} in product ${prod.name}`);

  // Hard block: check expiry
  if (new Date(batch.expiryDate) <= new Date()) {
    throw new Error(
      `HARD BLOCK: Batch ${batchNumber} has EXPIRED (${batch.expiryDate}). Sale rejected.`
    );
  }

  if (batch.stockQuantity < quantity) {
    throw new Error(
      `Insufficient stock for ${prod.name} (Batch: ${batchNumber}). Available: ${batch.stockQuantity}, Requested: ${quantity}`
    );
  }

  batch.stockQuantity -= quantity;
  prod.totalStock = prod.batches.reduce((sum, b) => sum + b.stockQuantity, 0);
  prod.stockStatus =
    prod.totalStock > 20 ? 'IN_STOCK' : prod.totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';

  await prod.save({ session });
}

/**
 * Add stock to a product batch (GRN receive).
 */
export async function addStock(
  productId: string,
  batchNumber: string,
  expiryDate: Date,
  quantity: number,
  mrp: number,
  sellingPrice: number,
  location: string = 'Rack Main',
  session: mongoose.ClientSession
): Promise<void> {
  const prod = await Product.findById(productId).session(session);
  if (!prod) throw new Error(`Product not found: ${productId}`);

  const existingBatch = prod.batches.find((b) => b.batchNumber === batchNumber);
  if (existingBatch) {
    existingBatch.stockQuantity += quantity;
    existingBatch.mrp = mrp;
  } else {
    prod.batches.push({ batchNumber, expiryDate, stockQuantity: quantity, location, mrp });
  }

  prod.sellingPrice = sellingPrice;
  prod.unitMRP = mrp;
  prod.totalStock = prod.batches.reduce((sum, b) => sum + b.stockQuantity, 0);
  prod.stockStatus =
    prod.totalStock > 20 ? 'IN_STOCK' : prod.totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';

  await prod.save({ session });
}

/**
 * Restock a returned item.
 */
export async function restockItem(
  productId: string,
  batchNumber: string,
  quantity: number,
  session: mongoose.ClientSession
): Promise<void> {
  const prod = await Product.findById(productId).session(session);
  if (!prod) return;

  const batch = prod.batches.find((b) => b.batchNumber === batchNumber);
  if (batch) {
    batch.stockQuantity += quantity;
  } else if (prod.batches.length > 0) {
    prod.batches[0].stockQuantity += quantity;
  }

  prod.totalStock = prod.batches.reduce((sum, b) => sum + b.stockQuantity, 0);
  prod.stockStatus =
    prod.totalStock > 20 ? 'IN_STOCK' : prod.totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';

  await prod.save({ session });
}

/**
 * Dispose stock (expired/damaged/recalled).
 */
export async function disposeStock(
  productId: string,
  batchNumber: string,
  quantity: number,
  session: mongoose.ClientSession
): Promise<void> {
  const prod = await Product.findById(productId).session(session);
  if (!prod) return;

  const batch = prod.batches.find((b) => b.batchNumber === batchNumber);
  if (batch) {
    batch.stockQuantity = Math.max(0, batch.stockQuantity - quantity);
  }

  prod.totalStock = prod.batches.reduce((sum, b) => sum + b.stockQuantity, 0);
  prod.stockStatus =
    prod.totalStock > 20 ? 'IN_STOCK' : prod.totalStock > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK';

  await prod.save({ session });
}
