import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[a-z]/, "Needs a lowercase letter")
    .regex(/[A-Z]/, "Needs an uppercase letter")
    .regex(/[0-9]/, "Needs a number"),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const handleGoogleCredential = async (idToken: string) => {
    try {
      await googleLogin(idToken);
      toast.success("Account ready!");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Google sign-in failed.");
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await registerUser(values.name, values.email, values.password);
      toast.success("Account created! Check your email to verify.");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-dim px-4 dark:bg-ink">
      <Card className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-ink dark:text-paper">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-ink/60 dark:text-paper/60">
          5 minutes a day is all it takes.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
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
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
          <span className="text-xs uppercase text-ink/50">or</span>
          <div className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} />

        <p className="mt-6 text-center text-sm text-ink/60 dark:text-paper/60">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
