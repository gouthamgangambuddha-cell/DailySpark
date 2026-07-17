import { Response, Router } from "express";
import { adminService } from "./admin.service";
import { asyncHandler } from "../../middleware/errorHandler";
import { authenticate, requireRole, AuthenticatedRequest } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { updateUserAdminSchema, updateReportStatusSchema } from "./admin.validators";

const adminController = {
  getStats: asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const stats = await adminService.getStats();
    res.status(200).json({ success: true, data: { stats } });
  }),

  listUsers: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { search, page, limit } = req.query as Record<string, string>;
    const result = await adminService.listUsers(search, Number(page) || 1, Number(limit) || 20);
    res.status(200).json({ success: true, data: result });
  }),

  updateUser: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await adminService.updateUser(req.user!.id, req.params.userId, req.body);
    res.status(200).json({ success: true, data: { user } });
  }),

  deleteUser: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await adminService.deleteUser(req.user!.id, req.params.userId);
    res.status(200).json({ success: true, data: { message: "User deleted" } });
  }),

  listReports: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, page, limit } = req.query as Record<string, string>;
    const result = await adminService.listReports(
      status as never,
      Number(page) || 1,
      Number(limit) || 20
    );
    res.status(200).json({ success: true, data: result });
  }),

  updateReportStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await adminService.updateReportStatus(req.user!.id, req.params.reportId, req.body.status);
    res.status(200).json({ success: true, data: { message: "Report updated" } });
  }),

  listLessons: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { search, page, limit } = req.query as Record<string, string>;
    const result = await adminService.listLessons(search, Number(page) || 1, Number(limit) || 20);
    res.status(200).json({ success: true, data: result });
  }),
};

export const adminRoutes = Router();
adminRoutes.use(authenticate, requireRole("ADMIN"));

adminRoutes.get("/stats", adminController.getStats);

adminRoutes.get("/users", adminController.listUsers);
adminRoutes.patch("/users/:userId", validate(updateUserAdminSchema), adminController.updateUser);
adminRoutes.delete("/users/:userId", adminController.deleteUser);

adminRoutes.get("/reports", adminController.listReports);
adminRoutes.patch(
  "/reports/:reportId",
  validate(updateReportStatusSchema),
  adminController.updateReportStatus
);

adminRoutes.get("/lessons", adminController.listLessons);
