import { prisma } from "@dailyspark/db";
import { AppError } from "../../lib/AppError";
import { toDateOnlyUTC } from "../../lib/dateOnly";
import type { AiQuotaDTO } from "@dailyspark/types";

export const FREE_DAILY_AI_LIMIT = 10;

export const aiQuota = {
  async checkAndConsume(userId: string): Promise<number | null> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.isPremium) {
      await this.recordUsage(userId, user);
      return null;
    }

    const today = toDateOnlyUTC(new Date());
    const isNewDay =
      !user.dailyAiRequestDate || toDateOnlyUTC(user.dailyAiRequestDate).getTime() !== today.getTime();
    const currentCount = isNewDay ? 0 : user.dailyAiRequestCount;

    if (currentCount >= FREE_DAILY_AI_LIMIT) {
      throw AppError.tooMany(
        `You've used all ${FREE_DAILY_AI_LIMIT} free AI requests for today. Upgrade to Premium for unlimited access, or try again tomorrow.`
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { dailyAiRequestCount: currentCount + 1, dailyAiRequestDate: today },
    });

    return FREE_DAILY_AI_LIMIT - (currentCount + 1);
  },

  async recordUsage(
    userId: string,
    user: { dailyAiRequestDate: Date | null; dailyAiRequestCount: number }
  ) {
    const today = toDateOnlyUTC(new Date());
    const isNewDay =
      !user.dailyAiRequestDate || toDateOnlyUTC(user.dailyAiRequestDate).getTime() !== today.getTime();
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyAiRequestCount: isNewDay ? 1 : user.dailyAiRequestCount + 1,
        dailyAiRequestDate: today,
      },
    });
  },

  async getQuota(userId: string): Promise<AiQuotaDTO> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.isPremium) return { used: user.dailyAiRequestCount, limit: null, remaining: null };

    const today = toDateOnlyUTC(new Date());
    const isNewDay =
      !user.dailyAiRequestDate || toDateOnlyUTC(user.dailyAiRequestDate).getTime() !== today.getTime();
    const used = isNewDay ? 0 : user.dailyAiRequestCount;

    return { used, limit: FREE_DAILY_AI_LIMIT, remaining: Math.max(0, FREE_DAILY_AI_LIMIT - used) };
  },
};
