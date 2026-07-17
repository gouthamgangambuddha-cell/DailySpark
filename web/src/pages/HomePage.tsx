import { Nav } from "@/features/landing/components/Nav";
import { Hero } from "@/features/landing/components/Hero";
import { Features } from "@/features/landing/components/Features";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { Testimonials } from "@/features/landing/components/Testimonials";
import { Pricing } from "@/features/landing/components/Pricing";
import { FAQ } from "@/features/landing/components/FAQ";
import { Contact } from "@/features/landing/components/Contact";
import { Footer } from "@/features/landing/components/Footer";
import { Seo } from "@/components/Seo";

export function HomePage() {
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <Seo
        title="Get smarter in 5 minutes a day"
        description="DailySpark turns five spare minutes into a daily habit of learning — bite-sized lessons, quizzes, streaks, and XP across science, history, code, money, and more."
        path="/"
      />
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
