import { useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // No dedicated /contact endpoint yet — this is a placeholder submit
    // handler until a support-ticket or email-forwarding feature is built.
    setTimeout(() => {
      toast.success("Thanks — we'll get back to you within a day or two.");
      e.currentTarget.reset();
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <section id="contact" className="bg-paper-dim/60 py-20 dark:bg-white/5">
      <div className="mx-auto max-w-xl px-5">
        <p className="mb-3 font-mono text-sm uppercase tracking-widest text-ember-500">
          Get in touch
        </p>
        <h2 className="mb-8 font-display text-3xl font-bold text-ink dark:text-paper md:text-4xl">
          Questions, feedback, or a lesson idea?
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name" name="name" required />
          <Input label="Email" type="email" name="email" required />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-sm font-medium text-ink/80 dark:text-paper/80">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={4}
              className="rounded-xl border border-ink/20 bg-paper px-4 py-2.5 text-sm text-ink outline-none transition focus:ring-2 focus:ring-spark-500 dark:border-white/20 dark:bg-ink dark:text-paper"
            />
          </div>
          <Button type="submit" isLoading={isSubmitting} className="self-start">
            Send message
          </Button>
        </form>
      </div>
    </section>
  );
}
