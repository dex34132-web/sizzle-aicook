import { useEffect, useRef, useState, type TouchEvent } from "react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Refrigerator, Camera, Type, Sparkles, ChefHat, Loader2, ArrowRight, ArrowLeft,
  CheckCircle2, X, Image as ImageIcon, Upload, Soup,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Recipe {
  detectedItems: string[];
  dishName: string;
  shortDescription: string;
  cuisine: string;
  difficulty: string;
  timeMinutes: number;
  servings: number;
  ingredients: { name: string; amount: string; haveIt: boolean }[];
  steps: { title: string; detail: string; imagePrompt: string; imageUrl?: string }[];
}

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

const STEPS = ["Ingredients", "Food type", "Accuracy", "Generate"] as const;

export default function FridgeWizard({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(0);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [textItems, setTextItems] = useState("");
  const [foodType, setFoodType] = useState<"any" | "veg" | "vegan" | "non-veg">("any");
  const [accuracy, setAccuracy] = useState<"strict" | "balanced" | "loose">("balanced");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // swipe — only register horizontal gestures, never on results step
  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current == null || touchY.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    touchX.current = null;
    touchY.current = null;
    // Disable swipe entirely on the final results step (user is scrolling)
    if (step === STEPS.length - 1) return;
    // Require dominantly horizontal gesture (>2x vertical) and meaningful distance
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return;
    if (dx < 0 && canNext()) goNext();
    else if (dx > 0 && step > 0) setStep(step - 1);
  };

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(0); setImageDataUrl(null); setTextItems(""); setRecipe(null);
        setFoodType("any"); setAccuracy("balanced");
      }, 300);
    }
  }, [open]);

  const canNext = () => {
    if (step === 0) return !!(imageDataUrl || textItems.trim());
    return step < STEPS.length - 1;
  };
  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));

  const handleFile = (file: File) => {
    if (file.size > 6 * 1024 * 1024) { toast.error("Image too large (max 6 MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    setLoading(true); setRecipe(null);
    try {
      const { data, error } = await supabase.functions.invoke("fridge-chef", {
        body: { mode: "recipe", imageDataUrl, textItems, foodType, accuracy },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const rec = data as Recipe;
      setRecipe(rec);
      // fire image generation in background, one at a time to be gentle
      setGeneratingImages(true);
      (async () => {
        for (let i = 0; i < rec.steps.length; i++) {
          try {
            const { data: imgData } = await supabase.functions.invoke("fridge-chef", {
              body: { mode: "stepImage", prompt: rec.steps[i].imagePrompt },
            });
            const url = (imgData as any)?.imageUrl;
            if (url) {
              setRecipe((cur) => {
                if (!cur) return cur;
                const next = { ...cur, steps: cur.steps.map((s, idx) => idx === i ? { ...s, imageUrl: url } : s) };
                return next;
              });
            }
          } catch { /* ignore single failure */ }
        }
        setGeneratingImages(false);
      })();
    } catch (e: any) {
      toast.error(e?.message ?? "AI couldn't generate a recipe");
    } finally {
      setLoading(false);
    }
  };

  // Auto-trigger generate when entering last step
  useEffect(() => {
    if (open && step === STEPS.length - 1 && !recipe && !loading) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-[100dvh] w-full max-w-none gap-0 overflow-hidden rounded-none border-0 bg-gradient-to-b from-primary/15 via-background to-background p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <DialogTitle className="sr-only">Fridge Chef AI</DialogTitle>
        <DialogDescription className="sr-only">Take a photo or type what's in your fridge — AI will suggest a dish.</DialogDescription>

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-border/50 bg-background/70 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
              <Refrigerator className="h-4 w-4" />
            </span>
            <div className="leading-none">
              <p className="font-display text-lg font-black">Fridge Chef</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Powered by AI</p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-secondary/80" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className={cn(
                "grid h-7 min-w-7 place-items-center rounded-full px-2 text-[11px] font-bold transition-smooth",
                i === step
                  ? "bg-gradient-primary text-primary-foreground shadow-soft"
                  : i < step ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              )}>
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {i < STEPS.length - 1 && <span className={cn("h-0.5 w-5 rounded-full", i < step ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-28">
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-primary/10 p-4">
                <p className="font-display text-2xl font-black text-primary">Don't know what to cook?</p>
                <p className="mt-1 text-sm text-muted-foreground">Snap your fridge or type ingredients — AI will whip up a recipe.</p>
              </div>

              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {imageDataUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-border">
                  <img src={imageDataUrl} alt="fridge" className="h-48 w-full object-cover" />
                  <button onClick={() => setImageDataUrl(null)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 backdrop-blur" aria-label="Remove">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => cameraRef.current?.click()} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-smooth hover:-translate-y-0.5 hover:border-primary hover:shadow-soft">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                      <Camera className="h-5 w-5" />
                    </span>
                    <p className="font-semibold">Take photo</p>
                    <p className="text-[11px] text-muted-foreground">Use camera</p>
                  </button>
                  <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-smooth hover:-translate-y-0.5 hover:border-primary hover:shadow-soft">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-primary">
                      <Upload className="h-5 w-5" />
                    </span>
                    <p className="font-semibold">Upload</p>
                    <p className="text-[11px] text-muted-foreground">From gallery</p>
                  </button>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="bg-background px-2 text-muted-foreground">or type</span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">What's on your shelves?</label>
                <textarea
                  value={textItems}
                  onChange={(e) => setTextItems(e.target.value.slice(0, 400))}
                  placeholder="e.g. eggs, spinach, tomato, paneer, leftover rice…"
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Pick the kind of dish you want.</p>
              {([
                { v: "any", label: "Anything", desc: "Surprise me" },
                { v: "veg", label: "Vegetarian", desc: "No meat, eggs/dairy ok" },
                { v: "vegan", label: "Vegan", desc: "No animal products" },
                { v: "non-veg", label: "Non-Vegetarian", desc: "Meat or seafood" },
              ] as const).map((o) => (
                <button
                  key={o.v}
                  onClick={() => setFoodType(o.v)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-smooth",
                    foodType === o.v ? "border-primary bg-primary/10 shadow-soft" : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div>
                    <p className="font-display text-base font-bold">{o.label}</p>
                    <p className="text-xs text-muted-foreground">{o.desc}</p>
                  </div>
                  {foodType === o.v && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">How precise should the recipe be?</p>
              {([
                { v: "strict", label: "Strict", desc: "Use ONLY items I have" },
                { v: "balanced", label: "Balanced", desc: "Allow common pantry staples" },
                { v: "loose", label: "Creative", desc: "Add 1-2 missing items if needed" },
              ] as const).map((o) => (
                <button
                  key={o.v}
                  onClick={() => setAccuracy(o.v)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-smooth",
                    accuracy === o.v ? "border-primary bg-primary/10 shadow-soft" : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div>
                    <p className="font-display text-base font-bold">{o.label}</p>
                    <p className="text-xs text-muted-foreground">{o.desc}</p>
                  </div>
                  {accuracy === o.v && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {loading && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-display text-xl font-black">Cooking up ideas…</p>
                  <p className="text-sm text-muted-foreground">AI is reading your fridge.</p>
                </div>
              )}
              {recipe && (
                <>
                  <div className="rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-90">
                      <Sparkles className="h-3.5 w-3.5" /> Your AI dish
                    </div>
                    <p className="mt-2 font-display text-2xl font-black leading-tight">{recipe.dishName}</p>
                    <p className="mt-1 text-sm opacity-90">{recipe.shortDescription}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                      <span className="rounded-full bg-white/20 px-2 py-0.5">{recipe.cuisine}</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5">{recipe.difficulty}</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5">⏱ {recipe.timeMinutes} min</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5">🍽 {recipe.servings}</span>
                    </div>
                  </div>

                  {recipe.detectedItems?.length > 0 && (
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Detected in fridge</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.detectedItems.map((it) => (
                          <span key={it} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{it}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ingredients</p>
                    <ul className="space-y-1.5 text-sm">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span className={cn("inline-block h-2 w-2 rounded-full", ing.haveIt ? "bg-emerald-500" : "bg-amber-500")} />
                            <span className="font-medium">{ing.name}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">{ing.amount}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[10px] text-muted-foreground">🟢 you have · 🟡 need to grab</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step-by-step</p>
                      {generatingImages && (
                        <span className="flex items-center gap-1 text-[10px] text-primary">
                          <Loader2 className="h-3 w-3 animate-spin" /> Generating step images
                        </span>
                      )}
                    </div>
                    <ol className="space-y-4">
                      {recipe.steps.map((s, i) => (
                        <li key={i} className="rounded-xl border border-border bg-background p-3">
                          <div className="flex items-start gap-3">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-display text-sm font-bold">{s.title}</p>
                              <p className="mt-0.5 text-sm text-foreground/80">{s.detail}</p>
                            </div>
                          </div>
                          <div className="mt-3 aspect-video w-full overflow-hidden rounded-lg bg-secondary/50">
                            {s.imageUrl ? (
                              <img src={s.imageUrl} alt={s.title} className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-1 text-[11px]">
                                  <ImageIcon className="h-5 w-5 opacity-50" />
                                  {generatingImages ? "AI image cooking…" : "Image queued"}
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <Button onClick={() => { setRecipe(null); setStep(0); }} variant="outline" className="w-full">
                    <Soup className="h-4 w-4" /> Try another recipe
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step < STEPS.length - 1 ? (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-border/60 bg-background/95 p-3 backdrop-blur">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <p className="hidden sm:block text-[11px] text-muted-foreground">Tip: swipe left/right</p>
            <Button onClick={goNext} disabled={!canNext()} className="bg-gradient-primary text-primary-foreground">
              {step === STEPS.length - 2 ? <><ChefHat className="h-4 w-4" /> Cook!</> : <>Next <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>
        ) : (
          // Results step — sticky "Back to menu" so it never gets lost while scrolling
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-border/60 bg-background/95 p-3 backdrop-blur">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="h-4 w-4" /> Back to menu
            </Button>
            <Button
              variant="outline"
              onClick={() => { setRecipe(null); setStep(0); }}
              disabled={loading}
            >
              <Soup className="h-4 w-4" /> Try another
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
