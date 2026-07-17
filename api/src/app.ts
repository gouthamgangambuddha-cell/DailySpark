import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { generalLimiter } from "./middleware/rateLimiter";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { lessonsRoutes } from "./modules/lessons/lessons.routes";
import { lessonQuizRoutes, quizzesRoutes } from "./modules/quizzes/quizzes.routes";
import { gamificationRoutes } from "./modules/gamification/gamification.routes";
import { lessonCommentsRoutes, commentsRoutes } from "./modules/comments/comments.routes";
import { userSocialRoutes, socialRoutes } from "./modules/social/social.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { aiRoutes } from "./modules/ai/ai.routes";
import { paymentsRoutes, paymentsWebhookRouter } from "./modules/payments/payments.routes";
import { adminRoutes } from "./modules/admin/admin.routes";
import { seoRoutes } from "./modules/seo/seo.routes";

export function createApp() {
  const app = express();

  // --- Security ---
  app.use(
    helmet({
      // This is a pure JSON API (no HTML views), so a strict default-src
      // CSP is safe and doesn't need the usual script/style-src allowances
      // a server-rendered app would require.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "same-site" },
    })
  );
  app.use(compression());
  app.use(
    cors({
      origin: env.WEB_URL,
      credentials: true, // allow httpOnly refresh-token cookie
    })
  );
  app.use(generalLimiter);

  // --- Stripe webhook: MUST be mounted before express.json() below, since
  // Stripe's signature verification needs the exact raw request bytes. ---
  app.use("/api/payments/webhook", express.raw({ type: "application/json" }), paymentsWebhookRouter);

  // --- Parsers ---
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // --- Logging ---
  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  }

  // --- Health check ---
  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  // --- Feature routes mount here, one at a time as each module is built ---
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userSocialRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/lessons/:lessonId/quiz", lessonQuizRoutes);
  app.use("/api/lessons/:lessonId/comments", lessonCommentsRoutes);
  app.use("/api/lessons", lessonsRoutes);
  app.use("/api/quizzes", quizzesRoutes);
  app.use("/api/comments", commentsRoutes);
  app.use("/api/gamification", gamificationRoutes);
  app.use("/api/social", socialRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/payments", paymentsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use(seoRoutes);

  // --- 404 + error handling (must be last) ---
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
