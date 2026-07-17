import { Router } from "express";
import { lessonsController } from "./lessons.controller";
import { validate } from "../../middleware/validate";
import { authenticate, requireRole, optionalAuthenticate } from "../../middleware/authenticate";
import {
  createLessonSchema,
  updateLessonSchema,
  listLessonsQuerySchema,
  slugParamSchema,
} from "./lessons.validators";

export const lessonsRoutes = Router();

// --- Public reads (optional auth so isLiked/isBookmarked can be personalized) ---
lessonsRoutes.get("/", optionalAuthenticate, validate(listLessonsQuerySchema), lessonsController.list);
lessonsRoutes.get(
  "/bookmarked",
  authenticate, // must come before the :slug route below to avoid "bookmarked" being read as a slug
  lessonsController.listBookmarked
);
lessonsRoutes.get(
  "/:slug",
  optionalAuthenticate,
  validate(slugParamSchema),
  lessonsController.getBySlug
);

// --- Admin-only writes ---
lessonsRoutes.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(createLessonSchema),
  lessonsController.create
);
lessonsRoutes.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(updateLessonSchema),
  lessonsController.update
);
lessonsRoutes.delete("/:id", authenticate, requireRole("ADMIN"), lessonsController.remove);

// --- Authenticated interactions ---
lessonsRoutes.post("/:id/like", authenticate, lessonsController.toggleLike);
lessonsRoutes.post("/:id/bookmark", authenticate, lessonsController.toggleBookmark);
