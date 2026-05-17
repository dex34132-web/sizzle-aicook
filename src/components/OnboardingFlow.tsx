import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import waterBg from "@/assets/water-bg.jpg";
import { useAuth } from "./AuthProvider";

const CUISINES = [
  { id: "Indian", emoji: "🍛" },
  { id: "Italian", emoji: "🍝" },
  { id: "Mexican", emoji: "🌮" },
  { id: "Chinese", emoji: "🥡" },
  { id: "Japanese", emoji: "🍣" },
  { id: "Thai", emoji: "🍜" },
  { id: "French", emoji: "🥐" },
  { id: "American", emoji: "🍔" },
  { id: "Mediterranean", emoji: "🫒" },
  { id: "Korean", emoji: "🍲" },
  { id: "Middle Eastern", emoji: "🥙" },
  { id: "Spanish", emoji: "🥘" },
];

const DIETARY = [
  { id: "No restrictions", emoji: "🍽️" },
  { id: "Vegetarian", emoji: "🥗" },
  { id: "Vegan", emoji: "🌱" },
  { id: "Pescatarian", emoji: "🐟" },
  { id: "Gluten-free", emoji: "🌾" },
  { id: "Dairy-free", emoji: "🥛" },
  { id: "Nut-free", emoji: "🥜" },
  { id: "Halal", emoji: "🕌" },
  { id: "Kosher", emoji: "✡️" },
  { id: "Low-carb", emoji: "🥑" },
  { id: "High-protein", emoji: "💪" },
];

type Step = "name" | "cuisine" | "diet";

export default function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const { setDisplayName, setPreferences } = useAuth();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [diet, setDiet] = useState<string[]>([]);

  const finish = () => {
    setDisplayName(name.trim());
    setPreferences({ cuisines, diet });
    onDone();
  };

  const next = (e?: FormEvent) => {
    e?.preventDefault();
    if (step === "name") {
      if (!name.trim()) return;
      setStep("cuisine");
    } else if (step === "cuisine") {
      setStep("diet");
    } else {
      finish();
    }
  };

  const back = () => {
    if (step === "cuisine") setStep("name");
    else if (step === "diet") setStep("cuisine");
  };

  const toggle = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const stepNum = step === "name" ? 1 : step === "cuisine" ? 2 : 3;

  return (
    <div className="auth-water-bg relative min-h-screen overflow-hidden text-white">
      <img src={waterBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/25 via-teal-900/45 to-slate-950/85" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] sm:p-7"
        >
          {/* Step indicator */}
          <div className="mb-4 flex items-center justify-center gap-2">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full transition-all ${
                  n === stepNum ? "w-8 bg-white" : n < stepNum ? "w-4 bg-white/70" : "w-4 bg-white/20"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === "name" && (
              <motion.form
                key="name"
                onSubmit={next}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  <Sparkles className="h-3.5 w-3.5" /> Let's get personal
                </div>
                <h1 className="mt-4 text-center font-display text-3xl font-black">
                  What should I call you?
                </h1>
                <p className="mt-2 text-center text-sm text-white/70">
                  We'll use this name throughout your kitchen journey.
                </p>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={30}
                  placeholder="Your name"
                  className="mt-6 w-full rounded-lg border border-white/20 bg-white/10 px-5 py-4 text-center text-lg font-semibold text-white placeholder:text-white/40 outline-none focus:border-white/50"
                />
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[hsl(var(--brand-pink))] via-[hsl(var(--brand-orange))] to-[hsl(var(--brand-green))] py-4 font-bold text-white shadow-glow transition-all disabled:opacity-50"
                >
                  Continue <ArrowRight className="h-5 w-5" />
                </button>
              </motion.form>
            )}

            {step === "cuisine" && (
              <motion.div
                key="cuisine"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  <Sparkles className="h-3.5 w-3.5" /> Hi, {name}! 👋
                </div>
                <h2 className="mt-3 text-center font-display text-2xl font-black">
                  What cuisines do you love?
                </h2>
                <p className="mt-1 text-center text-sm text-white/70">
                  Pick a few — we'll surface more of these.
                </p>
                <div className="mt-5 grid max-h-[44vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {CUISINES.map((c) => {
                    const active = cuisines.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggle(cuisines, setCuisines, c.id)}
                        className={`relative rounded-lg border px-3 py-3 text-left text-sm font-semibold transition-all ${
                          active
                            ? "border-white bg-white/20 text-white"
                            : "border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                        }`}
                      >
                        <span className="mr-2">{c.emoji}</span>
                        {c.id}
                        {active && (
                          <Check className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={back}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3.5 text-sm font-bold text-white/80"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => next()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[hsl(var(--brand-pink))] via-[hsl(var(--brand-orange))] to-[hsl(var(--brand-green))] py-3.5 font-bold text-white shadow-glow"
                  >
                    {cuisines.length === 0 ? "Skip" : `Continue (${cuisines.length})`}{" "}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === "diet" && (
              <motion.div
                key="diet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  <Sparkles className="h-3.5 w-3.5" /> Almost done
                </div>
                <h2 className="mt-3 text-center font-display text-2xl font-black">
                  Any food preferences?
                </h2>
                <p className="mt-1 text-center text-sm text-white/70">
                  We'll factor these into your meal plans.
                </p>
                <div className="mt-5 grid max-h-[44vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {DIETARY.map((d) => {
                    const active = diet.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggle(diet, setDiet, d.id)}
                        className={`relative rounded-lg border px-3 py-3 text-left text-sm font-semibold transition-all ${
                          active
                            ? "border-white bg-white/20 text-white"
                            : "border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                        }`}
                      >
                        <span className="mr-2">{d.emoji}</span>
                        {d.id}
                        {active && (
                          <Check className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={back}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3.5 text-sm font-bold text-white/80"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => next()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[hsl(var(--brand-pink))] via-[hsl(var(--brand-orange))] to-[hsl(var(--brand-green))] py-3.5 font-bold text-white shadow-glow"
                  >
                    Start cooking <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}