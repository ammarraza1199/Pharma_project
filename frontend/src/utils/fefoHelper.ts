import type { BatchInfo } from '../types/pos';

/**
 * Sorts batches by expiry date in ascending order (Earliest Expiring First - FEFO).
 */
export function getSortedBatchesFEFO(batches: BatchInfo[]): BatchInfo[] {
  if (!batches || batches.length === 0) return [];
  return [...batches].sort((a, b) => {
    const aTime = new Date(a.expiryDate).getTime();
    const bTime = new Date(b.expiryDate).getTime();
    return aTime - bTime;
  });
}

/**
 * Automatically selects the earliest expiring valid batch (with stock > 0 and not expired).
 * Follows the pharmacy FEFO (First-Expiry-First-Out) rule.
 */
export function getEarliestExpiringBatch(batches: BatchInfo[]): BatchInfo | undefined {
  if (!batches || batches.length === 0) return undefined;

  const sorted = getSortedBatchesFEFO(batches);
  const now = new Date();

  // 1. First priority: Non-expired batch with available stock > 0
  const firstValidInStock = sorted.find(b => new Date(b.expiryDate) > now && b.stockQuantity > 0);
  if (firstValidInStock) return firstValidInStock;

  // 2. Second priority: Non-expired batch (even if 0 stock)
  const firstValid = sorted.find(b => new Date(b.expiryDate) > now);
  if (firstValid) return firstValid;

  // 3. Fallback to the first batch
  return sorted[0];
}
