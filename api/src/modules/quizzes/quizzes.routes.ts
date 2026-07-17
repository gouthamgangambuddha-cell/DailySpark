import { Router } from "express";
import { quizzesController } from "./quizzes.controller";
import { validate } from "../../middleware/validate";
import { authenticate, requireRole, optionalAuthenticate } from "../../middleware/authenticate";
import { createQuizSchema, submitQuizSchema } from "./quizzes.validators";

// Mounted at /api/lessons/:lessonId/quiz
export const lessonQuizRoutes = Router({ mergeParams: true });

lessonQuizRoutes.get("/", optionalAuthenticate, quizzesController.getForLesson);
lessonQuizRoutes.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(createQuizSchema),
  quizzesController.create
);
lessonQuizRoutes.patch("/", authenticate, requireRole("ADMIN"), quizzesController.update);
lessonQuizRoutes.delete("/", authenticate, requireRole("ADMIN"), quizzesController.remove);

// Mounted at /api/quizzes
export const quizzesRoutes = Router();

quizzesRoutes.post(
  "/:quizId/submit",
  authenticate,
  validate(submitQuizSchema),
  quizzesController.submit
);
quizzesRoutes.get("/:quizId/attempts", authenticate, quizzesController.getMyAttempts);
