import { useEffect, useState } from "react";
import { ChefHat, X } from "lucide-react";
import { useLocation } from "react-router-dom";

const FACTS = [
  "Honey never spoils — archaeologists have eaten 3,000-year-old honey from Egyptian tombs.",
  "Adding a pinch of salt to coffee reduces bitterness.",
  "Resting steak after cooking lets the juices redistribute — don't skip it.",
  "Toasting spices in dry heat unlocks 2–3× more aroma.",
  "Cold butter = flaky pastry. Warm butter = chewy cookie.",
  "A wooden spoon across a boiling pot helps prevent boil-over.",
  "Tomatoes are technically fruits, botanically berries.",
  "Searing meat doesn't 'seal in juices' — it builds Maillard flavor.",
  "Adding a splash of vinegar to poaching water keeps eggs tight.",
  "Cast iron gets non-stick from polymerized oil, not magic.",
  "Onions caramelize fully in ~45 minutes — not 10.",
  "Cucumbers are 96% water — the most hydrating veggie.",
  "Garlic releases more allicin when crushed than sliced.",
  "Pasta water is liquid gold — its starch binds sauce to noodles.",
  "Rinsing rice removes surface starch for fluffier grains.",
];

export default function CookingFunFacts() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const location = useLocation();

  // Only show on the home page. Other pages (recipe, saved, planner,
  // cooking mode menus) have their own controls and the card was
  // covering the speed-dial / next button.
  const onHome = location.pathname === "/";

  useEffect(() => {
    if (!onHome) { setVisible(false); return; }
    if (dismissed) return;
    const showTimer = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(showTimer);
  }, [dismissed, onHome]);

  useEffect(() => {
    if (!visible || dismissed || !onHome) return;
    const cycle = setInterval(() => {
      setIndex((i) => (i + 1) % FACTS.length);
    }, 12000);
    return () => clearInterval(cycle);
  }, [visible, dismissed, onHome]);

  if (!onHome || dismissed || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-24 sm:right-auto sm:max-w-[18rem] z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-none">
      <div className="pointer-events-auto">
      <div className="group relative flex items-start gap-2 rounded-lg border border-primary/20 bg-card/95 backdrop-blur-md p-2 pr-7 shadow-soft hover:shadow-lg transition-shadow">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-gradient-primary text-primary-foreground">
          <ChefHat className="h-3 w-3" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary mb-0.5">Fun Fact</p>
          <p className="text-[11px] leading-snug text-foreground line-clamp-3">{FACTS[index]}</p>
        </div>
        <button
          aria-label="Dismiss fun fact"
          onClick={() => setDismissed(true)}
          className="absolute top-1 right-1 p-0.5 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      </div>
    </div>
  );
}
