import type { FinalizedInvoice, DeliveryOrder } from '../types/pos';

/**
 * Format a 10-digit or international phone number for WhatsApp wa.me links
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // If 10 digits (India standard), prepend country code 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  // If starts with 0 and has 11 digits
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Generate formatted WhatsApp message text for a FinalizedInvoice
 */
export function generateInvoiceWhatsAppText(invoice: FinalizedInvoice): string {
  const store = invoice.storeInfo || {
    name: 'GENQUANTAA MEDPLUS PHARMACY',
    address: 'Plot 42, Tech City, Hyderabad',
    phone: '+91 98765 43210'
  };

  const patientName = invoice.billingSession?.patientDetails?.patientName || 'Customer';
  const items = invoice.billingSession?.items || [];
  
  let text = `🏥 *${store.name.toUpperCase()}*\n`;
  text += `📍 ${store.address}\n`;
  text += `📞 Support: ${store.phone}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🧾 *TAX INVOICE / E-BILL*\n`;
  text += `*Invoice No:* ${invoice.invoiceNumber}\n`;
  text += `*Date:* ${invoice.invoiceDate}\n`;
  text += `*Customer:* ${patientName}\n`;
  
  const phone = invoice.billingSession?.patientDetails?.phone;
  if (phone) {
    text += `*Phone:* ${phone}\n`;
  }
  
  const doctor = invoice.billingSession?.doctorDetails?.doctorName;
  if (doctor) {
    text += `*Doctor:* Dr. ${doctor}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💊 *MEDICINES / ITEMS ORDERED:*\n`;

  items.forEach((item, index) => {
    const isLoose = (item.unitMode || 'PACK') === 'LOOSE';
    const unitLabel = isLoose ? 'tab(s)' : 'pack(s)';
    text += `${index + 1}. *${item.product?.name || item.productId}*\n`;
    text += `   Qty: ${item.quantity} ${unitLabel} × ₹${item.unitPrice.toFixed(2)} = ₹${item.lineTotal.toFixed(2)}\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*Subtotal:* ₹${invoice.subtotal.toFixed(2)}\n`;
  if (invoice.totalDiscount > 0) {
    text += `*Discount Applied:* -₹${invoice.totalDiscount.toFixed(2)}\n`;
  }
  text += `*GST (CGST+SGST):* ₹${(invoice.totalCGST + invoice.totalSGST).toFixed(2)}\n`;
  text += `*TOTAL AMOUNT PAID:* ₹${invoice.grandTotal.toFixed(2)}\n`;
  text += `*Payment Mode:* ${invoice.payment?.method || 'PAID'} (SUCCESS ✅)\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `✨ *Thank you for choosing ${store.name}!* \n`;
  text += `Get well soon! For queries or refills, call: ${store.phone}`;

  return text;
}

/**
 * Generate formatted WhatsApp message text for a DeliveryOrder
 */
export function generateDeliveryOrderWhatsAppText(order: DeliveryOrder): string {
  const isPickup = order.deliveryMode === 'STORE_PICKUP';
  const orderTitle = isPickup ? '🏬 STORE PICKUP ORDER' : '🛵 HOME DELIVERY ORDER';

  let text = `🏥 *GENQUANTAA MEDPLUS PHARMACY*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📦 *${orderTitle} CONFIRMATION*\n`;
  text += `*Order No:* ${order.orderNumber}\n`;
  text += `*Customer:* ${order.customerName}\n`;
  text += `*Phone:* ${order.customerPhone}\n`;

  if (!isPickup && order.deliveryAddress) {
    text += `*Delivery Address:* ${order.deliveryAddress}\n`;
  }
  if (isPickup && order.pickupCounter) {
    text += `*Pickup Counter:* ${order.pickupCounter}\n`;
  }
  if (order.timeSlot) {
    text += `*Scheduled Time:* ${order.timeSlot}\n`;
  }
  if (order.invoiceNumber) {
    text += `*Invoice No:* ${order.invoiceNumber}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💊 *ORDER ITEMS:*\n`;
  order.items.forEach((item, index) => {
    text += `${index + 1}. *${item.productName}*\n`;
    text += `   Qty: ${item.quantity} × ₹${item.unitPrice.toFixed(2)} = ₹${item.lineTotal.toFixed(2)}\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*Grand Total:* ₹${order.totalAmount.toFixed(2)}\n`;
  text += `*Order Status:* ${order.status} (${isPickup ? 'Ready for Pickup' : 'Dispatched for Delivery'})\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🛵 Your medicines are handled with strict pharmacy safety & hygiene protocols.\n`;
  text += `For fast assistance, contact our pharmacy helpdesk: +91 98765 43210`;

  return text;
}

/**
 * Open WhatsApp Web / App with pre-filled message for an invoice
 */
export function shareInvoiceViaWhatsApp(invoice: FinalizedInvoice, targetPhone?: string): void {
  const phone = targetPhone || invoice.billingSession?.patientDetails?.phone || '9876543210';
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const message = generateInvoiceWhatsAppText(invoice);
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Open WhatsApp Web / App with pre-filled message for a delivery order
 */
export function shareDeliveryOrderViaWhatsApp(order: DeliveryOrder): void {
  const cleanPhone = formatPhoneForWhatsApp(order.customerPhone);
  const message = generateDeliveryOrderWhatsAppText(order);
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
