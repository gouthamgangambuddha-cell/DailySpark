import type {
  AuthResponseDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  PublicUser,
} from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

export const authApi = {
  async register(payload: RegisterRequestDTO) {
    const res = await apiClient.post<{ success: true; data: AuthResponseDTO }>(
      "/auth/register",
      payload
    );
    return res.data.data;
  },

  async login(payload: LoginRequestDTO) {
    const res = await apiClient.post<{ success: true; data: AuthResponseDTO }>(
      "/auth/login",
      payload
    );
    return res.data.data;
  },

  async googleLogin(idToken: string) {
    const res = await apiClient.post<{ success: true; data: AuthResponseDTO }>("/auth/google", {
      idToken,
    });
    return res.data.data;
  },

  async logout() {
    await apiClient.post("/auth/logout");
  },

  async me() {
    const res = await apiClient.get<{ success: true; data: { user: PublicUser } }>("/auth/me");
    return res.data.data.user;
  },

  async refresh() {
    const res = await apiClient.post<{ success: true; data: AuthResponseDTO }>("/auth/refresh");
    return res.data.data;
  },

  async forgotPassword(email: string) {
    const res = await apiClient.post("/auth/forgot-password", { email });
    return res.data.data as { message: string };
  },

  async resetPassword(token: string, newPassword: string) {
    const res = await apiClient.post("/auth/reset-password", { token, newPassword });
    return res.data.data as { message: string };
  },

  async verifyEmail(token: string) {
    const res = await apiClient.post("/auth/verify-email", { token });
    return res.data.data as { message: string };
  },

  async resendVerification() {
    const res = await apiClient.post("/auth/resend-verification");
    return res.data.data as { message: string };
  },
};
