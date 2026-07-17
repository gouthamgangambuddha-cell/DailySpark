import { Response, Router } from "express";
import { commentsService } from "./comments.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { AppError } from "../../lib/AppError";
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { createCommentSchema } from "./comments.validators";

const commentsController = {
  list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const comments = await commentsService.listForLesson(req.params.lessonId, req.user?.id ?? null);
    res.status(200).json({ success: true, data: { comments } });
  }),

  create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const comment = await commentsService.create(req.params.lessonId, req.user.id, req.body);
    res.status(201).json({ success: true, data: { comment } });
  }),

  remove: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await commentsService.softDelete(req.params.commentId, req.user.id, req.user.role === "ADMIN");
    res.status(200).json({ success: true, data: { message: "Comment deleted" } });
  }),

  toggleLike: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await commentsService.toggleLike(req.user.id, req.params.commentId);
    res.status(200).json({ success: true, data: result });
  }),
};

// Mounted at /api/lessons/:lessonId/comments
export const lessonCommentsRoutes = Router({ mergeParams: true });
lessonCommentsRoutes.get("/", optionalAuthenticate, commentsController.list);
lessonCommentsRoutes.post("/", authenticate, validate(createCommentSchema), commentsController.create);

// Mounted at /api/comments (for actions scoped by comment id, not lesson id)
export const commentsRoutes = Router();
commentsRoutes.delete("/:commentId", authenticate, commentsController.remove);
commentsRoutes.post("/:commentId/like", authenticate, commentsController.toggleLike);
