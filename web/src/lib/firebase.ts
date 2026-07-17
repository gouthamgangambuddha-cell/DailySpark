import { initializeApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, Messaging } from "firebase/messaging";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function isConfigured(): boolean {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  );
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!isConfigured()) return null;
  if (!(await isSupported())) return null;

  if (!app) {
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });
  }
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

export type PushPermissionResult =
  | { status: "unsupported" }
  | { status: "denied" }
  | { status: "granted"; token: string };

/**
 * Requests browser notification permission and retrieves an FCM registration
 * token. Returns "unsupported" if Firebase isn't configured or the browser
 * doesn't support push — callers should treat that the same as
 * "feature not available" rather than an error.
 */
export async function requestPushPermission(): Promise<PushPermissionResult> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return { status: "unsupported" };
  }

  const msg = await getMessagingInstance();
  if (!msg) return { status: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(msg, { vapidKey, serviceWorkerRegistration: registration });
    return { status: "granted", token };
  } catch {
    return { status: "unsupported" };
  }
}
