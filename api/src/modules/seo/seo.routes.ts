import { Router } from "express";
import { prisma } from "@dailyspark/db";
import { env } from "../../config/env";
import { asyncHandler } from "../../middleware/errorHandler";

export const seoRoutes = Router();

const STATIC_ROUTES = ["", "/lessons", "/leaderboard"];

/**
 * Dynamically generated sitemap covering static routes plus every published
 * lesson. Regenerated on each request rather than cached — fine at current
 * content volume; worth a short-TTL cache if the lesson catalog grows large
 * enough to make this query noticeably slow.
 */
seoRoutes.get(
  "/sitemap.xml",
  asyncHandler(async (_req, res) => {
    const lessons = await prisma.lesson.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    });

    const urls = [
      ...STATIC_ROUTES.map((path) => ({ loc: `${env.WEB_URL}${path}`, lastmod: undefined as string | undefined })),
      ...lessons.map((l) => ({
        loc: `${env.WEB_URL}/lessons/${l.slug}`,
        lastmod: l.updatedAt.toISOString(),
      })),
    ];

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map(
          (u) =>
            `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n` +
            (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : "") +
            `  </url>`
        )
        .join("\n") +
      `\n</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.send(xml);
  })
);

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
