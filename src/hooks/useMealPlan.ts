import { useCallback, useEffect, useState } from "react";

export interface PlanMeal {
  type: string;
  name: string;
  calories?: number;
  ingredients: string[];
  steps: string[];
  tip?: string;
  youtubeQuery?: string;
}
export interface PlanDay {
  day: string;
  meals: PlanMeal[];
}
export interface MealPlan {
  summary?: string;
  dailyCalories?: number;
  days: PlanDay[];
  shoppingList?: { category: string; items: string[] }[];
  generatedAt?: string;
}

const KEY = "cookbuddy:plan";

export function useMealPlan() {
  const [plan, setPlan] = useState<MealPlan | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPlan(JSON.parse(raw));
    } catch {}
  }, []);

  const save = useCallback((p: MealPlan) => {
    const next = { ...p, generatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(next));
    setPlan(next);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setPlan(null);
  }, []);

  return { plan, save, clear };
}
