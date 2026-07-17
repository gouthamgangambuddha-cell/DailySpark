import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import { prisma } from "@dailyspark/db";

// Mock the Google verifier so tests don't depend on network access or real
// Google credentials. This isolates our account-linking logic for testing.
vi.mock("../../lib/googleAuth", () => ({
  verifyGoogleIdToken: vi.fn(async (idToken: string) => {
    if (idToken === "valid-token") {
      return {
        googleId: "google-123",
        email: "grace@example.com",
        emailVerified: true,
        name: "Grace Hopper",
        avatarUrl: "https://example.com/avatar.jpg",
      };
    }
    if (idToken === "existing-local-user-token") {
      return {
        googleId: "google-456",
        email: "existing@example.com",
        emailVerified: true,
        name: "Existing User",
        avatarUrl: null,
      };
    }
    throw new Error("invalid token");
  }),
}));

import { createApp } from "../../app";

const app = createApp();

describe("Google OAuth login", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("creates a new user on first Google sign-in", async () => {
    const res = await request(app).post("/api/auth/google").send({ idToken: "valid-token" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("grace@example.com");
    expect(res.body.data.user.emailVerified).toBe(true);
    expect(res.body.data.accessToken).toBeTypeOf("string");

    const dbUser = await prisma.user.findUnique({ where: { email: "grace@example.com" } });
    expect(dbUser?.authProvider).toBe("GOOGLE");
    expect(dbUser?.googleId).toBe("google-123");
  });

  it("logs in the same user again on subsequent Google sign-ins (no duplicate)", async () => {
    await request(app).post("/api/auth/google").send({ idToken: "valid-token" });
    await request(app).post("/api/auth/google").send({ idToken: "valid-token" });

    const users = await prisma.user.findMany({ where: { email: "grace@example.com" } });
    expect(users).toHaveLength(1);
  });

  it("links Google to an existing local account with the same email", async () => {
    await prisma.user.create({
      data: {
        name: "Existing User",
        email: "existing@example.com",
        passwordHash: "irrelevant-hash",
        authProvider: "LOCAL",
        emailVerified: false,
      },
    });

    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "existing-local-user-token" });

    expect(res.status).toBe(200);

    const dbUser = await prisma.user.findUnique({ where: { email: "existing@example.com" } });
    expect(dbUser?.googleId).toBe("google-456");
    expect(dbUser?.emailVerified).toBe(true); // upgraded by Google's verified email

    const users = await prisma.user.findMany({ where: { email: "existing@example.com" } });
    expect(users).toHaveLength(1); // no duplicate created
  });

  it("rejects an invalid Google token", async () => {
    const res = await request(app).post("/api/auth/google").send({ idToken: "garbage" });
    expect(res.status).toBe(401);
  });

  it("rejects an empty idToken via validation", async () => {
    const res = await request(app).post("/api/auth/google").send({ idToken: "" });
    expect(res.status).toBe(400);
  });
});
