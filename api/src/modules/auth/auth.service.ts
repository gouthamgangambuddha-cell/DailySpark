import { prisma } from "@dailyspark/db";
import type { PublicUser } from "@dailyspark/types";
import { AppError } from "../../lib/AppError";
import { hashPassword, comparePassword } from "../../lib/password";
import { generateRawToken, hashToken } from "../../lib/token";
import { signAccessToken } from "../../lib/jwt";
import { durationFromNow } from "../../lib/duration";
import { sendEmail, verificationEmailTemplate, passwordResetEmailTemplate } from "../../lib/mailer";
import { verifyGoogleIdToken } from "../../lib/googleAuth";
import { env } from "../../config/env";

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

interface DeviceMeta {
  userAgent?: string;
  ipAddress?: string;
}

async function issueRefreshToken(userId: string, meta: DeviceMeta) {
  const rawToken = generateRawToken();
  await prisma.refreshToken.create({
    data: {
      token: hashToken(rawToken),
      userId,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: durationFromNow(env.JWT_REFRESH_EXPIRES_IN),
    },
  });
  return rawToken;
}

export const authService = {
  async register(input: { name: string; email: string; password: string }, meta: DeviceMeta) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw AppError.conflict("An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
    });

    // Fire off email verification (non-blocking failure doesn't fail registration)
    await authService.sendVerificationEmail(user.id).catch(() => undefined);

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await issueRefreshToken(user.id, meta);

    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async login(input: { email: string; password: string }, meta: DeviceMeta) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    if (!user.isActive) {
      throw AppError.forbidden("This account has been deactivated");
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await issueRefreshToken(user.id, meta);

    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async googleLogin(idToken: string, meta: DeviceMeta) {
    const profile = await verifyGoogleIdToken(idToken);

    let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });

    if (!user) {
      // Check if an account with this email already exists via local signup.
      // If so, link the Google identity to it rather than creating a duplicate.
      const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });

      if (existingByEmail) {
        if (existingByEmail.authProvider === "LOCAL" && !existingByEmail.googleId) {
          user = await prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              googleId: profile.googleId,
              // Trust Google's verified email status; don't downgrade if already true.
              emailVerified: existingByEmail.emailVerified || profile.emailVerified,
              avatarUrl: existingByEmail.avatarUrl ?? profile.avatarUrl,
            },
          });
        } else {
          user = existingByEmail;
        }
      } else {
        user = await prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            googleId: profile.googleId,
            authProvider: "GOOGLE",
            emailVerified: profile.emailVerified,
            passwordHash: null,
          },
        });
      }
    }

    if (!user.isActive) {
      throw AppError.forbidden("This account has been deactivated");
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = await issueRefreshToken(user.id, meta);

    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async refresh(rawToken: string, meta: DeviceMeta) {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash } });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw AppError.unauthorized("Refresh token is invalid or expired");
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized("Account no longer active");
    }

    // Rotate: revoke the old token, issue a new one (mitigates replay attacks)
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const newRefreshToken = await issueRefreshToken(user.id, meta);
    const accessToken = signAccessToken({ sub: user.id, role: user.role });

    return { user: toPublicUser(user), accessToken, refreshToken: newRefreshToken };
  },

  async logout(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    await prisma.refreshToken.updateMany({
      where: { token: tokenHash },
      data: { revoked: true },
    });
  },

  async logoutAllDevices(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  },

  async sendVerificationEmail(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User not found");
    if (user.emailVerified) return;

    const rawToken = generateRawToken();
    await prisma.emailVerificationToken.create({
      data: {
        token: hashToken(rawToken),
        userId: user.id,
        expiresAt: durationFromNow("24h"),
      },
    });

    const verifyUrl = `${env.WEB_URL}/verify-email?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your DailySpark email",
      html: verificationEmailTemplate(user.name, verifyUrl),
    });
  },

  async verifyEmail(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.emailVerificationToken.findUnique({ where: { token: tokenHash } });

    if (!stored || stored.expiresAt < new Date()) {
      throw AppError.badRequest("Verification link is invalid or has expired");
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: stored.userId }, data: { emailVerified: true } }),
      prisma.emailVerificationToken.delete({ where: { id: stored.id } }),
    ]);
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond success-shaped regardless of whether the user exists,
    // to avoid leaking which emails are registered (enumeration protection).
    if (!user) return;

    const rawToken = generateRawToken();
    await prisma.passwordResetToken.create({
      data: {
        token: hashToken(rawToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const resetUrl = `${env.WEB_URL}/reset-password?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your DailySpark password",
      html: passwordResetEmailTemplate(user.name, resetUrl),
    });
  },

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = hashToken(rawToken);
    const stored = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });

    if (!stored || stored.used || stored.expiresAt < new Date()) {
      throw AppError.badRequest("Reset link is invalid or has expired");
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: stored.id }, data: { used: true } }),
      // Invalidate all existing sessions after a password reset, for safety.
      prisma.refreshToken.updateMany({ where: { userId: stored.userId }, data: { revoked: true } }),
    ]);
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User not found");
    return toPublicUser(user);
  },
};
