import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { usersApi } from "../api/usersApi";
import { Button } from "@/components/ui/Button";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarUploaderProps {
  currentAvatarUrl: string | null;
  name: string;
  onUploaded: (avatarUrl: string) => void;
}

export function AvatarUploader({ currentAvatarUrl, name, onUploaded }: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const updatedUser = await usersApi.uploadAvatar(file);
      onUploaded(updatedUser.avatarUrl!);
      toast.success("Profile picture updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = preview ?? currentAvatarUrl;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900">
        {displayUrl ? (
          <img src={displayUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-spark-700 dark:text-spark-300">
            {initials}
          </span>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          Change photo
        </Button>
        <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">JPEG, PNG, or WebP. Max 5MB.</p>
      </div>
    </div>
  );
}
