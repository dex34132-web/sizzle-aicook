import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { Meal } from "@/lib/mealdb";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const readImage = (file: File, onDone: (url: string) => void) => {
  if (file.size > 2.5 * 1024 * 1024) {
    toast.error("Thumbnail is too large. Use an image under 2.5 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onDone(reader.result as string);
  reader.readAsDataURL(file);
};

export default function UploadRecipeDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setThumbnail(null);
    setTitle("");
    setArea("");
    setCategory("");
    setIngredients("");
    setInstructions("");
    setSaving(false);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readImage(file, setThumbnail);
    event.target.value = "";
  };

  const saveRecipe = (event: FormEvent) => {
    event.preventDefault();
    if (!thumbnail) {
      toast.error("Add a thumbnail before uploading the recipe.");
      return;
    }
    if (!title.trim() || !ingredients.trim() || !instructions.trim()) {
      toast.error("Recipe name, ingredients, and instructions are required.");
      return;
    }

    setSaving(true);
    const rows = ingredients.split("\n").map((row) => row.trim()).filter(Boolean).slice(0, 20);
    const meal: Meal = {
      idMeal: `custom-${Date.now()}`,
      strMeal: title.trim(),
      strMealThumb: thumbnail,
      strArea: area.trim() || "Homemade",
      strCategory: category.trim() || "Custom",
      strInstructions: instructions.trim(),
      strYoutube: "",
    };
    rows.forEach((row, index) => {
      const [name, ...measureParts] = row.split("-");
      meal[`strIngredient${index + 1}`] = name.trim();
      meal[`strMeasure${index + 1}`] = measureParts.join("-").trim();
    });

    const saved = localStorage.getItem("cookbuddy:uploaded-recipes");
    const existing = saved ? (JSON.parse(saved) as Meal[]) : [];
    localStorage.setItem("cookbuddy:uploaded-recipes", JSON.stringify([meal, ...existing].slice(0, 20)));
    toast.success("Recipe uploaded.");
    onOpenChange(false);
    reset();
    navigate(`/recipe/${meal.idMeal}`);
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { onOpenChange(value); if (!value) reset(); }}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Upload Recipe</DialogTitle>
          <DialogDescription>Add a thumbnail first, then save your own recipe page.</DialogDescription>
        </DialogHeader>

        <form onSubmit={saveRecipe} className="space-y-4">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />

          {thumbnail ? (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
              <img src={thumbnail} alt="Recipe thumbnail" className="h-44 w-full object-cover" />
              <button type="button" onClick={() => setThumbnail(null)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-soft" aria-label="Remove thumbnail">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => cameraRef.current?.click()} className="rounded-2xl border border-border bg-card p-4 text-left transition-smooth hover:border-primary">
                <Camera className="mb-3 h-5 w-5 text-primary" />
                <p className="font-display font-bold">Take photo</p>
                <p className="text-xs text-muted-foreground">Use as thumbnail</p>
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-2xl border border-border bg-card p-4 text-left transition-smooth hover:border-primary">
                <ImageIcon className="mb-3 h-5 w-5 text-primary" />
                <p className="font-display font-bold">Upload image</p>
                <p className="text-xs text-muted-foreground">Required first</p>
              </button>
            </div>
          )}

          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Recipe name" maxLength={70} />
          <div className="grid grid-cols-2 gap-3">
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Cuisine" maxLength={32} />
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" maxLength={32} />
          </div>
          <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={5} placeholder={"Ingredients, one per line\nPasta - 200g\nCream - 1 cup"} className="w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={6} placeholder="Instructions" className="w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/20" />

          <Button type="submit" disabled={saving} className="w-full rounded-full bg-gradient-primary text-primary-foreground">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Create recipe page
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}