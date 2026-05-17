import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "@/pages/Index";
import RecipePage from "@/pages/RecipePage";
import SavedPage from "@/pages/SavedPage";
import PlannerPage from "@/pages/PlannerPage";
import NotFound from "@/pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemePicker from "@/components/ThemePicker";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import OnboardingFlow from "@/components/OnboardingFlow";
import PermissionsBanner from "@/components/PermissionsBanner";
import PermissionsGate from "@/components/PermissionsGate";
import { useState, useEffect } from "react";
import { burstConfetti, installKonamiEasterEgg } from "@/lib/confetti";
import CookingFunFacts from "@/components/CookingFunFacts";
import BackgroundMusic from "@/components/BackgroundMusic";
import { toast } from "sonner";

const queryClient = new QueryClient();

function Gate({ children }: { children: ReactNode }) {
  const { displayName, loading } = useAuth();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (displayName) setDone(true);
  }, [displayName]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0a0a0a] text-white/60 text-sm font-medium animate-pulse">
        Loading Sizzle…
      </div>
    );
  }
  if (!displayName && !done) return <OnboardingFlow onDone={() => setDone(true)} />;
  return <>{children}</>;
}

export default function CookBuddyApp() {
  useEffect(() => {
    return installKonamiEasterEgg(() => {
      burstConfetti(120);
      toast.success("🎮 Konami unlocked: SIZZLE MODE 🔥");
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Gate>
              <PermissionsGate>
                <ThemePicker />
                <PermissionsBanner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/recipe/:id" element={<RecipePage />} />
                    <Route path="/saved" element={<SavedPage />} />
                    <Route path="/planner" element={<PlannerPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <CookingFunFacts />
                </BrowserRouter>
                <BackgroundMusic />
              </PermissionsGate>
            </Gate>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
