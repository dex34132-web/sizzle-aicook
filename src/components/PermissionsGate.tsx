import { useEffect, useRef, useState, type ReactNode } from "react";
import { MapPin, Camera, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

type State = "idle" | "asking" | "granted" | "denied" | "unsupported";

const STORAGE_KEY = "sizzle:perms-asked-v1";

/**
 * PermissionsGate
 *
 * Forces a one-time camera + location prompt on first app load.
 * The browser permission prompt is triggered automatically (so the
 * user can only continue *after* the OS-level "allow" dialog has
 * been shown). The gate disappears once both permissions resolve
 * (granted, denied, or unsupported).
 */
export default function PermissionsGate({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);
  const [geo, setGeo] = useState<State>("idle");
  const [cam, setCam] = useState<State>("idle");
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    setShow(true);
  }, []);

  // Capability detection (does NOT trigger prompts — that requires a user gesture).
  useEffect(() => {
    if (!show || startedRef.current) return;
    startedRef.current = true;
    if (!navigator.mediaDevices?.getUserMedia) setCam("unsupported");
    if (!("geolocation" in navigator)) setGeo("unsupported");
  }, [show]);

  // Both must be triggered from a real click handler — iOS/Safari and most
  // browsers will silently reject getUserMedia/geolocation without a gesture.
  const requestCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setCam("unsupported"); return; }
    setCam("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCam("granted");
    } catch {
      setCam("denied");
      toast.error("Camera blocked. Enable it in your browser settings.");
    }
  };

  const requestLocation = () => {
    if (!("geolocation" in navigator)) { setGeo("unsupported"); return; }
    setGeo("asking");
    navigator.geolocation.getCurrentPosition(
      () => setGeo("granted"),
      () => {
        setGeo("denied");
        toast.error("Location blocked. Enable it in your browser settings.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const allowAll = async () => {
    await requestCamera();
    requestLocation();
  };

  // Once both have settled, allow the app through.
  useEffect(() => {
    if (!show) return;
    const settled = (s: State) => s === "granted" || s === "denied" || s === "unsupported";
    if (settled(geo) && settled(cam)) {
      const t = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, "1");
        setShow(false);
        if (geo === "granted" && cam === "granted") {
          toast.success("All set! Sizzle is ready 🍳");
        } else {
          toast.message("Some features need permissions later.");
        }
      }, 600);
      return () => clearTimeout(t);
    }
  }, [geo, cam, show]);

  if (!show) return <>{children}</>;

  return (
    <>
      {children}
      <div
        className="fixed inset-0 z-[100] grid place-items-center bg-background/95 p-6 backdrop-blur-xl animate-in fade-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-glow">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-primary">
            Quick setup
          </p>
          <h2 className="mt-2 text-center font-display text-2xl font-black">
            Sizzle needs permissions
          </h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Tap <strong>Allow access</strong> below — your browser will then ask
            for camera & location. Tap <strong>Allow</strong> on each.
          </p>
          <div className="mt-5 space-y-3">
            <PermRow
              icon={<Camera className="h-5 w-5" />}
              label="Camera"
              hint="To scan dishes & your fridge"
              state={cam}
              onRetry={requestCamera}
            />
            <PermRow
              icon={<MapPin className="h-5 w-5" />}
              label="Location"
              hint="To find nearby grocery stores"
              state={geo}
              onRetry={requestLocation}
            />
          </div>
          <button
            onClick={allowAll}
            className="mt-5 w-full rounded-full bg-gradient-primary py-3 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-soft hover:shadow-glow"
          >
            Allow access
          </button>
          <button
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, "1");
              setShow(false);
            }}
            className="mt-3 w-full rounded-full border border-border py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-secondary"
          >
            Skip for now
          </button>
        </div>
      </div>
    </>
  );
}

function PermRow({
  icon,
  label,
  hint,
  state,
  onRetry,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  state: State;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="shrink-0">
        {state === "asking" || state === "idle" ? (
          <span className="flex items-center gap-1 text-xs font-bold text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Asking…
          </span>
        ) : state === "granted" ? (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
            <Check className="h-3.5 w-3.5" /> Allowed
          </span>
        ) : state === "denied" ? (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
          >
            <X className="h-3.5 w-3.5" /> Blocked · Retry
          </button>
        ) : (
          <span className="text-xs font-bold text-muted-foreground">N/A</span>
        )}
      </div>
    </div>
  );
}
