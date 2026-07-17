import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import { prisma } from "@dailyspark/db";

const stripeMocks = {
  getOrCreateStripeCustomer: vi.fn(async (_userId: string, _email: string) => "cus_mock123"),
  createCheckoutSession: vi.fn(async () => "https://checkout.stripe.com/mock-session"),
  createPortalSession: vi.fn(async () => "https://billing.stripe.com/mock-portal"),
  getStripeCustomerUserId: vi.fn(async () => null as string | null),
  constructWebhookEvent: vi.fn(),
};

vi.mock("../../lib/stripe", () => stripeMocks);

import { createApp } from "../../app";
import { env } from "../../config/env";

const app = createApp();

async function registerUser(email: string) {
  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email,
    password: "StrongPass123",
  });
  return { accessToken: res.body.data.accessToken as string, userId: res.body.data.user.id as string };
}

describe("Payments (Stripe)", () => {
  beforeAll(async () => {
    await prisma.$connect();
    (env as any).STRIPE_PRICE_ID_MONTHLY = "price_monthly_test";
    (env as any).STRIPE_PRICE_ID_YEARLY = "price_yearly_test";
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    stripeMocks.getStripeCustomerUserId.mockResolvedValue(null);
    await prisma.subscription.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("creates a checkout session for a monthly subscription", async () => {
    const { accessToken } = await registerUser("checkout@example.com");

    const res = await request(app)
      .post("/api/payments/create-checkout-session")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ interval: "monthly" });

    expect(res.status).toBe(200);
    expect(res.body.data.url).toBe("https://checkout.stripe.com/mock-session");
    expect(stripeMocks.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ priceId: "price_monthly_test" })
    );
  });

  it("rejects an invalid billing interval", async () => {
    const { accessToken } = await registerUser("checkout2@example.com");
    const res = await request(app)
      .post("/api/payments/create-checkout-session")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ interval: "weekly" });
    expect(res.status).toBe(400);
  });

  it("returns null subscription for a user with no billing history", async () => {
    const { accessToken } = await registerUser("nosub@example.com");
    const res = await request(app)
      .get("/api/payments/subscription")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.subscription).toBeNull();
  });

  it("rejects a portal session request with no existing subscription", async () => {
    const { accessToken } = await registerUser("noportal@example.com");
    const res = await request(app)
      .post("/api/payments/create-portal-session")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(400);
  });

  it("activates premium via a customer.subscription.created webhook", async () => {
    const { userId } = await registerUser("webhook1@example.com");
    stripeMocks.getStripeCustomerUserId.mockResolvedValue(userId);

    const fakeEvent = {
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_123",
          customer: "cus_abc",
          status: "active",
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          cancel_at_period_end: false,
          items: { data: [{ price: { id: "price_monthly_test" } }] },
        },
      },
    };
    stripeMocks.constructWebhookEvent.mockReturnValue(fakeEvent);

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "fake-signature")
      .set("Content-Type", "application/json")
      .send(Buffer.from(JSON.stringify(fakeEvent)));

    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.isPremium).toBe(true);

    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    expect(subscription?.status).toBe("ACTIVE");
  });

  it("deactivates premium via a customer.subscription.deleted webhook", async () => {
    const { userId } = await registerUser("webhook2@example.com");
    await prisma.subscription.create({
      data: {
        userId,
        stripeCustomerId: "cus_xyz",
        stripeSubscriptionId: "sub_xyz",
        stripePriceId: "price_monthly_test",
        status: "ACTIVE",
        currentPeriodEnd: new Date(),
      },
    });
    await prisma.user.update({ where: { id: userId }, data: { isPremium: true } });

    const fakeEvent = {
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_xyz", customer: "cus_xyz" } },
    };
    stripeMocks.constructWebhookEvent.mockReturnValue(fakeEvent);

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "fake-signature")
      .set("Content-Type", "application/json")
      .send(Buffer.from(JSON.stringify(fakeEvent)));

    expect(res.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(user?.isPremium).toBe(false);

    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    expect(subscription?.status).toBe("CANCELED");
  });

  it("rejects a webhook with an invalid signature", async () => {
    stripeMocks.constructWebhookEvent.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "bad-signature")
      .set("Content-Type", "application/json")
      .send(Buffer.from(JSON.stringify({ type: "irrelevant" })));

    expect(res.status).toBe(400);
  });
});
