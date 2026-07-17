import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "@/features/auth/api/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const schema = z.object({
  newPassword: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[a-z]/, "Needs a lowercase letter")
    .regex(/[A-Z]/, "Needs an uppercase letter")
    .regex(/[0-9]/, "Needs a number"),
});
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error("Reset link is missing a token.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, values.newPassword);
      toast.success("Password reset! Please log in.");
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Reset link is invalid or expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-dim px-4 dark:bg-ink">
      <Card className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-ink dark:text-paper">
          Set a new password
        </h1>
        <p className="mb-6 text-sm text-ink/60 dark:text-paper/60">
          Choose a strong new password for your account.
        </p>

        {!token ? (
          <p className="rounded-xl bg-ember-500/10 p-4 text-sm text-ember-600 dark:bg-ember-500/20 dark:text-ember-400">
            This link is missing its reset token. Please request a new one.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Reset password
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
