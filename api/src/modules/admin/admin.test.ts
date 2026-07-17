import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { prisma } from "@dailyspark/db";
import { createApp } from "../../app";

const app = createApp();

async function registerUser(email: string, role: "USER" | "ADMIN" = "USER") {
  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email,
    password: "StrongPass123",
  });
  const userId = res.body.data.user.id as string;
  if (role === "ADMIN") {
    await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "StrongPass123" });
    return { accessToken: login.body.data.accessToken as string, userId };
  }
  return { accessToken: res.body.data.accessToken as string, userId };
}

describe("Admin module", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.report.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("rejects non-admin access to any admin route", async () => {
    const { accessToken } = await registerUser("user@example.com");
    const res = await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it("returns site-wide stats", async () => {
    const { accessToken } = await registerUser("admin@example.com", "ADMIN");
    await registerUser("regular1@example.com");
    await registerUser("regular2@example.com");

    const res = await request(app).get("/api/admin/stats").set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.totalUsers).toBe(3);
    expect(res.body.data.stats.pendingReports).toBe(0);
  });

  it("lists and searches users", async () => {
    const { accessToken } = await registerUser("admin2@example.com", "ADMIN");
    await registerUser("findme@example.com");
    await registerUser("someoneelse@example.com");

    const res = await request(app)
      .get("/api/admin/users")
      .query({ search: "findme" })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].email).toBe("findme@example.com");
  });

  it("updates a user's role and premium status", async () => {
    const { accessToken } = await registerUser("admin3@example.com", "ADMIN");
    const { userId: targetId } = await registerUser("target@example.com");

    const res = await request(app)
      .patch(`/api/admin/users/${targetId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ isPremium: true, isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.user.isPremium).toBe(true);
    expect(res.body.data.user.isActive).toBe(false);
  });

  it("prevents an admin from demoting themselves", async () => {
    const { accessToken, userId } = await registerUser("admin4@example.com", "ADMIN");

    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ role: "USER" });

    expect(res.status).toBe(400);
  });

  it("prevents an admin from deleting their own account via the admin panel", async () => {
    const { accessToken, userId } = await registerUser("admin5@example.com", "ADMIN");
    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(400);
  });

  it("deletes another user's account", async () => {
    const { accessToken } = await registerUser("admin6@example.com", "ADMIN");
    const { userId: targetId } = await registerUser("deleteme@example.com");

    const res = await request(app)
      .delete(`/api/admin/users/${targetId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);

    const stillExists = await prisma.user.findUnique({ where: { id: targetId } });
    expect(stillExists).toBeNull();
  });

  it("records an audit log entry when a user is updated or deleted", async () => {
    const { accessToken, userId: adminId } = await registerUser("admin-audit@example.com", "ADMIN");
    const { userId: targetId } = await registerUser("audit-target@example.com");

    await request(app)
      .patch(`/api/admin/users/${targetId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ isPremium: true });

    const updateLog = await prisma.auditLog.findFirst({
      where: { action: "USER_UPDATED", targetId },
    });
    expect(updateLog?.actorId).toBe(adminId);

    await request(app)
      .delete(`/api/admin/users/${targetId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    const deleteLog = await prisma.auditLog.findFirst({
      where: { action: "USER_DELETED", targetId },
    });
    expect(deleteLog).toBeTruthy();
  });

  it("lists reports filtered by status and updates status", async () => {
    const { accessToken } = await registerUser("admin7@example.com", "ADMIN");
    const { accessToken: reporterToken } = await registerUser("reporter@example.com");
    const lessonRes = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Reportable Lesson",
        summary: "A summary long enough to pass validation checks.",
        content: "Enough lesson content to satisfy the minimum length validation rule.",
        category: "Science",
      });

    await request(app)
      .post("/api/social/reports")
      .set("Authorization", `Bearer ${reporterToken}`)
      .send({
        targetType: "LESSON",
        targetId: lessonRes.body.data.lesson.id,
        reason: "This is factually incorrect.",
      });

    const listRes = await request(app)
      .get("/api/admin/reports")
      .query({ status: "PENDING" })
      .set("Authorization", `Bearer ${accessToken}`);
    expect(listRes.body.data.items).toHaveLength(1);

    const reportId = listRes.body.data.items[0].id;
    const updateRes = await request(app)
      .patch(`/api/admin/reports/${reportId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ status: "REVIEWED" });
    expect(updateRes.status).toBe(200);

    const afterUpdate = await request(app)
      .get("/api/admin/reports")
      .query({ status: "PENDING" })
      .set("Authorization", `Bearer ${accessToken}`);
    expect(afterUpdate.body.data.items).toHaveLength(0);
  });

  it("lists all lessons including unpublished ones", async () => {
    const { accessToken } = await registerUser("admin8@example.com", "ADMIN");
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

    const res = await request(app)
      .get("/api/admin/lessons")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.some((l: any) => l.title === "Draft Lesson")).toBe(true);
    expect(res.body.data.items.find((l: any) => l.title === "Draft Lesson").isPublished).toBe(false);
  });
});
