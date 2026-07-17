import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib/queryClient";
import { ErrorBoundary } from "./ErrorBoundary";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AdminRoute } from "@/features/auth/AdminRoute";

// Route-level code splitting: each page ships as its own chunk, fetched only
// when the user actually navigates there, keeping the initial bundle small.
const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const LessonsPage = lazy(() => import("@/pages/LessonsPage").then((m) => ({ default: m.LessonsPage })));
const LessonDetailPage = lazy(() =>
  import("@/pages/LessonDetailPage").then((m) => ({ default: m.LessonDetailPage }))
);
const QuizPage = lazy(() => import("@/pages/QuizPage").then((m) => ({ default: m.QuizPage })));
const LeaderboardPage = lazy(() =>
  import("@/pages/LeaderboardPage").then((m) => ({ default: m.LeaderboardPage }))
);
const PublicProfilePage = lazy(() =>
  import("@/pages/PublicProfilePage").then((m) => ({ default: m.PublicProfilePage }))
);
const ActivityFeedPage = lazy(() =>
  import("@/pages/ActivityFeedPage").then((m) => ({ default: m.ActivityFeedPage }))
);
const AdminPage = lazy(() => import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import("@/pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import("@/pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const VerifyEmailPage = lazy(() =>
  import("@/pages/auth/VerifyEmailPage").then((m) => ({ default: m.VerifyEmailPage }))
);

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-spark-500 border-t-transparent" />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/lessons" element={<LessonsPage />} />
                  <Route path="/lessons/:slug" element={<LessonDetailPage />} />
                  <Route
                    path="/lessons/:slug/quiz"
                    element={
                      <ProtectedRoute>
                        <QuizPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/users/:userId" element={<PublicProfilePage />} />
                  <Route
                    path="/feed"
                    element={
                      <ProtectedRoute>
                        <ActivityFeedPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
          <Toaster position="top-right" />
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
