import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const redirectAfterAuth = () => {
    const from = (location.state as { from?: string })?.from ?? "/dashboard";
    navigate(from, { replace: true });
  };

  const handleGoogleCredential = async (idToken: string) => {
    try {
      await googleLogin(idToken);
      toast.success("Welcome back!");
      redirectAfterAuth();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Google sign-in failed.");
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success("Welcome back!");
      redirectAfterAuth();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-dim px-4 dark:bg-ink">
      <Card className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-ink dark:text-paper">Welcome back</h1>
        <p className="mb-6 text-sm text-ink/60 dark:text-paper/60">
          Log in to continue your streak.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Log in
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
          <span className="text-xs uppercase text-ink/50">or</span>
          <div className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} />

        <p className="mt-6 text-center text-sm text-ink/60 dark:text-paper/60">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
