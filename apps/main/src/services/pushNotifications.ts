import { requestFCMToken, onForegroundMessage } from "./firebaseConfig";
import { supabase } from "./supabaseClient";

// Subscribe user to push notifications
export const subscribeToPushNotifications = async (
  userId: string
): Promise<boolean> => {
  try {
    const token = await requestFCMToken();
    if (!token) {
      return false;
    }

    // Store the token in Supabase for this user
    const { error } = await supabase.from("user_fcm_tokens").upsert({
      user_id: userId,
      fcm_token: token,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing FCM token:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return false;
  }
};

// Unsubscribe user from push notifications
export const unsubscribeFromPushNotifications = async (
  userId: string
): Promise<boolean> => {
  try {
    // Remove the token from Supabase
    const { error } = await supabase
      .from("user_fcm_tokens")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing FCM token:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return false;
  }
};

// Request notification permissions and subscribe
export const requestNotificationPermission = async (
  userId: string
): Promise<boolean> => {
  if (!userId) {
    return false;
  }

  try {
    // Check if notification permissions are already granted
    if (Notification.permission === "granted") {
      return await subscribeToPushNotifications(userId);
    } else if (Notification.permission !== "denied") {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        return await subscribeToPushNotifications(userId);
      }
    }
    return false;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

// Handle incoming foreground messages
export const handleForegroundMessages = () => {
  onForegroundMessage().then((payload) => {
    showNotification(payload as NotificationPayload);
  });
};

// Show a notification when the app is in the foreground
const showNotification = (payload: NotificationPayload) => {
  const { notification } = payload;
  if (notification) {
    // Create a notification that appears even when the app is in the foreground
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: payload.messageId,
    });
  }
};

// Types for notification payloads
export interface NotificationPayload {
  notification: {
    title: string;
    body: string;
    icon?: string;
  };
  data?: {
    [key: string]: string;
  };
  messageId: string;
}
