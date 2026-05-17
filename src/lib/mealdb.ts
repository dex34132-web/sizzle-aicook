// TheMealDB API helpers — proxied through our server to avoid CORS.
const BASE = "/api/public/mealdb";

export type Meal = {
  idMeal: string;
  strMeal: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strMealThumb: string;
  strYoutube?: string;
  strSource?: string;
  strTags?: string | null;
  [key: string]: string | null | undefined;
};

async function safeJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function mergeCurated(remote: Meal[], curated: Meal[]): Meal[] {
  const seen = new Set(remote.map((m) => m.idMeal));
  return [...curated.filter((m) => !seen.has(m.idMeal)), ...remote];
}

export async function filterByCategory(category: string): Promise<Meal[]> {
  const { getCuratedByCategory } = await import("./curated");
  const curated = getCuratedByCategory(category);
  // Curated-only categories (no remote equivalent on TheMealDB)
  if (category === "Dips & Sauces" || category === "Premade") return curated;
  const data = await safeJson<{ meals: Meal[] | null }>(`${BASE}/filter.php?c=${encodeURIComponent(category)}`);
  return mergeCurated(data?.meals ?? [], curated);
}

export async function filterByArea(area: string): Promise<Meal[]> {
  const { getCuratedByArea } = await import("./curated");
  const curated = getCuratedByArea(area);
  const data = await safeJson<{ meals: Meal[] | null }>(`${BASE}/filter.php?a=${encodeURIComponent(area)}`);
  return mergeCurated(data?.meals ?? [], curated);
}

export async function searchMeals(query: string): Promise<Meal[]> {
  // Typo / case tolerant: normalise, then try the raw query, the cleaned query,
  // and finally the first word as a fallback so partial / messy input still works.
  const raw = query.trim();
  if (!raw) return [];
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const attempts = Array.from(new Set([raw, cleaned, cleaned.split(" ")[0]].filter(Boolean)));
  for (const term of attempts) {
    const data = await safeJson<{ meals: Meal[] | null }>(`${BASE}/search.php?s=${encodeURIComponent(term)}`);
    if (data?.meals?.length) return data.meals;
  }
  // Last resort: try first letter (TheMealDB also supports search by first letter)
  const letter = cleaned[0];
  if (letter && /[a-z]/.test(letter)) {
    const data = await safeJson<{ meals: Meal[] | null }>(`${BASE}/search.php?f=${letter}`);
    const list = data?.meals ?? [];
    const target = cleaned.replace(/ /g, "");
    return list
      .filter((m) => m.strMeal.toLowerCase().replace(/[^a-z0-9]+/g, "").includes(target.slice(0, 4)))
      .slice(0, 24);
  }
  return [];
}

export async function getCuisineMeals(area: string): Promise<Meal[]> {
  const direct = await filterByArea(area);
  if (direct.length > 0) return direct;
  // Fallback for areas TheMealDB v1 doesn't populate (Indian, American, French…)
  const { CUISINE_FALLBACK_QUERIES } = await import("./curated");
  const queries = CUISINE_FALLBACK_QUERIES[area];
  if (!queries) return [];
  const groups = await Promise.all(queries.map((q) => searchMeals(q)));
  const seen = new Set<string>();
  const out: Meal[] = [];
  for (const g of groups) {
    for (const m of g) {
      if (!seen.has(m.idMeal)) { seen.add(m.idMeal); out.push(m); }
    }
  }
  return out;
}

export async function getMealById(id: string): Promise<Meal | null> {
  if (id.startsWith("curated-")) {
    const { getCuratedById } = await import("./curated");
    return getCuratedById(id);
  }
  if (typeof window !== "undefined" && id.startsWith("custom-")) {
    try {
      const saved = localStorage.getItem("cookbuddy:uploaded-recipes");
      const meals = saved ? (JSON.parse(saved) as Meal[]) : [];
      return meals.find((meal) => meal.idMeal === id) ?? null;
    } catch {
      return null;
    }
  }
  const data = await safeJson<{ meals: Meal[] | null }>(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`);
  return data?.meals?.[0] ?? null;
}

export async function getRandomMeal(): Promise<Meal | null> {
  const data = await safeJson<{ meals: Meal[] | null }>(`${BASE}/random.php`);
  return data?.meals?.[0] ?? null;
}

export function getIngredients(meal: Meal): { ingredient: string; measure: string }[] {
  const items: { ingredient: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = (meal[`strIngredient${i}`] as string | undefined)?.trim();
    const measure = (meal[`strMeasure${i}`] as string | undefined)?.trim();
    if (ingredient) items.push({ ingredient, measure: measure || "" });
  }
  return items;
}

export function getYoutubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return m?.[1] ?? null;
}
