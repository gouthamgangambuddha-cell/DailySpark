import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { notificationsApi } from "../api/notificationsApi";
import { requestPushPermission } from "@/lib/firebase";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(1, 10),
    refetchInterval: 60_000,
  });

  const handleOpen = async () => {
    setIsOpen((v) => !v);
    if (!isOpen && data && data.unreadCount > 0) {
      await notificationsApi.markAllRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  const handleEnablePush = async () => {
    setIsEnablingPush(true);
    try {
      const result = await requestPushPermission();
      if (result.status === "granted") {
        await notificationsApi.registerDeviceToken(result.token);
        toast.success("Push notifications enabled!");
      } else if (result.status === "denied") {
        toast.error("Notification permission was denied.");
      } else {
        toast("Push notifications aren't available in this browser or aren't configured yet.");
      }
    } catch {
      toast.error("Could not enable push notifications.");
    } finally {
      setIsEnablingPush(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-full p-2 text-ink/70 hover:bg-ink/5 dark:text-paper/70 dark:hover:bg-white/10"
        aria-label="Notifications"
      >
        🔔
        {data && data.unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ember-500 text-[10px] font-bold text-white">
            {data.unreadCount > 9 ? "9+" : data.unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-ink/10 bg-paper p-2 shadow-lg dark:border-white/10 dark:bg-ink-soft">
          <button
            onClick={handleEnablePush}
            disabled={isEnablingPush}
            className="mb-1 w-full rounded-lg p-2 text-left text-xs font-semibold text-spark-700 hover:bg-ink/5 dark:text-spark-300 dark:hover:bg-white/5"
          >
            {isEnablingPush ? "Enabling..." : "🔔 Enable push notifications"}
          </button>
          <div className="border-t border-ink/5 dark:border-white/5" />
          {!data || data.items.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink/50 dark:text-paper/50">
              No notifications yet.
            </p>
          ) : (
            <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {data.items.map((n) => (
                <Link
                  key={n.id}
                  to={n.lessonSlug ? `/lessons/${n.lessonSlug}` : "#"}
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-sm hover:bg-ink/5 dark:hover:bg-white/5"
                >
                  <p className="text-ink/80 dark:text-paper/80">{n.message}</p>
                  <p className="mt-0.5 text-xs text-ink/40 dark:text-paper/40">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
