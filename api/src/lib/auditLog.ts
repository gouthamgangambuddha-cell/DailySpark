import { prisma } from "@dailyspark/db";
import { logger } from "./logger";

export async function recordAuditLog(input: {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata,
      },
    });
  } catch (err) {
    logger.error("Failed to write audit log entry", { action: input.action, error: String(err) });
  }
}
