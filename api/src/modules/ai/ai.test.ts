import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import { prisma } from "@dailyspark/db";

vi.mock("../../lib/anthropic", () => ({
  askClaude: vi.fn(async (_system: string, userPrompt: string) => {
    return `Mock explanation responding to: ${userPrompt.slice(0, 30)}...`;
  }),
  askClaudeForJSON: vi.fn(async (_system: string, userPrompt: string) => {
    if (userPrompt.includes("flashcards")) {
      return {
        flashcards: [
          { front: "What is X?", back: "X is Y." },
          { front: "What is Z?", back: "Z is W." },
        ],
      };
    }
    if (userPrompt.includes("practice questions")) {
      return { questions: [{ question: "Explain X.", answer: "X is Y because..." }] };
    }
    if (userPrompt.includes("Translate")) {
      return {
        title: "Título traducido",
        summary: "Resumen traducido",
        content: "Contenido traducido",
      };
    }
    return {};
  }),
}));

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

async function createLesson(adminToken: string, title = "Test Lesson", category = "Science") {
  const res = await request(app)
    .post("/api/lessons")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title,
      summary: "A summary long enough to pass validation checks.",
      content: "Enough lesson content to satisfy the minimum length validation rule.",
      category,
    });
  return res.body.data.lesson.id as string;
}

describe("AI features", () => {
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

  it("explains a concept grounded in the lesson content", async () => {
    const { accessToken: adminToken } = await registerUser("admin@example.com", "ADMIN");
    const lessonId = await createLesson(adminToken);
    const { accessToken: userToken } = await registerUser("learner@example.com");

    const res = await request(app)
      .post("/api/ai/explain")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ lessonId, question: "Can you explain this more simply?" });

    expect(res.status).toBe(200);
    expect(res.body.data.answer).toContain("Mock explanation");
    expect(res.body.data.remainingToday).toBe(9);
  });

  it("generates flashcards from a lesson", async () => {
    const { accessToken: adminToken } = await registerUser("admin2@example.com", "ADMIN");
    const lessonId = await createLesson(adminToken);
    const { accessToken: userToken } = await registerUser("learner2@example.com");

    const res = await request(app)
      .post("/api/ai/flashcards")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ lessonId });

    expect(res.status).toBe(200);
    expect(res.body.data.flashcards).toHaveLength(2);
    expect(res.body.data.flashcards[0].front).toBe("What is X?");
  });

  it("generates practice questions from a lesson", async () => {
    const { accessToken: adminToken } = await registerUser("admin3@example.com", "ADMIN");
    const lessonId = await createLesson(adminToken);
    const { accessToken: userToken } = await registerUser("learner3@example.com");

    const res = await request(app)
      .post("/api/ai/practice-questions")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ lessonId });

    expect(res.status).toBe(200);
    expect(res.body.data.questions).toHaveLength(1);
  });

  it("translates a lesson into the requested language", async () => {
    const { accessToken: adminToken } = await registerUser("admin4@example.com", "ADMIN");
    const lessonId = await createLesson(adminToken);
    const { accessToken: userToken } = await registerUser("learner4@example.com");

    const res = await request(app)
      .post("/api/ai/translate")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ lessonId, targetLanguage: "es" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Título traducido");
  });

  it("rejects an unsupported target language", async () => {
    const { accessToken: adminToken } = await registerUser("admin5@example.com", "ADMIN");
    const lessonId = await createLesson(adminToken);
    const { accessToken: userToken } = await registerUser("learner5@example.com");

    const res = await request(app)
      .post("/api/ai/translate")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ lessonId, targetLanguage: "xx" });

    expect(res.status).toBe(400);
  });

  it("enforces the free-tier daily AI quota", async () => {
    const { accessToken: adminToken } = await registerUser("admin6@example.com", "ADMIN");
    const lessonId = await createLesson(adminToken);
    const { accessToken: userToken } = await registerUser("learner6@example.com");

    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post("/api/ai/explain")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ lessonId, question: `Question number ${i}` });
      expect(res.status).toBe(200);
    }

    const overLimitRes = await request(app)
      .post("/api/ai/explain")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ lessonId, question: "One too many" });

    expect(overLimitRes.status).toBe(429);
  });

  it("does not enforce a quota for premium users", async () => {
    const { accessToken: adminToken } = await registerUser("admin7@example.com", "ADMIN");
    const lessonId = await createLesson(adminToken);
    const { accessToken: userToken, userId } = await registerUser("premium@example.com");
    await prisma.user.update({ where: { id: userId }, data: { isPremium: true } });

    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post("/api/ai/explain")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ lessonId, question: `Question ${i}` });
      expect(res.status).toBe(200);
      expect(res.body.data.remainingToday).toBeNull();
    }
  });

  it("reports quota status via GET /api/ai/quota", async () => {
    const { accessToken: userToken } = await registerUser("learner7@example.com");
    const res = await request(app)
      .get("/api/ai/quota")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.quota.limit).toBe(10);
    expect(res.body.data.quota.remaining).toBe(10);
  });

  it("recommends lessons matching the user's interests, excluding already-liked ones", async () => {
    const { accessToken: adminToken } = await registerUser("admin8@example.com", "ADMIN");
    const spaceLessonId = await createLesson(adminToken, "Space Lesson", "Space");
    await createLesson(adminToken, "History Lesson", "History");

    const { accessToken: userToken, userId } = await registerUser("recommender@example.com");
    await prisma.user.update({ where: { id: userId }, data: { interests: ["Space"] } });

    const res = await request(app)
      .get("/api/ai/recommendations")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.lessons.some((l: any) => l.id === spaceLessonId)).toBe(true);
  });

  it("excludes lessons the user already liked from recommendations", async () => {
    const { accessToken: adminToken } = await registerUser("admin9@example.com", "ADMIN");
    const spaceLessonId = await createLesson(adminToken, "Space Lesson 2", "Space");

    const { accessToken: userToken, userId } = await registerUser("recommender2@example.com");
    await prisma.user.update({ where: { id: userId }, data: { interests: ["Space"] } });

    await request(app)
      .post(`/api/lessons/${spaceLessonId}/like`)
      .set("Authorization", `Bearer ${userToken}`);

    const res = await request(app)
      .get("/api/ai/recommendations")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.body.data.lessons.some((l: any) => l.id === spaceLessonId)).toBe(false);
  });
});
