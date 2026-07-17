import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { prisma } from "@dailyspark/db";
import { createApp } from "../../app";
import { gamificationService } from "./gamification.service";

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

async function createLessonWithQuiz(adminToken: string, title: string, xpReward = 100) {
  const lessonRes = await request(app)
    .post("/api/lessons")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title,
      summary: "A summary long enough to pass validation checks.",
      content: "Enough lesson content to satisfy the minimum length validation rule.",
      category: "Science",
    });
  const lessonId = lessonRes.body.data.lesson.id as string;

  const quizRes = await request(app)
    .post(`/api/lessons/${lessonId}/quiz`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title: `${title} Quiz`,
      xpReward,
      questions: [
        {
          type: "MULTIPLE_CHOICE",
          prompt: "2 + 2?",
          explanation: "It's 4.",
          options: [
            { text: "3", isCorrect: false },
            { text: "4", isCorrect: true },
          ],
        },
      ],
    });

  return { lessonId, quiz: quizRes.body.data.quiz };
}

describe("Gamification module", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await gamificationService.ensureBadgesSeeded();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.xpEvent.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.questionOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it("awards XP and updates level/streak after a quiz submission", async () => {
    const { accessToken: adminToken } = await registerUser("admin@example.com", "ADMIN");
    const { quiz } = await createLessonWithQuiz(adminToken, "Lesson One", 100);

    const { accessToken: userToken } = await registerUser("student@example.com");
    const correctOption = quiz.questions[0].options.find((o: any) => o.text === "4");

    const submitRes = await request(app)
      .post(`/api/quizzes/${quiz.id}/submit`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ answers: [{ questionId: quiz.questions[0].id, selectedOptionId: correctOption.id }] });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.gamification.xpEarned).toBe(100);
    expect(submitRes.body.data.gamification.totalXp).toBe(100);
    expect(submitRes.body.data.gamification.level).toBe(2); // 100 XP = level 2 under 100-XP-per-level
    expect(submitRes.body.data.gamification.leveledUp).toBe(true);
    expect(submitRes.body.data.gamification.currentStreak).toBe(1);
  });

  it("awards the first_spark and century_club badges on a first 100-XP quiz", async () => {
    const { accessToken: adminToken } = await registerUser("admin2@example.com", "ADMIN");
    const { quiz } = await createLessonWithQuiz(adminToken, "Lesson Two", 100);

    const { accessToken: userToken } = await registerUser("badger@example.com");
    const correctOption = quiz.questions[0].options.find((o: any) => o.text === "4");

    const submitRes = await request(app)
      .post(`/api/quizzes/${quiz.id}/submit`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ answers: [{ questionId: quiz.questions[0].id, selectedOptionId: correctOption.id }] });

    const badgeCodes = submitRes.body.data.gamification.newBadges.map((b: any) => b.code);
    expect(badgeCodes).toContain("first_spark");
    expect(badgeCodes).toContain("century_club");
    expect(badgeCodes).toContain("perfect_score");
  });

  it("does not re-award a badge the user already has", async () => {
    const { accessToken: adminToken } = await registerUser("admin3@example.com", "ADMIN");
    const { quiz: quiz1 } = await createLessonWithQuiz(adminToken, "Lesson A", 50);
    const { quiz: quiz2 } = await createLessonWithQuiz(adminToken, "Lesson B", 50);

    const { accessToken: userToken } = await registerUser("repeat@example.com");
    const opt1 = quiz1.questions[0].options.find((o: any) => o.text === "4");
    const opt2 = quiz2.questions[0].options.find((o: any) => o.text === "4");

    const first = await request(app)
      .post(`/api/quizzes/${quiz1.id}/submit`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ answers: [{ questionId: quiz1.questions[0].id, selectedOptionId: opt1.id }] });
    const second = await request(app)
      .post(`/api/quizzes/${quiz2.id}/submit`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ answers: [{ questionId: quiz2.questions[0].id, selectedOptionId: opt2.id }] });

    const firstBadges = first.body.data.gamification.newBadges.map((b: any) => b.code);
    const secondBadges = second.body.data.gamification.newBadges.map((b: any) => b.code);

    expect(firstBadges).toContain("first_spark");
    expect(secondBadges).not.toContain("first_spark"); // already earned
  });

  it("returns a full gamification summary including locked and earned badges", async () => {
    const { accessToken: adminToken } = await registerUser("admin4@example.com", "ADMIN");
    const { quiz } = await createLessonWithQuiz(adminToken, "Lesson C", 100);

    const { accessToken: userToken } = await registerUser("summary@example.com");
    const correctOption = quiz.questions[0].options.find((o: any) => o.text === "4");

    await request(app)
      .post(`/api/quizzes/${quiz.id}/submit`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ answers: [{ questionId: quiz.questions[0].id, selectedOptionId: correctOption.id }] });

    const summaryRes = await request(app)
      .get("/api/gamification/me")
      .set("Authorization", `Bearer ${userToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.summary.totalXp).toBe(100);
    expect(summaryRes.body.data.summary.level).toBe(2);
    expect(summaryRes.body.data.summary.lessonsCompleted).toBe(1);
    expect(summaryRes.body.data.summary.quizzesCompleted).toBe(1);

    const earnedBadge = summaryRes.body.data.summary.badges.find((b: any) => b.code === "first_spark");
    const lockedBadge = summaryRes.body.data.summary.badges.find((b: any) => b.code === "month_streak");
    expect(earnedBadge.earned).toBe(true);
    expect(lockedBadge.earned).toBe(false);
  });

  it("ranks users on the all-time leaderboard by totalXp descending", async () => {
    const { accessToken: adminToken } = await registerUser("admin5@example.com", "ADMIN");
    const { quiz: quizA } = await createLessonWithQuiz(adminToken, "Lesson D", 100);
    const { quiz: quizB } = await createLessonWithQuiz(adminToken, "Lesson E", 50);

    const { accessToken: tokenA, userId: userIdA } = await registerUser("leaderA@example.com");
    const { accessToken: tokenB } = await registerUser("leaderB@example.com");

    const optA = quizA.questions[0].options.find((o: any) => o.text === "4");
    const optB = quizB.questions[0].options.find((o: any) => o.text === "4");

    await request(app)
      .post(`/api/quizzes/${quizA.id}/submit`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ answers: [{ questionId: quizA.questions[0].id, selectedOptionId: optA.id }] });
    await request(app)
      .post(`/api/quizzes/${quizB.id}/submit`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ answers: [{ questionId: quizB.questions[0].id, selectedOptionId: optB.id }] });

    const leaderboardRes = await request(app)
      .get("/api/gamification/leaderboard")
      .query({ scope: "allTime" });

    expect(leaderboardRes.status).toBe(200);
    expect(leaderboardRes.body.data.entries[0].userId).toBe(userIdA);
    expect(leaderboardRes.body.data.entries[0].xp).toBe(100);
    expect(leaderboardRes.body.data.entries[1].xp).toBe(50);
  });
});
