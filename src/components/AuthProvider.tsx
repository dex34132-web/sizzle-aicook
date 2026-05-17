import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/**
 * Local-only auth: name + dietary/cuisine preferences live in localStorage.
 * No login/signup pages — user just enters a name on first launch.
 * (The Supabase user/session API was removed because the user wants the app
 *  to work offline / in APK / without any auth provider.)
 */

export interface UserPreferences {
  cuisines: string[];
  diet: string[];
}

interface AuthCtx {
  // Backwards-compat shims so existing call sites don't break:
  user: null;
  session: null;
  isGuest: boolean;
  loading: boolean;
  // Actual API:
  displayName: string | null;
  avatarUrl: string | null;
  preferences: UserPreferences;
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setPreferences: (p: UserPreferences) => void;
  signOut: () => Promise<void>;
}

const NAME_KEY = "cookbuddy:displayName";
const AVATAR_KEY = "cookbuddy:avatarUrl";
const PREFS_KEY = "cookbuddy:preferences";

const DEFAULT_PREFS: UserPreferences = { cuisines: [], diet: [] };

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  isGuest: true,
  loading: false,
  displayName: null,
  avatarUrl: null,
  preferences: DEFAULT_PREFS,
  setDisplayName: () => {},
  setAvatarUrl: () => {},
  setPreferences: () => {},
  signOut: async () => {},
});
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null);
  const [preferences, setPreferencesState] = useState<UserPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const n = localStorage.getItem(NAME_KEY);
      if (n) setDisplayNameState(n);
      const a = localStorage.getItem(AVATAR_KEY);
      if (a) setAvatarUrlState(a);
      const p = localStorage.getItem(PREFS_KEY);
      if (p) setPreferencesState({ ...DEFAULT_PREFS, ...JSON.parse(p) });
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const setDisplayName = (name: string) => {
    localStorage.setItem(NAME_KEY, name);
    setDisplayNameState(name);
  };

  const setAvatarUrl = (url: string | null) => {
    if (url) localStorage.setItem(AVATAR_KEY, url);
    else localStorage.removeItem(AVATAR_KEY);
    setAvatarUrlState(url);
  };

  const setPreferences = (p: UserPreferences) => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    setPreferencesState(p);
  };

  const signOut = async () => {
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(AVATAR_KEY);
    localStorage.removeItem(PREFS_KEY);
    setDisplayNameState(null);
    setAvatarUrlState(null);
    setPreferencesState(DEFAULT_PREFS);
  };

  return (
    <Ctx.Provider
      value={{
        user: null,
        session: null,
        isGuest: true,
        loading,
        displayName,
        avatarUrl,
        preferences,
        setDisplayName,
        setAvatarUrl,
        setPreferences,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
