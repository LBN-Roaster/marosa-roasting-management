import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialRecipes, type Recipe } from "~/lib/recipes";

type RecipeContextValue = {
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, "id" | "roastCount">) => Recipe;
  updateRecipe: (id: string, recipe: Omit<Recipe, "id" | "roastCount">) => void;
  deleteRecipes: (ids: string[]) => void;
};

const RecipeContext = createContext<RecipeContextValue | null>(null);
const storageKey = "marosa-recipes";

function makeId(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug || "recipe"}-${Date.now().toString(36)}`;
}

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setRecipes(JSON.parse(saved) as Recipe[]);
    } catch {
      // Keep the bundled demo data if local storage is unavailable or invalid.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, JSON.stringify(recipes));
  }, [ready, recipes]);

  const value = useMemo<RecipeContextValue>(
    () => ({
      recipes,
      addRecipe(recipe) {
        const created = { ...recipe, id: makeId(recipe.name), roastCount: 0 };
        setRecipes((current) => [...current, created]);
        return created;
      },
      updateRecipe(id, recipe) {
        setRecipes((current) =>
          current.map((item) =>
            item.id === id ? { ...item, ...recipe } : item,
          ),
        );
      },
      deleteRecipes(ids) {
        setRecipes((current) => current.filter((item) => !ids.includes(item.id)));
      },
    }),
    [recipes],
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (!context) throw new Error("useRecipes must be used within RecipeProvider");
  return context;
}
