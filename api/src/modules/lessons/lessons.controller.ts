import { Response } from "express";
import { lessonsService } from "./lessons.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { AppError } from "../../lib/AppError";
import { AuthenticatedRequest } from "../../middleware/authenticate";

export const lessonsController = {
  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const lesson = await lessonsService.createLesson(req.body, req.user.id);
    res.status(201).json({ success: true, data: { lesson } });
  }),

  update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const lesson = await lessonsService.updateLesson(req.params.id, req.body);
    res.status(200).json({ success: true, data: { lesson } });
  }),

  remove: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await lessonsService.deleteLesson(req.params.id);
    res.status(200).json({ success: true, data: { message: "Lesson deleted" } });
  }),

  getBySlug: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const lesson = await lessonsService.getLessonBySlug(req.params.slug, req.user?.id ?? null);
    res.status(200).json({ success: true, data: { lesson } });
  }),

  list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { category, difficulty, tag, q, author, sort, page, limit } = req.query as Record<
      string,
      string
    >;
    const result = await lessonsService.listLessons(
      { category, difficulty: difficulty as never, tag, q, author },
      (sort as "newest" | "popular" | "trending") || "newest",
      Number(page) || 1,
      Number(limit) || 12,
      req.user?.id ?? null
    );
    res.status(200).json({ success: true, data: result });
  }),

  listBookmarked: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const { page, limit } = req.query as Record<string, string>;
    const result = await lessonsService.listBookmarkedLessons(
      req.user.id,
      Number(page) || 1,
      Number(limit) || 12
    );
    res.status(200).json({ success: true, data: result });
  }),

  toggleLike: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await lessonsService.toggleLike(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: result });
  }),

  toggleBookmark: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await lessonsService.toggleBookmark(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: result });
  }),
};
