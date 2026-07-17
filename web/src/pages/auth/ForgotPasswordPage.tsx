import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { authApi } from "@/features/auth/api/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(values.email);
    } finally {
      // Always show the same success state, regardless of outcome —
      // matches the backend's enumeration-safe response.
      setSent(true);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-dim px-4 dark:bg-ink">
      <Card className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-ink dark:text-paper">
          Forgot your password?
        </h1>
        <p className="mb-6 text-sm text-ink/60 dark:text-paper/60">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <p className="rounded-xl bg-spark-50 p-4 text-sm text-spark-700 dark:bg-spark-700/20 dark:text-spark-300">
            If that email is registered, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Send reset link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink/60 dark:text-paper/60">
          <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Back to login
          </Link>
        </p>
      </Card>
    </div>
  );
}
