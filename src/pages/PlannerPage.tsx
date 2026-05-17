import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChefHat, Flame, ShoppingBasket, Sparkles, RefreshCw, Loader2,
  ArrowLeft, ChevronDown, FileDown, Pencil, ArrowRight, Play, Youtube,
} from "lucide-react";
import Header from "@/components/Header";
import PlannerFab from "@/components/PlannerFab";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMealPlan, type PlanMeal } from "@/hooks/useMealPlan";
import { useProfile, calcCalories, PLAN_TYPE_LABELS, type PlanType } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

const PlannerPage = () => {
  const { plan, save } = useMealPlan();
  const { profile, update } = useProfile();
  const [activeDay, setActiveDay] = useState(0);
  const [tab, setTab] = useState<"plan" | "shopping">("plan");
  const [regenLoading, setRegenLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [mealDetail, setMealDetail] = useState<PlanMeal | null>(null);
  const [stepIdx, setStepIdx] = useState(0);

  const day = plan?.days?.[activeDay];

  const totalCals = useMemo(
    () => day?.meals?.reduce((s, m) => s + (m.calories ?? 0), 0) ?? 0,
    [day]
  );

  const regenerate = async (overrides: Partial<NonNullable<typeof profile>> = {}) => {
    if (!profile) return;
    const merged = { ...profile, ...overrides };
    if (Object.keys(overrides).length) update(overrides);
    setRegenLoading(true);
    try {
      const targetCalories = calcCalories(merged);
      const { data, error } = await supabase.functions.invoke("generate-meal-plan", {
        body: { ...merged, targetCalories },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      save(data);
      toast.success("Fresh plan generated!");
      setActiveDay(0);
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't regenerate");
    } finally {
      setRegenLoading(false);
    }
  };

  const exportShoppingPDF = () => {
    if (!plan?.shoppingList?.length) {
      toast.error("No shopping list to export.");
      return;
    }
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Sizzle AI — Shopping List", margin, y);
    y += 26;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      `Generated ${new Date().toLocaleDateString()} · ${plan.days?.length ?? 7} days · ~${plan.dailyCalories ?? "—"} kcal/day`,
      margin, y
    );
    y += 24;
    doc.setTextColor(0);

    plan.shoppingList.forEach((cat) => {
      if (y > 760) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(cat.category, margin, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      cat.items.forEach((it) => {
        if (y > 780) { doc.addPage(); y = margin; }
        doc.text(`  □  ${it}`, margin, y);
        y += 14;
      });
      y += 10;
    });

    doc.save(`cookbuddy-shopping-${Date.now()}.pdf`);
    toast.success("Shopping list downloaded.");
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-warm">
        <Header />
        <div className="container py-20 text-center">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back home</Link>
          </Button>
          <ChefHat className="mx-auto h-14 w-14 text-primary" />
          <h1 className="mt-4 font-display text-3xl font-black">No meal plan yet</h1>
          <p className="mt-2 text-muted-foreground">
            Tap the floating chef button to set up your profile and generate your first plan.
          </p>
        </div>
        <PlannerFab />
      </div>
    );
  }

  const currentPlanType = (profile?.planType ?? "balanced") as PlanType;

  return (
    <div className="min-h-screen bg-warm pb-28">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute -left-20 -top-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-10 top-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <div className="container relative py-8 sm:py-12">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back home</Link>
          </Button>

          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Your AI meal plan
          </span>

          {/* Title with plan-type dropdown */}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <h1 className="font-display text-4xl font-black sm:text-5xl">
              {plan.days?.length ?? 7} days
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold transition-smooth hover:border-primary/40">
                  {PLAN_TYPE_LABELS[currentPlanType].label}
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {(Object.keys(PLAN_TYPE_LABELS) as PlanType[]).map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => regenerate({ planType: p })}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="font-semibold">{PLAN_TYPE_LABELS[p].label}</span>
                    <span className="text-xs text-muted-foreground">{PLAN_TYPE_LABELS[p].note}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {plan.summary && (
            <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">{plan.summary}</p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Stat icon={Flame} label="Daily target" value={`${plan.dailyCalories ?? "—"} kcal`} />
            <Stat icon={ChefHat} label="Days" value={`${plan.days?.length ?? 0}`} />
            <Stat icon={ShoppingBasket} label="List groups" value={`${plan.shoppingList?.length ?? 0}`} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => regenerate()} disabled={regenLoading} variant="outline">
              {regenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Regenerate
            </Button>
            <Button onClick={() => setEditOpen(true)} variant="outline">
              <Pencil className="h-4 w-4" /> Edit plan
            </Button>
            <Button onClick={exportShoppingPDF} variant="outline">
              <FileDown className="h-4 w-4" /> Export shopping list
            </Button>
            <div className="inline-flex rounded-full border border-border bg-card p-1">
              <TabBtn active={tab === "plan"} onClick={() => setTab("plan")}>Meal plan</TabBtn>
              <TabBtn active={tab === "shopping"} onClick={() => setTab("shopping")}>
                <ShoppingBasket className="h-4 w-4" /> Shopping list
              </TabBtn>
            </div>
          </div>
        </div>
      </section>

      {tab === "plan" ? (
        <section className="container mt-8">
          {/* Day picker */}
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-2">
              {plan.days?.map((d, i) => (
                <button
                  key={d.day + i}
                  onClick={() => setActiveDay(i)}
                  className={cn(
                    "shrink-0 rounded-2xl border px-5 py-3 text-center transition-smooth",
                    i === activeDay
                      ? "border-transparent bg-gradient-primary text-primary-foreground shadow-soft"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Day {i + 1}</p>
                  <p className="font-display text-lg font-black">{d.day}</p>
                </button>
              ))}
            </div>
          </div>

          {day && (
            <div className="mt-8">
              <div className="mb-4 flex items-end justify-between">
                <h2 className="font-display text-3xl font-black">{day.day}</h2>
                <span className="text-sm text-muted-foreground">~{totalCals} kcal</span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {day.meals?.map((m, i) => (
                  <article
                    key={i}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-glow"
                  >
                    <div className="absolute right-4 top-4 rounded-full bg-gradient-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-soft">
                      {m.type}
                    </div>
                    <h3 className="pr-20 font-display text-2xl font-black leading-tight">{m.name}</h3>
                    {m.calories != null && (
                      <p className="mt-1 text-sm text-muted-foreground">~{m.calories} kcal</p>
                    )}

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ingredients</p>
                        <ul className="mt-2 space-y-1.5 text-sm">
                          {m.ingredients?.slice(0, 6).map((ing, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {ing}
                            </li>
                          ))}
                          {m.ingredients && m.ingredients.length > 6 && (
                            <li className="text-xs italic text-muted-foreground">+{m.ingredients.length - 6} more…</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Steps</p>
                        <ol className="mt-2 space-y-2 text-sm">
                          {m.steps?.slice(0, 3).map((s, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-primary text-[11px] font-bold text-primary-foreground">
                                {j + 1}
                              </span>
                              <span className="leading-relaxed">{s}</span>
                            </li>
                          ))}
                          {m.steps && m.steps.length > 3 && (
                            <li className="text-xs italic text-muted-foreground">+{m.steps.length - 3} more…</li>
                          )}
                        </ol>
                      </div>
                    </div>

                    {m.tip && (
                      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                        <span className="font-bold text-primary">Chef's tip:</span> {m.tip}
                      </div>
                    )}

                    {/* "Click me" arrow chip */}
                    <button
                      type="button"
                      onClick={() => { setMealDetail(m); setStepIdx(0); }}
                      className="absolute right-4 bottom-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow transition-smooth hover:scale-105"
                      aria-label="Open full recipe"
                    >
                      <ArrowRight className="h-4 w-4" /> Click me
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="container mt-8">
          <div className="mb-4 flex items-center justify-end">
            <Button onClick={exportShoppingPDF} variant="outline" size="sm">
              <FileDown className="h-4 w-4" /> Export PDF
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {plan.shoppingList?.map((cat, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h3 className="font-display text-xl font-black">{cat.category}</h3>
                <ul className="mt-3 space-y-2">
                  {cat.items?.map((it, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!plan.shoppingList?.length && (
              <p className="text-muted-foreground">No shopping list provided in this plan.</p>
            )}
          </div>
        </section>
      )}

      <PlannerFab />

      {/* Edit Plan dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Edit your plan</DialogTitle>
            <DialogDescription>Tweak any of these — we'll regenerate fresh.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan style</p>
            {(Object.keys(PLAN_TYPE_LABELS) as PlanType[]).map((p) => (
              <button
                key={p}
                onClick={() => regenerate({ planType: p })}
                disabled={regenLoading}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-smooth",
                  currentPlanType === p ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}
              >
                <p className="font-display text-base font-bold">{PLAN_TYPE_LABELS[p].label}</p>
                <p className="text-xs text-muted-foreground">{PLAN_TYPE_LABELS[p].note}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Meal detail dialog: ingredients + youtube + cooking-mode stepper */}
      <Dialog open={!!mealDetail} onOpenChange={(v) => !v && setMealDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {mealDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{mealDetail.name}</DialogTitle>
                <DialogDescription>
                  {mealDetail.type} · ~{mealDetail.calories ?? "—"} kcal
                </DialogDescription>
              </DialogHeader>

              {/* YouTube via search query */}
              {mealDetail.youtubeQuery && (
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(mealDetail.youtubeQuery)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-smooth hover:border-primary/40"
                >
                  <Youtube className="h-4 w-4 text-red-500" /> Find tutorial: "{mealDetail.youtubeQuery}"
                </a>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ingredients</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {mealDetail.ingredients?.map((ing, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cooking mode</p>
                  <div className="mt-2 rounded-xl border border-border bg-secondary/40 p-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-gradient-primary transition-all"
                        style={{ width: `${((stepIdx + 1) / Math.max(mealDetail.steps.length, 1)) * 100}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Step {stepIdx + 1} of {mealDetail.steps.length}
                    </p>
                    <p className="mt-2 font-display text-lg leading-snug">{mealDetail.steps[stepIdx]}</p>
                    <div className="mt-4 flex justify-between">
                      <Button size="sm" variant="outline" disabled={stepIdx === 0} onClick={() => setStepIdx((i) => i - 1)}>
                        ← Prev
                      </Button>
                      {stepIdx < mealDetail.steps.length - 1 ? (
                        <Button size="sm" className="bg-gradient-primary text-primary-foreground" onClick={() => setStepIdx((i) => i + 1)}>
                          <Play className="h-3 w-3 fill-current" /> Next
                        </Button>
                      ) : (
                        <Button size="sm" className="bg-gradient-primary text-primary-foreground" onClick={() => setMealDetail(null)}>
                          Done 🎉
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {mealDetail.tip && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                  <span className="font-bold text-primary">Chef's tip:</span> {mealDetail.tip}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
      <Icon className="h-4 w-4" />
    </span>
    <div className="leading-tight">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-base font-black">{value}</p>
    </div>
  </div>
);

const TabBtn = ({ active, onClick, children }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-smooth",
      active ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-foreground/70"
    )}
  >
    {children}
  </button>
);

export default PlannerPage;
