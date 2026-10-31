export type Ingredient = {
  id?: number | string;
  name: string;
  measure?: string | null;
};

export type Cocktail = {
  id: string;
  name: string;
  image?: string | null;
  category?: string | null;
  glass?: string | null;
  instructions?: string | null;
  alcoholic?: string | null;
  ingredients: Ingredient[];
};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

function firstString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }
  return undefined;
}

function normalizeIngredients(raw: unknown): Ingredient[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((item): Ingredient[] => {
      if (typeof item === "string") return [{ name: item }];
      if (!item || typeof item !== "object") return [];
      const obj = item as Record<string, unknown>;
      const name = firstString(obj, ["name", "ingredient", "title"]);
      return name ? [{
        id: typeof obj.id === "string" || typeof obj.id === "number" ? obj.id : undefined,
        name,
        measure: firstString(obj, ["measure", "amount", "quantity", "strMeasure"]),
      }] : [];
    });
  }

  // Supports TheCocktailDB-style strIngredient1/strMeasure1 fields too.
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return Object.entries(obj).flatMap(([key, value]) => {
      if (/ingredient/i.test(key) && typeof value === "string" && value.trim()) {
        const suffix = key.match(/\d+$/)?.[0];
        const measure = suffix ? asString(obj[`strMeasure${suffix}`]) : undefined;
        return [{ name: value, measure }];
      }
      return [];
    });
  }
  return [];
}

export function normalizeCocktail(value: unknown, index = 0): Cocktail | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const idValue = obj.id ?? obj.cocktail_id ?? obj._id ?? obj.idDrink;
  const name = firstString(obj, ["name", "title", "strDrink"]);
  if (!name) return null;

  const ingredientsRaw = obj.ingredients ?? obj.cocktailIngredients ?? obj.ingredientList ?? obj;
  return {
    id: String(idValue ?? `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`),
    name,
    image: firstString(obj, ["image", "imageUrl", "image_url", "thumbnail", "strDrinkThumb", "photo"]),
    category: firstString(obj, ["category", "type", "strCategory"]),
    glass: firstString(obj, ["glass", "glassType", "strGlass"]),
    instructions: firstString(obj, ["instructions", "instruction", "description", "strInstructions"]),
    alcoholic: firstString(obj, ["alcoholic", "alcohol", "isAlcoholic", "strAlcoholic"]),
    ingredients: normalizeIngredients(ingredientsRaw),
  };
}

export function extractCocktails(payload: unknown): Cocktail[] {
  let values: unknown[] = [];
  if (Array.isArray(payload)) values = payload;
  else if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["data", "cocktails", "results", "items", "drinks"]) {
      if (Array.isArray(obj[key])) {
        values = obj[key] as unknown[];
        break;
      }
    }
  }
  return values.map(normalizeCocktail).filter((item): item is Cocktail => item !== null);
}
