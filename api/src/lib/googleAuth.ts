import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { AppError } from "./AppError";

let client: OAuth2Client | null = null;

function getClient() {
  if (!env.GOOGLE_CLIENT_ID) {
    throw AppError.badRequest("Google sign-in is not configured on this server");
  }
  if (!client) {
    client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  return client;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl: string | null;
}

/** Verifies a Google ID token (from Google Identity Services on the frontend) and extracts the profile. */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const oauthClient = getClient();

  let ticket;
  try {
    ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw AppError.unauthorized("Invalid Google credential");
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw AppError.unauthorized("Google credential is missing required fields");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified ?? false,
    name: payload.name ?? payload.email.split("@")[0],
    avatarUrl: payload.picture ?? null,
  };
}
