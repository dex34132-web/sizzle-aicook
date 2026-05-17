import { useState } from "react";
import { LogOut, User as UserIcon, Pencil } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export default function UserMenu() {
  const { displayName, avatarUrl, signOut, setDisplayName } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName ?? "");

  const initial = (displayName?.[0] ?? "S").toUpperCase();

  const trigger = avatarUrl ? (
    <button
      aria-label="Profile"
      className="grid h-9 w-9 place-items-center overflow-hidden rounded-full ring-2 ring-background hover:scale-105 transition-transform"
    >
      <img src={avatarUrl} alt={displayName ?? "User"} className="h-full w-full object-cover" />
    </button>
  ) : (
    <button
      aria-label="Profile"
      className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-black text-primary-foreground shadow-soft ring-2 ring-background hover:scale-105 transition-transform"
    >
      {initial}
    </button>
  );

  const save = () => {
    if (!draft.trim()) return;
    setDisplayName(draft.trim());
    setEditing(false);
    toast.success("Name updated");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-sm font-black text-primary-foreground">
              {initial}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{displayName ?? "Chef"}</p>
            <p className="truncate text-[11px] text-muted-foreground">Welcome back 👋</p>
          </div>
        </div>

        {editing ? (
          <div className="mt-3 space-y-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Your name"
              maxLength={30}
            />
            <div className="flex gap-2">
              <button
                onClick={save}
                className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 rounded-lg border border-border py-2 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            <button
              onClick={() => {
                setDraft(displayName ?? "");
                setEditing(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary"
            >
              <Pencil className="h-4 w-4" /> Change name
            </button>
            <button
              onClick={async () => {
                await signOut();
                toast.success("Profile cleared");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Reset profile
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
