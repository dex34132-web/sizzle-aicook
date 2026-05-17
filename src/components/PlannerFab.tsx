import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, Plus, Refrigerator, ScanLine, Upload } from "lucide-react";
import MealPlannerWizard from "./MealPlannerWizard";
import FridgeWizard from "./FridgeWizard";
import UploadRecipeDialog from "./UploadRecipeDialog";
import SizzleLensDialog from "./SizzleLensDialog";
import { useMealPlan } from "@/hooks/useMealPlan";
import { toast } from "sonner";

const PlannerFab = () => {
  const [open, setOpen] = useState(false);
  const [planner, setPlanner] = useState(false);
  const [fridge, setFridge] = useState(false);
  const [upload, setUpload] = useState(false);
  const [flavorLens, setSizzleLens] = useState(false);
  const { plan } = useMealPlan();

  const openPlanner = () => {
    setOpen(false);
    if (plan) {
      toast("You already have a meal plan", {
        description: "Want to view it or rebuild?",
        action: { label: "Open menu", onClick: () => setOpen(true) },
      });
    } else {
      setPlanner(true);
    }
  };

  const actions = [
    {
      name: "Fridge Chef",
      icon: Refrigerator,
      tone: "from-primary to-primary-glow",
      onClick: () => {
        setOpen(false);
        setFridge(true);
      },
    },
    {
      name: "Meal Planner",
      icon: ChefHat,
      tone: "from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-purple))]",
      onClick: openPlanner,
    },
    {
      name: "Upload Recipe",
      icon: Upload,
      tone: "from-[hsl(var(--brand-orange))] to-[hsl(var(--brand-pink))]",
      onClick: () => {
        setOpen(false);
        setUpload(true);
      },
    },
    {
      name: "SizzleLens",
      icon: ScanLine,
      tone: "from-[hsl(var(--brand-green))] to-[hsl(var(--brand-blue))]",
      onClick: () => {
        setOpen(false);
        setSizzleLens(true);
      },
    },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-[2px] z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-50">
        <AnimatePresence>
          {open && (
            <div className="absolute bottom-20 right-0 grid grid-cols-2 gap-3 w-[260px]">
              {actions.map((a, i) => (
                <motion.button
                  key={a.name}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={a.onClick}
                  className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-soft transition-transform hover:scale-105 active:scale-95"
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${a.tone} text-primary-foreground shadow-soft`}
                  >
                    <a.icon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider leading-tight text-foreground">
                    {a.name}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          animate={
            open
              ? { boxShadow: "0 25px 50px -12px hsl(var(--primary) / 0.35)" }
              : {
                  boxShadow: [
                    "0 0 20px hsl(var(--primary) / 0.45)",
                    "0 0 40px hsl(var(--primary) / 0.7)",
                    "0 0 20px hsl(var(--primary) / 0.45)",
                  ],
                }
          }
          transition={{
            duration: open ? 0.3 : 2.2,
            repeat: open ? 0 : Infinity,
            ease: "easeInOut",
          }}
          className="grid h-16 w-16 place-items-center rounded-full bg-card text-primary shadow-glow border border-border hover:scale-110 active:scale-95 transition-transform"
        >
          <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.25 }}>
            <Plus className="h-7 w-7" />
          </motion.span>
        </motion.button>
      </div>

      <MealPlannerWizard open={planner} onOpenChange={setPlanner} />
      <FridgeWizard open={fridge} onOpenChange={setFridge} />
      <UploadRecipeDialog open={upload} onOpenChange={setUpload} />
      <SizzleLensDialog open={flavorLens} onOpenChange={setSizzleLens} />
    </>
  );
};

export default PlannerFab;
