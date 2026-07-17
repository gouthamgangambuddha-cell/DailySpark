import admin from "firebase-admin";
import { env } from "../config/env";
import { logger } from "./logger";

let app: admin.app.App | null = null;

function getApp(): admin.app.App | null {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null;
  }
  if (!app) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  return app;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Sends a push notification to one or more FCM device tokens. Best-effort:
 * never throws, since a failed push should never break the in-app flow that
 * triggered it (e.g. a comment reply). Returns tokens that were invalid or
 * expired, so the caller can prune them from the database.
 */
export async function sendPushNotification(
  tokens: string[],
  payload: PushPayload
): Promise<{ invalidTokens: string[] }> {
  if (tokens.length === 0) return { invalidTokens: [] };

  const firebaseApp = getApp();
  if (!firebaseApp) {
    logger.warn("Firebase not configured — skipping push notification.", { title: payload.title });
    return { invalidTokens: [] };
  }

  try {
    const response = await admin.messaging(firebaseApp).sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      webpush: payload.url ? { fcmOptions: { link: payload.url } } : undefined,
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((r, i) => {
      if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
        invalidTokens.push(tokens[i]);
      }
    });
    return { invalidTokens };
  } catch (err) {
    logger.error("Failed to send push notification", { error: String(err) });
    return { invalidTokens: [] };
  }
}
