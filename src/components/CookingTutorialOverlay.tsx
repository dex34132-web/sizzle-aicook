import { useEffect, useState } from "react";
import { Volume2, Hand, ChevronRight, ChefHat } from "lucide-react";

const SEEN_KEY = "sizzle:cooking-tutorial-seen";

interface Step {
  title: string;
  body: string;
  icon: React.ReactNode;
  highlight: string; // tailwind position classes for the arrow box
}

const STEPS: Step[] = [
  {
    title: "Voice narration",
    body: "Tap this to hear each step read aloud. Hands stay clean, eyes stay on the pan.",
    icon: <Volume2 className="h-6 w-6 text-primary" />,
    highlight: "top-3 right-4 h-12 w-12",
  },
  {
    title: "Swipe to navigate",
    body: "Swipe left for the next step, right for the previous one.",
    icon: <Hand className="h-6 w-6 text-primary" />,
    highlight: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-64",
  },
  {
    title: "Next step button",
    body: "Or tap Next to advance when you're ready.",
    icon: <ChevronRight className="h-6 w-6 text-primary" />,
    highlight: "bottom-6 left-1/2 -translate-x-1/2 h-14 w-48",
  },
  {
    title: "Chef tips",
    body: "Tap the lightbulb anytime for a quick chef's tip on the current step.",
    icon: <ChefHat className="h-6 w-6 text-primary" />,
    highlight: "top-3 right-[7.5rem] h-12 w-12",
  },
];

export default function CookingTutorialOverlay() {
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SEEN_KEY)) return;
    const t = setTimeout(() => setActive(true), 500);
    return () => clearTimeout(t);
  }, []);

  if (!active) return null;
  const step = STEPS[i];

  const advance = () => {
    if (i < STEPS.length - 1) setI(i + 1);
    else {
      localStorage.setItem(SEEN_KEY, "1");
      setActive(false);
    }
  };

  return (
    <div
      onClick={advance}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      {/* highlight box */}
      <div
        className={`absolute ${step.highlight} rounded-2xl border-2 border-primary ring-4 ring-primary/40 animate-pulse pointer-events-none`}
      />
      {/* tooltip */}
      <div className="absolute inset-x-4 bottom-28 sm:bottom-32 rounded-2xl border border-primary/30 bg-card p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15">
            {step.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">
              {i + 1} of {STEPS.length} · Tutorial
            </p>
            <h3 className="mt-1 font-display text-lg font-black">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            <p className="mt-3 text-xs font-bold text-primary">
              Tap anywhere to {i < STEPS.length - 1 ? "continue" : "start cooking"} →
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
