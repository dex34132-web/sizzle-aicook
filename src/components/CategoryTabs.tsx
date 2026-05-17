import { cn } from "@/lib/utils";

interface Props {
  categories: string[];
  active: string;
  onChange: (c: string) => void;
}

const CategoryTabs = ({ categories, active, onChange }: Props) => (
  <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <div className="flex w-max gap-2">
      {categories.map((c) => {
        const isActive = c === active;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition-smooth",
              isActive
                ? "border-transparent bg-gradient-primary text-primary-foreground shadow-soft"
                : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-primary"
            )}
          >
            {c}
          </button>
        );
      })}
    </div>
  </div>
);

export default CategoryTabs;
