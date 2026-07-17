import { Response } from "express";
import { usersService } from "./users.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { AppError } from "../../lib/AppError";
import { AuthenticatedRequest } from "../../middleware/authenticate";

export const usersController = {
  updateProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const user = await usersService.updateProfile(req.user.id, req.body);
    res.status(200).json({ success: true, data: { user } });
  }),

  uploadAvatar: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    if (!req.file) throw AppError.badRequest("No image file was provided");
    const user = await usersService.uploadAvatar(req.user.id, req.file);
    res.status(200).json({ success: true, data: { user } });
  }),

  getStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const stats = await usersService.getStats(req.user.id);
    res.status(200).json({ success: true, data: { stats } });
  }),

  deleteAccount: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await usersService.deleteAccount(req.user.id, req.body.password);
    res.clearCookie("ds_refresh_token", { path: "/api/auth" });
    res.status(200).json({ success: true, data: { message: "Account deleted" } });
  }),
};
