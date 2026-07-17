import type { PublicUser, UpdateProfileRequestDTO, UserStatsDTO } from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

export const usersApi = {
  async updateProfile(payload: UpdateProfileRequestDTO) {
    const res = await apiClient.patch<{ success: true; data: { user: PublicUser } }>(
      "/users/me",
      payload
    );
    return res.data.data.user;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await apiClient.post<{ success: true; data: { user: PublicUser } }>(
      "/users/me/avatar",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data.user;
  },

  async getStats() {
    const res = await apiClient.get<{ success: true; data: { stats: UserStatsDTO } }>(
      "/users/me/stats"
    );
    return res.data.data.stats;
  },

  async deleteAccount(confirmation: string, password?: string) {
    const res = await apiClient.delete("/users/me", { data: { confirmation, password } });
    return res.data.data as { message: string };
  },
};
