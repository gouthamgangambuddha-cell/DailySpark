export type Role = "USER" | "ADMIN";
export type AuthProvider = "LOCAL" | "GOOGLE";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  role: Role;
  emailVerified: boolean;
  preferredLanguage: string;
  interests: string[];
  isPremium: boolean;
  createdAt: string;
  hasPassword: boolean;
}

export interface RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  user: PublicUser;
  accessToken: string;
  // refreshToken is NOT returned in the body — it's set as an httpOnly cookie.
}

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface ResetPasswordRequestDTO {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequestDTO {
  token: string;
}

export interface UpdateProfileRequestDTO {
  name?: string;
  bio?: string;
  interests?: string[];
  preferredLanguage?: string;
}

export interface UserStatsDTO {
  memberSince: string;
  daysSinceJoining: number;
  emailVerified: boolean;
  isPremium: boolean;
  interestsCount: number;
  activeSessionsCount: number;
  // Placeholders — populated once lessons/quizzes/gamification (Steps 5-7) exist.
  currentStreak: number;
  totalXp: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
}
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
