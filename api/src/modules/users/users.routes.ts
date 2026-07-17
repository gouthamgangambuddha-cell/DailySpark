import { Router } from "express";
import { usersController } from "./users.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/authenticate";
import { avatarUpload } from "../../middleware/upload";
import { updateProfileSchema, deleteAccountSchema } from "./users.validators";

export const usersRoutes = Router();

usersRoutes.use(authenticate); // every route in this module requires a logged-in user

usersRoutes.patch("/me", validate(updateProfileSchema), usersController.updateProfile);
usersRoutes.post("/me/avatar", avatarUpload.single("avatar"), usersController.uploadAvatar);
usersRoutes.get("/me/stats", usersController.getStats);
usersRoutes.delete("/me", validate(deleteAccountSchema), usersController.deleteAccount);
