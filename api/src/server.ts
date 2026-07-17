import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { gamificationService } from "./modules/gamification/gamification.service";

const app = createApp();

gamificationService
  .ensureBadgesSeeded()
  .catch((err) => logger.error("Failed to seed badge definitions", { error: String(err) }));

app.listen(env.PORT, () => {
  logger.info(`🚀 DailySpark API running on ${env.API_URL} [${env.NODE_ENV}]`);
});
