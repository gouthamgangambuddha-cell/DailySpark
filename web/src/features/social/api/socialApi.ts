import type {
  PublicProfileDTO,
  ActivityFeedItemDTO,
  CreateReportRequestDTO,
} from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

export const socialApi = {
  async toggleFollow(userId: string) {
    const res = await apiClient.post<{ success: true; data: { following: boolean } }>(
      `/users/${userId}/follow`
    );
    return res.data.data;
  },

  async getProfile(userId: string) {
    const res = await apiClient.get<{ success: true; data: { profile: PublicProfileDTO } }>(
      `/users/${userId}/profile`
    );
    return res.data.data.profile;
  },

  async getFeed() {
    const res = await apiClient.get<{ success: true; data: { items: ActivityFeedItemDTO[] } }>(
      "/social/feed"
    );
    return res.data.data.items;
  },

  async createReport(payload: CreateReportRequestDTO) {
    await apiClient.post("/social/reports", payload);
  },
};
