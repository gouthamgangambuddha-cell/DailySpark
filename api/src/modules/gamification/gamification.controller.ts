import { Response } from "express";
import { gamificationService } from "./gamification.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { AppError } from "../../lib/AppError";
import { AuthenticatedRequest } from "../../middleware/authenticate";
import type { LeaderboardScope } from "@dailyspark/types";

export const gamificationController = {
  getMySummary: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const summary = await gamificationService.getSummary(req.user.id);
    res.status(200).json({ success: true, data: { summary } });
  }),

  getLeaderboard: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const scope = (req.query.scope as LeaderboardScope) ?? "allTime";
    const result = await gamificationService.getLeaderboard(scope, req.user?.id ?? null);
    res.status(200).json({ success: true, data: result });
  }),
};
