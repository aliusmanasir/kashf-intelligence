// Shared client/server constants for Kashf personalization.

export const INTEREST_OPTIONS = [
  "Finance",
  "Business",
  "Technology",
  "AI",
  "Politics",
  "Sports",
  "Health",
  "Entertainment",
  "Entrepreneurship",
  "Energy",
  "Real Estate",
  "Markets",
] as const;

export const GOAL_OPTIONS = [
  "Build wealth",
  "Start a business",
  "Get a better job",
  "Learn about world events",
  "Improve productivity",
  "Become more informed",
] as const;

export const EDUCATION_OPTIONS = [
  "High school student",
  "University student",
  "Graduate",
  "Working professional",
  "Other",
] as const;

export const COUNTRY_OPTIONS = [
  "Saudi Arabia",
  "UAE",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Egypt",
  "Jordan",
  "Lebanon",
  "Morocco",
  "Algeria",
  "Tunisia",
  "Iraq",
  "Syria",
  "Palestine",
  "Yemen",
  "United States",
  "United Kingdom",
  "China",
  "India",
  "Pakistan",
  "Turkey",
  "Global",
] as const;

export const ARAB_WORLD = [
  "Saudi Arabia",
  "UAE",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Egypt",
  "Jordan",
  "Lebanon",
  "Morocco",
  "Algeria",
  "Tunisia",
  "Iraq",
  "Palestine",
] as const;

export const GCC = ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Bahrain", "Oman"] as const;

export const REGION_PRESETS = [
  { id: "global", label: "Global Feed", hint: "Everything that matters, worldwide" },
  { id: "arab", label: "Arab World", hint: "Predominantly Arab-world coverage" },
  { id: "gcc", label: "GCC", hint: "Saudi, UAE, Qatar, Kuwait, Bahrain, Oman" },
  { id: "custom", label: "Custom Mix", hint: "Choose specific countries" },
] as const;

export type RegionPreset = (typeof REGION_PRESETS)[number]["id"];

export function resolveCountries(preset: RegionPreset, custom: string[]): string[] {
  if (preset === "global") return [];
  if (preset === "arab") return [...ARAB_WORLD];
  if (preset === "gcc") return [...GCC];
  return custom;
}

export const EDITION_SLOTS = [
  { id: "morning", label: "Morning Brief", tagline: "What happened while you were asleep." },
  { id: "afternoon", label: "Afternoon Brief", tagline: "Most important developments today." },
  { id: "evening", label: "Evening Recap", tagline: "What mattered today." },
] as const;

export type EditionSlot = (typeof EDITION_SLOTS)[number]["id"];

export function currentEditionSlot(date = new Date()): EditionSlot {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export const FEED_CATEGORIES = [
  { id: "top", label: "Top Stories", target: 5 },
  { id: "business", label: "Business & Finance", target: 5 },
  { id: "tech", label: "Technology & AI", target: 5 },
  { id: "regional", label: "Regional News", target: 5 },
  { id: "personal", label: "Personalized Picks", target: 5 },
] as const;

export type FeedCategory = (typeof FEED_CATEGORIES)[number]["id"];