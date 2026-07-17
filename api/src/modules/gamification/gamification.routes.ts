import { Router } from "express";
import { gamificationController } from "./gamification.controller";
import { authenticate, optionalAuthenticate } from "../../middleware/authenticate";

export const gamificationRoutes = Router();

gamificationRoutes.get("/me", authenticate, gamificationController.getMySummary);
gamificationRoutes.get("/leaderboard", optionalAuthenticate, gamificationController.getLeaderboard);
