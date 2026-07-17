import { Response, Router } from "express";
import { z } from "zod";
import { paymentsService } from "./payments.service";
import { constructWebhookEvent } from "../../lib/stripe";
import { asyncHandler } from "../../middleware/errorHandler";
import { AppError } from "../../lib/AppError";
import { authenticate, AuthenticatedRequest } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { logger } from "../../lib/logger";

const checkoutSchema = z.object({
  body: z.object({ interval: z.enum(["monthly", "yearly"]) }),
});

const paymentsController = {
  createCheckoutSession: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const url = await paymentsService.createCheckoutSession(req.user.id, req.body.interval);
    res.status(200).json({ success: true, data: { url } });
  }),

  createPortalSession: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const url = await paymentsService.createPortalSession(req.user.id);
    res.status(200).json({ success: true, data: { url } });
  }),

  getSubscription: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const subscription = await paymentsService.getSubscription(req.user.id);
    res.status(200).json({ success: true, data: { subscription } });
  }),
};

// Mounted at /api/payments (regular JSON body parsing applies)
export const paymentsRoutes = Router();
paymentsRoutes.use(authenticate);
paymentsRoutes.post(
  "/create-checkout-session",
  validate(checkoutSchema),
  paymentsController.createCheckoutSession
);
paymentsRoutes.post("/create-portal-session", paymentsController.createPortalSession);
paymentsRoutes.get("/subscription", paymentsController.getSubscription);

/**
 * Mounted separately in app.ts, BEFORE express.json(), with express.raw()
 * instead — Stripe's webhook signature verification requires the exact raw
 * request bytes, which JSON-parsing would have already mutated.
 */
export const paymentsWebhookRouter = Router();
paymentsWebhookRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature || typeof signature !== "string") {
      throw AppError.badRequest("Missing Stripe signature header");
    }

    let event;
    try {
      event = constructWebhookEvent(req.body, signature);
    } catch (err) {
      logger.warn("Stripe webhook signature verification failed", { error: String(err) });
      throw AppError.badRequest("Invalid webhook signature");
    }

    await paymentsService.handleWebhookEvent(event);
    res.status(200).json({ received: true });
  })
);
