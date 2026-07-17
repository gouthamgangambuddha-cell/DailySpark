import { Response, Router } from "express";
import { socialService } from "./social.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { AppError } from "../../lib/AppError";
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { createReportSchema } from "./social.validators";

const socialController = {
  toggleFollow: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await socialService.toggleFollow(req.user.id, req.params.userId);
    res.status(200).json({ success: true, data: result });
  }),

  getProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await socialService.getPublicProfile(req.params.userId, req.user?.id ?? null);
    res.status(200).json({ success: true, data: { profile } });
  }),

  getFeed: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const items = await socialService.getActivityFeed(req.user.id);
    res.status(200).json({ success: true, data: { items } });
  }),

  createReport: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await socialService.createReport(req.user.id, req.body);
    res.status(201).json({ success: true, data: { message: "Report submitted. Thank you." } });
  }),
};

// Mounted at /api/users (extends the existing users routes with social actions)
export const userSocialRoutes = Router();
userSocialRoutes.post("/:userId/follow", authenticate, socialController.toggleFollow);
userSocialRoutes.get("/:userId/profile", optionalAuthenticate, socialController.getProfile);

// Mounted at /api/social
export const socialRoutes = Router();
socialRoutes.get("/feed", authenticate, socialController.getFeed);
socialRoutes.post("/reports", authenticate, validate(createReportSchema), socialController.createReport);
