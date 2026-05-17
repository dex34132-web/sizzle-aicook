import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Camera, Calendar, ChefHat, MapPin, ShoppingCart, ScanLine, RefreshCcw } from "lucide-react";
import Header from "@/components/Header";
import RecipeCard from "@/components/RecipeCard";
import SkeletonCard from "@/components/SkeletonCard";
import PlannerFab from "@/components/PlannerFab";
import { Meal, getCuisineMeals, filterByCategory, searchMeals } from "@/lib/mealdb";
import { CURATED_MEALS } from "@/lib/curated";
import RecipeRow from "@/components/RecipeRow";
import fridgeBanner from "@/assets/fridge-banner.jpg";
import heroBanner from "@/assets/hero-bg.jpg";
import plannerBanner from "@/assets/planner-banner.jpg";
import storesBanner from "@/assets/stores-banner.jpg";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

type Category = "Veg" | "Non-Veg" | "Desserts" | "Vegan Desserts" | "Dips & Sauces" | "Premade";
type SubMode = { type: "category" | "area"; value: string; label: string };

const CATEGORIES: { id: Category; label: string; icon: string; sub: SubMode }[] = [
  { id: "Veg", label: "Veg", icon: "🥗", sub: { type: "category", value: "Vegetarian", label: "Vegetarian" } },
  { id: "Non-Veg", label: "Non-Veg", icon: "🍗", sub: { type: "category", value: "Chicken", label: "Chicken" } },
  { id: "Desserts", label: "Desserts", icon: "🧁", sub: { type: "category", value: "Dessert", label: "Desserts" } },
  { id: "Vegan Desserts", label: "Vegan Desserts", icon: "🌱", sub: { type: "category", value: "Vegan", label: "Vegan" } },
  { id: "Dips & Sauces", label: "Dips & Sauces", icon: "🥣", sub: { type: "category", value: "Dips & Sauces", label: "Dips & Sauces" } },
  { id: "Premade", label: "Premade Bases", icon: "🧪", sub: { type: "category", value: "Premade", label: "Premade Bases" } },
];

