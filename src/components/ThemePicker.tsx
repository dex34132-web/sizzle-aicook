import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import waterBg from "@/assets/water-bg.jpg";
import lightPreview from "@/assets/theme-light-preview.jpg";
import darkPreview from "@/assets/theme-dark-preview.jpg";

export default function ThemePicker() {
  const { theme, setTheme, hasChosen } = useTheme();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<"light" | "dark">(theme);

  useEffect(() => {
    if (!hasChosen) {
      const t = setTimeout(() => setOpen(true), 250);
      return () => clearTimeout(t);
    }
  }, [hasChosen]);

  const confirm = () => {
    setTheme(pick);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="auth-water-bg overflow-hidden rounded-xl border-white/20 p-0 text-white sm:max-w-lg"
        style={{
          backgroundImage: `linear-gradient(180deg, hsl(190 60% 25% / 0.68), hsl(220 50% 10% / 0.92)), url(${waterBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="p-6">
          <DialogTitle className="font-display text-2xl flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-[hsl(var(--brand-orange))]" /> Welcome to Sizzle
          </DialogTitle>
          <DialogDescription className="text-white/75">
            Pick a theme to get started — you can change this anytime.
          </DialogDescription>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {(
              [
                { v: "light", label: "Light", icon: Sun, img: lightPreview },
                { v: "dark", label: "Dark", icon: Moon, img: darkPreview },
              ] as const
            ).map((o) => {
              const active = pick === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setPick(o.v)}
                  className={cn(
                    "group relative overflow-hidden rounded-lg border-2 bg-white/5 transition-all",
                    active
                      ? "border-white scale-[1.02] shadow-[0_20px_60px_-15px_rgba(255,255,255,0.4)]"
                      : "border-white/20 opacity-80 hover:opacity-100 hover:border-white/40",
                  )}
                >
                  <div className="aspect-[3/4] w-full overflow-hidden">
                    <img
                      src={o.img}
                      alt={`${o.label} theme preview`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                    <o.icon className="h-5 w-5 text-white" />
                    <span className="font-display text-lg font-black text-white">{o.label}</span>
                  </div>
                  {active && (
                    <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-900">
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={confirm}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-[hsl(var(--brand-pink))] via-[hsl(var(--brand-orange))] to-[hsl(var(--brand-green))] py-3.5 font-display text-base font-black text-white shadow-glow"
          >
            Let's Cook 🍳
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
