import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { AppError } from "../lib/AppError";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: "USER" | "ADMIN" };
}

/** Requires a valid Bearer access token. Attaches req.user. */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing or invalid Authorization header"));
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized("Access token is invalid or expired"));
  }
}

/** Restricts a route to specific roles. Use after `authenticate`. */
export function requireRole(...roles: Array<"USER" | "ADMIN">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(AppError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}

/**
 * Populates req.user if a valid Bearer token is present, but never rejects
 * the request if it's missing or invalid. Used on public routes that still
 * want to personalize the response for a logged-in viewer (e.g. "isLiked").
 */
export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // Invalid/expired token on a public route — proceed as an anonymous viewer.
  }
  next();
}