const HOME_CUISINES = [
  { name: "Italian", img: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=240", area: "Italian" },
  { name: "Indian", img: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=240", area: "Indian" },
  { name: "American", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=240", area: "American" },
  { name: "Mexican", img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=240", area: "Mexican" },
  { name: "Japanese", img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=240", area: "Japanese" },
  { name: "Thai", img: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=240", area: "Thai" },
  { name: "Chinese", img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=240", area: "Chinese" },
  { name: "French", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=240", area: "French" },
  { name: "Greek", img: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&q=80&w=240", area: "Greek" },
  { name: "Turkish", img: "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?auto=format&fit=crop&q=80&w=240", area: "Turkish" },
  { name: "Spanish", img: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&q=80&w=240", area: "Spanish" },
  { name: "British", img: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&q=80&w=240", area: "British" },
];

// Quick-search suggestions shown under the SIZZLE search header
const SEARCH_SUGGESTIONS = ["Margherita Pizza", "Chicken Biryani", "Strawberry Ice Cream"];

const HERO_BANNERS = [
  { id: "scan", title: "Turn your fridge into", highlight: "amazing", suffix: "meals.", desc: "Scan ingredients, get AI-powered recipes instantly.", img: fridgeBanner, btn: "Scan Fridge", icon: Camera },
  { id: "planner", title: "Plan your weekly", highlight: "healthy", suffix: "diet.", desc: "Personalized meal plans tailored to your vitals & goals.", img: plannerBanner, btn: "Create Plan", icon: Calendar },
  { id: "recipes", title: "Discover endless", highlight: "delicious", suffix: "recipes.", desc: "AI-curated culinary masterpieces from around the world.", img: heroBanner, btn: "Explore Recipes", icon: ChefHat },
  { id: "stores", title: "Find ingredients", highlight: "nearby", suffix: "easily.", desc: "Locate supermarkets and specialty stores in your area.", img: storesBanner, btn: "Find Stores", icon: MapPin },
];

const Index = () => {
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [vegModal, setVegModal] = useState(false);

  const [visibleCount, setVisibleCount] = useState(12);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerHover, setBannerHover] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Auto-rotate banners
  useEffect(() => {
    if (bannerHover) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % HERO_BANNERS.length), 5000);
    return () => clearInterval(t);
  }, [bannerHover]);

  const sub: SubMode = useMemo(() => {
    if (activeCuisine) {
      const c = HOME_CUISINES.find((x) => x.name === activeCuisine);
      return { type: "area", value: c?.area ?? "American", label: activeCuisine };
    }
    if (activeCategory) {
      const c = CATEGORIES.find((x) => x.id === activeCategory)!;
      return c.sub;
    }
    return { type: "area", value: "Indian", label: "Indian" };
  }, [activeCuisine, activeCategory]);

  useEffect(() => {
    if (searchMode) return;
    let cancelled = false;
    setLoading(true);
    setVisibleCount(12);
    const isPopular = !activeCuisine && !activeCategory;
    // Hand-picked popular: butter chicken (Indian), Texan BBQ (American),
    // Japanese mochi dessert, French croissant. These are curated locally
    // because TheMealDB free API does not have them.
    const promise: Promise<Meal[]> = isPopular
      ? Promise.resolve([...CURATED_MEALS])
      : sub.type === "area"
        ? getCuisineMeals(sub.value)
        : filterByCategory(sub.value);
    promise.then((data: Meal[]) => {
      if (cancelled) return;
      const list = data ?? [];
      setAllMeals(list);
      setMeals(list.slice(0, 12));
      setLoading(false);
    }).catch(() => { if (!cancelled) { setAllMeals([]); setMeals([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [sub.type, sub.value, searchMode, activeCuisine, activeCategory]);

  const runSearch = async (q: string) => {
    const term = q.trim();
    if (!term) return;
    setQuery(term);
    setHasSearched(true);
    setLoading(true);
    const data = await searchMeals(term);
    setMeals(data ?? []);
    setLoading(false);
  };

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    await runSearch(query);
  };

  const handleBannerAction = (id: string) => {
    if (id === "planner" || id === "scan") {
      // Trigger FAB-equivalent flows by dispatching synthetic events isn't ideal; just route
      if (id === "planner") {
        document.getElementById("recipes-section")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    // others: scroll to recipes
    document.getElementById("recipes-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCategoryClick = (id: Category) => {
    if (id === "Veg") { setVegModal(true); return; }
    setActiveCategory(id);
    setActiveCuisine(null);
  };

  const handleCuisineClick = (name: string) => {
    setActiveCuisine(name);
    setActiveCategory(null);
  };

  const heading = searchMode
    ? `Results for "${query}"`
    : activeCuisine
      ? `${activeCuisine} cuisine`
      : activeCategory
        ? activeCategory
        : "Popular Recipes";

  const banner = HERO_BANNERS[bannerIdx];

  // ---------- Search-mode takeover ----------
  if (searchMode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 sm:pt-16 pb-32">
          <div className="flex flex-col items-center text-center space-y-6">
            <h1 className="font-display font-black tracking-tight text-5xl sm:text-6xl bg-gradient-warm bg-clip-text text-transparent select-none">
              SIZZLE
            </h1>

            <form
              onSubmit={onSearch}
              className="w-full flex items-center gap-2 rounded-full border border-border bg-card pl-5 pr-1.5 py-1.5 shadow-glow focus-within:ring-2 focus-within:ring-primary/40"
              role="search"
            >
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any dish, ingredient, or cuisine…"
                maxLength={60}
                className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                aria-label="Search recipes"
              />
              <button
                type="submit"
                aria-label="Search"
                className="grid h-10 w-10 sm:h-auto sm:w-auto sm:px-5 sm:py-2.5 shrink-0 place-items-center rounded-full bg-gradient-warm text-white font-bold text-sm shadow-soft hover:shadow-glow transition-shadow"
              >
                <Search className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </form>

            {!hasSearched && (
              <div className="w-full pt-2 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold">Try one of these</p>
                <div className="flex flex-col items-stretch gap-2">
                  {SEARCH_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setQuery(s); void runSearch(s); }}
                      className="text-left rounded-2xl border border-border/60 bg-card/40 px-4 py-3 text-sm font-medium text-muted-foreground/70 hover:text-foreground hover:border-primary/40 hover:bg-card transition-colors"
                    >
                      <Search className="inline h-3.5 w-3.5 mr-2 opacity-60" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { setSearchMode(false); setQuery(""); setHasSearched(false); }}
              className="pt-4 text-[11px] font-black text-primary hover:underline uppercase tracking-widest"
            >
              ← Back to home
            </button>

            {hasSearched && (
              <div className="w-full pt-6 text-left">
                <h2 className="text-lg font-display font-black mb-4">Results for “{query}”</h2>
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : meals.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                    <p className="text-base font-medium">No recipes matched.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try a different word or check the suggestions above.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {meals.map((m) => <RecipeCard key={m.idMeal} meal={m} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-32 space-y-10 sm:space-y-12">
        {/* Hero banner — slimmer, more rounded */}
        <section
          className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] text-white shadow-glow flex items-center min-h-[200px] sm:min-h-[260px] touch-pan-y bg-gradient-warm select-none"
          onMouseEnter={() => setBannerHover(true)}
          onMouseLeave={() => setBannerHover(false)}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null || touchStartY.current == null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            const dy = e.changedTouches[0].clientY - touchStartY.current;
            touchStartX.current = null; touchStartY.current = null;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
            if (dx < 0) setBannerIdx((i) => (i + 1) % HERO_BANNERS.length);
            else setBannerIdx((i) => (i - 1 + HERO_BANNERS.length) % HERO_BANNERS.length);
          }}
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center p-5 sm:p-8 md:p-10"
            >
                <div className="absolute inset-0 z-0 pointer-events-none">
                <img
                  src={banner.img}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-105 dark:brightness-[0.72] dark:saturate-125"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/78 via-black/42 to-black/5 dark:from-black/72 dark:via-black/48 dark:to-black/12" />
              </div>

              <div className="relative z-10 max-w-md sm:max-w-lg space-y-3 sm:space-y-4">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-display font-black leading-[1.1] text-white text-balance">
                  {banner.title}{" "}
                  <span className="text-amber-300">{banner.highlight}</span>{" "}
                  {banner.suffix}
                </h1>
                <p className="text-xs sm:text-sm text-white/95 font-medium max-w-xs sm:max-w-sm leading-relaxed">
                  {banner.desc}
                </p>
                <button
                  type="button"
                  onClick={() => handleBannerAction(banner.id)}
                  className="bg-card text-primary px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-black text-[11px] sm:text-xs uppercase tracking-widest shadow-glow flex items-center gap-2 hover:scale-[1.03] active:scale-95 transition-transform"
                >
                  <banner.icon size={16} />
                  {banner.btn}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {HERO_BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={cn(
                  "transition-all duration-300 rounded-full h-2",
                  i === bannerIdx ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </section>

        {/* Search trigger — opens SIZZLE search-mode */}
        <form
          onSubmit={(e) => { e.preventDefault(); setSearchMode(true); }}
          className="flex items-center gap-2 rounded-full border border-border bg-card pl-4 pr-1.5 py-1.5 shadow-soft focus-within:ring-2 focus-within:ring-primary/30"
          role="search"
        >
          <Search className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            readOnly
            onFocus={() => setSearchMode(true)}
            onClick={() => setSearchMode(true)}
            placeholder="Search recipes, ingredients, cuisines…"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground cursor-pointer"
            aria-label="Search recipes"
          />
          <button
            type="submit"
            aria-label="Search"
            className="grid h-10 w-10 sm:h-auto sm:w-auto sm:px-5 sm:py-2.5 shrink-0 place-items-center rounded-full bg-gradient-warm text-white font-bold text-sm shadow-soft hover:shadow-glow transition-shadow"
          >
            <Search className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>

        {/* Cuisine browser */}
        <section className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl sm:text-2xl font-display font-black">Browse by Cuisine</h2>
            {(activeCuisine || activeCategory) && (
              <button
                onClick={() => { setActiveCuisine(null); setActiveCategory(null); }}
                className="text-[11px] font-black text-primary hover:underline uppercase tracking-widest"
              >
                Reset
              </button>
            )}
          </div>

          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-5 sm:gap-8 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {HOME_CUISINES.map((c) => {
              const active = activeCuisine === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => handleCuisineClick(c.name)}
                  className="flex-shrink-0 group flex flex-col items-center gap-2"
                >
                  <div className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 bg-card shadow-soft transition-all duration-300",
                    active ? "border-primary ring-4 ring-primary/15" : "border-border"
                  )}>
                    <img src={c.img} alt={c.name} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tight transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}>{c.name}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={cn(
                    "group bg-card border pl-1.5 pr-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-soft active:scale-95",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground/80 hover:border-primary/40 hover:text-primary"
                  )}
                >
                  <span className="bg-secondary group-hover:bg-background w-8 h-8 rounded-full grid place-items-center text-sm shadow-inner shrink-0">
                    {cat.icon}
                  </span>
                  <span className="truncate text-left leading-none">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recipes */}
        <section id="recipes-section" className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl sm:text-2xl font-display font-black">{heading}</h2>
            {searchMode && (
              <button
                onClick={() => { setSearchMode(false); setQuery(""); }}
                className="text-[11px] font-black text-primary hover:underline uppercase tracking-widest"
              >
                ← Back
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : meals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <p className="text-lg font-medium">No recipes found.</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search or category.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {meals.map((m) => <RecipeCard key={m.idMeal} meal={m} />)}
              </div>
              {!searchMode && allMeals.length > visibleCount && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => { const n = visibleCount + 12; setVisibleCount(n); setMeals(allMeals.slice(0, n)); }}
                    className="rounded-full bg-gradient-warm px-7 py-3 text-xs font-black uppercase tracking-widest text-white shadow-glow hover:scale-[1.03] active:scale-95 transition-transform"
                  >
                    Load more recipes
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Curated rows — appetizing dishes everyone craves */}
        {!searchMode && !activeCategory && !activeCuisine && (
          <>
            <RecipeRow title="🍔 Best Burgers" source={{ type: "search", value: "burger" }} />
            <RecipeRow title="🍕 Pizza Night" source={{ type: "search", value: "pizza" }} />
            <RecipeRow title="🍣 Sushi & Japanese" source={{ type: "area", value: "Japanese" }} />
            <RecipeRow title="🍦 Ice Cream & Frozen Treats" source={{ type: "search", value: "ice cream" }} />
            <RecipeRow title="🍛 Indian Classics" source={{ type: "area", value: "Indian" }} />
            <RecipeRow title="🥐 French Favorites" source={{ type: "area", value: "French" }} />
            <RecipeRow title="🇺🇸 American Comfort" source={{ type: "area", value: "American" }} />
            <RecipeRow title="🍝 Italian Favorites" source={{ type: "area", value: "Italian" }} />
            <RecipeRow title="🌮 Mexican Picks" source={{ type: "area", value: "Mexican" }} />
            <RecipeRow title="🧁 Sweet Desserts" source={{ type: "category", value: "Dessert" }} />
            <RecipeRow title="🥗 Vegetarian Hits" source={{ type: "category", value: "Vegetarian" }} />
            <RecipeRow title="🥣 Dips & Sauces" source={{ type: "category", value: "Dips & Sauces" }} />
            <RecipeRow title="🧪 Premade Bases" source={{ type: "category", value: "Premade" }} />
          </>
        )}

        {/* Features row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4">
          {[
            { title: "Smart Substitutes", sub: "Find the best ingredient swaps instantly.", icon: RefreshCcw, bg: "bg-indigo-500/10", color: "text-indigo-600 bg-indigo-500/15" },
            { title: "Shopping List", sub: "Auto-build groceries from your plan.", icon: ShoppingCart, bg: "bg-primary/10", color: "text-primary bg-primary/15" },
            { title: "SizzleLens", sub: "Identify dishes, calories & nutrition.", icon: ScanLine, bg: "bg-amber-500/10", color: "text-amber-600 bg-amber-500/15" },
          ].map((f) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -4 }}
              className={cn("rounded-2xl border border-border p-6 sm:p-7 space-y-3", f.bg)}
            >
              <div className={cn("w-12 h-12 rounded-2xl grid place-items-center", f.color)}>
                <f.icon size={22} />
              </div>
              <p className="font-display font-black text-base">{f.title}</p>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{f.sub}</p>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border bg-card/40 py-8 text-center text-sm text-muted-foreground">
        Recipes by{" "}
        <a className="font-bold text-primary hover:underline" href="https://www.themealdb.com" target="_blank" rel="noreferrer">TheMealDB</a>
        {" "}· A product of <span className="font-bold text-foreground">Daksh's Studio</span>
      </footer>

      <PlannerFab />

      <Dialog open={vegModal} onOpenChange={setVegModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">How vegetarian?</DialogTitle>
            <DialogDescription>Pick the closest match.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <button
              onClick={() => { setVegModal(false); setActiveCategory("Veg"); setActiveCuisine(null); }}
              className="rounded-2xl border border-border bg-card p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <p className="font-display text-lg font-bold">Full Vegan</p>
              <p className="text-sm text-muted-foreground">No animal products at all.</p>
            </button>
            <button
              onClick={() => { setVegModal(false); setActiveCategory("Veg"); setActiveCuisine(null); }}
              className="rounded-2xl border border-border bg-card p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <p className="font-display text-lg font-bold">Vegetarian</p>
              <p className="text-sm text-muted-foreground">Dairy & eggs OK.</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
