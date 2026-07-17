import type {
  AdminStatsDTO,
  AdminUserDTO,
  UpdateUserAdminRequestDTO,
  AdminReportDTO,
  AdminReportStatus,
  AdminLessonDTO,
  PaginatedResponse,
} from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

export const adminApi = {
  async getStats() {
    const res = await apiClient.get<{ success: true; data: { stats: AdminStatsDTO } }>(
      "/admin/stats"
    );
    return res.data.data.stats;
  },

  async listUsers(search: string, page = 1, limit = 20) {
    const res = await apiClient.get<{ success: true; data: PaginatedResponse<AdminUserDTO> }>(
      "/admin/users",
      { params: { search: search || undefined, page, limit } }
    );
    return res.data.data;
  },

  async updateUser(userId: string, payload: UpdateUserAdminRequestDTO) {
    const res = await apiClient.patch<{ success: true; data: { user: AdminUserDTO } }>(
      `/admin/users/${userId}`,
      payload
    );
    return res.data.data.user;
  },

  async deleteUser(userId: string) {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  async listReports(status: AdminReportStatus | "", page = 1, limit = 20) {
    const res = await apiClient.get<{ success: true; data: PaginatedResponse<AdminReportDTO> }>(
      "/admin/reports",
      { params: { status: status || undefined, page, limit } }
    );
    return res.data.data;
  },

  async updateReportStatus(reportId: string, status: AdminReportStatus) {
    await apiClient.patch(`/admin/reports/${reportId}`, { status });
  },

  async listLessons(search: string, page = 1, limit = 20) {
    const res = await apiClient.get<{ success: true; data: PaginatedResponse<AdminLessonDTO> }>(
      "/admin/lessons",
      { params: { search: search || undefined, page, limit } }
    );
    return res.data.data;
  },
};
