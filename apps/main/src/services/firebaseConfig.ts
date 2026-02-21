import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, MessagePayload } from "firebase/messaging";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey:
    import.meta.env['VITE_FIREBASE_API_KEY'] as string ||
    "AIzaSyDummyApiKey",
  authDomain:
    import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] as string ||
    "yalla-wasel.firebaseapp.com",
  projectId:
    import.meta.env['VITE_FIREBASE_PROJECT_ID'] as string || "yalla-wasel",
  storageBucket:
    import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] as string ||
    "yalla-wasel.appspot.com",
  messagingSenderId:
    import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] as string ||
    "123456789",
  appId:
    import.meta.env['VITE_FIREBASE_APP_ID'] as string ||
    "1:123456789:web:abcdef",
  measurementId:
    import.meta.env['VITE_FIREBASE_MEASUREMENT_ID'] as string ||
    "G-XXXXXXXXXX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let messagingInstance: any = null;

export const getMessagingInstance = () => {
  if (typeof window === "undefined") return null;
  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
    } catch (e) {
      console.warn("Firebase Messaging not supported in this environment", e);
    }
  }
  return messagingInstance;
};


// Function to request notification permission and get token
export const requestFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          import.meta.env['VITE_FIREBASE_VAPID_KEY'] as string ||
          "BDummyVapidKeyThatIsExactlyThirtyTwoCharactersLong",
      });
      return token;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

// Handle incoming messages when app is in foreground
export const onForegroundMessage = (): Promise<MessagePayload> => {
  return new Promise((resolve) => {
    const messaging = getMessagingInstance();
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

