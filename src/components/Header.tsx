import {
  Heart,
  Menu,
  Settings,
  Shuffle,
  BookOpen,
  Home,
  Sparkles,
  Camera,
  Calendar,
  ShoppingCart,
  Upload,
  ScanLine,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getRandomMeal } from "@/lib/mealdb";
import { toast } from "sonner";
import logo from "@/assets/savour-logo.png";
import dakshLogo from "@/assets/daksh-studio.png";
import SettingsDialog from "./SettingsDialog";
import UserMenu from "./UserMenu";
import NotificationsPanel from "./NotificationsPanel";
import UploadRecipeDialog from "./UploadRecipeDialog";
import SizzleLensDialog from "./SizzleLensDialog";
import { useEdgeSwipeMenu } from "@/hooks/useEdgeSwipeMenu";

const Header = () => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [flavorLensOpen, setSizzleLensOpen] = useState(false);

  useEdgeSwipeMenu({ open: menuOpen, setOpen: setMenuOpen });

  const onSurprise = async () => {
    setLoadingRandom(true);
    setMenuOpen(false);
    try {
      const meal = await getRandomMeal();
      if (meal) navigate(`/recipe/${meal.idMeal}`);
      else toast.error("Couldn't fetch a recipe.");
    } finally {
      setLoadingRandom(false);
    }
  };

  const items = [
    {
      icon: Home,
      label: "Home",
      action: () => {
        setMenuOpen(false);
        navigate("/");
      },
    },
    { icon: Shuffle, label: loadingRandom ? "Loading…" : "Surprise me", action: onSurprise },
    {
      icon: Heart,
      label: "Saved",
      action: () => {
        setMenuOpen(false);
        navigate("/saved");
      },
    },
    {
      icon: BookOpen,
      label: "My Plan",
      action: () => {
        setMenuOpen(false);
        navigate("/planner");
      },
    },
    {
      icon: ShoppingCart,
      label: "Shopping List",
      action: () => {
        setMenuOpen(false);
        toast.info("Open any recipe to build its shopping list.");
      },
    },
    {
      icon: Upload,
      label: "Upload Recipe",
      action: () => {
        setMenuOpen(false);
        setUploadOpen(true);
      },
    },
    {
      icon: ScanLine,
      label: "SizzleLens",
      action: () => {
        setMenuOpen(false);
        setSizzleLensOpen(true);
      },
    },
  ];

  const promos = [
    {
      icon: Calendar,
      title: "7-Day Meal Plans",
      desc: "Personalized for your goals",
      action: () => {
        setMenuOpen(false);
        navigate("/planner");
      },
    },
    {
      icon: Camera,
      title: "Fridge Chef",
      desc: "Snap a photo, get recipes",
      action: () => {
        setMenuOpen(false);
        navigate("/");
      },
    },
    {
      icon: Sparkles,
      title: "Smart Substitutes",
      desc: "Coming soon — be the first!",
      action: () => {
        setMenuOpen(false);
        toast.info("Smart Substitutes — launching soon.");
      },
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 h-16 sm:h-20 bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[88vw] max-w-sm p-0 flex flex-col overflow-hidden"
            >
              <div className="flex items-center gap-2.5 border-b border-border p-4 shrink-0">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-primary shadow-soft">
                  <img src={logo} alt="" className="h-7 w-7 object-contain" />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="font-display text-xl font-black text-primary">Sizzle</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    AI Chef
                  </span>
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <nav className="p-3">
                  <ul className="space-y-0.5">
                  {items.map((it) => (
                    <li key={it.label}>
                      <button
                        onClick={it.action}
                        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-secondary transition-smooth"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-md bg-secondary text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-smooth">
                          <it.icon className="h-4 w-4" />
                        </span>
                        {it.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

                <div className="px-4 pt-1 pb-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Featured
                </p>
                  <div className="space-y-2">
                  {promos.map((p) => (
                    <button
                      key={p.title}
                      onClick={p.action}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-gradient-primary/10 border border-primary/15 hover:border-primary/40 hover:bg-gradient-primary/15 transition-smooth text-left"
                    >
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-soft shrink-0">
                          <p.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                          <span className="block font-display font-bold text-sm leading-tight">
                          {p.title}
                        </span>
                        <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {p.desc}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              </div>

              <div className="border-t border-border p-3 shrink-0">
                <div className="flex items-center gap-3 rounded-3xl bg-secondary/60 p-3">
                  <span className="grid h-14 w-14 place-items-center rounded-3xl bg-card shadow-soft shrink-0 overflow-hidden">
                    <img src={dakshLogo} alt="Daksh's Studio" className="h-12 w-12 object-contain" />
                  </span>
                  <span className="flex flex-col leading-tight min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      A product of
                    </span>
                    <span className="font-display text-2xl font-black text-foreground tracking-tight truncate">
                      DAKSH'S STUDIO
                    </span>
                  </span>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2.5 min-w-0" aria-label="Sizzle home">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-primary shadow-soft">
              <img src={logo} alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className="flex flex-col leading-none min-w-0">
              <span className="font-display text-base sm:text-xl font-black text-primary truncate">
                Sizzle
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                AI Chef
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-6">
            <Button variant="ghost" size="sm" onClick={onSurprise} disabled={loadingRandom}>
              <Shuffle className="h-4 w-4" /> Surprise me
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <NotificationsPanel />
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
            className="p-2 sm:p-2.5 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
          <UserMenu />
        </div>
      </header>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <UploadRecipeDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <SizzleLensDialog open={flavorLensOpen} onOpenChange={setSizzleLensOpen} />
    </>
  );
};

export default Header;
