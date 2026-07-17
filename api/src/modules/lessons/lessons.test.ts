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
    // Re-login to get a fresh access token carrying the ADMIN role.
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "StrongPass123" });
    return { accessToken: login.body.data.accessToken as string, userId };
  }

  return { accessToken: res.body.data.accessToken as string, userId };
}

const sampleLesson = {
  title: "How Black Holes Warp Time",
  summary: "A quick look at gravitational time dilation near a black hole's event horizon.",
  content:
    "Black holes are regions of spacetime where gravity is so strong that nothing, not even light, can escape. " +
    "Near the event horizon, time itself slows down relative to a distant observer — a real, measurable effect called gravitational time dilation.",
  category: "Space",
  tags: ["physics", "relativity"],
  difficulty: "INTERMEDIATE" as const,
};

describe("Lessons module", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.like.deleteMany();
    await prisma.bookmark.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("rejects lesson creation by a non-admin user", async () => {
    const { accessToken } = await registerUser("learner@example.com");

    const res = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleLesson);

    expect(res.status).toBe(403);
  });

  it("allows an admin to create a lesson and generates a slug", async () => {
    const { accessToken } = await registerUser("admin@example.com", "ADMIN");

    const res = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleLesson);

    expect(res.status).toBe(201);
    expect(res.body.data.lesson.slug).toBe("how-black-holes-warp-time");
    expect(res.body.data.lesson.category).toBe("Space");
    expect(res.body.data.lesson.author.name).toBe("Test User");
  });

  it("rejects an invalid category", async () => {
    const { accessToken } = await registerUser("admin2@example.com", "ADMIN");

    const res = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...sampleLesson, category: "NotACategory" });

    expect(res.status).toBe(400);
  });

  it("deduplicates slugs for lessons with the same title", async () => {
    const { accessToken } = await registerUser("admin3@example.com", "ADMIN");

    const first = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleLesson);
    const second = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleLesson);

    expect(first.body.data.lesson.slug).toBe("how-black-holes-warp-time");
    expect(second.body.data.lesson.slug).toBe("how-black-holes-warp-time-2");
  });

  it("lists only published lessons publicly, filterable by category", async () => {
    const { accessToken } = await registerUser("admin4@example.com", "ADMIN");

    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleLesson);
    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...sampleLesson, title: "Draft Lesson", isPublished: false });
    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...sampleLesson, title: "A History Lesson", category: "History" });

    const res = await request(app).get("/api/lessons").query({ category: "Space" });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toBe(sampleLesson.title);
    expect(res.body.data.totalItems).toBe(1);
  });

  it("retrieves a single published lesson by slug with full content", async () => {
    const { accessToken } = await registerUser("admin5@example.com", "ADMIN");
    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleLesson);

    const res = await request(app).get("/api/lessons/how-black-holes-warp-time");

    expect(res.status).toBe(200);
    expect(res.body.data.lesson.content).toContain("event horizon");
  });

  it("returns 404 for an unpublished or nonexistent lesson slug", async () => {
    const { accessToken } = await registerUser("admin6@example.com", "ADMIN");
    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...sampleLesson, isPublished: false });

    const res = await request(app).get("/api/lessons/how-black-holes-warp-time");
    expect(res.status).toBe(404);

    const res2 = await request(app).get("/api/lessons/does-not-exist");
    expect(res2.status).toBe(404);
  });

  it("toggles a like on and off, updating likesCount", async () => {
    const { accessToken: adminToken } = await registerUser("admin7@example.com", "ADMIN");
    const created = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sampleLesson);
    const lessonId = created.body.data.lesson.id;

    const { accessToken: userToken } = await registerUser("liker@example.com");

    const likeRes = await request(app)
      .post(`/api/lessons/${lessonId}/like`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(likeRes.body.data.liked).toBe(true);
    expect(likeRes.body.data.likesCount).toBe(1);

    const unlikeRes = await request(app)
      .post(`/api/lessons/${lessonId}/like`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(unlikeRes.body.data.liked).toBe(false);
    expect(unlikeRes.body.data.likesCount).toBe(0);
  });

  it("toggles a bookmark and lists it under /bookmarked", async () => {
    const { accessToken: adminToken } = await registerUser("admin8@example.com", "ADMIN");
    const created = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sampleLesson);
    const lessonId = created.body.data.lesson.id;

    const { accessToken: userToken } = await registerUser("bookmarker@example.com");

    await request(app)
      .post(`/api/lessons/${lessonId}/bookmark`)
      .set("Authorization", `Bearer ${userToken}`);

    const listRes = await request(app)
      .get("/api/lessons/bookmarked")
      .set("Authorization", `Bearer ${userToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items).toHaveLength(1);
    expect(listRes.body.data.items[0].isBookmarked).toBe(true);
  });

  it("reflects isLiked/isBookmarked personalization for the viewing user only", async () => {
    const { accessToken: adminToken } = await registerUser("admin9@example.com", "ADMIN");
    const created = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sampleLesson);
    const lessonId = created.body.data.lesson.id;

    const { accessToken: userAToken } = await registerUser("viewerA@example.com");
    const { accessToken: userBToken } = await registerUser("viewerB@example.com");

    await request(app)
      .post(`/api/lessons/${lessonId}/like`)
      .set("Authorization", `Bearer ${userAToken}`);

    const asA = await request(app)
      .get("/api/lessons/how-black-holes-warp-time")
      .set("Authorization", `Bearer ${userAToken}`);
    const asB = await request(app)
      .get("/api/lessons/how-black-holes-warp-time")
      .set("Authorization", `Bearer ${userBToken}`);
    const anonymous = await request(app).get("/api/lessons/how-black-holes-warp-time");

    expect(asA.body.data.lesson.isLiked).toBe(true);
    expect(asB.body.data.lesson.isLiked).toBe(false);
    expect(anonymous.body.data.lesson.isLiked).toBe(false);
  });

  it("allows an admin to update and delete a lesson", async () => {
    const { accessToken } = await registerUser("admin10@example.com", "ADMIN");
    const created = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleLesson);
    const lessonId = created.body.data.lesson.id;

    const updateRes = await request(app)
      .patch(`/api/lessons/${lessonId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ summary: "An updated, punchier summary of the same lesson." });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.lesson.summary).toBe(
      "An updated, punchier summary of the same lesson."
    );

    const deleteRes = await request(app)
      .delete(`/api/lessons/${lessonId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(deleteRes.status).toBe(200);

    const afterDelete = await request(app).get("/api/lessons/how-black-holes-warp-time");
    expect(afterDelete.status).toBe(404);
  });

  it("full-text searches title and summary via `q`", async () => {
    const { accessToken } = await registerUser("admin11@example.com", "ADMIN");
    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleLesson); // "How Black Holes Warp Time"
    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...sampleLesson, title: "The Chemistry of Cooking" });

    const res = await request(app).get("/api/lessons").query({ q: "black holes" });
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toBe(sampleLesson.title);
  });

  it("searches by author name", async () => {
    const { accessToken } = await registerUser("admin12@example.com", "ADMIN");
    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleLesson);

    const res = await request(app).get("/api/lessons").query({ author: "Test User" });
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);

    const noMatch = await request(app).get("/api/lessons").query({ author: "Nobody Real" });
    expect(noMatch.body.data.items).toHaveLength(0);
  });

  it("sorts by popularity (most liked first)", async () => {
    const { accessToken: adminToken } = await registerUser("admin13@example.com", "ADMIN");
    const popular = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...sampleLesson, title: "Popular Lesson" });
    const unpopular = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...sampleLesson, title: "Unpopular Lesson" });

    const { accessToken: likerToken } = await registerUser("popularityliker@example.com");
    await request(app)
      .post(`/api/lessons/${popular.body.data.lesson.id}/like`)
      .set("Authorization", `Bearer ${likerToken}`);

    const res = await request(app).get("/api/lessons").query({ sort: "popular" });
    expect(res.body.data.items[0].title).toBe("Popular Lesson");
  });

  it("sorts by trending (recent likes), falling back to newest when no likes exist", async () => {
    const { accessToken: adminToken } = await registerUser("admin14@example.com", "ADMIN");
    await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...sampleLesson, title: "Older Lesson" });
    const newer = await request(app)
      .post("/api/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ...sampleLesson, title: "Newer Lesson" });

    const res = await request(app).get("/api/lessons").query({ sort: "trending" });
    expect(res.status).toBe(200);
    // Neither lesson has recent likes, so trending falls back to newest-first.
    expect(res.body.data.items[0].title).toBe("Newer Lesson");
    expect(res.body.data.totalItems).toBe(2);
  });
});
