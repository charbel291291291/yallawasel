// Firebase dynamic imports to isolate heavy SDKs from the index bundle
const getFirebaseApp = async () => {
  const { initializeApp } = await import("firebase/app");
  return initializeApp(firebaseConfig);
};

const getMessagingLib = async () => {
  return await import("firebase/messaging");
};

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

// Initialize Firebase instance lazily
let appInstance: any = null;
let messagingInstance: any = null;

export const getMessagingInstance = async () => {
  if (typeof window === "undefined") return null;
  if (!messagingInstance) {
    try {
      if (!appInstance) {
        appInstance = await getFirebaseApp();
      }
      const { getMessaging } = await getMessagingLib();
      messagingInstance = getMessaging(appInstance);
    } catch (e) {
      console.warn("Firebase Messaging not supported in this environment", e);
    }
  }
  return messagingInstance;
};

// Function to request notification permission and get token
export const requestFCMToken = async (): Promise<string | null> => {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const { getToken } = await getMessagingLib();
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
export const onForegroundMessage = async (): Promise<any> => {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  const { onMessage } = await getMessagingLib();
  return new Promise((resolve) => {
    onMessage(messaging, (payload: any) => {
      resolve(payload);
    });
  });
};

