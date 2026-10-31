import { Cocktail, extractCocktails, normalizeCocktail } from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_COCKTAILS_API_URL || "https://cocktails.solvro.pl").replace(/\/$/, "");

async function request(path: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  return response.json();
}

/**
 * API route names can differ between API versions. The default is /cocktails;
 * set NEXT_PUBLIC_COCKTAILS_API_URL if your environment uses another base URL.
 */
export async function getCocktails(): Promise<Cocktail[]> {
  const paths = ["/cocktails", "/api/cocktails"];
  let lastError: unknown;

  for (const path of paths) {
    try {
      const payload = await request(path);
      const cocktails = extractCocktails(payload);
      if (cocktails.length) return cocktails;
      lastError = new Error("The API response did not contain a cocktail list.");
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not load cocktails. Please try again.");
}

export async function getCocktail(id: string): Promise<Cocktail | undefined> {
  try {
    const payload = await request(`/cocktails/${encodeURIComponent(id)}`);
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const obj = payload as Record<string, unknown>;
      return normalizeCocktail(obj.data ?? obj.cocktail ?? payload);
    }
    return normalizeCocktail(payload);
  } catch {
    return undefined;
  }
}
