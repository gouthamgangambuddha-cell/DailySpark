import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../api/usersApi";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function DeleteAccountSection({ hasPassword }: { hasPassword: boolean }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = confirmation === "DELETE" && (!hasPassword || password.length > 0);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await usersApi.deleteAccount(confirmation, hasPassword ? password : undefined);
      toast.success("Account deleted. We're sorry to see you go.");
      await logout().catch(() => undefined);
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not delete account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-ember-500/30 dark:border-ember-500/40">
      <h2 className="text-lg font-semibold text-ember-600 dark:text-ember-400">Danger zone</h2>
      <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
        Permanently delete your account and all associated data. This cannot be undone.
      </p>

      {!isOpen ? (
        <Button variant="secondary" className="mt-4 text-ember-600" onClick={() => setIsOpen(true)}>
          Delete my account
        </Button>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {hasPassword && (
            <Input
              label="Confirm your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          <Input
            label='Type "DELETE" to confirm'
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsOpen(false);
                setConfirmation("");
                setPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-ember-500 hover:bg-ember-600"
              disabled={!canSubmit}
              isLoading={isSubmitting}
              onClick={handleDelete}
            >
              Permanently delete
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
