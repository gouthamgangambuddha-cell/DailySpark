import { Response } from "express";
import { quizzesService } from "./quizzes.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { AppError } from "../../lib/AppError";
import { AuthenticatedRequest } from "../../middleware/authenticate";

export const quizzesController = {
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const quiz = await quizzesService.createQuizForLesson(req.params.lessonId, req.body);
    res.status(201).json({ success: true, data: { quiz } });
  }),

  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const quiz = await quizzesService.updateQuiz(req.params.lessonId, req.body);
    res.status(200).json({ success: true, data: { quiz } });
  }),

  remove: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await quizzesService.deleteQuiz(req.params.lessonId);
    res.status(200).json({ success: true, data: { message: "Quiz deleted" } });
  }),

  getForLesson: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const quiz = await quizzesService.getQuizForLesson(req.params.lessonId, req.user?.id ?? null);
    res.status(200).json({ success: true, data: { quiz } });
  }),

  submit: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await quizzesService.submitQuiz(req.params.quizId, req.user.id, req.body);
    res.status(200).json({ success: true, data: result });
  }),

  getMyAttempts: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const attempts = await quizzesService.getUserAttempts(req.user.id, req.params.quizId);
    res.status(200).json({ success: true, data: { attempts } });
  }),
};
