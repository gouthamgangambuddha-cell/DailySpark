import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const BADGE_DEFINITIONS = [
  { code: "first_spark", name: "First Spark", description: "Complete your very first quiz.", icon: "✨" },
  { code: "week_streak", name: "One Week Lit", description: "Keep a 7-day streak alive.", icon: "🔥" },
  { code: "month_streak", name: "Unquenchable", description: "Keep a 30-day streak alive.", icon: "🕯️" },
  { code: "century_club", name: "Century Club", description: "Earn 100 total XP.", icon: "💯" },
  { code: "xp_1000", name: "Bright Mind", description: "Earn 1,000 total XP.", icon: "🧠" },
  { code: "perfect_score", name: "Perfect Spark", description: "Get every question right on a quiz.", icon: "🎯" },
  { code: "ten_lessons", name: "Ten Down", description: "Complete quizzes for 10 different lessons.", icon: "📚" },
];

async function main() {
  for (const def of BADGE_DEFINITIONS) {
    await prisma.badge.upsert({ where: { code: def.code }, update: def, create: def });
  }
  console.log(`Seeded ${BADGE_DEFINITIONS.length} badge definitions`);

  const passwordHash = await bcrypt.hash("StrongPass123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dailyspark.app" },
    update: {},
    create: {
      name: "DailySpark Team",
      email: "admin@dailyspark.app",
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const lessons = [
    {
      title: "How Black Holes Warp Time",
      summary:
        "A quick look at gravitational time dilation near a black hole's event horizon.",
      content:
        "Black holes are regions of spacetime where gravity is so strong that nothing, not even light, can escape.\n\n" +
        "Near the event horizon, time itself slows down relative to a distant observer — a real, measurable effect called gravitational time dilation. " +
        "An astronaut falling toward a black hole would notice nothing unusual about their own time, but an observer watching from far away would see them appear to slow down and freeze at the horizon, their image growing dimmer and redder forever.\n\n" +
        "This isn't science fiction — GPS satellites already correct for a much smaller version of this same effect caused by Earth's comparatively gentle gravity.",
      category: "Space",
      tags: ["physics", "relativity", "astronomy"],
      difficulty: "INTERMEDIATE" as const,
      estimatedReadingMinutes: 5,
    },
    {
      title: "The Compound Interest Trap (and Gift)",
      summary: "Why starting five years earlier can matter more than saving twice as much.",
      content:
        "Compound interest means you earn returns not just on your original money, but on the returns it already made.\n\n" +
        "Left alone, a modest sum roughly doubles every decade at typical long-term market returns. That means someone who invests for 10 extra years, even with smaller monthly contributions, often ends up with more than someone who starts later but contributes more aggressively.\n\n" +
        "The flip side: the same math works against you with high-interest debt. A credit card balance compounds just as relentlessly — which is why paying it down early is often the best 'investment' available to most people.",
      category: "Finance",
      tags: ["money", "investing"],
      difficulty: "BEGINNER" as const,
      estimatedReadingMinutes: 4,
    },
    {
      title: "Why Your Brain Loves a Good Cliffhanger",
      summary: "The psychology of the Zeigarnik effect and unfinished tasks.",
      content:
        "In the 1920s, psychologist Bluma Zeigarnik noticed that waiters remembered unpaid orders far better than ones that had already been settled.\n\n" +
        "This became known as the Zeigarnik effect: our brains hold on to incomplete tasks more tightly than finished ones, creating a mild, nagging tension until they're resolved. It's a big part of why cliffhangers work in television, why an unfinished to-do list can feel loud in your head, and why 'just five more minutes' of a task can be hard to resist once you're mid-way through.\n\n" +
        "Writers, product designers, and yes, habit-based learning apps, lean on this constantly — including, deliberately, this one.",
      category: "Psychology",
      tags: ["cognition", "habits"],
      difficulty: "BEGINNER" as const,
      estimatedReadingMinutes: 4,
    },
    {
      title: "What Actually Happens When You Run `git commit`",
      summary: "A tour under the hood of Git's object model.",
      content:
        "When you run `git commit`, Git doesn't just save a diff — it takes a full snapshot of your entire staged file tree, made cheap by content-addressable storage.\n\n" +
        "Every file's contents get hashed into a 'blob' object. Every directory structure becomes a 'tree' object pointing to blobs and other trees. The commit itself is a small object pointing to one tree (your project's root at that moment), plus a pointer to its parent commit, forming the chain of history you see in `git log`.\n\n" +
        "Because objects are addressed by the hash of their content, two commits with an identical file automatically share the same blob on disk — Git deduplicates for free, which is part of why cloning even large repositories is often faster than people expect.",
      category: "Programming",
      tags: ["git", "tools"],
      difficulty: "INTERMEDIATE" as const,
      estimatedReadingMinutes: 6,
    },
    {
      title: "The Day Two Empires Traded Places",
      summary: "How the Battle of Ain Jalut quietly reshaped the medieval world.",
      content:
        "In 1260, the Mongol Empire had swept across Asia and into the Middle East, having sacked Baghdad just two years earlier and seeming unstoppable.\n\n" +
        "At Ain Jalut, in present-day Israel, the Mamluk Sultanate of Egypt handed the Mongols their first major, decisive defeat — helped by careful terrain choice, feigned retreats, and gunpowder-based hand cannons, among the earliest recorded battlefield use of the technology.\n\n" +
        "The battle halted the westward Mongol advance for good, preserved Egypt and the Levant from Mongol rule, and left the Mamluks as a major regional power for the next 250 years — a hinge point most world history courses rush past in a single sentence.",
      category: "History",
      tags: ["medieval", "military history"],
      difficulty: "INTERMEDIATE" as const,
      estimatedReadingMinutes: 5,
    },
    {
      title: "The Placebo Effect Is Not 'Just in Your Head'",
      summary: "What placebos reveal about the biology of expectation.",
      content:
        "Placebos reliably outperform no treatment at all across a wide range of conditions — not because nothing is happening, but because expectation itself triggers measurable biological changes.\n\n" +
        "In pain studies, placebo treatment can trigger the release of the body's own opioid-like painkillers, an effect that can be blocked with naloxone, the same drug used to reverse opioid overdoses — strong evidence the effect is physiological, not merely psychological in some dismissive sense.\n\n" +
        "This is also why well-designed drug trials use double-blind, placebo-controlled designs: without them, a genuinely inert treatment can look like it's working, simply because belief itself is doing real biological work.",
      category: "Health",
      tags: ["medicine", "biology"],
      difficulty: "ADVANCED" as const,
      estimatedReadingMinutes: 5,
    },
  ];

  for (const lesson of lessons) {
    const slug = lesson.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-");

    await prisma.lesson.upsert({
      where: { slug },
      update: {},
      create: {
        ...lesson,
        slug,
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date(),
        references: [],
      },
    });
  }

  console.log(`Seeded ${lessons.length} lessons and admin user (admin@dailyspark.app / StrongPass123)`);

  const blackHolesLesson = await prisma.lesson.findUnique({
    where: { slug: "how-black-holes-warp-time" },
  });

  if (blackHolesLesson) {
    await prisma.quiz.upsert({
      where: { lessonId: blackHolesLesson.id },
      update: {},
      create: {
        lessonId: blackHolesLesson.id,
        title: "Black Holes & Time Quiz",
        timeLimitSeconds: 120,
        xpReward: 30,
        questions: {
          create: [
            {
              type: "MULTIPLE_CHOICE",
              prompt: "What is the name of the boundary around a black hole from which nothing can escape?",
              explanation:
                "The event horizon marks the point of no return — once past it, not even light can escape the black hole's gravity.",
              order: 0,
              options: {
                create: [
                  { text: "Event horizon", isCorrect: true, order: 0 },
                  { text: "Photon sphere", isCorrect: false, order: 1 },
                  { text: "Accretion disk", isCorrect: false, order: 2 },
                ],
              },
            },
            {
              type: "TRUE_FALSE",
              prompt: "GPS satellites already correct for gravitational time dilation.",
              explanation:
                "True — GPS satellites experience time slightly differently than clocks on Earth due to both gravity and their orbital speed, and this is corrected for constantly.",
              order: 1,
              options: {
                create: [
                  { text: "True", isCorrect: true, order: 0 },
                  { text: "False", isCorrect: false, order: 1 },
                ],
              },
            },
            {
              type: "FILL_BLANK",
              prompt: "An observer far away watching someone fall into a black hole would see them appear to ___ at the horizon.",
              explanation:
                "From a distant observer's perspective, the infalling object appears to slow down and freeze at the event horizon, growing dimmer over time.",
              order: 2,
              correctFillAnswers: ["freeze", "stop", "slow down"],
            },
          ],
        },
      },
    });
    console.log("Seeded a quiz for 'How Black Holes Warp Time'");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
