// WhatsApp Notification Service
// Prepares WhatsApp message for order notifications

export interface OrderNotificationData {
  full_name: string;
  phone: string;
  address: string;
  total: number;
  items: any[];
  order_id: string;
  adminPhone?: string;
}

// Build the WhatsApp message
const buildWhatsAppMessage = (orderData: OrderNotificationData): string => {
  const itemsList = orderData.items
    .map(
      (item: any) =>
        `${item.quantity}x ${item.name || item.productName || "Item"}`
    )
    .join("\n  • ");

  return `🛒 *New Order Received*

━━━━━━━━━━━━━━━━━━━━
📋 *Order #${orderData.order_id.slice(0, 8).toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━

👤 *Customer:* ${orderData.full_name}
📞 *Phone:* ${orderData.phone}
📍 *Address:* ${orderData.address}

🛍️ *Items:*
  • ${itemsList}

💰 *Total:* $${Number(orderData.total).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━
View in Admin Panel for details.

---
Yalla Wasel Admin`;
};

// Get formatted WhatsApp URL (ready to open)
export const getWhatsAppUrl = (orderData: OrderNotificationData): string => {
  const adminPhone = orderData.adminPhone || "0096170126177";
  const formattedAdminPhone = formatPhoneForWhatsApp(adminPhone);
  const message = buildWhatsAppMessage(orderData);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedAdminPhone}?text=${encodedMessage}`;
};

// Open WhatsApp with pre-filled message
export const openWhatsAppNotification = (
  orderData: OrderNotificationData
): void => {
  const url = getWhatsAppUrl(orderData);
  window.open(url, "_blank");
  console.log("WhatsApp notification ready for order:", orderData.order_id);
};

// Legacy function - still works but now just prepares URL
export const sendWhatsAppNotification = async (
  orderData: OrderNotificationData
): Promise<void> => {
  openWhatsAppNotification(orderData);
};

// Format phone number for WhatsApp (remove non-digits)
export const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If starts with 0, remove it and add country code
  if (digits.startsWith("0")) {
    return "970" + digits.substring(1);
  }

  // If doesn't start with country code, add it
  if (!digits.startsWith("970")) {
    return "970" + digits;
  }

  return digits;
};

// Generate customer-facing order confirmation message
export const getOrderConfirmationMessage = (
  orderData: OrderNotificationData
): string => {
  return `✅ Order Confirmed!

Thank you for your order, ${orderData.full_name}!

📋 Order #${orderData.order_id.slice(0, 8).toUpperCase()}
💰 Total: $${Number(orderData.total).toFixed(2)}

We'll notify you when your order is on its way!

---
Yalla Wasel 🧡`;
};
