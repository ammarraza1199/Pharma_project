/**
 * GST Calculator Service — Indian Pharmaceutical GST-inclusive pricing
 */
export interface GSTBreakdown {
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalGst: number;
  lineTotal: number;
}

export function calculateItemGST(
  unitPrice: number,
  quantity: number,
  discountPercent: number = 0,
  gstRate: number = 12
): GSTBreakdown {
  const grossTotal = unitPrice * quantity;
  const discountAmount = (grossTotal * discountPercent) / 100;
  const netTotal = grossTotal - discountAmount;

  // GST-inclusive: extract tax from MRP
  const taxableAmount = netTotal / (1 + gstRate / 100);
  const totalGst = netTotal - taxableAmount;
  const halfGstRate = gstRate / 2;
  const cgstAmount = totalGst / 2;
  const sgstAmount = totalGst / 2;

  return {
    taxableAmount: Number(taxableAmount.toFixed(2)),
    cgstRate: halfGstRate,
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstRate: halfGstRate,
    sgstAmount: Number(sgstAmount.toFixed(2)),
    totalGst: Number(totalGst.toFixed(2)),
    lineTotal: Number(netTotal.toFixed(2)),
  };
}
