import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey:
    (globalThis as any).process?.env?.VITE_FIREBASE_API_KEY ||
    "AIzaSyDummyApiKey",
  authDomain:
    (globalThis as any).process?.env?.VITE_FIREBASE_AUTH_DOMAIN ||
    "yalla-wasel.firebaseapp.com",
  projectId:
    (globalThis as any).process?.env?.VITE_FIREBASE_PROJECT_ID || "yalla-wasel",
  storageBucket:
    (globalThis as any).process?.env?.VITE_FIREBASE_STORAGE_BUCKET ||
    "yalla-wasel.appspot.com",
  messagingSenderId:
    (globalThis as any).process?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "123456789",
  appId:
    (globalThis as any).process?.env?.VITE_FIREBASE_APP_ID ||
    "1:123456789:web:abcdef",
  measurementId:
    (globalThis as any).process?.env?.VITE_FIREBASE_MEASUREMENT_ID ||
    "G-XXXXXXXXXX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Function to request notification permission and get token
export const requestFCMToken = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Get registration token. Initially this makes a network call, once retrieved
      // subsequent calls to getToken will return from cache.
      const token = await getToken(messaging, {
        vapidKey:
          (globalThis as any).process?.env?.VITE_FIREBASE_VAPID_KEY ||
          "BDummyVapidKeyThatIsExactlyThirtyTwoCharactersLong",
      });
      return token;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

// Handle incoming messages when app is in foreground
export const onForegroundMessage = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message received: ", payload);
      resolve(payload);
    });
  });
};
