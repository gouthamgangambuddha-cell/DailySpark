import { Response } from "express";
import { authService } from "./auth.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { AppError } from "../../lib/AppError";
import { AuthenticatedRequest } from "../../middleware/authenticate";
import { env } from "../../config/env";

const REFRESH_COOKIE_NAME = "ds_refresh_token";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth", // refresh/logout only — scoped narrowly for defense in depth
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days, matches JWT_REFRESH_EXPIRES_IN default
};

function deviceMeta(req: AuthenticatedRequest) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(req.body, deviceMeta(req));
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
    res.status(201).json({ success: true, data: { user, accessToken } });
  }),

  login: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body, deviceMeta(req));
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
    res.status(200).json({ success: true, data: { user, accessToken } });
  }),

  googleLogin: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.googleLogin(
      req.body.idToken,
      deviceMeta(req)
    );
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
    res.status(200).json({ success: true, data: { user, accessToken } });
  }),

  refresh: asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) throw AppError.unauthorized("No refresh token provided");

    const { user, accessToken, refreshToken } = await authService.refresh(rawToken, deviceMeta(req));
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
    res.status(200).json({ success: true, data: { user, accessToken } });
  }),

  logout: asyncHandler(async (req, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) await authService.logout(rawToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    res.status(200).json({ success: true, data: { message: "Logged out" } });
  }),

  logoutAll: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await authService.logoutAllDevices(req.user.id);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    res.status(200).json({ success: true, data: { message: "Logged out of all devices" } });
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    await authService.verifyEmail(req.body.token);
    res.status(200).json({ success: true, data: { message: "Email verified successfully" } });
  }),

  resendVerification: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await authService.sendVerificationEmail(req.user.id);
    res.status(200).json({ success: true, data: { message: "Verification email sent" } });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    // Same response whether or not the email exists (enumeration protection)
    res.status(200).json({
      success: true,
      data: { message: "If that email is registered, a reset link has been sent" },
    });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    res.status(200).json({ success: true, data: { message: "Password reset successfully" } });
  }),

  me: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, data: { user } });
  }),
};
