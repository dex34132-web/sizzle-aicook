import { useEffect, useState } from "react";
import { MapPin, Camera, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type PermState = "unknown" | "prompt" | "granted" | "denied" | "unsupported";

const STORAGE_KEY = "cookbuddy:permsDismissed";

async function queryPerm(name: PermissionName): Promise<PermState> {
  if (typeof navigator === "undefined") return "unsupported";
  if (!("permissions" in navigator)) return "unknown";
  try {
    const res = await navigator.permissions.query({ name } as PermissionDescriptor);
    return res.state as PermState;
  } catch (e) {
    console.warn("[perms] query failed for", name, e);
    return "unknown";
  }
}

export default function PermissionsBanner() {
  const [geo, setGeo] = useState<PermState>("unknown");
  const [cam, setCam] = useState<PermState>("unknown");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    queryPerm("geolocation").then(setGeo);
    queryPerm("camera" as PermissionName).then(setCam);
  }, []);

  const askLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported on this device.");
      setGeo("unsupported");
      return;
    }
    console.log("[perms] requesting geolocation");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("[perms] geolocation granted", pos.coords);
        setGeo("granted");
        toast.success("Location enabled — shopping list will work.");
      },
      (err) => {
        console.error("[perms] geolocation error", err);
        setGeo(err.code === err.PERMISSION_DENIED ? "denied" : "prompt");
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location blocked. Enable it in your browser settings."
            : "Couldn't get location.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const askCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera not supported on this device.");
      setCam("unsupported");
      return;
    }
    console.log("[perms] requesting camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCam("granted");
      toast.success("Camera enabled — fridge scan ready.");
    } catch (err) {
      console.error("[perms] camera error", err);
      setCam("denied");
      toast.error("Camera blocked. Enable it in your browser settings.");
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  const needsGeo = geo === "prompt" || geo === "unknown" || geo === "denied";
  const needsCam = cam === "prompt" || cam === "unknown" || cam === "denied";
  if (dismissed || (!needsGeo && !needsCam)) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-2xl border border-border bg-card/95 p-4 shadow-glow backdrop-blur sm:inset-x-auto sm:right-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Enable permissions
        </p>
        <button
          onClick={dismiss}
          className="-mr-1 -mt-1 rounded-full p-1 text-muted-foreground hover:bg-secondary"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Sizzle needs these to power shopping lists & fridge scanning.
      </p>
      <div className="mt-3 grid gap-2">
        {needsGeo && (
          <button
            onClick={askLocation}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm hover:border-primary"
          >
            <span className="flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4 text-primary" /> Location
            </span>
            {geo === "denied" ? (
              <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                <AlertTriangle className="h-3 w-3" /> Blocked
              </span>
            ) : (
              <span className="text-xs font-bold text-primary">Allow</span>
            )}
          </button>
        )}
        {needsCam && (
          <button
            onClick={askCamera}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm hover:border-primary"
          >
            <span className="flex items-center gap-2 font-semibold">
              <Camera className="h-4 w-4 text-primary" /> Camera
            </span>
            {cam === "denied" ? (
              <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                <AlertTriangle className="h-3 w-3" /> Blocked
              </span>
            ) : (
              <span className="text-xs font-bold text-primary">Allow</span>
            )}
          </button>
        )}
      </div>
      {(geo === "denied" || cam === "denied") && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          If you previously denied, you'll need to enable the permission from your browser's
          site-settings menu (lock icon in the address bar).
        </p>
      )}
    </div>
  );
}