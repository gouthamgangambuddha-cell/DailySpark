import type { NotificationDTO, PaginatedResponse } from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

interface NotificationsListResponse extends PaginatedResponse<NotificationDTO> {
  unreadCount: number;
}

export const notificationsApi = {
  async registerDeviceToken(token: string) {
    await apiClient.post("/notifications/device-token", { token, platform: "WEB" });
  },

  async unregisterDeviceToken(token: string) {
    await apiClient.delete("/notifications/device-token", { data: { token } });
  },

  async list(page = 1, limit = 20) {
    const res = await apiClient.get<{ success: true; data: NotificationsListResponse }>(
      "/notifications",
      { params: { page, limit } }
    );
    return res.data.data;
  },

  async markRead(id: string) {
    await apiClient.post(`/notifications/${id}/read`);
  },

  async markAllRead() {
    await apiClient.post("/notifications/read-all");
  },
};
