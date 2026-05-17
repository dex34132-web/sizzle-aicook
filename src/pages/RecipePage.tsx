import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChefHat,
  Heart,
  MapPin,
  Tag,
  Clock,
  Flame,
  ShoppingBasket,
  Sparkles,
  Loader2,
  X,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Volume2,
  VolumeX,
} from "lucide-react";
import Header from "@/components/Header";
import PlannerFab from "@/components/PlannerFab";
import NearbyStoresMap from "@/components/NearbyStoresMap";
import { Meal, getIngredients, getMealById } from "@/lib/mealdb";
import { useSaved } from "@/hooks/useSaved";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { burstConfetti } from "@/lib/confetti";
import { stableHash } from "@/lib/confetti";
import CookingTutorialOverlay from "@/components/CookingTutorialOverlay";

type TimedStep = { text: string; startSeconds: number; endSeconds: number };

interface SubInfo {
  info: string;
  substitutes: { name: string; note: string }[];
}

interface Store {
  name: string;
  tier: "low" | "medium" | "high";
  rating: number;
  note: string;
  ingredientsLikely?: string[];
}

const tierColor = (t: Store["tier"]) =>
  t === "low"
    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
    : t === "medium"
      ? "bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-300"
      : "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300";

const tierLabel = (t: Store["tier"]) =>
  t === "low" ? "$ Affordable" : t === "medium" ? "$$ Mid-range" : "$$$ Premium";

// Heuristic optional, prepared, and pantry ingredient tags
const OPTIONAL_HINTS = [
  "garnish",
  "optional",
  "to taste",
  "for serving",
  "topping",
  "drizzle",
  "pinch",
  "salt",
  "pepper",
  "parsley",
  "cilantro",
  "coriander leaves",
  "lemon",
  "lime",
  "chili flakes",
];
const PREMADE_HINTS = [
  "stock",
  "broth",
  "sauce",
  "paste",
  "powder",
  "mix",
  "seasoning",
  "spice",
  "curry",
  "masala",
  "tortilla",
  "pastry",
  "noodles",
  "canned",
  "cooked",
  "jar",
  "beans",
];
const isOptional = (m: string, ing: string) =>
  OPTIONAL_HINTS.some((h) => (m + " " + ing).toLowerCase().includes(h));
const isPremade = (m: string, ing: string) =>
  PREMADE_HINTS.some((h) => (m + " " + ing).toLowerCase().includes(h));

