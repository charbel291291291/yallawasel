// WhatsApp Notification Service
// Triggers WhatsApp redirect for order notifications

export interface OrderNotificationData {
  full_name: string;
  phone: string;
  address: string;
  total_amount: number;
  items: any[];
  order_id: string;
}

export const sendWhatsAppNotification = async (
  orderData: OrderNotificationData
): Promise<void> => {
  try {
    // Format items list
    const itemsList = orderData.items
      .map(
        (item: any) =>
          `${item.quantity}x ${item.name || item.productName || "Item"}`
      )
      .join("\n  • ");

    // Build message
    const message = `🛒 *New Order Received*

━━━━━━━━━━━━━━━━━━━━
📋 *Order #${orderData.order_id.slice(0, 8).toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━

👤 *Customer:* ${orderData.full_name}
📞 *Phone:* ${orderData.phone}
📍 *Address:* ${orderData.address}

🛍️ *Items:*
  • ${itemsList}

💰 *Total:* $${Number(orderData.total_amount).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━
View in Admin Panel for details.

---
Yalla Wasel Admin`;

    // Encode message for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp API URL (using wa.me for direct redirect)
    const whatsappUrl = `https://wa.me/009670126177?text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, "_blank");

    console.log(
      "WhatsApp notification triggered for order:",
      orderData.order_id
    );
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
  }
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
💰 Total: $${Number(orderData.total_amount).toFixed(2)}

We'll notify you when your order is on its way!

---
Yalla Wasel 🧡`;
};
