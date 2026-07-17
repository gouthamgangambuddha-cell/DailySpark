import { prisma } from "@dailyspark/db";
import type Stripe from "stripe";
import type { SubscriptionDTO, BillingInterval } from "@dailyspark/types";
import { AppError } from "../../lib/AppError";
import { env } from "../../config/env";
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createPortalSession,
  getStripeCustomerUserId,
} from "../../lib/stripe";

function priceIdForInterval(interval: BillingInterval): string {
  const priceId = interval === "yearly" ? env.STRIPE_PRICE_ID_YEARLY : env.STRIPE_PRICE_ID_MONTHLY;
  if (!priceId) {
    throw AppError.badRequest(`No Stripe price configured for the "${interval}" plan`);
  }
  return priceId;
}

/**
 * Resolves a Stripe customer ID to our internal userId. Checks the
 * Subscription table first (fast path for existing subscribers); falls back
 * to the userId we stash in Stripe customer metadata at creation time, which
 * is what makes the very first subscription webhook resolvable.
 */
async function resolveUserId(stripeCustomerId: string): Promise<string | null> {
  const existing = await prisma.subscription.findUnique({ where: { stripeCustomerId } });
  if (existing) return existing.userId;
  return getStripeCustomerUserId(stripeCustomerId);
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionDTO["status"] {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

export const paymentsService = {
  async createCheckoutSession(userId: string, interval: BillingInterval): Promise<string> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);
    const priceId = priceIdForInterval(interval);

    return createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${env.WEB_URL}/dashboard?checkout=success`,
      cancelUrl: `${env.WEB_URL}/dashboard?checkout=canceled`,
    });
  },

  async createPortalSession(userId: string): Promise<string> {
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) {
      throw AppError.badRequest("No billing account found. Subscribe first.");
    }
    return createPortalSession(subscription.stripeCustomerId, `${env.WEB_URL}/dashboard`);
  },

  async getSubscription(userId: string): Promise<SubscriptionDTO | null> {
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) return null;

    return {
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      isPremium: subscription.status === "ACTIVE" || subscription.status === "TRIALING",
    };
  },

  /**
   * Handles the Stripe webhook events that matter for keeping subscription
   * state (and the denormalized User.isPremium flag) in sync. Handlers are
   * idempotent — Stripe may redeliver the same event more than once.
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (!userId) return;

        const status = mapStripeStatus(sub.status);
        const priceId = sub.items.data[0]?.price.id ?? "";

        await prisma.$transaction([
          prisma.subscription.upsert({
            where: { userId },
            update: {
              stripeSubscriptionId: sub.id,
              stripePriceId: priceId,
              status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
            create: {
              userId,
              stripeCustomerId: sub.customer as string,
              stripeSubscriptionId: sub.id,
              stripePriceId: priceId,
              status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { isPremium: status === "ACTIVE" || status === "TRIALING" },
          }),
        ]);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string);
        if (!userId) return;

        await prisma.$transaction([
          prisma.subscription.update({
            where: { userId },
            data: { status: "CANCELED", cancelAtPeriodEnd: true },
          }),
          prisma.user.update({ where: { id: userId }, data: { isPremium: false } }),
        ]);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = await resolveUserId(invoice.customer as string);
        if (!userId) return;

        await prisma.subscription
          .update({ where: { userId }, data: { status: "PAST_DUE" } })
          .catch(() => undefined); // subscription may not exist yet — safe to ignore
        break;
      }

      default:
        // Unhandled event types are intentionally ignored — Stripe sends many
        // more events than we act on (checkout.session.completed itself needs
        // no handling here since customer.subscription.created follows it).
        break;
    }
  },
};
