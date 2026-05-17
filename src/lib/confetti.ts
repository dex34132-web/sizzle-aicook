// Tiny dependency-free emoji confetti — used for step-complete celebrations and easter eggs.
const EMOJIS = ["🎉", "✨", "🍅", "🌶️", "🧀", "🍳", "🥑", "🍕", "🌽", "🍋", "🥕"];

export function burstConfetti(count = 60) {
  if (typeof document === "undefined") return;
  const root = document.createElement("div");
  root.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden;";
  document.body.appendChild(root);

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const left = Math.random() * 100;
    const dur = 1400 + Math.random() * 1800;
    const size = 18 + Math.random() * 26;
    const rot = Math.random() * 720 - 360;
    el.style.cssText = `
      position:absolute;
      left:${left}vw;
      top:-40px;
      font-size:${size}px;
      transform:rotate(${rot}deg);
      animation:sizzleConfettiFall ${dur}ms cubic-bezier(.4,.6,.4,1) forwards;
      animation-delay:${Math.random() * 400}ms;
      will-change:transform,opacity;
    `;
    root.appendChild(el);
  }

  if (!document.getElementById("sizzle-confetti-style")) {
    const s = document.createElement("style");
    s.id = "sizzle-confetti-style";
    s.textContent = `@keyframes sizzleConfettiFall{
      0%{transform:translateY(-10vh) rotate(0);opacity:1}
      100%{transform:translateY(110vh) rotate(720deg);opacity:0}
    }`;
    document.head.appendChild(s);
  }

  setTimeout(() => root.remove(), 4000);
}

// Simple Konami easter egg: ↑ ↑ ↓ ↓
export function installKonamiEasterEgg(onTrigger: () => void) {
  if (typeof window === "undefined") return () => {};
  // Simpler: just ↑ ↑ — much easier to discover
  const seq = ["ArrowUp", "ArrowUp"];
  let i = 0;
  const handler = (e: KeyboardEvent) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === seq[i]) {
      i++;
      if (i === seq.length) {
        i = 0;
        onTrigger();
      }
    } else {
      i = k === seq[0] ? 1 : 0;
    }
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}

/**
 * Stable non-negative numeric hash from any string.
 * Used to derive pseudo-stats (rating, cook time, kcal) for recipes
 * whose id is not numeric (e.g. "curated-butter-chicken") so we never
 * end up with NaN on the recipe card / page.
 */
export function stableHash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = (h * 33) ^ input.charCodeAt(i);
  return Math.abs(h | 0);
}

/**
 * Tap-N-times-to-trigger helper. Returns a tap handler. Resets if
 * the user pauses for more than `windowMs` between taps.
 */
export function makeTapTrigger(times: number, onTrigger: () => void, windowMs = 1500) {
  let count = 0;
  let timer: number | null = null;
  return () => {
    count++;
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => { count = 0; }, windowMs);
    if (count >= times) {
      count = 0;
      if (timer) window.clearTimeout(timer);
      onTrigger();
    }
  };
}