const RecipePage = () => {
  const { id } = useParams<{ id: string }>();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [cooking, setCooking] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("cookbuddy:voice") !== "0";
  });
  const [videoPlan, setVideoPlan] = useState<{ overview: string; steps: string[]; timings: TimedStep[] } | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [stepImages, setStepImages] = useState<Record<number, string>>({});
  const [imagesLoading, setImagesLoading] = useState(false);
  const [ownedIngredients, setOwnedIngredients] = useState<Set<string>>(new Set());
  const [tipOpen, setTipOpen] = useState(false);
  const [subDialog, setSubDialog] = useState<{
    open: boolean;
    ingredient: string;
    data: SubInfo | null;
    loading: boolean;
  }>({
    open: false,
    ingredient: "",
    data: null,
    loading: false,
  });
  const [substitutes, setSubstitutes] = useState<Record<string, string>>({});
  const [shopOpen, setShopOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [stores, setStores] = useState<Store[] | null>(null);
  const [storesLoading, setStoresLoading] = useState(false);
  const { isSaved, toggle } = useSaved();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setCooking(false);
    setStepIndex(0);
    setSubstitutes({});
    setOwnedIngredients(new Set());
    setVideoPlan(null);
    getMealById(id).then((m) => {
      setMeal(m);
      setLoading(false);
      window.scrollTo({ top: 0 });
    });
  }, [id]);

  const ingredients = useMemo(() => (meal ? getIngredients(meal) : []), [meal]);
  const fallbackSteps = useMemo(() => {
    if (!meal?.strInstructions) return [];
    return meal.strInstructions
      .split(/\r?\n+|(?<=\.)\s+(?=[A-Z])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 4);
  }, [meal]);
  const steps = videoPlan?.steps?.length ? videoPlan.steps : fallbackSteps;

  const stepsWithSubs = useMemo(() => {
    if (!Object.keys(substitutes).length) return steps;
    return steps.map((s) => {
      let out = s;
      for (const [orig, sub] of Object.entries(substitutes)) {
        const re = new RegExp(`\\b${orig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
        out = out.replace(re, `${sub} (instead of ${orig})`);
      }
      return out;
    });
  }, [steps, substitutes]);

  // Fetch AI video-aligned plan once per meal
  useEffect(() => {
    if (!meal) return;
    let cancelled = false;
    setPlanLoading(true);
    supabase.functions
      .invoke("recipe-intel", {
        body: {
          mode: "videoPlan",
          mealName: meal.strMeal,
          area: meal.strArea,
          category: meal.strCategory,
          youtubeUrl: meal.strYoutube,
          instructions: meal.strInstructions,
          ingredients: ingredients.map((i) => `${i.measure} ${i.ingredient}`.trim()),
        },
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data?.steps?.length) {
          // The edge fn now returns either an array of strings (legacy)
          // or an array of {text,startSeconds,endSeconds}. Normalise.
          const raw = data.steps as Array<string | TimedStep>;
          const isTimed = typeof raw[0] === "object";
          if (isTimed) {
            const timings = raw as TimedStep[];
            setVideoPlan({
              overview: data.overview || "",
              steps: timings.map((t) => t.text),
              timings,
            });
          } else {
            // Synthesize timings (~40s per step) so auto-detect still works.
            const strs = raw as string[];
            const per = 40;
            setVideoPlan({
              overview: data.overview || "",
              steps: strs,
              timings: strs.map((text, i) => ({
                text,
                startSeconds: i * per,
                endSeconds: (i + 1) * per,
              })),
            });
          }
        }
      })
      .finally(() => !cancelled && setPlanLoading(false));
    return () => {
      cancelled = true;
    };
  }, [meal, ingredients]);

  // When entering cooking mode, generate one AI image per step (sequential, one at a time).
  useEffect(() => {
    if (!cooking || !meal) return;
    if (!stepsWithSubs.length) return;
    let cancelled = false;
    setImagesLoading(true);
    (async () => {
      for (let i = 0; i < stepsWithSubs.length; i++) {
        if (cancelled) return;
        if (stepImages[i]) continue;
        try {
          const { data, error } = await supabase.functions.invoke("recipe-intel", {
            body: {
              mode: "stepImage",
              prompt: `${meal.strMeal}${meal.strArea ? ` (${meal.strArea} cuisine)` : ""}, step ${i + 1}: ${stepsWithSubs[i]}`,
            },
          });
          if (cancelled) return;
          const url = (data as { imageUrl?: string } | null)?.imageUrl;
          if (!error && url) {
            setStepImages((prev) => ({ ...prev, [i]: url }));
          }
        } catch (e) {
          console.warn("[recipe] step image failed", i, e);
        }
      }
      if (!cancelled) setImagesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooking, meal?.idMeal, stepsWithSubs.length]);

  // Stable pseudo metadata (string-hash so non-numeric ids don't NaN).
  const seed = stableHash(meal?.idMeal || "default");
  const cookTime = 15 + (seed % 45);
  const calories = 280 + (seed % 420);
  const servings = 2 + (seed % 4);

  const fetchSubInfo = async (ingredient: string) => {
    setSubDialog({ open: true, ingredient, data: null, loading: true });
    try {
      const { data, error } = await supabase.functions.invoke("recipe-intel", {
        body: { mode: "ingredient", ingredient },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSubDialog((s) => ({ ...s, data, loading: false }));
    } catch {
          setSubDialog({
            open: true,
            ingredient,
            loading: false,
            data: {
              info: `Couldn't fetch AI substitutes for ${ingredient}. Check your connection and try again.`,
              substitutes: [],
            },
          });
    }
  };

  const requestLocationAndStores = async () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported.");
      setShopOpen(false);
      return;
    }
    setStoresLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        try {
          const { data, error } = await supabase.functions.invoke("recipe-intel", {
            body: {
              mode: "stores",
              ingredients: ingredients.map((i) => i.ingredient),
              location: `${c.lat.toFixed(2)}, ${c.lng.toFixed(2)}`,
            },
          });
          if (error) throw error;
          setStores(data?.stores ?? []);
        } catch {
          setStores([
            {
              name: "Local Grocery",
              tier: "low",
              rating: 4.2,
              note: "Affordable everyday staples nearby.",
            },
            {
              name: "Whole Foods Market",
              tier: "high",
              rating: 4.6,
              note: "Premium organic & specialty.",
            },
          ]);
        } finally {
          setStoresLoading(false);
        }
      },
      () => {
        toast.info("Location denied.");
        setStoresLoading(false);
        setShopOpen(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const toggleOwned = (name: string) => {
    setOwnedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const exitCooking = () => {
    setCooking(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  };

  const goNextStep = () => {
    if (stepIndex < stepsWithSubs.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      exitCooking();
      burstConfetti(140);
      toast.success("Bon appétit! 🎉");
    }
  };

  // Voice narration: speak the current step (browser SpeechSynthesis — works offline, in APK, on Cloudflare).
  useEffect(() => {
    if (!cooking) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (!voiceOn) return;
    const text = stepsWithSubs[stepIndex];
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 0.95;
    const voices = window.speechSynthesis.getVoices();
    // Prefer the most human-sounding male English voices available across platforms.
    const malePatterns = [
      /google uk english male/i,
      /google us english.*male/i,
      /microsoft (guy|davis|brandon|christopher|tony|ryan|eric|jason|aaron)/i,
      /\b(daniel|alex|fred|aaron|arthur|oliver|rishi|tom|reed|rocko)\b/i,
      /male/i,
    ];
    let preferred: SpeechSynthesisVoice | undefined;
    for (const re of malePatterns) {
      preferred = voices.find((v) => /^en[-_]/i.test(v.lang) && re.test(v.name));
      if (preferred) break;
    }
    preferred = preferred || voices.find((v) => /^en[-_]/i.test(v.lang)) || voices[0];
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
    return () => window.speechSynthesis.cancel();
  }, [cooking, stepIndex, stepsWithSubs, voiceOn]);

  const toggleVoice = () => {
    setVoiceOn((v) => {
      const next = !v;
      try {
        localStorage.setItem("cookbuddy:voice", next ? "1" : "0");
      } catch {}
      if (!next && typeof window !== "undefined") window.speechSynthesis?.cancel();
      return next;
    });
  };

  // Swipe left/right between cooking steps
  const swipeRef = useMemo(() => ({ x: 0, y: 0, t: 0 }), []);
  const onSwipeStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeRef.x = t.clientX;
    swipeRef.y = t.clientY;
    swipeRef.t = Date.now();
  };
  const onSwipeEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeRef.x;
    const dy = t.clientY - swipeRef.y;
    if (Date.now() - swipeRef.t > 600) return;
    if (Math.abs(dx) < 60 || Math.abs(dy) > 50) return;
    if (dx < 0) goNextStep();
    else if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm">
        <Header />
        <div className="container py-20 text-center text-muted-foreground">Loading recipe…</div>
      </div>
    );
  }
  if (!meal) {
    return (
      <div className="min-h-screen bg-warm">
        <Header />
        <div className="container py-20 text-center">
          <p className="text-lg">Recipe not found.</p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            ← Back home
          </Link>
        </div>
      </div>
    );
  }

  const saved = isSaved(meal.idMeal);
  const ownedCount = ingredients.filter((i) => ownedIngredients.has(i.ingredient)).length;

  // ============= COOKING MODE — fullscreen immersive =============
  if (cooking) {
    const stepText = stepsWithSubs[stepIndex] ?? "";
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <CookingTutorialOverlay />
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
          <button
            onClick={exitCooking}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary"
            aria-label="Exit cooking mode"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Cooking Mode
            </p>
            <p className="truncate font-display text-sm font-black">{meal.strMeal}</p>
          </div>
          <button
            onClick={() => setTipOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary"
            aria-label="Chef tip"
          >
            <Lightbulb className="h-5 w-5 text-accent" />
          </button>
          <button
            onClick={toggleVoice}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary"
            aria-label={voiceOn ? "Mute voice" : "Unmute voice"}
          >
            {voiceOn ? (
              <Volume2 className="h-5 w-5 text-primary" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-gradient-primary transition-all duration-500"
              style={{ width: `${((stepIndex + 1) / Math.max(stepsWithSubs.length, 1)) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs font-bold text-muted-foreground">
            Step <span className="text-foreground">{stepIndex + 1}</span> of {stepsWithSubs.length}
          </p>
        </div>

        {/* Body — scrollable, swipe left/right to change step */}
        <div
          className="flex-1 overflow-y-auto px-4 py-5"
          onTouchStart={onSwipeStart}
          onTouchEnd={onSwipeEnd}
        >
          {/* AI-generated image for the current step */}
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-glow">
            <div className="relative aspect-video w-full overflow-hidden bg-secondary/40">
              {stepImages[stepIndex] ? (
                <img
                  src={stepImages[stepIndex]}
                  alt={`Step ${stepIndex + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <img
                    src={meal.strMealThumb}
                    alt={meal.strMeal}
                    className="h-full w-full object-cover opacity-40 blur-sm"
                  />
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div className="flex flex-col items-center gap-2 text-foreground/80">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">
                        Generating step image…
                      </p>
                    </div>
                  </div>
                </>
              )}
              {imagesLoading && stepImages[stepIndex] && (
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-bold text-primary backdrop-blur">
                  <Loader2 className="h-3 w-3 animate-spin" /> More cooking…
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {/* Current step card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                <ChefHat className="h-4 w-4" /> Step {stepIndex + 1}
              </div>
              <p className="font-display text-xl leading-relaxed sm:text-2xl">{stepText}</p>
            </div>

            {Object.keys(substitutes).length > 0 && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="mb-2 font-bold text-primary">Active substitutes</p>
                {Object.entries(substitutes).map(([o, s]) => (
                  <p key={o}>
                    • <strong>{s}</strong> instead of {o}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer controls */}
        <div className="border-t border-border bg-card/90 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="lg"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" /> Prev
            </Button>
            <p className="text-xs font-bold text-muted-foreground">
              {stepIndex + 1} / {stepsWithSubs.length}
            </p>
            <Button
              size="lg"
              onClick={goNextStep}
              className="rounded-full bg-gradient-primary text-primary-foreground"
            >
              {stepIndex < stepsWithSubs.length - 1 ? (
                <>Next <ChevronRight className="h-5 w-5" /></>
              ) : (
                <>Done 🎉</>
              )}
            </Button>
          </div>
        </div>

        {/* Chef tip popup */}
        <Dialog open={tipOpen} onOpenChange={setTipOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display">
                <Lightbulb className="h-5 w-5 text-accent" /> Chef's Tip
              </DialogTitle>
              <DialogDescription>Quick wisdom for this step.</DialogDescription>
            </DialogHeader>
            <p className="rounded-xl bg-secondary/50 p-4 text-sm leading-relaxed">
              {
                [
                  "Taste as you go — seasoning early creates depth.",
                  "Don't crowd the pan; give ingredients room to brown.",
                  "Let proteins rest before slicing to keep juices in.",
                  "Salt your pasta water like the sea.",
                  "Mise en place: prep everything before turning on heat.",
                ][stepIndex % 5]
              }
            </p>
          </DialogContent>
        </Dialog>

        {/* Substitute dialog (also works in cooking mode) */}
        <Dialog
          open={subDialog.open}
          onOpenChange={(v) => setSubDialog((s) => ({ ...s, open: v }))}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{subDialog.ingredient}</DialogTitle>
              <DialogDescription>Smart substitutes</DialogDescription>
            </DialogHeader>
            {subDialog.loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : subDialog.data ? (
              <div className="space-y-4">
                <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                  {subDialog.data.info}
                </p>
                <div className="space-y-2">
                  {subDialog.data.substitutes.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => {
                        setSubstitutes((prev) => ({ ...prev, [subDialog.ingredient]: s.name }));
                        toast.success(`Using ${s.name}`);
                        setSubDialog({ open: false, ingredient: "", data: null, loading: false });
                      }}
                      className="w-full rounded-xl border border-border bg-card p-3 text-left transition-smooth hover:border-primary hover:bg-primary/5"
                    >
                      <p className="font-display text-base font-bold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.note}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============= REGULAR RECIPE PAGE =============
  return (
    <div className="min-h-screen bg-warm pb-28">
      <Header />

      {/* Hero */}
      <section className="relative">
        <div className="relative h-[40vh] min-h-[260px] w-full overflow-hidden sm:h-[52vh]">
          <img src={meal.strMealThumb} alt={meal.strMeal} className="h-full w-full object-cover" />
          {/* Stronger bottom gradient so text never sits on photo */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
          <Link
            to="/"
            aria-label="Back"
            className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/85 backdrop-blur transition-smooth hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={() => toggle(meal.idMeal)}
            aria-label={saved ? "Unsave" : "Save"}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/85 backdrop-blur transition-smooth hover:scale-105"
          >
            <Heart
              className={cn("h-5 w-5", saved ? "fill-primary text-primary" : "text-foreground/70")}
            />
          </button>
        </div>

        {/* Title card sits BELOW the hero (not over it) so image never covers text */}
        <div className="container">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {meal.strCategory && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Tag className="mr-1 inline h-3 w-3" /> {meal.strCategory}
                </span>
              )}
              {meal.strArea && (
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground/70">
                  <MapPin className="mr-1 inline h-3 w-3" /> {meal.strArea}
                </span>
              )}
            </div>

            <h1 className="mt-4 font-display text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              {meal.strMeal}
            </h1>

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-secondary/50 p-4">
              <div className="text-center">
                <Clock className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1 text-base font-black">{cookTime}m</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cook</p>
              </div>
              <div className="border-x border-border text-center">
                <Flame className="mx-auto h-5 w-5 text-accent" />
                <p className="mt-1 text-base font-black">{calories}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">kcal</p>
              </div>
              <div className="text-center">
                <ChefHat className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1 text-base font-black">{servings}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Servings
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                size="lg"
                onClick={() => {
                  if (ingredients.length > 0 && ownedCount === 0) {
                    toast.message("Tick off your ingredients first", {
                      description:
                        "Mark which ingredients you have so we can guide you through cooking.",
                    });
                    return;
                  }
                  setCooking(true);
                }}
                className="flex-1 rounded-full bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-glow sm:flex-none"
              >
                <ChefHat className="h-4 w-4" /> Start Cooking
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 rounded-full sm:flex-none"
                onClick={() => {
                  setShopOpen(true);
                  if (!stores) requestLocationAndStores();
                }}
              >
                <ShoppingBasket className="h-4 w-4" /> Shopping List
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-side ingredients & instructions */}
      <section className="container mt-8 pb-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] md:gap-6">
          {/* Ingredients */}
          <aside className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-black">Ingredients</h2>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {ownedCount}/{ingredients.length} have
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap to mark you have it · Double-tap for swaps · Tags show optional and pre-made items
            </p>

            <ul className="mt-4 space-y-1.5">
              {ingredients.map((it, i) => {
                const owned = ownedIngredients.has(it.ingredient);
                const swap = substitutes[it.ingredient];
                const optional = isOptional(it.measure, it.ingredient);
                const premade = isPremade(it.measure, it.ingredient);
                return (
                  <li key={i}>
                    <button
                      onClick={() => toggleOwned(it.ingredient)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        fetchSubInfo(it.ingredient);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                        owned
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/40",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
                            owned
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {owned && <span className="text-[10px] font-black">✓</span>}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-sm font-bold leading-tight",
                              owned && "line-through opacity-60",
                            )}
                          >
                            {it.ingredient}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {premade && (
                              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary">
                                pre-made
                              </span>
                            )}
                            {optional && (
                              <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-accent">
                                optional
                              </span>
                            )}
                          </div>
                          {swap && <p className="text-[11px] text-primary">→ using {swap}</p>}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {it.measure}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Instructions */}
          <article className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
            <h2 className="font-display text-2xl font-black">Instructions</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Step-by-step · Watch the video in cooking mode
            </p>
            {videoPlan?.overview && (
              <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground/90">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-primary">Video overview</p>
                {videoPlan.overview}
              </div>
            )}
            {planLoading && !videoPlan && (
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Syncing steps to the video…</p>
            )}
            <ol className="mt-5 space-y-4">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-black text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 leading-relaxed text-foreground/90">{s}</p>
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      {/* Substitute dialog */}
      <Dialog open={subDialog.open} onOpenChange={(v) => setSubDialog((s) => ({ ...s, open: v }))}>
        <DialogContent className="w-[min(92vw,22rem)] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{subDialog.ingredient}</DialogTitle>
            <DialogDescription>Info & smart substitutes</DialogDescription>
          </DialogHeader>
          {subDialog.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : subDialog.data ? (
            <div className="space-y-3">
              <p className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed">
                {subDialog.data.info}
              </p>
              <div className="space-y-2">
                {subDialog.data.substitutes.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => {
                      setSubstitutes((prev) => ({ ...prev, [subDialog.ingredient]: s.name }));
                      toast.success(`Using ${s.name}`);
                      setSubDialog({ open: false, ingredient: "", data: null, loading: false });
                    }}
                    className="w-full rounded-2xl border border-border bg-card p-2.5 text-left transition-smooth hover:border-primary hover:bg-primary/5"
                  >
                    <p className="font-display text-sm font-bold">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{s.note}</p>
                  </button>
                ))}
              </div>
              {substitutes[subDialog.ingredient] && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSubstitutes((prev) => {
                      const n = { ...prev };
                      delete n[subDialog.ingredient];
                      return n;
                    });
                  }}
                >
                  <X className="h-4 w-4" /> Remove substitute
                </Button>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Shopping dialog */}
      <Dialog open={shopOpen} onOpenChange={setShopOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Shopping list</DialogTitle>
            <DialogDescription>Everything you need for {meal.strMeal}</DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-border bg-secondary/40 p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ingredients
            </p>
            <ul className="grid gap-1.5 text-sm">
              {ingredients.map((i, k) => (
                <li key={k} className="flex justify-between gap-3">
                  <span>{i.ingredient}</span>
                  <span className="text-muted-foreground">{i.measure}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-black">Find ingredients near you</p>
                {coords ? (
                  <p className="text-xs text-muted-foreground">
                    Location: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Allow location to see nearby stores.
                  </p>
                )}
              </div>
              {coords ? (
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`https://www.google.com/maps/search/grocery+store/@${coords.lat},${coords.lng},14z`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation className="h-4 w-4" /> Maps
                  </a>
                </Button>
              ) : (
                <Button size="sm" onClick={requestLocationAndStores} disabled={storesLoading}>
                  {storesLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}{" "}
                  Allow
                </Button>
              )}
            </div>

            {coords && (
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <NearbyStoresMap lat={coords.lat} lng={coords.lng} className="h-56 w-full" />
              </div>
            )}
            {(storesLoading || stores) && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="mr-1 inline h-3 w-3 text-primary" /> AI store picks
                </p>
                {storesLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
                {stores?.map((s) => (
                  <div key={s.name} className={cn("rounded-xl border p-3", tierColor(s.tier))}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-base font-black">{s.name}</p>
                        <p className="text-xs opacity-90">{s.note}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-bold uppercase tracking-wider">
                          {tierLabel(s.tier)}
                        </p>
                        <p className="text-xs">★ {s.rating?.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PlannerFab />
    </div>
  );
};

export default RecipePage;
