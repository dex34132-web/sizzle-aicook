import { useEffect, useState } from "react";
import { Meal, getCuisineMeals, filterByCategory, searchMeals } from "@/lib/mealdb";
import RecipeCard from "./RecipeCard";
import SkeletonCard from "./SkeletonCard";

interface Props {
  title: string;
  source: { type: "area" | "category" | "search"; value: string };
  limit?: number;
}

export default function RecipeRow({ title, source, limit = 10 }: Props) {
  const [meals, setMeals] = useState<Meal[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const p =
      source.type === "area"
        ? getCuisineMeals(source.value)
        : source.type === "category"
          ? filterByCategory(source.value)
          : searchMeals(source.value);
    p.then((d) => { if (!cancelled) setMeals((d ?? []).slice(0, limit)); })
      .catch(() => { if (!cancelled) setMeals([]); });
    return () => { cancelled = true; };
  }, [source.type, source.value, limit]);

  if (meals !== null && meals.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl sm:text-2xl font-display font-black">{title}</h2>
      </div>
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-4 overflow-x-auto pb-3 no-scrollbar snap-x snap-mandatory">
        {meals === null
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[220px] shrink-0 snap-start"><SkeletonCard /></div>
            ))
          : meals.map((m) => (
              <div key={m.idMeal} className="w-[220px] shrink-0 snap-start">
                <RecipeCard meal={m} />
              </div>
            ))}
      </div>
    </section>
  );
}
