import { Response, Router } from "express";
import { z } from "zod";
import { notificationsService } from "./notifications.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { AppError } from "../../lib/AppError";
import { authenticate, AuthenticatedRequest } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";

const deviceTokenSchema = z.object({
  body: z.object({
    token: z.string().trim().min(10),
    platform: z.enum(["WEB", "IOS", "ANDROID"]).default("WEB"),
  }),
});

const unregisterDeviceTokenSchema = z.object({
  body: z.object({
    token: z.string().trim().min(10),
  }),
});

const notificationsController = {
  list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await notificationsService.list(req.user.id, page, limit);
    res.status(200).json({ success: true, data: result });
  }),

  markRead: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await notificationsService.markRead(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: { message: "Marked as read" } });
  }),

  markAllRead: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await notificationsService.markAllRead(req.user.id);
    res.status(200).json({ success: true, data: { message: "All marked as read" } });
  }),

  registerDeviceToken: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await notificationsService.registerDeviceToken(req.user.id, req.body.token, req.body.platform);
    res.status(200).json({ success: true, data: { message: "Device registered for push" } });
  }),

  unregisterDeviceToken: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await notificationsService.unregisterDeviceToken(req.body.token);
    res.status(200).json({ success: true, data: { message: "Device unregistered" } });
  }),
};

export const notificationsRoutes = Router();
notificationsRoutes.use(authenticate);
notificationsRoutes.get("/", notificationsController.list);
notificationsRoutes.post("/:id/read", notificationsController.markRead);
notificationsRoutes.post("/read-all", notificationsController.markAllRead);
notificationsRoutes.post(
  "/device-token",
  validate(deviceTokenSchema),
  notificationsController.registerDeviceToken
);
notificationsRoutes.delete(
  "/device-token",
  validate(unregisterDeviceTokenSchema),
  notificationsController.unregisterDeviceToken
);
