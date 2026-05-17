import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight } from "lucide-react";
import waterBg from "@/assets/water-bg.jpg";
import { useAuth } from "./AuthProvider";

export default function NameGate({ onDone }: { onDone: () => void }) {
  const { setDisplayName } = useAuth();
  const [name, setName] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
    onDone();
  };

  return (
    <div className="auth-water-bg relative min-h-screen overflow-hidden text-white">
      <img src={waterBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/25 via-teal-900/45 to-slate-950/85" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] sm:p-8"
        >
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
            <Sparkles className="h-3.5 w-3.5" /> Let's get personal
          </div>
          <h1 className="mt-4 text-center font-display text-3xl font-black">
            What should I call you?
          </h1>
          <p className="mt-2 text-center text-sm text-white/70">
            We'll use this name throughout your kitchen journey.
          </p>

          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="Your name"
            className="mt-6 w-full rounded-lg border border-white/20 bg-white/10 px-5 py-4 text-center text-lg font-semibold text-white placeholder:text-white/40 outline-none focus:border-white/50"
          />

          <button
            type="submit"
            disabled={!name.trim()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[hsl(var(--brand-pink))] via-[hsl(var(--brand-orange))] to-[hsl(var(--brand-green))] py-4 font-bold text-white shadow-glow transition-all disabled:opacity-50"
          >
            Continue <ArrowRight className="h-5 w-5" />
          </button>
        </motion.form>
      </div>
    </div>
  );
}
