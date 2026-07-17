import { prisma } from "@dailyspark/db";
import type { PublicUser, UpdateProfileRequestDTO, UserStatsDTO } from "@dailyspark/types";
import { AppError } from "../../lib/AppError";
import { comparePassword } from "../../lib/password";
import { getCloudinary } from "../../config/cloudinary";
import { logger } from "../../lib/logger";

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  role: "USER" | "ADMIN";
  emailVerified: boolean;
  preferredLanguage: string;
  interests: string[];
  isPremium: boolean;
  createdAt: Date;
  passwordHash: string | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    emailVerified: user.emailVerified,
    preferredLanguage: user.preferredLanguage,
    interests: user.interests,
    isPremium: user.isPremium,
    createdAt: user.createdAt.toISOString(),
    hasPassword: !!user.passwordHash,
  };
}

function uploadBufferToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  const cloudinary = getCloudinary();
  if (!cloudinary) {
    throw AppError.badRequest("Image uploads are not configured on this server");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "dailyspark/avatars",
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
        transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function countDistinctLessonsCompletedForStats(userId: string): Promise<number> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    select: { quiz: { select: { lessonId: true } } },
  });
  return new Set(attempts.map((a) => a.quiz.lessonId)).size;
}

export const usersService = {
  async updateProfile(userId: string, input: UpdateProfileRequestDTO): Promise<PublicUser> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.interests !== undefined && { interests: input.interests }),
        ...(input.preferredLanguage !== undefined && {
          preferredLanguage: input.preferredLanguage,
        }),
      },
    });
    return toPublicUser(user);
  },

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<PublicUser> {
    const avatarUrl = await uploadBufferToCloudinary(file.buffer, `user_${userId}`);
    const user = await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
    return toPublicUser(user);
  },

  async getStats(userId: string): Promise<UserStatsDTO> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User not found");

    const activeSessionsCount = await prisma.refreshToken.count({
      where: { userId, revoked: false, expiresAt: { gt: new Date() } },
    });

    const daysSinceJoining = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      memberSince: user.createdAt.toISOString(),
      daysSinceJoining,
      emailVerified: user.emailVerified,
      isPremium: user.isPremium,
      interestsCount: user.interests.length,
      activeSessionsCount,
      // Now backed by real gamification data (Step 7) instead of placeholders.
      currentStreak: user.currentStreak,
      totalXp: user.totalXp,
      lessonsCompleted: await countDistinctLessonsCompletedForStats(userId),
      quizzesCompleted: await prisma.quizAttempt.count({ where: { userId } }),
    };
  },

  async deleteAccount(userId: string, password?: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User not found");

    if (user.passwordHash) {
      // Local-auth accounts must re-confirm their password before deletion.
      if (!password) {
        throw AppError.badRequest("Password is required to delete this account");
      }
      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) {
        throw AppError.unauthorized("Incorrect password");
      }
    }

    // Best-effort cleanup of the Cloudinary avatar; deletion proceeds either way.
    const cloudinary = getCloudinary();
    if (cloudinary && user.avatarUrl) {
      cloudinary.uploader.destroy(`dailyspark/avatars/user_${userId}`).catch((err: unknown) => {
        logger.warn("Failed to delete avatar from Cloudinary during account deletion", {
          userId,
          error: String(err),
        });
      });
    }

    // Cascade deletes handle RefreshToken/EmailVerificationToken/PasswordResetToken
    // via the `onDelete: Cascade` relations defined in schema.prisma.
    await prisma.user.delete({ where: { id: userId } });
  },
};
