import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "@/features/auth/api/authApi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Status = "verifying" | "success" | "error";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err?.response?.data?.message ?? "This verification link is invalid or expired.");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-dim px-4 dark:bg-ink">
      <Card className="w-full max-w-md text-center">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-ink/70 dark:text-paper/60">Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="mb-2 text-2xl font-bold text-ink dark:text-paper">
              Email verified! 🎉
            </h1>
            <p className="mb-6 text-ink/70 dark:text-paper/60">
              Your account is now fully active.
            </p>
            <Link to="/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="mb-2 text-2xl font-bold text-ink dark:text-paper">
              Verification failed
            </h1>
            <p className="mb-6 text-ink/70 dark:text-paper/60">{message}</p>
            <Link to="/login">
              <Button variant="secondary">Back to login</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
