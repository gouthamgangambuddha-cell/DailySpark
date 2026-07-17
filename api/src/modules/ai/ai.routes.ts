import { Response, Router } from "express";
import { aiService } from "./ai.service";
import { aiQuota } from "./aiQuota";
import { asyncHandler } from "../../middleware/errorHandler";
import { AppError } from "../../lib/AppError";
import { authenticate, AuthenticatedRequest } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { explainSchema, lessonIdBodySchema, translateSchema } from "./ai.validators";

const aiController = {
  explain: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await aiService.explain(req.user.id, req.body.lessonId, req.body.question);
    res.status(200).json({ success: true, data: result });
  }),

  flashcards: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await aiService.generateFlashcards(req.user.id, req.body.lessonId);
    res.status(200).json({ success: true, data: result });
  }),

  practiceQuestions: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await aiService.generatePracticeQuestions(req.user.id, req.body.lessonId);
    res.status(200).json({ success: true, data: result });
  }),

  translate: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await aiService.translateLesson(
      req.user.id,
      req.body.lessonId,
      req.body.targetLanguage
    );
    res.status(200).json({ success: true, data: result });
  }),

  recommendations: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const lessons = await aiService.recommendLessons(req.user.id);
    res.status(200).json({ success: true, data: { lessons } });
  }),

  quota: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const quota = await aiQuota.getQuota(req.user.id);
    res.status(200).json({ success: true, data: { quota } });
  }),
};

export const aiRoutes = Router();
aiRoutes.use(authenticate);
aiRoutes.post("/explain", validate(explainSchema), aiController.explain);
aiRoutes.post("/flashcards", validate(lessonIdBodySchema), aiController.flashcards);
aiRoutes.post("/practice-questions", validate(lessonIdBodySchema), aiController.practiceQuestions);
aiRoutes.post("/translate", validate(translateSchema), aiController.translate);
aiRoutes.get("/recommendations", aiController.recommendations);
aiRoutes.get("/quota", aiController.quota);
