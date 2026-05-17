import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  icon: typeof Bell;
  title: string;
  body: string;
  tone: string;
};

export default function NotificationsPanel() {
  // Real notifications only — start empty. Do NOT seed fake ones.
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const hasUnread = notifications.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary sm:p-2.5"
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(22rem,calc(100vw-1.5rem))] max-h-[70vh] overflow-hidden rounded-xl border-border p-0 shadow-glow"
      >
        <div className="border-b border-border px-4 py-3">
          <p className="font-display text-lg font-black">Notifications</p>
          <p className="text-xs text-muted-foreground">Kitchen updates and reminders</p>
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary mb-3">
              <BellOff className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-semibold">You're all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You will find your notifications here.
            </p>
          </div>
        ) : (
          <>
            <div className="max-h-[50vh] overflow-y-auto divide-y divide-border">
              {notifications.map((item) => (
                <div key={item.id} className="flex gap-3 px-4 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary">
                    <item.icon className={`h-4 w-4 ${item.tone}`} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {item.body}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-lg"
                onClick={() => setNotifications([])}
              >
                <CheckCircle2 className="h-4 w-4" /> Mark all read
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
