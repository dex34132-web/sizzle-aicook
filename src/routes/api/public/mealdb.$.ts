import { createFileRoute } from "@tanstack/react-router";

const UPSTREAM = "https://www.themealdb.com/api/json/v1/1";

async function proxy(request: Request) {
  const url = new URL(request.url);
  // Path after /api/public/mealdb/  e.g. "search.php"
  const subPath = url.pathname.replace(/^\/api\/public\/mealdb\/?/, "");
  const target = `${UPSTREAM}/${subPath}${url.search}`;

  try {
    const upstream = await fetch(target, {
      headers: { Accept: "application/json" },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ meals: null, error: String(err) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const Route = createFileRoute("/api/public/mealdb/$")({
  server: {
    handlers: {
      GET: ({ request }) => proxy(request),
    },
  },
});
