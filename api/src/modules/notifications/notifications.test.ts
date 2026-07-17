import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import { prisma } from "@dailyspark/db";

const sendPushMock = vi.fn(async () => ({ invalidTokens: [] as string[] }));
vi.mock("../../lib/firebaseAdmin", () => ({
  sendPushNotification: (...args: unknown[]) => sendPushMock(...args),
}));

import { createApp } from "../../app";

const app = createApp();

async function registerUser(email: string, name = "Test User") {
  const res = await request(app).post("/api/auth/register").send({
    name,
    email,
    password: "StrongPass123",
  });
  return { accessToken: res.body.data.accessToken as string, userId: res.body.data.user.id as string };
}

describe("Push notifications (FCM)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    sendPushMock.mockClear();
    await prisma.deviceToken.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("registers a device token", async () => {
    const { accessToken } = await registerUser("device@example.com");

    const res = await request(app)
      .post("/api/notifications/device-token")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ token: "fake-fcm-token-1234567890" });

    expect(res.status).toBe(200);
    const stored = await prisma.deviceToken.findUnique({
      where: { token: "fake-fcm-token-1234567890" },
    });
    expect(stored).toBeTruthy();
  });

  it("sends a push notification when a registered user gets a new follower", async () => {
    const { accessToken: followerToken } = await registerUser("follower@example.com", "Grace");
    const { accessToken: targetToken, userId: targetId } = await registerUser("target@example.com");

    await request(app)
      .post("/api/notifications/device-token")
      .set("Authorization", `Bearer ${targetToken}`)
      .send({ token: "target-device-token-1234567890" });

    await request(app)
      .post(`/api/users/${targetId}/follow`)
      .set("Authorization", `Bearer ${followerToken}`);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sendPushMock).toHaveBeenCalledTimes(1);
    const [tokens, payload] = sendPushMock.mock.calls[0];
    expect(tokens).toContain("target-device-token-1234567890");
    expect(payload.body).toContain("Grace");
  });

  it("does not attempt a push when the user has no registered device", async () => {
    const { accessToken: followerToken } = await registerUser("follower2@example.com");
    const { userId: targetId } = await registerUser("target2@example.com");

    await request(app)
      .post(`/api/users/${targetId}/follow`)
      .set("Authorization", `Bearer ${followerToken}`);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sendPushMock).not.toHaveBeenCalled();
  });

  it("unregisters a device token", async () => {
    const { accessToken } = await registerUser("unregister@example.com");
    await request(app)
      .post("/api/notifications/device-token")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ token: "to-be-removed-1234567890" });

    const res = await request(app)
      .delete("/api/notifications/device-token")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ token: "to-be-removed-1234567890" });

    expect(res.status).toBe(200);
    const stored = await prisma.deviceToken.findUnique({ where: { token: "to-be-removed-1234567890" } });
    expect(stored).toBeNull();
  });
});
