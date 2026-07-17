import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import { prisma } from "@dailyspark/db";

// Mock Cloudinary so tests don't require real credentials or network access.
vi.mock("../../config/cloudinary", () => ({
  getCloudinary: vi.fn(() => ({
    uploader: {
      upload_stream: (
        _opts: unknown,
        callback: (error: unknown, result: { secure_url: string } | undefined) => void
      ) => {
        return {
          end: (_buffer: Buffer) => {
            callback(null, { secure_url: "https://res.cloudinary.com/demo/avatar.jpg" });
          },
        };
      },
      destroy: vi.fn(async () => ({ result: "ok" })),
    },
  })),
}));

import { createApp } from "../../app";

const app = createApp();

const testUser = {
  name: "Marie Curie",
  email: "marie@example.com",
  password: "StrongPass123",
};

async function registerAndLogin() {
  const res = await request(app).post("/api/auth/register").send(testUser);
  return {
    accessToken: res.body.data.accessToken as string,
    userId: res.body.data.user.id as string,
  };
}

describe("Users profile module", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.emailVerificationToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("updates name, bio, interests, and preferred language", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Marie Skłodowska-Curie",
        bio: "Physicist and chemist.",
        interests: ["Science", "History"],
        preferredLanguage: "fr",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe("Marie Skłodowska-Curie");
    expect(res.body.data.user.interests).toEqual(["Science", "History"]);
    expect(res.body.data.user.preferredLanguage).toBe("fr");
  });

  it("rejects an invalid interest category", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ interests: ["NotARealCategory"] });

    expect(res.status).toBe(400);
  });

  it("rejects profile update with no fields", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("uploads an avatar and sets avatarUrl", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", Buffer.from("fake-image-bytes"), {
        filename: "avatar.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.avatarUrl).toBe("https://res.cloudinary.com/demo/avatar.jpg");
  });

  it("rejects a non-image file upload", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .post("/api/users/me/avatar")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("avatar", Buffer.from("not an image"), {
        filename: "file.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
  });

  it("returns user stats", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .get("/api/users/me/stats")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.emailVerified).toBe(false);
    expect(res.body.data.stats.daysSinceJoining).toBe(0);
    expect(res.body.data.stats.activeSessionsCount).toBeGreaterThanOrEqual(1);
  });

  it("rejects account deletion with the wrong password", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: "WrongPassword1", confirmation: "DELETE" });

    expect(res.status).toBe(401);
  });

  it("rejects account deletion without typing DELETE", async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: testUser.password, confirmation: "delete" });

    expect(res.status).toBe(400);
  });

  it("deletes the account with correct password and confirmation", async () => {
    const { accessToken, userId } = await registerAndLogin();

    const res = await request(app)
      .delete("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: testUser.password, confirmation: "DELETE" });

    expect(res.status).toBe(200);

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser).toBeNull();
  });
});
