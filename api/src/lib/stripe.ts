import Stripe from "stripe";
import { env } from "../config/env";
import { AppError } from "./AppError";

let client: Stripe | null = null;

function getClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw AppError.badRequest("Payments are not configured on this server");
  }
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  }
  return client;
}

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const stripe = getClient();
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0].id;

  const customer = await stripe.customers.create({ email, metadata: { userId } });
  return customer.id;
}

export async function createCheckoutSession(input: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getClient();
  const session = await stripe.checkout.sessions.create({
    customer: input.customerId,
    mode: "subscription",
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const stripe = getClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function getStripeCustomerUserId(customerId: string): Promise<string | null> {
  const stripe = getClient();
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return null;
  return (customer.metadata?.userId as string) ?? null;
}

export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const stripe = getClient();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw AppError.badRequest("Stripe webhook secret is not configured");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}
