export const CATEGORIES = [
  "Science",
  "Technology",
  "History",
  "Business",
  "Finance",
  "Psychology",
  "Health",
  "Space",
  "Nature",
  "Geography",
  "Languages",
  "Programming",
  "Artificial Intelligence",
  "Sports",
  "Books",
  "Mathematics",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "hi", label: "हिन्दी" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
