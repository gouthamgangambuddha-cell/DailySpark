import type { BillingInterval, SubscriptionDTO } from "@dailyspark/types";
import { apiClient } from "@/lib/apiClient";

export const paymentsApi = {
  async createCheckoutSession(interval: BillingInterval) {
    const res = await apiClient.post<{ success: true; data: { url: string } }>(
      "/payments/create-checkout-session",
      { interval }
    );
    return res.data.data.url;
  },

  async createPortalSession() {
    const res = await apiClient.post<{ success: true; data: { url: string } }>(
      "/payments/create-portal-session"
    );
    return res.data.data.url;
  },

  async getSubscription() {
    const res = await apiClient.get<{
      success: true;
      data: { subscription: SubscriptionDTO | null };
    }>("/payments/subscription");
    return res.data.data.subscription;
  },
};
