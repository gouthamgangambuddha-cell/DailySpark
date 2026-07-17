import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { prisma } from "@dailyspark/db";
import { createApp } from "../../app";

const app = createApp();

async function registerAdmin(email: string) {
  const res = await request(app).post("/api/auth/register").send({
    name: "Admin",
    email,
    password: "StrongPass123",
  });
  await prisma.user.update({ where: { id: res.body.data.user.id }, data: { role: "ADMIN" } });
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "StrongPass123" });
  return login.body.data.accessToken as string;
}

describe("SEO: sitemap.xml", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.lesson.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("includes static routes and published lessons, excludes drafts", async () => {
    const accessToken = await registerAdmin("sitemap-admin@example.com");

    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Published Lesson",
        summary: "A summary long enough to pass validation checks.",
        content: "Enough lesson content to satisfy the minimum length validation rule.",
        category: "Science",
      });
    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Draft Lesson",
        summary: "A summary long enough to pass validation checks.",
        content: "Enough lesson content to satisfy the minimum length validation rule.",
        category: "Science",
        isPublished: false,
      });

    const res = await request(app).get("/sitemap.xml");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/xml");
    expect(res.text).toContain("/lessons/published-lesson");
    expect(res.text).not.toContain("/lessons/draft-lesson");
    expect(res.text).toContain("<urlset");
  });
});
