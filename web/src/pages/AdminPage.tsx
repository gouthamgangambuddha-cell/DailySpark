import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminApi } from "@/features/admin/api/adminApi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { AdminReportStatus } from "@dailyspark/types";

type Tab = "overview" | "users" | "reports" | "lessons";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink dark:text-paper">Admin</h1>
        <Link to="/dashboard">
          <Button variant="secondary">← Dashboard</Button>
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        {(["overview", "users", "reports", "lessons"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold capitalize transition ${
              tab === t
                ? "border-spark-500 bg-spark-500 text-ink"
                : "border-ink/20 text-ink/70 dark:border-white/20 dark:text-paper/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "lessons" && <LessonsTab />}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="text-center">
      <p className="font-display text-2xl font-bold text-ink dark:text-paper">{value}</p>
      <p className="text-xs text-ink/50 dark:text-paper/50">{label}</p>
    </Card>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminApi.getStats,
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-paper-dim dark:bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatBlock label="Total users" value={stats.totalUsers} />
      <StatBlock label="New (7 days)" value={stats.newUsersLast7Days} />
      <StatBlock label="Premium users" value={stats.premiumUsers} />
      <StatBlock label="Est. monthly revenue" value={`$${stats.estimatedMonthlyRevenue}`} />
      <StatBlock label="Total lessons" value={stats.totalLessons} />
      <StatBlock label="Published" value={stats.publishedLessons} />
      <StatBlock label="Quiz attempts" value={stats.totalQuizAttempts} />
      <StatBlock label="Pending reports" value={stats.pendingReports} />
    </div>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => adminApi.listUsers(search),
  });

  const handleTogglePremium = async (userId: string, current: boolean) => {
    await adminApi.updateUser(userId, { isPremium: !current });
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const handleToggleActive = async (userId: string, current: boolean) => {
    await adminApi.updateUser(userId, { isActive: !current });
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    try {
      await adminApi.deleteUser(userId);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not delete user.");
    }
  };

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="mb-4 w-full max-w-sm rounded-xl border border-ink/20 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-spark-500 dark:border-white/20 dark:bg-ink dark:text-paper"
      />

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-paper-dim dark:bg-white/5" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-dim/60 text-xs uppercase text-ink/50 dark:bg-white/5 dark:text-paper/50">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Premium</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 dark:divide-white/5">
              {data?.items.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-ink dark:text-paper">{u.name}</td>
                  <td className="px-4 py-3 text-ink/70 dark:text-paper/70">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleTogglePremium(u.id, u.isPremium)}
                      className={
                        u.isPremium ? "text-spark-600 dark:text-spark-400" : "text-ink/40 dark:text-paper/40"
                      }
                    >
                      {u.isPremium ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(u.id, u.isActive)}
                      className={u.isActive ? "text-teal-600 dark:text-teal-400" : "text-ember-500"}
                    >
                      {u.isActive ? "Active" : "Suspended"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-xs font-semibold text-ember-500"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReportsTab() {
  const [status, setStatus] = useState<AdminReportStatus | "">("PENDING");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports", status],
    queryFn: () => adminApi.listReports(status),
  });

  const handleUpdateStatus = async (reportId: string, newStatus: AdminReportStatus) => {
    await adminApi.updateReportStatus(reportId, newStatus);
    queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["PENDING", "REVIEWED", "DISMISSED", ""] as (AdminReportStatus | "")[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              status === s
                ? "border-spark-500 bg-spark-500 text-ink"
                : "border-ink/20 text-ink/70 dark:border-white/20 dark:text-paper/70"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-paper-dim dark:bg-white/5" />
      ) : data && data.items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.items.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-mono uppercase text-ink/40 dark:text-paper/40">
                    {r.targetType} · reported by {r.reporter.name}
                  </p>
                  <p className="mt-1 text-sm text-ink/80 dark:text-paper/80">{r.reason}</p>
                  <p className="mt-1 text-xs text-ink/40 dark:text-paper/40">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.status === "PENDING" && (
                    <>
                      <Button variant="secondary" onClick={() => handleUpdateStatus(r.id, "REVIEWED")}>
                        Mark reviewed
                      </Button>
                      <Button variant="secondary" onClick={() => handleUpdateStatus(r.id, "DISMISSED")}>
                        Dismiss
                      </Button>
                    </>
                  )}
                  {r.status !== "PENDING" && (
                    <span className="text-xs font-semibold text-ink/50 dark:text-paper/50">
                      {r.status}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-ink/60 dark:text-paper/60">No reports here.</p>
      )}
    </div>
  );
}

function LessonsTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "lessons", search],
    queryFn: () => adminApi.listLessons(search),
  });

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search lessons by title..."
        className="mb-4 w-full max-w-sm rounded-xl border border-ink/20 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-spark-500 dark:border-white/20 dark:bg-ink dark:text-paper"
      />

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-paper-dim dark:bg-white/5" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-dim/60 text-xs uppercase text-ink/50 dark:bg-white/5 dark:text-paper/50">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Quiz</th>
                <th className="px-4 py-3">Likes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 dark:divide-white/5">
              {data?.items.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/lessons/${l.slug}`}
                      className="font-medium text-ink hover:underline dark:text-paper"
                    >
                      {l.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/70 dark:text-paper/70">{l.category}</td>
                  <td className="px-4 py-3 text-ink/70 dark:text-paper/70">{l.authorName}</td>
                  <td className="px-4 py-3">
                    {l.isPublished ? (
                      <span className="text-teal-600 dark:text-teal-400">Published</span>
                    ) : (
                      <span className="text-ink/40 dark:text-paper/40">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{l.hasQuiz ? "✓" : "—"}</td>
                  <td className="px-4 py-3">{l.likesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
