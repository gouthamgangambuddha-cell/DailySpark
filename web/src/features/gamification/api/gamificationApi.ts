import type {
  GamificationSummaryDTO,
  LeaderboardResponseDTO,
  LeaderboardScope,
} from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

export const gamificationApi = {
  async getMySummary() {
    const res = await apiClient.get<{ success: true; data: { summary: GamificationSummaryDTO } }>(
      "/gamification/me"
    );
    return res.data.data.summary;
  },

  async getLeaderboard(scope: LeaderboardScope) {
    const res = await apiClient.get<{ success: true; data: LeaderboardResponseDTO }>(
      "/gamification/leaderboard",
      { params: { scope } }
    );
    return res.data.data;
  },
};
