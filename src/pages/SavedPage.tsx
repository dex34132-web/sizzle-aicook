import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Header from "@/components/Header";
import RecipeCard from "@/components/RecipeCard";
import SkeletonCard from "@/components/SkeletonCard";
import PlannerFab from "@/components/PlannerFab";
import { useSaved } from "@/hooks/useSaved";
import { Meal, getMealById } from "@/lib/mealdb";

const SavedPage = () => {
  const { ids } = useSaved();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(ids.map((id) => getMealById(id))).then((results) => {
      if (cancelled) return;
      setMeals(results.filter((m): m is Meal => !!m));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <div className="min-h-screen bg-warm pb-28">
      <Header />
      <section className="container py-12">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <Heart className="h-5 w-5 fill-current" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-black sm:text-4xl">Saved recipes</h1>
            <p className="text-sm text-muted-foreground">Your personal cookbook.</p>
          </div>
        </div>

        {loading && ids.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: Math.min(ids.length, 4) }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-16 text-center">
            <p className="font-display text-2xl font-bold">No saved recipes yet</p>
            <p className="mt-2 text-muted-foreground">Tap the heart on any recipe to save it here.</p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-smooth hover:shadow-glow"
            >
              Browse recipes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {meals.map((m) => (
              <RecipeCard key={m.idMeal} meal={m} />
            ))}
          </div>
        )}
      </section>
      <PlannerFab />
    </div>
  );
};

export default SavedPage;
