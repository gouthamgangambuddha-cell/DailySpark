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

async function createLesson(accessToken: string, title = "Test Lesson") {
  const res = await request(app)
    .post("/api/lessons")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      title,
      summary: "A summary long enough to pass validation checks.",
      content:
        "Enough lesson content to satisfy the minimum length validation rule for creating a lesson.",
      category: "Science",
    });
  return res.body.data.lesson.id as string;
}

const sampleQuizPayload = {
  title: "Test Quiz",
  xpReward: 30,
  questions: [
    {
      type: "MULTIPLE_CHOICE",
      prompt: "What is 2 + 2?",
      explanation: "Basic addition: 2 + 2 = 4.",
      options: [
        { text: "3", isCorrect: false },
        { text: "4", isCorrect: true },
        { text: "5", isCorrect: false },
      ],
    },
    {
      type: "TRUE_FALSE",
      prompt: "The sky is blue on a clear day.",
      explanation: "Rayleigh scattering makes the sky appear blue.",
      options: [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false },
      ],
    },
    {
      type: "FILL_BLANK",
      prompt: "The chemical symbol for water is ___.",
      explanation: "Water is H2O.",
      correctFillAnswers: ["h2o"],
    },
  ],
};

describe("Quizzes module", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.quizAttempt.deleteMany();
    await prisma.questionOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("rejects quiz creation by a non-admin", async () => {
    const { accessToken } = await registerUser("learner@example.com");
    const lessonId = await createLesson(accessToken); // will 403 before lesson matters, but admin needed to create lesson too

    const res = await request(app)
      .post(`/api/lessons/${lessonId}/quiz`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleQuizPayload);

    expect(res.status).toBe(403);
  });

  it("rejects a multiple-choice question with zero or multiple correct options", async () => {
    const { accessToken } = await registerUser("admin@example.com", "ADMIN");
    const lessonId = await createLesson(accessToken);

    const badPayload = {
      ...sampleQuizPayload,
      questions: [
        {
          type: "MULTIPLE_CHOICE",
          prompt: "Bad question",
          explanation: "N/A",
          options: [
            { text: "A", isCorrect: true },
            { text: "B", isCorrect: true },
          ],
        },
      ],
    };

    const res = await request(app)
      .post(`/api/lessons/${lessonId}/quiz`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(badPayload);

    expect(res.status).toBe(400);
  });

  it("rejects a FILL_BLANK question with no accepted answers", async () => {
    const { accessToken } = await registerUser("admin2@example.com", "ADMIN");
    const lessonId = await createLesson(accessToken);

    const badPayload = {
      ...sampleQuizPayload,
      questions: [{ type: "FILL_BLANK", prompt: "Fill this", explanation: "N/A" }],
    };

    const res = await request(app)
      .post(`/api/lessons/${lessonId}/quiz`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(badPayload);

    expect(res.status).toBe(400);
  });

  it("creates a quiz and serves it without exposing correct answers", async () => {
    const { accessToken } = await registerUser("admin3@example.com", "ADMIN");
    const lessonId = await createLesson(accessToken);

    const createRes = await request(app)
      .post(`/api/lessons/${lessonId}/quiz`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleQuizPayload);
    expect(createRes.status).toBe(201);

    const getRes = await request(app).get(`/api/lessons/${lessonId}/quiz`);
    expect(getRes.status).toBe(200);

    const raw = JSON.stringify(getRes.body);
    expect(raw).not.toContain("isCorrect");
    expect(raw).not.toContain("correctFillAnswers");
    expect(raw).not.toContain("h2o");
  });

  it("prevents creating a second quiz for the same lesson", async () => {
    const { accessToken } = await registerUser("admin4@example.com", "ADMIN");
    const lessonId = await createLesson(accessToken);

    await request(app)
      .post(`/api/lessons/${lessonId}/quiz`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleQuizPayload);

    const second = await request(app)
      .post(`/api/lessons/${lessonId}/quiz`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(sampleQuizPayload);

    expect(second.status).toBe(409);
  });

  it("scores a submission correctly across all question types and awards proportional XP", async () => {
    const { accessToken: adminToken } = await registerUser("admin5@example.com", "ADMIN");
    const lessonId = await createLesson(adminToken);

    const createRes = await request(app)
      .post(`/api/lessons/${lessonId}/quiz`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sampleQuizPayload);
    const quiz = createRes.body.data.quiz;
    const quizId = quiz.id;

    const mcQuestion = quiz.questions.find((q: any) => q.type === "MULTIPLE_CHOICE");
    const tfQuestion = quiz.questions.find((q: any) => q.type === "TRUE_FALSE");
    const fillQuestion = quiz.questions.find((q: any) => q.type === "FILL_BLANK");

    const correctMcOption = mcQuestion.options.find((o: any) => o.isCorrect);
    const wrongTfOption = tfQuestion.options.find((o: any) => !o.isCorrect);

    const { accessToken: userToken } = await registerUser("student@example.com");

    // Get 2 out of 3 right: correct MC, wrong TF, correct fill-blank.
    const submitRes = await request(app)
      .post(`/api/quizzes/${quizId}/submit`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        answers: [
          { questionId: mcQuestion.id, selectedOptionId: correctMcOption.id },
          { questionId: tfQuestion.id, selectedOptionId: wrongTfOption.id },
          { questionId: fillQuestion.id, fillAnswer: "H2O" }, // case-insensitive match
        ],
        timeTakenSeconds: 42,
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.score).toBe(2);
    expect(submitRes.body.data.totalQuestions).toBe(3);
    expect(submitRes.body.data.xpEarned).toBe(20); // round(30 * 2/3) = 20
    expect(submitRes.body.data.results).toHaveLength(3);

    const fillResult = submitRes.body.data.results.find(
      (r: any) => r.questionId === fillQuestion.id
    );
    expect(fillResult.correct).toBe(true);
    expect(fillResult.correctFillAnswers).toEqual(["h2o"]);
  });

  it("rejects a quiz submission from an unauthenticated user", async () => {
    const { accessToken: adminToken } = await registerUser("admin6@example.com", "ADMIN");
    const lessonId = await createLesson(adminToken);
    const createRes = await request(app)
      .post(`/api/lessons/${lessonId}/quiz`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sampleQuizPayload);
    const quizId = createRes.body.data.quiz.id;

    const res = await request(app)
      .post(`/api/quizzes/${quizId}/submit`)
      .send({ answers: [{ questionId: "00000000-0000-0000-0000-000000000000" }] });

    expect(res.status).toBe(401);
  });

  it("records and lists a user's own attempt history", async () => {
    const { accessToken: adminToken } = await registerUser("admin7@example.com", "ADMIN");
    const lessonId = await createLesson(adminToken);
    const createRes = await request(app)
      .post(`/api/lessons/${lessonId}/quiz`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(sampleQuizPayload);
    const quiz = createRes.body.data.quiz;

    const { accessToken: userToken } = await registerUser("history@example.com");
    const fillQuestion = quiz.questions.find((q: any) => q.type === "FILL_BLANK");

    await request(app)
      .post(`/api/quizzes/${quiz.id}/submit`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ answers: [{ questionId: fillQuestion.id, fillAnswer: "h2o" }] });

    const attemptsRes = await request(app)
      .get(`/api/quizzes/${quiz.id}/attempts`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(attemptsRes.status).toBe(200);
    expect(attemptsRes.body.data.attempts).toHaveLength(1);
  });
});
