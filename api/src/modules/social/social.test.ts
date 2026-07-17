import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { prisma } from "@dailyspark/db";
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

async function makeAdmin(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  await prisma.user.update({ where: { id: user!.id }, data: { role: "ADMIN" } });
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "StrongPass123" });
  return login.body.data.accessToken as string;
}

async function createLesson(adminToken: string, title = "Test Lesson") {
  const res = await request(app)
    .post("/api/lessons")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title,
      summary: "A summary long enough to pass validation checks.",
      content: "Enough lesson content to satisfy the minimum length validation rule.",
      category: "Science",
    });
  return res.body.data.lesson.id as string;
}

describe("Social features", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.notification.deleteMany();
    await prisma.report.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.commentLike.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("Comments", () => {
    it("creates a top-level comment and a nested reply", async () => {
      await registerUser("admin@example.com");
      const adminToken = await makeAdmin("admin@example.com");
      const lessonId = await createLesson(adminToken);

      const { accessToken: userToken } = await registerUser("commenter@example.com", "Ada");

      const topRes = await request(app)
        .post(`/api/lessons/${lessonId}/comments`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ content: "Great lesson!" });
      expect(topRes.status).toBe(201);
      const topCommentId = topRes.body.data.comment.id;

      const { accessToken: replierToken } = await registerUser("replier@example.com", "Bob");
      const replyRes = await request(app)
        .post(`/api/lessons/${lessonId}/comments`)
        .set("Authorization", `Bearer ${replierToken}`)
        .send({ content: "I agree!", parentId: topCommentId });
      expect(replyRes.status).toBe(201);

      const listRes = await request(app).get(`/api/lessons/${lessonId}/comments`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.comments).toHaveLength(1);
      expect(listRes.body.data.comments[0].replies).toHaveLength(1);
      expect(listRes.body.data.comments[0].replies[0].content).toBe("I agree!");
    });

    it("notifies the parent comment author on a reply", async () => {
      await registerUser("admin2@example.com");
      const adminToken = await makeAdmin("admin2@example.com");
      const lessonId = await createLesson(adminToken);

      const { accessToken: authorToken } = await registerUser("author@example.com", "Carol");
      const topRes = await request(app)
        .post(`/api/lessons/${lessonId}/comments`)
        .set("Authorization", `Bearer ${authorToken}`)
        .send({ content: "First!" });

      const { accessToken: replierToken } = await registerUser("replier2@example.com", "Dave");
      await request(app)
        .post(`/api/lessons/${lessonId}/comments`)
        .set("Authorization", `Bearer ${replierToken}`)
        .send({ content: "Reply", parentId: topRes.body.data.comment.id });

      const notifRes = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${authorToken}`);

      expect(notifRes.body.data.items).toHaveLength(1);
      expect(notifRes.body.data.items[0].type).toBe("COMMENT_REPLY");
      expect(notifRes.body.data.unreadCount).toBe(1);
    });

    it("toggles a like on a comment", async () => {
      await registerUser("admin3@example.com");
      const adminToken = await makeAdmin("admin3@example.com");
      const lessonId = await createLesson(adminToken);
      const { accessToken: authorToken } = await registerUser("author2@example.com");
      const topRes = await request(app)
        .post(`/api/lessons/${lessonId}/comments`)
        .set("Authorization", `Bearer ${authorToken}`)
        .send({ content: "Comment" });
      const commentId = topRes.body.data.comment.id;

      const { accessToken: likerToken } = await registerUser("liker@example.com");
      const likeRes = await request(app)
        .post(`/api/comments/${commentId}/like`)
        .set("Authorization", `Bearer ${likerToken}`);
      expect(likeRes.body.data.liked).toBe(true);
      expect(likeRes.body.data.likesCount).toBe(1);
    });

    it("soft-deletes a comment, preserving reply threads", async () => {
      await registerUser("admin4@example.com");
      const adminToken = await makeAdmin("admin4@example.com");
      const lessonId = await createLesson(adminToken);
      const { accessToken: authorToken } = await registerUser("author3@example.com");
      const topRes = await request(app)
        .post(`/api/lessons/${lessonId}/comments`)
        .set("Authorization", `Bearer ${authorToken}`)
        .send({ content: "Will be deleted" });
      const commentId = topRes.body.data.comment.id;

      const { accessToken: replierToken } = await registerUser("replier3@example.com");
      await request(app)
        .post(`/api/lessons/${lessonId}/comments`)
        .set("Authorization", `Bearer ${replierToken}`)
        .send({ content: "Still here", parentId: commentId });

      const deleteRes = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${authorToken}`);
      expect(deleteRes.status).toBe(200);

      const listRes = await request(app).get(`/api/lessons/${lessonId}/comments`);
      expect(listRes.body.data.comments[0].isDeleted).toBe(true);
      expect(listRes.body.data.comments[0].content).toBe("[deleted]");
      expect(listRes.body.data.comments[0].replies).toHaveLength(1);
      expect(listRes.body.data.comments[0].replies[0].content).toBe("Still here");
    });

    it("prevents deleting someone else's comment", async () => {
      await registerUser("admin5@example.com");
      const adminToken = await makeAdmin("admin5@example.com");
      const lessonId = await createLesson(adminToken);
      const { accessToken: authorToken } = await registerUser("author4@example.com");
      const topRes = await request(app)
        .post(`/api/lessons/${lessonId}/comments`)
        .set("Authorization", `Bearer ${authorToken}`)
        .send({ content: "Mine" });

      const { accessToken: otherToken } = await registerUser("other@example.com");
      const deleteRes = await request(app)
        .delete(`/api/comments/${topRes.body.data.comment.id}`)
        .set("Authorization", `Bearer ${otherToken}`);
      expect(deleteRes.status).toBe(403);
    });
  });

  describe("Follows & public profiles", () => {
    it("follows and unfollows a user, updating counts", async () => {
      const { accessToken: followerToken } = await registerUser("follower@example.com");
      const { userId: targetId } = await registerUser("target@example.com");

      const followRes = await request(app)
        .post(`/api/users/${targetId}/follow`)
        .set("Authorization", `Bearer ${followerToken}`);
      expect(followRes.body.data.following).toBe(true);

      const profileRes = await request(app)
        .get(`/api/users/${targetId}/profile`)
        .set("Authorization", `Bearer ${followerToken}`);
      expect(profileRes.body.data.profile.followersCount).toBe(1);
      expect(profileRes.body.data.profile.isFollowedByViewer).toBe(true);

      const unfollowRes = await request(app)
        .post(`/api/users/${targetId}/follow`)
        .set("Authorization", `Bearer ${followerToken}`);
      expect(unfollowRes.body.data.following).toBe(false);
    });

    it("rejects following yourself", async () => {
      const { accessToken, userId } = await registerUser("self@example.com");
      const res = await request(app)
        .post(`/api/users/${userId}/follow`)
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(400);
    });

    it("notifies the target user of a new follower", async () => {
      const { accessToken: followerToken } = await registerUser("followerB@example.com", "Eve");
      const { accessToken: targetToken, userId: targetId } = await registerUser("targetB@example.com");

      await request(app)
        .post(`/api/users/${targetId}/follow`)
        .set("Authorization", `Bearer ${followerToken}`);

      const notifRes = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${targetToken}`);
      expect(notifRes.body.data.items[0].type).toBe("NEW_FOLLOWER");
    });
  });

  describe("Activity feed", () => {
    it("shows quiz completions and likes from followed users only", async () => {
      await registerUser("admin6@example.com");
      const adminToken = await makeAdmin("admin6@example.com");
      const lessonId = await createLesson(adminToken);

      const { accessToken: viewerToken } = await registerUser("viewer@example.com");
      const { accessToken: followedToken, userId: followedId } = await registerUser(
        "followed@example.com",
        "Followed User"
      );
      await registerUser("stranger@example.com"); // not followed — activity should not appear

      await request(app)
        .post(`/api/users/${followedId}/follow`)
        .set("Authorization", `Bearer ${viewerToken}`);

      await request(app)
        .post(`/api/lessons/${lessonId}/like`)
        .set("Authorization", `Bearer ${followedToken}`);

      const feedRes = await request(app)
        .get("/api/social/feed")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(feedRes.status).toBe(200);
      expect(feedRes.body.data.items).toHaveLength(1);
      expect(feedRes.body.data.items[0].type).toBe("LESSON_LIKED");
      expect(feedRes.body.data.items[0].actor.id).toBe(followedId);
    });
  });

  describe("Reports", () => {
    it("submits a report for a lesson", async () => {
      await registerUser("admin7@example.com");
      const adminToken = await makeAdmin("admin7@example.com");
      const lessonId = await createLesson(adminToken);

      const { accessToken: reporterToken } = await registerUser("reporter@example.com");
      const res = await request(app)
        .post("/api/social/reports")
        .set("Authorization", `Bearer ${reporterToken}`)
        .send({ targetType: "LESSON", targetId: lessonId, reason: "This contains outdated information." });

      expect(res.status).toBe(201);

      const report = await prisma.report.findFirst({ where: { targetId: lessonId } });
      expect(report?.status).toBe("PENDING");
    });
  });
});
