import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Meal } from "@/lib/mealdb";
import { useSaved } from "@/hooks/useSaved";
import { cn } from "@/lib/utils";
import { stableHash } from "@/lib/confetti";

const RecipeCard = ({ meal }: { meal: Meal }) => {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(meal.idMeal);

  // Stable pseudo-random rating from id (4.3–4.9). String-hash so non-numeric
  // ids like "curated-butter-chicken" don't render NaN.
  const seed = stableHash(meal.idMeal);
  const rating = (4.3 + ((seed % 7) / 10)).toFixed(1);

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
      <Link
        to={`/recipe/${meal.idMeal}`}
        className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft hover:shadow-glow transition-shadow animate-fade-in"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={meal.strMealThumb}
            alt={meal.strMeal}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-card/90 backdrop-blur px-2.5 py-1 text-[10px] font-black shadow-soft">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {rating}
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); toggle(meal.idMeal); }}
            aria-label={saved ? "Unsave" : "Save"}
            className="absolute top-3 left-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 backdrop-blur shadow-soft hover:scale-110 transition-transform"
          >
            <Heart className={cn("h-4 w-4 transition-colors", saved ? "fill-primary text-primary" : "text-foreground/70")} />
          </button>
        </div>
        <div className="p-5 space-y-2">
          <h3 className="line-clamp-2 font-display text-lg font-black leading-tight group-hover:text-primary transition-colors">
            {meal.strMeal}
          </h3>
          {(meal.strArea || meal.strCategory) && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
              {meal.strCategory && <span className="bg-secondary px-2 py-0.5 rounded-md">{meal.strCategory}</span>}
              {meal.strArea && <><span>•</span><span>{meal.strArea}</span></>}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default RecipeCard;
