import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChefHat, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import {
  calcAge, calcCalories, useProfile,
  type Diet, type VegStyle, type Activity, type PlanType, PLAN_TYPE_LABELS,
} from "@/hooks/useProfile";
import { useMealPlan } from "@/hooks/useMealPlan";
import { CUISINE_REGIONS, FAMOUS_CUISINES } from "@/lib/regions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type Step =
  | "welcome-back"
  | "intro"
  | "birth"
  | "gender"
  | "body"
  | "activity"
  | "diet"
  | "vegStyle"
  | "allergies"
  | "preferences"
  | "cuisines"
  | "region-confirm"
  | "region-state"
  | "region-city"
  | "plan-type"
  | "review"
  | "generating";

const MealPlannerWizard = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const { profile, save } = useProfile();
  const { plan, save: savePlan } = useMealPlan();

  const [step, setStep] = useState<Step>("intro");
  const [draft, setDraft] = useState({
    birthdate: profile?.birthdate ?? "",
    gender: profile?.gender ?? ("prefer-not" as NonNullable<typeof profile>["gender"]),
    heightCm: profile?.heightCm?.toString() ?? "",
    weightKg: profile?.weightKg?.toString() ?? "",
    activity: profile?.activity ?? ("moderate" as Activity),
    diet: profile?.diet ?? ("both" as Diet),
    vegStyle: profile?.vegStyle ?? ("vegetarian" as VegStyle),
    allergies: profile?.allergies ?? "",
    preferences: profile?.preferences ?? "",
    cuisines: profile?.cuisines ?? "",
    region: profile?.region ?? { country: "", state: "", city: "" },
    planType: profile?.planType ?? ("balanced" as PlanType),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Decide starting step every time sheet opens
  useEffect(() => {
    if (!open) return;
    if (plan && profile?.completed) setStep("welcome-back");
    else if (profile?.completed) setStep("review");
    else setStep("intro");
  }, [open, plan, profile?.completed]);

  // primary cuisine for regional flow (first non-empty token)
  const primaryCuisine =
    draft.cuisines
      .split(",")
      .map((s) => s.trim())
      .find((s) => CUISINE_REGIONS[s]) ?? "";
  const region = primaryCuisine ? CUISINE_REGIONS[primaryCuisine] : null;

  const validateBody = () => {
    const e: Record<string, string> = {};
    const h = Number(draft.heightCm);
    const w = Number(draft.weightKg);
    if (!h || h < 80 || h > 250) e.heightCm = "Enter height between 80–250 cm";
    if (!w || w < 25 || w > 350) e.weightKg = "Enter weight between 25–350 kg";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateBirth = () => {
    const e: Record<string, string> = {};
    if (!draft.birthdate) e.birthdate = "Please pick your birthdate";
    else {
      const age = calcAge(draft.birthdate);
      if (age == null || age < 5 || age > 120) e.birthdate = "Please enter a valid birthdate (age 5–120)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const generate = async (finalProfile: any) => {
    setLoading(true);
    setStep("generating");
    try {
      const targetCalories = calcCalories(finalProfile);
      const { data, error } = await supabase.functions.invoke("generate-meal-plan", {
        body: { ...finalProfile, targetCalories },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.days) throw new Error("Plan format invalid");
      savePlan(data);
      toast.success("Your meal plan is ready!");
      onOpenChange(false);
      navigate("/planner");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't generate plan");
      setStep("review");
    } finally {
      setLoading(false);
    }
  };

  const finishOnboarding = () => {
    const finalProfile = {
      ...draft,
      heightCm: Number(draft.heightCm),
      weightKg: Number(draft.weightKg),
      age: calcAge(draft.birthdate),
      completed: true,
    };
    save(finalProfile);
    generate(finalProfile);
  };

  const headerTitle =
    step === "welcome-back" ? "Welcome back, chef!" : "Meal Planner";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <div className="flex h-full flex-col gap-6 pb-8 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                <ChefHat className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-black">{headerTitle}</h2>
                <p className="text-xs text-muted-foreground">Personalized by AI</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} aria-label="Close">
              ✕
            </Button>
          </div>

          {step === "welcome-back" && (
            <div className="flex flex-1 flex-col gap-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-display text-lg font-bold">You already have a meal plan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generated{" "}
                  {plan?.generatedAt
                    ? new Date(plan.generatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                    : "recently"}{" "}
                  · {plan?.days?.length ?? 7} days · ~{plan?.dailyCalories ?? "—"} kcal/day.
                </p>
              </div>
              <Button
                size="lg"
                className="bg-gradient-primary text-primary-foreground"
                onClick={() => { onOpenChange(false); navigate("/planner"); }}
              >
                Return to my plan →
              </Button>
              <Button size="lg" variant="outline" onClick={() => setStep("plan-type")}>
                <Sparkles className="h-4 w-4" /> Generate a new plan
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStep("birth")}>
                Edit my profile
              </Button>
            </div>
          )}

          {step === "intro" && (
            <div className="flex flex-1 flex-col gap-5">
              <p className="text-base text-muted-foreground">
                Quick setup so Sizzle AI can craft a 7-day plan tailored to <em>you</em> — your body, your taste, your region.
              </p>
              <Button size="lg" className="bg-gradient-primary text-primary-foreground" onClick={() => setStep("birth")}>
                <Sparkles className="h-4 w-4" /> Let's start
              </Button>
            </div>
          )}

          {step === "birth" && (
            <StepShell title="When were you born?" subtitle="We use this to calibrate calories.">
              <Label htmlFor="bd">Birthdate</Label>
              <Input
                id="bd"
                type="date"
                value={draft.birthdate}
                onChange={(e) => setDraft({ ...draft, birthdate: e.target.value })}
                max={new Date().toISOString().slice(0, 10)}
                aria-invalid={!!errors.birthdate}
              />
              {draft.birthdate && !errors.birthdate && (
                <p className="text-sm text-muted-foreground">
                  Age: <span className="font-semibold text-foreground">{calcAge(draft.birthdate)}</span>
                </p>
              )}
              {errors.birthdate && <p className="text-sm text-destructive">{errors.birthdate}</p>}
              <Nav next={() => { if (validateBirth()) setStep("gender"); }} disabled={!draft.birthdate} />
            </StepShell>
          )}

          {step === "gender" && (
            <StepShell title="Gender" subtitle="Affects metabolism & portion sizes.">
              <div className="grid grid-cols-2 gap-3">
                {(["male", "female", "other", "prefer-not"] as const).map((g) => (
                  <Pill
                    key={g}
                    active={draft.gender === g}
                    onClick={() => setDraft({ ...draft, gender: g })}
                  >
                    {g === "prefer-not" ? "Prefer not" : g[0].toUpperCase() + g.slice(1)}
                  </Pill>
                ))}
              </div>
              <Nav back={() => setStep("birth")} next={() => setStep("body")} />
            </StepShell>
          )}

          {step === "body" && (
            <StepShell title="Height & weight" subtitle="So we calculate your real calorie needs.">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="h">Height (cm)</Label>
                  <Input
                    id="h"
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 170"
                    value={draft.heightCm}
                    onChange={(e) => setDraft({ ...draft, heightCm: e.target.value })}
                    aria-invalid={!!errors.heightCm}
                  />
                  {errors.heightCm && <p className="mt-1 text-xs text-destructive">{errors.heightCm}</p>}
                </div>
                <div>
                  <Label htmlFor="w">Weight (kg)</Label>
                  <Input
                    id="w"
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 65"
                    value={draft.weightKg}
                    onChange={(e) => setDraft({ ...draft, weightKg: e.target.value })}
                    aria-invalid={!!errors.weightKg}
                  />
                  {errors.weightKg && <p className="mt-1 text-xs text-destructive">{errors.weightKg}</p>}
                </div>
              </div>
              <Nav back={() => setStep("gender")} next={() => { if (validateBody()) setStep("activity"); }} />
            </StepShell>
          )}

          {step === "activity" && (
            <StepShell title="Activity level" subtitle="Be honest — affects your daily calories.">
              <div className="grid gap-2">
                {(
                  [
                    { v: "sedentary", label: "Sedentary", note: "Little/no exercise" },
                    { v: "light", label: "Light", note: "1–3 workouts/week" },
                    { v: "moderate", label: "Moderate", note: "3–5 workouts/week" },
                    { v: "active", label: "Active", note: "6–7 workouts/week" },
                    { v: "very-active", label: "Very active", note: "Athlete / physical job" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setDraft({ ...draft, activity: o.v })}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-smooth",
                      draft.activity === o.v ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <p className="font-display text-base font-bold">{o.label}</p>
                    <p className="text-xs text-muted-foreground">{o.note}</p>
                  </button>
                ))}
              </div>
              <Nav back={() => setStep("body")} next={() => setStep("diet")} />
            </StepShell>
          )}

          {step === "diet" && (
            <StepShell title="What do you eat?" subtitle="Pick the closest match.">
              <div className="grid gap-3">
                {(
                  [
                    { v: "veg", label: "Vegetarian", note: "No meat or seafood" },
                    { v: "non-veg", label: "Non-Vegetarian", note: "Anything goes" },
                    { v: "both", label: "Both", note: "Mix of veg & non-veg" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setDraft({ ...draft, diet: o.v })}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-smooth",
                      draft.diet === o.v ? "border-primary bg-primary/10 shadow-soft" : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <p className="font-display text-lg font-bold">{o.label}</p>
                    <p className="text-sm text-muted-foreground">{o.note}</p>
                  </button>
                ))}
              </div>
              <Nav back={() => setStep("activity")} next={() => setStep(draft.diet === "veg" ? "vegStyle" : "allergies")} />
            </StepShell>
          )}

          {step === "vegStyle" && (
            <StepShell title="Vegan or Vegetarian?" subtitle="Includes dairy, eggs, honey?">
              <div className="grid gap-3">
                <button
                  onClick={() => setDraft({ ...draft, vegStyle: "vegan" })}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-smooth",
                    draft.vegStyle === "vegan" ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <p className="font-display text-lg font-bold">Full Vegan <span className="text-sm font-normal text-muted-foreground">(no animal-related products)</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">No dairy, eggs, honey, gelatin.</p>
                </button>
                <button
                  onClick={() => setDraft({ ...draft, vegStyle: "vegetarian" })}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-smooth",
                    draft.vegStyle === "vegetarian" ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <p className="font-display text-lg font-bold">Vegetarian <span className="text-sm font-normal text-muted-foreground">(animal-based products OK)</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">Dairy, eggs, honey allowed.</p>
                </button>
              </div>
              <Nav back={() => setStep("diet")} next={() => setStep("allergies")} />
            </StepShell>
          )}

          {step === "allergies" && (
            <StepShell title="Any allergies?" subtitle="Type them, separated by commas.">
              <Textarea
                placeholder="e.g. peanuts, shellfish, gluten"
                value={draft.allergies}
                onChange={(e) => setDraft({ ...draft, allergies: e.target.value })}
                rows={3}
                maxLength={300}
              />
              <Button variant="outline" onClick={() => { setDraft({ ...draft, allergies: "none" }); setStep("preferences"); }}>
                No allergies
              </Button>
              <Nav back={() => setStep(draft.diet === "veg" ? "vegStyle" : "diet")} next={() => setStep("preferences")} />
            </StepShell>
          )}

          {step === "preferences" && (
            <StepShell title="Food preferences" subtitle={`Tell us what you love.`}>
              <Textarea
                placeholder="e.g. spicy, low-carb, high-protein, quick meals"
                value={draft.preferences}
                onChange={(e) => setDraft({ ...draft, preferences: e.target.value })}
                rows={3}
                maxLength={300}
              />
              <Button variant="outline" onClick={() => { setDraft({ ...draft, preferences: "none" }); setStep("cuisines"); }}>
                No preferences
              </Button>
              <Nav back={() => setStep("allergies")} next={() => setStep("cuisines")} />
            </StepShell>
          )}

          {step === "cuisines" && (
            <StepShell title="Preferred cuisines" subtitle="Tap to pick (we'll customize regionally).">
              <div className="flex flex-wrap gap-1.5">
                {FAMOUS_CUISINES.map((c) => {
                  const set = new Set(draft.cuisines.split(",").map((s) => s.trim()).filter(Boolean));
                  const on = set.has(c);
                  return (
                    <button
                      key={c}
                      onClick={() => {
                        on ? set.delete(c) : set.add(c);
                        setDraft({ ...draft, cuisines: Array.from(set).join(", ") });
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-smooth",
                        on ? "border-primary bg-primary/15 text-primary" : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      {on ? "✓ " : "+"}{c}
                    </button>
                  );
                })}
              </div>
              <Nav
                back={() => setStep("preferences")}
                next={() => setStep(region ? "region-confirm" : "plan-type")}
                nextLabel={region ? `Next →` : "Next →"}
                disabled={!draft.cuisines.trim()}
              />
            </StepShell>
          )}

          {step === "region-confirm" && region && (
            <StepShell title={`Are you from ${region.country}?`} subtitle="So we tune the plan to local ingredients & dishes.">
              <div className="grid grid-cols-2 gap-3">
                <Pill
                  active={draft.region.country === region.country}
                  onClick={() => setDraft({ ...draft, region: { country: region.country, state: "", city: "" } })}
                >
                  Yes, I'm from {region.country}
                </Pill>
                <Pill
                  active={draft.region.country === "" && draft.region.state === ""}
                  onClick={() => setDraft({ ...draft, region: { country: "", state: "", city: "" } })}
                >
                  No, just love the food
                </Pill>
              </div>
              <Nav
                back={() => setStep("cuisines")}
                next={() => setStep(draft.region.country ? "region-state" : "plan-type")}
              />
            </StepShell>
          )}

          {step === "region-state" && region && (
            <StepShell title="Which state / region?" subtitle="">
              <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
                {region.states.map((s) => (
                  <Pill
                    key={s.name}
                    active={draft.region.state === s.name}
                    onClick={() => setDraft({ ...draft, region: { ...draft.region, state: s.name, city: "" } })}
                  >
                    {s.name}
                  </Pill>
                ))}
              </div>
              <Nav back={() => setStep("region-confirm")} next={() => setStep("region-city")} disabled={!draft.region.state} />
            </StepShell>
          )}

          {step === "region-city" && region && (
            <StepShell title="Which city?" subtitle="">
              <div className="grid grid-cols-2 gap-2">
                {region.states.find((s) => s.name === draft.region.state)?.cities.map((c) => (
                  <Pill
                    key={c}
                    active={draft.region.city === c}
                    onClick={() => setDraft({ ...draft, region: { ...draft.region, city: c } })}
                  >
                    {c}
                  </Pill>
                ))}
              </div>
              <Nav back={() => setStep("region-state")} next={() => setStep("plan-type")} disabled={!draft.region.city} />
            </StepShell>
          )}

          {step === "plan-type" && (
            <StepShell title="Pick a plan style" subtitle="You can change this anytime.">
              <div className="grid gap-2">
                {(Object.keys(PLAN_TYPE_LABELS) as PlanType[]).map((p) => {
                  const meta = PLAN_TYPE_LABELS[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setDraft({ ...draft, planType: p })}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-smooth",
                        draft.planType === p ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <p className="font-display text-base font-bold">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">{meta.note}</p>
                    </button>
                  );
                })}
              </div>
              {(() => {
                const cals = calcCalories({
                  ...draft,
                  age: calcAge(draft.birthdate),
                  heightCm: Number(draft.heightCm),
                  weightKg: Number(draft.weightKg),
                } as any);
                return cals ? (
                  <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                    Estimated daily target: <span className="font-bold text-primary">{cals} kcal</span>
                  </p>
                ) : null;
              })()}
              <Nav
                back={() => setStep(region && draft.region.country ? "region-city" : "cuisines")}
                next={finishOnboarding}
                nextLabel="Generate plan"
              />
            </StepShell>
          )}

          {step === "review" && profile?.completed && (
            <div className="flex flex-1 flex-col gap-4">
              <p className="text-sm text-muted-foreground">Edit your profile or generate a new plan.</p>
              <div className="rounded-xl border border-border bg-card p-4 text-sm">
                <Row k="Age" v={`${profile.age ?? "—"}`} />
                <Row k="Height/Weight" v={`${profile.heightCm ?? "—"} cm · ${profile.weightKg ?? "—"} kg`} />
                <Row k="Activity" v={profile.activity ?? "—"} />
                <Row k="Diet" v={profile.diet === "veg" ? `Vegetarian (${profile.vegStyle ?? ""})` : profile.diet ?? "—"} />
                <Row k="Cuisines" v={profile.cuisines || "—"} />
                {profile.region?.city && <Row k="Region" v={`${profile.region.city}, ${profile.region.state}`} />}
                <Row k="Daily target" v={`${calcCalories(profile) ?? "—"} kcal`} />
              </div>
              <Button size="lg" className="bg-gradient-primary text-primary-foreground" onClick={() => setStep("plan-type")}>
                <Sparkles className="h-4 w-4" /> Generate plan
              </Button>
              <Button variant="outline" onClick={() => setStep("birth")}>Edit profile</Button>
            </div>
          )}

          {step === "generating" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-display text-xl font-bold">Cooking up your plan…</p>
              <p className="text-sm text-muted-foreground">Sizzle AI is crafting 7 days of meals just for you.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between border-b border-border/60 py-1.5 last:border-0">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-medium">{v}</span>
  </div>
);

const StepShell = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
  <div className="flex flex-1 flex-col gap-4">
    <div>
      <h3 className="font-display text-2xl font-black">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-2xl border p-3 text-sm font-semibold transition-smooth",
      active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40"
    )}
  >
    {children}
  </button>
);

const Nav = ({
  back, next, disabled, nextLabel = "Next",
}: { back?: () => void; next?: () => void; disabled?: boolean; nextLabel?: string }) => (
  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
    {back ? (
      <Button variant="ghost" onClick={back}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
    ) : (<span />)}
    {next && (
      <Button onClick={next} disabled={disabled} className="bg-gradient-primary text-primary-foreground">
        {nextLabel} →
      </Button>
    )}
  </div>
);

export default MealPlannerWizard;
