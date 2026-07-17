import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { authLimiter } from "../../middleware/rateLimiter";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  googleLoginSchema,
} from "./auth.validators";

export const authRoutes = Router();

authRoutes.post("/register", authLimiter, validate(registerSchema), authController.register);
authRoutes.post("/login", authLimiter, validate(loginSchema), authController.login);
authRoutes.post(
  "/google",
  authLimiter,
  validate(googleLoginSchema),
  authController.googleLogin
);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);
authRoutes.post("/logout-all", authenticate, authController.logoutAll);

authRoutes.post(
  "/verify-email",
  authLimiter,
  validate(verifyEmailSchema),
  authController.verifyEmail
);
authRoutes.post("/resend-verification", authenticate, authController.resendVerification);

authRoutes.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
authRoutes.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

authRoutes.get("/me", authenticate, authController.me);
