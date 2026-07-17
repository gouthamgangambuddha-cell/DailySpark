export type SubscriptionStatus = "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";
export type BillingInterval = "monthly" | "yearly";

export interface SubscriptionDTO {
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  isPremium: boolean;
}

export interface CreateCheckoutSessionRequestDTO {
  interval: BillingInterval;
}

export interface CreateCheckoutSessionResponseDTO {
  url: string;
}

export interface CreatePortalSessionResponseDTO {
  url: string;
}
