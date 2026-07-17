import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { LANGUAGES } from "@dailyspark/types";
import { useAuth } from "@/features/auth/AuthContext";
import { usersApi } from "@/features/users/api/usersApi";
import { AvatarUploader } from "@/features/users/components/AvatarUploader";
import { InterestsPicker } from "@/features/users/components/InterestsPicker";
import { StatsCard } from "@/features/users/components/StatsCard";
import { DeleteAccountSection } from "@/features/users/components/DeleteAccountSection";
import { BillingCard } from "@/features/payments/components/BillingCard";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  bio: z.string().max(280, "Bio must be 280 characters or fewer").optional(),
});
type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const { user, updateLocalUser } = useAuth();
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage ?? "en");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name, bio: user?.bio ?? "" },
  });

  if (!user) return null;

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const updatedUser = await usersApi.updateProfile({
        name: values.name,
        bio: values.bio,
        interests,
        preferredLanguage,
      });
      updateLocalUser(updatedUser);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink dark:text-paper">Your profile</h1>
        <Link
          to="/dashboard"
          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <StatsCard />

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink dark:text-paper">
            Profile picture
          </h2>
          <AvatarUploader
            currentAvatarUrl={user.avatarUrl}
            name={user.name}
            onUploaded={(avatarUrl) => updateLocalUser({ ...user, avatarUrl })}
          />
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink dark:text-paper">
            Basic information
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input label="Full name" error={errors.name?.message} {...register("name")} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink/80 dark:text-paper/80">Bio</label>
              <textarea
                rows={3}
                maxLength={280}
                className="rounded-xl border border-ink/20 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-brand-400 dark:border-white/20 dark:bg-ink dark:text-paper"
                {...register("bio")}
              />
              {errors.bio?.message && <p className="text-sm text-ember-500">{errors.bio.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink/80 dark:text-paper/80">
                Preferred language
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="rounded-xl border border-ink/20 px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-brand-400 dark:border-white/20 dark:bg-ink dark:text-paper"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink/80 dark:text-paper/80">
                Interests
              </label>
              <InterestsPicker selected={interests} onChange={setInterests} />
            </div>

            <Button type="submit" isLoading={isSubmitting} className="mt-2 self-start">
              Save changes
            </Button>
          </form>
        </Card>

        <BillingCard />

        <DeleteAccountSection hasPassword={user.hasPassword} />
      </div>
    </div>
  );
}
