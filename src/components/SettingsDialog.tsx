import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Trash2, SlidersHorizontal, Languages, Music, VolumeX } from "lucide-react";
import { useSaved } from "@/hooks/useSaved";
import { useTheme } from "./ThemeProvider";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const LANG_KEY = "cookbuddy:lang";
const MUSIC_KEY = "sizzle:music-muted";
const LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: Props) => {
  const { ids, clearAll } = useSaved();
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  const [lang, setLang] = useState("en");
  const [musicOn, setMusicOn] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved) setLang(saved);
    setMusicOn(localStorage.getItem(MUSIC_KEY) !== "1");
  }, []);

  const toggleMusic = (on: boolean) => {
    setMusicOn(on);
    const muted = !on;
    localStorage.setItem(MUSIC_KEY, muted ? "1" : "0");
    window.dispatchEvent(
      new CustomEvent("sizzle:music-toggle", { detail: { muted } }),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,26rem)] rounded-xl p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-primary">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            Settings
          </DialogTitle>
          <DialogDescription>Customize your Sizzle experience.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 py-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/35 p-3">
            <div className="flex items-center gap-3">
              {dark ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <div>
                <Label htmlFor="dark-mode" className="text-base">
                  Dark mode
                </Label>
                <p className="text-xs text-muted-foreground">Switch theme instantly.</p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={dark}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/35 p-3">
            <div className="flex items-center gap-3">
              {musicOn ? (
                <Music className="h-5 w-5 text-primary" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="bg-music" className="text-base">
                  Background music
                </Label>
                <p className="text-xs text-muted-foreground">
                  Subtle lofi loop while you cook.
                </p>
              </div>
            </div>
            <Switch
              id="bg-music"
              checked={musicOn}
              onCheckedChange={toggleMusic}
            />
          </div>

          <div className="rounded-lg border border-border bg-secondary/35 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-medium">Saved recipes</p>
                <p className="text-xs text-muted-foreground">
                  {ids.length} recipe{ids.length === 1 ? "" : "s"} saved.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={ids.length === 0}
                onClick={() => {
                  clearAll();
                  toast.success("Saved recipes cleared");
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/35 p-3">
            <div className="flex items-center gap-3 mb-2">
              <Languages className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-base">Recipe language</Label>
                <p className="text-xs text-muted-foreground">
                  Used for video captions and recipe text.
                </p>
              </div>
            </div>
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.target.value);
                localStorage.setItem(LANG_KEY, e.target.value);
                toast.success("Language saved");
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Powered by TheMealDB & Lovable AI · A product of{" "}
            <span className="font-semibold text-foreground">Daksh's Studio</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
