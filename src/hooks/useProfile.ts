import { useEffect, useState, useCallback } from "react";

export type Diet = "veg" | "non-veg" | "both";
export type VegStyle = "vegan" | "vegetarian"; // only when diet === "veg"
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very-active";
export type PlanType = "balanced" | "weight-loss" | "bulking" | "keto" | "high-protein" | "mediterranean" | "low-carb";

export interface UserProfile {
  birthdate?: string;
  age?: number;
  gender?: "male" | "female" | "other" | "prefer-not";
  heightCm?: number;
  weightKg?: number;
  activity?: Activity;
  diet?: Diet;
  vegStyle?: VegStyle;
  allergies?: string;
  preferences?: string;
  cuisines?: string;
  region?: { country?: string; state?: string; city?: string };
  planType?: PlanType;
  completed?: boolean;
  createdAt?: string;
}

const KEY = "cookbuddy:profile";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  const save = useCallback((p: UserProfile) => {
    const next = { ...p, createdAt: p.createdAt ?? new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(next));
    setProfile(next);
  }, []);

  const update = useCallback(
    (patch: Partial<UserProfile>) => {
      const next = { ...(profile ?? {}), ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      setProfile(next);
    },
    [profile]
  );

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setProfile(null);
  }, []);

  return { profile, save, update, reset, loaded };
}

export function calcAge(birthdate?: string): number | undefined {
  if (!birthdate) return undefined;
  const d = new Date(birthdate);
  if (isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.9,
};

const PLAN_ADJUST: Record<PlanType, number> = {
  balanced: 0,
  "weight-loss": -500,
  bulking: 400,
  keto: -200,
  "high-protein": 100,
  mediterranean: 0,
  "low-carb": -150,
};

/** Mifflin-St Jeor BMR + activity factor + plan adjustment. Returns kcal. */
export function calcCalories(p: UserProfile | null): number | undefined {
  if (!p?.weightKg || !p?.heightCm || !p?.age) return undefined;
  const isMale = p.gender === "male";
  // Use neutral if not specified
  const bmr =
    p.gender === "male" || p.gender === "female"
      ? 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (isMale ? 5 : -161)
      : 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age - 78; // average
  const tdee = bmr * ACTIVITY_FACTOR[p.activity ?? "moderate"];
  const target = tdee + PLAN_ADJUST[p.planType ?? "balanced"];
  return Math.round(target / 10) * 10;
}

export const PLAN_TYPE_LABELS: Record<PlanType, { label: string; note: string }> = {
  balanced: { label: "Balanced", note: "Maintain weight, all groups" },
  "weight-loss": { label: "Weight loss", note: "−500 kcal/day deficit" },
  bulking: { label: "Bulking", note: "+400 kcal/day for muscle" },
  keto: { label: "Keto", note: "Low-carb, high-fat" },
  "high-protein": { label: "High protein", note: "Athletes & gym" },
  mediterranean: { label: "Mediterranean", note: "Heart-healthy" },
  "low-carb": { label: "Low carb", note: "Reduced grains/starch" },
};
