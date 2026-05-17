import { ChangeEvent, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Loader2, ScanLine, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ScanResult = {
  dishName: string;
  confidence: number;
  cuisine: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingNote: string;
  visibleIngredients: string[];
  notes: string[];
};

export default function SizzleLensDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setImageDataUrl(null);
    setResult(null);
    setLoading(false);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo is too large. Use an image under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const scan = async () => {
    if (!imageDataUrl) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("recipe-intel", {
        body: { mode: "scanFood", imageDataUrl },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as ScanResult);
    } catch (error: any) {
      toast.error(error?.message ?? "SizzleLens couldn't scan that photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { onOpenChange(value); if (!value) reset(); }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <ScanLine className="h-5 w-5 text-primary" /> SizzleLens
          </DialogTitle>
          <DialogDescription>Scan food with AI for a real dish and nutrition estimate.</DialogDescription>
        </DialogHeader>

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />

        {imageDataUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
            <img src={imageDataUrl} alt="Food to scan" className="h-56 w-full object-cover" />
            <button type="button" onClick={reset} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-soft" aria-label="Remove photo">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => cameraRef.current?.click()} className="rounded-2xl border border-border bg-card p-4 text-left transition-smooth hover:border-primary">
              <Camera className="mb-3 h-5 w-5 text-primary" />
              <p className="font-display font-bold">Take photo</p>
              <p className="text-xs text-muted-foreground">Scan plate</p>
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-2xl border border-border bg-card p-4 text-left transition-smooth hover:border-primary">
              <ImageIcon className="mb-3 h-5 w-5 text-primary" />
              <p className="font-display font-bold">Upload photo</p>
              <p className="text-xs text-muted-foreground">From gallery</p>
            </button>
          </div>
        )}

        {imageDataUrl && !result && (
          <Button onClick={scan} disabled={loading} className="w-full rounded-full bg-gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            Scan with SizzleLens
          </Button>
        )}

        {result && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">{Math.round(result.confidence * 100)}% confidence</p>
              <h3 className="mt-1 font-display text-2xl font-black">{result.dishName}</h3>
              <p className="text-sm text-muted-foreground">{result.cuisine} · {result.servingNote}</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[['kcal', result.calories], ['Protein', `${result.protein}g`], ['Carbs', `${result.carbs}g`], ['Fat', `${result.fat}g`]].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-secondary p-3">
                  <p className="font-display text-lg font-black">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Visible ingredients</p>
              <div className="flex flex-wrap gap-2">
                {result.visibleIngredients.map((item) => <span key={item} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{item}</span>)}
              </div>
            </div>
            {result.notes.length > 0 && (
              <ul className="space-y-1 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                {result.notes.map((note) => <li key={note}>• {note}</li>)}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}